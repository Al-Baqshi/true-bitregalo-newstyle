import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeroDemo } from "./hero-demo"

/*
 * The landing page, top to bottom. Its job is to let a first-time evaluator see within
 * a minute what BitRegalo makes impossible to fake (an edited record, a broken payment
 * commitment), who connects to it (a platform that already takes payments), and the
 * three ways to use it: connect a platform, run a workspace, or try the BitRegalo
 * network. It shows the mechanism at work instead of illustrating a mood, and it says
 * plainly what is built and what is planned. Sections that need more room live in their
 * own files: three-ways.tsx and building-blocks.tsx.
 *
 * PRODUCT.md (Vision) and the whitepaper are the source of truth for every claim here.
 */
const wrap = "mx-auto w-full max-w-6xl px-5 sm:px-8"
const band = "border-t border-border py-20 sm:py-28"
const link = "text-gold underline decoration-1 underline-offset-4 hover:decoration-2"

export function Hero() {
  return (
    <section className={`${wrap} grid items-center gap-x-14 gap-y-8 pb-20 pt-8 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.96fr)] lg:pb-28 lg:pt-20`}>
      <div>
        <h1 className="t-display text-[clamp(2.25rem,1.3rem+4vw,4.25rem)]">Records nobody can edit. Commitments nobody can break.</h1>
        <p className="t-lede mt-5 sm:mt-6">
          BitRegalo is infrastructure that a marketplace, an enterprise, a bank or a startup connects to the platform it already runs. Its records are written once to public contracts that nobody can edit afterwards, the platform&apos;s own developers included. Its payment commitments, such as a held payment or a refund, execute exactly as agreed when they are triggered.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild size="lg"><Link href="/app/connect">See how a platform connects<ArrowRight /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/whitepaper">Read the whitepaper</Link></Button>
        </div>
        <p className="mt-5 max-w-[56ch] text-sm text-muted-foreground">
          Today BitRegalo runs on BNB Smart Chain Testnet, a public test network where tokens have no value, and has been deployed unchanged to a private Hyperledger Besu test network. It has not been independently audited and it is not on a main network. You can <Link href="/app" className={link}>try every step in the reference app</Link> with practice tokens.
        </p>
      </div>
      <HeroDemo />
    </section>
  )
}

const STEPS = [
  {
    title: "Connect what you already run",
    body: "Your platform keeps its product, its customers and its interface. It reads BitRegalo's records and has its users sign BitRegalo actions from inside its own site, app or back office.",
  },
  {
    title: "Records are written once",
    body: "A request, an award, a payment, a sale or a redemption is written to your organisation's own contracts with its parties, its amount and the time. No function exists to edit or delete it.",
  },
  {
    title: "Commitments execute as agreed",
    body: "A payment is held by a contract with its outcomes fixed in advance. When one is triggered, the payment goes where the contract says. Nobody can send it anywhere else or stop it from leaving.",
  },
]

