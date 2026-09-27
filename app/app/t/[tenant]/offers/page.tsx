"use client"
import { useTenant } from "@/lib/bitregalo/tenant"
import Link from "next/link"
import { useOverview, useOffers } from "@/lib/bitregalo/hooks"
import { Card, Addr, Pill, Row, Amount } from "@/components/app/ui"
import { OFFER_STATE, SETTLEMENT } from "@/lib/bitregalo/config"
import { Button } from "@/components/ui/button"

export default function OffersPage() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const ov = useOverview()
  const count = ov.data?.[1]?.result as bigint | undefined
  const offers = useOffers(count)
  return (
    <Card title={`Requests to supply (${count ?? "…"})`} action={<Button asChild size="sm"><Link href={`${base}/offers/new`}>List an offer</Link></Button>}>
      {offers.data.map((o, i) => o && (
        <Row key={String(offers.ids[i])} href={`${base}/offers/${offers.ids[i]}`}>
          <span className="font-mono text-xs text-muted-foreground">#{String(offers.ids[i])}</span>
          <span className="text-sm">by <Addr a={o.supplier} /> · {o.settlement ? <Amount value={o.amount} /> : "no payment"} · {SETTLEMENT[o.settlement]} · {Number(o.timeframe) / 86400} d</span>
          <Pill tone={o.state === 1 ? "accent" : o.state === 2 ? "good" : "muted"}>{OFFER_STATE[o.state]}</Pill>
        </Row>
      ))}
      {offers.data.length === 0 && <p className="text-sm text-muted-foreground">No offers listed yet.</p>}
    </Card>
  )
}
