"use client"
import Link from "next/link"
import { formatUnits } from "viem"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { explorerAddress, short } from "@/lib/bitregalo/config"
import { cn } from "@/lib/utils"

/*
 * The building blocks every app page is made of. The look is a statement, not a
 * dashboard: a clear title, sections separated by space, records as ledger rows with
 * the amount on the right, and status said in words.
 */

/** Page title, one line of plain explanation, and the page's main action. */
export function PageHead({
  title,
  intro,
  action,
  back,
}: {
  /** Kept so older pages compile; the workspace name already lives in the navigation. */
  eyebrow?: string
  title: React.ReactNode
  intro?: React.ReactNode
  action?: React.ReactNode
  back?: { href: string; label: string }
}) {
  return (
    <header className="mb-8">
      {back && (
        <Link href={back.href} className="-ml-1 mb-3 inline-flex min-h-9 items-center gap-1.5 rounded-md px-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 max-w-[62ch]">
          <h1 className="t-title">{title}</h1>
          {intro && <p className="mt-2.5 text-base text-muted-foreground">{intro}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
    </header>
  )
}

/** A titled part of a page with no box around it. Reach for this before `Card`. */
export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0 max-w-[62ch]">
            {title && <h2 className="t-heading">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

/** A surface that holds one thing: a list of records, a form, a set of facts. Never nest two. */
export function Card({
  title,
  description,
  children,
  action,
  flush = false,
  className,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
  /** Let rows run edge to edge (the rows bring their own padding). */
  flush?: boolean
  className?: string
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 sm:px-6">
          <div className="min-w-0">
            {title && <h2 className="t-subheading">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={flush ? "" : "px-5 py-4 sm:px-6 sm:py-5"}>{children}</div>
    </section>
  )
}

/** A row of headline numbers, set like the totals on a statement. */
export function Stats({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <dl className="-mb-px -mr-px grid grid-cols-2 sm:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">{children}</dl>
    </div>
  )
}
export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="border-b border-r border-border px-4 py-3.5 sm:px-5 sm:py-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="t-figure mt-1">{value}</dd>
      {hint && <dd className="mt-1 text-xs text-subtle">{hint}</dd>}
    </div>
  )
}

/** A wallet or contract address: shortened, monospaced, linked to the public explorer. */
export function Addr({ a, className }: { a: string; className?: string }) {
  if (!a || /^0x0{40}$/.test(a)) return <span className="text-subtle">—</span>
  // A private network may have no public block explorer: show the address without a link.
  if (!explorerAddress(a)) return <span className={cn("t-mono whitespace-nowrap text-muted-foreground", className)} title={a}>{short(a)}</span>
  return (
    <a
      className={cn("t-mono relative z-10 whitespace-nowrap rounded-sm text-muted-foreground underline decoration-border-strong/60 decoration-1 underline-offset-[3px] transition-colors hover:text-foreground hover:decoration-foreground", className)}
      href={explorerAddress(a)}
      target="_blank"
      rel="noreferrer"
      title={`${a} — open on the block explorer`}
    >
      {short(a)}
    </a>
  )
}

const TONE = {
  muted: { chip: "bg-secondary text-muted-foreground", dot: "bg-subtle" },
  accent: { chip: "bg-gold-fill text-gold", dot: "bg-gold-line" },
  good: { chip: "bg-success-fill text-success", dot: "bg-success" },
  bad: { chip: "bg-destructive-fill text-destructive", dot: "bg-destructive" },
} as const
export type Tone = keyof typeof TONE

/** The state of a record, in a word. Gold is open or in progress, emerald is settled, red failed. */
export function Pill({ children, tone = "muted", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-[560]", TONE[tone].chip, className)}>
      <span className={cn("size-1.5 rounded-full", TONE[tone].dot)} aria-hidden />
      {children}
    </span>
  )
}

export function Amount({ value, decimals = 18, symbol = "" }: { value: bigint; decimals?: number; symbol?: string }) {
  const s = formatUnits(value, decimals)
  const [i, f = ""] = s.split(".")
  const frac = f.replace(/0+$/, "").slice(0, 4)
  return (
    <span className="t-num whitespace-nowrap">
      {Number(i).toLocaleString()}
      {frac ? "." + frac : ""}
      {symbol ? ` ${symbol}` : ""}
    </span>
  )
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="t-label mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-sm text-muted-foreground">{hint}</span>}
    </label>
  )
}
export const inputCls =
  "h-11 w-full rounded-lg border border-border-strong bg-card px-3.5 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-subtle hover:border-foreground/60 focus:border-ring focus:ring-[3px] focus:ring-ring/25 disabled:bg-secondary disabled:text-subtle"

/**
 * One record in a list. The whole row is the link; anything interactive inside it
 * (an address, a button) stays clickable on top.
 */
export function LedgerRow({
  href,
  title,
  meta,
  amount,
  status,
  lead,
}: {
  href?: string
  title: React.ReactNode
  /** Who, how and when: the secondary line. */
  meta?: React.ReactNode
  /** Right-hand figure, usually an <Amount />. */
  amount?: React.ReactNode
  /** Right-hand state, usually a <Pill />. */
  status?: React.ReactNode
  /** A small leading mark such as the record number. */
  lead?: React.ReactNode
}) {
  return (
    <div className={cn("group relative flex items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0 sm:px-6", href && "transition-colors hover:bg-secondary/60")}>
      {lead && <span className="t-mono t-num hidden w-9 shrink-0 text-subtle sm:block">{lead}</span>}
      <div className="min-w-0 flex-1">
        <div className="text-base font-[560] leading-snug">
          {href ? (
            <Link href={href} className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:after:rounded-lg focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring">
              {title}
            </Link>
          ) : (
            title
          )}
        </div>
        {meta && <div className="mt-0.5 text-sm text-muted-foreground">{meta}</div>}
      </div>
      {(amount || status) && (
        <div className="flex shrink-0 flex-col items-end gap-1 text-right sm:flex-row sm:items-center sm:gap-4">
          {amount && <span className="text-base font-[560]">{amount}</span>}
          {status}
        </div>
      )}
      {href && <ChevronRight className="hidden size-4 shrink-0 text-subtle transition-transform duration-150 group-hover:translate-x-0.5 sm:block" aria-hidden />}
    </div>
  )
}

/** Nothing here yet: say what this place is for and offer the first step. */
export function Empty({ title, body, action, className }: { title: string; body: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-6 py-10 text-center", className)}>
      <p className="t-subheading">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[46ch] text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

/** Label and value pairs: the terms of a workspace, the details of a receipt. */
export function Facts({ children, columns = 2, className }: { children: React.ReactNode; columns?: 2 | 3 | 4; className?: string }) {
  const cols = columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
  return <dl className={cn("grid gap-x-8 gap-y-5", cols, className)}>{children}</dl>
}
export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-base font-[520]">{children}</dd>
    </div>
  )
}

/** A short message that belongs to the page: a limit, a warning, a thing to know first. */
export function Notice({ tone = "muted", title, children, action }: { tone?: Tone; title?: React.ReactNode; children?: React.ReactNode; action?: React.ReactNode }) {
  const surface = { muted: "bg-secondary", accent: "bg-gold-fill", good: "bg-success-fill", bad: "bg-destructive-fill" }[tone]
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl px-5 py-4", surface)}>
      <div className="min-w-0 max-w-[68ch]">
        {title && <p className="t-subheading">{title}</p>}
        {children && <div className={cn("text-sm text-foreground/85", title && "mt-1")}>{children}</div>}
      </div>
      {action}
    </div>
  )
}

/** Placeholder lines while a list is being read from the chain. */
export function RowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0 sm:px-6">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/5 animate-pulse rounded bg-secondary" />
            <div className="h-3.5 w-3/5 animate-pulse rounded bg-secondary" />
          </div>
          <div className="h-4 w-20 animate-pulse rounded bg-secondary" />
        </div>
      ))}
    </div>
  )
}

export function timeLeft(ts: bigint) {
  const d = Number(ts) - Math.floor(Date.now() / 1000)
  if (d <= 0) return "elapsed"
  if (d < 3600) return `${Math.floor(d / 60)} min`
  if (d < 86400) return `${Math.floor(d / 3600)} h`
  return `${Math.floor(d / 86400)} d`
}
