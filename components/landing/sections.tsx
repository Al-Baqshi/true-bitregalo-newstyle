import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EscrowDemo } from "./escrow-demo"

/*
 * The landing page, top to bottom. Its job is to make three things plain within
 * seconds: what BitRegalo is, why the money is safe, and what to do next.
 * It shows the mechanism at work instead of illustrating a mood.
 */
const wrap = "mx-auto w-full max-w-6xl px-5 sm:px-8"
const band = "border-t border-border py-20 sm:py-28"

export function Hero() {
  // On a phone the demo comes straight after the promise, so its buttons are in the first screen;
  // on a wide screen the promise and its buttons sit beside it.
  return (
    <section className={`${wrap} grid items-center gap-x-14 gap-y-8 pb-20 pt-10 sm:pt-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:grid-rows-[auto_auto] lg:gap-y-0 lg:pb-28 lg:pt-24`}>
      <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
        <h1 className="t-display">Escrow, enforced by code.</h1>
        <p className="t-lede mt-5 text-foreground/80 sm:mt-6">
          BitRegalo holds a payment in a public contract until the work is delivered.
          <span className="hidden sm:inline"> The buyer can only release it, the supplier can only hand it back, and once the deadline passes it can only go back to the buyer. No middleman. No custodian.</span>
          <span className="sm:hidden"> Nobody else can move it, including us.</span>
        </p>
      </div>
      <EscrowDemo className="lg:col-start-2 lg:row-span-2 lg:row-start-1" />
      <div className="lg:col-start-1 lg:row-start-2 lg:self-start lg:pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button asChild size="lg"><Link href="/app">Open the app<ArrowRight /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/protocols/escrow">Read the documentation</Link></Button>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          The app runs on a practice network today, with free practice money, so you can try every step.
        </p>
      </div>
    </section>
  )
}

const OUTCOMES = [
  { name: "Released", text: "The buyer releases it. The supplier is paid." },
  { name: "Handed back", text: "The supplier hands it back. The buyer has the money again." },
  { name: "Returned", text: "The deadline passes with no decision. The money can only go back to the buyer, and anyone can trigger that." },
]

