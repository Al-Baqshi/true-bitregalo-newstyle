import { Reveal } from "@/components/reveal"
import { KeyRound, Layers, ShieldOff } from "lucide-react"

const pillars = [
  {
    icon: ShieldOff,
    title: "Non-custodial",
    text: "BitRegalo never takes custody. Every escrow lives in a smart contract, not in our accounts.",
  },
  {
    icon: KeyRound,
    title: "No admin key",
    text: "The contract's only possible moves are toward the receiver or back to the issuer.",
  },
  {
    icon: Layers,
    title: "Multi-chain",
    text: "The same escrow protocol, deployed across multiple networks. Pick the chain that fits.",
  },
]

const comparison = [
  { label: "Custody", traditional: "A third party holds the escrow", bitregalo: "A smart contract holds the escrow" },
  { label: "Trust", traditional: "You trust an agent", bitregalo: "You verify the code" },
  { label: "Disputes", traditional: "Arbitration — weeks or months", bitregalo: "Deterministic outcomes — instant" },
  { label: "Worst case", traditional: "The escrow is frozen or lost", bitregalo: "The escrow returns to the issuer" },
  { label: "Visibility", traditional: "Statements on request", bitregalo: "On-chain, in real time" },
]

export function AssuranceSection() {
  return (
    <section id="assurance" className="border-t border-border/40 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
              No one else can touch it.
              <br />
              <span className="text-accent">Not even us.</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-6 text-lg text-muted-foreground">
              Traditional escrow asks you to trust an agent. BitRegalo is decentralised
              infrastructure — the agent is replaced by a contract whose rules cannot bend.
            </p>
          </Reveal>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 120}>
              <div className="h-full rounded-2xl border border-border/60 bg-card/40 p-6">
                <p.icon className="h-6 w-6 text-accent" />
                <h3 className="mt-4 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl border border-border/60">
            <div className="grid grid-cols-[1fr_1.2fr_1.2fr] border-b border-border/60 bg-card/60 px-2 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground sm:px-6 sm:text-sm">
              <span />
              <span>Traditional escrow</span>
              <span className="text-accent">BitRegalo</span>
            </div>
            {comparison.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1fr_1.2fr_1.2fr] border-b border-border/40 px-2 py-4 text-xs last:border-b-0 sm:px-6 sm:text-sm"
              >
                <span className="font-mono uppercase tracking-wider text-muted-foreground">{row.label}</span>
                <span className="pr-4 text-muted-foreground">{row.traditional}</span>
                <span className="text-foreground">{row.bitregalo}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
