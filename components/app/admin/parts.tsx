"use client"
/*
 * Small building blocks for the super admin page that the shared `ui.tsx` does not have:
 * a grid of figures that wraps onto several rows, and a plain data table. Both follow the
 * same surfaces and type roles as `Stats` and `Card`.
 */
import { Amount, Pill, type Tone } from "@/components/app/ui"
import { cn } from "@/lib/utils"
import type { Status } from "./roadmap"
import type { Held, TokenMeta } from "./use-platform"

/** Like `Stats`, but four to a row on wider screens, so a dozen figures stay readable. */
export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <dl className="-mb-px -mr-px grid grid-cols-2 sm:grid-cols-4">{children}</dl>
    </div>
  )
}

/** A plain table of figures. Columns marked `num` are right-aligned with tabular figures. */
export function Table({ columns, caption, children }: { columns: { label: string; num?: boolean }[]; caption: string; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border">
            {columns.map((c) => (
              <th key={c.label} scope="col" className={cn("px-3 py-2.5 text-left font-normal text-muted-foreground first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6", c.num && "text-right")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
export function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-border last:border-b-0">{children}</tr>
}
export function Td({ children, num, className }: { children: React.ReactNode; num?: boolean; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-top first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6", num && "t-num text-right", className)}>{children}</td>
}

/** Several token amounts in one line: "120 tUSD, 4 VOUCH". */
export function Amounts({ held, tokenOf, none = "None" }: { held: Held[]; tokenOf: (a: string) => TokenMeta; none?: string }) {
  if (held.length === 0) return <span className="text-sm font-normal text-muted-foreground">{none}</span>
  return (
    <span className="t-num">
      {held.map((h, i) => {
        const t = tokenOf(h.token)
        return (
          <span key={h.token} className="whitespace-nowrap">
            {i > 0 && ", "}
            <Amount value={h.amount} decimals={t.decimals} symbol={t.symbol} />
          </span>
        )
      })}
    </span>
  )
}

const STATUS_TONE: Record<Status, Tone> = { Done: "good", "In progress": "accent", Next: "muted", "Waiting for you": "accent" }
export function StatusPill({ status }: { status: Status }) {
  return <Pill tone={STATUS_TONE[status]}>{status}</Pill>
}

/** "3 requests", "1 request", or "…" while it is still being read. */
export function plural(n: bigint | number | undefined, one: string, many: string) {
  if (n === undefined) return `… ${many}`
  return `${String(n)} ${Number(n) === 1 ? one : many}`
}

export const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })

/** A heading inside a section, one step below the section's own. */
export function SubHead({ children, description }: { children: React.ReactNode; description?: React.ReactNode }) {
  return (
    <div className="mb-3 max-w-[62ch]">
      <h3 className="t-subheading">{children}</h3>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
