"use client"
import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { inputCls } from "@/components/app/ui"
import { chain } from "@/lib/bitregalo/config"
import { cn } from "@/lib/utils"

/**
 * The three ways to use BitRegalo, in order of importance: connect a platform, run a
 * workspace, use the BitRegalo network. `onNetwork` is for the network's own home page,
 * where the third way is the page the visitor is already on.
 */
export function ThreeWays({ onNetwork = false }: { onNetwork?: boolean }) {
  const ways = [
    {
      name: "Connect a platform",
      tag: "For a product that already takes payments",
      body: "Your site, app or back office keeps its own product and customers. It reads BitRegalo's records and has its users sign BitRegalo actions from their own wallets, so its records and payment commitments no longer depend on trusting the platform. Today that uses public interface files and code examples; an SDK and a server-side API are planned.",
      href: "/app/connect",
      link: "How to connect",
    },
    {
      name: "Run a workspace",
      tag: "For an organisation",
      body: "An organisation launches its own contracts: its records and rules, a vault for held payments and a treasury its admin owns. It chooses the currencies it accepts and can issue tokens and run a shop. Everything done inside is recorded under that workspace, through this app or the organisation's own platform.",
      href: "/app/workspaces",
      link: "See the workspaces",
    },
    {
      name: "Use the BitRegalo network",
      tag: "For anyone, anywhere",
      body: "BitRegalo's own public workspace, open to everyone, and the place to try every part: send a payment, hold a payment in escrow, ask for things and offer them in a marketplace browsed by country. People pay each other in USDT (tUSD on the practice network). It is where this app opens.",
      href: "/app",
      link: "Go to the network",
    },
  ]
  return (
    <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {ways.map((w, i) => (
        <li key={w.name} className="grid gap-x-8 gap-y-2.5 px-5 py-5 sm:px-6 md:grid-cols-[15rem_minmax(0,1fr)]">
          <div>
            <p className="t-subheading"><span className="t-num mr-2 text-subtle" aria-hidden>{i + 1}</span>{w.name}</p>
            <p className="mt-0.5 text-sm font-[560] text-gold">{w.tag}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{w.body}</p>
            {onNetwork && w.href === "/app" ? (
              <p className="mt-2 text-sm text-subtle">You are here.</p>
            ) : (
              <Link href={w.href} className="group mt-1 inline-flex min-h-9 items-center gap-1.5 rounded-sm text-sm font-[560] text-gold underline decoration-1 underline-offset-4 hover:decoration-2 pointer-coarse:min-h-11">
                {w.link}<ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
              </Link>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** What a person can do, on the network or in a workspace, each in a few sentences. */
export function BuildingBlocks() {
  const blocks = [
    { name: "Send a payment", body: "Pay someone straight away, with a reference and a receipt, or send a gift. To be paid, make a payment link or QR code under Get paid." },
    { name: "Escrow", body: "A payment held by a contract until the work is done. The buyer can only release it, the supplier can only hand it back, and after the deadline it can only return to the buyer. Start one with Hold a payment for someone." },
    { name: "Requests", body: "“I need this.” Post what you need; suppliers answer with offers (a price and a time). You choose one and settle by escrow, by direct payment, or just record the choice." },
    { name: "Listings", body: "“I offer this.” A fixed price and delivery time, open to anyone or to one named buyer. When a buyer takes it, it settles the way you chose." },
    { name: "Marketplace by country", body: "Requests and listings with a title, description, category and country, so people can find work and suppliers near them. The words are signed by the poster's wallet; amounts and state stay on the public record." },
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
    { title: "Pay your way", body: "Just record it, pay straight away, or hold the payment safely until the work is done." },
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

/** The three settlement options, explained with what actually happens to the payment. */
export function SettleModes({ compact = false }: { compact?: boolean }) {
  const modes = [
    { name: "Just record it", tag: "No payment", body: "The request, the offers and your choice are written down for good. Useful when payment happens elsewhere, or when the proof is what matters: tenders, grants, approvals." },
    { name: "Pay straight away", tag: "Direct payment", body: "The moment you choose an offer, the supplier is paid from your wallet. Simple, for work you trust or goods already delivered." },
    { name: "Hold it safely", tag: "Escrow", body: "When you choose, the payment leaves your wallet and is locked in a vault contract. You release it when the work is done. The supplier can hand it back if they can't deliver. After the deadline it can only go back to you, and anyone can trigger that." },
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
  ["Record", "A fact written once to an organisation's contracts: who, what, how much and when, with an optional reference. Requests, offers, choices, payments, sales and redemptions are all records. Anyone can read one. Nobody can edit or delete it afterwards: not the platform that wrote it, not its developers, not BitRegalo."],
  ["Commitment", "A promise about a payment, locked in a contract so that it executes exactly as agreed when it is triggered. The kind built today is a held payment (escrow), with three fixed outcomes: released to the supplier, handed back to the buyer, or returned to the buyer after the deadline. More kinds, such as a refund window, are planned."],
  ["Connect a platform", "Using BitRegalo from a product that already exists. The platform keeps its own site, app and customers; it reads BitRegalo's records and has its users sign BitRegalo actions from their own wallets. Every workspace has a Connect a platform page with its addresses, interface files and code examples."],
  ["Workspace", "An organisation's own set of BitRegalo contracts: one for its records and rules, a vault for held payments, and a treasury its admin owns. It has its own accepted currencies, tokens and shop. Everything done inside it is recorded under it, through this app or the organisation's own platform."],
  ["BitRegalo network", "BitRegalo's own public workspace, open to everyone, and where this app opens. It is the place to try every part: send payments and gifts, hold a payment in escrow, ask for things and offer them in a marketplace by country, paying each other in USDT (tUSD on the practice network)."],
  ["Organisation", "Whoever runs a workspace: a company, a charity, a marketplace, a cooperative. Its admin sets the rules; the contracts enforce them."],
  ["Network", `The blockchain the contracts run on. Today that is ${chain.name}, a practice network. BitRegalo is not tied to one network: the same contracts run on a shared public network or on an organisation's own private one, and other ledgers are planned. Not the same thing as the BitRegalo network, which is BitRegalo's public workspace.`],
  ["Practice network", `Where BitRegalo runs today: ${chain.name}, a test network. The tokens here have no value, so you can try everything freely, and the faucet gives 1,000 tUSD a day. The contracts have not been independently audited.`],
  ["Marketplace", "Requests and listings people can browse by country and category. The title, description, country and city are signed by the poster's wallet. Amounts and state always come from the public record."],
  ["Country", "Where a request or listing belongs in the marketplace, chosen by the person who posts it."],
  ["Send a payment", "Pay someone straight away, with a reference and a receipt. It is also how you send a gift."],
  ["Get paid", "Make a payment link or QR code. Whoever opens it pays you, with one signature."],
  ["Hold a payment for someone", "Start an escrow yourself. You send the supplier a link; they accept with one signature, which lists the job for you only; you fund it, and the payment is held until you release it."],
  ["Request", "“I need this.” You say what you need, how it will be paid and how long offers stay open, and suppliers answer with offers."],
  ["Offer", "A supplier's answer to a request: their price and how many days they need. The buyer chooses one."],
  ["Listing", "“I offer this.” A supplier's fixed price and delivery time, open to anyone or to one named buyer. A buyer takes it, and it settles the way the supplier chose."],
  ["Escrow", "A held payment: the kind of commitment built today. A vault contract holds it while work is done, and it ends in one of three ways: released, handed back or returned. No person holds it: not BitRegalo, not a workspace admin."],
  ["Buyer", "The one who pays: who posted the request, took the listing or funded the escrow."],
  ["Supplier", "The one who does the work or delivers the goods, and is paid for it."],
  ["Release", "The buyer sends a held payment to the supplier, usually once the work is done. Only the buyer can."],
  ["Hand back", "The supplier sends a held payment back to the buyer, for example when they cannot deliver. Only the supplier can."],
  ["Returned", "After the deadline, a held payment that was not released can only go back to the buyer. It does not move by itself: someone has to trigger the return, and anyone can."],
  ["Private wording", "Only a fingerprint of the text is stored, so the words are not readable on the chain. Everything else (who posted, the offers, amounts and payments) is still public, as on any blockchain."],
  ["Project", "A name that groups related requests, listings and tokens in a workspace: a site, a programme, a product line."],
  ["Token", "A credit a workspace or one of its projects issues: vouchers, credits, memberships. The workspace admin creates the workspace's own tokens; a project's owner can create one for that project. It can be used to pay inside that workspace once its admin switches it on."],
  ["Treasury", "A contract that holds a workspace's own funds, created with the workspace and owned by its admin. Shop sales, redemptions and payment links can land there. BitRegalo has no function on it at all."],
  ["Shop", "Where a workspace sells its tokens (vouchers, credits, memberships) for a stablecoin. Buyers pay into the treasury and receive the tokens in the same transaction. The admin opens a sale; it starts once the treasury's owner has approved it."],
  ["Redeem", "A holder hands tokens back to the workspace with a reference: an order number, a seat, a coffee. That is how a voucher or credit is spent. No fee is charged. The workspace admin decides which of the workspace's tokens can be redeemed."],
  ["Payment link", "A link or QR code that says who gets paid, in what, how much and why. Nothing is written to the chain until someone opens it and signs."],
  ["Platform fee", "A small percentage BitRegalo takes from what the supplier receives on each payment or release. Fixed per workspace when it is created."],
  ["Service fee", "A flat amount added to each payment, paid by the buyer to BitRegalo. It is set for each accepted token in a workspace. It is separate from the network fee, which each person pays from their own wallet."],
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
