"use client"
import { useAccount } from "wagmi"
import { Explainer } from "@/components/app/explain"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useOverview, useEscrows } from "@/lib/bitregalo/hooks"
import { useSettlementTokens } from "@/lib/bitregalo/instances"
import { Card, Addr, Pill, LedgerRow, Amount, PageHead, Empty, RowsSkeleton, timeLeft } from "@/components/app/ui"

/** The state of an escrow in a word, and the tone it is said in. */
const PILL: Record<number, { word: string; tone: "accent" | "good" | "muted" }> = {
  1: { word: "Held", tone: "accent" },
  2: { word: "Released", tone: "good" },
  3: { word: "Handed back", tone: "muted" },
  4: { word: "Returned", tone: "muted" },
}

export default function EscrowsPage() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { address } = useAccount()
  const ov = useOverview()
  const count = ov.data?.[2]?.result as bigint | undefined
  const escrows = useEscrows(count)
  const tokens = useSettlementTokens(t.instance, t.id)
  const me = address?.toLowerCase()
  const loading = count === undefined || escrows.isLoading
  const shown = escrows.data.filter(Boolean).length
  const total = count !== undefined ? Number(count) : 0
  const who = (a: string) => (me && a.toLowerCase() === me ? <span className="font-[560] text-foreground">you</span> : <span className="whitespace-nowrap"><Addr a={a} /></span>)
  /** What happens to the money next, in a few words. */
  const next = (state: number, expiresAt: bigint) => {
    if (state === 1) return timeLeft(expiresAt) === "elapsed" ? "past its deadline, goes back to the buyer" : `returns to the buyer in ${timeLeft(expiresAt)} unless released`
    if (state === 2) return "released to the supplier"
    if (state === 3) return "handed back to the buyer"
    return "returned to the buyer at the deadline"
  }

  return (
    <div className="space-y-8">
      <PageHead title="Escrows" intro="Money this workspace's vault is holding, or has held, until work was delivered. Open one to see who can move it and when." />
      <Explainer id="escrows" title="What is an escrow?">
        <p>Money held safely by the workspace vault while work is done. It ends in one of three ways: the <b>buyer releases</b> it to the supplier, the <b>supplier hands it back</b>, or the <b>deadline passes</b> and it returns to the buyer.</p>
        <p>No person holds the money: not BitRegalo, not the workspace admin. An escrow opens when a request or a listing is paid by escrow.</p>
      </Explainer>

      <Card flush title={total > 0 ? `All escrows (${total})` : "All escrows"} description={total > shown && shown > 0 ? `Showing the newest ${shown}.` : undefined}>
        {loading && <RowsSkeleton rows={3} />}
        {!loading && shown === 0 && (
          <Empty title="No escrows yet" body="One opens when someone chooses an offer on a request, or takes a listing, that is paid by escrow." />
        )}
        {!loading && escrows.data.map((e, i) => {
          if (!e) return null
          const id = String(escrows.ids[i])
          const tk = tokens.all.find((x) => x.address.toLowerCase() === e.token.toLowerCase())
          const pill = PILL[e.state] ?? { word: "—", tone: "muted" as const }
          return (
            <LedgerRow
              key={id}
              href={`${base}/escrows/${id}`}
              lead={`#${id}`}
              title={`Escrow #${id}`}
              meta={<>From {who(e.issuer)} to {who(e.receiver)} · {next(e.state, e.expiresAt)}</>}
              amount={<Amount value={e.amount} decimals={tk?.decimals ?? 18} symbol={tk?.symbol ?? ""} />}
              status={<Pill tone={pill.tone}>{pill.word}</Pill>}
            />
          )
        })}
      </Card>
    </div>
  )
}
