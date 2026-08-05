import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Reveal } from "@/components/reveal"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ArrowRight, FileCheck, Lock, PackageCheck } from "lucide-react"

interface TxRow {
  label: string
  value: string
  accent?: boolean
}

interface ProtocolDef {
  title: string
  shortName: string
  tag: string
  icon: typeof Lock
  intro: string
  image: string
  imageAlt: string
  originRows: TxRow[] | null
  escrowRows: TxRow[]
  flow: { title: string; text: string }[]
  facts: { title: string; text: string }[]
}

const protocols: Record<string, ProtocolDef> = {
  escrow: {
    title: "Escrow Protocol",
    shortName: "Escrow",
    tag: "01 / The core primitive",
    icon: Lock,
    intro:
      "A term-bound, non-custodial escrow. The issuer can only release. The receiver can only cancel. When the term ends untouched, the escrow returns to the issuer — automatically.",
    image: "/assets/protocols/escrow.webp",
    imageAlt: "An escrow cube of golden light flanked by the issuer's gold key and the receiver's silver key",
    originRows: null,
    escrowRows: [
      { label: "ESCROW", value: "#4821 · locked", accent: true },
      { label: "ISSUER", value: "0x3d9f…8a2c" },
      { label: "RECEIVER", value: "0x7e4b…c3f1" },
      { label: "OPENED", value: "2026-08-05 · 14:32 UTC" },
      { label: "TERM ENDS", value: "2026-09-04 · 14:32 UTC" },
      { label: "ISSUER CAN", value: "release() → settles to receiver" },
      { label: "RECEIVER CAN", value: "cancel() → returns to issuer" },
      { label: "ON EXPIRY", value: "returns to issuer, automatically" },
    ],
    flow: [
      { title: "Open", text: "The issuer opens an escrow, names the receiver, and sets the term." },
      { title: "Lock", text: "The escrow locks on-chain — visible to both parties, spendable by neither." },
      {
        title: "Two keys",
        text: "The issuer can only release it forward. The receiver can only cancel it back. Neither can pull it toward themselves.",
      },
      {
        title: "Settle",
        text: "Released, cancelled, or expired — every path ends with the escrow settled to the receiver or returned to the issuer.",
      },
    ],
    facts: [
      {
        title: "One term, set up front",
        text: "Every escrow has an opening time and an expiry. Between them, the rules cannot change.",
      },
      {
        title: "Asymmetric keys",
        text: "release() belongs to the issuer, cancel() to the receiver. There is no action that moves the escrow toward the caller.",
      },
      {
        title: "Automatic expiry",
        text: "If nothing happens by the end of the term, the escrow returns to the issuer. No claims process, no intervention.",
      },
      {
        title: "Non-custodial",
        text: "The escrow lives in the smart contract. BitRegalo never takes custody, and there is no admin key.",
      },
    ],
  },
  rfp: {
    title: "Request for Proposal",
    shortName: "RFP",
    tag: "02 / Tendering, on-chain",
    icon: FileCheck,
    intro:
      "You publish what you need. Providers respond with a time frame and a proposal amount. The proposal you accept becomes the escrow — committed before any work begins.",
    image: "/assets/protocols/rfp.webp",
    imageAlt: "Proposal documents of golden light converging into an escrow cube",
    originRows: [
      { label: "REQUEST", value: "#310 · scope + deadline published" },
      { label: "PROPOSAL", value: "6-week time frame · accepted 2026-08-05" },
    ],
    escrowRows: [
      { label: "ESCROW", value: "#4822 · opened from accepted proposal", accent: true },
      { label: "ISSUER", value: "you (the requester)" },
      { label: "RECEIVER", value: "the accepted provider" },
      { label: "TERM ENDS", value: "2026-09-16 · end of proposed time frame" },
      { label: "DELIVERED", value: "you release() → settles to provider" },
      { label: "NOT DELIVERED", value: "term expires → returns to you" },
    ],
    flow: [
      { title: "Request", text: "You publish what you need — scope and deadline. In construction terms: the tender goes out." },
      { title: "Propose", text: "Providers respond with a time frame and a proposal amount, recorded on-chain." },
      {
        title: "Commit",
        text: "You accept one proposal. Its amount and time frame lock into an escrow — the provider starts work knowing the commitment is real.",
      },
      {
        title: "Deliver & release",
        text: "Delivered within the time frame and to your satisfaction — you release. Not delivered — you simply don't, and at expiry the escrow returns to you.",
      },
    ],
    facts: [
      {
        title: "Tendering, auditable",
        text: "Requests, proposals, and acceptance are recorded on-chain — every bidder can verify the process was fair.",
      },
      {
        title: "The proposal becomes the escrow",
        text: "Acceptance is commitment: the proposed amount and time frame lock in before any work begins.",
      },
      {
        title: "A deadline with teeth",
        text: "Miss the time frame and there is nothing to chase — the escrow expires back to the requester on its own.",
      },
      {
        title: "Built on the same escrow",
        text: "An RFP is the escrow protocol with a tendering step in front. Same rules, same keys, same guarantees.",
      },
    ],
  },
  rts: {
    title: "Request to Supply",
    shortName: "RTS",
    tag: "03 / Supply, on-chain",
    icon: PackageCheck,
    intro:
      "The supplier states the time frame and escrow amount up front. Your confirmation opens the escrow. Delivery earns the release — and an undelivered order simply expires back to you.",
    image: "/assets/protocols/rts.webp",
    imageAlt: "A parcel of golden light travelling along a stream toward an escrow cube",
    originRows: [
      { label: "LISTING", value: "#77 · time frame + escrow amount stated up front" },
      { label: "CONFIRMED", value: "2026-08-05 · by the buyer" },
    ],
    escrowRows: [
      { label: "ESCROW", value: "#4823 · opened on confirmation", accent: true },
      { label: "ISSUER", value: "you (the buyer)" },
      { label: "RECEIVER", value: "the supplier" },
      { label: "TERM ENDS", value: "2026-08-19 · end of listed time frame" },
      { label: "ON DELIVERY", value: "you release() → settles to supplier" },
      { label: "NOT DELIVERED", value: "term expires → returns to you" },
    ],
    flow: [
      { title: "List", text: "A supplier lists what they deliver — with the time frame and escrow amount stated up front." },
      {
        title: "Confirm",
        text: "You confirm the listing. The stated amount locks into escrow for the stated time frame — that confirmation is the order.",
      },
      { title: "Deliver", text: "The supplier ships knowing the escrow is committed and cannot be pulled back mid-way." },
      {
        title: "Release or return",
        text: "You release on delivery. If nothing arrives, the escrow expires and returns to you — no refund process, no dispute queue.",
      },
    ],
    facts: [
      {
        title: "Terms stated up front",
        text: "Time frame and escrow amount are part of the listing itself. Nothing is renegotiated after you commit.",
      },
      {
        title: "Confirm to commit",
        text: "Confirming a listing opens the escrow. The supplier ships against a commitment they can verify on-chain.",
      },
      {
        title: "Release on delivery",
        text: "Refund policies become unnecessary — an undelivered order expires back to the buyer by itself.",
      },
      {
        title: "Built on the same escrow",
        text: "An RTS is the escrow protocol with a supply listing in front. Same rules, same keys, same guarantees.",
      },
    ],
  },
}

