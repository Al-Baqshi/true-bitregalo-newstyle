"use client"
import { useRef, useState, type KeyboardEvent } from "react"
import { ArrowRight, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { BUYER, EscrowPanel, FIRST_DEAL, type Deal } from "./escrow-demo"
import { Chip, fmt, moveCls } from "./demo-parts"

/*
 * Three building blocks, each doing its one job, in the first screen of the site.
 *
 *   Escrow   a payment held until the work is done; only three things can happen to it.
 *   Request  "I need this": suppliers answer with a price and a time, the buyer chooses one.
 *   Listing  "I offer this": a fixed price and time, taken as it stands.
 *
 * A chosen offer or a taken listing hands its amount to the escrow tab, so the three
 * read as one story: agree on the work, then hold the payment until it is done. Each
 * step is a record; the captions say which.
 * Every name and amount is made up, and the caption says so.
 */
type Tab = "escrow" | "request" | "listing"
const TABS: { key: Tab; label: string }[] = [
  { key: "escrow", label: "Escrow" },
  { key: "request", label: "Request" },
  { key: "listing", label: "Listing" },
]
const CAPTION: Record<Tab, string> = {
  escrow:
    "An example with made-up names. The buyer can only release; the supplier can only hand back; after the deadline the payment can only return to the buyer, and anyone can trigger that. Nobody can send it anywhere else, including BitRegalo.",
  request: "An example with made-up names. The request, every offer and the buyer's choice are public records. None of them can be edited afterwards.",
  listing: "An example with made-up names. A listing can be open to anyone, as here, or made for one named buyer.",
}

export function HeroDemo({ className }: { className?: string }) {
  const [tab, setTab] = useState<Tab>("escrow")
  const [deal, setDeal] = useState<Deal>(FIRST_DEAL)
  const [run, setRun] = useState(0)
  const [moved, setMoved] = useState(false)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  const show = (t: Tab) => {
    setMoved(true)
    setTab(t)
  }
  const toEscrow = (d: Deal) => {
    setDeal(d)
    setRun((r) => r + 1)
    show("escrow")
  }
  // Arrow keys move between the tabs, as they do in any tab list.
  const onKey = (e: KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.key === tab)
    const next = e.key === "ArrowRight" ? (i + 1) % TABS.length : e.key === "ArrowLeft" ? (i + TABS.length - 1) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : -1
    if (next < 0) return
    e.preventDefault()
    show(TABS[next].key)
    tabs.current[next]?.focus()
  }

  return (
    <figure className={cn("rounded-2xl border border-border bg-card p-4 shadow-raised sm:p-6", className)}>
      <div role="tablist" aria-label="Examples of the building blocks" onKeyDown={onKey} className="grid grid-cols-3 gap-1 border-b border-border pb-3 sm:pb-4">
        {TABS.map((t, i) => {
          const on = t.key === tab
          return (
            <button
              key={t.key}
              ref={(el) => { tabs.current[i] = el }}
              type="button"
              role="tab"
              id={`demo-tab-${t.key}`}
              aria-selected={on}
              aria-controls="demo-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => show(t.key)}
              className={cn(
                "flex min-h-10 items-center justify-center rounded-lg px-2 text-sm outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring pointer-coarse:min-h-11",
                on ? "bg-secondary font-semibold text-foreground" : "font-[520] text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div
        key={`${tab}-${run}`}
        role="tabpanel"
        id="demo-panel"
        aria-labelledby={`demo-tab-${tab}`}
        className={cn("mt-4 sm:mt-5 sm:min-h-[25rem]", moved && "rise")}
      >
        {tab === "escrow" && <EscrowPanel deal={deal} />}
        {tab === "request" && <RequestPanel onEscrow={toEscrow} />}
        {tab === "listing" && <ListingPanel onEscrow={toEscrow} />}
      </div>

      <figcaption className="mt-4 border-t border-border pt-4 text-xs text-subtle">{CAPTION[tab]}</figcaption>
    </figure>
  )
}

/* ── Request: offers come in, the buyer chooses one ─────────────────────────── */
const OFFERS = [
  { name: "Kauri Framing", days: 15, amount: 12500 },
  { name: "Totara Builders", days: 10, amount: 13900 },
  { name: "Southern Truss", days: 24, amount: 11800 },
]

function RequestPanel({ onEscrow }: { onEscrow: (d: Deal) => void }) {
  const [chosen, setChosen] = useState<number | null>(null)
  const pick = chosen === null ? null : OFFERS[chosen]
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <p className="min-w-0 text-sm text-muted-foreground">Request #318 · posted by {BUYER}</p>
        <Chip tone={pick ? "good" : "gold"}>{pick ? "Awarded" : "Open"}</Chip>
      </div>
      <p className="flare mt-3 text-2xl font-[620] leading-tight">{FIRST_DEAL.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">Offers in USDT · settles by escrow</p>

      <ul className="mt-4 divide-y divide-border border-y border-border" aria-label="Offers">
        {OFFERS.map((o, i) => {
          const lost = pick !== null && chosen !== i
          return (
            <li key={o.name} className="flex min-h-15 items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-[560] transition-colors duration-300", lost ? "text-subtle" : "text-foreground")}>{o.name}</p>
                <p className="text-xs text-muted-foreground">Done in {o.days} days</p>
              </div>
              <span className={cn("t-num text-sm font-[560] transition-colors duration-300", lost ? "text-subtle" : "text-foreground")}>{fmt(o.amount)}</span>
              <span className="flex w-[5.75rem] shrink-0 justify-end">
                {pick === null ? (
                  <button type="button" className={cn(moveCls, "px-3")} onClick={() => setChosen(i)} aria-label={`Choose ${o.name}`}>Choose</button>
                ) : chosen === i ? (
                  <Chip tone="good">Chosen</Chip>
                ) : (
                  <span className="text-xs text-subtle">Not chosen</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-4">
        <p className="min-h-15 max-w-[46ch] text-sm text-foreground" role="status" aria-live="polite">
          {pick
            ? `${BUYER} chose ${pick.name}. The choice is on the record, and ${fmt(pick.amount)} USDT goes into escrow before the work starts.`
            : "Three suppliers answered with a price and a time. The buyer chooses one."}
        </p>
        {pick && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className={cn(moveCls, "gap-2")} onClick={() => onEscrow({ ...FIRST_DEAL, supplier: pick.name, amount: pick.amount })}>
              See the escrow<ArrowRight className="size-4" aria-hidden />
            </button>
            <button type="button" className={cn(moveCls, "gap-2")} onClick={() => setChosen(null)}>
              <RotateCcw className="size-4" aria-hidden />Start again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Listing: a fixed price, taken as it stands ─────────────────────────────── */
const LISTING = { id: 77, title: "Site survey and report", supplier: "Ridgeline Surveys", amount: 1200, days: 5 }

function ListingPanel({ onEscrow }: { onEscrow: (d: Deal) => void }) {
  const [taken, setTaken] = useState(false)
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <p className="min-w-0 text-sm text-muted-foreground">Listing #{LISTING.id} · offered by {LISTING.supplier}</p>
        <Chip tone={taken ? "good" : "gold"}>{taken ? "Taken" : "Open"}</Chip>
      </div>
      <p className="flare mt-3 text-2xl font-[620] leading-tight">{LISTING.title}</p>

      <p className="mt-4 flex items-baseline gap-2">
        <span className="t-num text-[2.5rem] font-[620] leading-none tracking-tight sm:text-5xl">{fmt(LISTING.amount)}</span>
        <span className="text-base font-[560] text-muted-foreground">USDT</span>
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">A fixed price, set by the supplier</p>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-border py-3.5">
        <div><dt className="text-xs text-muted-foreground">Delivered in</dt><dd className="t-num text-sm font-[560]">{LISTING.days} days</dd></div>
        <div><dt className="text-xs text-muted-foreground">Open to</dt><dd className="text-sm font-[560]">Anyone</dd></div>
        <div><dt className="text-xs text-muted-foreground">Settles</dt><dd className="text-sm font-[560]">By escrow</dd></div>
      </dl>

      <div className="mt-4">
        <p className="min-h-15 max-w-[46ch] text-sm text-foreground" role="status" aria-live="polite">
          {taken
            ? `${BUYER} took it at the listed price. ${fmt(LISTING.amount)} USDT now waits in escrow until the report is delivered.`
            : "The supplier set the price and the time. Any buyer can take it as it stands, with no back and forth."}
        </p>
        {taken ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className={cn(moveCls, "gap-2")} onClick={() => onEscrow({ id: 1043, title: LISTING.title, supplier: LISTING.supplier, amount: LISTING.amount })}>
              See the escrow<ArrowRight className="size-4" aria-hidden />
            </button>
            <button type="button" className={cn(moveCls, "gap-2")} onClick={() => setTaken(false)}>
              <RotateCcw className="size-4" aria-hidden />Start again
            </button>
          </div>
        ) : (
          <button type="button" className={cn(moveCls, "mt-3")} onClick={() => setTaken(true)}>
            Take it at this price
          </button>
        )}
      </div>
    </div>
  )
}
