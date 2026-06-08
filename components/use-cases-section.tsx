import { Gift, Briefcase, Heart, Building2, ShoppingBag, TrendingUp } from "lucide-react"

const useCases = [
  {
    icon: Gift,
    title: "Personal Gifting",
    description:
      "Send flowers, cakes, and personalized gifts to loved ones anywhere in the world. Perfect for birthdays, anniversaries, and special occasions.",
    features: ["Global delivery", "Verified florists", "Real-time tracking", "Secure payments"],
  },
  {
    icon: Briefcase,
    title: "Business Services",
    description:
      "Hire freelancers, consultants, and service providers for your business needs. From marketing to development, find trusted professionals.",
    features: ["Vetted providers", "Escrow protection", "Milestone payments", "Quality assurance"],
  },
  {
    icon: Heart,
    title: "Charity & Community",
    description:
      "Support charitable causes and community projects with transparent donations. Track every dollar from contribution to impact.",
    features: ["Transparent funding", "Impact tracking", "Community voting", "Audit trails"],
  },
  {
    icon: Building2,
    title: "Real Estate Crowdfunding",
    description:
      "Pool resources with others to support real estate projects. Tokenized tracking with transparent financial management.",
    features: ["Tokenized tracking", "Transparent accounting", "Milestone releases", "Community governance"],
  },
  {
    icon: ShoppingBag,
    title: "E-Commerce Marketplace",
    description:
      "Buy and sell goods with escrow protection. Payment is only released when you confirm receipt and satisfaction.",
    features: ["Buyer protection", "Seller security", "Dispute resolution", "Global reach"],
  },
  {
    icon: TrendingUp,
    title: "Project Management",
    description:
      "Manage complex projects with decentralized transparency. Track budgets, milestones, and payments on-chain.",
    features: ["Milestone tracking", "Budget transparency", "Team collaboration", "Audit trails"],
  },
]

export function UseCasesSection() {
  return (
    <section id="applications" className="py-24 border-t border-border/40 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <TrendingUp className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">Use Cases</span>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Built for every gifting scenario
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From personal gifts to enterprise projects, BitRegalo's platform adapts to your needs with flexible, secure solutions.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/60 bg-card/50 p-6 transition-all duration-300 hover:border-accent/40 hover:bg-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <useCase.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{useCase.title}</h3>
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
