import { BaseError, ContractFunctionRevertedError, decodeErrorResult, type Abi, type Hex } from "viem"
import bundle from "./bitregalo.json"

/*
 * Why a contract refused a transaction, in the app's own words. A call often passes through
 * several contracts (the workspace contract, its vault, its treasury, a token), so the reason is
 * looked up in the errors of every contract the app knows, not only the one that was called.
 */

type ErrorItem = Extract<Abi[number], { type: "error" }>
const ALL_ERRORS: ErrorItem[] = (() => {
  const seen = new Set<string>()
  const out: ErrorItem[] = []
  for (const abi of Object.values(bundle.abis) as Abi[]) {
    for (const item of abi) {
      if (item.type !== "error") continue
      const key = `${item.name}(${item.inputs.map((i) => i.type).join(",")})`
      if (!seen.has(key)) { seen.add(key); out.push(item) }
    }
  }
  return out
})()

const FEE_CHANGED = "The fee changed after you opened this page. Nothing was charged."

const WORDS: Record<string, string> = {
  // What the payer agreed to
  TotalAboveMax: `${FEE_CHANGED} Check the new total and try again.`,
  FeeAboveMax: `${FEE_CHANGED} Check the new fee and try again.`,
  FeeTokenChanged: "The fee is now charged in a different token than the one you saw. Nothing was charged. Reload the page, check the fee and try again.",
  FeeBpsAboveMax: "The platform percentage changed after you opened this page. Nothing was charged. Check the new percentage and try again.",
  // Who may do it
  NotAdmin: "Only the admin (or, for a treasury, its owner) can do this.",
  NotPendingAdmin: "Only the wallet the admin role was offered to can accept it.",
  NotAuthorised: "Only the workspace admin can create a workspace token. A project token can be created by the admin or by that project's owner.",
  NotIssuer: "Only the buyer can release this payment.",
  NotReceiver: "Only the supplier can hand this payment back.",
  NotRequester: "Only the wallet that posted the request can do this.",
  NotProvider: "Only the wallet that made this offer can withdraw it.",
  NotSupplier: "Only the supplier of this listing can do this.",
  NotProjectOwner: "Only the owner of that project can do this.",
  NotDesignatedBuyer: "This listing was made for one named buyer, and your wallet is not that buyer.",
  NotAttesterOrAdmin: "Only the identity attester or the admin can do this.",
  OwnableUnauthorizedAccount: "Only the owner of that contract can do this.",
  RenounceDisabled: "The owner of a platform contract cannot give ownership up.",
  KycRequired: "This workspace asks for an identity approval. Ask its attester for one. The other party to a payment needs one too.",
  InvalidVoucher: "This signed approval is not valid here. It must be signed by this workspace's current attester, for this workspace, and not be dated in the future.",
  VoucherSuperseded: "A newer approval, or the end of one, is already recorded for this person. After an approval is ended, a new one can be recorded only ten minutes later.",
  NotGuardianOrOwner: "Only the owner or the guardian can pause sponsorship.",
  // Timing and state
  OfferExpired: "This offer is past its valid-until time, so it can no longer be accepted.",
  InvalidValidity: "The valid-until time must be in the future.",
  DeadlinePassed: "The closing time has passed.",
  DeadlineTooSoon: "Offers must stay open for at least 10 minutes.",
  TermElapsed: "The deadline has passed. The payment can now only be returned to the buyer.",
  NotExpired: "The deadline has not passed yet.",
  NotActive: "This held payment has already been released, handed back or returned.",
  BadState: "This record is no longer in a state that allows it. Reload the page to see where it stands.",
  ProtocolPaused: "New payments are paused right now. Held payments can still be released, handed back and returned.",
  EnforcedPause: "The platform is paused, so no new workspace can be created right now.",
  // Payments
  SelfDealing: "The two sides of a payment must be different wallets.",
  InvalidPayee: "A payment cannot be sent to one of the protocol's own contracts.",
  TokenNotAllowed: "This workspace does not accept that token.",
  SettlementNotAllowed: "That way of paying is switched off in this workspace.",
  TermOutOfRange: "That delivery time is outside what this workspace allows for held payments.",
  InvalidTermBounds: "Those times do not fit together. Check the opening and closing times, or the shortest and longest term.",
  ZeroAmount: "An amount or a time is missing or zero.",
  ZeroAddress: "An address is missing.",
  AmountTooLarge: "That amount is too large.",
  TransferDeltaMismatch: "This token does not move the exact amount it is asked to (it may take a fee on transfer), so it cannot be used here.",
  InvalidToken: "That address is not a token this protocol can use.",
  // Delivery codes (protocol version 3)
  NoDeliveryCode: "This held payment carries no delivery code. Only the buyer can release it.",
  WrongDeliveryCode: "This code does not belong to this held payment.",
  DeliveryCodeAlreadySet: "This held payment already carries a delivery code.",
  DeliveryCodeReused: "This delivery code was already used on another held payment of yours. Each held payment needs a new code.",
  NothingToClaim: "There is nothing credited to your wallet for that token.",
  NothingToCollect: "No fees are waiting in that token.",
  ERC20InsufficientBalance: "The wallet does not hold enough of that token.",
  ERC20InsufficientAllowance: "The approval is smaller than the amount to move. Approve the exact total and try again.",
  SafeERC20FailedOperation: "The token refused the transfer. Check the balance and the approval.",
  // Sales and tokens
  SaleNotApproved: "The treasury's owner has not approved this sale for that many tokens yet.",
  SaleTermsMismatch: "The sale's terms are not the ones that were read. Nothing was approved. Reload the page and check the sale again.",
  UnknownSale: "There is no sale with that number.",
  SaleNotOpen: "This sale has not opened yet.",
  SoldOut: "Not enough tokens are left in this sale.",
  PurchaseLimit: "That is more than the limit per buyer.",
  NoInventory: "The treasury does not hold enough of this token and does not have the right to create it.",
  NotRedeemable: "This token cannot be redeemed here. Only a token created for this workspace can be made redeemable, and the admin has to switch it on.",
  CapExceeded: "That would create more than the token's maximum supply.",
  UnknownProject: "There is no project with that number in this workspace.",
  UnknownTenant: "There is no workspace with that number.",
  UnknownVersion: "That contract version is not registered.",
  VersionRetired: "That contract version has been retired. Use the newest one.",
  FeeTooHigh: "The platform fee cannot be above 5%.",
  EmptyName: "A token needs a name and a symbol.",
  BadDecimals: "A token has at most 18 decimals.",
  FaucetCooldown: "The faucet gives practice tokens once a day. Try again later.",
}

