import Link from "next/link"
import { Logo } from "@/components/brand/logo"

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "Ways to use it", href: "/#ways" },
      { label: "For platforms", href: "/app/connect" },
      { label: "Building blocks", href: "/#building-blocks" },
      { label: "Open the app", href: "/app" },
    ],
  },
  {
    title: "Protocol",
    links: [
      { label: "Whitepaper", href: "/whitepaper" },
      { label: "Escrow", href: "/protocols/escrow" },
      { label: "Requests", href: "/protocols/rfp" },
      { label: "Listings", href: "/protocols/rts" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "GitHub", href: "https://github.com/bitregalo", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of service", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Identity checks", href: "/kyc-policy" },
      { label: "Tokens", href: "/token-terms" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex rounded-md" aria-label="BitRegalo home">
              <Logo className="h-[1.3rem] w-auto" title="" aria-hidden />
            </Link>
            <p className="mt-4 max-w-[34ch] text-sm text-muted-foreground">
              Infrastructure a platform connects to, so its records cannot be edited afterwards and its payment commitments execute as agreed. Today on a public test network, and not independently audited.
            </p>
          </div>
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="text-sm font-semibold">{c.title}</h2>
              <ul className="mt-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noreferrer" className="flex min-h-9 items-center text-sm text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-11">{l.label}</a>
                    ) : (
                      <Link href={l.href} className="flex min-h-9 items-center text-sm text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-11">{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-12 border-t border-border pt-6 text-sm text-subtle">
          © {new Date().getFullYear()} BitRegalo® Limited. All rights reserved. Registered in New Zealand.
        </p>
      </div>
    </footer>
  )
}
