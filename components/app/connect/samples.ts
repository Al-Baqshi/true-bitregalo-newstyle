/*
 * The code examples on the "Connect a platform" page, as plain text filled in with one
 * workspace's real addresses. TypeScript with viem.
 *
 * This file has no imports on purpose: the same functions render the samples for a
 * type-check outside the app, against viem and the ABIs in lib/bitregalo/bitregalo.json,
 * so what the page shows is what was compiled. Function names and argument order follow
 * the ABI and the app's own calls (components/app/wizard/*, the listing and escrow pages).
 */

export type SampleContext = {
  /** "Workspace 3" or "The BitRegalo network (workspace 0)". */
  label: string
  /** The network the workspace's contracts are on today, from the app's config. */
  chainName: string
  chainId: number
  records: string
  vault: string
  version: number
  rpcUrl: string
  /** The first token the workspace accepts; none means only "record only" works. */
  token?: { symbol: string; address: string; decimals: number }
  /** Where this workspace's record pages live, e.g. "https://example.com/app/t/3". */
  pages: string
}

/** The exports of the TypeScript ABI file, in the order the page lists them. */
export const ABI_FILE = "bitregalo-abis.ts"
export const ABI_EXPORTS = [
  { name: "recordsAbi", key: "instance" },
  { name: "vaultAbi", key: "vault" },
  { name: "workspaceTreasuryAbi", key: "workspaceTreasury" },
  { name: "erc20Abi", key: "erc20" },
  { name: "tokenFactoryAbi", key: "tokenFactory" },
] as const

/** One TypeScript file with every ABI `as const`, so viem checks function names and arguments. */
export function abiModule(abis: Record<string, unknown>): string {
  const head = "// BitRegalo contract ABIs, typed for viem. Generated from the app's deployment file.\n"
  return head + ABI_EXPORTS.map((e) => `\nexport const ${e.name} = ${JSON.stringify(abis[e.key] ?? [], null, 2)} as const\n`).join("")
}

export function setupSample(c: SampleContext): string {
  const token = c.token
    ? `// ${c.token.symbol}, ${c.token.decimals} decimals\nexport const TOKEN: Address = "${c.token.address}"`
    : `// No accepted token yet, so only "record only" works\nexport const TOKEN: Address = zeroAddress`
  return `import {
  createPublicClient, createWalletClient, custom, http,
  hexToBytes, keccak256, stringToHex, toBytes, ${c.token ? "" : "zeroAddress, "}type Address, type Hex,
} from "viem"
import { bscTestnet } from "viem/chains"
import "viem/window"

// ${c.label}, today on ${c.chainName} (chain id ${c.chainId})
// Records contract: requests and listings${c.version >= 1 ? ", payments" : ""}
export const RECORDS: Address = "${c.records}"
// Vault: holds payments in escrow
export const VAULT: Address = "${c.vault}"
${token}

export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http("${c.rpcUrl}"),
})

// Your user's own wallet signs. On a server, use privateKeyToAccount
// from "viem/accounts" as the account and http() as the transport.
export const walletClient = createWalletClient({
  chain: bscTestnet,
  transport: custom(window.ethereum!),
})
export const [account] = await walletClient.requestAddresses()

// Titles and references are 32 bytes on chain: the text itself when it
// fits in 31 bytes, otherwise its keccak256 fingerprint. Same rule as the app.
export function encodeLabel(text: string): Hex {
  const t = text.trim()
  const n = new TextEncoder().encode(t).length
  return n > 0 && n <= 31 ? stringToHex(t, { size: 32 }) : keccak256(toBytes(t))
}

// The other way round: the text, or null when only a fingerprint is stored.
export function readLabel(h: Hex): string | null {
  const bytes = hexToBytes(h)
  const end = bytes.indexOf(0)
  if (end <= 0 || bytes.slice(end).some((b) => b !== 0)) return null
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes.slice(0, end))
  } catch {
    return null
  }
}
`
}

