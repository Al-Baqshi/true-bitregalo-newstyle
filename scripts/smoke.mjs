#!/usr/bin/env node
/*
 * Runs the app's main flows against a network running protocol version 2 or 3, with the same call
 * shapes the app uses (function names, argument order, structs, exact approvals, `maxTotal`).
 * It reads the contracts from lib/bitregalo/bitregalo.json, like the app.
 *
 *   node scripts/smoke.mjs [rpc url] [chain id]
 *
 * It WRITES transactions: use it on a local or practice network only. Defaults are a local anvil.
 *   RPC_URL       default http://127.0.0.1:8551 (the first argument wins)
 *   CHAIN_ID      default: the bundle's chain id (the second argument wins)
 *   ADMIN_KEY     the workspace admin and treasury owner   default: anvil account 0
 *   BUYER_KEY     a buyer                                  default: anvil account 1
 *   SUPPLIER_KEY  a supplier                               default: anvil account 2
 *   WORKSPACE     the workspace to use                     default: publicTenantId in the bundle
 *   KEEPER_API    a keeper's base URL: its delivery relay is then tried too (default: none)
 *
 * One line per step. Exits non-zero on the first failure.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { webcrypto } from "node:crypto"
import {
  BaseError, bytesToHex, ContractFunctionRevertedError, createPublicClient, createWalletClient, decodeErrorResult, defineChain,
  formatUnits, http, keccak256, parseEventLogs, parseUnits, stringToHex, zeroAddress,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"

const bundle = JSON.parse(readFileSync(path.join(import.meta.dirname, "..", "lib/bitregalo/bitregalo.json"), "utf8"))
const { abis, deployments: dep } = bundle
const rpcUrl = process.argv[2] || process.env.RPC_URL || "http://127.0.0.1:8551"
const chainId = Number(process.argv[3] || process.env.CHAIN_ID || bundle.chainId)
const chain = defineChain({ id: chainId, name: `chain ${chainId}`, nativeCurrency: { name: "native", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [rpcUrl] } } })

// Anvil's well-known test keys. They hold nothing of value anywhere.
const KEYS = {
  admin: process.env.ADMIN_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  buyer: process.env.BUYER_KEY || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  supplier: process.env.SUPPLIER_KEY || "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
}
// Receipts are polled often, so a node that mines every second is not waited on for four.
const pub = createPublicClient({ chain, transport: http(rpcUrl), pollingInterval: 250 })
const who = Object.fromEntries(Object.entries(KEYS).map(([name, key]) => {
  const account = privateKeyToAccount(key)
  return [name, { name, account, address: account.address, wallet: createWalletClient({ account, chain, transport: http(rpcUrl) }) }]
}))
const { admin, buyer, supplier } = who

/** Every custom error of every contract, so a refusal further down a call can still be named. */
const ALL_ERRORS = Object.values(abis).flat().filter((x) => x.type === "error")
function revertName(e) {
  if (!(e instanceof BaseError)) return null
  const r = e.walk((x) => x instanceof ContractFunctionRevertedError)
  if (!r) return null
  if (r.data?.errorName) return r.data.errorName
  try { return decodeErrorResult({ abi: ALL_ERRORS, data: r.raw }).errorName } catch { return r.reason ?? r.signature ?? "unknown revert" }
}
const why = (e) => revertName(e) ?? e.shortMessage ?? e.message

let step = 0
const ok = (text) => console.log(`ok   ${String(++step).padStart(2)}. ${text}`)
class Failure extends Error {}
function fail(text) {
  throw new Failure(text)
}
const expect = (cond, text) => { if (!cond) fail(text) }

const read = (address, abi, functionName, args = []) => pub.readContract({ address, abi, functionName, args })
/** Dry run, then send, then wait: what the app's useTx does. */
async function send(from, label, call) {
  try {
    await pub.simulateContract({ ...call, account: from.account })
    const hash = await from.wallet.writeContract(call)
    const receipt = await pub.waitForTransactionReceipt({ hash })
    if (receipt.status !== "success") throw new Error("the transaction reverted")
    return receipt
  } catch (e) {
    fail(`${label}: ${why(e)}`)
  }
}
/** The call must be refused by the contract with this error. Nothing is sent. */
async function refused(from, label, call, errorName) {
  try {
    await pub.simulateContract({ ...call, account: from.account })
  } catch (e) {
    const got = revertName(e)
    if (got === errorName) return
    fail(`${label}: expected ${errorName}, the contract said ${got ?? e.shortMessage ?? e.message}`)
  }
  fail(`${label}: expected ${errorName}, but the call would go through`)
}
const event = (receipt, abi, eventName) => {
  const [log] = parseEventLogs({ abi, eventName, logs: receipt.logs })
  if (!log) fail(`${eventName} is not in the transaction`)
  return log.args
}
/** Same rule as the app's encodeLabel for a short label. */
const label32 = (text) => stringToHex(text, { size: 32 })
const erc20 = (token) => ({ address: token, abi: abis.erc20 })
const balance = (token, account) => read(token, abis.erc20, "balanceOf", [account])
/** The app approves exactly what a transaction needs, never an unlimited amount. */
const approveExact = (from, token, spender, amount, label) => send(from, label, { ...erc20(token), functionName: "approve", args: [spender, amount] })

/** Set while the admin role is with the buyer, so a failure in between still hands it back. */
let giveAdminBack = null
/** Set while the practice token's service fee is raised for the test, so a failure still puts it back. */
let putFeeBack = null

