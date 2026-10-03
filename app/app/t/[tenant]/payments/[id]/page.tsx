"use client"
import { use, useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { toast } from "sonner"
import { Copy, Check } from "lucide-react"
import { useTenant } from "@/lib/bitregalo/tenant"
import { usePayment } from "@/lib/bitregalo/hooks"
import { decodeLabel, useSettlementTokens, useProjects } from "@/lib/bitregalo/instances"
import { useInstanceRules } from "@/lib/bitregalo/instance-rules"
import { addresses, short } from "@/lib/bitregalo/config"
import { Card, Addr, Amount, PageHead, Pill, Facts, Fact, Empty, RowsSkeleton } from "@/components/app/ui"
import { Button } from "@/components/ui/button"
import { OlderContract } from "@/components/app/older-contract"

const NO_REF = `0x${"0".repeat(64)}`

export default function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const t = useTenant()
  const base = t.base
  const { id: raw } = use(params)
  const id = BigInt(raw)
  const { address } = useAccount()
  const { payment: p } = usePayment(id)
  const tokens = useSettlementTokens(t.instance, t.id)
  const projects = useProjects(t.instance)
  const rules = useInstanceRules(t.instance)
  const [copied, setCopied] = useState(false)
  const back = { href: `${base}/payments`, label: "All payments" }

  if (t.version < 1n) return <OlderContract what="Payments" />
  if (!p) {
    return (
      <div className="space-y-8">
        <PageHead back={back} title={`Payment #${raw}`} />
        <Card flush><RowsSkeleton rows={4} /></Card>
      </div>
    )
  }
  if (/^0x0{40}$/.test(p.payer)) {
    return (
      <div className="space-y-8">
        <PageHead back={back} title={`Payment #${raw}`} />
        <Card flush>
          <Empty title={`No payment #${raw} here`} body="This workspace has no payment with that number. Check the link you were sent." action={<Button asChild variant="secondary"><Link href={back.href}>All payments</Link></Button>} />
        </Card>
      </div>
    )
  }

  const tk = tokens.all.find((x) => x.address.toLowerCase() === p.token.toLowerCase())
  const dec = tk?.decimals ?? 18
  const sym = tk?.symbol ?? ""
  const fee = (p.amount * BigInt(rules.feeBps)) / 10_000n
  const ref = decodeLabel(p.ref)
  const proj = projects.list.find((x) => x.id === p.projectId)
  const me = address?.toLowerCase()
  const role = me === p.payer.toLowerCase() ? "You paid this." : me === p.payee.toLowerCase() ? "You received this." : null
  async function copy() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); toast.success("Receipt link copied"); setTimeout(() => setCopied(false), 1500) } catch { toast.error("Could not copy") }
  }

  return (
    <div className="space-y-8">
      <PageHead
        back={back}
        title={`Payment #${raw}`}
        intro="A receipt anyone with the link can check. It is recorded on BNB Smart Chain Testnet, where nobody can change it."
        action={<Button onClick={copy}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy receipt link"}</Button>}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Pill tone="good">Paid</Pill>
          {role && <span className="text-sm text-muted-foreground">{role}</span>}
        </div>
        <p className="t-figure mt-5 text-4xl sm:text-5xl"><Amount value={p.amount} decimals={dec} symbol={sym} /></p>
        <p className="mt-3 max-w-[62ch] text-base text-muted-foreground">
          <Addr a={p.payer} /> paid <Addr a={p.payee} />
          {ref ? <> for <span className="font-[560] text-foreground">{ref}</span></> : null}.
        </p>

        {/* The payment, line by line, as on a till receipt. */}
        <dl className="mt-7 border-t border-border">
          <Line label="Amount paid"><Amount value={p.amount} decimals={dec} symbol={sym} /></Line>
          <Line label={`Platform fee (${rules.feeBps / 100}%), taken from the amount`}>−<Amount value={fee} decimals={dec} symbol={sym} /></Line>
          <Line label="The recipient received" strong><Amount value={p.amount - fee} decimals={dec} symbol={sym} /></Line>
          <Line label="Service fee, paid by the payer on top">{tk ? <Amount value={tk.serviceFee} decimals={dec} symbol={sym} /> : "—"}</Line>
        </dl>

        <Facts className="mt-7 border-t border-border pt-6">
          <Fact label="From"><Addr a={p.payer} /></Fact>
          <Fact label="To"><Addr a={p.payee} /></Fact>
          <Fact label="Currency">{tk ? <>{tk.symbol} · <Addr a={p.token} /></> : <Addr a={p.token} />}</Fact>
          <Fact label="Reference">
            {ref ?? (p.ref === NO_REF ? "None" : <span title="Only the fingerprint of a longer text is stored">Fingerprint only: <span className="t-mono">{p.ref.slice(0, 14)}…</span></span>)}
          </Fact>
          <Fact label="Project">
            {p.projectId > 0n ? <Link className="underline decoration-1 underline-offset-[3px] hover:decoration-2" href={`${base}/projects`}>#{String(p.projectId)}{proj?.label ? ` · ${proj.label}` : ""}</Link> : "None"}
          </Fact>
          <Fact label="Public record">Direct settlement #{String(p.settlementId)} in vault <Addr a={t.vault} /></Fact>
        </Facts>

        <p className="mt-7 max-w-[68ch] border-t border-border pt-5 text-xs text-subtle">
          Fees went to the platform fee vault <Addr a={addresses.treasury} />. The workspace vault itself kept nothing.
        </p>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary"><Link href={`${base}/pay?to=${p.payee}&token=${p.token}`}>Pay {short(p.payee)} again</Link></Button>
      </div>
    </div>
  )
}

/** One line of the receipt: what it is on the left, the figure on the right. */
function Line({ label, children, strong = false }: { label: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <dt className={strong ? "text-base font-[560]" : "text-sm text-muted-foreground"}>{label}</dt>
      <dd className={strong ? "t-num text-base font-[620]" : "t-num text-base"}>{children}</dd>
    </div>
  )
}
