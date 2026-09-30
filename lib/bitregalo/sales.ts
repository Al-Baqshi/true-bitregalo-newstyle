export function saleStatus(s: { active: boolean; remaining: bigint; start: bigint; end: bigint }) {
  const now = BigInt(Math.floor(Date.now() / 1000))
  if (!s.active) return { label: "closed", tone: "muted" as const }
  if (s.remaining === 0n) return { label: "sold out", tone: "muted" as const }
  if (now < s.start) return { label: "opens soon", tone: "accent" as const }
  if (s.end !== 0n && now >= s.end) return { label: "ended", tone: "muted" as const }
  return { label: "on sale", tone: "good" as const }
}
