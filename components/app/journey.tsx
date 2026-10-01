"use client"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type JourneyStep = { title: string; note?: string; state: "done" | "current" | "next" | "skipped" }

/** Where something is in its life, and what comes next — with real dates in the notes. */
export function Journey({ steps }: { steps: JourneyStep[] }) {
  return (
    <ol className="grid gap-5 sm:grid-flow-col sm:auto-cols-fr sm:gap-0">
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-3.5 sm:block sm:pr-5" aria-current={s.state === "current" ? "step" : undefined}>
          {i < steps.length - 1 && (
            <span className={cn("absolute left-[15px] top-8 h-full w-px sm:left-8 sm:top-[15px] sm:h-px sm:w-[calc(100%-2rem)]", s.state === "done" ? "bg-success" : "bg-border")} aria-hidden />
          )}
          <span className={cn("t-num relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-[600]",
            s.state === "done" ? "border-success bg-success-fill text-success"
              : s.state === "current" ? "border-gold-line bg-gold-fill text-gold"
              : "border-border bg-card text-subtle")}>
            {s.state === "done" ? <Check className="size-4" /> : i + 1}
          </span>
          <span className="sm:mt-3 sm:block">
            <span className={cn("block text-sm", s.state === "current" ? "font-[620] text-foreground" : s.state === "skipped" ? "text-subtle line-through" : s.state === "done" ? "font-[520] text-foreground" : "text-muted-foreground")}>{s.title}</span>
            {s.note && <span className="mt-0.5 block text-xs text-muted-foreground">{s.note}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function when(ts: bigint | number) {
  const d = new Date(Number(ts) * 1000)
  return d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}
export function inWords(ts: bigint | number) {
  const s = Number(ts) - Math.floor(Date.now() / 1000)
  const past = s < 0
  const a = Math.abs(s)
  const txt = a < 3600 ? `${Math.max(1, Math.round(a / 60))} min` : a < 86400 ? `${Math.round(a / 3600)} h` : `${Math.round(a / 86400)} days`
  return past ? `${txt} ago` : `in ${txt}`
}
