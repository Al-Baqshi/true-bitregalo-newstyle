"use client"
import Link from "next/link"
import type { Address, Hex } from "viem"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useOverview, useRfps, useEscrows, useSaleCount } from "@/lib/bitregalo/hooks"
import { decodeLabel, useSettlementTokens } from "@/lib/bitregalo/instances"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { Card, Addr, Pill, LedgerRow, Amount, PageHead, Empty, Facts, Fact, timeLeft } from "@/components/app/ui"
import { RFP_STATE, ESCROW_STATE, SETTLEMENT } from "@/lib/bitregalo/config"
import { Button } from "@/components/ui/button"

export default function Overview() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const nameOf = useWorkspaceName()
  const ov = useOverview()
  const [rfpCount, offerCount, escrowCount, directCount, admin, feeBps, direct, escrow, minTerm, maxTerm, tokenList] = (ov.data ?? []).map((r) => r.result)
  const rfps = useRfps(rfpCount as bigint | undefined)
  const escrows = useEscrows(escrowCount as bigint | undefined)
  const hasPay = t.version >= 1n
  const { count: saleCount } = useSaleCount(hasPay)
  const tokens = useSettlementTokens(t.instance, t.id)
  const tokenOf = (a: string) => tokens.all.find((x) => x.address.toLowerCase() === a.toLowerCase())
  const n = (v: unknown) => (v === undefined || v === null ? "…" : String(v))
  return (
    <div className="space-y-10">
      <PageHead
        title={nameOf(t.id)}
        intro={
          t.id === 0n
            ? "The open workspace anyone can use. Post a request, make a listing, and settle by escrow or direct payment."
            : hasPay
              ? "This organisation's shop, payments, requests, escrows, tokens and treasury. Share this page with the people you work with."
              : "Requests, listings, escrows and tokens for this workspace. Share this page with the people you work with."
        }
        action={
          hasPay ? (
            <>
              <Button asChild><Link href={`${base}/get-paid`}>Get paid</Link></Button>
              <Button asChild variant="secondary"><Link href={`${base}/pay`}>Pay someone</Link></Button>
              <Button asChild variant="secondary"><Link href={`${base}/rfps/new`}>Post a request</Link></Button>
            </>
          ) : (
            <>
              <Button asChild><Link href={`${base}/rfps/new`}>Post a request</Link></Button>
              <Button asChild variant="secondary"><Link href={`${base}/offers/new`}>Create a listing</Link></Button>
            </>
          )
        }
      />

      <p className="-mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        {[
          ...(hasPay ? [{ label: "sale", n: saleCount, href: `${base}/sales` }] : []),
          { label: "request", n: rfpCount, href: `${base}/rfps` },
          { label: "listing", n: offerCount, href: `${base}/offers` },
          { label: "escrow", n: escrowCount, href: `${base}/escrows` },
          ...(hasPay ? [{ label: "payment", n: directCount, href: `${base}/payments` }] : []),
          { label: "token", n: tokenList ? (tokenList as Address[]).length : undefined, href: `${base}/tokens` },
        ].map((c) => (
          <Link key={c.label} href={c.href} className="flex min-h-9 items-center gap-1.5 transition-colors hover:text-foreground pointer-coarse:min-h-11">
            <span className="t-num font-semibold text-foreground">{n(c.n)}</span> {c.label}{c.n === undefined || Number(c.n) === 1 ? "" : "s"}
          </Link>
        ))}
      </p>

      <Card flush title="Latest requests" action={<Button asChild size="sm" variant="ghost"><Link href={`${base}/rfps`}>All requests</Link></Button>}>
        {rfps.data.length === 0 && (
          <Empty title="No requests yet" body="Post the first one. Suppliers answer with a price, you choose one, and the payment settles the way you picked." action={<Button asChild size="sm" variant="secondary"><Link href={`${base}/rfps/new`}>Post a request</Link></Button>} />
        )}
        {rfps.data.slice(0, 5).map((r, i) => r && (
          <LedgerRow
            key={String(rfps.ids[i])}
            href={`${base}/rfps/${rfps.ids[i]}`}
            lead={decodeLabel(r.scopeHash as Hex) ? `#${String(rfps.ids[i])}` : undefined}
            title={decodeLabel(r.scopeHash as Hex) ?? `Request #${String(rfps.ids[i])}`}
            meta={<>{decodeLabel(r.scopeHash as Hex) ? null : "Wording kept private · "}{SETTLEMENT[r.settlement]} · {r.state === 1 ? (timeLeft(r.deadline) === "elapsed" ? "closed to new offers" : `open for ${timeLeft(r.deadline)}`) : RFP_STATE[r.state].toLowerCase()}</>}
            status={<Pill tone={r.state === 1 ? "accent" : r.state === 2 ? "good" : "muted"}>{RFP_STATE[r.state]}</Pill>}
          />
        ))}
      </Card>

      <Card flush title="Latest escrows" action={<Button asChild size="sm" variant="ghost"><Link href={`${base}/escrows`}>All escrows</Link></Button>}>
        {escrows.data.length === 0 && <Empty title="No escrows yet" body="An escrow opens when someone chooses an offer on a request, or takes a listing, that is paid by escrow." />}
        {escrows.data.slice(0, 5).map((e, i) => e && (
          <LedgerRow
            key={String(escrows.ids[i])}
            href={`${base}/escrows/${escrows.ids[i]}`}
            title={<>Escrow #{String(escrows.ids[i])}</>}
            meta={<>From <Addr a={e.issuer} /> to <Addr a={e.receiver} />{e.state === 1 && <> · {timeLeft(e.expiresAt) === "elapsed" ? "past its deadline, can go back to the buyer" : `deadline in ${timeLeft(e.expiresAt)}`}</>}</>}
            amount={<Amount value={e.amount} decimals={tokenOf(e.token)?.decimals ?? 18} symbol={tokenOf(e.token)?.symbol ?? ""} />}
            status={<Pill tone={e.state === 1 ? "accent" : e.state === 2 ? "good" : "muted"}>{ESCROW_STATE[e.state]}</Pill>}
          />
        ))}
      </Card>

      <Card title="Rules of this workspace" description="Set when the workspace was created. They apply to everyone who uses it.">
        <Facts columns={4}>
          <Fact label="Platform fee">{feeBps !== undefined ? `${Number(feeBps) / 100}% of each payment` : "…"}</Fact>
          <Fact label="Ways to settle">Record only{direct ? ", direct" : ""}{escrow ? ", escrow" : ""}</Fact>
          <Fact label="Escrow length">{minTerm !== undefined ? `${Math.round(Number(minTerm) / 3600)} h to ${Math.round(Number(maxTerm) / 86400)} days` : "…"}</Fact>
          <Fact label="Admin"><Addr a={String(admin ?? "")} /></Fact>
        </Facts>
      </Card>
    </div>
  )
}
