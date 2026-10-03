"use client"
import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { isAddress } from "viem"
import QRCode from "qrcode"
import { toast } from "sonner"
import { Check, Copy, Share2 } from "lucide-react"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useSettlementTokens } from "@/lib/bitregalo/instances"
import { useInstanceRules } from "@/lib/bitregalo/instance-rules"
import { countryOptions, guessCountry } from "@/lib/bitregalo/market"
import { Addr, Amount, Card, Notice, PageHead, Section } from "@/components/app/ui"
import { ConnectButton } from "@/components/app/connect-button"
import { Label, Note, input } from "./fields"
import { Button } from "@/components/ui/button"

/**
 * Hold a payment for someone, with today's contracts. An escrow starts only when a buyer takes a
 * listing, so the buyer makes a link for the supplier: the supplier opens it and lists the job
 * for this buyer only, paid by escrow (one signature), and the buyer then funds that listing.
 * Making the link writes nothing to the chain.
 */
export function EscrowWizard() {
  const t = useTenant()
  const { address } = useAccount()
  const rules = useInstanceRules(t.instance)
  const tokens = useSettlementTokens(t.instance, t.id)
  const [supplier, setSupplier] = useState("")
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [token, setToken] = useState("")
  const [days, setDays] = useState("7")
  const [country, setCountry] = useState("")
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([])
  const [origin, setOrigin] = useState("")
  const [qr, setQr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)

  // Browser-only facts: where this app lives, the visitor's language and country.
  useEffect(() => {
    setOrigin(window.location.origin)
    setCanShare(typeof navigator.share === "function")
    if (t.isPublic) {
      setCountries(countryOptions())
      setCountry((c) => c || guessCountry() || "")
    }
  }, [t.isPublic])

  const chosen = tokens.accepted.find((x) => x.address.toLowerCase() === token.toLowerCase()) ?? tokens.accepted[0]
  const where = t.isPublic ? "on the BitRegalo network" : "in this workspace"
  const d = Number(days)
  const termLow = Math.max(1, Math.round(rules.minTerm / 3600))
  const termHigh = Math.round(rules.maxTerm / 86400)
  const fraction = amount.trim().split(".")[1] ?? ""
  const titleLen = title.trim().length

  const problem =
    rules.loaded && !rules.escrow ? "Escrow is switched off here"
    : !isAddress(supplier.trim()) ? "Enter the supplier's wallet address"
    : address && supplier.trim().toLowerCase() === address.toLowerCase() ? "That is your own wallet. The supplier needs a different one"
    : titleLen < 3 ? "Say what the payment is for (at least 3 characters)"
    : titleLen > 120 ? "Keep the title to 120 characters"
    : !chosen ? (tokens.all.length > 0 ? "No currency is accepted here yet" : "Loading the currencies accepted here…")
    : !/^\d+(\.\d+)?$/.test(amount.trim()) || !(Number(amount) > 0) ? "Enter how much to hold"
    : fraction.length > chosen.decimals ? `${chosen.symbol} has at most ${chosen.decimals} decimal places`
    : !(d > 0) ? "Enter how many days the supplier has"
    : rules.loaded && (d * 86400 < rules.minTerm || d * 86400 > rules.maxTerm) ? `Escrows here run from ${termLow} h to ${termHigh} days`
    : t.isPublic && !country ? "Choose the country where the work happens"
    : null

  const link = (() => {
    if (problem || !address || !origin || !chosen) return ""
    const params: [string, string][] = [
      ["for", address],
      ["supplier", supplier.trim()],
      ["token", chosen.address],
      ["amount", amount.trim()],
      ["days", days.trim()],
      ["escrow", "1"],
      ["title", title.trim()],
      ...(t.isPublic && country ? ([["country", country]] as [string, string][]) : []),
    ]
    return `${origin}${t.base}/listings/new?${params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")}`
  })()

  useEffect(() => {
    if (!link) { setQr(null); return }
    // Dark modules on a light ground with a full quiet zone, whatever the theme, so any phone camera reads it.
    QRCode.toDataURL(link, { margin: 4, width: 512, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }).then(setQr).catch(() => setQr(null))
  }, [link])

  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); toast.success("Link copied"); setTimeout(() => setCopied(false), 1500) } catch { toast.error("Could not copy") }
  }
  async function share() {
    try { await navigator.share({ title: `Job: ${title.trim()}`, text: `I'd like to pay you ${amount.trim()} ${chosen?.symbol ?? ""} through escrow for “${title.trim()}”. Open this link to accept:`, url: link }) } catch {}
  }

  return (
    <div className="space-y-10">
      <PageHead
        title="Hold a payment for someone"
        intro="Agree a job and a price. You fund it, the payment is held in escrow, and only you can release it to the supplier when the work is done. If you never do, after the deadline it can only go back to you."
      />

      {rules.loaded && !rules.escrow && (
        <Notice tone="accent" title="Escrow is switched off here">
          <p>This workspace does not hold payments in escrow, so this cannot work here. The workspace admin can switch it on in Settings.</p>
        </Notice>
      )}

      <Section title="How it works" description="Three steps. Nothing is paid until step 3.">
        <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          {[
            { title: "You send a link", body: "Fill in the job below and send the supplier the link or QR code. Making it writes nothing to the chain." },
            { title: "The supplier accepts", body: "They open the link and sign once. That lists the job for you only, to be paid by escrow." },
            { title: "You fund it", body: "You get the listing link back (it also shows under My activity). Approve and confirm, and the payment is held until you release it." },
          ].map((s, i) => (
            <li key={s.title}>
              <span className="t-num flex size-8 items-center justify-center rounded-full border border-border-strong text-sm font-[600]" aria-hidden>{i + 1}</span>
              <p className="t-subheading mt-3">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <Section title="The job">
          <div className="grid gap-5">
            <Label title="Supplier's wallet address" hint="Starts with 0x. Ask them for it. When the listing comes back to you, check it is from this wallet before you fund it.">
              <input className={`${input} t-mono`} value={supplier} onChange={(e) => setSupplier(e.target.value.trim())} placeholder="0x…" autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false} />
            </Label>
            <Label title="What is it for?" counter={`${titleLen}/120`} hint="A short title the supplier sees when they open the link.">
              <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Paint the garden fence" maxLength={140} />
            </Label>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <Label title="How much" hint="What the supplier receives when you release it, before the platform fee.">
                <input className={`${input} t-num`} type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(",", "."))} placeholder="250" autoComplete="off" />
              </Label>
              <Label title="Currency" hint={t.isPublic ? "Accepted on the network." : "Accepted in this workspace."}>
                <select className={input} value={chosen?.address ?? ""} onChange={(e) => setToken(e.target.value)} disabled={tokens.accepted.length === 0}>
                  {tokens.accepted.length === 0 && <option value="">…</option>}
                  {tokens.accepted.map((x) => <option key={x.address} value={x.address}>{x.symbol}</option>)}
                </select>
              </Label>
            </div>
            <Label
              title="Days the supplier has"
              hint={<>Counted from when you fund it. If you have not released it by then, it can only go back to you.{rules.loaded && <> Escrows {where} run from {termLow} h to {termHigh} days.</>}</>}
            >
              <input className={`${input} t-num max-w-40`} type="text" inputMode="decimal" value={days} onChange={(e) => setDays(e.target.value.replace(",", "."))} autoComplete="off" />
            </Label>
            {t.isPublic && (
              <Label title="Country" hint="Where the work happens. The supplier's listing carries it, so the job is filed under that country in the marketplace.">
                <select className={input} value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="">Choose a country</option>
                  {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </Label>
            )}
            {chosen && rules.loaded && Number(amount) > 0 && (
              <Note>
                When you fund it, you pay {amount.trim()} {chosen.symbol}
                {chosen.serviceFee > 0n ? <> plus a service fee of <Amount value={chosen.serviceFee} decimals={chosen.decimals} symbol={chosen.symbol} /></> : null}
                . When you release it, the supplier receives it minus the {rules.feeBps / 100}% platform fee.
              </Note>
            )}
          </div>
        </Section>

        <Card title="Link for the supplier" className="lg:sticky lg:top-[calc(var(--topbar-h)+1.5rem)]">
          {!address ? (
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">Connect your wallet first. The link names your wallet as the buyer, so the job is listed for you and only you can fund it.</p>
              <div><ConnectButton /></div>
            </div>
          ) : link ? (
            <div className="grid gap-4">
              {/* The QR sits on its own white tile in both themes: dark modules on a light ground is what cameras expect. */}
              <div className="mx-auto w-full max-w-64 rounded-xl bg-white p-2">
                {qr ? <img src={qr} alt="QR code that opens this link" className="block aspect-square w-full" /> : <div className="aspect-square w-full animate-pulse rounded-lg bg-secondary" aria-hidden />}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                <span className="t-num font-[560] text-foreground">{amount.trim()} {chosen!.symbol}</span> for “{title.trim()}”, within {days.trim()} {d === 1 ? "day" : "days"}. Send it to <Addr a={supplier.trim()} />.
              </p>
              <p className="t-mono break-all rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">{link}</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={copy} aria-live="polite">{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy link"}</Button>
                {canShare && <Button variant="secondary" onClick={share}><Share2 />Share</Button>}
              </div>
              <p className="text-xs text-subtle">Nothing has been signed. The supplier needs a wallet on BNB Smart Chain Testnet; you need {chosen!.symbol} to fund it.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" role="status">{problem ?? "Fill in the job, and the link and QR code appear here."}</p>
          )}
        </Card>
      </div>
    </div>
  )
}
