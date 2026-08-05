"use client"

import { ParallaxScene, type ParallaxLayer } from "@/components/parallax/parallax-scene"
import { Reveal } from "@/components/reveal"
import { ArrowLeft, ArrowRight, Clock } from "lucide-react"

const lockLayers: ParallaxLayer[] = [
  {
    src: "/assets/parallax/light-stream.webp",
    aspect: 16 / 9,
    width: 8,
    position: [-0.4, 0, -0.5],
    parallax: 0.1,
    order: 0,
    scrollFX: -0.3,
    additive: true,
  },
  {
    src: "/assets/parallax/hero-vault.webp",
    aspect: 1,
    width: 3.4,
    position: [0.7, -0.2, 0.3],
    parallax: 0.25,
    order: 1,
    scrollFY: 0.3,
    additive: true,
  },
  {
    src: "/assets/parallax/gold-dust.webp",
    aspect: 16 / 9,
    width: 8.5,
    position: [0, 0, 1],
    parallax: 0.4,
    order: 2,
    scrollFY: 0.2,
    additive: true,
    opacity: 0.7,
  },
]

const keysLayers: ParallaxLayer[] = [
  {
    src: "/assets/parallax/gold-dust.webp",
    aspect: 16 / 9,
    width: 9,
    position: [0, 0, -0.6],
    parallax: 0.08,
    order: 0,
    scrollFY: 0.06,
    additive: true,
    opacity: 0.5,
  },
  {
    src: "/assets/parallax/key-issuer.webp",
    aspect: 1,
    width: 3,
    position: [-1.3, 0.35, 0],
    parallax: 0.22,
    order: 1,
    scrollFX: -0.45,
    additive: true,
  },
  {
    src: "/assets/parallax/key-receiver.webp",
    aspect: 1,
    width: 3,
    position: [1.3, -0.3, 0.4],
    parallax: 0.32,
    order: 2,
    scrollFX: 0.45,
    additive: true,
  },
]

const settleLayers: ParallaxLayer[] = [
  {
    src: "/assets/parallax/globe.webp",
    aspect: 16 / 9,
    width: 7.5,
    position: [0, 0, -0.3],
    parallax: 0.1,
    order: 0,
    scrollFY: 0.08,
    additive: true,
  },
  {
    src: "/assets/parallax/gold-dust.webp",
    aspect: 16 / 9,
    width: 8.5,
    position: [0, 0, 0.8],
    parallax: 0.35,
    order: 1,
    scrollFY: 0.3,
    additive: true,
    opacity: 0.6,
  },
]

const outcomes = [
  { label: "RELEASED", text: "The issuer turns their key. The escrow settles to the receiver.", icon: ArrowRight },
  { label: "CANCELLED", text: "The receiver turns theirs. The escrow returns to the issuer.", icon: ArrowLeft },
  { label: "EXPIRED", text: "The term runs out. The escrow returns to the issuer — automatically.", icon: Clock },
]

interface PanelProps {
  index: string
  name: string
  title: string
  scene: ParallaxLayer[]
  flip?: boolean
  children: React.ReactNode
}

function Panel({ index, name, title, scene, flip, children }: PanelProps) {
  return (
    <div className="grid min-h-[85vh] items-center gap-10 py-16 lg:grid-cols-2 lg:gap-16">
      <div className={flip ? "lg:order-2" : ""}>
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            {index} / {name}
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h3 className="mt-5 text-3xl font-bold tracking-tight text-balance sm:text-5xl">{title}</h3>
        </Reveal>
        <Reveal delay={240}>{children}</Reveal>
      </div>
      <ParallaxScene
        layers={scene}
        className={`h-[380px] sm:h-[460px] lg:h-[560px] ${flip ? "lg:order-1" : ""}`}
      />
    </div>
  )
}

export function LifecycleStory() {
  return (
    <section id="lifecycle" className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Panel index="01" name="Lock" title="The escrow locks on-chain." scene={lockLayers}>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            The issuer opens an escrow and commits it for a fixed term. From that moment the
            commitment is ring-fenced — visible to both parties, spendable by neither.
          </p>
        </Panel>

        <Panel index="02" name="Keys" title="Two keys. One direction each." scene={keysLayers} flip>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            The issuer can only release the escrow to the receiver. The receiver can only return it
            to the issuer. Neither side can pull it toward themselves.
          </p>
          <div className="mt-8 space-y-3 max-w-md">
            <div className="flex items-center gap-4 rounded-xl border border-accent/30 bg-accent/5 px-5 py-4">
              <ArrowRight className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-accent">Issuer</p>
                <p className="mt-0.5 text-sm text-foreground">Can only release — the escrow moves forward</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card/50 px-5 py-4">
              <ArrowLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Receiver</p>
                <p className="mt-0.5 text-sm text-foreground">Can only cancel — the escrow goes back</p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel index="03" name="Settle" title="Every path ends safely." scene={settleLayers}>
          <div className="mt-8 space-y-5 max-w-md">
            {outcomes.map((o) => (
              <div key={o.label} className="flex items-start gap-4 border-l-2 border-accent/40 pl-5">
                <div>
                  <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent">
                    <o.icon className="h-3.5 w-3.5" />
                    {o.label}
                  </p>
                  <p className="mt-1 text-base text-muted-foreground">{o.text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-md text-lg text-muted-foreground">
            There is no fourth path. The worst case, for anyone, is getting back exactly what they
            committed.
          </p>
        </Panel>
      </div>
    </section>
  )
}
