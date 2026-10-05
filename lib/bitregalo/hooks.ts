"use client"
import { useCallback, useEffect, useState } from "react"
import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi"
import { toast } from "sonner"
import { zeroAddress, type Abi, type Address } from "viem"
import { abis, chain, explorerTx } from "./config"
import { errorText, explainError, isRevert } from "./errors"
import { useTenant } from "./tenant"

export type Rfp = {
  requester: Address; token: Address; scopeHash: `0x${string}`; deadline: bigint; state: number
  settlement: number; projectId: bigint; acceptedBid: bigint; settlementId: bigint
}
/** An offer on a request. `validUntil` is the last moment it can be accepted. */
export type Bid = { provider: Address; timeframe: bigint; validUntil: bigint; withdrawn: boolean; amount: bigint }
/** A listing. `validUntil` 0 means it stays open until the supplier withdraws it. */
export type Offer = {
  supplier: Address; token: Address; amount: bigint; timeframe: bigint; validUntil: bigint; state: number; settlement: number
  projectId: bigint; designatedBuyer: Address; buyer: Address; settlementId: bigint
}
export type Escrow = {
  issuer: Address; receiver: Address; token: Address; amount: bigint; feeBps: number; expiresAt: bigint
  state: number; projectId: bigint
}
/** `tokens(token)` on the workspace contract: accepted, decimals (read from the token), service fee. */
export type TokenCfg = readonly [boolean, number, bigint]
export type Sale = {
  token: Address; payToken: Address; price: bigint; unit: bigint; remaining: bigint; sold: bigint; maxPerBuyer: bigint
  start: bigint; end: bigint; active: boolean; projectId: bigint; metaHash: `0x${string}`
}
export type Payment = {
  payer: Address; payee: Address; token: Address; amount: bigint; ref: `0x${string}`; projectId: bigint; settlementId: bigint
}

function useContracts() {
  const t = useTenant()
  return {
    instance: { address: t.instance, abi: abis.instance } as const,
    vault: { address: t.vault, abi: abis.vault } as const,
    t,
  }
}

export function useOverview() {
  const { instance, vault } = useContracts()
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
  const { instance } = useContracts()
  const ids = idList(count)
  const q = useReadContracts({
    contracts: ids.map((id) => ({ ...instance, functionName: "getRfp", args: [id] })),
    query: { enabled: ids.length > 0, refetchInterval: 15_000 },
  })
  return { ids, data: (q.data ?? []).map((r) => r.result as Rfp | undefined), isLoading: q.isLoading }
}
export function useOffers(count: bigint | undefined) {
  const { instance } = useContracts()
  const ids = idList(count)
  const q = useReadContracts({
    contracts: ids.map((id) => ({ ...instance, functionName: "getOffer", args: [id] })),
    query: { enabled: ids.length > 0, refetchInterval: 15_000 },
  })
  return { ids, data: (q.data ?? []).map((r) => r.result as Offer | undefined), isLoading: q.isLoading }
}
export function useEscrows(count: bigint | undefined) {
  const { vault } = useContracts()
  const ids = idList(count)
  const q = useReadContracts({
    contracts: ids.map((id) => ({ ...vault, functionName: "getEscrow", args: [id] })),
    query: { enabled: ids.length > 0, refetchInterval: 15_000 },
  })
  return { ids, data: (q.data ?? []).map((r) => r.result as Escrow | undefined), isLoading: q.isLoading }
}
/** Payments with an amount the payer chose ("Send a payment"). */
export function usePaymentCount() {
  const { instance } = useContracts()
  const q = useReadContract({ ...instance, functionName: "paymentCount", query: { refetchInterval: 15_000 } })
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
/** Sales of a workspace's tokens in its shop. */
export function useSaleCount() {
  const { instance } = useContracts()
  const q = useReadContract({ ...instance, functionName: "saleCount", query: { refetchInterval: 15_000 } })
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

/**
 * Where a sale stands with the workspace treasury. Nothing can be bought until the treasury's
 * owner approves the sale; `allowance` is how many tokens the owner has approved and are not sold
 * yet. `termsHash` is the fingerprint of the sale's terms that an approval names.
 */
export function useSaleApproval(saleId: bigint | undefined, token: Address | undefined) {
  const { t } = useContracts()
  const treasury = { address: t.treasury!, abi: abis.workspaceTreasury } as const
  const ready = !!t.treasury && saleId !== undefined && !!token && token !== zeroAddress
  const q = useReadContracts({
    contracts: ready ? [
      { ...treasury, functionName: "saleAllowance", args: [saleId] },
      { ...treasury, functionName: "saleTermsHash", args: [saleId] },
      { ...treasury, functionName: "owner" },
      { address: token!, abi: abis.erc20, functionName: "balanceOf", args: [t.treasury!] },
      { address: token!, abi: abis.utilityToken, functionName: "owner" },
    ] : [],
    query: { enabled: ready, refetchInterval: 10_000 },
  })
  const [allowance, termsHash, owner, held, tokenOwner] = (q.data ?? []).map((r) => r.result) as [bigint?, `0x${string}`?, Address?, bigint?, Address?]
  return {
    loaded: !!q.data,
    allowance: allowance ?? 0n,
    termsHash,
    /** The treasury's owner: the only wallet that can approve or stop a sale. */
    owner,
    /** How many of the token the treasury holds now. */
    held: held ?? 0n,
    /** True when the treasury owns the token, so it creates what it does not hold as the sale goes. */
    creates: !!t.treasury && !!tokenOwner && tokenOwner.toLowerCase() === t.treasury.toLowerCase(),
    refetch: q.refetch,
  }
}

export function useRfp(id: bigint) {
  const { instance } = useContracts()
  const rfp = useReadContract({ ...instance, functionName: "getRfp", args: [id], query: { refetchInterval: 10_000 } })
  const bidCount = useReadContract({ ...instance, functionName: "bidCount", args: [id], query: { refetchInterval: 10_000 } })
  const n = Number((bidCount.data as bigint | undefined) ?? 0n)
  const bids = useReadContracts({
    contracts: Array.from({ length: n }, (_, i) => ({ ...instance, functionName: "getBid", args: [id, BigInt(i + 1)] })),
    query: { enabled: n > 0, refetchInterval: 10_000 },
  })
  return {
    rfp: rfp.data as Rfp | undefined,
    bids: (bids.data ?? []).flatMap((b, i) => (b.result ? [{ id: BigInt(i + 1), ...(b.result as Bid) }] : [])),
    refetch: () => { rfp.refetch(); bidCount.refetch(); bids.refetch() },
  }
}
export function useOffer(id: bigint) {
  const { instance } = useContracts()
  const q = useReadContract({ ...instance, functionName: "getOffer", args: [id], query: { refetchInterval: 10_000 } })
  return { offer: q.data as Offer | undefined, refetch: q.refetch }
}
export function useEscrow(id: bigint) {
  const { vault } = useContracts()
  const q = useReadContract({ ...vault, functionName: "getEscrow", args: [id], query: { refetchInterval: 10_000 } })
  return { escrow: q.data as Escrow | undefined, refetch: q.refetch }
}
export function useTokenCfg(token: Address | undefined) {
  const { instance } = useContracts()
  const q = useReadContract({ ...instance, functionName: "tokens", args: [token ?? zeroAddress], query: { enabled: !!token && !!instance.address, refetchInterval: 10_000 } })
  return q.data as TokenCfg | undefined
}
export function useErc20(token: Address | undefined, owner: Address | undefined) {
  const { vault } = useContracts()
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

/**
 * A payout the vault could not deliver when a held payment settled (the token refused the
 * transfer) is credited to the same wallet, which collects it with `claim`.
 */
export function useCredit(token: Address | undefined, account: Address | undefined) {
  const { vault } = useContracts()
  const q = useReadContract({
    ...vault, functionName: "claimable", args: [account ?? zeroAddress, token ?? zeroAddress],
    query: { enabled: !!token && !!account, refetchInterval: 10_000 },
  })
  return { amount: (q.data as bigint | undefined) ?? 0n, refetch: q.refetch }
}

/**
 * The time now, in seconds, refreshed twice a minute. Pages compare it with an offer's
 * valid-until time, so an offer stops being selectable when its time passes, without a reload.
 */
export function useNow(everyMs = 30_000) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), everyMs)
    return () => clearInterval(id)
  }, [everyMs])
  return now
}

