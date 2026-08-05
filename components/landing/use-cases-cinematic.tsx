import { Reveal } from "@/components/reveal"
import Image from "next/image"
import { Briefcase, Globe2, Landmark } from "lucide-react"

const smallCases = [
  {
    icon: Briefcase,
    title: "Freelance & milestones",
    text: "The engagement goes into escrow before work starts. Each milestone releases on acceptance.",
  },
  {
    icon: Globe2,
    title: "Cross-border trade",
    text: "Two parties who have never met, trading without a bank in the middle.",
  },
  {
    icon: Landmark,
    title: "Grants & allocations",
    text: "Every allocation visible to everyone. Whatever isn't released returns automatically at term.",
  },
]

export function UseCasesCinematic() {
  return (
    <section id="use-cases" className="border-t border-border/40 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent sm:text-sm">Use cases</p>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
              Where on-chain escrow changes everything
            </h2>
          </Reveal>
        </div>

        <div className="mt-16 space-y-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-border/60">
              <Image
                src="/assets/parallax/construction.webp"
                alt="Construction site skyline at night with tower cranes"
                width={2688}
                height={1520}
                className="h-[420px] w-full object-cover sm:h-[520px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 sm:p-12">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Construction</p>
                <h3 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-balance sm:text-4xl">
                  If the head contractor collapses, the subcontractors don&apos;t.
                </h3>
                <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  Every package is ring-fenced in its own escrow before work begins. Insolvency
                  upstream can&apos;t reach what was committed downstream — the subbies who
                  delivered still receive what was locked in for them.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-border/60">
              <Image
                src="/assets/parallax/light-stream.webp"
                alt="A stream of golden light"
                width={2688}
                height={1520}
                className="h-[420px] w-full object-cover sm:h-[520px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 sm:p-12">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Nonprofits & donations</p>
                <h3 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-balance sm:text-4xl">
                  Donate into escrow. Release on delivery.
                </h3>
                <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  Every contribution is publicly visible from pledge to release. Donors see exactly
                  where it sits — and exactly when it moves.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {smallCases.map((c, i) => (
            <Reveal key={c.title} delay={i * 120}>
              <div className="h-full rounded-2xl border border-border/60 bg-card/40 p-6">
                <c.icon className="h-6 w-6 text-accent" />
                <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