try {
// ── Where everything is ───────────────────────────────────────────────────────
const got = await pub.getChainId().catch((e) => fail(`cannot reach ${rpcUrl}: ${e.shortMessage ?? e.message}`))
expect(got === chainId, `the node at ${rpcUrl} is chain ${got}, expected ${chainId}`)
const workspace = BigInt(process.env.WORKSPACE ?? dep.publicTenantId ?? 0)
const factory = { address: dep.tokenFactory, abi: abis.tokenFactory }
const t = await read(dep.mother, abis.mother, "tenants", [workspace])
expect(t.instance !== zeroAddress, `there is no workspace #${workspace} on this network`)
const instance = { address: t.instance, abi: abis.instance }
const vault = { address: t.vault, abi: abis.vault }
const treasuryAddress = await read(t.instance, abis.instance, "treasury")
const treasury = { address: treasuryAddress, abi: abis.workspaceTreasury }
const stable = dep.testStable
expect(!!stable, "this network has no practice token (testStable) in its deployment record")
const [adminNow, treasuryOwner, protocol, direct, escrowOn, minTerm, feeBps, stableCfg, platformTreasury] = await Promise.all([
  read(t.instance, abis.instance, "admin"), read(treasuryAddress, abis.workspaceTreasury, "owner"),
  read(t.instance, abis.instance, "PROTOCOL_VERSION"), read(t.instance, abis.instance, "directEnabled"), read(t.instance, abis.instance, "escrowEnabled"),
  read(t.instance, abis.instance, "minTerm"), read(t.instance, abis.instance, "feeBps"), read(t.instance, abis.instance, "tokens", [stable]), read(dep.mother, abis.mother, "treasury"),
])
expect([2, 3].includes(Number(protocol)), `workspace #${workspace} runs protocol version ${protocol}, not 2 or 3`)
expect(adminNow.toLowerCase() === admin.address.toLowerCase(), `ADMIN_KEY is ${admin.address}, but the workspace admin is ${adminNow}`)
expect(treasuryOwner.toLowerCase() === admin.address.toLowerCase(), `ADMIN_KEY is not the treasury's owner (${treasuryOwner})`)
expect(direct && escrowOn, "the workspace needs both direct payment and escrow switched on")
expect(stableCfg[0], "the workspace does not accept the practice token")
const serviceFee = stableCfg[2]
const now = async () => Math.max(Math.floor(Date.now() / 1000), Number((await pub.getBlock()).timestamp))
const usd = (v) => `${formatUnits(v, 18)} tUSD`
console.log(`workspace #${workspace} on chain ${chainId} · admin ${admin.address} · buyer ${buyer.address} · supplier ${supplier.address}`)
console.log(`platform fee ${Number(feeBps) / 100}% · service fee ${usd(serviceFee)} per payment`)

// Practice tokens (once a day from the faucet): the buyer pays, the admin and the supplier pay the
// token creation fee and the launch fee when the platform charges them.
const NEED = parseUnits("200", 18)
for (const person of [buyer, admin, supplier]) {
  if ((await balance(stable, person.address)) >= NEED) continue
  const next = Number(await read(stable, abis.testStable, "nextClaimAt", [person.address]))
  expect(next <= (await now()), `the ${person.name} holds under ${usd(NEED)} and the faucet is on its daily pause until ${new Date(next * 1000).toISOString()}`)
  await send(person, "faucet", { address: stable, abi: abis.testStable, functionName: "faucet", args: [] })
}

// ── 1. Create a workspace token as the admin, with the fee limits ─────────────────
const [creationFee, creationFeeToken] = await Promise.all([read(dep.tokenFactory, abis.tokenFactory, "creationFeeAmount"), read(dep.tokenFactory, abis.tokenFactory, "creationFeeToken")])
const symbol = `SMK${Date.now().toString(36).slice(-4).toUpperCase()}`
const tokenParams = { name: `Smoke credit ${symbol}`, symbol, decimals: 18, cap: parseUnits("10000000", 18), initialSupply: parseUnits("1000000", 18), tenantId: workspace, projectId: 0n }
await refused(buyer, "a non-admin creating a workspace token", { ...factory, functionName: "createToken", args: [tokenParams, creationFeeToken, creationFee] }, "NotAuthorised")
if (creationFee > 0n) await approveExact(admin, creationFeeToken, dep.tokenFactory, creationFee, "approve the creation fee")
const created = await send(admin, "createToken", { ...factory, functionName: "createToken", args: [tokenParams, creationFeeToken, creationFee] })
const token = event(created, abis.tokenFactory, "TokenCreated").token
const utility = { address: token, abi: abis.utilityToken }
expect((await read(token, abis.utilityToken, "owner")).toLowerCase() === admin.address.toLowerCase(), "the creator does not own the token")
expect((await balance(token, admin.address)) === tokenParams.initialSupply, "the creator did not receive the initial supply")
const listed = await read(dep.tokenFactory, abis.tokenFactory, "workspaceTokens", [workspace, 0n, 100n])
const listedCount = await read(dep.tokenFactory, abis.tokenFactory, "workspaceTokenCount", [workspace])
expect(listedCount > 100n || listed.map((a) => a.toLowerCase()).includes(token.toLowerCase()), "the token is not in workspaceTokens")
ok(`create a workspace token as admin, limits (${creationFeeToken === zeroAddress ? "no fee token" : creationFeeToken}, ${creationFee}): ${symbol} at ${token}; a non-admin is refused (NotAuthorised)`)

// ── 2. Accept it for payments ──────────────────────────────────────────────────────
await send(admin, "setToken", { ...instance, functionName: "setToken", args: [token, true, 0n] })
const cfg = await read(t.instance, abis.instance, "tokens", [token])
expect(cfg[0] === true && Number(cfg[1]) === 18, "the token is not accepted, or its decimals were not read as 18")
ok(`accept ${symbol} for payments: setToken(token, true, serviceFee); decimals read by the contract: ${cfg[1]}`)

// ── 3. Open a sale ──────────────────────────────────────────────────────────────
const quantity = parseUnits("500", 18)
const price = parseUnits("2", 18) // 2 tUSD per token
await send(admin, "move stock into the treasury", { ...utility, functionName: "transfer", args: [treasuryAddress, quantity] })
const sale = await send(admin, "createSale", {
  ...instance, functionName: "createSale",
  args: [{ token, payToken: stable, price, quantity, maxPerBuyer: 0n, start: 0n, end: 0n, projectId: 0n, metaHash: label32("Smoke test sale") }],
})
const saleId = event(sale, abis.instance, "SaleCreated").saleId
const buyQty = parseUnits("10", 18)
const unit = (await read(t.instance, abis.instance, "getSale", [saleId])).unit
// The contract rounds the cost up; the app shows and passes the same sum.
const cost = (price * buyQty + unit - 1n) / unit
const buyTotal = cost + serviceFee
await approveExact(buyer, stable, t.vault, buyTotal, "approve the purchase total")
await refused(buyer, "buying before the treasury owner's approval", { ...instance, functionName: "buy", args: [saleId, buyQty, buyTotal] }, "SaleNotApproved")
expect((await read(t.instance, abis.instance, "redeemable", [token])) === false, "opening a sale made the token redeemable")
ok(`open sale #${saleId}: ${formatUnits(quantity, 18)} ${symbol} at ${usd(price)}; nothing can be bought yet (SaleNotApproved); the token is not redeemable`)

// ── 4. Read the terms hash ────────────────────────────────────────────────────────
const termsHash = await read(treasuryAddress, abis.workspaceTreasury, "saleTermsHash", [saleId])
expect(/^0x[0-9a-f]{64}$/.test(termsHash) && !/^0x0+$/.test(termsHash), "saleTermsHash did not return a fingerprint")
ok(`read the sale's terms hash from the treasury: ${termsHash}`)

// ── 5. The treasury's owner approves the sale ────────────────────────────────────────
await send(admin, "approveSale", { ...treasury, functionName: "approveSale", args: [saleId, quantity, termsHash] })
expect((await read(treasuryAddress, abis.workspaceTreasury, "saleAllowance", [saleId])) === quantity, "saleAllowance is not the approved amount")
ok(`approve the sale as the treasury's owner: approveSale(saleId, amount, termsHash); saleAllowance = ${formatUnits(quantity, 18)}`)

// ── 6. Buy as another account, exact approval, maxTotal ─────────────────────────────
if (buyTotal > 0n) await refused(buyer, "buying with a lower maxTotal", { ...instance, functionName: "buy", args: [saleId, buyQty, buyTotal - 1n] }, "TotalAboveMax")
const stableBefore = await balance(stable, buyer.address)
await send(buyer, "buy", { ...instance, functionName: "buy", args: [saleId, buyQty, buyTotal] })
expect((await balance(token, buyer.address)) === buyQty, "the buyer did not receive the tokens")
expect(stableBefore - (await balance(stable, buyer.address)) === buyTotal, "the buyer was not charged exactly the total shown")
expect((await read(stable, abis.erc20, "allowance", [buyer.address, t.vault])) === 0n, "the exact approval was not used up")
expect((await read(treasuryAddress, abis.workspaceTreasury, "saleAllowance", [saleId])) === quantity - buyQty, "the purchase did not spend the sale's approval")
ok(`buy ${formatUnits(buyQty, 18)} ${symbol} as the buyer: approve exactly ${usd(buyTotal)} (cost ${usd(cost)} + service fee ${usd(serviceFee)}), buy(saleId, quantity, maxTotal); a lower maxTotal is refused (TotalAboveMax)`)

// ── 7. Switch redemption on, and redeem ─────────────────────────────────────────────
const redeemQty = parseUnits("3", 18)
await refused(buyer, "redeeming before it is switched on", { ...instance, functionName: "redeem", args: [token, redeemQty, label32("Order 1042")] }, "NotRedeemable")
await refused(admin, "making the practice token redeemable", { ...instance, functionName: "setRedeemable", args: [stable, true] }, "NotRedeemable")
await send(admin, "setRedeemable", { ...instance, functionName: "setRedeemable", args: [token, true] })
await approveExact(buyer, token, t.vault, redeemQty, "approve the redemption")
const heldBefore = await balance(token, treasuryAddress)
await send(buyer, "redeem", { ...instance, functionName: "redeem", args: [token, redeemQty, label32("Order 1042")] })
expect((await balance(token, treasuryAddress)) - heldBefore === redeemQty, "the redeemed tokens did not reach the treasury")
ok(`switch redemption on (setRedeemable, a separate admin action) and redeem ${formatUnits(redeemQty, 18)} ${symbol} with an exact approval; a payment token cannot be made redeemable`)

// ── 8. Post a request ─────────────────────────────────────────────────────────────
const deadline = BigInt((await now()) + 7 * 86400)
const posted = await send(buyer, "postRfp", { ...instance, functionName: "postRfp", args: [label32("Smoke test request"), deadline, stable, 0n, 2] })
const rfpId = event(posted, abis.instance, "RfpPosted").rfpId
ok(`post request #${rfpId}, to be paid by escrow in tUSD`)

// ── 9. Place an offer with validUntil ───────────────────────────────────────────────
const bidAmount = parseUnits("50", 18)
const timeframe = BigInt(Math.max(Number(minTerm), 86400))
const validUntil = BigInt((await now()) + 14 * 86400)
await refused(supplier, "an offer that is already past its valid-until time", { ...instance, functionName: "bid", args: [rfpId, bidAmount, timeframe, BigInt((await now()) - 60)] }, "InvalidValidity")
const bidTx = await send(supplier, "bid", { ...instance, functionName: "bid", args: [rfpId, bidAmount, timeframe, validUntil] })
const bidId = event(bidTx, abis.instance, "BidPlaced").bidId
const bid = await read(t.instance, abis.instance, "getBid", [rfpId, bidId])
expect(bid.validUntil === validUntil && bid.amount === bidAmount && bid.provider.toLowerCase() === supplier.address.toLowerCase(), "getBid does not return the offer as placed")
ok(`place offer #${bidId} as the supplier: bid(rfpId, amount, timeframe, validUntil); getBid returns validUntil ${validUntil}`)

// ── 10. Award it into a held payment, exact approval, maxTotal ───────────────────────
const awardTotal = bidAmount + serviceFee
await approveExact(buyer, stable, t.vault, awardTotal, "approve the award total")
if (awardTotal > 0n) await refused(buyer, "awarding with a lower maxTotal", { ...instance, functionName: "acceptBid", args: [rfpId, bidId, awardTotal - 1n] }, "TotalAboveMax")
const feesBefore = await read(t.vault, abis.vault, "accruedFees", [stable])
const awarded = await send(buyer, "acceptBid", { ...instance, functionName: "acceptBid", args: [rfpId, bidId, awardTotal] })
const escrowId = event(awarded, abis.instance, "RfpAwarded").settlementId
const escrow = await read(t.vault, abis.vault, "getEscrow", [escrowId])
expect(escrow.state === 1 && escrow.amount === bidAmount && escrow.issuer.toLowerCase() === buyer.address.toLowerCase() && escrow.receiver.toLowerCase() === supplier.address.toLowerCase(), "the held payment is not as awarded")
ok(`award the offer into held payment #${escrowId}: approve exactly ${usd(awardTotal)}, acceptBid(rfpId, bidId, maxTotal); ${usd(bidAmount)} is held`)

// ── 11. Release it ──────────────────────────────────────────────────────────────────
const supplierBefore = await balance(stable, supplier.address)
const treasuryBefore = await balance(stable, platformTreasury)
await send(buyer, "release", { ...vault, functionName: "release", args: [escrowId] })
const platformFee = (bidAmount * BigInt(feeBps)) / 10_000n
expect((await balance(stable, supplier.address)) - supplierBefore === bidAmount - platformFee, "the supplier did not receive the amount less the platform fee")
expect((await balance(stable, platformTreasury)) === treasuryBefore, "the release paid the fee straight to the platform fee treasury; it should only accrue")
expect((await read(t.vault, abis.vault, "getEscrow", [escrowId])).state === 2, "the held payment is not released")
ok(`release it as the buyer: the supplier receives ${usd(bidAmount - platformFee)}; the fee stays in the vault`)

// ── 12. accruedFees, then collectFees by anyone ──────────────────────────────────────
const accrued = await read(t.vault, abis.vault, "accruedFees", [stable])
expect(accrued - feesBefore === serviceFee + platformFee, `accruedFees grew by ${accrued - feesBefore}, expected the service fee plus the platform fee (${serviceFee + platformFee})`)
await send(supplier, "collectFees", { ...vault, functionName: "collectFees", args: [stable] })
expect((await balance(stable, platformTreasury)) - treasuryBefore === accrued, "collectFees did not send the accrued fees to the platform fee treasury")
expect((await read(t.vault, abis.vault, "accruedFees", [stable])) === 0n, "accruedFees is not zero after collecting")
ok(`read accruedFees (${usd(accrued)}) and send them on with collectFees, called by the supplier (anyone may): they reach the platform fee treasury`)

// ── 13. A direct payment ────────────────────────────────────────────────────────────
const payAmount = parseUnits("25", 18)
const staleTotal = payAmount + serviceFee
await refused(buyer, "paying the vault", { ...instance, functionName: "pay", args: [t.vault, stable, payAmount, label32("Invoice 1042"), 0n, staleTotal] }, "InvalidPayee")
// The admin raises the service fee after the payer saw the total: the payment at the old total is
// refused and nothing is charged. This is the case the app answers with "The fee changed after you
// opened this page". The fee is put back afterwards.
const raisedFee = serviceFee + parseUnits("0.1", 18)
await approveExact(buyer, stable, t.vault, staleTotal, "approve the old total")
putFeeBack = () => admin.wallet.writeContract({ ...instance, functionName: "setToken", args: [stable, true, serviceFee] }).then((hash) => pub.waitForTransactionReceipt({ hash }))
await send(admin, "raise the service fee", { ...instance, functionName: "setToken", args: [stable, true, raisedFee] })
await refused(buyer, "paying at the old total after the fee went up", { ...instance, functionName: "pay", args: [supplier.address, stable, payAmount, label32("Invoice 1042"), 0n, staleTotal] }, "TotalAboveMax")
const payTotal = payAmount + raisedFee
await approveExact(buyer, stable, t.vault, payTotal, "approve the payment total")
const buyerBefore = await balance(stable, buyer.address)
const payeeBefore = await balance(stable, supplier.address)
const paid = await send(buyer, "pay", { ...instance, functionName: "pay", args: [supplier.address, stable, payAmount, label32("Invoice 1042"), 0n, payTotal] })
const paymentId = event(paid, abis.instance, "Paid").paymentId
const payment = await read(t.instance, abis.instance, "getPayment", [paymentId])
expect(payment.amount === payAmount && payment.payee.toLowerCase() === supplier.address.toLowerCase(), "getPayment does not return the payment as made")
expect(buyerBefore - (await balance(stable, buyer.address)) === payTotal, "the payer was not charged exactly the amount plus the service fee")
expect((await balance(stable, supplier.address)) - payeeBefore === payAmount - (payAmount * BigInt(feeBps)) / 10_000n, "the payee did not receive the amount less the platform fee")
await send(admin, "put the service fee back", { ...instance, functionName: "setToken", args: [stable, true, serviceFee] })
putFeeBack = null
expect((await read(t.instance, abis.instance, "tokens", [stable]))[2] === serviceFee, "the service fee was not put back")
ok(`make direct payment #${paymentId}: approve exactly ${usd(payTotal)} (amount ${usd(payAmount)} + service fee ${usd(raisedFee)}), pay(payee, token, amount, ref, projectId, maxTotal); after a fee rise the old total is refused (TotalAboveMax); a protocol contract as payee is refused (InvalidPayee)`)

// ── 14. List an offer with the struct, and confirm it ────────────────────────────────
const listAmount = parseUnits("40", 18)
const listValidUntil = BigInt((await now()) + 14 * 86400)
const listedTx = await send(supplier, "listOffer", {
  ...instance, functionName: "listOffer",
  args: [{ token: stable, amount: listAmount, timeframe, validUntil: listValidUntil, projectId: 0n, settlement: 1, designatedBuyer: zeroAddress }],
})
const offerId = event(listedTx, abis.instance, "OfferListed").offerId
const offer = await read(t.instance, abis.instance, "getOffer", [offerId])
expect(offer.validUntil === listValidUntil && offer.amount === listAmount && offer.state === 1, "getOffer does not return the listing as made")
const takeTotal = listAmount + serviceFee
await approveExact(buyer, stable, t.vault, takeTotal, "approve the listing total")
await send(buyer, "confirmOffer", { ...instance, functionName: "confirmOffer", args: [offerId, takeTotal] })
expect((await read(t.instance, abis.instance, "getOffer", [offerId])).state === 2, "the listing is not taken")
ok(`list offer #${offerId} with one struct {token, amount, timeframe, validUntil, projectId, settlement, designatedBuyer} and take it: approve exactly ${usd(takeTotal)}, confirmOffer(offerId, maxTotal)`)

// ── 15. Two-step admin handover, and back ────────────────────────────────────────────
await send(admin, "transferAdmin", { ...instance, functionName: "transferAdmin", args: [buyer.address] })
expect((await read(t.instance, abis.instance, "pendingAdmin")).toLowerCase() === buyer.address.toLowerCase(), "pendingAdmin is not the wallet the role was offered to")
expect((await read(t.instance, abis.instance, "admin")).toLowerCase() === admin.address.toLowerCase(), "the admin changed before the offer was accepted")
await refused(supplier, "a third wallet accepting the admin role", { ...instance, functionName: "acceptAdmin", args: [] }, "NotPendingAdmin")
await send(buyer, "acceptAdmin", { ...instance, functionName: "acceptAdmin", args: [] })
giveAdminBack = async () => {
  await buyer.wallet.writeContract({ ...instance, functionName: "transferAdmin", args: [admin.address] }).then((hash) => pub.waitForTransactionReceipt({ hash }))
  await admin.wallet.writeContract({ ...instance, functionName: "acceptAdmin", args: [] }).then((hash) => pub.waitForTransactionReceipt({ hash }))
}
expect((await read(dep.mother, abis.mother, "adminOf", [workspace])).toLowerCase() === buyer.address.toLowerCase(), "mother.adminOf does not show the new admin")
await send(buyer, "transferAdmin back", { ...instance, functionName: "transferAdmin", args: [admin.address] })
await send(admin, "acceptAdmin back", { ...instance, functionName: "acceptAdmin", args: [] })
giveAdminBack = null
expect((await read(t.instance, abis.instance, "admin")).toLowerCase() === admin.address.toLowerCase(), "the admin role did not come back")
expect((await read(t.instance, abis.instance, "pendingAdmin")) === zeroAddress, "a pending admin is left over")
ok(`hand the admin role over in two steps (transferAdmin, then acceptAdmin by the new admin) and back; the admin is ${admin.address} again`)

// ── 16. Hand a token to the treasury and back, each in two steps ─────────────────────
await send(admin, "offer the token to the treasury", { ...utility, functionName: "transferOwnership", args: [treasuryAddress] })
expect((await read(token, abis.utilityToken, "pendingOwner")).toLowerCase() === treasuryAddress.toLowerCase(), "the token's pendingOwner is not the treasury")
expect((await read(token, abis.utilityToken, "owner")).toLowerCase() === admin.address.toLowerCase(), "the token changed owner before the treasury accepted")
await send(admin, "acceptToken", { ...treasury, functionName: "acceptToken", args: [token] })
expect((await read(token, abis.utilityToken, "owner")).toLowerCase() === treasuryAddress.toLowerCase(), "the treasury does not own the token after acceptToken")
await send(admin, "releaseToken", { ...treasury, functionName: "releaseToken", args: [token, admin.address] })
await send(admin, "acceptOwnership", { ...utility, functionName: "acceptOwnership", args: [] })
expect((await read(token, abis.utilityToken, "owner")).toLowerCase() === admin.address.toLowerCase(), "the token did not come back to its owner")
ok(`give the treasury the right to create ${symbol} (transferOwnership by the owner, acceptToken by the treasury's owner) and take it back (releaseToken, acceptOwnership)`)

// ── 17. Launch a workspace with the limits read from the mother ──────────────────────
const [deployFee, deployFeeToken, defaultFeeBps, versionCount, countBefore] = await Promise.all([
  read(dep.mother, abis.mother, "deployFeeAmount"), read(dep.mother, abis.mother, "deployFeeToken"), read(dep.mother, abis.mother, "defaultFeeBps"),
  read(dep.mother, abis.mother, "versionCount"), read(dep.mother, abis.mother, "tenantCount"),
])
const launchParams = {
  admin: supplier.address, version: versionCount - 1n, tokens: [stable], serviceFees: [parseUnits("0.1", 18)],
  minTerm: 86400n, maxTerm: 180n * 86400n, kycRequired: false, attester: zeroAddress, directEnabled: true, escrowEnabled: true,
}
const limits = { feeToken: deployFeeToken, maxDeployFee: deployFee, maxFeeBps: Number(defaultFeeBps) }
if (deployFee > 0n) {
  await refused(supplier, "launching with a lower launch fee than the mother's", { address: dep.mother, abi: abis.mother, functionName: "launchTenant", args: [launchParams, { ...limits, maxDeployFee: deployFee - 1n }] }, "FeeAboveMax")
  await approveExact(supplier, deployFeeToken, dep.mother, deployFee, "approve the launch fee")
}
if (Number(defaultFeeBps) > 0) {
  await refused(supplier, "launching with a lower platform percentage than the mother's", { address: dep.mother, abi: abis.mother, functionName: "launchTenant", args: [launchParams, { ...limits, maxFeeBps: Number(defaultFeeBps) - 1 }] }, "FeeBpsAboveMax")
}
const launched = await send(supplier, "launchTenant", { address: dep.mother, abi: abis.mother, functionName: "launchTenant", args: [launchParams, limits] })
const born = event(launched, abis.mother, "TenantLaunched")
const bornRecord = await read(dep.mother, abis.mother, "tenants", [born.tenantId])
expect(born.tenantId === countBefore, "the new workspace's number is not the one in the event")
expect(bornRecord.instance.toLowerCase() === born.instance.toLowerCase() && bornRecord.vault.toLowerCase() === born.vault.toLowerCase(), "mother.tenants(id) does not match the launch event")
expect((await read(born.instance, abis.instance, "admin")).toLowerCase() === supplier.address.toLowerCase(), "the new workspace's admin is not the launcher")
expect(Number(await read(born.instance, abis.instance, "feeBps")) === Number(defaultFeeBps), "the platform percentage fixed into the workspace is not the one agreed")
ok(`launch workspace #${born.tenantId} with limits {feeToken, maxDeployFee: ${deployFee}, maxFeeBps: ${defaultFeeBps}}${deployFee > 0n ? " and an exact approval of the launch fee" : ""}; its number is read from TenantLaunched; a lower maxFeeBps is refused (FeeBpsAboveMax)`)

// ── 18. Withdraw an offer ─────────────────────────────────────────────────────────────
const rfp2 = event(await send(buyer, "postRfp", { ...instance, functionName: "postRfp", args: [label32("Smoke test request 2"), BigInt((await now()) + 7 * 86400), stable, 0n, 2] }), abis.instance, "RfpPosted").rfpId
const bid2 = event(await send(supplier, "bid", { ...instance, functionName: "bid", args: [rfp2, bidAmount, timeframe, BigInt((await now()) + 86400)] }), abis.instance, "BidPlaced").bidId
await refused(buyer, "someone else withdrawing the offer", { ...instance, functionName: "withdrawBid", args: [rfp2, bid2] }, "NotProvider")
await send(supplier, "withdrawBid", { ...instance, functionName: "withdrawBid", args: [rfp2, bid2] })
expect((await read(t.instance, abis.instance, "getBid", [rfp2, bid2])).withdrawn === true, "the offer is not marked withdrawn")
await refused(buyer, "awarding a withdrawn offer", { ...instance, functionName: "acceptBid", args: [rfp2, bid2, bidAmount + serviceFee] }, "BadState")
ok(`withdraw offer #${bid2} on request #${rfp2} as the supplier who placed it: withdrawBid(rfpId, bidId); nobody else can, and it can no longer be awarded`)

// ── 19–21. Identity checks, in the workspace launched above (the supplier is its admin) ──
// The attester is an ordinary key: here the buyer's. The voucher is built and signed as the app does it:
// EIP-712, domain {name "BitRegaloInstance", version "2", this chain, the workspace contract},
// attesterEpoch read from the contract, issuedAt = the latest block's time.
const ws2 = { address: born.instance, abi: abis.instance }
const attester = buyer
const subject = supplier
const KYC_TYPES = {
  KycVoucher: [
    { name: "subject", type: "address" }, { name: "tenantId", type: "uint256" }, { name: "attesterEpoch", type: "uint32" },
    { name: "issuedAt", type: "uint64" }, { name: "expiry", type: "uint64" }, { name: "ref", type: "bytes32" },
  ],
}
const kycDomain = { name: "BitRegaloInstance", version: "2", chainId, verifyingContract: born.instance }
async function signVoucher(signer, expiresIn) {
  const [epoch, block] = await Promise.all([read(born.instance, abis.instance, "attesterEpoch"), pub.getBlock()])
  const voucher = { subject: subject.address, tenantId: born.tenantId, attesterEpoch: Number(epoch), issuedAt: block.timestamp, expiry: block.timestamp + BigInt(expiresIn), ref: label32("Case 2026-0142") }
  const signature = await signer.wallet.signTypedData({ domain: kycDomain, types: KYC_TYPES, primaryType: "KycVoucher", message: voucher })
  return { voucher, signature }
}
const gated = { ...ws2, functionName: "createProject", args: [label32("Gated project")] }

await send(subject, "createProject before the checks", gated)
await send(subject, "setKyc", { ...ws2, functionName: "setKyc", args: [true, attester.address] })
expect((await read(born.instance, abis.instance, "kycRequired")) === true && (await read(born.instance, abis.instance, "attester")).toLowerCase() === attester.address.toLowerCase(), "identity checks are not on with the attester that was set")
expect((await read(born.instance, abis.instance, "isKycValid", [subject.address])) === false, "a wallet with no approval counts as approved")
await refused(subject, "a gated action without an approval", gated, "KycRequired")
ok(`switch identity checks on in workspace #${born.tenantId}: setKyc(true, attester); a wallet without an approval is refused (KycRequired)`)

const forged = await signVoucher(supplier, 30 * 86400)
await refused(admin, "an approval signed by someone who is not the attester", { ...ws2, functionName: "submitKycVoucher", args: [forged.voucher, forged.signature] }, "InvalidVoucher")
const approval = await signVoucher(attester, 30 * 86400)
await send(admin, "submitKycVoucher", { ...ws2, functionName: "submitKycVoucher", args: [approval.voucher, approval.signature] })
const status = await read(born.instance, abis.instance, "kycOf", [subject.address])
expect(status.validUntil === approval.voucher.expiry && status.issuedAt === approval.voucher.issuedAt, "kycOf does not return the approval as signed")
expect((await read(born.instance, abis.instance, "isKycValid", [subject.address])) === true, "the approved wallet does not count as approved")
await send(subject, "a gated action with an approval", gated)
ok(`the attester signs a voucher (EIP-712, issuedAt = block time ${approval.voucher.issuedAt}), a third wallet submits it with submitKycVoucher, and the gated action succeeds; a voucher signed by another key is refused (InvalidVoucher)`)

await refused(supplier, "someone who is neither attester nor admin ending an approval", { address: t.instance, abi: abis.instance, functionName: "revokeKyc", args: [subject.address] }, "NotAttesterOrAdmin")
await send(attester, "revokeKyc", { ...ws2, functionName: "revokeKyc", args: [subject.address] })
expect((await read(born.instance, abis.instance, "isKycValid", [subject.address])) === false, "the approval still counts after it was ended")
await refused(subject, "a gated action after the approval was ended", gated, "KycRequired")
const tooSoon = await signVoucher(attester, 30 * 86400)
await refused(admin, "a new approval within ten minutes of ending one", { ...ws2, functionName: "submitKycVoucher", args: [tooSoon.voucher, tooSoon.signature] }, "VoucherSuperseded")
ok("the attester ends the approval with revokeKyc: the gated action is refused again (KycRequired), and a new approval is refused for ten minutes (VoucherSuperseded)")

// ── 22–25. Delivery confirmation (protocol version 3) ─────────────────────────────────────
if (Number(protocol) >= 3) {
  // The code is 32 random bytes; the fingerprint is keccak256 over exactly those bytes. Same as the app.
  const newCode = () => { const b = new Uint8Array(32); webcrypto.getRandomValues(b); return bytesToHex(b) }
  const fingerprint = (code) => keccak256(code)
  const openRequest = async () => {
    const rfpId = event(await send(buyer, "postRfp", { ...instance, functionName: "postRfp", args: [label32("Delivery test"), BigInt((await now()) + 7 * 86400), stable, 0n, 2] }), abis.instance, "RfpPosted").rfpId
    const bidId = event(await send(supplier, "bid", { ...instance, functionName: "bid", args: [rfpId, bidAmount, timeframe, BigInt((await now()) + 86400)] }), abis.instance, "BidPlaced").bidId
    await approveExact(buyer, stable, t.vault, bidAmount + serviceFee, "approve the award total")
    return { rfpId, bidId }
  }

  // 22. Award with a code; the same code on a second held payment is refused.
  const code = newCode()
  const a1 = await openRequest()
  const awardedWithCode = await send(buyer, "acceptBidWithCode", { ...instance, functionName: "acceptBidWithCode", args: [a1.rfpId, a1.bidId, bidAmount + serviceFee, fingerprint(code)] })
  const held = event(awardedWithCode, abis.instance, "RfpAwarded").settlementId
  const d0 = await read(t.vault, abis.vault, "getDelivery", [held])
  expect(d0.codeHash.toLowerCase() === fingerprint(code).toLowerCase() && d0.deliveredAt === 0n, "getDelivery does not show the fingerprint that was set")
  const a2 = await openRequest()
  await refused(buyer, "the same code on a second held payment", { ...instance, functionName: "acceptBidWithCode", args: [a2.rfpId, a2.bidId, bidAmount + serviceFee, fingerprint(code)] }, "DeliveryCodeReused")
  const code2 = newCode()
  const held2 = event(await send(buyer, "acceptBidWithCode (second)", { ...instance, functionName: "acceptBidWithCode", args: [a2.rfpId, a2.bidId, bidAmount + serviceFee, fingerprint(code2)] }), abis.instance, "RfpAwarded").settlementId
  ok(`award into held payment #${held} with a delivery code: acceptBidWithCode(rfpId, bidId, maxTotal, keccak256(code)); getDelivery shows the fingerprint; the same code again is refused (DeliveryCodeReused)`)

  // 23. A wrong code is refused; a third wallet presents the right one; the handover is recorded.
  await refused(admin, "a wrong code", { ...vault, functionName: "releaseWithCode", args: [held, newCode()] }, "WrongDeliveryCode")
  await refused(admin, "presenting a code on a held payment without one", { ...vault, functionName: "releaseWithCode", args: [escrowId, code] }, "NotActive")
  const supplierBefore2 = await balance(stable, supplier.address)
  const presented = await send(admin, "releaseWithCode", { ...vault, functionName: "releaseWithCode", args: [held, code] })
  const d1 = await read(t.vault, abis.vault, "getDelivery", [held])
  const at = (await pub.getBlock({ blockNumber: presented.blockNumber })).timestamp
  expect(d1.deliveredAt === at, `deliveredAt is ${d1.deliveredAt}, expected the block's time ${at}`)
  expect((await read(t.vault, abis.vault, "getEscrow", [held])).state === 2, "the held payment is not released")
  expect((await balance(stable, supplier.address)) - supplierBefore2 === bidAmount - platformFee, "the supplier did not receive the amount less the platform fee")
  ok(`present the code from a third wallet: releaseWithCode(id, code) releases to the supplier; a wrong code is refused (WrongDeliveryCode); getDelivery.deliveredAt = ${d1.deliveredAt}`)

  // 24. More time, by the buyer only, at least an hour ahead and later than today's deadline.
  const e2 = await read(t.vault, abis.vault, "getEscrow", [held2])
  await refused(supplier, "the supplier extending", { ...vault, functionName: "extendTerm", args: [held2, e2.expiresAt + 86400n] }, "NotIssuer")
  await refused(buyer, "an extension that is not later than the deadline", { ...vault, functionName: "extendTerm", args: [held2, e2.expiresAt] }, "InvalidTermBounds")
  await refused(buyer, "an extension under an hour from now", { ...vault, functionName: "extendTerm", args: [held2, BigInt((await now()) + 1800)] }, "InvalidTermBounds")
  await send(buyer, "extendTerm", { ...vault, functionName: "extendTerm", args: [held2, e2.expiresAt + 86400n] })
  expect((await read(t.vault, abis.vault, "getEscrow", [held2])).expiresAt === e2.expiresAt + 86400n, "the deadline did not move")
  ok(`give held payment #${held2} more time as the buyer: extendTerm(id, newExpiresAt) one day later; too short, not later, and not the buyer are refused`)

  // 25. The keeper's relay, when one is given.
  if (process.env.KEEPER_API) {
    const base = process.env.KEEPER_API.replace(/\/$/, "")
    const post = async (body) => { const r = await fetch(`${base}/v1/deliver`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); return r.json() }
    const wrong = await post({ workspace: Number(workspace), id: Number(held2), code: newCode() })
    expect(wrong.error === "wrong_code", `the relay answered ${JSON.stringify(wrong)} to a wrong code, expected wrong_code`)
    const supplierBefore3 = await balance(stable, supplier.address)
    const done = await post({ workspace: Number(workspace), id: Number(held2), code: code2 })
    expect(done.released === true && /^0x[0-9a-f]{64}$/i.test(done.transaction ?? ""), `the relay answered ${JSON.stringify(done)}`)
    await pub.waitForTransactionReceipt({ hash: done.transaction })
    expect((await read(t.vault, abis.vault, "getEscrow", [held2])).state === 2 && (await read(t.vault, abis.vault, "getDelivery", [held2])).deliveredAt > 0n, "the relay's transaction did not release the payment")
    expect((await balance(stable, supplier.address)) - supplierBefore3 === bidAmount - platformFee, "the supplier did not receive the payout through the relay")
    ok(`the keeper's relay at ${base}: a wrong code is answered wrong_code and costs nothing; the right code releases held payment #${held2} (transaction ${done.transaction.slice(0, 10)}…)`)
  } else {
    await send(admin, "releaseWithCode (second)", { ...vault, functionName: "releaseWithCode", args: [held2, code2] })
    console.log("     (no KEEPER_API given: the keeper's relay was not tried; the second code was presented from a wallet instead)")
  }
} else {
  console.log(`     (workspace #${workspace} runs protocol version ${protocol}: delivery confirmation is not available there, so steps 22 to 25 did not run)`)
}

console.log(`\nall ${step} steps passed against workspace #${workspace} on chain ${chainId} (${rpcUrl})`)
} catch (e) {
  console.log(`FAIL ${String(step + 1).padStart(2)}. ${e instanceof Failure ? e.message : why(e)}`)
  if (putFeeBack) await putFeeBack().then(() => console.log("     the service fee was put back"), (x) => console.log(`     the service fee could NOT be put back: ${why(x)}`))
  if (giveAdminBack) await giveAdminBack().then(() => console.log("     the admin role was handed back"), (x) => console.log(`     the admin role could NOT be handed back: ${why(x)}`))
  process.exit(1)
}
