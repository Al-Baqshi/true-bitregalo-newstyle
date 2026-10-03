"use client"
import { useReadContracts } from "wagmi"
import type { Address } from "viem"
import { abis } from "@/lib/bitregalo/config"
import type { Offer, Rfp } from "@/lib/bitregalo/hooks"
import type { EntryKind } from "@/lib/bitregalo/market"

/*
 * The chain is the truth for money and state. A marketplace entry says what a record is
 * about; these hooks read what the record itself says right now.
 */

export type RecordRef = { workspace: bigint | number; kind: EntryKind; recordId: bigint | number }
export type LiveRecord = Rfp | Offer
export const refKey = (r: RecordRef) => `${r.workspace}:${r.kind}:${r.recordId}`

/**
 * Reads each record (getRfp or getOffer) in one batched call. `instanceOf` gives the
 * contract for a workspace; records whose workspace is not known yet wait for it.
 */
export function useLiveRecords(refs: RecordRef[], instanceOf: (workspace: bigint) => Address | undefined) {
  const known = refs.flatMap((r) => {
    const address = instanceOf(BigInt(r.workspace))
    return address ? [{ ref: r, address }] : []
  })
  const q = useReadContracts({
    contracts: known.map(({ ref, address }) => ({
      address,
      abi: abis.instance,
      functionName: ref.kind === "request" ? "getRfp" : "getOffer",
      args: [BigInt(ref.recordId)],
    })),
    query: { enabled: known.length > 0, refetchInterval: 20_000 },
  })
  const map = new Map<string, LiveRecord>()
  known.forEach(({ ref }, i) => {
    const r = q.data?.[i]?.result as LiveRecord | undefined
    if (r) map.set(refKey(ref), r)
  })
  return { get: (r: RecordRef) => map.get(refKey(r)), isLoading: q.isLoading }
}

export type TokenMeta = { symbol: string; decimals: number }

/** Symbol and decimals for a set of token contracts, in one batched read. */
export function useTokenMeta(tokens: string[]) {
  const list = Array.from(new Set(tokens.map((t) => t.toLowerCase()).filter((t) => /^0x[0-9a-f]{40}$/.test(t) && !/^0x0{40}$/.test(t))))
  const q = useReadContracts({
    contracts: list.flatMap((t) => [
      { address: t as Address, abi: abis.utilityToken, functionName: "symbol" },
      { address: t as Address, abi: abis.utilityToken, functionName: "decimals" },
    ]),
    query: { enabled: list.length > 0, staleTime: 5 * 60_000 },
  })
  const map = new Map<string, TokenMeta>()
  list.forEach((t, i) => {
    const symbol = q.data?.[i * 2]?.result as string | undefined
    const decimals = q.data?.[i * 2 + 1]?.result as number | undefined
    if (symbol !== undefined && decimals !== undefined) map.set(t, { symbol, decimals: Number(decimals) })
  })
  return (token: string | undefined) => (token ? map.get(token.toLowerCase()) : undefined)
}

/** Whether a record still takes part: a request still taking offers, a listing anyone can still take. */
export function stillOpen(kind: EntryKind, r: LiveRecord | undefined, now = Date.now() / 1000) {
  if (!r) return true
  if (kind === "request") {
    const rfp = r as Rfp
    return rfp.state === 1 && Number(rfp.deadline) > now
  }
  const o = r as Offer
  return o.state === 1 && /^0x0{40}$/.test(o.designatedBuyer)
}
