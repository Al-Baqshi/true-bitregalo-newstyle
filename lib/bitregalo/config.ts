import { bscTestnet } from "wagmi/chains"
import { createConfig, http } from "wagmi"
import { injected } from "wagmi/connectors"
import bundle from "./bitregalo.json"
import { defineChain, type Abi, type Address, type Chain } from "viem"

/**
 * The networks this app knows how to talk to. The protocol is not tied to one network: a
 * network is an entry here plus a deployments bundle generated for it (`bitregalo.json`
 * carries the chain id it was built from). The app serves one network per build today;
 * nothing below this block names a network.
 */
type Stable = { symbol: string; name: string; address: Address }
type NetworkEntry = { chain: Chain; rpcUrl: string; explorer: string; practice: boolean; stables: Stable[]; marketApi?: string }
const NETWORKS: Record<number, NetworkEntry> = {
  97: {
    chain: bscTestnet, rpcUrl: "https://data-seed-prebsc-1-s1.bnbchain.org:8545", explorer: "https://testnet.bscscan.com", practice: true,
    stables: [{ symbol: "USDT", name: "Tether USD (testnet)", address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" }],
    marketApi: "https://market-production-671e.up.railway.app",
  },
}

/**
 * A network with no entry above, such as an organisation's private network, is described at
 * build time: NEXT_PUBLIC_RPC_URL (required), NEXT_PUBLIC_NETWORK_NAME, NEXT_PUBLIC_NATIVE_SYMBOL,
 * NEXT_PUBLIC_EXPLORER_URL (optional: a private network may have no public explorer) and
 * NEXT_PUBLIC_PRACTICE_NETWORK=1 when its tokens have no value.
 */
function fromEnv(id: number): NetworkEntry {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
  if (!rpcUrl) throw new Error(`Chain ${id} is not a built-in network: set NEXT_PUBLIC_RPC_URL (see README.md, "Another network")`)
  const symbol = process.env.NEXT_PUBLIC_NATIVE_SYMBOL || "ETH"
  return {
    chain: defineChain({
      id,
      name: process.env.NEXT_PUBLIC_NETWORK_NAME || `Network ${id}`,
      nativeCurrency: { name: symbol, symbol, decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    }),
    rpcUrl,
    explorer: (process.env.NEXT_PUBLIC_EXPLORER_URL || "").replace(/\/$/, ""),
    practice: process.env.NEXT_PUBLIC_PRACTICE_NETWORK === "1",
    stables: [],
  }
}
const entry = NETWORKS[bundle.chainId] ?? fromEnv(bundle.chainId)

export const chain = entry.chain
/** Overridable at build time so the same app can point at a local fork for testing. */
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || entry.rpcUrl
export const EXPLORER = entry.explorer
/** The marketplace index BitRegalo runs for this network, if any. NEXT_PUBLIC_MARKET_API overrides it. */
export const DEFAULT_MARKET_API = entry.marketApi ?? ""
/** What the rest of the app may say about the network it is running on. */
export const network = {
  id: entry.chain.id,
  name: entry.chain.name,
  /** The coin that pays network fees here, e.g. tBNB. */
  nativeSymbol: entry.chain.nativeCurrency.symbol,
  /** A practice network: tokens have no value. */
  practice: entry.practice,
  /** Empty when the network has no public block explorer. */
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

/**
 * The mother numbers versions in the order they were registered on that network, so the same
 * code can be version 1 on one network and version 0 on a network deployed later. What the app
 * needs to know is what a workspace can do. A version registered with a workspace-treasury
 * implementation has payments, the shop, redemption and the treasury: protocol version 1.
 */
export function protocolVersion(registered: bigint): bigint {
  const v = versions.find((x) => BigInt(x.n) === registered)
  return v?.treasuryImpl && registered < 1n ? 1n : registered
}

/** Implementation sets from the deployments file, oldest first. Registration state lives on the mother. */
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
  ...entry.stables,
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
/** Links to the network's block explorer, or "" when the network has none. */
export function explorerAddress(a: string) {
  return EXPLORER ? `${EXPLORER}/address/${a}` : ""
}
export function explorerTx(h: string) {
  return EXPLORER ? `${EXPLORER}/tx/${h}` : ""
}
