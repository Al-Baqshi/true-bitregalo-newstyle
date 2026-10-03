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
import { Card, PageHead, Section, Addr } from "@/components/app/ui"
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
    const u = new URL(`${t.base}/pay`, window.location.origin)
    u.searchParams.set("to", to)
    u.searchParams.set("token", chosen!.address)
    if (Number(amount) > 0) { u.searchParams.set("amount", amount); u.searchParams.set("fixed", "1") }
    if (ref.trim()) u.searchParams.set("ref", ref.trim())
    if (project !== "0") u.searchParams.set("project", project)
    return u.toString()
  })()
  useEffect(() => {
    if (!link) { setQr(null); return }
    // Always dark modules on a light ground with a full quiet zone, whatever the theme, so any phone camera reads it.
    QRCode.toDataURL(link, { margin: 4, width: 512, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }).then(setQr).catch(() => setQr(null))
  }, [link])
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); toast.success("Link copied"); setTimeout(() => setCopied(false), 1500) } catch { toast.error("Could not copy") }
  }
  if (t.version < 1n) return <OlderContract what="Getting paid" />
  const fixedAmount = Number(amount) > 0
  return (
    <div className="space-y-8">
      <PageHead title="Get paid" intro="Make a link or a QR code. Whoever opens it sees the amount and your wallet, signs once, and the payment reaches your wallet in that same transaction." />
      <Explainer id="get-paid" title="How this works">
        <p>Nothing is written to the blockchain when you make a link. The link only carries who gets paid, in which currency, how much, and a reference. The payment itself happens when the other person opens the link and signs. Every payment then appears under Payments, with a receipt you can both keep.</p>
        <p>Leave the amount empty for a link where the payer chooses, such as a tip jar or a gift. Set it for an invoice.</p>
      </Explainer>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <Section title="What the link says">
          <div className="grid gap-5">
            <Label title="Paid to" hint="Your connected wallet by default. Any wallet address works.">
              <input className={`${input} t-mono`} value={to} onChange={(e) => setTo(e.target.value.trim())} placeholder="0x…" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            </Label>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <Label title="Amount" hint="Leave it empty to let the payer choose.">
                <input className={`${input} t-num`} type="number" inputMode="decimal" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Any amount" />
              </Label>
              <Label title="Currency" hint="What this workspace accepts.">
                <select className={input} value={chosen?.address ?? ""} onChange={(e) => setToken(e.target.value)}>
                  {tokens.accepted.map((x) => <option key={x.address} value={x.address}>{x.symbol}</option>)}
                </select>
              </Label>
            </div>
            <Label title="Reference (optional)" counter={`${labelBytes(ref)}/31`} hint="An invoice number, order id or table number. Shown on the receipt.">
              <input className={input} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Invoice 1042" />
            </Label>
            <Label title="Project (optional)" hint="Groups the payment with related work in this workspace.">
              <select className={input} value={project} onChange={(e) => setProject(e.target.value)}>
                <option value="0">No project</option>
                {projects.list.filter((p) => p.active).map((p) => <option key={String(p.id)} value={String(p.id)}>#{String(p.id)} · {p.label ?? "Private project"}</option>)}
              </select>
            </Label>
            {chosen && rules.loaded && (
              <Note>
                You receive the amount minus the {rules.feeBps / 100}% platform fee.
                {chosen.serviceFee > 0n ? " The payer adds the service fee on top." : ""}
                {!rules.direct && <strong className="block pt-1 text-destructive">Direct payment is switched off in this workspace, so links will not work until an admin turns it on.</strong>}
              </Note>
            )}
          </div>
        </Section>

        <Card title="Your payment link" className="lg:sticky lg:top-[calc(var(--topbar-h)+1.5rem)]">
          {ready ? (
            <div className="grid gap-4">
              {/* The QR sits on its own white tile in both themes: dark modules on a light ground is what cameras expect. */}
              <div className="mx-auto w-full max-w-64 rounded-xl bg-white p-2">
                {qr ? <img src={qr} alt="QR code that opens this payment link" className="block aspect-square w-full" /> : <div className="aspect-square w-full animate-pulse rounded-lg bg-secondary" aria-hidden />}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {fixedAmount ? <><span className="t-num font-[560] text-foreground">{amount} {chosen!.symbol}</span> to </> : <>Any amount in {chosen!.symbol} to </>}
                <Addr a={to} />
                {ref.trim() ? <> for “{ref.trim()}”</> : null}
              </p>
              <p className="t-mono break-all rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">{link}</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={copy} aria-live="polite">{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy link"}</Button>
                <Button asChild variant="secondary"><Link href={link.replace(window.location.origin, "")}>Preview</Link></Button>
              </div>
              <p className="text-xs text-subtle">Print the QR code for a counter, or send the link in a message. The payer needs a wallet with {chosen!.symbol} on BNB Smart Chain Testnet.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isAddress(to) ? (rules.loaded ? "This workspace accepts no currency yet, so there is nothing to be paid in." : "Loading what this workspace accepts…") : "Enter a valid wallet address under Paid to, and the link and QR code appear here."}
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function GetPaid() {
  return <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}><GetPaidInner /></Suspense>
}
