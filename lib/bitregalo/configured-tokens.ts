"use client"
import { useQuery } from "@tanstack/react-query"
import { createPublicClient, http, parseAbiItem, type Address } from "viem"
import { chain, LOGS_FROM_BLOCK, LOGS_RPC_URL } from "./config"

/*
 * Which tokens a workspace's admin has ever accepted or stopped (`setToken`).
 *
 * The workspace contract keeps accepted tokens in a mapping, which cannot be listed. Each change
 * emits `TokenConfigured`, so the list is rebuilt from those events. That way a token an admin
 * accepted by pasting its address shows up for every visitor, not only in the admin's browser.
 * Whether a token is accepted NOW is still read from the contract; this only finds candidates.
 *
 * Public endpoints answer event queries over a limited range of blocks, so the search runs
 * backwards from the newest block in chunks, and stops at the workspace's first event
 * (`TreasuryCreated`, emitted once when it is launched) or at the block before which nothing of
 * this deployment exists. What was found is kept in this browser only to avoid searching the same
 * blocks twice. NOTE: this belongs in the indexer once there is one; the search grows with the
 * age of the workspace.
 */

const TOKEN_CONFIGURED = parseAbiItem("event TokenConfigured(address indexed token, bool allowed, uint8 decimals, uint256 serviceFee)")
const TREASURY_CREATED = parseAbiItem("event TreasuryCreated(address treasury)")
const CHUNKS = [50_000n, 10_000n, 2_000n]
const PARALLEL = 6
/** Bump when the stored shape changes. */
const KEY = (instance: string) => `bitregalo:configured-tokens:1:${chain.id}:${instance.toLowerCase()}`

type Found = { tokens: Address[]; reachedStart: boolean }
type Cache = { tokens: Address[]; /** Every block from here up to `to` has been searched. */ from: string; to: string; complete: boolean }

let client: ReturnType<typeof createPublicClient> | undefined
const logs = () => (client ??= createPublicClient({ chain, transport: http(LOGS_RPC_URL) }))

async function search(instance: Address, from: bigint, to: bigint): Promise<Found> {
  const found = await logs().getLogs({ address: instance, events: [TOKEN_CONFIGURED, TREASURY_CREATED], fromBlock: from, toBlock: to })
  return {
    tokens: found.flatMap((l) => (l.eventName === "TokenConfigured" && l.args.token ? [l.args.token] : [])),
    reachedStart: found.some((l) => l.eventName === "TreasuryCreated"),
  }
}

/** Searches [floor, top], newest first, in chunks the endpoint accepts. Stops at the workspace's first event. */
async function searchBack(instance: Address, floor: bigint, top: bigint): Promise<Found & { from: bigint }> {
  const tokens: Address[] = []
  // A node of one's own answers the whole range at once.
  try {
    const all = await search(instance, floor, top)
    return { ...all, from: floor }
  } catch {}
  let size = 0
  let hi = top
  while (hi >= floor) {
    const span = CHUNKS[size]
    const ranges: [bigint, bigint][] = []
    for (let i = 0, b = hi; i < PARALLEL && b >= floor; i++, b -= span) ranges.push([b - span + 1n > floor ? b - span + 1n : floor, b])
    let results: Found[]
    try {
      results = await Promise.all(ranges.map(([a, b]) => search(instance, a, b)))
    } catch (e) {
      if (size < CHUNKS.length - 1) { size++; continue }
      throw e
    }
    for (const [i, r] of results.entries()) {
      tokens.push(...r.tokens)
      if (r.reachedStart) return { tokens, reachedStart: true, from: ranges[i][0] }
    }
    hi = ranges[ranges.length - 1][0] - 1n
  }
  return { tokens, reachedStart: true, from: floor }
}

const uniq = (list: Address[]) => {
  const seen = new Set<string>()
  return list.filter((a) => !seen.has(a.toLowerCase()) && !!seen.add(a.toLowerCase()))
}
function load(instance: Address): Cache | null {
  try { return JSON.parse(localStorage.getItem(KEY(instance)) ?? "null") as Cache | null } catch { return null }
}
function save(instance: Address, c: Cache) {
  try { localStorage.setItem(KEY(instance), JSON.stringify(c)) } catch {}
}

async function discover(instance: Address): Promise<Address[]> {
  const latest = await logs().getBlockNumber()
  const cached = load(instance)
  if (cached?.complete && BigInt(cached.to) <= latest) {
    // Everything up to `to` is known: only the blocks since then are new.
    const since = BigInt(cached.to) + 1n
    const more = since <= latest ? await searchBack(instance, since, latest) : { tokens: [] as Address[] }
    const tokens = uniq([...cached.tokens, ...more.tokens])
    save(instance, { ...cached, tokens, to: String(latest) })
    return tokens
  }
  const all = await searchBack(instance, LOGS_FROM_BLOCK, latest)
  const tokens = uniq(all.tokens)
  save(instance, { tokens, from: String(all.from), to: String(latest), complete: true })
  return tokens
}

/**
 * Every token this workspace's admin has configured, oldest search result last. Empty while the
 * search runs, and when the endpoint cannot answer event queries: the app then falls back to the
 * tokens it knows by other means (the network's stablecoins and the workspace's own tokens).
 */
export function useConfiguredTokens(instance: Address | undefined) {
  const q = useQuery({
    queryKey: ["bitregalo", "configured-tokens", chain.id, instance?.toLowerCase()],
    queryFn: () => discover(instance!),
    enabled: !!instance,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  })
  return { tokens: q.data ?? [], isLoading: q.isLoading, failed: q.isError, refetch: q.refetch }
}
