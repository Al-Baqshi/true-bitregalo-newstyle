"use client"
import { Explainer } from "@/components/app/explain"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useOverview, useEscrows } from "@/lib/bitregalo/hooks"
import { Card, Addr, Pill, Row, Amount, timeLeft } from "@/components/app/ui"
import { ESCROW_STATE } from "@/lib/bitregalo/config"

export default function EscrowsPage() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const ov = useOverview()
  const count = ov.data?.[2]?.result as bigint | undefined
  const escrows = useEscrows(count)
  return (
    <div>
      <Explainer id="escrows" title="What is an escrow?"><p>Money held safely by the workspace vault while work is done. It ends in one of three ways: the <b>buyer releases</b> it to the supplier, the <b>supplier hands it back</b>, or the <b>deadline passes</b> and it returns to the buyer.</p><p>No person holds the money — not BitRegalo, not the workspace admin. Escrows are created automatically when a request or listing is paid by escrow.</p></Explainer>
    <Card title={`Escrows (${count ?? "…"})`}>
      {escrows.data.map((e, i) => e && (
        <Row key={String(escrows.ids[i])} href={`${base}/escrows/${escrows.ids[i]}`}>
          <span className="font-mono text-xs text-muted-foreground">#{String(escrows.ids[i])}</span>
          <span className="text-sm"><Addr a={e.issuer} /> → <Addr a={e.receiver} /> · <Amount value={e.amount} /> · {e.state === 1 ? `expires in ${timeLeft(e.expiresAt)}` : ESCROW_STATE[e.state].toLowerCase()}</span>
          <Pill tone={e.state === 1 ? "accent" : e.state === 2 ? "good" : "muted"}>{ESCROW_STATE[e.state]}</Pill>
        </Row>
      ))}
      {escrows.data.length === 0 && <p className="text-sm text-muted-foreground">No escrows yet. One opens when someone chooses an offer on a request — or takes a listing — that is paid by escrow.</p>}
    </Card>
    </div>
  )
}
