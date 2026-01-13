import { Book, FileText, Shield, Download, ExternalLink, Blocks } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const whitepaperSections = [
  {
    icon: Book,
    title: "Executive Summary",
    description: "Overview of BitRegalo's vision and the problem we're solving with blockchain verification",
    links: ["Introduction", "Problem Statement", "Our Solution"],
  },
  {
    icon: Blocks,
    title: "Protocol Architecture",
    description: "Technical deep-dive into our protocol design and smart contract infrastructure",
    links: ["Escrow Protocol", "RFP System", "RTS Mechanism", "UserAuth"],
  },
  {
    icon: Shield,
    title: "Security Model",
    description: "Cryptographic primitives, hashing, timestamping, and integrity verification",
    links: ["Proof-of-Existence", "Zero-Knowledge Proofs", "Audit Reports"],
  },
  {
    icon: FileText,
    title: "Use Cases",
    description: "Real-world applications across industries from government to startups",
    links: ["Real Estate", "Supply Chain", "Identity Verification", "E-Commerce"],
  },
]

export function DocsSection() {
  return (
    <section id="docs" className="py-24 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <Book className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">Whitepaper</span>
          </div>
          <h2 className="mt-4 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            Deep dive into our technology
          </h2>
          <p className="mt-4 text-muted-foreground">
            Comprehensive technical documentation detailing our proof-of-existence engine, smart contract protocols, and
            verification infrastructure.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {whitepaperSections.map((section, index) => (
            <div
              key={index}
              className="group relative rounded-xl border border-border/60 bg-[#141414] p-6 transition-all duration-300 hover:border-accent/40 hover:bg-[#1a1a1a] scale-100 hover:scale-105"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <section.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-mono font-semibold">{section.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
              <ul className="mt-4 space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href="#"
                      className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent"
                    >
                      <FileText className="h-3 w-3" />
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" className="gap-2" asChild>
            <Link href="/whitepaper">
              <Download className="h-4 w-4" />
              View Full Whitepaper
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-2 bg-transparent" asChild>
            <Link href="/whitepaper">
              <Download className="h-4 w-4" />
              Download PDF
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
