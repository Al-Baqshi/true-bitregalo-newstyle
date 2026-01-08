import { Coins, Lock, TrendingUp, Users, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

const tokenUtilities = [
  {
    icon: Zap,
    title: "Protocol Fees",
    description: "Use BTR tokens to pay for protocol usage across Escrow, RFP, RTS, and UserAuth services.",
  },
  {
    icon: Lock,
    title: "Staking & Rewards",
    description: "Stake BTR tokens to earn rewards and participate in protocol governance decisions.",
  },
  {
    icon: Shield,
    title: "Network Security",
    description: "Token holders contribute to network security through staking mechanisms.",
  },
  {
    icon: Users,
    title: "Governance Rights",
    description: "Hold BTR tokens to vote on protocol upgrades and parameter changes.",
  },
]

const tokenomics = [
  { label: "Total Supply", value: "1,000,000,000 BTR" },
  { label: "Protocol Reserve", value: "30%" },
  { label: "Community Rewards", value: "25%" },
  { label: "Team & Advisors", value: "20%" },
  { label: "Public Sale", value: "15%" },
  { label: "Ecosystem Growth", value: "10%" },
]

export function TokenomicsSection() {
  return (
    <section id="tokenomics" className="py-24 border-t border-border/40 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <Coins className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">Tokenomics</span>
          </div>
          <h2 className="mt-4 font-mono text-3xl font-bold tracking-tight sm:text-4xl">BTR Utility Token</h2>
          <p className="mt-4 text-muted-foreground">
            The BTR token powers the BitRegalo ecosystem, providing access to protocol services and governance
            participation.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-[#141414] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="font-mono text-xl font-semibold">Token Distribution</h3>
            </div>
            <div className="space-y-4">
              {tokenomics.map((item, index) => (
                <div key={index} className="flex items-center justify-between pb-3 border-b border-border/40">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="font-mono text-sm font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-mono text-xl font-semibold">Token Utility</h3>
            <div className="space-y-4">
              {tokenUtilities.map((utility, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border/60 bg-[#141414] p-6 transition-all hover:border-accent/40"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent flex-shrink-0">
                      <utility.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-mono text-sm font-semibold">{utility.title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{utility.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-accent/40 bg-gradient-to-b from-accent/10 to-transparent p-8 text-center">
          <h3 className="font-mono text-xl font-bold">Join the BTR Ecosystem</h3>
          <p className="mt-4 text-muted-foreground">
            Get early access to BTR token sale and be part of the blockchain verification revolution.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg">Join Waitlist</Button>
            <Button size="lg" variant="outline">
              Read Token Paper
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
