"use client"
import { useReadContracts } from "wagmi"
import type { Address } from "viem"
import { abis } from "./config"

export function useInstanceRules(instance: Address | undefined) {
  const q = useReadContracts({
    contracts: ["directEnabled", "escrowEnabled", "minTerm", "maxTerm", "admin", "feeBps", "paused"].map((fn) => ({ address: instance!, abi: abis.instance, functionName: fn })),
    query: { enabled: !!instance, refetchInterval: 20_000 },
  })
  const [direct, escrow, minTerm, maxTerm, admin, feeBps, paused] = (q.data ?? []).map((r) => r.result)
  return {
    direct: !!direct, escrow: !!escrow,
    minTerm: Number((minTerm as bigint | undefined) ?? 3600n), maxTerm: Number((maxTerm as bigint | undefined) ?? 31536000n),
    admin: admin as Address | undefined, feeBps: Number(feeBps ?? 0), paused: !!paused, loaded: !!q.data,
  }
}
