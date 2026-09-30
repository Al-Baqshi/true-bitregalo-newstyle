"use client"
import { useCallback } from "react"
import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi"
import { toast } from "sonner"
import type { Abi, Address } from "viem"
import { abis, addresses, chain, explorerTx } from "./config"
import { useTenant } from "./tenant"

export type Rfp = {
  requester: Address; token: Address; scopeHash: `0x${string}`; deadline: bigint; state: number
  settlement: number; projectId: bigint; acceptedBid: bigint; settlementId: bigint
}
export type Bid = { provider: Address; amount: bigint; timeframe: bigint; withdrawn: boolean }
export type Offer = {
  supplier: Address; token: Address; amount: bigint; timeframe: bigint; state: number; settlement: number
  projectId: bigint; designatedBuyer: Address; buyer: Address; settlementId: bigint
}
export type Escrow = {
  issuer: Address; receiver: Address; token: Address; amount: bigint; feeBps: number; expiresAt: bigint
  state: number; projectId: bigint
}
export type TokenCfg = readonly [boolean, number, bigint]
export type Sale = {
  token: Address; payToken: Address; price: bigint; unit: bigint; remaining: bigint; sold: bigint; maxPerBuyer: bigint
  start: bigint; end: bigint; active: boolean; projectId: bigint; metaHash: `0x${string}`
}
export type Payment = {
  payer: Address; payee: Address; token: Address; amount: bigint; ref: `0x${string}`; projectId: bigint; settlementId: bigint
}

const factory = { address: addresses.tokenFactory, abi: abis.tokenFactory } as const
function useContracts() {
  const t = useTenant()
  return {
    instance: { address: t.instance, abi: abis.instance } as const,
    vault: { address: t.vault, abi: abis.vault } as const,
    t,
  }
}

export function useOverview() {
  const { instance, vault, t } = useContracts()
  return useReadContracts({
    contracts: [
      { ...instance, functionName: "rfpCount" },
      { ...instance, functionName: "offerCount" },
      { ...vault, functionName: "escrowCount" },
      { ...vault, functionName: "directCount" },
      { ...instance, functionName: "admin" },
      { ...instance, functionName: "feeBps" },
      { ...instance, functionName: "directEnabled" },
      { ...instance, functionName: "escrowEnabled" },
      { ...instance, functionName: "minTerm" },
      { ...instance, functionName: "maxTerm" },
      { ...factory, functionName: "tenantTokens", args: [t.id] },
    ],
    query: { refetchInterval: 15_000 },
  })
}

function idList(count: bigint | undefined, max = 50) {
  const n = Number(count ?? 0n)
  const ids: bigint[] = []
  for (let i = n; i >= 1 && ids.length < max; i--) ids.push(BigInt(i))
  return ids
}

