"use client"
import Link from "next/link"
import { formatUnits } from "viem"
import { explorerAddress, short } from "@/lib/bitregalo/config"

export function Card({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/80 p-6">
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          {title && <h2 className="bq-label">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
export function PageHead({ eyebrow, title, intro, action }: { eyebrow: string; title: string; intro?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="bq-label">{eyebrow}</p>
        <h1 className="bq-display mt-2 text-3xl font-semibold text-balance sm:text-4xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--bq-ivory-dim)]">{intro}</p>}
      </div>
      {action}
    </div>
  )
}
export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 px-5 py-4">
      <div className="bq-label text-[9.5px]">{label}</div>
      <div className="bq-display mt-2 text-3xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}
export function Addr({ a }: { a: string }) {
  if (!a || /^0x0{40}$/.test(a)) return <span className="text-muted-foreground">—</span>
  return <a className="bq-mono text-xs text-[color:var(--bq-ivory-dim)] underline-offset-2 hover:text-primary hover:underline" href={explorerAddress(a)} target="_blank" rel="noreferrer">{short(a)}</a>
}
export function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "accent" | "good" | "bad" }) {
  const cls = {
    muted: "border-border text-muted-foreground",
    accent: "border-primary/50 text-primary",
    good: "border-accent/50 text-accent",
    bad: "border-destructive/50 text-destructive",
  }[tone]
  return <span className={`bq-mono whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] ${cls}`}>{children}</span>
}
export function Amount({ value, decimals = 18, symbol = "" }: { value: bigint; decimals?: number; symbol?: string }) {
  const s = formatUnits(value, decimals)
  const [i, f = ""] = s.split(".")
  const frac = f.replace(/0+$/, "").slice(0, 4)
  return <span className="tabular-nums">{Number(i).toLocaleString()}{frac ? "." + frac : ""}{symbol ? ` ${symbol}` : ""}</span>
}
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}
export const inputCls = "w-full rounded-lg border border-border bg-input px-3.5 py-2.5 text-sm outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/15"
export function Row({ children, href }: { children: React.ReactNode; href?: string }) {
  const inner = <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3.5">{children}</div>
  return href
    ? <Link href={href} className="-mx-3 block rounded-lg border-b border-border px-3 transition last:border-0 hover:bg-secondary/50">{inner}</Link>
    : <div className="border-b border-border last:border-0">{inner}</div>
}
export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[color:var(--bq-line-strong)] px-6 py-10 text-center">
      <p className="bq-display text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
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
