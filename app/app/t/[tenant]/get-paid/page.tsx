"use client"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAccount } from "wagmi"
import { isAddress } from "viem"
import QRCode from "qrcode"
import { toast } from "sonner"
import { Copy, Check } from "lucide-react"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useSettlementTokens, useProjects, labelBytes } from "@/lib/bitregalo/instances"
import { useInstanceRules } from "@/lib/bitregalo/instance-rules"
import { Card, PageHead } from "@/components/app/ui"
import { Explainer } from "@/components/app/explain"
import { Label, Note, input } from "@/components/app/wizard/fields"
import { Button } from "@/components/ui/button"
import { OlderContract } from "@/components/app/older-contract"

function GetPaidInner() {
  const t = useTenant()
  const { address } = useAccount()
  const sp = useSearchParams()
  const rules = useInstanceRules(t.instance)
  const tokens = useSettlementTokens(t.instance, t.id)
  const projects = useProjects(t.instance)
  const [to, setTo] = useState(sp.get("to") ?? "")
  const [token, setToken] = useState("")
  const [amount, setAmount] = useState(sp.get("amount") ?? "")
  const [ref, setRef] = useState(sp.get("ref") ?? "")
  const [project, setProject] = useState("0")
  const [qr, setQr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (address && !to) setTo(address) }, [address, to])
  const chosen = tokens.accepted.find((x) => x.address.toLowerCase() === token.toLowerCase()) ?? tokens.accepted[0]
  const ready = isAddress(to) && !!chosen
  const link = (() => {
    if (!ready || typeof window === "undefined") return ""
    const u = new URL(`/app/t/${t.id}/pay`, window.location.origin)
    u.searchParams.set("to", to)
    u.searchParams.set("token", chosen!.address)
    if (Number(amount) > 0) { u.searchParams.set("amount", amount); u.searchParams.set("fixed", "1") }
    if (ref.trim()) u.searchParams.set("ref", ref.trim())
    if (project !== "0") u.searchParams.set("project", project)
    return u.toString()
  })()
  useEffect(() => {
    if (!link) { setQr(null); return }
    QRCode.toDataURL(link, { margin: 1, width: 320, color: { dark: "#1a1612", light: "#fffaf0" } }).then(setQr).catch(() => setQr(null))
  }, [link])
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); toast.success("Link copied"); setTimeout(() => setCopied(false), 1500) } catch { toast.error("Could not copy") }
  }
  if (t.version < 1n) return <OlderContract what="Getting paid" />
  return (
    <div className="space-y-8">
      <PageHead eyebrow={`Workspace #${String(t.id)}`} title="Get paid" intro="Make a link or a QR code. Whoever opens it sees the amount and your wallet, signs once, and the money lands in your wallet in the same transaction." />
      <Explainer id="get-paid" title="How this works">
        <p>Nothing is created on-chain when you make a link. The link only carries who gets paid, in which currency, how much, and a reference. The payment itself happens when the other person opens it and signs. Every payment appears under Payments with a receipt you can both keep.</p>
        <p>Leave the amount empty for a link where the payer chooses, for example a tip jar or a gift. Set it for an invoice.</p>
      </Explainer>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="What the link says">
          <div className="grid gap-5">
            <Label title="Paid to" hint="Your connected wallet by default. Any address works.">
              <input className={`${input} bq-mono`} value={to} onChange={(e) => setTo(e.target.value.trim())} placeholder="0x…" />
            </Label>
            <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
              <Label title="Amount" hint="Empty lets the payer choose.">
                <input className={`${input} bq-mono`} type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="any amount" />
              </Label>
              <Label title="Currency">
                <select className={input} value={chosen?.address ?? ""} onChange={(e) => setToken(e.target.value)}>
                  {tokens.accepted.map((x) => <option key={x.address} value={x.address}>{x.symbol}</option>)}
                </select>
              </Label>
            </div>
            <Label title="Reference (optional)" counter={`${labelBytes(ref)}/31`} hint="Invoice number, order id, table number. Shown on the receipt.">
              <input className={input} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Invoice 1042" />
            </Label>
            <Label title="Project (optional)">
              <select className={input} value={project} onChange={(e) => setProject(e.target.value)}>
                <option value="0">No project</option>
                {projects.list.filter((p) => p.active).map((p) => <option key={String(p.id)} value={String(p.id)}>#{String(p.id)} · {p.label ?? "private project"}</option>)}
              </select>
            </Label>
            {chosen && rules.loaded && (
              <Note>
                The payer covers the {rules.feeBps / 100}% platform fee{chosen.serviceFee > 0n ? " and the service fee" : ""}; you receive the amount minus {rules.feeBps / 100}%.
                {!rules.direct && <strong className="text-destructive"> Direct payment is switched off in this workspace, so links will not work until an admin turns it on.</strong>}
              </Note>
            )}
          </div>
        </Card>
        <Card title="Share">
          {ready ? (
            <div className="grid gap-4">
              {qr && <img src={qr} alt="QR code for this payment link" className="mx-auto w-full max-w-64 rounded-xl" />}
              <div className="bq-mono break-all rounded-lg bg-secondary/50 px-3 py-2 text-[11px] text-[color:var(--bq-ivory-dim)]">{link}</div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={copy}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}Copy link</Button>
                <Button asChild variant="secondary"><Link href={link.replace(window.location.origin, "")}>Preview</Link></Button>
              </div>
              <p className="text-xs text-muted-foreground">Print the QR code for a counter, or send the link in a message. The payer needs a wallet with {chosen!.symbol} on {"BSC Testnet"}.</p>
            </div>
          ) : <p className="text-sm text-muted-foreground">Enter a valid address to make the link.</p>}
        </Card>
      </div>
    </div>
  )
}

export default function GetPaid() {
  return <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}><GetPaidInner /></Suspense>
}
