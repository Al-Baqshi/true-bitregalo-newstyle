import { MarketError, countryName, type Entry } from "@/lib/bitregalo/market"

/** "Auckland, New Zealand", "New Zealand", or "" — the country by name, never a code or a flag. */
export function placeOf(e: Pick<Entry, "city" | "country"> | null | undefined) {
  if (!e) return ""
  const country = e.country ? countryName(e.country) : ""
  return [e.city?.trim(), country].filter(Boolean).join(", ")
}

/** The first line of a description, for a list row. */
export function firstLine(s: string | undefined) {
  return (s ?? "").split("\n").map((l) => l.trim()).find(Boolean) ?? ""
}

/** How a record settles, as the end of a sentence ("settles by escrow"). */
export const SETTLES = ["record only", "settles by direct payment", "settles by escrow"] as const

/** A failed save in plain words, short enough to sit inside a sentence. */
export function marketErrorText(e: unknown): string {
  const err = e as { name?: string; code?: unknown; message?: string; shortMessage?: string }
  const msg = err?.shortMessage ?? err?.message ?? String(e)
  if (err?.name === "UserRejectedRequestError" || err?.code === 4001 || /user (rejected|denied)|rejected the request|denied message signature/i.test(msg)) {
    return "the message was not signed in your wallet"
  }
  if (e instanceof MarketError) {
    switch (e.code) {
      case "unavailable": return "the marketplace index is not connected here"
      case "unreachable": return "the marketplace index could not be reached"
      case "no_record": return "the marketplace index cannot see the new record on the blockchain yet"
      case "stale": return "the clock on this device is more than 10 minutes out, or a newer version was saved"
      case "bad_signature": return "the signature did not match your wallet"
      case "not_owner": return "only the wallet that posted it can describe it"
      case "rate_limited": return "too many saves from this connection; wait a minute"
      case "too_large": return "the details are too long to store"
      case "chain_unavailable": return "the marketplace index could not read the blockchain just now"
      case "invalid": return `the marketplace index refused it: ${e.message.replace(/\.$/, "")}`
      default: return e.message.replace(/\.$/, "")
    }
  }
  return msg.split("\n")[0].replace(/\.$/, "").slice(0, 140)
}
