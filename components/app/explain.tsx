"use client"
import { useMemo, useState } from "react"
import { ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { inputCls } from "@/components/app/ui"
import { cn } from "@/lib/utils"

/** The two ways to use BitRegalo: the open network, or an organisation's own workspace. */
export function TwoWays() {
  const ways = [
    {
      name: "The BitRegalo network",
      tag: "For anyone, anywhere",
      body: "Send money or a gift, hold money in escrow for someone, ask for things and offer them in a marketplace browsed by country. People pay each other in USDT (tUSD on the practice network). It runs on BitRegalo's own public contracts, and it is where the app opens.",
    },
    {
      name: "A workspace",
      tag: "For an organisation",
      body: "An organisation's own copy of the infrastructure: its own contracts, rules and fees, the currencies it accepts (a local stablecoin, for example), its own tokens, shop and treasury, run by its admin. Everything done inside a workspace is recorded under that workspace, apart from the network.",
    },
  ]
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
      {ways.map((w) => (
        <div key={w.name} className="bg-card px-5 py-5 sm:px-6">
          <p className="t-subheading">{w.name}</p>
          <p className="mt-0.5 text-sm font-[560] text-gold">{w.tag}</p>
          <p className="mt-2.5 text-sm text-muted-foreground">{w.body}</p>
        </div>
      ))}
    </div>
  )
}

/** What a person can do, on the network or in a workspace, each in a few sentences. */
export function BuildingBlocks() {
  const blocks = [
    { name: "Send money", body: "Pay someone straight away, with a reference and a receipt, or send a gift. To be paid, make a payment link or QR code under Get paid." },
    { name: "Escrow", body: "Money held by a contract until the work is done. The buyer can only release it, the supplier can only hand it back, and after the deadline it can only return to the buyer. Start one with Hold money for someone." },
    { name: "Requests", body: "“I need this.” Post what you need; suppliers answer with offers (a price and a time). You choose one and settle by escrow, by direct payment, or just record the choice." },
    { name: "Listings", body: "“I offer this.” A fixed price and delivery time, open to anyone or to one named buyer. When a buyer takes it, it settles the way you chose." },
    { name: "Marketplace by country", body: "Requests and listings with a title, description, category and country, so people can find work and suppliers near them. The words are signed by the poster's wallet; money and state stay on the public record." },
  ]
  return (
    <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      {blocks.map((b) => (
        <div key={b.name}>
          <dt className="t-subheading">{b.name}</dt>
          <dd className="mt-1 text-sm text-muted-foreground">{b.body}</dd>
        </div>
      ))}
    </dl>
  )
}

/** How a request goes, in four steps, in the words a first-time visitor uses. */
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
    { name: "Hold it safely", tag: "Escrow", body: "When you choose, the money leaves your wallet and is locked in a vault contract. You release it when the work is done. The supplier can hand it back if they can't deliver. After the deadline it can only go back to you, and anyone can trigger that." },
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

/** The model first, then the building blocks, then the rest of the words. */
const GLOSSARY: [string, string][] = [
  ["BitRegalo network", "BitRegalo's own public workspace, open to everyone. Send money, hold it in escrow, ask for things and offer them in a marketplace by country, paying each other in USDT (tUSD on the practice network). It is where the app opens."],
  ["Workspace", "An organisation's own BitRegalo: its own contracts (one for the records, a vault for money held in escrow, and a treasury), its rules and fees, the currencies it accepts, its tokens and shop, run by an admin. Everything done inside it is recorded under it."],
  ["Organisation", "Whoever runs a workspace: a company, a charity, a marketplace, a cooperative. Its admin sets the rules; the contracts enforce them."],
  ["Marketplace", "Requests and listings people can browse by country and category. The title, description, country and city are signed by the poster's wallet. Money and state always come from the public record."],
  ["Country", "Where a request or listing belongs in the marketplace, chosen by the person who posts it."],
  ["Send money", "Pay someone straight away, with a reference and a receipt. It is also how you send a gift."],
  ["Get paid", "Make a payment link or QR code. Whoever opens it pays you, with one signature."],
  ["Hold money for someone", "Start an escrow yourself. You send the supplier a link; they accept with one signature, which lists the job for you only; you fund it, and the money is held until you release it."],
  ["Request", "“I need this.” You say what you need, how it will be paid and how long offers stay open, and suppliers answer with offers. (In procurement: an RFP, a request for proposals.)"],
  ["Offer", "A supplier's answer to a request: their price and how many days they need. The buyer chooses one."],
  ["Listing", "“I offer this.” A supplier's fixed price and delivery time, open to anyone or to one named buyer. A buyer takes it, and it settles the way the supplier chose. (In the protocol: an RTS.)"],
  ["Escrow", "Money held by a vault contract while work is done. It ends in one of three ways: released, handed back or returned. No person holds it: not BitRegalo, not a workspace admin."],
  ["Buyer", "The one who pays: who posted the request, took the listing or funded the escrow."],
  ["Supplier", "The one who does the work or delivers the goods, and is paid for it."],
  ["Release", "The buyer sends held money to the supplier, usually once the work is done. Only the buyer can."],
  ["Hand back", "The supplier sends held money back to the buyer, for example when they cannot deliver. Only the supplier can."],
  ["Returned", "After the deadline, held money that was not released can only go back to the buyer. Anyone can trigger that."],
  ["Private wording", "Only a fingerprint of the text is stored, so the words are not readable on the chain. Everything else (who posted, the offers, amounts and payments) is still public, as on any blockchain."],
  ["Project", "A name that groups related requests, listings and tokens in a workspace: a site, a programme, a product line."],
  ["Token", "A currency or credit a workspace issues for itself: vouchers, credits, memberships. It can be used to pay inside that workspace once its admin switches it on."],
  ["Treasury", "A workspace's own money box on the chain, created with the workspace and owned by its admin. Shop sales, redemptions and payment links can land there. BitRegalo has no function on it at all."],
  ["Shop", "Where a workspace sells its tokens (vouchers, credits, memberships) for a stablecoin. Buyers pay into the treasury and receive the tokens in the same transaction."],
  ["Redeem", "A holder hands tokens back to the workspace with a reference: an order number, a seat, a coffee. That is how a voucher or credit is spent. No fee is charged."],
  ["Payment link", "A link or QR code that says who gets paid, in what, how much and why. Nothing is written to the chain until someone opens it and signs."],
  ["Platform fee", "A small percentage BitRegalo takes from what the supplier receives on each payment or release. Fixed per workspace when it is created."],
  ["Service fee", "A flat amount added to each payment, paid by the buyer. It covers the network costs BitRegalo pays on people's behalf."],
  ["Practice network", "A practice copy of the blockchain (BNB Smart Chain Testnet). The money here has no value, so you can try everything freely; the faucet gives 1,000 tUSD a day."],
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
