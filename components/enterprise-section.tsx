import { Building2, Shield, Users, Headphones, Globe, Lock, BarChart3, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"

const enterpriseFeatures = [
  {
    icon: Shield,
    title: "On-Chain Transaction Proof",
    description: "Immutable verification of transactions with cryptographic guarantees and timestamping.",
  },
  {
    icon: Users,
    title: "Web3 Backend Integration",
    description: "Bridge traditional backend systems with blockchain verification for hybrid applications.",
  },
  {
    icon: Headphones,
    title: "Financial Services Ready",
    description: "Built for local banking, remittances, and financial applications requiring audit trails.",
  },
  {
    icon: Globe,
    title: "Cross-Chain Compatibility",
    description: "Deploy across multiple blockchain networks with unified verification layer.",
  },
  {
    icon: Lock,
    title: "Cryptographic Integrity",
    description: "Hashing, timestamping, and digital signatures ensure data authenticity and non-repudiation.",
  },
  {
    icon: BarChart3,
    title: "Compliance & Auditing",
    description: "Automated compliance reporting with complete transaction history for regulatory needs.",
  },
  {
    icon: Workflow,
    title: "Smart Contract Automation",
    description: "Self-executing contracts with programmable conditions and automatic settlement.",
  },
  {
    icon: Building2,
    title: "Enterprise Deployment",
    description: "Private or public blockchain deployment with institutional-grade security standards.",
  },
]

const logos = ["Banking", "Fintech", "Real Estate", "Supply Chain", "Insurance", "Healthcare"]

export function EnterpriseSection() {
  return (
    <section id="enterprise" className="py-24 border-t border-border/40 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <Building2 className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">Enterprise Solutions</span>
          </div>
          <h2 className="mt-4 font-mono text-3xl font-bold tracking-tight sm:text-4xl">Why Choose BitRegalo?</h2>
          <p className="mt-4 text-muted-foreground">
            BitRegalo offers unparalleled benefits that set it apart in the realm of smart contract services. Trusted by
            governments, enterprises, and startups worldwide.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <p className="text-center text-sm text-muted-foreground mb-6">Crafted for</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {logos.map((logo, index) => (
              <div key={index} className="font-mono text-lg font-semibold text-muted-foreground/60">
                {logo}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {enterpriseFeatures.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/60 bg-[#141414] p-6 transition-all duration-300 scale-100 hover:scale-105 hover:border-accent/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-mono text-sm font-semibold">{feature.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-accent/40 bg-gradient-to-b from-accent/10 to-transparent p-8 text-center sm:p-12">
          <h3 className="font-mono text-xl font-bold">Ready to build on BitRegalo?</h3>
          <p className="mt-4 text-muted-foreground">
            Talk to our team to learn how BitRegalo can power your blockchain verification needs.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg">Contact Us</Button>
            <Button size="lg" variant="outline">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
