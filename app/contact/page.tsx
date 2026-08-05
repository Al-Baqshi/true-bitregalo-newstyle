import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Reveal } from "@/components/reveal"
import { Mail, Phone } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact — BitRegalo",
  description: "Reach the BitRegalo team directly by email or phone. No forms.",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
        <div className="relative mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-4 py-32 text-center sm:px-6">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent sm:text-sm">Contact</p>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Reach out. A person answers.
            </h1>
          </Reveal>
          <Reveal delay={240}>
            <p className="mx-auto mt-6 max-w-md text-lg text-muted-foreground">
              No forms, no tickets. Tell us what you want to put in escrow — or just ask a question.
            </p>
          </Reveal>
          <Reveal delay={360}>
            <div className="mt-12 flex w-full max-w-md flex-col gap-4">
              <a
                href="mailto:ceo@bitregalo.com"
                className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card/40 px-6 py-5 transition-colors hover:border-accent/40 hover:bg-card"
              >
                <Mail className="h-5 w-5 shrink-0 text-accent" />
                <div className="text-left">
                  <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Email</p>
                  <p className="mt-0.5 font-mono text-base text-foreground sm:text-lg">ceo@bitregalo.com</p>
                </div>
              </a>
              <a
                href="tel:+64273385000"
                className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card/40 px-6 py-5 transition-colors hover:border-accent/40 hover:bg-card"
              >
                <Phone className="h-5 w-5 shrink-0 text-accent" />
                <div className="text-left">
                  <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Mobile · New Zealand</p>
                  <p className="mt-0.5 font-mono text-base text-foreground sm:text-lg">+64 27 338 5000</p>
                </div>
              </a>
            </div>
          </Reveal>
          <Reveal delay={480}>
            <p className="mt-12 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              BitRegalo® Limited · New Zealand
            </p>
          </Reveal>
        </div>
      </section>
      <Footer />
    </main>
  )
}
