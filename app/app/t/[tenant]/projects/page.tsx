"use client"
import Link from "next/link"
import { useReadContract, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { abis } from "@/lib/bitregalo/config"
import { useProjects, useWorkspaceTokens } from "@/lib/bitregalo/instances"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Addr, Card, Empty, LedgerRow, PageHead, Pill, RowsSkeleton } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

export default function ProjectsPage() {
  const t = useTenant()
  const base = t.base
  const projects = useProjects(t.instance)
  // Same read as inside useProjects (wagmi shares it), so the page can tell "still loading" from "none yet".
  const count = useReadContract({ address: t.instance, abi: abis.instance, functionName: "projectCount", query: { enabled: !!t.instance, refetchInterval: 20_000 } })
  const expected = count.data as bigint | undefined
  const loading = expected === undefined || (expected > 0n && projects.list.length === 0)
  // The token factory lists each project's tokens under that project.
  const list = useWorkspaceTokens(t.id, t.instance).tokens.filter((x) => x.projectId > 0n)
  const symbols = useReadContracts({
    contracts: list.map((x) => ({ address: x.address, abi: abis.utilityToken, functionName: "symbol" })),
    query: { enabled: list.length > 0 },
  })
  const byProject = new Map<string, { address: Address; symbol: string }[]>()
  list.forEach((x, i) => {
    const key = String(x.projectId)
    byProject.set(key, [...(byProject.get(key) ?? []), { address: x.address, symbol: (symbols.data?.[i]?.result as string) ?? "…" }])
  })
  const rows = projects.list.slice().reverse()
  const start = <Button asChild><Link href={`${base}/projects/new`}>Start a project</Link></Button>

  return (
    <div>
      <PageHead
        title="Projects"
        intro="A project is a name that groups related requests, listings and tokens: a building site, a programme, a product line. A project's owner can create a token for it."
        action={start}
      />
      <Card flush title={rows.length > 0 ? `All projects (${rows.length})` : "All projects"}>
        {loading && rows.length === 0 && <RowsSkeleton rows={2} />}
        {!loading && rows.length === 0 && (
          <Empty
            title="No projects yet"
            body="Start one to keep related work together. Requests and tokens can then be linked to it by name."
            action={<Button asChild size="sm"><Link href={`${base}/projects/new`}>Start a project</Link></Button>}
          />
        )}
        {rows.map((p) => {
          const linked = byProject.get(String(p.id)) ?? []
          return (
            <LedgerRow
              key={String(p.id)}
              lead={p.label ? `#${String(p.id)}` : undefined}
              title={p.label ?? `Project #${String(p.id)}`}
              meta={
                <>
                  <span>{p.label ? null : "Name kept private · "}Owned by <Addr a={p.owner} /></span>
                  {linked.length > 0 && (
                    <span className="block">
                      {linked.length === 1 ? "Token: " : "Tokens: "}
                      {linked.map((tk, i) => (
                        <span key={tk.address}>
                          {i > 0 && ", "}
                          <Link href={`${base}/tokens/${tk.address}`} className="relative z-10 -my-1.5 inline-block rounded-sm py-1.5 text-foreground underline decoration-border-strong decoration-1 underline-offset-[3px] transition-colors hover:decoration-foreground">
                            {tk.symbol}
                          </Link>
                        </span>
                      ))}
                    </span>
                  )}
                </>
              }
              status={<Pill tone={p.active ? "accent" : "muted"}>{p.active ? "Active" : "Closed"}</Pill>}
            />
          )
        })}
      </Card>
    </div>
  )
}
