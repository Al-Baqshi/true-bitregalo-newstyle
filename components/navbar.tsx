"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Image from "next/image"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.replace("#", "")
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
    setIsOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image 
              src="/BrandLogo copy.svg" 
              alt="BitRegalo" 
              width={135} 
              height={40} 
              className="h-10 w-auto flex-shrink-0"
              priority
            />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, "#features")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Protocols
            </a>
            <a
              href="#developer-experience"
              onClick={(e) => handleSmoothScroll(e, "#developer-experience")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Benefits
            </a>
            <a
              href="#applications"
              onClick={(e) => handleSmoothScroll(e, "#applications")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Use Cases
            </a>
            <a
              href="#docs"
              onClick={(e) => handleSmoothScroll(e, "#docs")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Whitepaper
            </a>
            <a
              href="#tokenomics"
              onClick={(e) => handleSmoothScroll(e, "#tokenomics")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Tokenomics
            </a>
            <a
              href="#enterprise"
              onClick={(e) => handleSmoothScroll(e, "#enterprise")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Enterprise
            </a>
          </nav>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <Button size="sm" asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              Get BTR/USDT
            </a>
          </Button>
        </div>
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {isOpen && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <nav className="flex flex-col gap-4 px-4 py-6">
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, "#features")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Protocols
            </a>
            <a
              href="#developer-experience"
              onClick={(e) => handleSmoothScroll(e, "#developer-experience")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Benefits
            </a>
            <a
              href="#applications"
              onClick={(e) => handleSmoothScroll(e, "#applications")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Applications
            </a>
            <a
              href="#docs"
              onClick={(e) => handleSmoothScroll(e, "#docs")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Whitepaper
            </a>
            <a
              href="#tokenomics"
              onClick={(e) => handleSmoothScroll(e, "#tokenomics")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Tokenomics
            </a>
            <a
              href="#enterprise"
              onClick={(e) => handleSmoothScroll(e, "#enterprise")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Enterprise
            </a>
            <div className="flex flex-col gap-2 pt-4">
              <Button size="sm" asChild className="w-full">
                <a href="#" target="_blank" rel="noopener noreferrer">
                  Get BTR/USDT
                </a>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
