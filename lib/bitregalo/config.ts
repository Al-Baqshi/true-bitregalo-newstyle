import { bscTestnet } from "wagmi/chains"
import { createConfig, http } from "wagmi"
import { injected } from "wagmi/connectors"
import bundle from "./bitregalo.json"
import type { Abi, Address } from "viem"

export const chain = bscTestnet
export const RPC_URL = "https://data-seed-prebsc-1-s1.bnbchain.org:8545"
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
  connectors: [injected()],
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
