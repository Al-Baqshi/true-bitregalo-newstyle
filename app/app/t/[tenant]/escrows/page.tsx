"use client"
import Link from "next/link"
import { useAccount } from "wagmi"
import { Explainer } from "@/components/app/explain"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useOverview, useEscrows } from "@/lib/bitregalo/hooks"
import { useSettlementTokens } from "@/lib/bitregalo/instances"
import { Card, Addr, Pill, LedgerRow, Amount, PageHead, Empty, RowsSkeleton, timeLeft } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

/** The state of an escrow in a word, and the tone it is said in. */
const PILL: Record<number, { word: string; tone: "accent" | "good" | "muted" }> = {
  1: { word: "Held", tone: "accent" },
  2: { word: "Released", tone: "good" },
  3: { word: "Handed back", tone: "muted" },
  4: { word: "Returned", tone: "muted" },
}

export default function EscrowsPage() {
  const t = useTenant()
  const base = t.base
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
  /** What happens to the payment next, in a few words. */
  const next = (state: number, expiresAt: bigint) => {
    if (state === 1) return timeLeft(expiresAt) === "elapsed" ? "past its deadline, can only go back to the buyer" : `can go back to the buyer in ${timeLeft(expiresAt)} unless released`
    if (state === 2) return "released to the supplier"
    if (state === 3) return "handed back to the buyer"
    return "returned to the buyer at the deadline"
  }

  return (
    <div className="space-y-8">
      <PageHead
        title="Escrows"
        intro={`Payments held ${t.isPublic ? "on the BitRegalo network" : "in this workspace"} until work is delivered, and payments that were held before. Open one to see who can move it and when.`}
        action={<Button asChild><Link href={`${base}/escrows/new`}>Hold a payment for someone</Link></Button>}
      />
      <Explainer id="escrows" title="What is an escrow?">
        <p>A payment held safely by {t.isPublic ? "the network's" : "the workspace's"} vault contract while work is done. It ends in one of three ways: the <b>buyer releases</b> it to the supplier, the <b>supplier hands it back</b>, or the <b>deadline passes</b> and it can only go back to the buyer. Anyone can trigger that return.</p>
        <p>No person holds the payment: not BitRegalo{t.isPublic ? "" : ", not the workspace admin"}. An escrow opens when a request or a listing is paid by escrow. To start one yourself, use <b>Hold a payment for someone</b>: you send the supplier a link, they accept, and you fund it.</p>
      </Explainer>

      <Card flush title={total > 0 ? `All escrows (${total})` : "All escrows"} description={total > shown && shown > 0 ? `Showing the newest ${shown}.` : undefined}>
        {loading && <RowsSkeleton rows={3} />}
        {!loading && shown === 0 && (
          <Empty
            title="No escrows yet"
            body="One opens when someone chooses an offer on a request, or takes a listing, that is paid by escrow. You can also start one: hold a payment for someone."
            action={<Button asChild size="sm" variant="secondary"><Link href={`${base}/escrows/new`}>Hold a payment for someone</Link></Button>}
          />
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
