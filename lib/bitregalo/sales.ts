/**
 * Where a sale stands, in a word. `approved` is what the treasury's owner has approved for it and
 * is not sold yet (`saleAllowance`); pass it when known. Nothing can be bought from a sale that
 * has no approval left, whatever its dates say.
 */
export function saleStatus(s: { active: boolean; remaining: bigint; start: bigint; end: bigint }, approved?: bigint) {
  const now = BigInt(Math.floor(Date.now() / 1000))
  if (!s.active) return { label: "closed", tone: "muted" as const }
  if (s.remaining === 0n) return { label: "sold out", tone: "muted" as const }
  if (s.end !== 0n && now >= s.end) return { label: "ended", tone: "muted" as const }
  if (approved === 0n) return { label: "waiting for approval", tone: "accent" as const }
  if (now < s.start) return { label: "opens soon", tone: "accent" as const }
  return { label: "on sale", tone: "good" as const }
}
