"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { ConnectButton } from "./connect-button"
import { Button } from "@/components/ui/button"
import { addresses, chain, explorerAddress, short } from "@/lib/bitregalo/config"
import { instanceName } from "@/lib/bitregalo/instances"

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const m = path.match(/^\/app\/t\/(\d+)/)
  const tenant = m ? m[1] : null
  const base = tenant ? `/app/t/${tenant}` : "/app"
  const nav = tenant
    ? [
        { href: base, label: "Overview", exact: true },
        { href: `${base}/projects`, label: "Projects" },
        { href: `${base}/rfps`, label: "Requests" },
        { href: `${base}/offers`, label: "Listings" },
        { href: `${base}/escrows`, label: "Escrows" },
        { href: `${base}/payments`, label: "Payments" },
        { href: `${base}/tokens`, label: "Tokens" },
        { href: `${base}/admin`, label: "Settings" },
      ]
    : [
        { href: "/app", label: "Workspaces", exact: true },
        { href: "/app/create", label: "Create" },
        { href: "/app/operator", label: "Platform" },
      ]
  const title = tenant ? (instanceName(BigInt(tenant)) ?? (tenant === "0" ? "Public workspace" : `Workspace #${tenant}`)) : null
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-[#090b0e]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-5 px-4 py-3.5">
          <Link href="/app" className="flex items-baseline gap-2">
            <span className="bq-display text-xl font-semibold">BitRegalo</span>
            <span className="bq-label hidden text-[9px] sm:inline">App</span>
          </Link>
          <span className="bq-label hidden rounded-full border border-[color:var(--bq-line-strong)] px-2.5 py-1 text-[9px] md:inline">
            <span className="mr-1.5 inline-block size-1.5 rounded-full bg-accent align-middle" />{chain.name}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {!path.startsWith("/app/create") && !path.startsWith("/app/launch") && (
              <Button asChild size="sm" variant="secondary" className="hidden sm:inline-flex"><Link href="/app/create"><Plus className="size-4" />Create</Link></Button>
            )}
            <ConnectButton />
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {tenant && (
            <>
              <Link href="/app" className="shrink-0 rounded-md px-2.5 py-1.5 text-muted-foreground hover:text-foreground">Workspaces</Link>
              <span className="text-muted-foreground/50">/</span>
              <span className="mr-2 shrink-0 px-2 py-1.5 text-foreground">{title}</span>
            </>
          )}
          {nav.map((n) => {
            const active = n.exact ? path === n.href : path.startsWith(n.href)
            return (
              <Link key={n.href} href={n.href}
                className={`relative shrink-0 rounded-md px-3 py-1.5 transition ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {n.label}
                {active && <span className="absolute inset-x-3 -bottom-2 h-px bg-primary" />}
              </Link>
            )
          })}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
      <footer className="mx-auto max-w-6xl border-t border-border px-4 py-8 text-xs text-muted-foreground">
        <span className="bq-label mr-3">On-chain</span>
        Mother <a className="bq-mono underline-offset-2 hover:underline" href={explorerAddress(addresses.mother)} target="_blank" rel="noreferrer">{short(addresses.mother)}</a>
        {" · "}Treasury <a className="bq-mono underline-offset-2 hover:underline" href={explorerAddress(addresses.treasury)} target="_blank" rel="noreferrer">{short(addresses.treasury)}</a>
        {" · "}Everything here is read live from {chain.name}; every action is a transaction you sign.
      </footer>
    </div>
  )
}
