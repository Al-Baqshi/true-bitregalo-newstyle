import { Database, Building2, ShoppingCart, FileText, Lock, TrendingUp } from "lucide-react"

const useCases = [
  {
    icon: Database,
    title: "Transaction Verification",
    description:
      "Provide immutable proof of financial transactions with on-chain verification. Perfect for banking, remittances, and cross-border payments.",
    features: ["Instant verification", "Cryptographic proof", "Regulatory compliance", "Audit trail"],
  },
  {
    icon: Building2,
    title: "Local Banking Infrastructure",
    description:
      "Enable local banks to leverage blockchain verification without rebuilding core systems. Web3 proof layer for traditional backend operations.",
    features: ["Legacy integration", "Hybrid architecture", "Cost-effective", "Gradual migration"],
  },
  {
    icon: ShoppingCart,
    title: "E-Commerce & Marketplace",
    description:
      "Trustless escrow for online marketplaces. Automated payment release upon delivery confirmation with dispute resolution protocols.",
    features: ["Buyer protection", "Seller security", "Automated settlement", "Dispute handling"],
  },
  {
    icon: FileText,
    title: "Document Notarization",
    description:
      "Timestamp and verify documents on-chain. Legal agreements, certificates, and records with tamper-proof proof-of-existence.",
    features: ["Legal validity", "Timestamping", "Multi-party signing", "Permanent record"],
  },
  {
    icon: Lock,
    title: "Identity & KYC",
    description:
      "Decentralized identity with privacy-preserving KYC. Users control their data while maintaining compliance with regulations.",
    features: ["Privacy-first", "Reusable KYC", "Zero-knowledge proofs", "Self-sovereign ID"],
  },
  {
    icon: TrendingUp,
    title: "Supply Chain Tracking",
    description:
      "Track goods from origin to destination with verifiable checkpoints. Ensure authenticity and prevent counterfeiting.",
    features: ["End-to-end tracking", "Authenticity proof", "Multi-stakeholder", "Real-time updates"],
  },
]

export function UseCasesSection() {
  return (
    <section id="applications" className="py-24 border-t border-border/40 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <TrendingUp className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">Applications</span>
          </div>
          <h2 className="mt-4 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            Real-World Blockchain Applications
          </h2>
          <p className="mt-4 text-muted-foreground">
            From financial services to supply chain, BitRegalo provides blockchain verification for industries that need
            trust and transparency.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/60 bg-[#141414] p-6 transition-all duration-300 hover:border-accent/40 hover:bg-[#1a1a1a]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <useCase.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-mono text-lg font-semibold">{useCase.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{useCase.description}</p>
              <ul className="mt-4 space-y-2">
                {useCase.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-1 w-1 rounded-full bg-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
