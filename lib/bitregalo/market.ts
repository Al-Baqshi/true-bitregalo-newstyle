"use client"
/**
 * Client for the BitRegalo marketplace index (bitregalo-platform `cmd/market`).
 *
 * The index stores what the chain cannot: a title, a description, a category, a country
 * and a city for each request and listing. Each entry is signed by the wallet that owns
 * the on-chain record. Payments and state always come from the chain; this only describes.
 *
 * Wire format: docs/market-api.md.
 */
import { useSyncExternalStore } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { chain } from "./config"

const ENV_API = (process.env.NEXT_PUBLIC_MARKET_API ?? "").replace(/\/$/, "")

/**
 * Development builds only: `?marketApi=<url>` on any app page points this browser tab at
 * another index (a local mock, a staging server) without a rebuild; `?marketApi=off` acts
 * as if no index were configured. Either is kept for the tab's session; `?marketApi=`
 * (empty) goes back to the configured one. Production builds never read it.
 */
function devOverride(): string | null {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return null
  try {
    const key = "bitregalo:marketApi"
    const q = new URLSearchParams(window.location.search).get("marketApi")
    if (q !== null) {
      if (q) sessionStorage.setItem(key, q)
      else sessionStorage.removeItem(key)
      return q || null
    }
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

const override = devOverride()
export const MARKET_API = (override === "off" ? "" : override ?? ENV_API).replace(/\/$/, "")
export const marketAvailable = MARKET_API !== ""

const noSubscribe = () => () => {}
/**
 * `marketAvailable` for components: the server render uses the build setting and the
 * browser takes over after hydration, so a development override never causes a mismatch.
 */
export function useMarketAvailable() {
  return useSyncExternalStore(noSubscribe, () => marketAvailable, () => ENV_API !== "")
}

export type EntryKind = "request" | "listing"

export const CATEGORIES = [
  { value: "construction", label: "Construction" },
  { value: "trades", label: "Trades and repairs" },
  { value: "professional-services", label: "Professional services" },
  { value: "goods", label: "Goods and supplies" },
  { value: "transport", label: "Transport and logistics" },
  { value: "events", label: "Events" },
  { value: "education", label: "Education and training" },
  { value: "health", label: "Health and care" },
  { value: "nonprofit", label: "Charity and community" },
  { value: "digital", label: "Digital and IT" },
  { value: "other", label: "Something else" },
] as const
export type Category = (typeof CATEGORIES)[number]["value"]
export const categoryLabel = (c: string) => CATEGORIES.find((x) => x.value === c)?.label ?? c
export const isCategory = (c: string): c is Category => CATEGORIES.some((x) => x.value === c)

export type Entry = {
  chainId: number
  workspace: number
  kind: EntryKind
  recordId: number
  title: string
  description: string
  category: Category
  country: string
  city: string
  poster: string
  settlement: number
  token: string
  amount: string
  deadline: number
  state: number
  createdAt: string
  updatedAt: string
}

export type EntryInput = {
  title: string
  description: string
  category: Category
  country: string
  city: string
}

export class MarketError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message)
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  if (!marketAvailable) throw new MarketError("unavailable", "The marketplace index is not connected.", 0)
  // Only a request with a body says it is JSON: a plain GET then needs no CORS preflight.
  const req: RequestInit | undefined = init?.body ? { ...init, headers: { "content-type": "application/json", ...(init.headers ?? {}) } } : init
  let res: Response
  try {
    res = await fetch(MARKET_API + path, req)
  } catch {
    throw new MarketError("unreachable", "The marketplace index could not be reached.", 0)
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new MarketError(body.error ?? "error", body.message ?? `The marketplace index answered ${res.status}.`, res.status)
  return body as T
}

export type ListQuery = {
  workspace?: bigint | number
  kind?: EntryKind
  country?: string
  category?: string
  q?: string
  poster?: string
  limit?: number
  cursor?: string
}

export function listEntries(query: ListQuery = {}) {
  const p = new URLSearchParams({ chainId: String(chain.id) })
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "") p.set(k, String(v))
  return call<{ entries: Entry[]; next: string | null }>(`/v1/entries?${p}`)
}

