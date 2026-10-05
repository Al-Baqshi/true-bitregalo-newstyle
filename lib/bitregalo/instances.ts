"use client"
import { useReadContract, useReadContracts } from "wagmi"
import { decodeEventLog, hexToBytes, keccak256, stringToHex, toBytes, type Abi, type Address, type Hex, type TransactionReceipt } from "viem"
import { abis, addresses, STABLES } from "./config"
import { useConfiguredTokens } from "./configured-tokens"

export type InstanceInfo = {
  id: bigint; instance: Address; vault: Address; admin: Address
  /** The number, in the mother's list, of the implementation set this workspace was launched from. */
  version: bigint
}
export type ProjectInfo = { id: bigint; owner: Address; metaHash: Hex; active: boolean; label: string | null }
export type SettlementToken = { address: Address; symbol: string; decimals: number; serviceFee: bigint; allowed: boolean }

const ZERO = /^0x0{40}$/
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address

/** Every workspace launched from the mother, oldest first. */
export function useInstances() {
  const count = useReadContract({ address: addresses.mother, abi: abis.mother, functionName: "tenantCount", query: { refetchInterval: 20_000 } })
  const n = Number((count.data as bigint | undefined) ?? 0n)
  const q = useReadContracts({
    contracts: Array.from({ length: n }, (_, i) => ({ address: addresses.mother, abi: abis.mother, functionName: "tenants", args: [BigInt(i)] })),
    query: { enabled: n > 0 },
  })
  const raw = (q.data ?? []).map((r) => r.result as { instance: Address; vault: Address; version: bigint } | undefined)
  // The mother keeps a workspace's contracts and version. Its admin lives on the workspace contract.
  const admins = useReadContracts({
    contracts: raw.map((t) => ({ address: t?.instance ?? ZERO_ADDRESS, abi: abis.instance, functionName: "admin" })),
    query: { enabled: raw.length > 0, refetchInterval: 20_000 },
  })
  const list: InstanceInfo[] = raw.flatMap((t, i) => {
    const admin = (admins.data?.[i]?.result as Address | undefined) ?? ZERO_ADDRESS
    return t && !ZERO.test(t.instance) ? [{ id: BigInt(i), instance: t.instance, vault: t.vault, admin, version: t.version }] : []
  })
  return { list, isLoading: count.isLoading || q.isLoading || (raw.length > 0 && admins.isLoading), refetch: () => { count.refetch(); q.refetch(); admins.refetch() } }
}

export function useProjects(instance: Address | undefined) {
  const count = useReadContract({ address: instance, abi: abis.instance, functionName: "projectCount", query: { enabled: !!instance, refetchInterval: 20_000 } })
  const n = Number((count.data as bigint | undefined) ?? 0n)
  const q = useReadContracts({
    contracts: Array.from({ length: n }, (_, i) => ({ address: instance!, abi: abis.instance, functionName: "getProject", args: [BigInt(i + 1)] })),
    query: { enabled: !!instance && n > 0 },
  })
  const list: ProjectInfo[] = (q.data ?? []).flatMap((r, i) => {
    const p = r.result as { owner: Address; metaHash: Hex; active: boolean } | undefined
    return p ? [{ id: BigInt(i + 1), ...p, label: decodeLabel(p.metaHash) }] : []
  })
  return { list, refetch: () => { count.refetch(); q.refetch() } }
}

/** The token factory returns at most this many addresses per call. */
const PAGE = 100
/** Beyond this many projects in one workspace, the app reads the tokens of the newest ones only. */
const MAX_PROJECTS = 200
const offsets = (count: number) => Array.from({ length: Math.ceil(count / PAGE) }, (_, i) => BigInt(i * PAGE))

export type WorkspaceToken = { address: Address; /** 0 for a token of the workspace itself. */ projectId: bigint }

/**
 * Every token the factory created for each of the given workspaces: the workspace's own tokens
 * (created by its admin) and the tokens of its projects (created by the admin or the project's
 * owner). The factory lists the two separately and in pages, so this reads the counts first,
 * then each page.
 */
