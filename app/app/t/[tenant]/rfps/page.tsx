"use client"
import { Explainer } from "@/components/app/explain"
import { decodeLabel } from "@/lib/bitregalo/instances"
import { useTenant } from "@/lib/bitregalo/tenant"
import Link from "next/link"
import { useOverview, useRfps } from "@/lib/bitregalo/hooks"
import { Card, Addr, Pill, Row, timeLeft } from "@/components/app/ui"
import { RFP_STATE, SETTLEMENT } from "@/lib/bitregalo/config"
import { Button } from "@/components/ui/button"

export default function RfpsPage() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const ov = useOverview()
  const rfpCount = ov.data?.[0]?.result as bigint | undefined
  const rfps = useRfps(rfpCount)
  return (
    <div>
      <Explainer id="requests" title="What is a request?"><p>Someone says what they need; suppliers answer with an offer — a price and how many days they need. The person who asked chooses one offer.</p><p>Each request has a closing time for new offers, and a payment choice: <b>just record it</b>, <b>pay straight away</b>, or <b>hold it in escrow</b> until the work is done. A <b>hidden title</b> keeps the wording off the blockchain, but who asked, the offers and any payment are still public.</p></Explainer>
    <Card title={`Requests (${rfpCount ?? "…"})`} action={<Button asChild size="sm"><Link href={`${base}/rfps/new`}>Post an RFP</Link></Button>}>
      {rfps.data.map((r, i) => r && (
        <Row key={String(rfps.ids[i])} href={`${base}/rfps/${rfps.ids[i]}`}>
          <span className="font-mono text-xs text-muted-foreground">#{String(rfps.ids[i])}</span>
          <span className="min-w-0 truncate text-sm"><span className="font-medium">{decodeLabel(r.scopeHash) ?? "Hidden title"}</span> · by <Addr a={r.requester} /> · {SETTLEMENT[r.settlement]} · deadline {timeLeft(r.deadline)}</span>
          <Pill tone={r.state === 1 ? "accent" : r.state === 2 ? "good" : "muted"}>{RFP_STATE[r.state]}</Pill>
        </Row>
      ))}
      {rfps.data.length === 0 && <p className="text-sm text-muted-foreground">Nothing posted yet — be the first.</p>}
    </Card>
    </div>
  )
}
