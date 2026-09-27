"use client"
import { Check } from "lucide-react"

export type JourneyStep = { title: string; note?: string; state: "done" | "current" | "next" | "skipped" }

/** Where something is in its life, and what comes next — with real dates in the notes. */
export function Journey({ steps }: { steps: JourneyStep[] }) {
  return (
    <ol className="grid gap-4 sm:grid-flow-col sm:auto-cols-fr sm:gap-0">
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-3 sm:block sm:pr-4">
          {i < steps.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%)] w-px sm:left-7 sm:top-[13px] sm:h-px sm:w-[calc(100%-1.75rem)] ${s.state === "done" ? "bg-accent/60" : "bg-border"}`} />}
          <span className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] ${
            s.state === "done" ? "border-accent/70 bg-accent/15 text-accent" : s.state === "current" ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground"}`}>
            {s.state === "done" ? <Check className="size-3.5" /> : <span className="bq-mono">{i + 1}</span>}
          </span>
          <span className="sm:mt-3 sm:block">
            <span className={`block text-sm ${s.state === "current" ? "font-medium text-foreground" : s.state === "skipped" ? "text-muted-foreground line-through" : s.state === "done" ? "text-foreground" : "text-muted-foreground"}`}>{s.title}</span>
            {s.note && <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{s.note}</span>}
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
