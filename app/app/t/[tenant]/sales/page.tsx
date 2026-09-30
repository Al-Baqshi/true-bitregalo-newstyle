"use client"
import Link from "next/link"
import { useAccount, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useSaleCount, useSales, useTx } from "@/lib/bitregalo/hooks"
import { decodeLabel, useSettlementTokens } from "@/lib/bitregalo/instances"
import { abis } from "@/lib/bitregalo/config"
import { Amount, Pill, PageHead, Empty } from "@/components/app/ui"
import { Explainer } from "@/components/app/explain"
import { Button } from "@/components/ui/button"
import { OlderContract } from "@/components/app/older-contract"
import { saleStatus } from "@/lib/bitregalo/sales"

export default function Shop() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { address } = useAccount()
  const hasShop = t.version >= 1n
  const { count } = useSaleCount(hasShop)
  const sales = useSales(count)
  const payTokens = useSettlementTokens(t.instance, t.id)
  const { send, isPending } = useTx()
  const isAdmin = !!address && t.admin.toLowerCase() === address.toLowerCase()
  const tokenAddrs = Array.from(new Set(sales.data.flatMap((s) => (s ? [s.token] : []))))
  const meta = useReadContracts({
    contracts: tokenAddrs.flatMap((a) => [
      { address: a, abi: abis.utilityToken, functionName: "symbol" },
      { address: a, abi: abis.utilityToken, functionName: "name" },
    ]),
    query: { enabled: tokenAddrs.length > 0 },
  })
  const tokenMeta = (a: Address) => { const i = tokenAddrs.indexOf(a); return { symbol: (meta.data?.[i * 2]?.result as string) ?? "…", name: (meta.data?.[i * 2 + 1]?.result as string) ?? "" } }
  if (!hasShop) return <OlderContract what="The shop" />
  return (
    <div className="space-y-8">
      <PageHead eyebrow={`Workspace #${String(t.id)}`} title="Shop" intro="Utilities this workspace sells: vouchers, credits, memberships, tickets. Buy with a stablecoin; the tokens land in your wallet at once." action={isAdmin ? <Button asChild><Link href={`${base}/sales/new`}>Sell a utility</Link></Button> : undefined} />
      <Explainer id="shop" title="How buying works">
        <p>Each sale names a token, a price per token and how many are left. When you buy, your stablecoin goes to the workspace&apos;s treasury and the tokens come to you in the same transaction. Nobody holds your money in between.</p>
        <p>To use what you bought, open the token and <b>redeem</b> it with a reference the workspace understands. Redeeming hands the token back to them, free of charge.</p>
      </Explainer>
      {sales.data.length === 0 && <Empty title="Nothing for sale yet" body={isAdmin ? "Open the first sale: pick a token, set a price, choose how many." : "The admin has not put anything up for sale."} action={isAdmin ? <Button asChild size="sm"><Link href={`${base}/sales/new`}>Sell a utility</Link></Button> : undefined} />}
      <div className="grid gap-4 md:grid-cols-2">
        {sales.data.map((s, i) => {
          if (!s) return null
          const id = sales.ids[i]
          const tm = tokenMeta(s.token)
          const pay = payTokens.all.find((x) => x.address.toLowerCase() === s.payToken.toLowerCase())
          const st = saleStatus(s)
          const label = decodeLabel(s.metaHash)
          return (
            <div key={String(id)} className="rounded-2xl border border-border bg-card/80 p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="bq-display text-2xl font-semibold">{tm.symbol}</p><p className="text-sm text-muted-foreground">{label ?? tm.name}</p></div>
                <Pill tone={st.tone}>{st.label}</Pill>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">Price</dt><dd className="mt-0.5">{s.price === 0n ? "free" : pay ? <><Amount value={s.price} decimals={pay.decimals} symbol={pay.symbol} /> each</> : "…"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Left</dt><dd className="mt-0.5 tabular-nums"><Amount value={s.remaining} /> of <Amount value={s.remaining + s.sold} /></dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm"><Link href={`${base}/sales/${String(id)}`}>{st.label === "on sale" ? "Buy" : "View"}</Link></Button>
                {isAdmin && s.active && <Button size="sm" variant="secondary" disabled={isPending} onClick={() => send(`Close sale #${String(id)}`, { address: t.instance, abi: abis.instance, functionName: "closeSale", args: [id] }).then(() => sales.refetch())}>Close</Button>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