export function readSample(c: SampleContext): string {
  return `import { publicClient, readLabel, RECORDS } from "./bitregalo"
import { recordsAbi } from "./bitregalo-abis"

// How many requests there are. They are numbered from 1.
const count = await publicClient.readContract({
  address: RECORDS, abi: recordsAbi, functionName: "rfpCount",
})

// Read one, here the newest
const request = await publicClient.readContract({
  address: RECORDS, abi: recordsAbi, functionName: "getRfp", args: [count],
})
const title = readLabel(request.scopeHash) // null when the wording is private or long
// request.requester  who posted it
// request.state      1 open, 2 awarded, 3 withdrawn
// request.settlement 0 record only, 1 direct payment, 2 escrow
// request.token      what it is paid in
// request.deadline   when offers close (unix seconds)
// Its page: ${c.pages}/requests/{id}

// Offers on it, also numbered from 1: getBid(requestId, offerId)
const offers = await publicClient.readContract({
  address: RECORDS, abi: recordsAbi, functionName: "bidCount", args: [count],
})

// Listings work the same way: offerCount() and getOffer(id).
// Escrows live in the vault: escrowCount() and getEscrow(id).
`
}

export function postSample(c: SampleContext): string {
  const settle = c.token
    ? `// How the chosen supplier is paid: 0 record only, 1 direct payment, 2 escrow\nconst settlement = 2`
    : `// Record only, as no token is accepted yet (1 direct payment, 2 escrow)\nconst settlement = 0`
  return `import { parseEventLogs } from "viem"
import {
  account, encodeLabel, publicClient, RECORDS, TOKEN, walletClient,
} from "./bitregalo"
import { recordsAbi } from "./bitregalo-abis"

// 24 bytes, so the title is readable on chain
const title = encodeLabel("Scaffolding for 12 weeks")
// Offers close in 7 days (at least 10 minutes from now)
const deadline = BigInt(Math.floor(Date.now() / 1000) + 7 * 86400)
${settle}
const project = 0n // 0 for none

const hash = await walletClient.writeContract({
  account, address: RECORDS, abi: recordsAbi,
  functionName: "postRfp",
  args: [title, deadline, TOKEN, project, settlement],
})
const receipt = await publicClient.waitForTransactionReceipt({ hash })
const [posted] = parseEventLogs({
  abi: recordsAbi, eventName: "RfpPosted", logs: receipt.logs,
})
console.log("${c.pages}/requests/" + posted.args.rfpId)
`
}

export function takeSample(c: SampleContext): string {
  return `import { parseEventLogs } from "viem"
import { account, publicClient, RECORDS, VAULT, walletClient } from "./bitregalo"
import { erc20Abi, recordsAbi } from "./bitregalo-abis"

const listingId = 1n
const listing = await publicClient.readContract({
  address: RECORDS, abi: recordsAbi, functionName: "getOffer", args: [listingId],
})
// listing.state       1 open, 2 taken, 3 withdrawn
// listing.settlement  0 record only, 1 direct payment, 2 escrow
// listing.designatedBuyer, when set, is the only wallet that can take it

if (listing.settlement !== 0) {
  // The buyer pays the price plus the flat service fee for this token
  const [, , serviceFee] = await publicClient.readContract({
    address: RECORDS, abi: recordsAbi, functionName: "tokens", args: [listing.token],
  })
  // 1. Allow the vault to take that much
  const approval = await walletClient.writeContract({
    account, address: listing.token, abi: erc20Abi,
    functionName: "approve", args: [VAULT, listing.amount + serviceFee],
  })
  await publicClient.waitForTransactionReceipt({ hash: approval })
}

// 2. Take the listing. With escrow, the payment is now held by the vault.
const hash = await walletClient.writeContract({
  account, address: RECORDS, abi: recordsAbi,
  functionName: "confirmOffer", args: [listingId],
})
const receipt = await publicClient.waitForTransactionReceipt({ hash })
const [taken] = parseEventLogs({
  abi: recordsAbi, eventName: "OfferConfirmed", logs: receipt.logs,
})
// With escrow, settlementId is the escrow's number
console.log("${c.pages}/escrows/" + taken.args.settlementId)
`
}