export type TxParams = { address: Address; abi: Abi; functionName: string; args?: unknown[]; value?: bigint }

/**
 * One-shot write with toasts and receipt wait. The call is tried against the chain first, so a
 * transaction the contract would refuse never reaches the wallet, and the person is told why in
 * plain words (for example, that a fee changed since they opened the page).
 */
export function useTx() {
  const { writeContractAsync, isPending } = useWriteContract()
  const { chain: connected, address: account } = useAccount()
  const send = useCallback(
    async (label: string, params: TxParams) => {
      if (connected && connected.id !== chain.id) {
        toast.error(`Switch your wallet to ${chain.name} first`)
        throw new Error("wrong chain")
      }
      const id = toast.loading(`${label}: confirm in your wallet…`)
      const { simulateContract, waitForTransactionReceipt } = await import("wagmi/actions")
      const { wagmiConfig } = await import("./config")
      const dryRun = () => simulateContract(wagmiConfig, { ...params, account, chainId: chain.id } as never)
      try {
        // Only a refusal by the contract stops here. If the dry run itself cannot be done, the wallet decides.
        // A refusal is asked for twice: a node that is one block behind (it has not seen the approval
        // that was just confirmed, say) would otherwise refuse something the chain accepts.
        try {
          await dryRun()
        } catch (first) {
          if (isRevert(first)) {
            await new Promise((r) => setTimeout(r, 2500))
            try { await dryRun() } catch (second) { if (isRevert(second)) throw second }
          }
        }
        const hash = await writeContractAsync({ ...params, chainId: chain.id } as never)
        toast.loading(`${label}: waiting for confirmation…`, { id })
        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash })
        if (receipt.status !== "success") {
          // Something changed between signing and confirmation. Ask the chain what it would say now.
          let why: unknown = null
          try { await dryRun() } catch (e) { why = e }
          throw why && explainError(why) ? why : new Error("The transaction was refused by the contract. Nothing was changed.")
        }
        toast.success(`${label}: confirmed`, {
          id,
          description: `${hash.slice(0, 10)}…`,
          action: explorerTx(hash) ? { label: "View", onClick: () => window.open(explorerTx(hash), "_blank") } : undefined,
        })
        return receipt
      } catch (e) {
        const msg = errorText(e)
        toast.error(`${label} failed`, { id, description: msg })
        // Callers show `message` to the person, so it carries the plain words.
        throw explainError(e) ? new Error(msg, { cause: e }) : e
      }
    },
    [writeContractAsync, connected, account],
  )
  return { send, isPending }
}

export { useWaitForTransactionReceipt }
