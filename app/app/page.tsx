"use client"
import Link from "next/link"
import { useReadContract, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { abis, addresses } from "@/lib/bitregalo/config"
import { instanceName } from "@/lib/bitregalo/instances"
import { Card, Addr, Row, Stat } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

export default function Instances() {
  const count = useReadContract({ address: addresses.mother, abi: abis.mother, functionName: "tenantCount", query: { refetchInterval: 15_000 } })
  const n = Number((count.data as bigint | undefined) ?? 0n)
  const ids = Array.from({ length: n }, (_, i) => BigInt(i)).reverse()
  const tenants = useReadContracts({
    contracts: ids.map((id) => ({ address: addresses.mother, abi: abis.mother, functionName: "tenants", args: [id] })),
    query: { enabled: n > 0 },
  })
  const vaults = (tenants.data ?? []).map((r) => (r.result as { vault: Address } | undefined)?.vault)
  const stats = useReadContracts({
    contracts: vaults.flatMap((v) => v ? [
      { address: v, abi: abis.vault, functionName: "escrowCount" },
      { address: v, abi: abis.vault, functionName: "directCount" },
    ] : []),
    query: { enabled: vaults.some(Boolean) },
  })
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="bq-label">Instances</p>
          <h1 className="bq-display mt-2 text-4xl font-semibold">Everyone building on BitRegalo</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--bq-ivory-dim)]">
            Every instance is a company&apos;s own set of contracts, launched from the same mother: its own requests, offers, escrows
            and tokens, with the same audited rules. Pick one to use it, or launch yours.
          </p>
        </div>
        <div className="flex gap-2"><Button asChild variant="secondary"><Link href="/app/create">Create…</Link></Button><Button asChild><Link href="/app/launch">Launch your instance</Link></Button></div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Instances" value={count.data === undefined ? "…" : String(n)} />
        <Stat label="Escrows (all)" value={stats.data ? String((stats.data ?? []).filter((_, i) => i % 2 === 0).reduce((a, r) => a + Number((r.result as bigint) ?? 0n), 0)) : "…"} />
        <Stat label="Direct payments (all)" value={stats.data ? String((stats.data ?? []).filter((_, i) => i % 2 === 1).reduce((a, r) => a + Number((r.result as bigint) ?? 0n), 0)) : "…"} />
      </div>
      <Card title="All instances">
        {ids.map((id, i) => {
          const t = tenants.data?.[i]?.result as { instance: Address; vault: Address; admin: Address } | undefined
          if (!t) return null
          const esc = stats.data?.[i * 2]?.result as bigint | undefined
          const dir = stats.data?.[i * 2 + 1]?.result as bigint | undefined
          return (
            <Row key={String(id)} href={`/app/t/${id}`}>
              <span className="font-mono text-xs text-muted-foreground">#{String(id)}</span>
              <span className="min-w-0 truncate text-sm"><span className="font-medium">{instanceName(id) ?? (id === 0n ? "BitRegalo public template" : `Instance #${id}`)}</span> · admin <Addr a={t.admin} /> · contract <Addr a={t.instance} /></span>
              <span className="text-sm text-muted-foreground">{esc !== undefined ? `${esc} escrows · ${dir} direct` : ""}</span>
            </Row>
          )
        })}
      </Card>
    </div>
  )
}
