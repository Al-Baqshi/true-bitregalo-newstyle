import { Reveal } from "@/components/reveal"
import Link from "next/link"
import { ArrowUpRight, FileText, GitBranch, ScrollText } from "lucide-react"

const docs = [
  {
    icon: ScrollText,
    title: "Escrow protocol",
    text: "The exact rules every escrow follows — states, permissions, and outcomes.",
    href: "/protocols/escrow",
  },
  {
    icon: GitBranch,
    title: "RFP & RTS protocols",
    text: "Procurement rails built on the same escrow primitive.",
    href: "/protocols/rfp",
  },
  {
    icon: FileText,
    title: "Whitepaper",
    text: "The full picture: architecture, strategy, and the road ahead.",
    href: "/whitepaper",
  },
]

export function ProtocolSection() {
  return (
    <section id="protocol" className="border-t border-border/40 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent sm:text-sm">Protocol</p>
            </Reveal>
            <Reveal delay={120}>
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
                A protocol, not a promise.
              </h2>
            </Reveal>
            <Reveal delay={240}>
              <p className="mt-6 max-w-md text-lg text-muted-foreground">
                Everything on this page is enforced by a published smart contract you can read,
                verify, and build on — on every chain we deploy to.
              </p>
            </Reveal>
            <Reveal delay={360}>
              <div className="mt-8 rounded-xl border border-border/60 bg-card/60 p-5 font-mono text-xs text-muted-foreground sm:text-sm">
                <p>
                  <span className="text-accent">escrow</span>.create(receiver, amount, term)
                </p>
                <p className="mt-2 pl-4">
                  → issuer.<span className="text-accent">release</span>() <span className="text-muted-foreground/60">— settles to receiver</span>
                </p>
                <p className="pl-4">
                  → receiver.<span className="text-accent">cancel</span>() <span className="text-muted-foreground/60">— returns to issuer</span>
                </p>
                <p className="pl-4">
                  → term.<span className="text-accent">expire</span>() <span className="text-muted-foreground/60">— returns to issuer</span>
                </p>
              </div>
            </Reveal>
          </div>

          <div className="space-y-4">
            {docs.map((d, i) => (
              <Reveal key={d.title} delay={i * 120}>
                <Link
                  href={d.href}
                  className="group flex items-start gap-5 rounded-2xl border border-border/60 bg-card/40 p-6 transition-colors hover:border-accent/40 hover:bg-card"
                >
                  <d.icon className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
                  <div className="flex-1">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      {d.title}
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{d.text}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
