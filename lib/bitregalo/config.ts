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
type NetworkEntry = {
  chain: Chain; rpcUrl: string; explorer: string; practice: boolean; stables: Stable[]; marketApi?: string
  /** An endpoint that answers event queries (eth_getLogs), when the main one refuses them. */
  logsRpcUrl?: string
  /** No contract of the deployment is older than this block: event queries need not look further back. */
  logsFromBlock?: bigint
}
const NETWORKS: Record<number, NetworkEntry> = {
  97: {
    chain: bscTestnet, rpcUrl: "https://data-seed-prebsc-1-s1.bnbchain.org:8545", explorer: "https://testnet.bscscan.com", practice: true,
    stables: [{ symbol: "USDT", name: "Tether USD (testnet)", address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" }],
    marketApi: "https://market-production-671e.up.railway.app",
    // The public endpoint above refuses eth_getLogs. The version 2 contracts were deployed after block 135,000,000.
    logsRpcUrl: "https://bsc-testnet-rpc.publicnode.com",
    logsFromBlock: 135_000_000n,
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
const known = NETWORKS[bundle.chainId] ?? fromEnv(bundle.chainId)
/**
 * The app reads many values in one batch through the network's Multicall3 contract. A local copy
 * of a built-in network (an anvil node with the same chain id, say) has no such contract, and
 * every batched read would come back empty. NEXT_PUBLIC_NO_MULTICALL=1 sends the reads one by one.
 */
const entry: NetworkEntry = process.env.NEXT_PUBLIC_NO_MULTICALL === "1"
  ? { ...known, chain: { ...known.chain, contracts: { ...known.chain.contracts, multicall3: undefined } } as Chain }
  : known

export const chain = entry.chain
/** Overridable at build time so the same app can point at a local fork for testing. */
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || entry.rpcUrl
export const EXPLORER = entry.explorer
/**
 * Where event queries go, and how far back they need to look. Events are the only way to learn
 * which tokens an admin accepted by address. With NEXT_PUBLIC_RPC_URL set (a local node, say), that
 * node answers them from its first block; NEXT_PUBLIC_LOGS_RPC_URL and NEXT_PUBLIC_LOGS_FROM_BLOCK
 * override both.
 */
export const LOGS_RPC_URL = process.env.NEXT_PUBLIC_LOGS_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || entry.logsRpcUrl || entry.rpcUrl
export const LOGS_FROM_BLOCK = process.env.NEXT_PUBLIC_LOGS_FROM_BLOCK
  ? BigInt(process.env.NEXT_PUBLIC_LOGS_FROM_BLOCK)
  : process.env.NEXT_PUBLIC_RPC_URL ? 0n : entry.logsFromBlock ?? 0n
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

type TenantRecord = { instance: string; vault: string; treasury?: string; admin?: string; tokens?: Record<string, string> }
const dep = bundle.deployments as unknown as {
  mother: string; treasury: string; paymaster: string; tokenFactory: string; testStable?: string
  /** The workspace the deploy scripts launched as the public one. Never assume it is number 0. */
  publicTenantId?: number
  tenants?: Record<string, TenantRecord>
  versions: Record<string, { instanceImpl: string; vaultImpl: string; treasuryImpl?: string }>
}

/**
 * The BitRegalo public network: the workspace anyone uses when they are not inside an
 * organisation's own workspace. It is an ordinary workspace run by BitRegalo. Its number is
 * `publicTenantId` in the deployments record (a workspace's number is only known from its
 * launch); NEXT_PUBLIC_PUBLIC_WORKSPACE overrides it per build.
 */
export const PUBLIC_WORKSPACE_ID = BigInt(process.env.NEXT_PUBLIC_PUBLIC_WORKSPACE ?? String(dep.publicTenantId ?? 0))
/** What the deployments record says about the public workspace. Empty when the build points at another one. */
const pub: Partial<TenantRecord> = dep.tenants?.[`t${PUBLIC_WORKSPACE_ID}`] ?? {}

export const addresses = {
  mother: dep.mother as Address,
  /** The platform fee treasury. A workspace's own treasury is read from its workspace contract. */
  treasury: dep.treasury as Address,
  paymaster: dep.paymaster as Address,
  tokenFactory: dep.tokenFactory as Address,
  /** The public workspace's contracts, as recorded at deployment. Pages read them from the mother instead. */
  instance: pub.instance as Address | undefined,
  vault: pub.vault as Address | undefined,
  /** The first token the public workspace accepted at launch: USDT on a public network, the practice token on a local one. */
  usdt: pub.tokens?.["0"] as Address | undefined,
  /** Practice stablecoin with a public faucet; undefined on networks without one. */
  testStable: dep.testStable as Address | undefined,
}

/**
 * The protocol version this app is written for. Every workspace it serves has payments, the
 * shop, redemption and a treasury. (The mother's own version numbers only say in which order
 * implementation sets were registered on one network.)
 */
export const PROTOCOL_VERSION = 2

/** Implementation sets from the deployments file, oldest first. Registration state lives on the mother. */
export const versions = Object.entries(dep.versions)
  .map(([k, v]) => ({ n: Number(k.replace(/^v/, "")), instanceImpl: v.instanceImpl as Address, vaultImpl: v.vaultImpl as Address, treasuryImpl: v.treasuryImpl as Address | undefined }))
  .sort((a, b) => a.n - b.n)

const OWNABLE = ["owner", "pendingOwner", "transferOwnership", "acceptOwnership"]
export const abis = {
  mother: bundle.abis.mother as Abi,
  instance: bundle.abis.instance as Abi,
  vault: bundle.abis.vault as Abi,
  tokenFactory: bundle.abis.tokenFactory as Abi,
  utilityToken: bundle.abis.utilityToken as Abi,
  erc20: bundle.abis.erc20 as Abi,
  workspaceTreasury: bundle.abis.workspaceTreasury as Abi,
  /** The platform fee treasury. */
  treasury: bundle.abis.treasury as Abi,
  testStable: bundle.abis.testStable as Abi,
  /** The gas sponsor. Missing from a bundle made before it was added: the operator page then hides its panel. */
  paymaster: (bundle.abis as { paymaster?: unknown }).paymaster as Abi | undefined,
  /** Two-step ownership, the same on every platform contract (mother, fee treasury, token factory, paymaster). */
  ownable: (bundle.abis.mother as Abi).filter((x) => x.type === "function" && OWNABLE.includes(x.name)),
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
