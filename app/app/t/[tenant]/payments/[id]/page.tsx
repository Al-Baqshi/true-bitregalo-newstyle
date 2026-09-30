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
import { addresses, explorerAddress, short } from "@/lib/bitregalo/config"
import { Card, Addr, Amount, PageHead, Pill } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

export default function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { id: raw } = use(params)
  const id = BigInt(raw)
  const { address } = useAccount()
  const { payment: p } = usePayment(id)
  const tokens = useSettlementTokens(t.instance, t.id)
  const projects = useProjects(t.instance)
  const rules = useInstanceRules(t.instance)
  const [copied, setCopied] = useState(false)
  if (t.version < 1n) return <p className="text-sm text-muted-foreground">This workspace has no payments.</p>
  if (!p) return <p className="text-sm text-muted-foreground">Loading receipt #{raw}…</p>
  if (/^0x0{40}$/.test(p.payer)) return <p className="text-sm text-muted-foreground">No payment #{raw} in this workspace.</p>
  const tk = tokens.all.find((x) => x.address.toLowerCase() === p.token.toLowerCase())
  const dec = tk?.decimals ?? 18
  const fee = (p.amount * BigInt(rules.feeBps)) / 10_000n
  const ref = decodeLabel(p.ref)
  const proj = projects.list.find((x) => x.id === p.projectId)
  const me = address?.toLowerCase()
  const role = me === p.payer.toLowerCase() ? "You paid this" : me === p.payee.toLowerCase() ? "You received this" : null
  async function copy() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); toast.success("Receipt link copied"); setTimeout(() => setCopied(false), 1500) } catch { toast.error("Could not copy") }
  }
  const rows: [string, React.ReactNode][] = [
    ["Amount", <Amount key="a" value={p.amount} decimals={dec} symbol={tk?.symbol ?? ""} />],
    ["Recipient received", <Amount key="r" value={p.amount - fee} decimals={dec} symbol={tk?.symbol ?? ""} />],
    ["Platform fee", <><Amount key="f" value={fee} decimals={dec} symbol={tk?.symbol ?? ""} /> ({rules.feeBps / 100}%)</>],
    ["Service fee", tk ? <Amount key="s" value={tk.serviceFee} decimals={dec} symbol={tk.symbol} /> : "—"],
    ["From", <Addr key="p" a={p.payer} />],
    ["To", <Addr key="e" a={p.payee} />],
    ["Currency", tk ? <a key="t" className="bq-mono text-xs underline-offset-2 hover:underline" href={explorerAddress(p.token)} target="_blank" rel="noreferrer">{tk.symbol} · {short(p.token)}</a> : <Addr key="t" a={p.token} />],
    ["Reference", ref ?? (p.ref === `0x${"0".repeat(64)}` ? "—" : <span className="bq-mono text-xs" title="Only the fingerprint of a longer text is stored">fingerprint {p.ref.slice(0, 14)}…</span>)],
    ["Project", p.projectId > 0n ? <Link key="pr" className="underline-offset-2 hover:underline" href={`${base}/projects`}>#{String(p.projectId)}{proj?.label ? ` · ${proj.label}` : ""}</Link> : "—"],
    ["Settlement", <span key="st" className="bq-mono text-xs">direct #{String(p.settlementId)} · vault {short(t.vault)}</span>],
  ]
  return (
    <div className="space-y-6">
      <PageHead eyebrow={`Workspace #${String(t.id)} · receipt`} title={`Payment #${raw}`} intro="Recorded on BSC Testnet. Anyone with this link can see it; nobody can change it." action={<Button variant="secondary" onClick={copy}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}Copy receipt link</Button>} />
      <Card>
        <div className="mb-4 flex items-center gap-3"><Pill tone="good">paid</Pill>{role && <span className="text-sm text-muted-foreground">{role}</span>}</div>
        <dl className="divide-y divide-border text-sm">
          {rows.map(([k, v]) => <div key={k} className="grid gap-1 py-3 sm:grid-cols-[180px_1fr]"><dt className="text-xs text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">Fees went to the platform fee vault <a className="bq-mono underline-offset-2 hover:underline" href={explorerAddress(addresses.treasury)} target="_blank" rel="noreferrer">{short(addresses.treasury)}</a>. The vault itself kept nothing.</p>
      </Card>
      <div className="flex flex-wrap gap-3"><Button asChild variant="secondary"><Link href={`${base}/payments`}>All payments</Link></Button><Button asChild><Link href={`${base}/pay?to=${p.payee}&token=${p.token}`}>Pay {short(p.payee)} again</Link></Button></div>
    </div>
  )
}
