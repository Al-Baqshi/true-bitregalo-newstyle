"use client"
import Link from "next/link"
import { useReadContract, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { abis, addresses } from "@/lib/bitregalo/config"
import { useProjects } from "@/lib/bitregalo/instances"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Card, Addr, Pill, Row } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

export default function ProjectsPage() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const projects = useProjects(t.instance)
  const tokens = useReadContract({ address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tenantTokens", args: [t.id] })
  const list = (tokens.data as Address[] | undefined) ?? []
  const info = useReadContracts({
    contracts: list.flatMap((a) => [
      { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tokenInfo", args: [a] },
      { address: a, abi: abis.utilityToken, functionName: "symbol" },
    ]),
    query: { enabled: list.length > 0 },
  })
  const byProject = new Map<string, { address: Address; symbol: string }[]>()
  list.forEach((a, i) => {
    const ti = info.data?.[i * 2]?.result as readonly [bigint, bigint, Address, bigint] | undefined
    const sym = (info.data?.[i * 2 + 1]?.result as string) ?? "…"
    if (!ti) return
    const key = String(ti[1])
    byProject.set(key, [...(byProject.get(key) ?? []), { address: a, symbol: sym }])
  })
  return (
    <Card title={`Projects (${projects.list.length})`} action={<Button asChild size="sm"><Link href={`${base}/projects/new`}>Start a project</Link></Button>}>
      {projects.list.length === 0 && <p className="text-sm text-muted-foreground">No projects yet. A project groups requests, offers and tokens under one name.</p>}
      {projects.list.slice().reverse().map((p) => (
        <Row key={String(p.id)}>
          <span className="bq-mono text-xs text-muted-foreground">#{String(p.id)}</span>
          <span className="min-w-0 text-sm">
            <span className="font-medium">{p.label ?? <span className="text-muted-foreground">Private project</span>}</span>
            <span className="text-muted-foreground"> · owner <Addr a={p.owner} /></span>
            {(byProject.get(String(p.id)) ?? []).map((tk) => (
              <Link key={tk.address} href={`${base}/tokens/${tk.address}`} className="bq-mono ml-2 rounded-full border border-primary/40 px-2 py-0.5 text-[10px] text-primary">{tk.symbol}</Link>
            ))}
          </span>
          <Pill tone={p.active ? "good" : "muted"}>{p.active ? "active" : "closed"}</Pill>
        </Row>
      ))}
    </Card>
  )
}
