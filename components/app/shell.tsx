"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ConnectButton } from "./connect-button"
import { addresses, chain, explorerAddress, short } from "@/lib/bitregalo/config"

const nav = [
  { href: "/app", label: "Overview" },
  { href: "/app/rfps", label: "RFPs" },
  { href: "/app/offers", label: "Offers (RTS)" },
  { href: "/app/escrows", label: "Escrows" },
  { href: "/app/tokens", label: "Tokens" },
  { href: "/app/admin", label: "Tenant admin" },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">BitRegalo</Link>
          <span className="rounded-full border border-accent/40 px-2 py-0.5 text-[11px] uppercase tracking-wider text-accent">
            {chain.name} · tenant #0
          </span>
          <nav className="flex flex-wrap gap-1 text-sm">
            {nav.map((n) => {
              const active = n.href === "/app" ? path === "/app" : path.startsWith(n.href)
              return (
                <Link key={n.href} href={n.href}
                  className={`rounded-md px-3 py-1.5 transition ${active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {n.label}
                </Link>
              )
            })}
          </nav>
          <div className="ml-auto"><ConnectButton /></div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted-foreground">
        Instance <a className="font-mono underline-offset-2 hover:underline" href={explorerAddress(addresses.instance)} target="_blank" rel="noreferrer">{short(addresses.instance)}</a>
        {" · "}Vault <a className="font-mono underline-offset-2 hover:underline" href={explorerAddress(addresses.vault)} target="_blank" rel="noreferrer">{short(addresses.vault)}</a>
        {" · "}Every record on this page is read live from BNB Smart Chain Testnet.
      </footer>
    </div>
  )
}
