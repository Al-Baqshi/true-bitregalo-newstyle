"use client"
import Link from "next/link"
import { formatUnits } from "viem"
import { explorerAddress, short } from "@/lib/bitregalo/config"

export function Card({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}
export function Addr({ a }: { a: string }) {
  if (!a || /^0x0{40}$/.test(a)) return <span className="text-muted-foreground">—</span>
  return <a className="font-mono text-xs underline-offset-2 hover:underline" href={explorerAddress(a)} target="_blank" rel="noreferrer">{short(a)}</a>
}
export function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "accent" | "good" | "bad" }) {
  const cls = { muted: "border-border text-muted-foreground", accent: "border-accent/50 text-accent", good: "border-emerald-500/50 text-emerald-400", bad: "border-red-500/50 text-red-400" }[tone]
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wider ${cls}`}>{children}</span>
}
export function Amount({ value, decimals = 18, symbol = "" }: { value: bigint; decimals?: number; symbol?: string }) {
  const s = formatUnits(value, decimals)
  const [i, f = ""] = s.split(".")
  return <span className="tabular-nums">{Number(i).toLocaleString()}{f ? "." + f.slice(0, 4) : ""} {symbol}</span>
}
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}
export const inputCls = "w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:border-ring"
export function Row({ children, href }: { children: React.ReactNode; href?: string }) {
  const inner = <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3">{children}</div>
  return href ? <Link href={href} className="block border-b border-border last:border-0 hover:bg-secondary/40 -mx-2 px-2 rounded">{inner}</Link> : <div className="border-b border-border last:border-0">{inner}</div>
}
export function timeLeft(ts: bigint) {
  const d = Number(ts) - Math.floor(Date.now() / 1000)
  if (d <= 0) return "elapsed"
  if (d < 3600) return `${Math.floor(d / 60)} min`
  if (d < 86400) return `${Math.floor(d / 3600)} h`
  return `${Math.floor(d / 86400)} d`
}
