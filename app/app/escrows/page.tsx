"use client"
import { useOverview, useEscrows } from "@/lib/bitregalo/hooks"
import { Card, Addr, Pill, Row, Amount, timeLeft } from "@/components/app/ui"
import { ESCROW_STATE } from "@/lib/bitregalo/config"

export default function EscrowsPage() {
  const ov = useOverview()
  const count = ov.data?.[2]?.result as bigint | undefined
  const escrows = useEscrows(count)
  return (
    <Card title={`Escrows (${count ?? "…"})`}>
      {escrows.data.map((e, i) => e && (
        <Row key={String(escrows.ids[i])} href={`/app/escrows/${escrows.ids[i]}`}>
          <span className="font-mono text-xs text-muted-foreground">#{String(escrows.ids[i])}</span>
          <span className="text-sm"><Addr a={e.issuer} /> → <Addr a={e.receiver} /> · <Amount value={e.amount} /> · {e.state === 1 ? `expires in ${timeLeft(e.expiresAt)}` : ESCROW_STATE[e.state].toLowerCase()}</span>
          <Pill tone={e.state === 1 ? "accent" : e.state === 2 ? "good" : "muted"}>{ESCROW_STATE[e.state]}</Pill>
        </Row>
      ))}
      {escrows.data.length === 0 && <p className="text-sm text-muted-foreground">No escrows yet. Award an RFP or confirm an offer with escrow settlement to open one.</p>}
    </Card>
  )
}
