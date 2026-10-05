import { isAddress, isHex, type Address, type Hex } from "viem"
import { chain } from "./config"

/*
 * An identity approval is a voucher the workspace's attester signs (EIP-712) and anyone may
 * hand to the workspace contract with `submitKycVoucher`. The contract checks the signature
 * against this exact type and domain, so both are written once, here.
 */

export const KYC_TYPES = {
  KycVoucher: [
    { name: "subject", type: "address" },
    { name: "tenantId", type: "uint256" },
    { name: "attesterEpoch", type: "uint32" },
    { name: "issuedAt", type: "uint64" },
    { name: "expiry", type: "uint64" },
    { name: "ref", type: "bytes32" },
  ],
} as const

/** The signing domain of one workspace contract: its name and version are fixed in the contract. */
export const kycDomain = (instance: Address) => ({ name: "BitRegaloInstance", version: "2", chainId: chain.id, verifyingContract: instance }) as const

export type Voucher = {
  /** The wallet being approved. */
  subject: Address
  tenantId: bigint
  /** The workspace's `attesterEpoch()` when the voucher is signed. It moves on every change of attester. */
  attesterEpoch: number
  /** The network's time when it was issued. Only a voucher newer than the last one recorded is accepted. */
  issuedAt: bigint
  /** When the approval runs out. */
  expiry: bigint
  ref: Hex
}
export type SignedApproval = { voucher: Voucher; signature: Hex }

/** A signed approval as text, so the attester can pass it to whoever will submit it. */
export function packApproval(instance: Address, a: SignedApproval): string {
  const v = a.voucher
  return JSON.stringify({
    bitregalo: "identity-approval",
    chainId: chain.id,
    workspaceContract: instance,
    voucher: { subject: v.subject, tenantId: String(v.tenantId), attesterEpoch: v.attesterEpoch, issuedAt: String(v.issuedAt), expiry: String(v.expiry), ref: v.ref },
    signature: a.signature,
  }, null, 2)
}

/** Reads a pasted approval. Returns a sentence when it cannot be used here. */
export function unpackApproval(text: string, instance: Address): SignedApproval | string {
  let j: { chainId?: number; workspaceContract?: string; voucher?: Record<string, unknown>; signature?: unknown }
  try { j = JSON.parse(text) } catch { return "This is not a signed approval. Paste the whole text you were given, from the first { to the last }." }
  const v = j?.voucher
  if (!v || typeof j.signature !== "string" || !isHex(j.signature)) return "This text has no voucher and signature in it."
  if (j.chainId !== undefined && Number(j.chainId) !== chain.id) return "This approval was signed for another network."
  if (j.workspaceContract && j.workspaceContract.toLowerCase() !== instance.toLowerCase()) return "This approval was signed for another workspace."
  try {
    if (typeof v.subject !== "string" || !isAddress(v.subject) || typeof v.ref !== "string" || !isHex(v.ref)) throw new Error()
    return {
      voucher: { subject: v.subject, tenantId: BigInt(v.tenantId as string), attesterEpoch: Number(v.attesterEpoch), issuedAt: BigInt(v.issuedAt as string), expiry: BigInt(v.expiry as string), ref: v.ref },
      signature: j.signature,
    }
  } catch {
    return "The voucher in this text is incomplete."
  }
}