export function useRfps(count: bigint | undefined) {
  const { instance, vault, t } = useContracts()
  const ids = idList(count)
  const q = useReadContracts({
    contracts: ids.map((id) => ({ ...instance, functionName: "getRfp", args: [id] })),
    query: { enabled: ids.length > 0, refetchInterval: 15_000 },
  })
  return { ids, data: (q.data ?? []).map((r) => r.result as Rfp | undefined), isLoading: q.isLoading }
}
export function useOffers(count: bigint | undefined) {
  const { instance, vault, t } = useContracts()
  const ids = idList(count)
  const q = useReadContracts({
    contracts: ids.map((id) => ({ ...instance, functionName: "getOffer", args: [id] })),
    query: { enabled: ids.length > 0, refetchInterval: 15_000 },
  })
  return { ids, data: (q.data ?? []).map((r) => r.result as Offer | undefined), isLoading: q.isLoading }
}
export function useEscrows(count: bigint | undefined) {
  const { instance, vault, t } = useContracts()
  const ids = idList(count)
  const q = useReadContracts({
    contracts: ids.map((id) => ({ ...vault, functionName: "getEscrow", args: [id] })),
    query: { enabled: ids.length > 0, refetchInterval: 15_000 },
  })
  return { ids, data: (q.data ?? []).map((r) => r.result as Escrow | undefined), isLoading: q.isLoading }
}
/** Open-amount payments (instance version 1+). `enabled` false on older workspaces, where the function does not exist. */
export function usePaymentCount(enabled: boolean) {
  const { instance } = useContracts()
  const q = useReadContract({ ...instance, functionName: "paymentCount", query: { enabled, refetchInterval: 15_000 } })
  return { count: q.data as bigint | undefined, refetch: q.refetch }
}
export function usePayments(count: bigint | undefined) {
  const { instance } = useContracts()
  const ids = idList(count)
  const q = useReadContracts({
    contracts: ids.map((id) => ({ ...instance, functionName: "getPayment", args: [id] })),
    query: { enabled: ids.length > 0, refetchInterval: 15_000 },
  })
  return { ids, data: (q.data ?? []).map((r) => r.result as Payment | undefined), isLoading: q.isLoading }
}
export function usePayment(id: bigint) {
  const { instance } = useContracts()
  const q = useReadContract({ ...instance, functionName: "getPayment", args: [id], query: { refetchInterval: 10_000 } })
  return { payment: q.data as Payment | undefined, refetch: q.refetch }
}
/** Utility sales (instance version 1+). */
export function useSaleCount(enabled: boolean) {
  const { instance } = useContracts()
  const q = useReadContract({ ...instance, functionName: "saleCount", query: { enabled, refetchInterval: 15_000 } })
  return { count: q.data as bigint | undefined, refetch: q.refetch }
}
export function useSales(count: bigint | undefined) {
  const { instance } = useContracts()
  const ids = idList(count)
  const q = useReadContracts({
    contracts: ids.map((id) => ({ ...instance, functionName: "getSale", args: [id] })),
    query: { enabled: ids.length > 0, refetchInterval: 15_000 },
  })
  return { ids, data: (q.data ?? []).map((r) => r.result as Sale | undefined), isLoading: q.isLoading, refetch: q.refetch }
}
export function useSale(id: bigint) {
  const { instance } = useContracts()
  const q = useReadContract({ ...instance, functionName: "getSale", args: [id], query: { refetchInterval: 10_000 } })
  return { sale: q.data as Sale | undefined, refetch: q.refetch }
}
export function useRfp(id: bigint) {
  const { instance, vault, t } = useContracts()
  const rfp = useReadContract({ ...instance, functionName: "getRfp", args: [id], query: { refetchInterval: 10_000 } })
  const bidCount = useReadContract({ ...instance, functionName: "bidCount", args: [id], query: { refetchInterval: 10_000 } })
  const n = Number((bidCount.data as bigint | undefined) ?? 0n)
  const bids = useReadContracts({
    contracts: Array.from({ length: n }, (_, i) => ({ ...instance, functionName: "getBid", args: [id, BigInt(i + 1)] })),
    query: { enabled: n > 0, refetchInterval: 10_000 },
  })
  return {
    rfp: rfp.data as Rfp | undefined,
    bids: (bids.data ?? []).map((b, i) => ({ id: BigInt(i + 1), ...(b.result as Bid) })),
    refetch: () => { rfp.refetch(); bidCount.refetch(); bids.refetch() },
  }
}
export function useOffer(id: bigint) {
  const { instance, vault, t } = useContracts()
  const q = useReadContract({ ...instance, functionName: "getOffer", args: [id], query: { refetchInterval: 10_000 } })
  return { offer: q.data as Offer | undefined, refetch: q.refetch }
}
export function useEscrow(id: bigint) {
  const { instance, vault, t } = useContracts()
  const q = useReadContract({ ...vault, functionName: "getEscrow", args: [id], query: { refetchInterval: 10_000 } })
  return { escrow: q.data as Escrow | undefined, refetch: q.refetch }
}
export function useTokenCfg(token: Address | undefined) {
  const { instance, vault, t } = useContracts()
  const q = useReadContract({ ...instance, functionName: "tokens", args: [token ?? addresses.usdt], query: { enabled: !!token && !!instance.address } })
  return q.data as TokenCfg | undefined
}
export function useErc20(token: Address | undefined, owner: Address | undefined) {
  const { instance, vault, t } = useContracts()
  const q = useReadContracts({
    contracts: [
      { address: token!, abi: abis.utilityToken, functionName: "symbol" },
      { address: token!, abi: abis.utilityToken, functionName: "decimals" },
      { address: token!, abi: abis.erc20, functionName: "balanceOf", args: [owner ?? vault.address] },
      { address: token!, abi: abis.erc20, functionName: "allowance", args: [owner ?? vault.address, vault.address] },
    ],
    query: { enabled: !!token, refetchInterval: 10_000 },
  })
  const [symbol, decimals, balance, allowance] = (q.data ?? []).map((r) => r.result)
  return {
    symbol: (symbol as string) ?? "TOKEN",
    decimals: Number((decimals as number) ?? 18),
    balance: (balance as bigint) ?? 0n,
    allowance: (allowance as bigint) ?? 0n,
    refetch: q.refetch,
  }
}

/** One-shot write with toasts and receipt wait. */
export function useTx() {
  const { writeContractAsync, isPending } = useWriteContract()
  const { chain: connected } = useAccount()
  const send = useCallback(
    async (label: string, params: { address: Address; abi: Abi; functionName: string; args?: unknown[]; value?: bigint }) => {
      if (connected && connected.id !== chain.id) {
        toast.error(`Switch MetaMask to ${chain.name} first`)
        throw new Error("wrong chain")
      }
      const id = toast.loading(`${label}: confirm in your wallet…`)
      try {
        const hash = await writeContractAsync({ ...params, chainId: chain.id } as never)
        toast.loading(`${label}: waiting for confirmation…`, { id })
        const { waitForTransactionReceipt } = await import("wagmi/actions")
        const { wagmiConfig } = await import("./config")
        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash })
        if (receipt.status !== "success") throw new Error("transaction reverted")
        toast.success(`${label}: confirmed`, {
          id,
          description: `${hash.slice(0, 10)}…`,
          action: { label: "View", onClick: () => window.open(explorerTx(hash), "_blank") },
        })
        return receipt
      } catch (e) {
        const msg = (e as Error).message ?? String(e)
        toast.error(`${label} failed`, { id, description: msg.split("\n")[0].slice(0, 160) })
        throw e
      }
    },
    [writeContractAsync, connected],
  )
  return { send, isPending }
}

export { useWaitForTransactionReceipt }
