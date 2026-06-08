"use client"

import type React from "react"

import { Lock, FileCheck, TrendingUp, Key, Users, Coins, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"

const features = [
  {
    icon: Lock,
    title: "Escrow Smart Contracts",
    description:
      "Secure multi-party transactions with automated release conditions. Funds are held safely until delivery is confirmed.",
    slug: "escrow",
  },
  {
    icon: FileCheck,
    title: "Request for Proposal (RFP)",
    description:
      "Post your gift or service request. Providers submit proposals, and you choose the best match based on ratings and price.",
    slug: "rfp",
  },
  {
    icon: TrendingUp,
    title: "Request to Supply (RTS)",
    description:
      "Service providers list their offerings. Buyers can browse, compare, and purchase directly from the marketplace.",
    slug: "rts",
  },
  {
    icon: Key,
    title: "Key Delivery Codes (KDC)",
    description:
      "Unique codes confirm gift delivery. Only when the recipient presents the code is payment released to the provider.",
    slug: "kdc",
  },
  {
    icon: Users,
    title: "Decentralized Identity",
    description:
      "KYC-verified users with on-chain reputation. Build trust through transparent transaction history and ratings.",
    slug: "identity",
  },
  {
    icon: Coins,
    title: "Project Tokenization",
    description:
      "Tokenize entire projects or ventures. Enable transparent tracking and financial management on-chain.",
    slug: "tokenization",
  },
]

export function FeaturesSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let animationId: number
    let scrollPosition = scrollContainer.scrollLeft

    const animate = () => {
      if (!isPaused && !isDragging && scrollContainer) {
        scrollPosition += 0.5
        if (scrollPosition >= scrollContainer.scrollWidth / 2) {
          scrollPosition = 0
        }
        scrollContainer.scrollLeft = scrollPosition
      } else if (scrollContainer) {
        scrollPosition = scrollContainer.scrollLeft
      }
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [isPaused, isDragging])

  const handleMouseDown = (e: React.MouseEvent) => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return
    setIsDragging(true)
    setStartX(e.pageX - scrollContainer.offsetLeft)
    setScrollLeft(scrollContainer.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return
    const x = e.pageX - scrollContainer.offsetLeft
    const walk = (x - startX) * 2
    scrollContainer.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setIsPaused(false)
  }

  const duplicatedFeatures = [...features, ...features]

  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <Sparkles className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">Platform Features</span>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Everything you need for global gifting
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            BitRegalo provides a complete suite of tools for secure, transparent, and efficient gifting and service exchanges worldwide.
          </p>
        </div>

        <div className="mt-16 relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollRef}
            className={`flex gap-6 overflow-x-auto scrollbar-hide select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {duplicatedFeatures.map((feature, index) => (
              <Link
                key={index}
                href={`/protocols/${feature.slug}`}
                className="group relative flex-shrink-0 w-[380px] rounded-2xl border border-border/60 bg-card/50 p-8 transition-all hover:border-accent/40 hover:bg-card cursor-pointer"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
