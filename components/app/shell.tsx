"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { ArrowLeft, Building2, Cable, Check, ChevronsUpDown, CircleHelp, Ellipsis, Globe2, LayoutGrid, Plus, TrendingUp } from "lucide-react"
import { ConnectButton } from "./connect-button"
import { NETWORK, NEW_ACTIONS, WORKSPACE, locate, type NavGroup, type NavItem } from "./nav"
import { Logo, LogoMark } from "@/components/brand/logo"
import { ThemeChoice, ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { addresses, chain, explorerAddress, PUBLIC_WORKSPACE_ID, short } from "@/lib/bitregalo/config"
import { useInstances } from "@/lib/bitregalo/instances"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { cn } from "@/lib/utils"

const focusRing = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

/** Where the visitor is: the public network (/app…) or an organisation's workspace (/app/t/{id}…). */
function useLocation() {
  const path = usePathname()
  const m = path.match(/^\/app\/t\/(\d+)(.*)$/)
  if (m) return { kind: "workspace" as const, id: BigInt(m[1]), base: `/app/t/${m[1]}`, rest: m[2], model: WORKSPACE }
  return { kind: "network" as const, id: PUBLIC_WORKSPACE_ID, base: "/app", rest: path.replace(/^\/app/, ""), model: NETWORK }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const here = useLocation()
  const groups: NavGroup[] = here.model.groups
  const actions = NEW_ACTIONS.filter((a) => here.kind === "workspace" || !a.workspaceOnly)
  const found = locate(here.model, here.rest)
  const group = found.group

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-60 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-[560] focus:text-primary-foreground">
        Skip to content
      </a>
      <TopBar here={here} actions={actions} />
      <div className="mx-auto flex w-full max-w-[84rem] flex-1">
        <Sidebar here={here} groups={groups} current={found.item} />
        <div className="min-w-0 flex-1">
          {group && group.items.length > 1 && <SubNav base={here.base} group={group} current={found.item} />}
          <main id="main" className="mx-auto w-full max-w-4xl px-4 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px)+2.5rem)] pt-7 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
            {children}
            <ChainFooter />
          </main>
        </div>
        <BottomTabs here={here} groups={groups} actions={actions} currentGroup={found.group?.key ?? null} onHome={found.item?.key === here.model.home.key} />
      </div>
    </div>
  )
}

type Here = ReturnType<typeof useLocation>

function TopBar({ here, actions }: { here: Here; actions: typeof NEW_ACTIONS }) {
  return (
    <header className="pt-safe sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-md">
      <div className="mx-auto flex h-(--topbar-h) w-full max-w-[84rem] items-center gap-2 px-4 sm:px-6 lg:gap-3">
        <Link href="/app" className={cn("flex shrink-0 items-center rounded-md lg:w-54", focusRing)} aria-label="BitRegalo network home">
          <LogoMark className="h-7 w-auto sm:hidden" title="" aria-hidden />
          <Logo className="hidden h-[1.45rem] w-auto sm:block" title="" aria-hidden />
        </Link>
        <PlaceSwitcher here={here} />
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <span className="mr-1 hidden items-center gap-2 rounded-md bg-secondary px-2.5 py-1 text-xs font-[560] text-muted-foreground xl:inline-flex" title={`${chain.name}, a practice network: tokens here have no value, and the contracts have not been independently audited`}>
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            Practice network
          </span>
          <NewMenu base={here.base} actions={actions} />
          <ThemeToggle className="hidden lg:flex" />
          <ConnectButton size="sm" variant="outline" />
        </div>
      </div>
    </header>
  )
}

