import { Building2, Shield, Users, Headphones, Globe, Lock, BarChart3, Workflow, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const enterpriseFeatures = [
  {
    icon: Shield,
    title: "Smart Contract as a Service",
    description: "Deploy custom smart contracts on the BitRegalo platform. Tailored solutions for your business needs.",
  },
  {
    icon: Users,
    title: "White-Label Solutions",
    description: "Launch your own branded marketplace powered by BitRegalo's infrastructure and technology.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description: "24/7 enterprise support with dedicated account managers and technical assistance.",
  },
  {
    icon: Globe,
    title: "Global Infrastructure",
    description: "Deploy across multiple regions with our distributed blockchain network and CDN.",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "SOC 2 compliant infrastructure with advanced encryption and audit trails.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Real-time dashboards, custom reports, and API access for business intelligence.",
  },
  {
    icon: Workflow,
    title: "Custom Integrations",
    description: "Seamless integration with your existing systems through our REST API and webhooks.",
  },
  {
    icon: Building2,
    title: "Multi-Tenant Architecture",
    description: "Run multiple marketplaces or business units on a single platform with isolated data.",
  },
]

const industries = ["E-Commerce", "Real Estate", "Freelance", "Charity", "Supply Chain", "Healthcare"]

export function EnterpriseSection() {
  return (
    <section id="enterprise" className="py-24 border-t border-border/40 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <Building2 className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">Enterprise Solutions</span>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Scale with BitRegalo</h2>
          <p className="mt-4 text-muted-foreground">
            Enterprise-grade infrastructure for businesses of all sizes. From startups to Fortune 500 companies, BitRegalo powers your growth.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <p className="text-center text-sm text-muted-foreground mb-6">Trusted by industry leaders</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {industries.map((industry, index) => (
              <div key={index} className="text-lg font-semibold text-muted-foreground/60">
                {industry}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {enterpriseFeatures.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/60 bg-card/50 p-6 transition-all duration-300 hover:scale-105 hover:border-accent/40 hover:bg-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold">{feature.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-accent/40 bg-gradient-to-b from-accent/10 to-transparent p-8 text-center sm:p-12">
          <h3 className="text-xl font-bold">Ready to build on BitRegalo?</h3>
          <p className="mt-4 text-muted-foreground">
            Talk to our enterprise team to learn how BitRegalo can power your business with blockchain technology.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg">
              Contact Sales
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
