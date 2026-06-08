"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Globe, Lock, Sparkles } from "lucide-react"
import Image from "next/image"

export function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      color: string
    }

    const particles: Particle[] = []
    const particleCount = 50

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: `rgba(255, 215, 100, ${Math.random() * 0.5 + 0.2})`,
      })
    }

    let animationId: number

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > canvas.offsetWidth) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.offsetHeight) particle.vy *= -1

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = particle.opacity
        ctx.fill()
      })

      ctx.globalAlpha = 1
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  const handleScrollToDownload = () => {
    const element = document.getElementById("download")
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-24 lg:pt-36">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className={`mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            The Global Gifting Marketplace
          </div>

          <h1 className={`text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="block text-balance bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FF8C00] bg-clip-text text-transparent">
              Send gifts anywhere.
            </span>
            <span className="block text-balance mt-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Settled on-chain.
            </span>
          </h1>

          <p className={`mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl lg:text-2xl transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            BitRegalo connects gifters with service providers worldwide. Secure escrow, transparent transactions, and blockchain-powered trust.
          </p>

          <div className={`mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Button size="lg" className="w-full sm:w-auto" onClick={handleScrollToDownload}>
              Download the App
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent" asChild>
              <a href="#how-it-works" onClick={(e) => {
                e.preventDefault()
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}>
                Learn How It Works
              </a>
            </Button>
          </div>

          <div className={`mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <span>Secure Escrow</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-accent" />
              <span>50+ Countries</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-accent" />
              <span>On-Chain Trust</span>
            </div>
          </div>
        </div>

        <div className={`mt-20 relative transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 blur-3xl opacity-30" />

          <div className="relative">
            <div className="relative rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/50 backdrop-blur-sm overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-card/80">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-muted-foreground">BitRegalo App</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <span>Global Network</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-xs text-accent">Live</span>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6 p-6 sm:p-8">
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                        <Sparkles className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Gift Request</p>
                        <p className="text-xs text-muted-foreground">Flowers to Paris</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Status: <span className="text-green-400">Matched</span></p>
                      <p>Provider: FloristPro</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <Lock className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Escrow Active</p>
                        <p className="text-xs text-muted-foreground">$150 secured</p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-blue-500/10 rounded-full overflow-hidden">
                      <div className="h-full w-[65%] bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent/10 blur-2xl rounded-full" />
                    <Image
                      src="/BrandLogo copy.svg"
                      alt="BitRegalo"
                      width={200}
                      height={200}
                      className="relative w-32 h-32 sm:w-40 sm:h-40 opacity-80"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                        <Shield className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Delivery Confirmed</p>
                        <p className="text-xs text-muted-foreground">KDC verified</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Payment: <span className="text-green-400">Released</span></p>
                      <p>Rating: ★★★★★</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                    <p className="text-xs text-muted-foreground mb-2">Recent Activity</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gift to Tokyo</span>
                        <span className="text-green-400">Complete</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service: NYC</span>
                        <span className="text-green-400">Complete</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Charity: Kenya</span>
                        <span className="text-accent">In Progress</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
