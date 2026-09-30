"use client"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useTenant } from "@/lib/bitregalo/tenant"
import { usePaymentCount, usePayments } from "@/lib/bitregalo/hooks"
import { decodeLabel, useSettlementTokens } from "@/lib/bitregalo/instances"
import { Card, Addr, Amount, PageHead, Row, Empty, Pill } from "@/components/app/ui"
import { Button } from "@/components/ui/button"
import { OlderContract } from "@/components/app/older-contract"

export default function Payments() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { address } = useAccount()
  const hasPay = t.version >= 1n
  const { count } = usePaymentCount(hasPay)
  const list = usePayments(count)
  const tokens = useSettlementTokens(t.instance, t.id)
  const me = address?.toLowerCase()
  if (!hasPay) return <OlderContract what="Payments" />
  return (
    <div className="space-y-8">
      <PageHead eyebrow={`Workspace #${String(t.id)}`} title="Payments" intro="Every direct payment made through a link or the pay page, newest first. Each one has a receipt." action={<div className="flex gap-2"><Button asChild><Link href={`${base}/pay`}>Pay someone</Link></Button><Button asChild variant="secondary"><Link href={`${base}/get-paid`}>Get paid</Link></Button></div>} />
      <Card>
        {list.data.length === 0 && <Empty title="No payments yet" body="Make a payment link under Get paid, or pay someone directly." action={<Button asChild size="sm"><Link href={`${base}/get-paid`}>Get paid</Link></Button>} />}
        {list.data.map((p, i) => {
          if (!p) return null
          const tk = tokens.all.find((x) => x.address.toLowerCase() === p.token.toLowerCase())
          const mine = me && (p.payer.toLowerCase() === me ? "sent" : p.payee.toLowerCase() === me ? "received" : null)
          return (
            <Row key={String(list.ids[i])} href={`${base}/payments/${list.ids[i]}`}>
              <span className="bq-mono text-xs text-muted-foreground">#{String(list.ids[i])}</span>
              <span className="min-w-0 truncate text-sm">
                <Addr a={p.payer} /> → <Addr a={p.payee} /> · <Amount value={p.amount} decimals={tk?.decimals ?? 18} symbol={tk?.symbol ?? ""} />
                {decodeLabel(p.ref) && <span className="text-muted-foreground"> · {decodeLabel(p.ref)}</span>}
              </span>
              {mine ? <Pill tone={mine === "received" ? "good" : "accent"}>{mine}</Pill> : <Pill>paid</Pill>}
            </Row>
          )
        })}
      </Card>
    </div>
  )
}
