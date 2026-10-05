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
  rpcUrl: string
  /** The first token the workspace accepts; none means only "record only" works. */
  token?: { symbol: string; address: string; decimals: number }
  /** Where this workspace's record pages live, e.g. "https://example.com/app/t/3". */
  pages: string
  /** True for a protocol version 3 workspace: held payments can carry a delivery code. */
  delivery: boolean
  /** The workspace's number, for delivery links. */
  workspaceId: string
  /** BitRegalo's keeper for this network, or "" when there is none. */
  keeperApi: string
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
// Records contract: requests, listings, payments and the shop
export const RECORDS: Address = "${c.records}"
// Vault: holds payments in escrow. Token approvals go to this address.
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
if (offers > 0n) {
  const offer = await publicClient.readContract({
    address: RECORDS, abi: recordsAbi, functionName: "getBid", args: [count, 1n],
  })
  // offer.provider   the supplier who made it
  // offer.amount     their price, offer.timeframe their delivery time (seconds)
  // offer.validUntil the last moment it can be chosen (unix seconds)
  // offer.withdrawn  true once the supplier took it back
  console.log(offer.amount, offer.validUntil)
}

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
// listing.validUntil  the last moment it can be taken (unix seconds); 0 = until withdrawn

// What the buyer agrees to pay: the price plus the flat service fee for this
// token, as you show it to them. 0 when the listing is record only.
let total = 0n
if (listing.settlement !== 0) {
  const [, , serviceFee] = await publicClient.readContract({
    address: RECORDS, abi: recordsAbi, functionName: "tokens", args: [listing.token],
  })
  total = listing.amount + serviceFee
  // 1. Allow the vault to take exactly that much
  const approval = await walletClient.writeContract({
    account, address: listing.token, abi: erc20Abi,
    functionName: "approve", args: [VAULT, total],
  })
  await publicClient.waitForTransactionReceipt({ hash: approval })
}

// 2. Take the listing. The second argument is the most the buyer can be
// charged: if a fee went up since you read it, the call fails with
// TotalAboveMax and nothing is charged. With escrow, the payment is now
// held by the vault.
const hash = await walletClient.writeContract({
  account, address: RECORDS, abi: recordsAbi,
  functionName: "confirmOffer", args: [listingId, total],
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
// The supplier receives the amount minus the platform fee. The fee stays
// in the vault until anyone calls collectFees(token), which sends it to
// the platform fee treasury.
const hash = await walletClient.writeContract({
  account, address: VAULT, abi: vaultAbi,
  functionName: "release", args: [escrowId],
})
await publicClient.waitForTransactionReceipt({ hash })

// The supplier can hand it back instead: cancel(escrowId).
// After the deadline anyone can return it to the buyer: expire(escrowId).
// If the token refuses a payout, the escrow still settles and the amount is
// credited: claimable(account, token), collected with claim(token).
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
// The total you show the payer. It is what they approve, and the most
// they can be charged.
const total = amount + serviceFee
const approval = await walletClient.writeContract({
  account, address: TOKEN, abi: erc20Abi,
  functionName: "approve", args: [VAULT, total],
})
await publicClient.waitForTransactionReceipt({ hash: approval })

const hash = await walletClient.writeContract({
  account, address: RECORDS, abi: recordsAbi,
  functionName: "pay",
  // payee, token, amount, reference, project (0 for none), most to charge.
  // The payee cannot be one of the protocol's own contracts.
  args: [payee, TOKEN, amount, encodeLabel("Invoice 1042"), 0n, total],
})
const receipt = await publicClient.waitForTransactionReceipt({ hash })
const [paid] = parseEventLogs({
  abi: recordsAbi, eventName: "Paid", logs: receipt.logs,
})
// The receipt
console.log("${c.pages}/payments/" + paid.args.paymentId)
`
}

/** Delivery confirmation (protocol version 3): a held payment that the recipient's code can release. */
export function deliverySample(c: SampleContext): string {
  return `import { keccak256, parseEventLogs, type Hex } from "viem"
import { account, publicClient, RECORDS, VAULT, walletClient } from "./bitregalo"
import { erc20Abi, recordsAbi, vaultAbi } from "./bitregalo-abis"

// 1. The buyer's side. The delivery code is 32 random bytes made on the
//    buyer's own device. It never goes to a server and never into a query
//    string. The held payment stores only its fingerprint: keccak256 over
//    exactly those 32 bytes.
const bytes = new Uint8Array(32)
crypto.getRandomValues(bytes)
const code = ("0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")) as Hex
const fingerprint = keccak256(code)

// Take a listing INTO a held payment, with the fingerprint. Same exact approval
// and maxTotal as without a code; acceptBidWithCode(rfpId, bidId, maxTotal,
// fingerprint) does the same for an offer on a request.
const listingId = 1n
const listing = await publicClient.readContract({
  address: RECORDS, abi: recordsAbi, functionName: "getOffer", args: [listingId],
})
const [, , serviceFee] = await publicClient.readContract({
  address: RECORDS, abi: recordsAbi, functionName: "tokens", args: [listing.token],
})
const total = listing.amount + serviceFee
const approval = await walletClient.writeContract({
  account, address: listing.token, abi: erc20Abi,
  functionName: "approve", args: [VAULT, total],
})
await publicClient.waitForTransactionReceipt({ hash: approval })
const hash = await walletClient.writeContract({
  account, address: RECORDS, abi: recordsAbi,
  functionName: "confirmOfferWithCode", args: [listingId, total, fingerprint],
})
const receipt = await publicClient.waitForTransactionReceipt({ hash })
const [taken] = parseEventLogs({
  abi: recordsAbi, eventName: "OfferConfirmed", logs: receipt.logs,
})
const heldPaymentId = taken.args.settlementId

// Give the code to the person who will receive the goods, as a QR code or a
// link to this app's delivery page (the code sits in the fragment, which the
// browser never sends). Never to the supplier before delivery.
const link = \`${c.pages.replace(/\/app(\/t\/\d+)?$/, "/app")}/deliver#w=${c.workspaceId}&id=\${heldPaymentId}&code=\${code}\`
console.log(link)

// 2. At the handover, anyone may present the code: the supplier who scanned
//    it, the recipient, or a service for someone without a wallet.
${c.keeperApi ? `//    BitRegalo's keeper does it for people who have no wallet:
//    POST ${c.keeperApi}/v1/deliver {"workspace": ${c.workspaceId}, "id": 7, "code": "0x…"}
//    -> {"released": true, "transaction": "0x…"} or {"error": "…", "message": "…"}.
//    From a wallet, it is one call:` : "//    From a wallet, it is one call:"}
await walletClient.writeContract({
  account, address: VAULT, abi: vaultAbi,
  functionName: "releaseWithCode", args: [heldPaymentId, code],
})

// 3. The record. deliveredAt is the time the code was presented, before the
//    deadline; it is the supplier's proof of the handover.
const delivery = await publicClient.readContract({
  address: VAULT, abi: vaultAbi, functionName: "getDelivery", args: [heldPaymentId],
})
console.log(delivery.deliveredAt)

// 4. Only the buyer can give a held payment more time: at least an hour from
//    now, at most the workspace's longest term, and later than today's
//    deadline. It works after the deadline too, until someone returns it.
await walletClient.writeContract({
  account, address: VAULT, abi: vaultAbi,
  functionName: "extendTerm", args: [heldPaymentId, BigInt(Math.floor(Date.now() / 1000) + 3 * 86400)],
})
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
