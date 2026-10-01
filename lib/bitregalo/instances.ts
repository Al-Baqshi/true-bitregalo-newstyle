"use client"
import { useReadContract, useReadContracts } from "wagmi"
import { decodeEventLog, hexToBytes, keccak256, stringToHex, toBytes, type Abi, type Address, type Hex, type TransactionReceipt } from "viem"
import { abis, addresses, STABLES } from "./config"

export type InstanceInfo = { id: bigint; instance: Address; vault: Address; admin: Address }
export type ProjectInfo = { id: bigint; owner: Address; metaHash: Hex; active: boolean; label: string | null }
export type SettlementToken = { address: Address; symbol: string; decimals: number; serviceFee: bigint; allowed: boolean }

const ZERO = /^0x0{40}$/

/** Every instance launched from the mother, oldest first. */
export function useInstances() {
  const count = useReadContract({ address: addresses.mother, abi: abis.mother, functionName: "tenantCount", query: { refetchInterval: 20_000 } })
  const n = Number((count.data as bigint | undefined) ?? 0n)
  const q = useReadContracts({
    contracts: Array.from({ length: n }, (_, i) => ({ address: addresses.mother, abi: abis.mother, functionName: "tenants", args: [BigInt(i)] })),
    query: { enabled: n > 0 },
  })
  const raw = (q.data ?? []).map((r) => r.result as { instance: Address; vault: Address; admin: Address } | undefined)
  // The mother records the admin at launch only; the workspace contract holds the current one.
  const admins = useReadContracts({
    contracts: raw.map((t) => ({ address: t?.instance ?? ("0x0000000000000000000000000000000000000000" as Address), abi: abis.instance, functionName: "admin" })),
    query: { enabled: raw.length > 0, refetchInterval: 20_000 },
  })
  const list: InstanceInfo[] = raw.flatMap((t, i) => {
    const admin = (admins.data?.[i]?.result as Address | undefined) ?? t?.admin
    return t && !ZERO.test(t.instance) ? [{ id: BigInt(i), instance: t.instance, vault: t.vault, admin: admin! }] : []
  })
  return { list, isLoading: count.isLoading || q.isLoading, refetch: () => { count.refetch(); q.refetch(); admins.refetch() } }
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

/**
 * Tokens an instance accepts as payment. The allowlist is a mapping, so candidates are the known
 * stablecoin plus every token launched for this instance through the factory, each checked on-chain.
 */
export function useSettlementTokens(instance: Address | undefined, tenantId: bigint | undefined) {
  const factoryTokens = useReadContract({
    address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tenantTokens", args: [tenantId ?? 0n],
    query: { enabled: tenantId !== undefined, refetchInterval: 20_000 },
  })
  const candidates = Array.from(new Set([...STABLES.map((s) => s.address), ...(((factoryTokens.data as Address[] | undefined) ?? []))]))
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
  return { all, accepted: all.filter((t) => t.allowed), refetch: () => { factoryTokens.refetch(); q.refetch() } }
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
