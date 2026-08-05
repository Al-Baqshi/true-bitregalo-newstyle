"use client"

import { Button } from "@/components/ui/button"
import { ParallaxScene, type ParallaxLayer } from "@/components/parallax/parallax-scene"
import { Reveal } from "@/components/reveal"
import { ArrowDown, ArrowRight } from "lucide-react"
import Link from "next/link"

const heroLayers: ParallaxLayer[] = [
  {
    src: "/assets/parallax/hero-bg.webp",
    aspect: 16 / 9,
    width: 14,
    position: [0, 0, -1.5],
    parallax: 0.05,
    order: 0,
    scrollFY: 0.05,
  },
  {
    src: "/assets/parallax/hero-vault.webp",
    aspect: 1,
    width: 4,
    position: [0, -1.25, 0],
    parallax: 0.18,
    order: 1,
    scrollFY: 0.3,
    additive: true,
  },
  {
    src: "/assets/parallax/gold-dust.webp",
    aspect: 16 / 9,
    width: 10,
    position: [0, 0, 1],
    parallax: 0.4,
    order: 2,
    scrollFY: 0.45,
    additive: true,
    opacity: 0.8,
  },
]

export function HeroCinematic() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden">
      <ParallaxScene layers={heroLayers} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 pt-32 pb-24 text-center sm:px-6">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent sm:text-sm">
            Decentralised escrow infrastructure · Multi-chain
          </p>
        </Reveal>

        <Reveal delay={120}>
          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-balance sm:text-7xl lg:text-8xl">
            Escrow, enforced
            <br />
            by code.
          </h1>
        </Reveal>

        <Reveal delay={240}>
          <p className="mx-auto mt-8 max-w-xl text-lg text-muted-foreground text-balance sm:text-xl">
            BitRegalo locks commitments in on-chain escrow before work begins.
            No middleman. No custodian. Code decides the outcome.
          </p>
        </Reveal>

        <Reveal delay={360}>
          <div className="pointer-events-auto mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/protocols/escrow">
                Read the documentation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent" asChild>
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
        </Reveal>
      </div>

      <div className="relative z-10 flex justify-center pb-10">
        <a
          href="#lifecycle"
          aria-label="Scroll to how it works"
          className="flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.25em]">How it works</span>
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </a>
      </div>
    </section>
  )
}
