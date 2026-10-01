"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useAccount, useReadContract } from "wagmi"
import { Check, ChevronsUpDown, CircleHelp, Ellipsis, LayoutGrid, Menu, Plus, TrendingUp } from "lucide-react"
import { ConnectButton } from "./connect-button"
import { GROUPS, NEW_ACTIONS, OVERVIEW, locate, type NavGroup, type NavItem } from "./nav"
import { Logo, LogoMark } from "@/components/brand/logo"
import { ThemeChoice, ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { abis, addresses, chain, explorerAddress, short } from "@/lib/bitregalo/config"
import { useInstances } from "@/lib/bitregalo/instances"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { cn } from "@/lib/utils"

/** Shop, payments and the treasury arrived with contract version 1; older workspaces do not have them. */
function useWorkspaceVersion(tenant: string | null) {
  const q = useReadContract({
    address: addresses.mother, abi: abis.mother, functionName: "tenants", args: [BigInt(tenant ?? 0)],
    query: { enabled: tenant !== null },
  })
  const t = q.data as { version: bigint } | undefined
  return t ? Number(t.version) : null
}
const available = <T extends { minVersion?: number }>(list: T[], version: number | null) =>
  list.filter((x) => !x.minVersion || (version !== null && version >= x.minVersion))

const focusRing = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const m = path.match(/^\/app\/t\/(\d+)(.*)$/)
  const tenant = m ? m[1] : null
  const rest = m ? m[2] : ""
  const base = tenant ? `/app/t/${tenant}` : null
  const version = useWorkspaceVersion(tenant)
  const groups: NavGroup[] = GROUPS.map((g) => ({ ...g, items: available(g.items, version) })).filter((g) => g.items.length > 0)
  const actions = available(NEW_ACTIONS, version)
  const here = locate(rest)
  const group = here.group ? groups.find((g) => g.key === here.group!.key) ?? null : null

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-[560] focus:text-primary-foreground">
        Skip to content
      </a>
      <TopBar tenant={tenant} base={base} actions={actions} />
      {base ? (
        <div className="mx-auto flex w-full max-w-[84rem] flex-1">
          <Sidebar base={base} groups={groups} current={here.item} />
          <div className="min-w-0 flex-1">
            {group && group.items.length > 1 && <SubNav base={base} group={group} current={here.item} />}
            <main id="main" className="mx-auto w-full max-w-4xl px-4 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px)+2.5rem)] pt-7 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
              {children}
              <ChainFooter />
            </main>
          </div>
          <BottomTabs base={base} groups={groups} actions={actions} currentGroup={here.group?.key ?? null} onOverview={here.item.key === OVERVIEW.key} />
        </div>
      ) : (
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-7 sm:px-6 lg:pt-10">
          {children}
          <ChainFooter />
        </main>
      )}
    </div>
  )
}