export function HowItWorks() {
  return (
    <section id="how" className={band}>
      <div className={wrap}>
        <div className="max-w-3xl">
          <h2 className="t-headline">How it works</h2>
          <p className="t-lede mt-5">A platform connects BitRegalo for the part of its system that should not depend on trusting whoever runs it: its records and its promises about payments.</p>
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
  { name: "Handed back", text: "The supplier hands it back. The buyer has the full amount again." },
  { name: "Returned", text: "The deadline passes with no decision. The payment can only go back to the buyer, and anyone can trigger that." },
]
const COMPARISON = [
  { label: "Where records live", own: "Rows in a database the operator controls", bitregalo: "Public contracts, readable by anyone" },
  { label: "Who can change a record", own: "The operator, and any developer or administrator with access", bitregalo: "Nobody. No function exists to edit or delete one." },
  { label: "Who holds a payment", own: "The platform, a bank or an agent", bitregalo: "A public contract. Never BitRegalo, never the platform." },
  { label: "A refund or a return", own: "Decided by the party that gains when it is refused", bitregalo: "Fixed in advance. Once triggered, it goes where the contract says." },
  { label: "If the servers go down", own: "Records and payments wait on the operator", bitregalo: "Records stay readable, and a held payment can still be released, handed back or returned" },
]

export function Trust() {
  return (
    <section id="trust" className={band}>
      <div className={`${wrap} grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]`}>
        <div>
          <h2 className="t-headline">Nobody can edit the record or redirect the payment. Not even us.</h2>
          <p className="t-lede mt-5">
            A platform&apos;s own database asks its users to trust whoever runs it. Here the rules are public contracts. A record is written once, and a held payment has only three outcomes.
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
          <div className="overflow-hidden rounded-xl border border-border bg-card" role="table" aria-label="A platform on its own compared with a platform connected to BitRegalo">
            <div className="hidden grid-cols-[10rem_1fr_1fr] gap-6 border-b border-border px-6 py-3.5 text-sm font-semibold md:grid" role="row">
              <span role="columnheader" className="sr-only">Topic</span>
              <span role="columnheader" className="col-start-2 text-muted-foreground">A platform on its own</span>
              <span role="columnheader">Connected to BitRegalo</span>
            </div>
            {COMPARISON.map((r) => (
              <div key={r.label} role="row" className="grid gap-x-6 gap-y-1.5 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-[10rem_1fr_1fr] md:items-baseline md:px-6">
                <span role="rowheader" className="text-base font-semibold">{r.label}</span>
                <span role="cell" className="text-base text-muted-foreground"><span className="font-[560] md:hidden">On its own: </span>{r.own}</span>
                <span role="cell" className="text-base font-[520]"><span className="font-[560] text-gold md:hidden">Connected: </span>{r.bitregalo}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-[62ch] text-base text-muted-foreground">
            BitRegalo never holds anyone&apos;s tokens, and neither does a workspace admin. A workspace or BitRegalo can pause new activity. Nobody can pause a release, a hand-back or a return.
          </p>
        </div>
      </div>
    </section>
  )
}

const FEATURED = [
  {
    who: "a marketplace",
    image: { src: "/assets/parallax/light-stream.webp", alt: "A stream of golden light" },
    title: "The buyer's way back is fixed by the contract, not by a support desk.",
    text: "Each order's payment is held in a commitment. The supplier is paid when the buyer releases it, and if the order never arrives the payment can only go back to the buyer.",
  },
  {
    who: "a head contractor",
    image: { src: "/assets/parallax/construction.webp", alt: "Tower cranes over a building site at night" },
    title: "Subcontractors see the payment before they start.",
    text: "Each progress payment is held until the stage is certified. The subcontractor can check it is there, and nobody can move it except to them or back to the buyer.",
  },
]
/*
 * The marketplace example carried one step further: an order confirmed by the person who
 * receives it. The delivery code is built and runs on the practice network (protocol version 3;
 * PRODUCT.md, "Built and running"). The last step is the alternative to the fourth, not a fifth step.
 */
const DELIVERY = [
  { title: "Order", text: "The buyer orders flowers from a florist in Spain for a friend there and takes the florist's listing into a held payment. The buyer's browser creates a long random delivery code. The contract keeps only its fingerprint." },
  { title: "Code to the recipient", text: "The buyer gives the code to the friend as a QR code, a link or a print. The florist never sees it before delivery." },
  { title: "Scan on delivery", text: "At the door the florist scans the code with their own phone. The page says what will be released and has one button: Confirm delivery. BitRegalo's keeper sends the transaction. The friend needs no wallet, no app and no account." },
  { title: "Released", text: "Presenting the code releases the payment to the florist on the spot and records the handover with its time. That record is the florist's proof of delivery." },
  { title: "Returned", text: "If nobody presents the code before the deadline, the payment can only go back to the buyer, who can also give it more time. The keeper sends the return a few minutes after the deadline." },
]
const MORE_CASES = [
  { title: "An enterprise running tenders", text: "Each request, every answer and the award are recorded. A supplier who lost can check that nothing was rearranged afterwards." },
  { title: "A platform selling credits or memberships", text: "It issues them as tokens, sells them for a stablecoin into its own treasury, and has a public record of every sale and every redemption." },
  { title: "A nonprofit paying on delivery", text: "A grant waits in escrow and is released to the local supplier when the aid arrives. Anyone can see each amount and when it moved." },
  { title: "A bank on a private network", text: "A bank that cannot publish amounts or counterparties runs the same contracts on a permissioned network with its clients. Tested on Hyperledger Besu; no private deployment is in production." },
]

export function UseCases() {
  return (
    <section id="examples" className={band}>
      <div className={wrap}>
        <div className="max-w-3xl">
          <h2 className="t-headline">Examples of use</h2>
          <p className="t-lede mt-5">These are illustrations, not customers. The industries change; the records and the commitments underneath stay the same.</p>
        </div>
        <div className="mt-12 grid gap-x-14 gap-y-12 lg:grid-cols-2">
          {FEATURED.map((c) => (
            <article key={c.who}>
              <div className="relative aspect-video overflow-hidden rounded-xl bg-secondary">
                <Image src={c.image.src} alt={c.image.alt} fill sizes="(min-width: 1024px) 540px, 100vw" className="object-cover" />
              </div>
              <h3 className="flare mt-6 text-2xl font-[620] tracking-tight sm:text-3xl">{c.title}</h3>
              <p className="mt-3 max-w-[52ch] text-base text-muted-foreground">
                <span className="font-semibold text-foreground">Example: {c.who}. </span>
                {c.text}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-16 border-t border-border pt-12">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-gold-fill px-3 py-1 text-[13px] font-[560] text-gold">
              <span className="size-1.5 rounded-full bg-current" aria-hidden />
              On the practice network
            </p>
            <h3 className="flare mt-4 text-2xl font-[620] tracking-tight sm:text-3xl">The same order, confirmed by the person who receives it.</h3>
            <p className="mt-3 max-w-[62ch] text-base text-muted-foreground">
              <span className="font-semibold text-foreground">Example: a gift ordered from another country. </span>
              A delivery code lets the recipient confirm a delivery without a wallet, and gives the supplier proof of the handover. The buyer can still release from their own wallet, and the supplier can still hand the payment back.
            </p>
          </div>
          <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
            {DELIVERY.map((s, i) => {
              const alt = i === DELIVERY.length - 1
              return (
                <li key={s.title}>
                  <div className="flex items-center gap-4" aria-hidden>
                    <span className="t-num flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full border border-border-strong px-2 text-base font-semibold">{alt ? "or" : i + 1}</span>
                    <span className={`h-px flex-1 bg-border ${alt ? "lg:invisible" : ""}`} />
                  </div>
                  <h4 className="t-subheading mt-4">{alt ? <><span className="sr-only">Or: </span>{s.title}</> : s.title}</h4>
                  <p className="mt-1.5 text-base text-muted-foreground">{s.text}</p>
                </li>
              )
            })}
          </ol>
          <p className="mt-8 max-w-[66ch] text-sm text-muted-foreground">
            Presenting the code can only ever send the payment to the supplier. The code has to be long and random, which is why it travels as a QR code and not as a short number to type.
          </p>
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
  { title: "Whitepaper", text: "What BitRegalo is, the rules the protocol keeps, what is built and what is planned.", href: "/whitepaper" },
  { title: "Connect a platform", text: "For developers: contract addresses, interface files, code examples and payment links.", href: "/app/connect" },
  { title: "Escrow protocol", text: "The exact rules every held payment follows: states, permissions and outcomes.", href: "/protocols/escrow" },
  { title: "Requests protocol", text: "How a request collects offers, and how the chosen one settles.", href: "/protocols/rfp" },
  { title: "Listings protocol", text: "How a fixed-price listing is taken and settled.", href: "/protocols/rts" },
]

/* Where things stand, said once and plainly. Keep in step with the whitepaper's Status section. */
const STATUS = [
  { title: "A public test network", text: "Today it runs on BNB Smart Chain Testnet, a practice network where tokens have no value. It is not on a main network." },
  { title: "Not independently audited", text: "The contracts pass their own automated tests. Until an audit is done, nothing of real value should pass through them." },
  { title: "Public or private", text: "The same contracts run on a shared public network or on an organisation's own private one. Tested on Hyperledger Besu. Stellar and Hyperledger Fabric are planned." },
  { title: "No BitRegalo token", text: "BitRegalo has no token of its own and sells none, anywhere. It is paid for the use of its infrastructure, in the token a payment already uses." },
]

export function Protocol() {
  return (
    <section id="protocol" className={band}>
      <div className={`${wrap} grid grid-cols-[minmax(0,1fr)] gap-x-14 gap-y-12 lg:grid-cols-2`}>
        <div className="min-w-0">
          <h2 className="t-headline">A protocol, not a promise.</h2>
          <p className="t-lede mt-5">
            Every rule on this page is carried out by published contracts you can read and check. The rules belong to the protocol, not to a network, so any implementation has to keep them.
          </p>
          <pre className="mt-8 overflow-x-auto rounded-xl border border-border bg-card px-5 py-4 font-mono text-sm leading-7 text-foreground">
            <code>
              <span className="text-muted-foreground">{"// once an escrow holds the payment"}</span>{"\n"}
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
        <div id="status" className="min-w-0 lg:col-span-2">
          <h3 className="flare text-2xl font-[620] tracking-tight sm:text-3xl">Where it stands today</h3>
          <dl className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS.map((s) => (
              <div key={s.title} className="border-t border-border-strong pt-4">
                <dt className="t-subheading">{s.title}</dt>
                <dd className="mt-1.5 text-base text-muted-foreground">{s.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section id="contact" className={band}>
      <div className={`${wrap} grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end`}>
        <div>
          <h2 className="t-display text-[clamp(2.25rem,1.3rem+4vw,4.25rem)]">Connecting a platform? Talk to us.</h2>
          <p className="t-lede mt-5">
            A platform you want to connect, a workspace you want to launch, or a question about the protocol: write or call. No forms.
          </p>
        </div>
        <div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button asChild size="lg"><a href="mailto:ceo@bitregalo.com">ceo@bitregalo.com</a></Button>
            <Button asChild size="lg" variant="outline"><a href="tel:+6499208896" className="t-num">09 920 8896</a></Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Want the detail first? <Link href="/whitepaper" className={link}>Read the whitepaper</Link>, <Link href="/app/connect" className={link}>see how a platform connects</Link>, or <Link href="/app" className={link}>try the reference app</Link>.
          </p>
        </div>
      </div>
    </section>
  )
}
