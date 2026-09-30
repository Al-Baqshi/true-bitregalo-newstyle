import { bscTestnet } from "wagmi/chains"
import { createConfig, http } from "wagmi"
import { injected } from "wagmi/connectors"
import bundle from "./bitregalo.json"
import type { Abi, Address } from "viem"

export const chain = bscTestnet
/** Overridable at build time so the same app can point at a local fork for testing. */
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://data-seed-prebsc-1-s1.bnbchain.org:8545"
export const EXPLORER = "https://testnet.bscscan.com"

const dep = bundle.deployments
export const addresses = {
  mother: dep.mother as Address,
  treasury: dep.treasury as Address,
  paymaster: dep.paymaster as Address,
  tokenFactory: (dep as { tokenFactory?: string }).tokenFactory as Address,
  instance: dep.tenants.t0.instance as Address,
  vault: dep.tenants.t0.vault as Address,
  usdt: dep.tenants.t0.tokens["0"] as Address,
}

/** Implementation pairs from the deployments file, oldest first. Registration state lives on the mother. */
export const versions = Object.entries(dep.versions as Record<string, { instanceImpl: string; vaultImpl: string }>)
  .map(([k, v]) => ({ n: Number(k.replace(/^v/, "")), instanceImpl: v.instanceImpl as Address, vaultImpl: v.vaultImpl as Address }))
  .sort((a, b) => a.n - b.n)

export const abis = {
  mother: bundle.abis.mother as Abi,
  instance: bundle.abis.instance as Abi,
  vault: bundle.abis.vault as Abi,
  tokenFactory: bundle.abis.tokenFactory as Abi,
  utilityToken: bundle.abis.utilityToken as Abi,
  erc20: bundle.abis.erc20 as Abi,
}

export const wagmiConfig = createConfig({
  chains: [chain],
  // EIP-6963 discovery adds one connector per installed wallet; `injected()` is the
  // legacy window.ethereum fallback for browsers that don't announce wallets.
  connectors: [injected()],
  multiInjectedProviderDiscovery: true,
  transports: { [chain.id]: http(RPC_URL) },
  ssr: true,
})

export const SETTLEMENT = ["Record only", "Direct payment", "Escrow"] as const
export const RFP_STATE = ["—", "Open", "Awarded", "Cancelled"] as const
export const OFFER_STATE = ["—", "Listed", "Confirmed", "Withdrawn"] as const
export const ESCROW_STATE = ["—", "Active", "Released", "Cancelled", "Expired"] as const

export function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : ""
}
export function explorerAddress(a: string) {
  return `${EXPLORER}/address/${a}`
}
export function explorerTx(h: string) {
  return `${EXPLORER}/tx/${h}`
}
