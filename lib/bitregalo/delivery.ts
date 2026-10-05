import { bytesToHex, isHex, keccak256, type Hex } from "viem"
import { chain } from "./config"

/*
 * The delivery code (protocol version 3). A held payment can carry the fingerprint of a secret
 * the buyer's browser made; whoever presents the secret before the deadline releases the payment
 * to the supplier. The rules the contract cannot enforce and this app must (docs/V3.md):
 *
 *   - the code is 32 random bytes from the browser's own randomness, never shorter;
 *   - the fingerprint is keccak256 over exactly those 32 bytes, computed here, on the buyer's side;
 *   - the code never goes to a server, never into a query string (the link carries it in the
 *     fragment, which browsers do not send), and is never logged;
 *   - one code per held payment: a new one is drawn every time.
 *
 * The chain keeps only the fingerprint, so the code cannot be recovered. This browser keeps a
 * copy for the buyer, first under the fingerprint (before anything is signed), then under the
 * held payment's number (after the transaction).
 */

export type DeliveryCode = Hex

export function newDeliveryCode(): DeliveryCode {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}
export const isDeliveryCode = (s: string): s is DeliveryCode => /^0x[0-9a-fA-F]{64}$/.test(s)
/** The fingerprint the contract stores: keccak256 over the 32 bytes of the code. */
export const codeFingerprint = (code: DeliveryCode): Hex => keccak256(code)

/** The link the recipient opens. The code sits in the fragment, which never leaves the browser. */
export function deliveryLink(origin: string, workspace: bigint, id: bigint, code: DeliveryCode) {
  return `${origin}/app/deliver#w=${workspace}&id=${id}&code=${code}`
}

export type DeliveryRef = { workspace?: bigint; id?: bigint; code?: DeliveryCode }
/** Reads a delivery link, a fragment, or a bare code. Missing parts stay undefined. */
export function parseDelivery(text: string): DeliveryRef {
  const t = text.trim()
  if (isDeliveryCode(t)) return { code: t }
  const hash = t.includes("#") ? t.slice(t.indexOf("#") + 1) : t
  const p = new URLSearchParams(hash)
  const w = p.get("w"), id = p.get("id"), code = p.get("code") ?? ""
  return {
    workspace: w !== null && /^\d+$/.test(w) ? BigInt(w) : undefined,
    id: id !== null && /^\d+$/.test(id) ? BigInt(id) : undefined,
    code: isDeliveryCode(code) ? code : undefined,
  }
}

const key = (vault: string, id: bigint) => `bitregalo:delivery:${chain.id}:${vault.toLowerCase()}:${id}`
const pendingKey = (vault: string, fingerprint: Hex) => `bitregalo:delivery:pending:${chain.id}:${vault.toLowerCase()}:${fingerprint.toLowerCase()}`

/** Keeps the code before anything is signed, under its fingerprint, so a crash after signing cannot lose it. */
export function keepPendingCode(vault: string, code: DeliveryCode) {
  try { localStorage.setItem(pendingKey(vault, codeFingerprint(code)), code) } catch {}
}
/** Once the held payment has a number, the code is filed under it. */
export function keepCode(vault: string, id: bigint, code: DeliveryCode) {
  try {
    localStorage.setItem(key(vault, id), code)
    localStorage.removeItem(pendingKey(vault, codeFingerprint(code)))
  } catch {}
}
/** The code this browser kept for a held payment: by its number, or by the fingerprint the chain shows. */
export function storedCode(vault: string, id: bigint, fingerprint?: Hex): DeliveryCode | null {
  try {
    const byId = localStorage.getItem(key(vault, id))
    if (byId && isDeliveryCode(byId)) return byId
    if (fingerprint && !/^0x0+$/.test(fingerprint)) {
      const pending = localStorage.getItem(pendingKey(vault, fingerprint))
      if (pending && isDeliveryCode(pending)) { keepCode(vault, id, pending); return pending }
    }
  } catch {}
  return null
}
export function hasFingerprint(fingerprint: Hex | undefined) {
  return !!fingerprint && isHex(fingerprint) && !/^0x0+$/.test(fingerprint)
}