export function getEntry(workspace: bigint | number, kind: EntryKind, recordId: bigint | number) {
  return call<Entry>(`/v1/entries/${chain.id}/${workspace}/${kind}/${recordId}`).catch((e) => {
    if (e instanceof MarketError && e.status === 404) return null
    throw e
  })
}

export function countryCounts(query: { workspace?: bigint | number; kind?: EntryKind } = {}) {
  const p = new URLSearchParams({ chainId: String(chain.id) })
  if (query.workspace !== undefined) p.set("workspace", String(query.workspace))
  if (query.kind) p.set("kind", query.kind)
  return call<{ countries: { code: string; requests: number; listings: number }[] }>(`/v1/countries?${p}`)
}

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
  return "0x" + Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("")
}

/* ── What the index accepts (mirrors the server's checks) ───────────────────── */

export const LIMITS = { titleMin: 3, title: 120, description: 2000, city: 80 } as const

/** Length in characters as the server counts them (Unicode code points, not UTF-16 units). */
export const charCount = (s: string) => Array.from(s).length

/**
 * Plain text the server will accept: Windows line breaks become "\n", tabs become spaces,
 * other control characters are dropped (single-line fields turn line breaks into spaces),
 * and the ends are trimmed.
 */
export function cleanText(s: string, multiline = false) {
  const t = s.replace(/\r\n?/g, "\n").replace(/\t/g, " ")
  return (multiline ? t.replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, "") : t.replace(/\n/g, " ").replace(/[\u0000-\u001F\u007F-\u009F]/g, "")).trim()
}

export function cleanInput(input: EntryInput): EntryInput {
  return {
    title: cleanText(input.title),
    description: cleanText(input.description, true),
    category: input.category,
    country: input.country.trim().toUpperCase(),
    city: cleanText(input.city),
  }
}

const HTML = /<[A-Za-z/!?]/

/** The first thing the index would refuse in these details, in plain words, or null. */
export function entryProblem(input: EntryInput): string | null {
  const c = cleanInput(input)
  const n = charCount(c.title)
  if (n < LIMITS.titleMin) return `Add a title of at least ${LIMITS.titleMin} characters`
  if (n > LIMITS.title) return `Titles are at most ${LIMITS.title} characters`
  if (charCount(c.description) > LIMITS.description) return `The description is at most ${LIMITS.description} characters`
  if (charCount(c.city) > LIMITS.city) return `The city is at most ${LIMITS.city} characters`
  if ([c.title, c.description, c.city].some((s) => HTML.test(s))) return "Use plain text: a “<” straight before a letter reads as code, so add a space after it"
  if (!isCategory(c.category)) return "Choose a category"
  if (!COUNTRY_CODES.includes(c.country)) return "Choose a country"
  return null
}

