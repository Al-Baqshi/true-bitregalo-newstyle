import { bscTestnet } from "wagmi/chains"
import { createConfig, http } from "wagmi"
import { injected } from "wagmi/connectors"
import bundle from "./bitregalo.json"
import type { Abi, Address, Chain } from "viem"

/**
 * The networks this app knows how to talk to. The protocol is not tied to one network: a
 * network is an entry here plus a deployments bundle generated for it (`bitregalo.json`
 * carries the chain id it was built from). The app serves one network per build today;
 * nothing below this block names a network.
 */
type NetworkEntry = { chain: Chain; rpcUrl: string; explorer: string; practice: boolean }
const NETWORKS: Record<number, NetworkEntry> = {
  97: { chain: bscTestnet, rpcUrl: "https://data-seed-prebsc-1-s1.bnbchain.org:8545", explorer: "https://testnet.bscscan.com", practice: true },
}
const entry = NETWORKS[bundle.chainId]
if (!entry) throw new Error(`No network entry for chain ${bundle.chainId}: add it to NETWORKS in lib/bitregalo/config.ts`)

export const chain = entry.chain
/** Overridable at build time so the same app can point at a local fork for testing. */
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || entry.rpcUrl
export const EXPLORER = entry.explorer
/** What the rest of the app may say about the network it is running on. */
export const network = {
  id: entry.chain.id,
  name: entry.chain.name,
  /** The coin that pays network fees here, e.g. tBNB. */
  nativeSymbol: entry.chain.nativeCurrency.symbol,
  /** A practice network: tokens have no value. */
  practice: entry.practice,
  explorer: entry.explorer,
} as const

const dep = bundle.deployments
export const addresses = {
  mother: dep.mother as Address,
  treasury: dep.treasury as Address,
  paymaster: dep.paymaster as Address,
  tokenFactory: (dep as { tokenFactory?: string }).tokenFactory as Address,
  instance: dep.tenants.t0.instance as Address,
  vault: dep.tenants.t0.vault as Address,
  usdt: dep.tenants.t0.tokens["0"] as Address,
  /** Practice stablecoin with a public faucet; undefined on networks without one. */
  testStable: (dep as { testStable?: string }).testStable as Address | undefined,
}

/**
 * The BitRegalo public network: the workspace anyone uses when they are not inside an
 * organisation's own workspace. It is an ordinary workspace run by BitRegalo, chosen here.
 * Override per build with NEXT_PUBLIC_PUBLIC_WORKSPACE, or set `publicWorkspace` in the
 * deployments file.
 */
export const PUBLIC_WORKSPACE_ID = BigInt(
  process.env.NEXT_PUBLIC_PUBLIC_WORKSPACE ?? String((dep as { publicWorkspace?: number }).publicWorkspace ?? 0)
)

/** Implementation pairs from the deployments file, oldest first. Registration state lives on the mother. */
export const versions = Object.entries(dep.versions as Record<string, { instanceImpl: string; vaultImpl: string; treasuryImpl?: string }>)
  .map(([k, v]) => ({ n: Number(k.replace(/^v/, "")), instanceImpl: v.instanceImpl as Address, vaultImpl: v.vaultImpl as Address, treasuryImpl: v.treasuryImpl as Address | undefined }))
  .sort((a, b) => a.n - b.n)

export const abis = {
  mother: bundle.abis.mother as Abi,
  instance: bundle.abis.instance as Abi,
  vault: bundle.abis.vault as Abi,
  tokenFactory: bundle.abis.tokenFactory as Abi,
  utilityToken: bundle.abis.utilityToken as Abi,
  erc20: bundle.abis.erc20 as Abi,
  workspaceTreasury: (bundle.abis as { workspaceTreasury?: unknown }).workspaceTreasury as Abi,
}

/** Stablecoins the app offers by name on this network. Any other ERC-20 can be added by address. */
export const STABLES: { symbol: string; name: string; address: Address; faucet?: boolean }[] = [
  ...(addresses.testStable ? [{ symbol: "tUSD", name: "BitRegalo Test Dollar — free from the faucet", address: addresses.testStable, faucet: true }] : []),
  { symbol: "USDT", name: "Tether USD (testnet)", address: addresses.usdt },
]

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
/** What each on-chain state is called in the app. The index is the contract's state number. */
export const RFP_STATE = ["—", "Open", "Awarded", "Withdrawn"] as const
export const OFFER_STATE = ["—", "Open", "Taken", "Withdrawn"] as const
export const ESCROW_STATE = ["—", "Held", "Released", "Handed back", "Returned"] as const

export function short(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : ""
}
export function explorerAddress(a: string) {
  return `${EXPLORER}/address/${a}`
}
export function explorerTx(h: string) {
  return `${EXPLORER}/tx/${h}`
}
