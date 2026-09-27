"use client"
import Link from "next/link"
import { useOverview, useRfps, useEscrows } from "@/lib/bitregalo/hooks"
import { Card, Stat, Addr, Pill, Row, Amount, timeLeft } from "@/components/app/ui"
import { RFP_STATE, ESCROW_STATE, SETTLEMENT } from "@/lib/bitregalo/config"
import { Button } from "@/components/ui/button"

export default function Overview() {
  const ov = useOverview()
  const [rfpCount, offerCount, escrowCount, directCount, admin, feeBps, direct, escrow, minTerm, maxTerm, tokenCount] = (ov.data ?? []).map((r) => r.result)
  const rfps = useRfps(rfpCount as bigint | undefined)
  const escrows = useEscrows(escrowCount as bigint | undefined)
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">BitRegalo public template</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          A live instance of the protocol. Anyone can post a request for proposal, list an offer, settle by record, direct
          payment or escrow, and launch a utility token — every action is a transaction on BNB Smart Chain Testnet.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="RFPs" value={String(rfpCount ?? "…")} />
        <Stat label="Offers" value={String(offerCount ?? "…")} />
        <Stat label="Escrows" value={String(escrowCount ?? "…")} />
        <Stat label="Direct payments" value={String(directCount ?? "…")} />
        <Stat label="Tokens launched" value={String(tokenCount ?? "…")} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Latest RFPs" action={<Button asChild size="sm"><Link href="/app/rfps/new">Post an RFP</Link></Button>}>
          {rfps.data.length === 0 && <p className="text-sm text-muted-foreground">No RFPs yet.</p>}
          {rfps.data.slice(0, 6).map((r, i) => r && (
            <Row key={String(rfps.ids[i])} href={`/app/rfps/${rfps.ids[i]}`}>
              <span className="font-mono text-xs text-muted-foreground">#{String(rfps.ids[i])}</span>
              <span className="text-sm">
                <Addr a={r.requester} /> · {SETTLEMENT[r.settlement]} · deadline {timeLeft(r.deadline)}
              </span>
              <Pill tone={r.state === 1 ? "accent" : r.state === 2 ? "good" : "muted"}>{RFP_STATE[r.state]}</Pill>
            </Row>
          ))}
        </Card>
        <Card title="Latest escrows" action={<Button asChild size="sm" variant="secondary"><Link href="/app/escrows">All escrows</Link></Button>}>
          {escrows.data.length === 0 && <p className="text-sm text-muted-foreground">No escrows yet.</p>}
          {escrows.data.slice(0, 6).map((e, i) => e && (
            <Row key={String(escrows.ids[i])} href={`/app/escrows/${escrows.ids[i]}`}>
              <span className="font-mono text-xs text-muted-foreground">#{String(escrows.ids[i])}</span>
              <span className="text-sm"><Addr a={e.issuer} /> → <Addr a={e.receiver} /> · <Amount value={e.amount} /></span>
              <Pill tone={e.state === 1 ? "accent" : e.state === 2 ? "good" : "muted"}>{ESCROW_STATE[e.state]}</Pill>
            </Row>
          ))}
        </Card>
      </div>
      <Card title="Tenant rules (read from chain)">
        <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-muted-foreground">Protocol fee</dt><dd>{feeBps !== undefined ? `${Number(feeBps) / 100}% on settlement` : "…"}</dd></div>
          <div><dt className="text-muted-foreground">Modes</dt><dd>record only{direct ? ", direct" : ""}{escrow ? ", escrow" : ""}</dd></div>
          <div><dt className="text-muted-foreground">Escrow term</dt><dd>{minTerm !== undefined ? `${Number(minTerm) / 3600} h – ${Number(maxTerm) / 86400} d` : "…"}</dd></div>
          <div><dt className="text-muted-foreground">Tenant admin</dt><dd><Addr a={String(admin ?? "")} /></dd></div>
        </dl>
      </Card>
    </div>
  )
}
