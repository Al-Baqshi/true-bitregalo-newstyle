"use client"
import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { toast } from "sonner"
import { Check, Copy, Download, Printer } from "lucide-react"
import { deliveryLink, keepPendingCode, type DeliveryCode } from "@/lib/bitregalo/delivery"
import { AddOn } from "@/components/app/wizard/fields"
import { Button } from "@/components/ui/button"

/*
 * The buyer's side of a delivery code: the choice before signing, the code's backup, and the
 * card with the QR code and link once the held payment has its number.
 */

async function copyText(text: string, what: string) {
  try { await navigator.clipboard.writeText(text); toast.success(`${what} copied`) } catch { toast.error("Could not copy. Select the text and copy it yourself.") }
}
function download(name: string, href: string) {
  const a = document.createElement("a")
  a.href = href; a.download = name; a.rel = "noopener"
  document.body.appendChild(a); a.click(); a.remove()
}
/** A plain page with the QR code and the words, sent to the printer. */
function print(title: string, body: string, qr: string | null) {
  const w = window.open("", "_blank", "noopener,width=640,height=800")
  if (!w) { toast.error("The browser blocked the print window. Allow pop-ups for this site and try again."); return }
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)
  w.document.write(`<!doctype html><title>${esc(title)}</title><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:2rem auto;padding:0 1rem;color:#111"><h1 style="font-size:1.4rem">${esc(title)}</h1>${qr ? `<img src="${qr}" alt="QR code" style="display:block;width:16rem;height:16rem;margin:1rem 0">` : ""}<p style="font-size:0.95rem;white-space:pre-wrap;word-break:break-all">${esc(body)}</p><script>window.onload=function(){window.print()}</script></body>`)
  w.document.close()
}

/**
 * Offered where a buyer opens a held payment in a workspace with delivery confirmation. On by
 * default. The code exists only in this browser until the buyer saves it; it is written to this
 * browser's storage as soon as it is drawn, so a crash after signing cannot lose it, and the
 * buyer must say they have kept a copy before they can sign.
 */
export function DeliveryCodeChoice({ on, onChange, code, saved, onSaved, vault }: {
  on: boolean; onChange: (v: boolean) => void; code: DeliveryCode | null; saved: boolean; onSaved: (v: boolean) => void; vault: string
}) {
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (code) keepPendingCode(vault, code) }, [code, vault])
  const text = code ? `BitRegalo delivery code\n\n${code}\n\nGive this to the person who will receive the goods. Do not send it to the supplier. Anyone who has it can release the payment to the supplier. Once the payment is open you will also get it as a QR code and a link.` : ""
  return (
    <div className="grid gap-4">
      <AddOn
        checked={on}
        onChange={onChange}
        title="Confirm delivery with a code"
        description="A secret code made here, in your browser. Whoever receives the goods shows it at the handover; presenting it releases the payment to the supplier and records the delivery. It can do nothing else. You can still release from your wallet yourself."
      />
      {on && code && (
        <div className="grid gap-4 rounded-xl border border-border-strong/60 px-4 py-4 sm:px-5">
          <div>
            <p className="t-subheading">Your delivery code</p>
            <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
              Save it now. The chain keeps only its fingerprint, so it cannot be recovered later. After you sign you will get it as a QR code and a link for the recipient. Give it to the person who will receive the goods; do not send it to the supplier. Anyone who has it can release the payment to the supplier.
            </p>
          </div>
          <p className="t-mono break-all rounded-lg bg-secondary px-3 py-2 text-sm">{code}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => copyText(code, "Delivery code").then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy the code"}</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => download("bitregalo-delivery-code.txt", `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`)}><Download />Download</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => print("Delivery code", text, null)}><Printer />Print</Button>
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 size-4 accent-[var(--color-gold-line)]" checked={saved} onChange={(e) => onSaved(e.target.checked)} />
            <span>I have saved the delivery code. I understand it cannot be recovered if I lose it; this browser keeps a copy too, but only this browser.</span>
          </label>
        </div>
      )}
      {!on && <p className="text-sm text-muted-foreground">Without a code, only your wallet can release the payment.</p>}
    </div>
  )
}

/** The code as the recipient gets it: a QR code and a link to the delivery page, with the words that go with it. */
export function DeliveryCodeCard({ workspace, id, code, compact = false }: { workspace: bigint; id: bigint; code: DeliveryCode; compact?: boolean }) {
  // Rendered only after the person acted in the browser, so the origin is at hand.
  const [origin] = useState(() => (typeof window === "undefined" ? "" : window.location.origin))
  const [qr, setQr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const link = origin ? deliveryLink(origin, workspace, id, code) : ""
  useEffect(() => {
    if (!link) return
    // Dark modules on a light ground with a full quiet zone, whatever the theme, so any phone camera reads it.
    QRCode.toDataURL(link, { margin: 4, width: 512, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }).then(setQr).catch(() => setQr(null))
  }, [link])
  const words = `Delivery code for held payment #${id} in workspace #${workspace}.\n\nOpen this link, or scan the QR code, at the handover and press “Confirm delivery”:\n${link}\n\nGive this to the person who will receive the goods. Do not send it to the supplier before delivery. Anyone who has it can release the payment to the supplier, and nothing else.`
  return (
    <div className={compact ? "grid gap-4" : "grid gap-5 sm:grid-cols-[14rem_minmax(0,1fr)]"}>
      <div className="mx-auto w-full max-w-56 rounded-xl bg-white p-2 sm:mx-0">
        {/* A data URL made here; there is nothing for an image loader to optimise. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {qr ? <img src={qr} alt="QR code that opens the delivery link" className="block aspect-square w-full" /> : <div className="aspect-square w-full animate-pulse rounded-lg bg-secondary" aria-hidden />}
      </div>
      <div className="grid content-start gap-3">
        <p className="max-w-[56ch] text-sm">
          Give this to the person who will receive the goods, as the QR code, the link or a print. Do not send it to the supplier before delivery. Anyone who has it can release the payment to the supplier, and nothing else.
        </p>
        <p className="t-mono break-all rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">{link || "…"}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => copyText(link, "Delivery link").then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })} disabled={!link}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy link"}</Button>
          <Button type="button" size="sm" variant="secondary" disabled={!qr} onClick={() => qr && download(`bitregalo-delivery-code-${workspace}-${id}.png`, qr)}><Download />Download</Button>
          <Button type="button" size="sm" variant="secondary" disabled={!link} onClick={() => print(`Delivery code for held payment #${id}`, words, qr)}><Printer />Print</Button>
        </div>
        <p className="text-xs text-subtle">The code is kept in this browser only, so you can show it again from the held payment&apos;s page here. Nowhere else has it.</p>
      </div>
    </div>
  )
}
