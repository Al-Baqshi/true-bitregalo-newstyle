"use client"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { useTenant } from "@/lib/bitregalo/tenant"
import { abis, addresses } from "@/lib/bitregalo/config"
import { Amount, Pill, PageHead, Empty, Card } from "@/components/app/ui"
import { Explainer } from "@/components/app/explain"
import { Button } from "@/components/ui/button"

export default function TokensPage() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { address } = useAccount()
  const list = useReadContract({ address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tenantTokens", args: [t.id], query: { refetchInterval: 15_000 } })
  const tokens = ((list.data as Address[] | undefined) ?? []).slice().reverse()
  const meta = useReadContracts({
    contracts: tokens.flatMap((a) => [
      { address: a, abi: abis.utilityToken, functionName: "name" },
      { address: a, abi: abis.utilityToken, functionName: "symbol" },
      { address: a, abi: abis.utilityToken, functionName: "totalSupply" },
      { address: a, abi: abis.utilityToken, functionName: "owner" },
      { address: a, abi: abis.erc20, functionName: "balanceOf", args: [address ?? addresses.treasury] },
      { address: t.instance, abi: abis.instance, functionName: "tokens", args: [a] },
    ]),
    query: { enabled: tokens.length > 0, refetchInterval: 15_000 },
  })
  const loading = list.data === undefined
  return (
    <div className="space-y-8">
      <PageHead
        title="Tokens"
        intro="Credits, vouchers and memberships this workspace has created. Once the admin accepts one as payment, requests and listings here can be paid in it."
        action={<Button asChild><Link href={`${base}/tokens/new`}>Create a token</Link></Button>}
      />
      <Explainer id="tokens" title="What are tokens here?">
        <p>A token is a currency or credit this workspace creates for itself: site credits, vouchers, memberships, loyalty points. You hold them in your wallet like any other coin.</p>
        <p>Once the workspace admin <b>accepts a token as payment</b>, requests and listings here can be paid in it, including through escrow.</p>
      </Explainer>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2" aria-hidden>
          {[0, 1].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="h-5 w-1/3 animate-pulse rounded bg-secondary" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-secondary" />
              <div className="mt-6 h-4 w-1/2 animate-pulse rounded bg-secondary" />
            </div>
          ))}
        </div>
      )}
      {!loading && tokens.length === 0 && (
        <Card flush>
          <Empty title="No tokens yet" body="Create one in a few steps: name it, choose the supply, and link it to a project if you like." action={<Button asChild size="sm"><Link href={`${base}/tokens/new`}>Create a token</Link></Button>} />
        </Card>
      )}
      {!loading && tokens.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {tokens.map((a, i) => {
            const [name, symbol, supply, owner, mine, cfg] = (meta.data ?? []).slice(i * 6, i * 6 + 6).map((r) => r.result) as [string?, string?, bigint?, Address?, bigint?, (readonly [boolean, number, bigint])?]
            const fixed = !!owner && /^0x0{40}$/.test(owner)
            const youMint = !!address && owner?.toLowerCase() === address.toLowerCase()
            return (
              <li key={a}>
                <Link href={`${base}/tokens/${a}`} className="group block h-full rounded-xl border border-border bg-card p-5 transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="t-heading truncate">{symbol ?? "…"}</p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{name ?? ""}</p>
                    </div>
                    {cfg?.[0] ? <Pill tone="good">Accepted as payment</Pill> : <Pill>Not accepted yet</Pill>}
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-muted-foreground">You hold</dt>
                      <dd className="mt-0.5 text-base font-[560]">{address ? <Amount value={mine ?? 0n} /> : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">In existence</dt>
                      <dd className="mt-0.5 text-base font-[560]"><Amount value={supply ?? 0n} /></dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-sm text-muted-foreground">{fixed ? "Fixed supply: nobody can create more." : youMint ? "You can create more of it." : "Its creator can create more."}</p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
