"use client"
import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

/*
 * The mechanism, shown rather than described: one escrow, and the only three things
 * that can ever happen to it. Each party's single button sits under that party, and
 * the money moves the one way that button allows.
 *
 * Everything here is an illustration. The names and the amount are made up.
 */
type State = "held" | "released" | "handedBack" | "expired"

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
    line: "The supplier could not deliver and handed it back. The buyer has the money again.",
  },
  expired: {
    status: "Returned",
    where: "Back with the buyer",
    line: "The deadline passed with no decision. From then on the money can only go back to the buyer, and anyone can trigger that return.",
  },
}

const POSITION: Record<State, string> = {
  held: "translateX(0)",
  released: "translateX(50%)",
  handedBack: "translateX(-50%)",
  expired: "translateX(-50%)",
}

const STATIONS = [
  { role: "Buyer", name: "Harbour Build" },
  { role: "Contract", name: "Holds it" },
  { role: "Supplier", name: "Kauri Framing" },
] as const

export function EscrowDemo({ className }: { className?: string }) {
  const [state, setState] = useState<State>("held")
  const c = COPY[state]
  const resting = state === "held" ? 1 : state === "released" ? 2 : 0
  const move = "flex min-h-11 w-full items-center justify-center rounded-lg border border-border-strong px-2 text-sm font-[560] outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-secondary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
  return (
    <figure className={cn("rounded-2xl border border-border bg-card p-5 shadow-raised sm:p-7", className)}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Escrow #1042 · Roof framing, stage 2</p>
        <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-[560] transition-colors duration-300",
          state === "held" ? "bg-gold-fill text-gold" : state === "released" ? "bg-success-fill text-success" : "bg-secondary text-muted-foreground")}>
          <span className={cn("size-1.5 rounded-full", state === "held" ? "bg-gold-line" : state === "released" ? "bg-success" : "bg-subtle")} aria-hidden />
          {c.status}
        </span>
      </div>

      <p className="mt-4 flex items-baseline gap-2">
        <span className="t-num text-[2.5rem] font-[620] leading-none tracking-[-0.025em] sm:text-5xl">12,500.00</span>
        <span className="text-base font-[560] text-muted-foreground">USDT</span>
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">{c.where}</p>

      {/* Where the money is. The coin slides to whoever ends up with it. */}
      <div className="relative mt-8" aria-hidden>
        <div className="absolute inset-x-[16.666%] top-[0.6875rem] h-0.5 rounded-full bg-border" />
        <div className="grid grid-cols-3">
          {STATIONS.map((s, i) => (
            <div key={s.role} className="flex flex-col items-center px-1 text-center">
              <span className={cn("relative z-10 size-6 rounded-full border-2 bg-card transition-colors duration-300", resting === i ? "border-gold-line" : "border-border-strong/60")} />
              <span className="mt-3 text-sm font-semibold">{s.role}</span>
              <span className="text-xs text-muted-foreground">{s.name}</span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-[16.666%] top-0 h-6 transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: POSITION[state] }}>
          <span className="absolute left-1/2 top-0 z-20 flex size-6 -translate-x-1/2 items-center justify-center rounded-full bg-gold-line shadow-[0_0_0_4px_var(--card)]">
            <span className="size-2.5 rounded-full border-2 border-[#17130a]/55" />
          </span>
        </div>
      </div>

      <div className="mt-6 min-h-[8.25rem] border-t border-border pt-5 sm:min-h-[7.25rem]">
        <p className="max-w-[46ch] text-sm text-foreground" role="status" aria-live="polite">{c.line}</p>
        {state === "held" ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button className={move} onClick={() => setState("released")}>Release</button>
            <button className={move} onClick={() => setState("expired")}><span className="sm:hidden">Expire</span><span className="hidden sm:inline">Let it expire</span></button>
            <button className={move} onClick={() => setState("handedBack")}>Hand back</button>
          </div>
        ) : (
          <button className={cn(move, "mt-4 w-auto gap-2 px-4")} onClick={() => setState("held")}>
            <RotateCcw className="size-4" />Start again
          </button>
        )}
      </div>
      <figcaption className="mt-4 text-xs text-subtle">
        An example with made-up names. The buyer can only release; the supplier can only hand back; after the deadline the money can only return to the buyer. Nobody can send it anywhere else, including BitRegalo.
      </figcaption>
    </figure>
  )
}
