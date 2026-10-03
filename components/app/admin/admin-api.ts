"use client"
/*
 * Client for the super admin API (docs/admin-api.md), served by the marketplace service under
 * /v1/admin/. Only the registry's owner may call it: each request carries the owner's address,
 * a timestamp and a personal_sign signature of both.
 *
 * The signature is kept in this module's memory only (never localStorage or sessionStorage) and
 * reused for up to 9 minutes; the server accepts it for 10. Nothing the API returns is logged
 * or stored: the caller keeps it in component state and drops it when the wallet changes.
 */
import { chain } from "@/lib/bitregalo/config"
import { MARKET_API } from "@/lib/bitregalo/market"

export type Degraded = { configured?: false; reachable?: false; reason?: string }
export type AuthOverview = {
  configured: true
  realm?: string
  users: number
  newLast7Days: number
  newLast30Days: number
  withWallet: number
  recent: { createdAt: string; wallet: string | null; method: "wallet" | "passkey" | "email" | "other" | string }[]
}
export type KycOverview = {
  configured: true
  baseUrl?: string
  clients: { name: string; approved: number; rejected: number; manual_review: number; pending: number }[]
  pendingAccessRequests: number
}
export type MarketOverview = {
  configured?: true
  entries: number
  requests: number
  listings: number
  byCountry: { code: string; requests: number; listings: number }[]
  byWorkspace: { workspace: number; entries: number }[]
  newLast7Days: number
}
export type AdminOverview = {
  generatedAt?: string
  auth?: AuthOverview | Degraded
  kyc?: KycOverview | Degraded
  market?: MarketOverview | Degraded
}

/** True when a source is missing, not configured or not reachable. */
export function isDegraded(x: unknown): x is Degraded | undefined {
  if (!x || typeof x !== "object") return true
  const o = x as { configured?: unknown; reachable?: unknown }
  return o.configured === false || o.reachable === false
}

export type AdminErrorKind = "unavailable" | "signature" | "not_owner" | "failed"
export class AdminError extends Error {
  constructor(public kind: AdminErrorKind, message: string) {
    super(message)
  }
}

const REUSE_MS = 9 * 60 * 1000
let held: { address: string; issuedAt: string; signature: string } | null = null

/** The exact text the owner signs (docs/admin-api.md). */
export function adminMessage(address: string, issuedAt: string) {
  return ["BitRegalo super admin", `Chain: ${chain.id}`, `Address: ${address}`, `Issued at: ${issuedAt}`].join("\n")
}

/** Whether loading now would ask the wallet for a new signature. */
export function needsSignature(address: string) {
  return !held || held.address !== address || Date.now() - Date.parse(held.issuedAt) > REUSE_MS
}

export function forgetSignature() {
  held = null
}

export async function loadOverview(address: string, sign: (args: { message: string }) => Promise<string>): Promise<AdminOverview> {
  if (!MARKET_API) throw new AdminError("unavailable", "This build has no address for the admin service.")
  if (needsSignature(address)) {
    const issuedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
    const signature = await sign({ message: adminMessage(address, issuedAt) })
    held = { address, issuedAt, signature }
  }
  const s = held!
  let res: Response
  try {
    res = await fetch(`${MARKET_API}/v1/admin/overview`, {
      headers: { "X-Admin-Address": s.address, "X-Admin-Issued-At": s.issuedAt, "X-Admin-Signature": s.signature },
      cache: "no-store",
    })
  } catch {
    throw new AdminError("unavailable", "The admin service is not available yet.")
  }
  if (res.status === 404) throw new AdminError("unavailable", "The admin service is not available yet.")
  const body = (await res.json().catch(() => null)) as (AdminOverview & { error?: string }) | null
  if (res.status === 401) {
    held = null
    throw new AdminError(
      "signature",
      body?.error === "stale"
        ? "The signature had expired. Load again to sign a new one."
        : "The admin service did not accept the signature. Load again to sign a new one.",
    )
  }
  if (res.status === 403) {
    held = null
    throw new AdminError("not_owner", "The admin service does not recognise this wallet as the platform owner.")
  }
  if (!res.ok || !body) throw new AdminError("failed", `The admin service could not answer (status ${res.status}). Try again shortly.`)
  return body
}
