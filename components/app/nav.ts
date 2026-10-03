import {
  Activity, ArrowLeftRight, Building2, Cable, Coins, FileSearch, Folder, Globe2, House, Landmark, type LucideIcon, Lock, PackageCheck,
  QrCode, Send, Settings2, ShieldCheck, Store, Tag,
} from "lucide-react"

/*
 * How the app is organised. There are two places a person can be:
 *
 *   The BitRegalo network  everyone, anywhere: send USDT, hold a payment in escrow, ask for
 *                          things and offer them in a marketplace by country. It runs on
 *                          BitRegalo's own public workspace. Pages live at /app.
 *
 *   A workspace            one organisation's own BitRegalo: its own contracts, rules,
 *                          currencies, tokens, shop and treasury. Everything done inside
 *                          it is recorded under it. Pages live at /app/t/{id}.
 *
 * Both are laid out the same way, a sidebar on a desktop and bottom tabs on a phone,
 * so people learn one structure. The same groups carry into the mobile app.
 */
export type NavItem = {
  key: string
  label: string
  /** Path after the base ("/app" or "/app/t/{id}"). "" is the home page. */
  path: string
  icon: LucideIcon
  /** Other paths that belong to this item (their pages highlight it). */
  also?: string[]
  /** First contract version that has this page; older workspaces do not show it. */
  minVersion?: number
}
export type NavGroup = { key: string; label: string; icon: LucideIcon; items: NavItem[] }
export type NavModel = { home: NavItem; groups: NavGroup[] }

/* ── The BitRegalo network ─────────────────────────────────────────────────── */
export const NETWORK: NavModel = {
  home: { key: "home", label: "Home", path: "", icon: House },
  groups: [
    {
      key: "market",
      label: "Marketplace",
      icon: Globe2,
      items: [
        { key: "market", label: "Browse by country", path: "/market", icon: Globe2 },
        { key: "requests", label: "Requests", path: "/requests", icon: FileSearch },
        { key: "listings", label: "Listings", path: "/listings", icon: Tag },
      ],
    },
    {
      key: "money",
      label: "Payments",
      icon: ArrowLeftRight,
      items: [
        { key: "payments", label: "Sent and received", path: "/payments", icon: ArrowLeftRight, also: ["/pay", "/get-paid"], minVersion: 1 },
        { key: "escrows", label: "Escrows", path: "/escrows", icon: Lock },
        { key: "activity", label: "My activity", path: "/activity", icon: Activity },
      ],
    },
    {
      key: "orgs",
      label: "For organisations",
      icon: Building2,
      items: [
        { key: "workspaces", label: "Workspaces", path: "/workspaces", icon: Building2, also: ["/launch"] },
        { key: "connect", label: "Connect a platform", path: "/connect", icon: Cable },
      ],
    },
  ],
}

/* ── Inside an organisation's workspace ────────────────────────────────────── */
export const WORKSPACE: NavModel = {
  home: { key: "overview", label: "Overview", path: "", icon: House },
  groups: [
    {
      key: "market",
      label: "Market",
      icon: Store,
      items: [
        { key: "shop", label: "Shop", path: "/shop", icon: Store, minVersion: 1 },
        { key: "requests", label: "Requests", path: "/requests", icon: FileSearch },
        { key: "listings", label: "Listings", path: "/listings", icon: Tag },
      ],
    },
    {
      key: "money",
      label: "Payments",
      icon: ArrowLeftRight,
      items: [
        { key: "payments", label: "Sent and received", path: "/payments", icon: ArrowLeftRight, also: ["/pay", "/get-paid"], minVersion: 1 },
        { key: "escrows", label: "Escrows", path: "/escrows", icon: Lock },
        { key: "treasury", label: "Treasury", path: "/treasury", icon: Landmark, minVersion: 1 },
        { key: "tokens", label: "Tokens", path: "/tokens", icon: Coins },
      ],
    },
    {
      key: "setup",
      label: "Set up",
      icon: Settings2,
      items: [
        { key: "projects", label: "Projects", path: "/projects", icon: Folder },
        { key: "settings", label: "Settings", path: "/settings", icon: Settings2 },
        { key: "connect", label: "Connect a platform", path: "/connect", icon: Cable },
      ],
    },
  ],
}

/** The things a person can start. Verb first, in the order people reach for them. */
export type NewAction = { key: string; label: string; hint: string; path: string; icon: LucideIcon; minVersion?: number; workspaceOnly?: boolean }
export const NEW_ACTIONS: NewAction[] = [
  { key: "pay", label: "Send a payment", hint: "Pay someone or send a gift in USDT, with a reference and a receipt", path: "/pay", icon: Send, minVersion: 1 },
  { key: "get-paid", label: "Get paid", hint: "Make a payment link or QR code", path: "/get-paid", icon: QrCode, minVersion: 1 },
  { key: "escrow", label: "Hold a payment for someone", hint: "Lock it in escrow until the work is done", path: "/escrows/new", icon: ShieldCheck },
  { key: "request", label: "Ask for something", hint: "Post a request; suppliers send prices and you choose one", path: "/requests/new", icon: FileSearch },
  { key: "listing", label: "Offer something", hint: "List what you sell at a fixed price", path: "/listings/new", icon: PackageCheck },
  { key: "sale", label: "Sell in the shop", hint: "Put vouchers, credits or memberships on sale", path: "/shop/new", icon: Store, minVersion: 1, workspaceOnly: true },
  { key: "token", label: "Create a token", hint: "A credit or voucher your workspace issues", path: "/tokens/new", icon: Coins, workspaceOnly: true },
  { key: "project", label: "Start a project", hint: "Group related work under one name", path: "/projects/new", icon: Folder, workspaceOnly: true },
]

/** Which item, and which group, `rest` (the path after the base) belongs to. */
export function locate(model: NavModel, rest: string): { item: NavItem | null; group: NavGroup | null } {
  if (rest === "" || rest === "/") return { item: model.home, group: null }
  for (const group of model.groups) {
    for (const item of group.items) {
      if ([item.path, ...(item.also ?? [])].some((p) => rest === p || rest.startsWith(p + "/"))) return { item, group }
    }
  }
  return { item: null, group: null }
}