/** The exact text the poster signs. Must match the server byte for byte. */
export async function entryMessage(ref: { workspace: bigint | number; kind: EntryKind; recordId: bigint | number }, input: EntryInput, issuedAt: string) {
  return [
    "BitRegalo marketplace entry",
    `Chain: ${chain.id}`,
    `Workspace: ${ref.workspace}`,
    `Kind: ${ref.kind}`,
    `Record: ${ref.recordId}`,
    `Title: ${input.title.trim()}`,
    `Category: ${input.category}`,
    `Country: ${input.country}`,
    `City: ${input.city.trim()}`,
    `Description SHA-256: ${await sha256Hex(input.description.trim())}`,
    `Issued at: ${issuedAt}`,
  ].join("\n")
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Signs and stores the details for one record. `sign` is wagmi's `signMessageAsync`
 * (or anything that returns a personal_sign signature for the connected wallet).
 *
 * The wallet signs once. A record posted seconds ago may not be visible yet to the
 * index's own chain node (`no_record`), so the same signed body is sent again a few
 * times, about 20 seconds in all, before giving up; the signature stays valid for
 * 10 minutes.
 */
export async function putEntry(
  ref: { workspace: bigint | number; kind: EntryKind; recordId: bigint | number },
  input: EntryInput,
  poster: string,
  sign: (args: { message: string }) => Promise<string>,
) {
  if (!marketAvailable) throw new MarketError("unavailable", "The marketplace index is not connected.", 0)
  const clean = cleanInput(input)
  const issuedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
  const message = await entryMessage(ref, clean, issuedAt)
  const signature = await sign({ message })
  const path = `/v1/entries/${chain.id}/${ref.workspace}/${ref.kind}/${ref.recordId}`
  const body = JSON.stringify({ ...clean, poster, issuedAt, signature })
  for (let attempt = 0; ; attempt++) {
    try {
      return await call<Entry>(path, { method: "PUT", body })
    } catch (e) {
      if (e instanceof MarketError && e.code === "no_record" && attempt < 4) {
        await sleep(2000 * (attempt + 1))
        continue
      }
      throw e
    }
  }
}

/* ── React hooks (TanStack Query; the app's provider already has a client) ──── */

/** Every query this file makes starts with this key, so a save can refresh them all. */
export const MARKET_KEY = ["market"] as const

/** One record's entry: `data` is the entry, `null` when it has none, undefined while loading. */
export function useEntry(workspace: bigint | number | undefined, kind: EntryKind, recordId: bigint | number | undefined) {
  const available = useMarketAvailable()
  return useQuery({
    queryKey: [...MARKET_KEY, "entry", chain.id, String(workspace), kind, String(recordId)],
    queryFn: () => getEntry(workspace!, kind, recordId!),
    enabled: available && workspace !== undefined && recordId !== undefined,
    staleTime: 30_000,
    retry: 1,
  })
}

function keyOf(query: ListQuery) {
  return Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${String(v)}`)
    .sort()
    .join("&")
}

/** A list of entries, newest first, one page at a time (`fetchNextPage` follows the cursor). */
export function useEntries(query: Omit<ListQuery, "cursor">, options: { enabled?: boolean } = {}) {
  const available = useMarketAvailable()
  return useInfiniteQuery({
    queryKey: [...MARKET_KEY, "entries", chain.id, keyOf(query)],
    queryFn: ({ pageParam }) => listEntries({ ...query, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next ?? undefined,
    enabled: available && (options.enabled ?? true),
    staleTime: 30_000,
    retry: 1,
  })
}

/** How many entries each country has, most first. */
export function useCountryCounts(query: { workspace?: bigint | number; kind?: EntryKind } = {}, options: { enabled?: boolean } = {}) {
  const available = useMarketAvailable()
  return useQuery({
    queryKey: [...MARKET_KEY, "countries", chain.id, String(query.workspace ?? ""), query.kind ?? ""],
    queryFn: () => countryCounts(query),
    enabled: available && (options.enabled ?? true),
    staleTime: 60_000,
    retry: 1,
  })
}

/* ── Countries ─────────────────────────────────────────────────────────────── */

/** ISO 3166-1 alpha-2 codes for every country the browser can name (plus XK, Kosovo, which the index accepts). */
export const COUNTRY_CODES = (
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW"
).split(" ")

export function countryName(code: string, locale?: string) {
  try {
    return new Intl.DisplayNames(locale ? [locale] : undefined, { type: "region" }).of(code) ?? code
  } catch {
    return code
  }
}

/** Countries sorted by name in the visitor's language. */
export function countryOptions(locale?: string) {
  return COUNTRY_CODES.map((code) => ({ code, name: countryName(code, locale) })).sort((a, b) => a.name.localeCompare(b.name))
}

/** A best guess at the visitor's country from their browser language, e.g. "en-NZ" → "NZ". */
export function guessCountry(): string | null {
  try {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language]
    for (const l of langs) {
      // Only an explicit region ("en-NZ"); a bare "en" would otherwise be read as the US.
      const region = new Intl.Locale(l).region
      if (region && COUNTRY_CODES.includes(region)) return region
    }
  } catch {}
  return null
}
