"use client"
import { useTenant } from "@/lib/bitregalo/tenant"
import Link from "next/link"
import { useReadContract, useReadContracts } from "wagmi"
import { abis, addresses } from "@/lib/bitregalo/config"
import { Card, Addr, Row, Amount } from "@/components/app/ui"
import { Button } from "@/components/ui/button"
import type { Address } from "viem"

export default function TokensPage() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const list = useReadContract({ address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tenantTokens", args: [t.id], query: { refetchInterval: 15_000 } })
  const tokens = ((list.data as Address[] | undefined) ?? []).slice().reverse()
  const meta = useReadContracts({
    contracts: tokens.flatMap((t) => [
      { address: t, abi: abis.utilityToken, functionName: "name" },
      { address: t, abi: abis.utilityToken, functionName: "symbol" },
      { address: t, abi: abis.utilityToken, functionName: "totalSupply" },
      { address: t, abi: abis.utilityToken, functionName: "decimals" },
    ]),
    query: { enabled: tokens.length > 0 },
  })
  return (
    <Card title={`Utility tokens launched on this tenant (${tokens.length})`} action={<Button asChild size="sm"><Link href={`${base}/tokens/new`}>Launch a token</Link></Button>}>
      <p className="mb-4 text-sm text-muted-foreground">Contract-as-a-service: a named ERC-20 for a project — credits, vouchers, memberships — usable as a settlement token once the tenant admin allowlists it.</p>
      {tokens.map((t, i) => {
        const [name, symbol, supply, decimals] = (meta.data ?? []).slice(i * 4, i * 4 + 4).map((r) => r.result)
        return (
          <Row key={t} href={`${base}/tokens/${t}`}>
            <span className="font-semibold">{(symbol as string) ?? "…"}</span>
            <span className="text-sm">{(name as string) ?? ""} · <Addr a={t} /></span>
            <span className="text-sm text-muted-foreground">supply <Amount value={(supply as bigint) ?? 0n} decimals={Number(decimals ?? 18)} /></span>
          </Row>
        )
      })}
      {tokens.length === 0 && <p className="text-sm text-muted-foreground">None yet — launch the first one.</p>}
    </Card>
  )
}