export function HowItWorks() {
  const steps = [
    {
      title: "The money locks on-chain.",
      body: "When the buyer chooses an offer, the money is committed for a fixed term. From that moment it is ring-fenced: visible to both sides, spendable by neither.",
    },
    {
      title: "Two keys. One direction each.",
      body: "The buyer can only release it to the supplier. The supplier can only hand it back to the buyer. Neither side can pull it toward themselves.",
    },
    {
      title: "Every path ends safely.",
      body: "There is no fourth path. The worst case, for anyone, is getting back exactly what they committed.",
    },
  ]
  return (
    <section id="how" className={band}>
      <div className={wrap}>
        <h2 className="t-headline">How it works</h2>
        <ol className="mt-12 grid gap-x-10 gap-y-12 lg:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <div className="flex items-center gap-4" aria-hidden>
                <span className="t-num flex size-9 shrink-0 items-center justify-center rounded-full border border-border-strong text-base font-semibold">{i + 1}</span>
                <span className={`h-px flex-1 bg-border ${i === steps.length - 1 ? "lg:invisible" : ""}`} />
              </div>
              <h3 className="flare mt-5 text-2xl font-[620] leading-tight tracking-[-0.015em]">{s.title}</h3>
              <p className="mt-3 max-w-[46ch] text-base text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <dl className="mt-12 grid overflow-hidden rounded-xl border border-border bg-card md:grid-cols-3">
          {OUTCOMES.map((o, i) => (
            <div key={o.name} className={`px-5 py-5 sm:px-6 ${i > 0 ? "border-t border-border md:border-l md:border-t-0" : ""}`}>
              <dt className="t-subheading">{o.name}</dt>
              <dd className="mt-1 text-base text-muted-foreground">{o.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

const COMPARISON = [
  { label: "Custody", traditional: "A third party holds the escrow", bitregalo: "A smart contract holds the escrow" },
  { label: "Trust", traditional: "You trust an agent", bitregalo: "You verify the code" },
  { label: "Disputes", traditional: "Arbitration: weeks or months", bitregalo: "Deterministic outcomes: instant" },
  { label: "Worst case", traditional: "The escrow is frozen or lost", bitregalo: "The money goes back to the buyer" },
  { label: "Visibility", traditional: "Statements on request", bitregalo: "On-chain, in real time" },
]
const PILLARS = [
  { title: "Non-custodial", text: "BitRegalo never takes custody. Every escrow lives in a smart contract, not in our accounts." },
  { title: "No way around it", text: "The contract's only possible moves are to the supplier or back to the buyer. Nobody can send the money anywhere else." },
  { title: "Multi-chain", text: "The same escrow protocol, deployed across multiple networks. Pick the chain that fits." },
]

export function Assurance() {
  return (
    <section id="assurance" className={band}>
      <div className={wrap}>
        <div className="max-w-3xl">
          <h2 className="t-headline">No one else can touch it. Not even us.</h2>
          <p className="t-lede mt-5">
            Traditional escrow asks you to trust an agent. BitRegalo is decentralised infrastructure: the agent is replaced by a contract whose rules cannot bend.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-xl border border-border bg-card" role="table" aria-label="Traditional escrow compared with BitRegalo">
          <div className="hidden grid-cols-[11rem_1fr_1fr] gap-6 border-b border-border px-6 py-3.5 text-sm font-semibold md:grid" role="row">
            <span role="columnheader" className="sr-only">Topic</span>
            <span role="columnheader" className="col-start-2 text-muted-foreground">Traditional escrow</span>
            <span role="columnheader">BitRegalo</span>
          </div>
          {COMPARISON.map((r) => (
            <div key={r.label} role="row" className="grid gap-x-6 gap-y-1.5 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-[11rem_1fr_1fr] md:items-baseline md:px-6">
              <span role="rowheader" className="text-base font-semibold">{r.label}</span>
              <span role="cell" className="text-base text-muted-foreground"><span className="font-[560] md:hidden">Traditional: </span>{r.traditional}</span>
              <span role="cell" className="text-base font-[520]"><span className="font-[560] text-gold md:hidden">BitRegalo: </span>{r.bitregalo}</span>
            </div>
          ))}
        </div>

        <dl className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="border-t border-border-strong pt-4">
              <dt className="t-subheading">{p.title}</dt>
              <dd className="mt-1.5 text-base text-muted-foreground">{p.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

const IN_APP = [
  { title: "Launch a workspace", text: "Your organisation's own contracts and treasury, with you as admin." },
  { title: "Post a request", text: "Say what you need. Suppliers answer with a price and a time, and you choose one." },
  { title: "List what you sell", text: "A fixed price and delivery time, open to anyone or to one named buyer." },
  { title: "Hold money until delivery", text: "Settle through escrow, settle directly, or simply keep the record." },
  { title: "Sell vouchers, credits and memberships", text: "Buyers receive them at once and redeem them with you later." },
]
const EXAMPLE_ROWS = [
  { title: "Roof framing, stage 2", meta: "Escrow · open for 3 days", state: "Open", tone: "bg-gold-fill text-gold", dot: "bg-gold-line" },
  { title: "Site survey and report", meta: "Direct · chosen 2 days ago", state: "Awarded", tone: "bg-success-fill text-success", dot: "bg-success" },
  { title: "Scaffold hire, six weeks", meta: "Record only · chosen last week", state: "Awarded", tone: "bg-success-fill text-success", dot: "bg-success" },
]

export function InTheApp() {
  return (
    <section id="app" className={band}>
      <div className={`${wrap} grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start`}>
        <div>
          <h2 className="t-headline">What you can do with it today</h2>
          <p className="t-lede mt-5">
            Each organisation runs its own workspace: its own contracts, its own rules, its own record. Nothing needs blockchain knowledge. Your wallet signs each step.
          </p>
          <dl className="mt-8 divide-y divide-border border-y border-border">
            {IN_APP.map((f) => (
              <div key={f.title} className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[15rem_1fr]">
                <dt className="text-base font-semibold">{f.title}</dt>
                <dd className="text-base text-muted-foreground">{f.text}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8">
            <Button asChild size="lg" variant="secondary"><Link href="/app/t/0">Try it in the public workspace<ArrowRight /></Link></Button>
          </div>
        </div>

        <figure className="lg:mt-3">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-raised">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <p className="t-subheading">Latest requests</p>
              <p className="text-sm text-muted-foreground">Harbour Build</p>
            </div>
            {EXAMPLE_ROWS.map((r) => (
              <div key={r.title} className="flex items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-[560] leading-snug">{r.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{r.meta}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-[560] ${r.tone}`}>
                  <span className={`size-1.5 rounded-full ${r.dot}`} aria-hidden />{r.state}
                </span>
              </div>
            ))}
          </div>
          <figcaption className="mt-3 text-xs text-subtle">How a workspace lists its requests in the app. An example with made-up entries.</figcaption>
        </figure>
      </div>
    </section>
  )
}

const FEATURED = [
  {
    sector: "Construction",
    image: { src: "/assets/parallax/construction.webp", alt: "Tower cranes over a building site at night" },
    title: "If the head contractor collapses, the subcontractors don't.",
    text: "Every package is ring-fenced in its own escrow before work begins. Insolvency upstream can't reach what was committed downstream: the subbies who delivered still receive what was locked in for them.",
  },
  {
    sector: "Nonprofits and donations",
    image: { src: "/assets/parallax/light-stream.webp", alt: "A stream of golden light" },
    title: "Donate into escrow. Release on delivery.",
    text: "Every contribution is publicly visible from pledge to release. Donors see exactly where it sits, and exactly when it moves.",
  },
]
const MORE_CASES = [
  { title: "Freelance and milestones", text: "The engagement goes into escrow before work starts. Each milestone releases on acceptance." },
  { title: "Cross-border trade", text: "Two parties who have never met, trading without a bank in the middle." },
  { title: "Grants and allocations", text: "Every allocation visible to everyone. Whatever isn't released returns automatically at term." },
]

export function UseCases() {
  return (
    <section id="use-cases" className={band}>
      <div className={wrap}>
        <h2 className="t-headline max-w-3xl">Where on-chain escrow changes everything</h2>
        <div className="mt-12 grid gap-x-14 gap-y-12 lg:grid-cols-2">
          {FEATURED.map((c) => (
            <article key={c.sector}>
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-[#07080a]">
                <Image src={c.image.src} alt={c.image.alt} fill sizes="(min-width: 1024px) 540px, 100vw" className="object-cover" />
              </div>
              <h3 className="flare mt-6 text-[1.75rem] font-[620] leading-[1.15] tracking-[-0.018em] sm:text-[2rem]">{c.title}</h3>
              <p className="mt-4 max-w-[52ch] text-base text-muted-foreground">
                <span className="font-semibold text-foreground">{c.sector}. </span>
                {c.text}
              </p>
            </article>
          ))}
        </div>
        <dl className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {MORE_CASES.map((c) => (
            <div key={c.title} className="border-t border-border-strong pt-4">
              <dt className="t-subheading">{c.title}</dt>
              <dd className="mt-1.5 text-base text-muted-foreground">{c.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

const DOCS = [
  { title: "Escrow protocol", text: "The exact rules every escrow follows: states, permissions, and outcomes.", href: "/protocols/escrow" },
  { title: "RFP and RTS protocols", text: "Procurement rails built on the same escrow primitive.", href: "/protocols/rfp" },
  { title: "Whitepaper", text: "The full picture: architecture, strategy, and the road ahead.", href: "/whitepaper" },
]

export function Protocol() {
  return (
    <section id="protocol" className={band}>
      <div className={`${wrap} grid grid-cols-[minmax(0,1fr)] gap-x-14 gap-y-12 lg:grid-cols-2`}>
        <div className="min-w-0">
          <h2 className="t-headline">A protocol, not a promise.</h2>
          <p className="t-lede mt-5">
            Everything on this page is enforced by a published smart contract you can read, verify, and build on, on every chain we deploy to.
          </p>
          <pre className="mt-8 overflow-x-auto rounded-xl border border-border bg-card px-5 py-4 font-mono text-sm leading-7 text-foreground">
            <code>
              <span className="text-muted-foreground">{"// opened when the buyer chooses an offer"}</span>{"\n"}
              vault.<span className="text-gold">release</span>(id){"  "}<span className="text-muted-foreground">{"// buyer only: pays the supplier"}</span>{"\n"}
              vault.<span className="text-gold">cancel</span>(id){"   "}<span className="text-muted-foreground">{"// supplier only: hands it back"}</span>{"\n"}
              vault.<span className="text-gold">expire</span>(id){"   "}<span className="text-muted-foreground">{"// anyone, after the term: back to the buyer"}</span>
            </code>
          </pre>
        </div>
        <ul className="divide-y divide-border self-start border-y border-border">
          {DOCS.map((d) => (
            <li key={d.href}>
              <Link href={d.href} className="group flex items-start justify-between gap-6 py-5 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <span>
                  <span className="t-heading block">{d.title}</span>
                  <span className="mt-1 block text-base text-muted-foreground">{d.text}</span>
                </span>
                <ArrowUpRight className="mt-1 size-5 shrink-0 text-subtle transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section id="start" className={band}>
      <div className={`${wrap} grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end`}>
        <div>
          <h2 className="t-display !text-[clamp(2.25rem,1.3rem+4vw,4.25rem)]">Put the trust on-chain.</h2>
          <p className="t-lede mt-5">
            Talk to us about what BitRegalo can ring-fence for your project. No forms: reach us directly.
          </p>
        </div>
        <div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button asChild size="lg"><a href="mailto:ceo@bitregalo.com">ceo@bitregalo.com</a></Button>
            <Button asChild size="lg" variant="outline"><a href="tel:+64273385000" className="t-num">+64 27 338 5000</a></Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Want the detail first?{" "}
            <Link href="/protocols/escrow" className="text-gold underline decoration-1 underline-offset-4 hover:decoration-2">Read the documentation</Link>
            {" "}or{" "}
            <Link href="/app" className="text-gold underline decoration-1 underline-offset-4 hover:decoration-2">open the app</Link>.
          </p>
        </div>
      </div>
    </section>
  )
}
