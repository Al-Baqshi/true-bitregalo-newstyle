"use client"

import { Button } from "@/components/ui/button"
import { ParallaxScene, type ParallaxLayer } from "@/components/parallax/parallax-scene"
import { Reveal } from "@/components/reveal"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

const ctaLayers: ParallaxLayer[] = [
  {
    src: "/assets/parallax/hero-vault.webp",
    aspect: 1,
    width: 5,
    position: [0, -0.4, -0.5],
    parallax: 0.08,
    order: 0,
    scrollFY: 0.15,
    additive: true,
    opacity: 0.55,
  },
  {
    src: "/assets/parallax/gold-dust.webp",
    aspect: 16 / 9,
    width: 10,
    position: [0, 0, 0.8],
    parallax: 0.3,
    order: 1,
    scrollFY: 0.3,
    additive: true,
    opacity: 0.6,
  },
]

export function FinalCTA() {
  return (
    <section id="start" className="relative overflow-hidden border-t border-border/40">
      <ParallaxScene layers={ctaLayers} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />

      <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <Reveal>
          <h2 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Put the trust on-chain.
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Talk to us about what BitRegalo can ring-fence for your project. No forms — reach us
            directly.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <div className="pointer-events-auto mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <a href="mailto:ceo@bitregalo.com">
                ceo@bitregalo.com
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent" asChild>
              <a href="tel:+64273385000">+64 27 338 5000</a>
            </Button>
          </div>
        </Reveal>
        <Reveal delay={400}>
          <p className="pointer-events-auto mt-8 text-sm text-muted-foreground">
            Want the detail first?{" "}
            <Link href="/protocols/escrow" className="text-accent transition-colors hover:text-accent/80">
              Read the documentation
            </Link>
          </p>
        </Reveal>
        <Reveal delay={500}>
          <p className="mt-12 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            BitRegalo® Limited · New Zealand
          </p>
        </Reveal>
      </div>
    </section>
  )
}
