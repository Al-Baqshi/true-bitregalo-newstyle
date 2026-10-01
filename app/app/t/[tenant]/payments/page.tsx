"use client"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useTenant } from "@/lib/bitregalo/tenant"
import { usePaymentCount, usePayments } from "@/lib/bitregalo/hooks"
import { decodeLabel, useSettlementTokens } from "@/lib/bitregalo/instances"
import { Card, Addr, Amount, PageHead, LedgerRow, Empty, Pill, RowsSkeleton } from "@/components/app/ui"
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

  const loading = count === undefined || list.isLoading
  const shown = list.data.filter(Boolean).length
  const total = count !== undefined ? Number(count) : 0
  /** The connected wallet is named "you" so a person finds their own payments at a glance. */
  const who = (a: string) => (me && a.toLowerCase() === me ? <span className="font-[560] text-foreground">you</span> : <span className="whitespace-nowrap"><Addr a={a} /></span>)

  return (
    <div className="space-y-8">
      <PageHead
        title="Payments"
        intro="Every direct payment made through this workspace, newest first. Each one has a receipt you can share."
        action={
          <>
            <Button asChild><Link href={`${base}/pay`}>Pay someone</Link></Button>
            <Button asChild variant="secondary"><Link href={`${base}/get-paid`}>Get paid</Link></Button>
          </>
        }
      />

      <Card
        flush
        title={total > 0 ? `All payments (${total})` : "All payments"}
        description={total > shown && shown > 0 ? `Showing the newest ${shown}.` : undefined}
      >
        {loading && <RowsSkeleton rows={3} />}
        {!loading && shown === 0 && (
          <Empty
            title="No payments yet"
            body="Make a payment link under Get paid, or pay someone directly. Every payment lands here with a receipt."
            action={<Button asChild size="sm"><Link href={`${base}/get-paid`}>Get paid</Link></Button>}
          />
        )}
        {!loading && list.data.map((p, i) => {
          if (!p) return null
          const id = String(list.ids[i])
          const tk = tokens.all.find((x) => x.address.toLowerCase() === p.token.toLowerCase())
          const ref = decodeLabel(p.ref)
          const mine = me && (p.payer.toLowerCase() === me ? "sent" : p.payee.toLowerCase() === me ? "received" : null)
          return (
            <LedgerRow
              key={id}
              href={`${base}/payments/${id}`}
              lead={`#${id}`}
              title={ref ?? `Payment #${id}`}
              meta={<>From {who(p.payer)} to {who(p.payee)}{ref && <> · payment #{id}</>}</>}
              amount={<Amount value={p.amount} decimals={tk?.decimals ?? 18} symbol={tk?.symbol ?? ""} />}
              status={mine === "received" ? <Pill tone="good">Received</Pill> : mine === "sent" ? <Pill>Sent</Pill> : undefined}
            />
          )
        })}
      </Card>
    </div>
  )
}