const protocolOrder = ["escrow", "rfp", "rts"]

export async function generateStaticParams() {
  return protocolOrder.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const protocol = protocols[slug]
  if (!protocol) {
    return { title: "Protocol Not Found — BitRegalo" }
  }
  return {
    title: `${protocol.title} — BitRegalo`,
    description: protocol.intro,
  }
}

function TxCard({ protocol }: { protocol: ProtocolDef }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 sm:px-6">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {protocol.shortName} · example transaction
        </span>
        <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Locked
        </span>
      </div>
      {protocol.originRows && (
        <div className="border-b border-border/40 bg-background/40 px-5 py-4 sm:px-6">
          {protocol.originRows.map((row) => (
            <div key={row.label} className="grid grid-cols-[110px_1fr] gap-3 py-1 font-mono text-xs sm:grid-cols-[140px_1fr] sm:text-sm">
              <span className="uppercase tracking-wider text-muted-foreground">{row.label}</span>
              <span className="text-foreground/90">{row.value}</span>
            </div>
          ))}
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            ↓ becomes the escrow
          </p>
        </div>
      )}
      <div className="px-5 py-4 sm:px-6">
        {protocol.escrowRows.map((row) => (
          <div key={row.label} className="grid grid-cols-[110px_1fr] gap-3 py-1 font-mono text-xs sm:grid-cols-[140px_1fr] sm:text-sm">
            <span className="uppercase tracking-wider text-muted-foreground">{row.label}</span>
            <span className={row.accent ? "text-accent" : "text-foreground/90"}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function ProtocolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const protocol = protocols[slug]
  if (!protocol) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h1 className="font-mono text-4xl font-bold">Protocol Not Found</h1>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const currentIndex = protocolOrder.indexOf(slug)
  const nextSlug = protocolOrder[(currentIndex + 1) % protocolOrder.length]
  const nextProtocol = protocols[nextSlug]

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <nav className="flex gap-2" aria-label="Protocols">
              {protocolOrder.map((s) => {
                const p = protocols[s]
                const active = s === slug
                return (
                  <Link
                    key={s}
                    href={`/protocols/${s}`}
                    className={`rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors sm:text-sm ${
                      active
                        ? "border-accent/60 bg-accent/10 text-accent"
                        : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {p.shortName}
                  </Link>
                )
              })}
            </nav>
          </div>

          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent sm:text-sm">{protocol.tag}</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance sm:text-6xl">{protocol.title}</h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{protocol.intro}</p>
          </Reveal>

          <Reveal delay={150}>
            <div className="relative mt-10 overflow-hidden rounded-3xl border border-border/60">
              <Image
                src={protocol.image}
                alt={protocol.imageAlt}
                width={2688}
                height={1520}
                priority
                className="h-[260px] w-full object-cover sm:h-[380px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </div>
          </Reveal>

          <section className="mt-16">
            <Reveal>
              <h2 className="font-mono text-sm uppercase tracking-[0.25em] text-accent">How it flows</h2>
            </Reveal>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {protocol.flow.map((step, i) => (
                <Reveal key={step.title} delay={i * 100}>
                  <div className="h-full rounded-2xl border border-border/60 bg-card/40 p-6">
                    <p className="font-mono text-xs text-muted-foreground">STEP 0{i + 1}</p>
                    <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="mt-16 grid items-start gap-10 lg:grid-cols-2">
            <div>
              <Reveal>
                <h2 className="font-mono text-sm uppercase tracking-[0.25em] text-accent">The transaction</h2>
                <p className="mt-4 max-w-md text-muted-foreground">
                  Every {protocol.shortName === "Escrow" ? "escrow" : protocol.shortName} resolves to the same on-chain
                  object: a term-bound escrow with one key on each side. This is what both parties see for the entire
                  term.
                </p>
              </Reveal>
            </div>
            <Reveal delay={150}>
              <TxCard protocol={protocol} />
            </Reveal>
          </section>

          <section className="mt-16">
            <Reveal>
              <h2 className="font-mono text-sm uppercase tracking-[0.25em] text-accent">What makes it hold</h2>
            </Reveal>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {protocol.facts.map((fact, i) => (
                <Reveal key={fact.title} delay={i * 100}>
                  <div className="h-full rounded-2xl border border-border/60 bg-card/40 p-6">
                    <h3 className="text-lg font-semibold">{fact.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{fact.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl border border-border/60 bg-card/40 p-8 sm:flex-row">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">Next protocol</p>
              <p className="mt-1 text-lg font-semibold">{nextProtocol.title}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/contact"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Contact us
              </Link>
              <Link
                href={`/protocols/${nextSlug}`}
                className="inline-flex items-center gap-2 rounded-full border border-accent/60 bg-accent/10 px-5 py-2 font-mono text-sm uppercase tracking-wider text-accent transition-colors hover:bg-accent/20"
              >
                {nextProtocol.shortName}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