export function releaseSample(c: SampleContext): string {
  return `import { account, publicClient, VAULT, walletClient } from "./bitregalo"
import { vaultAbi } from "./bitregalo-abis"

const escrowId = 1n
const escrow = await publicClient.readContract({
  address: VAULT, abi: vaultAbi, functionName: "getEscrow", args: [escrowId],
})
// escrow.issuer is the buyer, escrow.receiver the supplier
// escrow.state 1 held, 2 released, 3 handed back, 4 returned
// escrow.expiresAt is the deadline (unix seconds)

// Only the buyer can release it, and only before the deadline.
// The supplier receives the amount minus the platform fee.
const hash = await walletClient.writeContract({
  account, address: VAULT, abi: vaultAbi,
  functionName: "release", args: [escrowId],
})
await publicClient.waitForTransactionReceipt({ hash })

// The supplier can hand it back instead: cancel(escrowId).
// After the deadline anyone can return it to the buyer: expire(escrowId).
// Its page: ${c.pages}/escrows/{id}
`
}

export function paySample(c: SampleContext): string {
  const dec = c.token?.decimals ?? 18
  const sym = c.token?.symbol ?? "tokens"
  return `import { parseEventLogs, parseUnits, type Address } from "viem"
import {
  account, encodeLabel, publicClient, RECORDS, TOKEN, VAULT, walletClient,
} from "./bitregalo"
import { erc20Abi, recordsAbi } from "./bitregalo-abis"

const payee: Address = "0x…" // the wallet that gets paid
const amount = parseUnits("25", ${dec}) // 25 ${sym}

// The payer adds the flat service fee on top.
// The platform fee comes out of the amount the payee receives.
const [, , serviceFee] = await publicClient.readContract({
  address: RECORDS, abi: recordsAbi, functionName: "tokens", args: [TOKEN],
})
const approval = await walletClient.writeContract({
  account, address: TOKEN, abi: erc20Abi,
  functionName: "approve", args: [VAULT, amount + serviceFee],
})
await publicClient.waitForTransactionReceipt({ hash: approval })

const hash = await walletClient.writeContract({
  account, address: RECORDS, abi: recordsAbi,
  functionName: "pay",
  // payee, token, amount, reference, project (0 for none)
  args: [payee, TOKEN, amount, encodeLabel("Invoice 1042"), 0n],
})
const receipt = await publicClient.waitForTransactionReceipt({ hash })
const [paid] = parseEventLogs({
  abi: recordsAbi, eventName: "Paid", logs: receipt.logs,
})
// The receipt
console.log("${c.pages}/payments/" + paid.args.paymentId)
`
}

/** Reading the marketplace index, filtered to one workspace. */
export function marketSample(api: string, workspaceId: string, chainId: number): string {
  return `curl -G "${api}/v1/entries" \\
  -d chainId=${chainId} -d workspace=${workspaceId} -d kind=request -d country=NZ -d limit=10

# {
#   "entries": [
#     { "chainId": ${chainId}, "workspace": ${workspaceId}, "kind": "request", "recordId": 12,
#       "title": "Scaffolding for 12 weeks", "description": "…", "category": "construction",
#       "country": "NZ", "city": "Auckland", "poster": "0x…", "settlement": 2,
#       "token": "0x…", "amount": "0", "deadline": 1790000000, "state": 1,
#       "createdAt": "2026-10-03T01:23:50Z", "updatedAt": "2026-10-03T01:23:50Z" }
#   ],
#   "next": null
# }`
}