/** The contract error's name, when the failure was a contract refusing the call. */
export function revertName(e: unknown): string | null {
  if (!(e instanceof BaseError)) return null
  const reverted = e.walk((x) => x instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null
  if (!reverted) return null
  if (reverted.data?.errorName) return reverted.data.errorName
  // Raised by a contract further down the call: decode it against every error we know.
  const raw = (reverted as { raw?: Hex }).raw
  if (raw && raw.length >= 10) {
    try { return decodeErrorResult({ abi: ALL_ERRORS, data: raw }).errorName } catch {}
  }
  return null
}

/** True when the node said the call would revert (as opposed to a network or wallet problem). */
export function isRevert(e: unknown): boolean {
  return e instanceof BaseError && !!e.walk((x) => x instanceof ContractFunctionRevertedError)
}

/** A plain sentence for a refused transaction, or null when we do not know the reason. */
export function explainError(e: unknown): string | null {
  const name = revertName(e)
  return name ? WORDS[name] ?? null : null
}

/** What to show a person when something failed: our words when we know why, else the first line of the error. */
export function errorText(e: unknown): string {
  const known = explainError(e)
  if (known) return known
  if (e instanceof BaseError && e.shortMessage) return e.shortMessage.split("\n")[0].slice(0, 200)
  return ((e as Error)?.message ?? String(e)).split("\n")[0].slice(0, 200)
}
