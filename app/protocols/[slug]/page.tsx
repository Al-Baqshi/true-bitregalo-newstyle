import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Lock, FileCheck, TrendingUp } from "lucide-react"
import Image from "next/image"

const protocols = {
  escrow: {
    title: "Escrow Protocol",
    icon: Lock,
    description: "Secure multi-party transactions with time-based duration and automated fund management. Funds can be released by the issuer or automatically returned if not released during the duration.",
    image: "/assets/escrow-card.svg",
    slug: "escrow",
    codeExample: `$ bitregalo protocol escrow create

✓ Escrow contract initialized
✓ Duration set: 2026-01-15 to 2026-02-15
✓ Issuer: 0x3d9f...8a2c
✓ Receiver: 0x7e4b...c3f1
✓ Funds locked in smart contract

Escrow active - issuer can release, receiver can cancel ▸`,
    details: [
      {
        title: "Automated Release & Return",
        description: "Funds can be released automatically or when the issuer decides to release during the duration. If not released, funds automatically return to the issuer at the end of the duration. No third-party intervention required.",
      },
      {
        title: "Time-Based Duration",
        description: "Each escrow has a start date and end date determined by either party. The issuer creates the escrow and sets the duration. During this period, funds are securely held in the smart contract.",
      },
      {
        title: "Role-Based Actions",
        description: "During the escrow duration, only two actions are possible: the issuer can release funds to the receiver, or the receiver can cancel the escrow. This eliminates the need for third-party arbitration or intervention.",
      },
      {
        title: "Secure Smart Contract Holding",
        description: "All funds and transactions are held securely in the smart contract during the escrow duration. The contract enforces the rules automatically, ensuring trustless and transparent transactions without intermediaries.",
      },
    ],
  },
  rfp: {
    title: "Request for Proposal (RFP)",
    icon: FileCheck,
    description: "On-chain RFP management system connecting demand with qualified suppliers. Transparent bid submission and evaluation process.",
    image: "/assets/rfp.svg",
    slug: "rfp",
    codeExample: `// Request for Proposal on-chain

const rfp = await bitregalo.createRFP({
  requirements: proposal.specs,
  deadline: '2026-02-01',
  proofHash: '0x9a3e...f7d2'
})

✓ RFP recorded on immutable ledger`,
    details: [
      {
        title: "On-Chain Transparency",
        description: "All RFP submissions and evaluations are recorded on the blockchain, ensuring complete transparency and auditability.",
      },
      {
        title: "Automated Matching",
        description: "Connect demand with qualified suppliers through automated matching algorithms based on requirements and capabilities.",
      },
      {
        title: "Immutable Records",
        description: "All bid submissions and evaluations are permanently recorded on-chain, preventing tampering and ensuring fairness.",
      },
      {
        title: "Transparent Evaluation",
        description: "Evaluation criteria and processes are publicly verifiable, ensuring fair and unbiased selection of proposals.",
      },
    ],
  },
  rts: {
    title: "Request to Supply (RTS)",
    icon: TrendingUp,
    description: "Streamlined supply-side protocol for vendors to offer services and products. Automated matching with demand requirements.",
    image: "/assets/ert-escrow.svg",
    slug: "rts",
    codeExample: `$ bitregalo protocol rts create

✓ Supply offer created
✓ Automated matching enabled
✓ Requirements verified
✓ On-chain listing active`,
    details: [
      {
        title: "Supply-Side Optimization",
        description: "Vendors can efficiently list their services and products, making them discoverable by potential buyers through automated matching.",
      },
      {
        title: "Automated Matching",
        description: "Automatically match vendor offerings with buyer requirements, streamlining the procurement process.",
      },
      {
        title: "Real-Time Updates",
        description: "Receive instant notifications when matching opportunities arise, enabling quick response times.",
      },
      {
        title: "Verification & Trust",
        description: "Vendor credentials and service history are verified on-chain, building trust with potential buyers.",
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
  const protocol = protocols[slug as keyof typeof protocols]
  if (!protocol) {
    return {
      title: "Protocol Not Found — BitRegalo",
    }
  }
  return {
    title: `${protocol.title} — BitRegalo`,
    description: protocol.description,
  }
}

export default async function ProtocolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const protocol = protocols[slug as keyof typeof protocols]
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
  const prevSlug = currentIndex > 0 ? protocolOrder[currentIndex - 1] : protocolOrder[protocolOrder.length - 1]
  const nextSlug = currentIndex < protocolOrder.length - 1 ? protocolOrder[currentIndex + 1] : protocolOrder[0]
  const prevProtocol = protocols[prevSlug as keyof typeof protocols]
  const nextProtocol = protocols[nextSlug as keyof typeof protocols]
  const Icon = protocol.icon

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-8 sm:p-12">
            <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-secondary">
              <Icon className="h-8 w-8 text-foreground" />
            </div>

            <h1 className="font-mono text-4xl font-bold tracking-tight sm:text-5xl mb-4">{protocol.title}</h1>
            <p className="text-lg text-muted-foreground mb-8">{protocol.description}</p>

            {protocol.image && (
              <div className="mb-12 rounded-lg border border-border/40 overflow-hidden">
                <Image
                  src={protocol.image}
                  alt={protocol.title}
                  width={400}
                  height={370}
                  className="w-full h-auto"
                  style={{ fontWeight: 300 }}
                />
              </div>
            )}

            <div className="space-y-8">
              <section>
                <h2 className="font-mono text-2xl font-semibold mb-6">Key Features</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {protocol.details.map((detail, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-border/60 bg-[#141414] p-6 transition-all hover:border-accent/40"
                    >
                      <h3 className="font-mono text-lg font-semibold mb-2">{detail.title}</h3>
                      <p className="text-sm text-muted-foreground">{detail.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="font-mono text-2xl font-semibold mb-6">Code Example</h2>
                <div className="rounded-xl border border-border/60 bg-[#141414] p-6">
                  <pre className="text-sm font-mono text-foreground overflow-x-auto">
                    <code>{protocol.codeExample}</code>
                  </pre>
                </div>
              </section>

              {slug === "escrow" && (
                <>
                  <section>
                    <h2 className="font-mono text-2xl font-semibold mb-6">Escrow Flow Diagram</h2>
                    <div className="rounded-xl border border-border/60 bg-[#141414] p-6 mb-4">
                      <div className="mb-4">
                        <Image
                          src="/escrow-drow.svg"
                          alt="Escrow Flow Diagram"
                          width={800}
                          height={600}
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p>
                          This diagram illustrates the complete escrow workflow from creation to completion. The flow shows
                          the interaction between the <strong className="text-foreground">Issuer</strong> (Entity-A) and{" "}
                          <strong className="text-foreground">Receiver</strong> (Entity-B) throughout the escrow duration.
                        </p>
                        <div className="space-y-2">
                          <p>
                            <strong className="text-foreground">Key Components:</strong>
                          </p>
                          <ul className="ml-6 list-disc space-y-1">
                            <li>
                              <strong className="text-foreground">Start Duration:</strong> The escrow period begins when
                              the issuer creates the contract and sets the start date.
                            </li>
                            <li>
                              <strong className="text-foreground">End Duration:</strong> The escrow automatically expires
                              at the end date, returning funds to the issuer if not released.
                            </li>
                            <li>
                              <strong className="text-foreground">Issuer Actions:</strong> During the duration, the
                              issuer can release funds to the receiver at any time.
                            </li>
                            <li>
                              <strong className="text-foreground">Receiver Actions:</strong> The receiver can cancel
                              the escrow during the duration, which returns funds to the issuer.
                            </li>
                            <li>
                              <strong className="text-foreground">Smart Contract:</strong> All funds are held securely
                              in the escrow smart contract, with automatic enforcement of rules.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="font-mono text-2xl font-semibold mb-6">Escrow Architecture</h2>
                    <div className="rounded-xl border border-border/60 bg-[#141414] p-6">
                      <div className="mb-4">
                        <Image
                          src="/escrow-hero.svg"
                          alt="Escrow Architecture Overview"
                          width={800}
                          height={400}
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p>
                          This architecture diagram provides a comprehensive overview of the Escrow Protocol&apos;s
                          technical implementation and system design.
                        </p>
                        <div className="space-y-2">
                          <p>
                            <strong className="text-foreground">System Architecture:</strong>
                          </p>
                          <ul className="ml-6 list-disc space-y-1">
                            <li>
                              Shows the relationship between different components of the escrow system, including smart
                              contract interactions, blockchain integration, and user interfaces.
                            </li>
                            <li>
                              Demonstrates how the protocol ensures security, transparency, and automated execution
                              without requiring third-party intermediaries.
                            </li>
                            <li>
                              Illustrates the time-based duration mechanism and how it integrates with the blockchain to
                              enforce escrow rules automatically.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <Link
                href={`/protocols/${prevSlug}`}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider">Previous</span>
                  <span className="font-mono">{prevProtocol.title}</span>
                </div>
              </Link>

              <Link
                href={`/protocols/${nextSlug}`}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <div className="flex flex-col text-right">
                  <span className="text-xs uppercase tracking-wider">Next</span>
                  <span className="font-mono">{nextProtocol.title}</span>
                </div>
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
