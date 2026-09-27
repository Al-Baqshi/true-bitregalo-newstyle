"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ConnectButton } from "./connect-button"
import { addresses, chain, explorerAddress, short } from "@/lib/bitregalo/config"

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const m = path.match(/^\/app\/t\/(\d+)/)
  const tenant = m ? m[1] : null
  const base = tenant ? `/app/t/${tenant}` : "/app"
  const nav = tenant
    ? [
        { href: base, label: "Overview", exact: true },
        { href: `${base}/rfps`, label: "Requests" },
        { href: `${base}/offers`, label: "Offers" },
        { href: `${base}/escrows`, label: "Escrows" },
        { href: `${base}/tokens`, label: "Tokens" },
        { href: `${base}/admin`, label: "Settings" },
      ]
    : [
        { href: "/app", label: "Instances", exact: true },
        { href: "/app/launch", label: "Launch an instance" },
        { href: "/app/operator", label: "Operator" },
      ]
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">BitRegalo</Link>
          <span className="rounded-full border border-accent/40 px-2 py-0.5 text-[11px] uppercase tracking-wider text-accent">
            {chain.name}{tenant ? ` · instance #${tenant}` : ""}
          </span>
          <nav className="flex flex-wrap gap-1 text-sm">
            {tenant && <Link href="/app" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground">← All instances</Link>}
            {nav.map((n) => {
              const active = n.exact ? path === n.href : path.startsWith(n.href)
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
        Mother <a className="font-mono underline-offset-2 hover:underline" href={explorerAddress(addresses.mother)} target="_blank" rel="noreferrer">{short(addresses.mother)}</a>
        {" · "}Treasury <a className="font-mono underline-offset-2 hover:underline" href={explorerAddress(addresses.treasury)} target="_blank" rel="noreferrer">{short(addresses.treasury)}</a>
        {" · "}Everything here is read live from BNB Smart Chain Testnet; every action is a transaction you sign.
      </footer>
    </div>
  )
}