function TopBar({ tenant, base, actions }: { tenant: string | null; base: string | null; actions: typeof NEW_ACTIONS }) {
  const path = usePathname()
  return (
    <header className="pt-safe sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-md">
      <div className="mx-auto flex h-[var(--topbar-h)] w-full max-w-[84rem] items-center gap-2 px-4 sm:px-6 lg:gap-3">
        <Link href="/app" className={cn("flex shrink-0 items-center rounded-md lg:w-[13.5rem]", focusRing)} aria-label="BitRegalo — all workspaces">
          <LogoMark className="h-7 w-auto sm:hidden" title="" aria-hidden />
          <Logo className="hidden h-[1.45rem] w-auto sm:block" title="" aria-hidden />
        </Link>

        {tenant ? (
          <WorkspaceSwitcher tenant={tenant} />
        ) : (
          <nav aria-label="App" className="ml-2 hidden items-center gap-1 lg:flex">
            {[
              { href: "/app", label: "Workspaces", active: path === "/app" },
              { href: "/app/create", label: "Create", active: path.startsWith("/app/create") || path.startsWith("/app/launch") },
              { href: "/app/help", label: "Help", active: path.startsWith("/app/help") },
            ].map((l) => (
              <Link key={l.href} href={l.href} aria-current={l.active ? "page" : undefined}
                className={cn("flex h-10 items-center rounded-lg px-3 text-sm transition-colors", focusRing, l.active ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <span className="mr-1 hidden items-center gap-2 rounded-md bg-secondary px-2.5 py-1 text-xs font-[560] text-muted-foreground xl:inline-flex" title={`${chain.name}: practice money with no value`}>
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            Practice network
          </span>
          {base && <NewMenu base={base} actions={actions} />}
          <ThemeToggle className="hidden lg:flex" />
          <ConnectButton size="sm" variant="outline" />
          {!tenant && <GlobalMenu />}
        </div>
      </div>
    </header>
  )
}

/** Which workspace you are in, and the way to another one. */
function WorkspaceSwitcher({ tenant }: { tenant: string }) {
  const { address } = useAccount()
  const ws = useInstances()
  const nameOf = useWorkspaceName()
  const id = BigInt(tenant)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("flex h-10 min-w-0 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold transition-colors hover:bg-secondary pointer-coarse:h-11", focusRing)}>
        <span className="truncate">{nameOf(id)}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {ws.list.map((w) => {
          const mine = !!address && w.admin.toLowerCase() === address.toLowerCase()
          return (
            <DropdownMenuItem key={String(w.id)} asChild>
              <Link href={`/app/t/${w.id}`}>
                <span className="min-w-0 flex-1 truncate">{nameOf(w.id)}</span>
                {mine && <span className="text-xs text-subtle">Yours</span>}
                {w.id === id && <Check className="size-4 !text-gold" />}
              </Link>
            </DropdownMenuItem>
          )
        })}
        {ws.list.length === 0 && <p className="px-2.5 py-2 text-sm text-muted-foreground">Loading workspaces…</p>}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/app"><LayoutGrid />All workspaces</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/app/launch"><Plus />Create a workspace</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Desktop: everything a person can start in this workspace, one click away. */
function NewMenu({ base, actions }: { base: string; actions: typeof NEW_ACTIONS }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="secondary" className="hidden lg:inline-flex"><Plus />New</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        {actions.map((a) => (
          <DropdownMenuItem key={a.key} asChild>
            <Link href={base + a.path} className="!items-start">
              <a.icon className="mt-0.5" />
              <span>
                <span className="block font-[560]">{a.label}</span>
                <span className="block text-xs text-muted-foreground">{a.hint}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Sidebar({ base, groups, current }: { base: string; groups: NavGroup[]; current: NavItem }) {
  return (
    <nav aria-label="Workspace" className="sticky top-[var(--topbar-h)] hidden h-[calc(100dvh-var(--topbar-h))] w-60 shrink-0 flex-col overflow-y-auto border-r border-border px-3 py-5 lg:flex">
      <SideLink href={base} item={OVERVIEW} active={current.key === OVERVIEW.key} />
      {groups.map((g) => (
        <div key={g.key} className="mt-5">
          <p className="mb-1 px-3 text-xs font-[560] text-subtle">{g.label}</p>
          {g.items.map((it) => <SideLink key={it.key} href={base + it.path} item={it} active={current.key === it.key} />)}
        </div>
      ))}
      <div className="mt-auto border-t border-border pt-3">
        <Link href="/app/help" className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground", focusRing)}>
          <CircleHelp className="size-4.5" />Help and glossary
        </Link>
      </div>
    </nav>
  )
}
function SideLink({ href, item, active }: { href: string; item: NavItem; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined}
      className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors", focusRing,
        active ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground")}>
      <item.icon className={cn("size-4.5 shrink-0", active && "text-gold")} />
      {item.label}
    </Link>
  )
}

/** Phone and tablet: the pages inside the current tab. */
function SubNav({ base, group, current }: { base: string; group: NavGroup; current: NavItem }) {
  return (
    <nav aria-label={group.label} className="sticky top-[calc(var(--topbar-h)+env(safe-area-inset-top,0px))] z-30 border-b border-border bg-background/92 backdrop-blur-md lg:hidden">
      <div className="scroll-row flex gap-1 px-2.5 py-1.5 sm:px-4">
        {group.items.map((it) => {
          const active = it.key === current.key
          return (
            <Link key={it.key} href={base + it.path} aria-current={active ? "page" : undefined}
              className={cn("flex h-10 shrink-0 items-center rounded-lg px-3.5 text-sm transition-colors pointer-coarse:h-11", focusRing,
                active ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground")}>
              {it.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

/** Phone and tablet: the four destinations and the "new" button, within thumb reach. */
function BottomTabs({ base, groups, actions, currentGroup, onOverview }: { base: string; groups: NavGroup[]; actions: typeof NEW_ACTIONS; currentGroup: string | null; onOverview: boolean }) {
  const path = usePathname()
  const [sheet, setSheet] = useState<"new" | "more" | null>(null)
  useEffect(() => setSheet(null), [path])
  const market = groups.find((g) => g.key === "market")
  const money = groups.find((g) => g.key === "money")
  const setup = groups.find((g) => g.key === "setup")
  const tab = "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-xs font-[560] transition-colors"
  return (
    <>
      <nav aria-label="Workspace" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex h-[var(--tabbar-h)] max-w-xl items-stretch px-1">
          <Link href={base} aria-current={onOverview ? "page" : undefined} className={cn(tab, onOverview ? "text-foreground" : "text-muted-foreground")}>
            <OVERVIEW.icon className={cn("size-[1.35rem]", onOverview && "text-gold")} />Overview
          </Link>
          {market && (
            <Link href={base + market.items[0].path} aria-current={currentGroup === "market" ? "page" : undefined} className={cn(tab, currentGroup === "market" ? "text-foreground" : "text-muted-foreground")}>
              <market.icon className={cn("size-[1.35rem]", currentGroup === "market" && "text-gold")} />{market.label}
            </Link>
          )}
          <div className="flex flex-1 items-center justify-center">
            <button onClick={() => setSheet("new")} aria-label="New" className={cn("flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-150 active:scale-95", focusRing)}>
              <Plus className="size-6" />
            </button>
          </div>
          {money && (
            <Link href={base + money.items[0].path} aria-current={currentGroup === "money" ? "page" : undefined} className={cn(tab, currentGroup === "money" ? "text-foreground" : "text-muted-foreground")}>
              <money.icon className={cn("size-[1.35rem]", currentGroup === "money" && "text-gold")} />{money.label}
            </Link>
          )}
          <button onClick={() => setSheet("more")} className={cn(tab, currentGroup === "setup" ? "text-foreground" : "text-muted-foreground")}>
            <Ellipsis className={cn("size-[1.35rem]", currentGroup === "setup" && "text-gold")} />More
          </button>
        </div>
      </nav>

      <Sheet open={sheet === "new"} onOpenChange={(o) => setSheet(o ? "new" : null)}>
        <SheetContent title="What would you like to do?">
          <ul className="-mx-2">
            {actions.map((a) => (
              <li key={a.key}>
                <Link href={base + a.path} className="flex min-h-14 items-center gap-3.5 rounded-xl px-3 py-2 transition-colors hover:bg-secondary active:bg-secondary-hover">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground"><a.icon className="size-5" /></span>
                  <span className="min-w-0">
                    <span className="block text-base font-[560]">{a.label}</span>
                    <span className="block text-sm text-muted-foreground">{a.hint}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      <Sheet open={sheet === "more"} onOpenChange={(o) => setSheet(o ? "more" : null)}>
        <SheetContent title="More">
          <MoreLinks links={[
            ...(setup?.items ?? []).map((it) => ({ href: base + it.path, label: it.label, icon: it.icon })),
            { href: "/app", label: "All workspaces", icon: LayoutGrid },
            { href: "/app/help", label: "Help and glossary", icon: CircleHelp },
            { href: "/app/operator", label: "Platform and earnings", icon: TrendingUp },
          ]} />
        </SheetContent>
      </Sheet>
    </>
  )
}

/** Phone and tablet, outside a workspace: the few global places, plus appearance. */
function GlobalMenu() {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [path])
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button onClick={() => setOpen(true)} aria-label="Menu" className={cn("flex size-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary lg:hidden", focusRing)}>
        <Menu className="size-5" />
      </button>
      <SheetContent title="Menu">
        <MoreLinks links={[
          { href: "/app", label: "Workspaces", icon: LayoutGrid },
          { href: "/app/create", label: "Create something", icon: Plus },
          { href: "/app/help", label: "Help and glossary", icon: CircleHelp },
          { href: "/app/operator", label: "Platform and earnings", icon: TrendingUp },
        ]} />
      </SheetContent>
    </Sheet>
  )
}

function MoreLinks({ links }: { links: { href: string; label: string; icon: NavItem["icon"] }[] }) {
  return (
    <>
      <ul className="-mx-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex min-h-12 items-center gap-3.5 rounded-xl px-3 text-base font-[520] transition-colors hover:bg-secondary active:bg-secondary-hover">
              <l.icon className="size-5 text-muted-foreground" />{l.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-2 text-sm font-[560]">Appearance</p>
        <ThemeChoice />
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" aria-hidden />
          Practice network ({chain.name}). The money here has no value.
        </p>
      </div>
    </>
  )
}

function ChainFooter() {
  return (
    <footer className="mt-16 border-t border-border pt-5 text-xs leading-relaxed text-subtle">
      <p className="max-w-[60ch]">
        Everything here is read live from {chain.name}, and every action is a transaction you sign. Contracts:{" "}
        <a className="t-mono underline decoration-border-strong/60 underline-offset-[3px] hover:text-foreground" href={explorerAddress(addresses.mother)} target="_blank" rel="noreferrer">registry {short(addresses.mother)}</a>
        {", "}
        <a className="t-mono underline decoration-border-strong/60 underline-offset-[3px] hover:text-foreground" href={explorerAddress(addresses.treasury)} target="_blank" rel="noreferrer">platform treasury {short(addresses.treasury)}</a>.
      </p>
    </footer>
  )
}
