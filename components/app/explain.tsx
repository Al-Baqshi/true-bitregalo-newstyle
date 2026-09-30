"use client"
import { useState } from "react"
import { ChevronDown, FileText, Handshake, Lock, Send, Users, Trophy, Wallet } from "lucide-react"

/** The whole product in four steps, in the words a first-time visitor uses. */
export function HowItWorks() {
  const steps = [
    { icon: <FileText className="size-5" />, title: "Ask", body: "Post what you need — a job, supplies, a service. It gets a public record with a date." },
    { icon: <Users className="size-5" />, title: "Get offers", body: "Suppliers answer with their price and how long they need. Every offer is on the record too." },
    { icon: <Trophy className="size-5" />, title: "Choose", body: "You pick the offer you want. Nobody can change it afterwards — not even BitRegalo." },
    { icon: <Wallet className="size-5" />, title: "Pay your way", body: "Just record it, pay straight away, or hold the money safely until the work is done." },
  ]
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title} className="relative rounded-2xl border border-border bg-card/70 p-5">
          <span className="bq-mono absolute right-5 top-5 text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{s.icon}</span>
          <p className="bq-display mt-4 text-xl font-semibold">{s.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
        </li>
      ))}
    </ol>
  )
}

/** The three settlement options, explained with what actually happens to the money. */
export function SettleModes({ compact = false }: { compact?: boolean }) {
  const modes = [
    { icon: <FileText className="size-5" />, name: "Just record it", tag: "No money moves", body: "The request, the offers and your choice are written down for good. Useful when payment happens elsewhere, or when the proof is what matters — tenders, grants, approvals." },
    { icon: <Send className="size-5" />, name: "Pay straight away", tag: "Direct", body: "The moment you choose an offer, the supplier is paid from your wallet. Simple, for work you trust or goods already delivered." },
    { icon: <Lock className="size-5" />, name: "Hold it safely", tag: "Escrow", body: "When you choose, the money leaves your wallet and is locked in the workspace's vault. You release it when the work is done. The supplier can hand it back if they can't deliver. If neither happens by the deadline, it returns to you automatically." },
  ]
  return (
    <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-3"}`}>
      {modes.map((m) => (
        <div key={m.name} className="rounded-2xl border border-border bg-card/70 p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-[color:var(--bq-ivory-dim)]">{m.icon}</span>
            <span>
              <span className="block text-sm font-medium">{m.name}</span>
              <span className="bq-label text-[9px]">{m.tag}</span>
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
        </div>
      ))}
    </div>
  )
}

const GLOSSARY: [string, string][] = [
  ["Workspace", "An organisation's own space on BitRegalo — its requests, offers, payments and tokens, run by an admin. Behind the scenes it is a pair of contracts: one for the records, one vault that holds escrowed money."],
  ["Request", "“I need this.” You describe it, choose how it will be paid, and set how long offers stay open. Also called an RFP (request for proposals)."],
  ["Offer (on a request)", "A supplier's answer to a request: their price and how many days they need. You choose one."],
  ["Listing", "The other direction: a supplier advertises what they sell, at a fixed price, and a buyer takes it. Can be open to anyone or aimed at one buyer."],
  ["Escrow", "Money held by the vault contract until the buyer releases it, the supplier hands it back, or the deadline returns it to the buyer. No person holds it — not BitRegalo, not the workspace admin."],
  ["Hidden title", "Only a fingerprint of the text is stored, so the words are not readable on-chain. Everything else — who posted, the offers, amounts and payments — is still public, as on any blockchain."],
  ["Project", "A name that groups related requests, listings and tokens — a site, a programme, a product line."],
  ["Token", "A currency or credit a workspace creates for itself — vouchers, credits, memberships. A workspace can accept it as payment."],
  ["Treasury (workspace)", "Your organisation's own money box on-chain, created with the workspace and owned by its admin. Sales, redemptions and payment links land there. BitRegalo has no function on it at all."],
  ["Utility sale", "You put one of your tokens up at a price in a stablecoin. Buyers pay into your treasury and receive the tokens in the same transaction. Free sales work too."],
  ["Redeem", "A holder hands tokens back to your treasury with a reference — an order number, a seat, a coffee. That is how a utility is spent. No fee is charged."],
  ["Payment link", "A link or QR code that says who gets paid, in what, how much and why. Nothing is created on-chain until someone opens it and signs."],
  ["Platform fee", "A small percentage BitRegalo takes from each payment the supplier receives. Fixed per workspace when it is created."],
  ["Service fee", "A flat amount added to each payment, paid by the buyer. It covers the network costs BitRegalo pays on users' behalf."],
  ["Testnet", "A practice copy of the blockchain. The money here has no value, so you can try everything freely."],
]

export function Glossary() {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card/60">
      {GLOSSARY.map(([term, def]) => (
        <button key={term} onClick={() => setOpen(open === term ? null : term)} className="block w-full px-5 py-3.5 text-left">
          <span className="flex items-center justify-between gap-4 text-sm font-medium">
            {term}
            <ChevronDown className={`size-4 text-muted-foreground transition ${open === term ? "rotate-180" : ""}`} />
          </span>
          {open === term && <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{def}</span>}
        </button>
      ))}
    </div>
  )
}

/** A short, dismissible explanation at the top of a page. */
export function Explainer({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const key = `bitregalo:explainer:${id}`
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(key) === "1" } catch { return false } })
  if (hidden) {
    return <button className="bq-label mb-4 hover:text-foreground" onClick={() => { setHidden(false); try { localStorage.removeItem(key) } catch {} }}>What is this page? ↓</button>
  }
  return (
    <div className="mb-6 rounded-2xl border border-primary/25 bg-primary/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <Handshake className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">{title}</p>
            <div className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-[color:var(--bq-ivory-dim)]">{children}</div>
          </div>
        </div>
        <button className="bq-label shrink-0 hover:text-foreground" onClick={() => { setHidden(true); try { localStorage.setItem(key, "1") } catch {} }}>Got it</button>
      </div>
    </div>
  )
}
