import { Coins, Lock, TrendingUp, Users, Zap, Shield, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const tokenUtilities = [
  {
    icon: Zap,
    title: "Platform Access",
    description: "Use BTR tokens to access escrow, RFP, and marketplace services across the BitRegalo platform.",
  },
  {
    icon: Lock,
    title: "Network Participation",
    description: "Stake BTR tokens to participate in network governance and help shape platform decisions.",
  },
  {
    icon: Shield,
    title: "Network Security",
    description: "Token holders contribute to network security through staking and validation mechanisms.",
  },
  {
    icon: Users,
    title: "Governance Rights",
    description: "Hold BTR tokens to vote on protocol upgrades, fee structures, and platform parameters.",
  },
]

const btrTokenomics = [
  { label: "Total Supply", value: "70,000,000 BTR" },
  { label: "Platform Reserve", value: "50%" },
  { label: "Community Distribution", value: "50%" },
  { label: "Blockchain", value: "BSC (BEP20)" },
  { label: "Token Type", value: "Utility Token" },
  { label: "Swap Ratio", value: "1:1 to Regalo" },
]

export function TokenomicsSection() {
  return (
    <section id="tokenomics" className="py-24 border-t border-border/40 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <Coins className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">Tokenomics</span>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">BTR & Regalo Tokens</h2>
          <p className="mt-4 text-muted-foreground">
            The BTR token powers fundraising and early access, while Regalo fuels the zk-regalo mainnet with adaptive supply and zero-knowledge privacy.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">BTR Token</h3>
                <p className="text-xs text-muted-foreground">BSC BEP20 • Fundraising</p>
              </div>
            </div>
            <div className="space-y-4">
              {btrTokenomics.map((item, index) => (
                <div key={index} className="flex items-center justify-between pb-3 border-b border-border/40 last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="font-mono text-sm font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <Coins className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Regalo Token</h3>
                  <p className="text-xs text-muted-foreground">zk-regalo Mainnet • Adaptive Supply</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-semibold">Scalability:</span> zk-rollup technology for thousands of TPS with minimal fees
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-semibold">Privacy:</span> Zero-knowledge proofs ensure transaction confidentiality
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <span className="text-foreground font-semibold">Compatibility:</span> EVM-compatible with existing Ethereum tools and wallets
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold">Token Utility</h3>
            <div className="space-y-4">
              {tokenUtilities.slice(0, 2).map((utility, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border/60 bg-card/50 p-6 transition-all hover:border-accent/40"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent flex-shrink-0">
                      <utility.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{utility.title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{utility.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-accent/40 bg-gradient-to-b from-accent/10 to-transparent p-8 text-center">
          <h3 className="text-xl font-bold">Join the BTR Ecosystem</h3>
          <p className="mt-4 text-muted-foreground">
            Access the BitRegalo platform and be part of the future of decentralized gifting and smart contract services.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg">
              Get Platform Access
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent" asChild>
              <a href="/whitepaper">
                Read Whitepaper
              </a>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            BTR is a utility token for platform access and services. Not a security or investment instrument.
          </p>
        </div>
      </div>
    </section>
  )
}
