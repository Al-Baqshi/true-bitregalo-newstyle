import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeroDemo } from "./hero-demo"

/*
 * The landing page, top to bottom. Its job is to make plain within seconds that
 * BitRegalo is infrastructure, not one product: what it is, the building blocks,
 * the two ways to use it (on the BitRegalo network or in an organisation's own
 * workspace), why the money is safe, and what to do next. It shows the mechanism
 * at work instead of illustrating a mood. Sections that need more room live in
 * their own files: building-blocks.tsx and two-ways.tsx.
 */
const wrap = "mx-auto w-full max-w-6xl px-5 sm:px-8"
const band = "border-t border-border py-20 sm:py-28"
const link = "text-gold underline decoration-1 underline-offset-4 hover:decoration-2"

export function Hero() {
  return (
    <section className={`${wrap} grid items-center gap-x-14 gap-y-8 pb-20 pt-8 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.96fr)] lg:pb-28 lg:pt-20`}>
      <div>
        <h1 className="t-display">Public rails for work and money.</h1>
        <p className="t-lede mt-5 sm:mt-6">
          BitRegalo is decentralised infrastructure. People and organisations agree on work and payment, and a public contract enforces the deal. Nobody in the middle holds the money, not even us.
        </p>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <Button asChild size="lg" className="max-sm:px-3"><Link href="/app">Open the app<ArrowRight /></Link></Button>
          <Button asChild size="lg" variant="outline" className="max-sm:px-3"><Link href="#organisations">For organisations</Link></Button>
        </div>
        <p className="mt-5 hidden max-w-[52ch] text-sm text-muted-foreground sm:block">
          The app runs on a practice network today, with free practice money, so you can try every step.
        </p>
      </div>
      <HeroDemo />
    </section>
  )
}

const STEPS = [
  {
    title: "Agree on the work",
    body: "What is to be done, for how much and by when. Through a request, a listing, or directly between two people.",
  },
  {
    title: "Settle the money",
    body: "Hold it in escrow until the work is done, pay straight away, or simply record the deal with no money moving.",
  },
  {
    title: "Keep the record",
    body: "Every step is a public record, signed by whoever took it: on the BitRegalo network, or under the organisation's own workspace.",
  },
]

