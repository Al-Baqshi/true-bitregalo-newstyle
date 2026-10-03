"use client"
import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { toast } from "sonner"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

/** A link to send someone: the address in full, a copy button and a QR code a phone camera can read. */
export function ShareLink({ path, title, children }: { path: string; title: string; children?: React.ReactNode }) {
  const [link, setLink] = useState("")
  const [qr, setQr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => setLink(new URL(path, window.location.origin).toString()), [path])
  useEffect(() => {
    if (!link) return
    // Dark modules on a white ground with a full quiet zone, whatever the theme, so any camera reads it.
    QRCode.toDataURL(link, { margin: 4, width: 480, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }).then(setQr).catch(() => setQr(null))
  }, [link])
  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success("Link copied")
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Could not copy. Select the link and copy it yourself.")
    }
  }
  return (
    <div className="mt-5 grid gap-5 border-t border-border pt-5 text-foreground sm:grid-cols-[minmax(0,1fr)_9.5rem] sm:items-start">
      <div className="min-w-0">
        <p className="t-subheading">{title}</p>
        {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
        <p className="t-mono mt-3 break-all rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">{link || path}</p>
        <Button className="mt-3" variant="secondary" onClick={copy} aria-live="polite" disabled={!link}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
      <div className="w-full max-w-40 rounded-xl bg-white p-1.5 sm:max-w-none">
        {qr ? <img src={qr} alt="QR code that opens this link" className="block aspect-square w-full" /> : <div className="aspect-square w-full animate-pulse rounded-lg bg-secondary" aria-hidden />}
      </div>
    </div>
  )
}
