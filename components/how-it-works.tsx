import { Gift, Search, Shield, CheckCircle, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: Gift,
    step: "01",
    title: "Post Your Gift Request",
    description:
      "Describe what you want to send — flowers, services, or custom gifts. Set your budget and delivery location.",
    color: "from-accent to-orange-500",
  },
  {
    icon: Search,
    step: "02",
    title: "Get Matched with Providers",
    description:
      "Qualified service providers submit proposals. Review ratings, portfolios, and choose the best match.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Shield,
    step: "03",
    title: "Secure Escrow Protection",
    description:
      "Your payment is held safely in escrow. Funds are only released when you confirm delivery with your Key Delivery Code.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Delivery & Settlement",
    description:
      "Gift delivered, code confirmed, payment released. Both parties rate the experience. On-chain transparency.",
    color: "from-green-500 to-emerald-500",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <Gift className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">How It Works</span>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Four simple steps to global gifting
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From request to delivery, BitRegalo makes sending gifts anywhere in the world secure, transparent, and effortless.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                <div className="rounded-2xl border border-border/60 bg-card/50 p-6 transition-all duration-300 hover:border-accent/40 hover:bg-card h-full">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} mb-4`}>
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="text-xs font-mono text-muted-foreground mb-2">
                    STEP {step.step}
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                  
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