export function HowItWorks() {
  return (
    <section id="how" className={band}>
      <div className={wrap}>
        <div className="max-w-3xl">
          <h2 className="t-headline">How it works</h2>
          <p className="t-lede mt-5">The same three steps whether one person is paying another or an organisation is running its own marketplace.</p>
        </div>
        <ol className="mt-12 grid gap-x-10 gap-y-10 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <div className="flex items-center gap-4" aria-hidden>
                <span className="t-num flex size-9 shrink-0 items-center justify-center rounded-full border border-border-strong text-base font-semibold">{i + 1}</span>
                <span className={`h-px flex-1 bg-border ${i === STEPS.length - 1 ? "lg:invisible" : ""}`} />
              </div>
              <h3 className="flare mt-5 text-2xl font-[620] tracking-tight">{s.title}</h3>
              <p className="mt-2.5 max-w-[46ch] text-base text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const OUTCOMES = [
  { name: "Released", text: "The buyer releases it. The supplier is paid." },
  { name: "Handed back", text: "The supplier hands it back. The buyer has the money again." },
  { name: "Returned", text: "The deadline passes with no decision. The money can only go back to the buyer, and anyone can trigger that." },
]
const COMPARISON = [
  { label: "Who holds the money", traditional: "An agent, a bank or a platform", bitregalo: "A public contract. Never BitRegalo." },
  { label: "What you rely on", traditional: "The agent's honesty and solvency", bitregalo: "Rules anyone can read" },
  { label: "If nobody decides", traditional: "It waits on the agent or on arbitration", bitregalo: "After the deadline it can only go back to the buyer" },
  { label: "Records", traditional: "Statements on request", bitregalo: "Public records, as they happen" },
]

export function Trust() {
  return (
    <section id="trust" className={band}>
      <div className={`${wrap} grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]`}>
        <div>
          <h2 className="t-headline">No one else can touch the money. Not even us.</h2>
          <p className="t-lede mt-5">
            Traditional escrow asks you to trust an agent. Here the agent is a public contract, and an escrow has only three outcomes.
          </p>
          <dl className="mt-8 divide-y divide-border border-y border-border">
            {OUTCOMES.map((o) => (
              <div key={o.name} className="grid gap-x-6 gap-y-0.5 py-4 sm:grid-cols-[9rem_1fr]">
                <dt className="text-base font-semibold">{o.name}</dt>
                <dd className="text-base text-muted-foreground">{o.text}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:pt-2">
          <div className="overflow-hidden rounded-xl border border-border bg-card" role="table" aria-label="Traditional escrow compared with BitRegalo">
            <div className="hidden grid-cols-[10rem_1fr_1fr] gap-6 border-b border-border px-6 py-3.5 text-sm font-semibold md:grid" role="row">
              <span role="columnheader" className="sr-only">Topic</span>
              <span role="columnheader" className="col-start-2 text-muted-foreground">Traditional escrow</span>
              <span role="columnheader">BitRegalo</span>
            </div>
            {COMPARISON.map((r) => (
              <div key={r.label} role="row" className="grid gap-x-6 gap-y-1.5 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-[10rem_1fr_1fr] md:items-baseline md:px-6">
                <span role="rowheader" className="text-base font-semibold">{r.label}</span>
                <span role="cell" className="text-base text-muted-foreground"><span className="font-[560] md:hidden">Traditional: </span>{r.traditional}</span>
                <span role="cell" className="text-base font-[520]"><span className="font-[560] text-gold md:hidden">BitRegalo: </span>{r.bitregalo}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-[62ch] text-base text-muted-foreground">
            BitRegalo never takes custody, and neither does a workspace admin. Held money can only go to the supplier or back to the buyer.
          </p>
        </div>
      </div>
    </section>
  )
}

const FEATURED = [
  {
    sector: "Construction",
    image: { src: "/assets/parallax/construction.webp", alt: "Tower cranes over a building site at night" },
    title: "Subcontractors see the money before they start.",
    text: "Each package is paid into its own escrow before work begins. The subcontractor can check it is there, and nobody can move it except to them or back to the buyer.",
  },
  {
    sector: "Nonprofits and donations",
    image: { src: "/assets/parallax/light-stream.webp", alt: "A stream of golden light" },
    title: "Donate into escrow. Release on delivery.",
    text: "Each contribution is a public record from pledge to release. Donors see where it sits and when it moves.",
  },
]
const MORE_CASES = [
  { title: "Freelance and milestones", text: "Each milestone goes into escrow before work starts and is released on acceptance." },
  { title: "Cross-border trade", text: "Two parties who have never met agree a price, and the money waits in a contract until delivery." },
  { title: "People across borders", text: "Send money or a gift in USDT to someone in another country, with a reference and a receipt." },
  { title: "Grants and allocations", text: "Every allocation is visible. Whatever is not released can go back to the funder after the deadline." },
]

export function UseCases() {
  return (
    <section id="use-cases" className={band}>
      <div className={wrap}>
        <h2 className="t-headline max-w-3xl">Where it fits</h2>
        <div className="mt-12 grid gap-x-14 gap-y-12 lg:grid-cols-2">
          {FEATURED.map((c) => (
            <article key={c.sector}>
              <div className="relative aspect-video overflow-hidden rounded-xl bg-secondary">
                <Image src={c.image.src} alt={c.image.alt} fill sizes="(min-width: 1024px) 540px, 100vw" className="object-cover" />
              </div>
              <h3 className="flare mt-6 text-2xl font-[620] tracking-tight sm:text-3xl">{c.title}</h3>
              <p className="mt-3 max-w-[52ch] text-base text-muted-foreground">
                <span className="font-semibold text-foreground">{c.sector}. </span>
                {c.text}
              </p>
            </article>
          ))}
        </div>
        <dl className="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
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
  { title: "Escrow protocol", text: "The exact rules every escrow follows: states, permissions and outcomes.", href: "/protocols/escrow" },
  { title: "Request protocol", text: "How a request collects offers and the chosen one settles.", href: "/protocols/rfp" },
  { title: "Listing protocol", text: "How a fixed-price listing is taken and settled.", href: "/protocols/rts" },
  { title: "Whitepaper", text: "The full picture: architecture, workspaces and the road ahead.", href: "/whitepaper" },
]

export function Protocol() {
  return (
    <section id="protocol" className={band}>
      <div className={`${wrap} grid grid-cols-[minmax(0,1fr)] gap-x-14 gap-y-12 lg:grid-cols-2`}>
        <div className="min-w-0">
          <h2 className="t-headline">A protocol, not a promise.</h2>
          <p className="t-lede mt-5">
            Every rule on this page is carried out by published contracts you can read and check. The documentation sets out each one.
          </p>
          <pre className="mt-8 overflow-x-auto rounded-xl border border-border bg-card px-5 py-4 font-mono text-sm leading-7 text-foreground">
            <code>
              <span className="text-muted-foreground">{"// once an escrow holds the money"}</span>{"\n"}
              vault.<span className="text-gold">release</span>(id){"  "}<span className="text-muted-foreground">{"// buyer only: pays the supplier"}</span>{"\n"}
              vault.<span className="text-gold">cancel</span>(id){"   "}<span className="text-muted-foreground">{"// supplier only: hands it back"}</span>{"\n"}
              vault.<span className="text-gold">expire</span>(id){"   "}<span className="text-muted-foreground">{"// anyone, after the deadline: back to the buyer"}</span>
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
    <section id="contact" className={band}>
      <div className={`${wrap} grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end`}>
        <div>
          <h2 className="t-display text-[clamp(2.25rem,1.3rem+4vw,4.25rem)]">Building on BitRegalo? Talk to us.</h2>
          <p className="t-lede mt-5">
            A workspace for your organisation, with its own rules and currencies, or a question about the protocol: write or call. No forms.
          </p>
        </div>
        <div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button asChild size="lg"><a href="mailto:ceo@bitregalo.com">ceo@bitregalo.com</a></Button>
            <Button asChild size="lg" variant="outline"><a href="tel:+6499208896" className="t-num">09 920 8896</a></Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Want the detail first? <Link href="/protocols/escrow" className={link}>Read the documentation</Link> or <Link href="/app" className={link}>open the app</Link>.
          </p>
        </div>
      </div>
    </section>
  )
}
