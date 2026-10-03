"use client"
import { useState } from "react"
import { toast } from "sonner"
import { Check, Copy, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/*
 * Small pieces for the "Connect a platform" page: copying a value, a block of code,
 * one fact with its value in full, a list of link parameters, and a file download.
 */

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    toast.error("Could not copy. Select the text and copy it yourself.")
    return false
  }
}

/** A quiet button that copies `text`. `label` names what is copied, for screen readers. */
export function CopyButton({ text, label, showText = false }: { text: string; label: string; showText?: boolean }) {
  const [done, setDone] = useState(false)
  async function go() {
    if (await copyText(text)) {
      setDone(true)
      toast.success("Copied")
      setTimeout(() => setDone(false), 1500)
    }
  }
  return (
    <Button
      type="button" variant="ghost" size={showText ? "sm" : "icon-sm"} onClick={go} disabled={!text}
      aria-label={showText ? undefined : `Copy ${label}`} title={`Copy ${label}`} aria-live="polite"
      className="text-muted-foreground hover:text-foreground"
    >
      {done ? <Check className="size-4" /> : <Copy className="size-4" />}
      {showText && (done ? "Copied" : "Copy")}
    </Button>
  )
}

/** A link to the public block explorer, as an icon button next to a value. */
export function ExplorerLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
      <a href={href} target="_blank" rel="noreferrer" aria-label={`Open ${label} on the block explorer`} title="Open on the block explorer">
        <ExternalLink className="size-4" />
      </a>
    </Button>
  )
}

/**
 * Code, monospaced, with its file name and a copy button. Long lines scroll inside the
 * block; `wrap` breaks them instead, for links that are one long string.
 */
export function CodeBlock({ name, code, wrap = false, className }: { name: string; code: string; wrap?: boolean; className?: string }) {
  return (
    <figure className={cn("min-w-0 overflow-hidden rounded-xl border border-border bg-card", className)}>
      <figcaption className="flex items-center justify-between gap-3 border-b border-border py-1.5 pl-4 pr-2 sm:pl-5">
        <span className={cn("truncate text-sm text-muted-foreground", /\.\w+$/.test(name) && "t-mono")}>{name}</span>
        <CopyButton text={code} label={name} showText />
      </figcaption>
      <pre className={cn("px-4 py-3.5 text-base leading-[1.6] sm:px-5", wrap ? "whitespace-pre-wrap break-all" : "overflow-x-auto")} tabIndex={0} aria-label={`Code: ${name}`}>
        <code className="t-mono">{code}</code>
      </pre>
    </figure>
  )
}

/**
 * One fact in a list of facts: the label, the value in full (an address wraps rather
 * than being shortened, so it can be checked), then copy and explorer buttons.
 */
export function ValueRow({
  label, hint, value, mono = true, copy, explorer, children,
}: {
  label: string
  hint?: React.ReactNode
  value?: string
  mono?: boolean
  /** What the copy button copies; defaults to `value`. Pass "" for no copy button. */
  copy?: string
  explorer?: string
  children?: React.ReactNode
}) {
  const copied = copy ?? value ?? ""
  return (
    <div className="grid gap-x-6 gap-y-1 border-b border-border px-5 py-3 last:border-b-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:px-6">
      <dt className="pt-1.5 text-sm text-muted-foreground sm:pt-2">{label}</dt>
      <dd className="min-w-0">
        <div className="flex items-start gap-1">
          <span className={cn("min-w-0 flex-1 break-all py-1.5 sm:py-2", mono ? "t-mono text-base" : "text-base font-[520]")}>{children ?? value}</span>
          <span className="flex shrink-0 items-center">
            {copied && <CopyButton text={copied} label={label.toLowerCase()} />}
            {explorer && <ExplorerLink href={explorer} label={label.toLowerCase()} />}
          </span>
        </div>
        {hint && <p className="pb-1 text-sm text-muted-foreground">{hint}</p>}
      </dd>
    </div>
  )
}

/** The parameters a link takes: name on the left, what it does on the right. */
export function Params({ items }: { items: { name: string; body: React.ReactNode }[] }) {
  return (
    <dl className="grid gap-x-5 gap-y-2.5 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
      {items.map((p) => (
        <div key={p.name} className="contents">
          <dt className="t-mono text-base text-foreground">{p.name}</dt>
          <dd className="-mt-1.5 text-sm text-muted-foreground sm:mt-0.5">{p.body}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Saves `text` as a file in the visitor's downloads. Nothing is uploaded anywhere. */
export function saveFile(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** One downloadable file: what it is, its file name, and the button. */
export function DownloadRow({
  title, body, file, onDownload, primary = false,
}: {
  title: string
  body: React.ReactNode
  file: string
  onDownload: () => void
  primary?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-3.5 last:border-b-0 sm:items-center sm:gap-6 sm:px-6">
      <div className="min-w-0">
        <p className="text-base font-[560]">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
        <p className="t-mono mt-1 break-all text-sm text-subtle">{file}</p>
      </div>
      {/* On a phone the button is the icon alone, so the text keeps the width. */}
      <Button type="button" size="sm" variant={primary ? "default" : "secondary"} onClick={onDownload} aria-label={`Download ${file}`} className="max-sm:w-11 max-sm:px-0">
        <Download className="size-4" />
        <span className="max-sm:sr-only">Download</span>
      </Button>
    </div>
  )
}