/** Where you are, and the way to anywhere else: the public network, an organisation workspace, or the page for connecting a platform. */
function PlaceSwitcher({ here }: { here: Here }) {
  const { address } = useAccount()
  const ws = useInstances()
  const nameOf = useWorkspaceName()
  const orgs = ws.list.filter((w) => w.id !== PUBLIC_WORKSPACE_ID)
  const label = here.kind === "network" ? "BitRegalo network" : nameOf(here.id)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("flex h-10 min-w-0 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold transition-colors hover:bg-secondary pointer-coarse:h-11", focusRing)}>
        {here.kind === "network" ? <Globe2 className="size-4 shrink-0 text-gold" /> : <Building2 className="size-4 shrink-0 text-gold" />}
        <span className="truncate">{here.kind === "network" ? <><span className="sm:hidden">Network</span><span className="hidden sm:inline">{label}</span></> : label}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuItem asChild>
          <Link href="/app" className="!items-start">
            <Globe2 className="mt-0.5" />
            <span className="min-w-0 flex-1">
              <span className="block font-[560]">BitRegalo network</span>
              <span className="block text-xs text-muted-foreground">BitRegalo&apos;s own public workspace, open to everyone</span>
            </span>
            {here.kind === "network" && <Check className="size-4 !text-gold" />}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Organisation workspaces</DropdownMenuLabel>
        {orgs.map((w) => {
          const mine = !!address && w.admin.toLowerCase() === address.toLowerCase()
          return (
            <DropdownMenuItem key={String(w.id)} asChild>
              <Link href={`/app/t/${w.id}`}>
                <Building2 />
                <span className="min-w-0 flex-1 truncate">{nameOf(w.id)}</span>
                {mine && <span className="text-xs text-subtle">Yours</span>}
                {here.kind === "workspace" && w.id === here.id && <Check className="size-4 !text-gold" />}
              </Link>
            </DropdownMenuItem>
          )
        })}
        {ws.list.length === 0 && <p className="px-2.5 py-2 text-sm text-muted-foreground">Loading workspaces…</p>}
        {ws.list.length > 0 && orgs.length === 0 && <p className="px-2.5 py-2 text-sm text-muted-foreground">No organisation workspaces yet.</p>}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/app/workspaces"><LayoutGrid />All workspaces</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/app/launch"><Plus />Create a workspace for an organisation</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href={`${here.base}/connect`}><Cable />Connect a platform you already run</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Desktop: everything a person can start here, one click away. */
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

