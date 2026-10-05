"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { ThemeChoice, ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"

/*
 * What an evaluator looks for, in order: how it works, the three ways to use it, how a
 * platform connects (a page of the app), then the documents. The marketplace is a feature
 * of the BitRegalo network, so it is reached from the app, not from here.
 */
const LINKS = [
  { label: "How it works", href: "/#how" },
  { label: "Ways to use it", href: "/#ways" },
  { label: "For platforms", href: "/app/connect" },
  { label: "Protocol", href: "/protocols/escrow", section: "/protocols" },
  { label: "Whitepaper", href: "/whitepaper" },
  { label: "Contact", href: "/contact" },
]

/** The header of the public site: the landing page and every document page. */
export function Navbar() {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [path])
  return (
    <header className="pt-safe sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-md">
      <div className="mx-auto flex h-(--topbar-h) max-w-6xl items-center gap-5 px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" aria-label="BitRegalo home">
          <Logo className="h-[1.45rem] w-auto" title="" aria-hidden />
        </Link>
        <nav aria-label="Site" className="hidden items-center lg:flex">
          {LINKS.map((l) => {
            const active = !l.href.startsWith("/#") && path.startsWith(l.section ?? l.href)
            return (
              <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
                className={`flex h-10 items-center whitespace-nowrap rounded-lg px-2.5 text-sm outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring xl:px-3 ${active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {l.label}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle className="hidden lg:flex" />
          {/* An outline, so a page's own main action stays the one primary button in view. */}
          <Button asChild size="sm" variant="outline"><Link href="/app">Open the app</Link></Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <button onClick={() => setOpen(true)} aria-label="Menu" className="flex size-11 items-center justify-center rounded-lg outline-none transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden">
              <Menu className="size-5" />
            </button>
            <SheetContent title="Menu">
              <ul className="-mx-2">
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-xl px-3 text-base font-[520] transition-colors hover:bg-secondary active:bg-secondary-hover">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-2 text-sm font-[560]">Appearance</p>
                <ThemeChoice />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