export function useTokensOf(workspaces: { id: bigint; instance: Address }[]) {
  const factory = { address: addresses.tokenFactory, abi: abis.tokenFactory } as const
  const on = workspaces.length > 0
  const head = useReadContracts({
    contracts: workspaces.flatMap((w) => [
      { ...factory, functionName: "workspaceTokenCount", args: [w.id] },
      { address: w.instance, abi: abis.instance, functionName: "projectCount" },
    ]),
    query: { enabled: on, refetchInterval: 20_000 },
  })
  const projects = workspaces.flatMap((w, i) => {
    const n = Number((head.data?.[i * 2 + 1]?.result as bigint | undefined) ?? 0n)
    return Array.from({ length: Math.min(n, MAX_PROJECTS) }, (_, j) => ({ workspace: w.id, projectId: BigInt(n - j) }))
  })
  const counts = useReadContracts({
    contracts: projects.map((p) => ({ ...factory, functionName: "projectTokenCount", args: [p.workspace, p.projectId] })),
    query: { enabled: on && projects.length > 0, refetchInterval: 20_000 },
  })
  const pages = [
    ...workspaces.flatMap((w, i) =>
      offsets(Number((head.data?.[i * 2]?.result as bigint | undefined) ?? 0n)).map((offset) => ({
        workspace: w.id, projectId: 0n, call: { ...factory, functionName: "workspaceTokens", args: [w.id, offset, BigInt(PAGE)] },
      })),
    ),
    ...projects.flatMap((p, i) =>
      offsets(Number((counts.data?.[i]?.result as bigint | undefined) ?? 0n)).map((offset) => ({
        ...p, call: { ...factory, functionName: "projectTokens", args: [p.workspace, p.projectId, offset, BigInt(PAGE)] },
      })),
    ),
  ]
  const lists = useReadContracts({
    contracts: pages.map((p) => p.call),
    query: { enabled: on && pages.length > 0, refetchInterval: 20_000 },
  })
  const byWorkspace = new Map<string, WorkspaceToken[]>(workspaces.map((w) => [String(w.id), []]))
  pages.forEach((p, i) => {
    for (const address of (lists.data?.[i]?.result as Address[] | undefined) ?? []) byWorkspace.get(String(p.workspace))?.push({ address, projectId: p.projectId })
  })
  return {
    /** Per workspace number: its own tokens first (oldest first), then its projects' tokens. */
    of: (id: bigint) => byWorkspace.get(String(id)) ?? [],
    isLoading: on && (!head.data || (projects.length > 0 && !counts.data) || (pages.length > 0 && !lists.data)),
    refetch: () => { head.refetch(); counts.refetch(); lists.refetch() },
  }
}

/** The tokens of one workspace. See `useTokensOf`. */
export function useWorkspaceTokens(tenantId: bigint | undefined, instance: Address | undefined) {
  const all = useTokensOf(tenantId !== undefined && instance ? [{ id: tenantId, instance }] : [])
  const tokens = tenantId !== undefined ? all.of(tenantId) : []
  return { tokens, addresses: tokens.map((x) => x.address), isLoading: all.isLoading, refetch: all.refetch }
}

/**
 * Tokens a workspace accepts as payment. The allowlist is a mapping, so candidates are the known
 * stablecoins, every token created for this workspace through the factory, and every token its
 * admin ever configured by address (found from the contract's events), each checked on chain.
 */
export function useSettlementTokens(instance: Address | undefined, tenantId: bigint | undefined) {
  const own = useWorkspaceTokens(tenantId, instance)
  const configured = useConfiguredTokens(instance)
  const seen = new Set<string>()
  const candidates = [...STABLES.map((s) => s.address), ...own.addresses, ...configured.tokens].filter((a) => !seen.has(a.toLowerCase()) && !!seen.add(a.toLowerCase()))
  const q = useReadContracts({
    contracts: candidates.flatMap((t) => [
      { address: instance!, abi: abis.instance, functionName: "tokens", args: [t] },
      { address: t, abi: abis.utilityToken, functionName: "symbol" },
      { address: t, abi: abis.utilityToken, functionName: "decimals" },
    ]),
    query: { enabled: !!instance, refetchInterval: 20_000 },
  })
  const all: SettlementToken[] = candidates.map((t, i) => {
    const cfg = q.data?.[i * 3]?.result as readonly [boolean, number, bigint] | undefined
    return {
      address: t,
      symbol: (q.data?.[i * 3 + 1]?.result as string) ?? "…",
      decimals: Number((q.data?.[i * 3 + 2]?.result as number) ?? 18),
      serviceFee: cfg?.[2] ?? 0n,
      allowed: !!cfg?.[0],
    }
  })
  return { all, accepted: all.filter((t) => t.allowed), refetch: () => { own.refetch(); configured.refetch(); q.refetch() } }
}

/**
 * Short public labels (≤31 bytes) are stored in a bytes32 field as readable text, so everyone sees the
 * name. Longer or private text is stored only as its keccak256 fingerprint.
 */
export function encodeLabel(text: string): Hex {
  const t = text.trim()
  const n = new TextEncoder().encode(t).length
  return n > 0 && n <= 31 ? stringToHex(t, { size: 32 }) : keccak256(toBytes(t))
}
export function fingerprint(text: string): Hex {
  return keccak256(toBytes(text.trim()))
}
export function decodeLabel(h: Hex | undefined): string | null {
  if (!h) return null
  const bytes = hexToBytes(h)
  const end = bytes.indexOf(0)
  if (end <= 0 || bytes.slice(end).some((b) => b !== 0)) return null
  try {
    const s = new TextDecoder("utf-8", { fatal: true }).decode(bytes.slice(0, end))
    return /[\u0000-\u001f\u007f]/.test(s) ? null : s
  } catch {
    return null
  }
}
export function labelBytes(text: string) {
  return new TextEncoder().encode(text.trim()).length
}

/** Reads the first event called `name` out of a receipt. */
export function eventArgs<T>(receipt: TransactionReceipt, abi: Abi, name: string): T {
  for (const log of receipt.logs) {
    try {
      const ev = decodeEventLog({ abi, data: log.data, topics: log.topics })
      if (ev.eventName === name) return ev.args as T
    } catch {}
  }
  throw new Error(`${name} not found in the transaction`)
}

export function instanceName(id: bigint): string | null {
  try { return localStorage.getItem(`bitregalo:instance:${id}:name`) } catch { return null }
}
export function rememberInstanceName(id: bigint, name: string) {
  try { if (name.trim()) localStorage.setItem(`bitregalo:instance:${id}:name`, name.trim()) } catch {}
}