function Sidebar({ here, groups, current }: { here: Here; groups: NavGroup[]; current: NavItem | null }) {
  const nameOf = useWorkspaceName()
  return (
    <nav aria-label={here.kind === "network" ? "BitRegalo network" : "Workspace"} className="sticky top-(--topbar-h) hidden h-[calc(100dvh-var(--topbar-h))] w-60 shrink-0 flex-col overflow-y-auto border-r border-border px-3 py-5 lg:flex">
      {here.kind === "workspace" && (
        <div className="mb-4 border-b border-border px-3 pb-4">
          <Link href="/app" className="-ml-1 inline-flex min-h-8 items-center gap-1.5 rounded-md px-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" />BitRegalo network
          </Link>
          <p className="mt-2 text-base font-semibold leading-snug">{nameOf(here.id)}</p>
          <p className="text-xs text-muted-foreground">Organisation workspace · #{String(here.id)}</p>
        </div>
      )}
      <SideLink href={here.base} item={here.model.home} active={current?.key === here.model.home.key} />
      {groups.map((g) => (
        <div key={g.key} className="mt-5">
          <p className="mb-1 px-3 text-xs font-[560] text-subtle">{g.label}</p>
          {g.items.map((it) => <SideLink key={it.key} href={here.base + it.path} item={it} active={current?.key === it.key} />)}
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
function SubNav({ base, group, current }: { base: string; group: NavGroup; current: NavItem | null }) {
  return (
    <nav aria-label={group.label} className="sticky top-[calc(var(--topbar-h)+env(safe-area-inset-top,0px))] z-30 border-b border-border bg-background/92 backdrop-blur-md lg:hidden">
      <div className="scroll-row flex gap-1 px-2.5 py-1.5 sm:px-4">
        {group.items.map((it) => {
          const active = it.key === current?.key
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

/** Phone and tablet: home, market, new, payments and more, within thumb reach. */
function BottomTabs({ here, groups, actions, currentGroup, onHome }: { here: Here; groups: NavGroup[]; actions: typeof NEW_ACTIONS; currentGroup: string | null; onHome: boolean }) {
  const path = usePathname()
  const [sheet, setSheet] = useState<"new" | "more" | null>(null)
  useEffect(() => setSheet(null), [path])
  const market = groups.find((g) => g.key === "market")
  const money = groups.find((g) => g.key === "money")
  const rest = groups.filter((g) => g.key !== "market" && g.key !== "money")
  const moreActive = currentGroup !== null && currentGroup !== "market" && currentGroup !== "money"
  const tab = "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-xs font-[560] transition-colors"
  const Home = here.model.home.icon
  return (
    <>
      <nav aria-label={here.kind === "network" ? "BitRegalo network" : "Workspace"} className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex h-(--tabbar-h) max-w-xl items-stretch px-1">
          <Link href={here.base} aria-current={onHome ? "page" : undefined} className={cn(tab, onHome ? "text-foreground" : "text-muted-foreground")}>
            <Home className={cn("size-[1.35rem]", onHome && "text-gold")} />{here.model.home.label}
          </Link>
          {market && (
            <Link href={here.base + market.items[0].path} aria-current={currentGroup === "market" ? "page" : undefined} className={cn(tab, currentGroup === "market" ? "text-foreground" : "text-muted-foreground")}>
              <market.icon className={cn("size-[1.35rem]", currentGroup === "market" && "text-gold")} />Market
            </Link>
          )}
          <div className="flex flex-1 items-center justify-center">
            <button onClick={() => setSheet("new")} aria-label="New" className={cn("flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-150 active:scale-95", focusRing)}>
              <Plus className="size-6" />
            </button>
          </div>
          {money && (
            <Link href={here.base + money.items[0].path} aria-current={currentGroup === "money" ? "page" : undefined} className={cn(tab, currentGroup === "money" ? "text-foreground" : "text-muted-foreground")}>
              <money.icon className={cn("size-[1.35rem]", currentGroup === "money" && "text-gold")} />{money.label}
            </Link>
          )}
          <button onClick={() => setSheet("more")} className={cn(tab, moreActive ? "text-foreground" : "text-muted-foreground")}>
            <Ellipsis className={cn("size-[1.35rem]", moreActive && "text-gold")} />More
          </button>
        </div>
      </nav>

      <Sheet open={sheet === "new"} onOpenChange={(o) => setSheet(o ? "new" : null)}>
        <SheetContent title="What would you like to do?" description={here.kind === "workspace" ? "Everything you start here is recorded in this workspace." : undefined}>
          <ul className="-mx-2">
            {actions.map((a) => (
              <li key={a.key}>
                <Link href={here.base + a.path} className="flex min-h-14 items-center gap-3.5 rounded-xl px-3 py-2 transition-colors hover:bg-secondary active:bg-secondary-hover">
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
            ...rest.flatMap((g) => g.items.map((it) => ({ href: here.base + it.path, label: it.label, icon: it.icon }))),
            ...(here.kind === "workspace" ? [{ href: "/app", label: "BitRegalo network", icon: Globe2 }] : []),
            { href: "/app/help", label: "Help and glossary", icon: CircleHelp },
            { href: "/app/operator", label: "Platform and earnings", icon: TrendingUp },
          ]} />
        </SheetContent>
      </Sheet>
    </>
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
        <p className="mt-4 flex items-baseline gap-2 text-sm text-muted-foreground">
          <span className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-success" aria-hidden />
          Practice network ({chain.name}). The tokens here have no value, and the contracts have not been independently audited.
        </p>
      </div>
    </>
  )
}

function ChainFooter() {
  return (
    <footer className="mt-16 border-t border-border pt-5 text-xs leading-relaxed text-subtle">
      <p className="max-w-[68ch]">
        This is BitRegalo&apos;s reference app. It runs today on {chain.name}, a practice network: tokens here have no value, and
        the contracts have not been independently audited. Everything is read live from the chain, and every action is a
        transaction you sign. Contracts:{" "}
        <a className="t-mono underline decoration-border-strong/60 underline-offset-[3px] hover:text-foreground" href={explorerAddress(addresses.mother)} target="_blank" rel="noreferrer">registry {short(addresses.mother)}</a>
        {", "}
        <a className="t-mono underline decoration-border-strong/60 underline-offset-[3px] hover:text-foreground" href={explorerAddress(addresses.treasury)} target="_blank" rel="noreferrer">platform treasury {short(addresses.treasury)}</a>.
      </p>
    </footer>
  )
}
