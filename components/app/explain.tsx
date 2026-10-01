"use client"
import { useMemo, useState } from "react"
import { ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { inputCls } from "@/components/app/ui"
import { cn } from "@/lib/utils"

/** The whole product in four steps, in the words a first-time visitor uses. */
export function HowItWorks() {
  const steps = [
    { title: "Ask", body: "Post what you need: a job, supplies, a service. It gets a public record with a date." },
    { title: "Get offers", body: "Suppliers answer with their price and how long they need. Every offer is on the record too." },
    { title: "Choose", body: "You pick the offer you want. Nobody can change it afterwards, not even BitRegalo." },
    { title: "Pay your way", body: "Just record it, pay straight away, or hold the money safely until the work is done." },
  ]
  return (
    <ol className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title}>
          <div className="flex items-center gap-3" aria-hidden>
            <span className="t-num flex size-8 shrink-0 items-center justify-center rounded-full border border-border-strong text-sm font-[600]">{i + 1}</span>
            <span className={cn("h-px flex-1 bg-border", i === steps.length - 1 && "lg:invisible")} />
          </div>
          <p className="t-subheading mt-3.5">{s.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
        </li>
      ))}
    </ol>
  )
}

/** The three settlement options, explained with what actually happens to the money. */
export function SettleModes({ compact = false }: { compact?: boolean }) {
  const modes = [
    { name: "Just record it", tag: "No money moves", body: "The request, the offers and your choice are written down for good. Useful when payment happens elsewhere, or when the proof is what matters: tenders, grants, approvals." },
    { name: "Pay straight away", tag: "Direct payment", body: "The moment you choose an offer, the supplier is paid from your wallet. Simple, for work you trust or goods already delivered." },
    { name: "Hold it safely", tag: "Escrow", body: "When you choose, the money leaves your wallet and is locked in the workspace's vault. You release it when the work is done. The supplier can hand it back if they can't deliver. After the deadline it can only go back to you, and anyone can trigger that." },
  ]
  return (
    <div className={cn("grid gap-px overflow-hidden rounded-xl border border-border bg-border", !compact && "md:grid-cols-3")}>
      {modes.map((m) => (
        <div key={m.name} className="bg-card px-5 py-5 sm:px-6">
          <p className="t-subheading">{m.name}</p>
          <p className="mt-0.5 text-sm font-[560] text-gold">{m.tag}</p>
          <p className="mt-2.5 text-sm text-muted-foreground">{m.body}</p>
        </div>
      ))}
    </div>
  )
}

const GLOSSARY: [string, string][] = [
  ["Workspace", "An organisation's own space on BitRegalo: its requests, offers, payments and tokens, run by an admin. Behind the scenes it is a pair of contracts: one for the records, one vault that holds escrowed money."],
  ["Request", "“I need this.” You describe it, choose how it will be paid, and set how long offers stay open. Also called an RFP (request for proposals)."],
  ["Offer (on a request)", "A supplier's answer to a request: their price and how many days they need. You choose one."],
  ["Listing", "The other direction: a supplier advertises what they sell, at a fixed price, and a buyer takes it. Can be open to anyone or aimed at one buyer."],
  ["Escrow", "Money held by the vault contract until the buyer releases it or the supplier hands it back. After the deadline it can only go back to the buyer. No person holds it: not BitRegalo, not the workspace admin."],
  ["Private wording", "Only a fingerprint of the text is stored, so the words are not readable on-chain. Everything else (who posted, the offers, amounts and payments) is still public, as on any blockchain."],
  ["Project", "A name that groups related requests, listings and tokens: a site, a programme, a product line."],
  ["Token", "A currency or credit a workspace creates for itself: vouchers, credits, memberships. A workspace can accept it as payment."],
  ["Treasury (workspace)", "Your organisation's own money box on-chain, created with the workspace and owned by its admin. Sales, redemptions and payment links land there. BitRegalo has no function on it at all."],
  ["Utility sale", "You put one of your tokens up at a price in a stablecoin. Buyers pay into your treasury and receive the tokens in the same transaction. Free sales work too."],
  ["Redeem", "A holder hands tokens back to your treasury with a reference: an order number, a seat, a coffee. That is how a utility is spent. No fee is charged."],
  ["Payment link", "A link or QR code that says who gets paid, in what, how much and why. Nothing is created on-chain until someone opens it and signs."],
  ["Platform fee", "A small percentage BitRegalo takes from each payment the supplier receives. Fixed per workspace when it is created."],
  ["Service fee", "A flat amount added to each payment, paid by the buyer. It covers the network costs BitRegalo pays on users' behalf."],
  ["Testnet", "A practice copy of the blockchain. The money here has no value, so you can try everything freely."],
]

/** Every word the app uses, with a filter. Each term opens in place. */
export function Glossary() {
  const [q, setQ] = useState("")
  const [open, setOpen] = useState<string | null>(null)
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return needle ? GLOSSARY.filter(([term, def]) => term.toLowerCase().includes(needle) || def.toLowerCase().includes(needle)) : GLOSSARY
  }, [q])
  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Find a word</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
        <input className={cn(inputCls, "pl-10")} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a word" />
      </label>
      <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {shown.map(([term, def]) => {
          const isOpen = open === term || (q.trim() !== "" && shown.length <= 3)
          return (
            <div key={term}>
              <button onClick={() => setOpen(open === term ? null : term)} aria-expanded={isOpen}
                className="flex min-h-12 w-full items-center justify-between gap-4 px-5 py-3 text-left text-base font-[560] transition-colors hover:bg-secondary/60">
                {term}
                <ChevronDown className={cn("size-4 shrink-0 text-subtle transition-transform duration-200", isOpen && "rotate-180")} />
              </button>
              {isOpen && <p className="max-w-[68ch] px-5 pb-4 text-sm text-muted-foreground">{def}</p>}
            </div>
          )
        })}
        {shown.length === 0 && <p className="px-5 py-6 text-sm text-muted-foreground">No word matches “{q}”.</p>}
      </div>
    </div>
  )
}

/** A short explanation at the top of a page that a returning visitor can put away. */
export function Explainer({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const key = `bitregalo:explainer:${id}`
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(key) === "1" } catch { return false } })
  if (hidden) {
    return (
      <Button variant="link" className="mb-5 text-sm" onClick={() => { setHidden(false); try { localStorage.removeItem(key) } catch {} }}>
        {title}
      </Button>
    )
  }
  return (
    <div className="mb-7 rounded-xl bg-secondary px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex items-start justify-between gap-4">
        <p className="t-subheading pt-1">{title}</p>
        <Button variant="ghost" size="sm" className="-mr-2 -mt-1 shrink-0 text-muted-foreground" onClick={() => { setHidden(true); try { localStorage.setItem(key, "1") } catch {} }}>
          Hide
        </Button>
      </div>
      <div className="mt-1.5 max-w-[68ch] space-y-2 text-sm text-foreground/85 [&_b]:font-[620] [&_b]:text-foreground">{children}</div>
    </div>
  )
}
