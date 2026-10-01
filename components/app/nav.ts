import {
  ArrowLeftRight, Coins, FileSearch, Folder, House, Landmark, type LucideIcon, Lock, PackageCheck, QrCode, Send, Settings2, Store, Tag,
} from "lucide-react"

/*
 * How a workspace is organised. Four destinations, the same on every screen size:
 * a sidebar on a desktop, bottom tabs on a phone (and, later, in the mobile app).
 *
 *   Overview   what is happening here
 *   Market     things on offer and things asked for
 *   Money      what was paid, what is held, what the workspace owns
 *   Set up     how the workspace is organised and run
 */
export type NavItem = {
  key: string
  label: string
  /** Path after /app/t/{id}. "" is the overview. */
  path: string
  icon: LucideIcon
  /** Other paths that belong to this item (their pages highlight it). */
  also?: string[]
  /** First contract version that has this page; older workspaces do not show it. */
  minVersion?: number
}
export type NavGroup = { key: string; label: string; icon: LucideIcon; items: NavItem[] }

export const OVERVIEW: NavItem = { key: "overview", label: "Overview", path: "", icon: House }

export const GROUPS: NavGroup[] = [
  {
    key: "market",
    label: "Market",
    icon: Store,
    items: [
      { key: "shop", label: "Shop", path: "/sales", icon: Store, minVersion: 1 },
      { key: "requests", label: "Requests", path: "/rfps", icon: FileSearch },
      { key: "listings", label: "Listings", path: "/offers", icon: Tag },
    ],
  },
  {
    key: "money",
    label: "Money",
    icon: ArrowLeftRight,
    items: [
      { key: "payments", label: "Payments", path: "/payments", icon: ArrowLeftRight, also: ["/pay", "/get-paid"], minVersion: 1 },
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
      { key: "settings", label: "Settings", path: "/admin", icon: Settings2 },
    ],
  },
]

/** The things a person can start. Verb first, in the order people reach for them. */
export type NewAction = { key: string; label: string; hint: string; path: string; icon: LucideIcon; minVersion?: number }
export const NEW_ACTIONS: NewAction[] = [
  { key: "pay", label: "Pay someone", hint: "Send a payment with a reference and a receipt", path: "/pay", icon: Send, minVersion: 1 },
  { key: "get-paid", label: "Get paid", hint: "Make a payment link or QR code", path: "/get-paid", icon: QrCode, minVersion: 1 },
  { key: "request", label: "Post a request", hint: "Ask suppliers for a price, then choose one", path: "/rfps/new", icon: FileSearch },
  { key: "listing", label: "Create a listing", hint: "Offer something at a fixed price", path: "/offers/new", icon: PackageCheck },
  { key: "sale", label: "Sell in the shop", hint: "Put vouchers, credits or memberships on sale", path: "/sales/new", icon: Store, minVersion: 1 },
  { key: "token", label: "Create a token", hint: "A credit or voucher your workspace issues", path: "/tokens/new", icon: Coins },
  { key: "project", label: "Start a project", hint: "Group related work under one name", path: "/projects/new", icon: Folder },
]

/** Which item, and which group, the current path belongs to. `rest` is the path after /app/t/{id}. */
export function locate(rest: string): { item: NavItem; group: NavGroup | null } {
  if (rest === "" || rest === "/") return { item: OVERVIEW, group: null }
  for (const group of GROUPS) {
    for (const item of group.items) {
      if ([item.path, ...(item.also ?? [])].some((p) => rest === p || rest.startsWith(p + "/"))) return { item, group }
    }
  }
  return { item: OVERVIEW, group: null }
}
