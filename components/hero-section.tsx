"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Lock,
  Shield,
  Clock,
  Activity,
  Blocks,
  Users,
  TrendingUp,
  FileCheck,
  Sparkles,
  Code,
} from "lucide-react"
import Image from "next/image"

export function HeroSection() {
  const [codeLineIndex, setCodeLineIndex] = useState(0)
  const [displayedText1, setDisplayedText1] = useState("")
  const [displayedText2, setDisplayedText2] = useState("")
  const [isTypingDone, setIsTypingDone] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleScrollToFeatures = () => {
    const element = document.getElementById("features")
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  const text1 = "Prove it."
  const text2 = "Secure it. Own it."

  const codeLines = [
    "import { BitRegalo } from '@bitregalo/sdk'",
    "import { createEscrow } from '@bitregalo/escrow'",
    "",
    "const client = BitRegalo.connect({",
    "  network: 'mainnet',",
    "  protocol: 'escrow'",
    "})",
    "",
    "export const verifyAsset = async (asset) => {",
    "  return client.proofOfExistence(asset)",
    "}",
    "",
    "export async function CreateEscrow() {",
    "  const escrow = await createEscrow({",
    "    amount: '1000',",
    "    parties: ['buyer', 'seller']",
    "  })",
    "  return <EscrowView data={escrow} />",
    "}",
    "",
    "// Smart Contract Integration",
    "export async function POST(request: Request) {",
    "  const tx = await client.executeContract({",
    "    protocol: 'RFP',",
    "    action: 'submit'",
    "  })",
    "  return Response.json(tx)",
    "}",
    "",
    "// User Authentication",
    "export function middleware(req: Request) {",
    "  const did = req.headers.get('x-did')",
    "  return client.authenticate(did)",
    "}",
  ]

  useEffect(() => {
    let currentIndex = 0
    const fullText = text1 + "|" + text2 // Use | as separator

    const typeInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        const currentChar = fullText.substring(0, currentIndex)
        const parts = currentChar.split("|")
        setDisplayedText1(parts[0] || "")
        setDisplayedText2(parts[1] || "")
        currentIndex++
      } else {
        clearInterval(typeInterval)
        setIsTypingDone(true)
      }
    }, 80)

    return () => clearInterval(typeInterval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCodeLineIndex((prev) => (prev + 1) % codeLines.length)
    }, 800)
    return () => clearInterval(interval)
  }, [codeLines.length])

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

    interface GridDot {
      x: number
      y: number
      direction: "horizontal" | "vertical"
      speed: number
      size: number
      opacity: number
      color: string
      targetX: number
      targetY: number
      trail: { x: number; y: number }[]
    }

    const colors = ["rgba(255, 255, 255, 0.5)"] // Changed colors array to white with 0.5 opacity
    const gridSize = 64 // 4rem = 64px to match the grid background
    const dotCount = 30 // Increased dot count from 12 to 30

    const snapToGrid = (value: number) => Math.round(value / gridSize) * gridSize

    const gridDots: GridDot[] = []

    for (let i = 0; i < dotCount; i++) {
      const isHorizontal = Math.random() > 0.5
      const x = snapToGrid(Math.random() * canvas.offsetWidth)
      const y = snapToGrid(Math.random() * canvas.offsetHeight)

      gridDots.push({
        x,
        y,
        direction: isHorizontal ? "horizontal" : "vertical",
        speed: Math.random() * 9 + 7.5,
        size: Math.random() * 2 + 2,
        opacity: Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        targetX: x,
        targetY: y,
        trail: [],
      })
    }

    let animationId: number
    let lastTime = 0
    const frameInterval = 1000 / 30

    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate)

      const deltaTime = currentTime - lastTime
      if (deltaTime < frameInterval) return
      lastTime = currentTime - (deltaTime % frameInterval)

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      gridDots.forEach((dot) => {
        dot.trail.unshift({ x: dot.x, y: dot.y })
        if (dot.trail.length > 10) dot.trail.pop()

        if (dot.direction === "horizontal") {
          if (Math.abs(dot.x - dot.targetX) < dot.speed) {
            dot.x = dot.targetX
            if (Math.random() > 0.7) {
              dot.direction = "vertical"
              const steps = Math.floor(Math.random() * 5) + 1
              dot.targetY = dot.y + (Math.random() > 0.5 ? 1 : -1) * steps * gridSize
            } else {
              const steps = Math.floor(Math.random() * 8) + 2
              dot.targetX = dot.x + (Math.random() > 0.5 ? 1 : -1) * steps * gridSize
            }
          } else {
            dot.x += dot.x < dot.targetX ? dot.speed : -dot.speed
          }
        } else {
          if (Math.abs(dot.y - dot.targetY) < dot.speed) {
            dot.y = dot.targetY
            if (Math.random() > 0.7) {
              dot.direction = "horizontal"
              const steps = Math.floor(Math.random() * 8) + 2
              dot.targetX = dot.x + (Math.random() > 0.5 ? 1 : -1) * steps * gridSize
            } else {
              const steps = Math.floor(Math.random() * 5) + 1
              dot.targetY = dot.y + (Math.random() > 0.5 ? 1 : -1) * steps * gridSize
            }
          } else {
            dot.y += dot.y < dot.targetY ? dot.speed : -dot.speed
          }
        }

        if (dot.x < -gridSize) {
          dot.x = canvas.offsetWidth + gridSize
          dot.targetX = dot.x
          dot.trail = []
        }
        if (dot.x > canvas.offsetWidth + gridSize) {
          dot.x = -gridSize
          dot.targetX = dot.x
          dot.trail = []
        }
        if (dot.y < -gridSize) {
          dot.y = canvas.offsetHeight + gridSize
          dot.targetY = dot.y
          dot.trail = []
        }
        if (dot.y > canvas.offsetHeight + gridSize) {
          dot.y = -gridSize
          dot.targetY = dot.y
          dot.trail = []
        }

        if (dot.trail.length > 1) {
          ctx.beginPath()
          ctx.moveTo(dot.x, dot.y)
          for (let i = 0; i < dot.trail.length; i++) {
            ctx.lineTo(dot.trail[i].x, dot.trail[i].y)
          }
          ctx.strokeStyle = dot.color
          ctx.globalAlpha = dot.opacity * 0.4
          ctx.lineWidth = dot.size
          ctx.lineCap = "round"
          ctx.stroke()
        }

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size * 4, 0, Math.PI * 2)
        ctx.fillStyle = dot.color
        ctx.globalAlpha = dot.opacity * 0.15
        ctx.fill()

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
        ctx.fillStyle = dot.color
        ctx.globalAlpha = dot.opacity
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



  return (
    <section className="relative overflow-hidden pt-20 pb-10 sm:pt-28 sm:pb-16 lg:pt-36">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Smart Contracts as a Service
          </div>

          <h1 className="font-mono text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl relative">
            <span className="invisible" aria-hidden="true">
              <span className="text-balance">Prove it.</span>
              <br />
              <span className="text-balance">Secure it. Own it.</span>
            </span>

            <span className="absolute inset-0 flex flex-col items-center">
              <span className="text-balance bg-gradient-to-r from-[#FFEFBA] to-[#FFFFFF] bg-clip-text text-transparent">
                {displayedText1}
                {displayedText2 === "" && (
                  <span className="inline-block w-[3px] h-[0.9em] bg-accent ml-1 animate-pulse" />
                )}
              </span>
              <span className="text-balance bg-gradient-to-r from-[#E44D26] to-[#F16529] bg-clip-text text-transparent">
                {displayedText2}
                {displayedText2 !== "" && (
                  <span
                    className={`inline-block w-[3px] h-[0.9em] bg-accent ml-1 ${
                      isTypingDone ? "animate-blink" : "animate-pulse"
                    }`}
                  />
                )}
              </span>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl lg:text-2xl">
            A comprehensive verification layer abstracting over existing primitives—hashing, timestamping, signatures,
            and ledgers—to provide institutional-grade proof-of-existence and integrity verification for digital assets.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" onClick={handleScrollToFeatures}>
              Explore Protocols
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-20 relative">
          <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 blur-2xl sm:blur-3xl opacity-30 sm:opacity-50" />

          <div className="relative">
            <div className="relative rounded-xl border border-border/60 bg-[#141414] backdrop-blur-sm overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between border-b border-border/60 px-3 sm:px-4 py-2 sm:py-3 bg-[#1a1a1a]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex gap-1 sm:gap-1.5">
                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-red-500/80" />
                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">bitregalo protocols</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                    <Blocks className="h-3 w-3" />
                    <span>mainnet</span>
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>24/7 verified</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-[10px] sm:text-xs text-accent">On-Chain</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:grid lg:grid-cols-5 lg:divide-x lg:divide-border/60 min-h-[420px]">
                {/* Protocol Stats - Full width on mobile, 2 columns on lg+ */}
                <div className="lg:col-span-2 p-4 sm:p-6 space-y-4 sm:space-y-6 border-b lg:border-b-0 border-border/60">
                  {/* Protocol Verification Stats */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4 flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Protocol Verification
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {/* Verified Transactions */}
                      <div className="group p-3 sm:p-4 rounded-lg bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1 sm:p-1.5 rounded bg-blue-500/10">
                              <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-400" />
                            </div>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">Verified Transactions</span>
                          </div>
                          <span className="text-[10px] sm:text-xs text-green-400 flex items-center gap-1 font-mono">
                            <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            +24%
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl sm:text-2xl font-mono font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            15,847
                          </span>
                        </div>
                        <div className="mt-2 sm:mt-3 h-1 bg-blue-500/10 rounded-full overflow-hidden">
                          <div className="h-full w-[82%] bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                        </div>
                      </div>

                      {/* Escrow Contracts */}
                      <div className="group p-3 sm:p-4 rounded-lg bg-gradient-to-br from-purple-500/5 to-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1 sm:p-1.5 rounded bg-purple-500/10">
                              <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-400" />
                            </div>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">Escrow Contracts</span>
                          </div>
                          <span className="text-[10px] sm:text-xs text-green-400 flex items-center gap-1 font-mono">
                            <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            +18%
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl sm:text-2xl font-mono font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            3,421
                          </span>
                        </div>
                        <div className="mt-2 sm:mt-3 h-1 bg-purple-500/10 rounded-full overflow-hidden">
                          <div className="h-full w-[68%] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                        </div>
                      </div>

                      {/* RFP Proposals */}
                      <div className="group p-3 sm:p-4 rounded-lg bg-gradient-to-br from-orange-500/5 to-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1 sm:p-1.5 rounded bg-orange-500/10">
                              <FileCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-400" />
                            </div>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">RFP Proposals</span>
                          </div>
                          <span className="text-[10px] sm:text-xs text-green-400 flex items-center gap-1 font-mono">
                            <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            +32%
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl sm:text-2xl font-mono font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                            892
                          </span>
                        </div>
                        <div className="mt-2 sm:mt-3 h-1 bg-orange-500/10 rounded-full overflow-hidden">
                          <div className="h-full w-[45%] bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Success Metrics */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Success Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-cyan-500/5 to-cyan-500/10 border border-cyan-500/20">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-cyan-400" />
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground">Auth Users</span>
                        </div>
                        <span className="text-base sm:text-lg font-mono font-bold text-cyan-400">8,234</span>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-400" />
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground">Success Rate</span>
                        </div>
                        <span className="text-base sm:text-lg font-mono font-bold text-green-400">99.2%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Editor - Full width on mobile, 3 columns on lg+ */}
                <div className="lg:col-span-3 p-4 sm:p-6 bg-[#0d0d0d]/50">
                  <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4 flex items-center gap-2">
                    <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Protocol Integration
                  </h3>
                  <div className="relative rounded-lg border border-border/40 bg-[#0a0a0a] p-3 sm:p-4 font-mono text-xs sm:text-sm overflow-x-auto">
                    {codeLines.map((line, index) => (
                      <div
                        key={index}
                        className={`transition-all duration-300 ${
                          index === codeLineIndex
                            ? "text-accent bg-accent/10 px-2 py-0.5 rounded"
                            : "text-muted-foreground/60"
                        }`}
                      >
                        {line || "\u00A0"}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:hidden flex justify-center mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Scroll to explore</span>
              <ArrowRight className="h-3 w-3 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="mt-16 flex justify-center">
          <div className="relative">
            <Image
              src="/assets/social.png"
              alt="BitRegalo Protocol Architecture"
              width={500}
              height={400}
              className="rounded-xl border border-border/60"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
