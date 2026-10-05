"use client"
import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Chip, fmt, moveCls } from "./demo-parts"

/*
 * The mechanism, shown rather than described: one escrow, and the only three things
 * that can ever happen to it. Each party's single button sits under that party, and
 * the payment moves the one way that button allows.
 *
 * Everything here is an illustration. The names and the amounts are made up.
 */
type State = "held" | "released" | "handedBack" | "expired"

export type Deal = { id: number; title: string; supplier: string; amount: number }
export const FIRST_DEAL: Deal = { id: 1042, title: "Roof framing, stage 2", supplier: "Kauri Framing", amount: 12500 }
export const BUYER = "Harbour Build"

const COPY: Record<State, { status: string; where: string; line: string }> = {
  held: {
    status: "Held",
    where: "Locked in the contract",
    line: "Neither side can spend it. Three things can happen next, and only three. Try them.",
  },
  released: {
    status: "Released",
    where: "Paid to the supplier",
    line: "The buyer released it. The supplier is paid, and nobody can take that back.",
  },
  handedBack: {
    status: "Handed back",
    where: "Back with the buyer",
    line: "The supplier could not deliver and handed it back. The buyer has the full amount again.",
  },
  expired: {
    status: "Returned",
    where: "Back with the buyer",
    line: "The deadline passed with no decision, and someone triggered the return. Anyone can. The payment could only go back to the buyer.",
  },
}

const POSITION: Record<State, string> = {
  held: "translateX(0)",
  released: "translateX(50%)",
  handedBack: "translateX(-50%)",
  expired: "translateX(-50%)",
}

export function EscrowPanel({ deal }: { deal: Deal }) {
  const [state, setState] = useState<State>("held")
  const c = COPY[state]
  const resting = state === "held" ? 1 : state === "released" ? 2 : 0
  const stations = [
    { role: "Buyer", name: BUYER },
    { role: "Contract", name: "Holds it" },
    { role: "Supplier", name: deal.supplier },
  ]
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <p className="min-w-0 text-sm text-muted-foreground">Escrow #{deal.id} · {deal.title}</p>
        <Chip tone={state === "held" ? "gold" : state === "released" ? "good" : "muted"}>{c.status}</Chip>
      </div>

      <p className="mt-3 flex items-baseline gap-2">
        <span className="t-num text-[2.5rem] font-[620] leading-none tracking-tight sm:text-5xl">{fmt(deal.amount)}</span>
        <span className="text-base font-[560] text-muted-foreground">USDT</span>
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">{c.where}</p>

      {/* Where the payment is. The coin slides to whoever ends up with it. */}
      <div className="relative mt-7" aria-hidden>
        <div className="absolute inset-x-[16.666%] top-2.75 h-0.5 rounded-full bg-border" />
        <div className="grid grid-cols-3">
          {stations.map((s, i) => (
            <div key={s.role} className="flex flex-col items-center px-1 text-center">
              <span className={cn("relative z-10 size-6 rounded-full border-2 bg-card transition-colors duration-300", resting === i ? "border-gold-line" : "border-border-strong")} />
              <span className="mt-3 text-sm font-semibold">{s.role}</span>
              <span className="text-xs text-muted-foreground">{s.name}</span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-[16.666%] top-0 z-20 h-6 transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: POSITION[state] }}>
          <span className="absolute left-1/2 top-0 z-20 flex size-6 -translate-x-1/2 items-center justify-center rounded-full bg-gold-line shadow-[0_0_0_4px_var(--card)]">
            <span className="size-2.5 rounded-full border-2 border-primary-foreground/55" />
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <p className="min-h-15 max-w-[46ch] text-sm text-foreground" role="status" aria-live="polite">{c.line}</p>
        {state === "held" ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button type="button" className={moveCls} onClick={() => setState("released")}>Release</button>
            <button type="button" className={moveCls} onClick={() => setState("expired")}><span className="sm:hidden">Deadline</span><span className="hidden sm:inline">Deadline passes</span></button>
            <button type="button" className={moveCls} onClick={() => setState("handedBack")}>Hand back</button>
          </div>
        ) : (
          <button type="button" className={cn(moveCls, "mt-3 w-auto gap-2 px-4")} onClick={() => setState("held")}>
            <RotateCcw className="size-4" aria-hidden />Start again
          </button>
        )}
      </div>
    </div>
  )
}
