"use client"
import Link from "next/link"
import { useAccount, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useSaleCount, useSales, useTx } from "@/lib/bitregalo/hooks"
import { decodeLabel, useSettlementTokens } from "@/lib/bitregalo/instances"
import { abis } from "@/lib/bitregalo/config"
import { Amount, Card, Empty, PageHead, Pill, RowsSkeleton } from "@/components/app/ui"
import { Explainer } from "@/components/app/explain"
import { Button } from "@/components/ui/button"
import { OlderContract } from "@/components/app/older-contract"
import { saleStatus } from "@/lib/bitregalo/sales"

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default function Shop() {
  const t = useTenant()
  const base = t.base
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
      { address: a, abi: abis.utilityToken, functionName: "decimals" },
    ]),
    query: { enabled: tokenAddrs.length > 0 },
  })
  const tokenMeta = (a: Address) => {
    const i = tokenAddrs.indexOf(a)
    return {
      symbol: (meta.data?.[i * 3]?.result as string) ?? "…",
      name: (meta.data?.[i * 3 + 1]?.result as string) ?? "",
      decimals: Number((meta.data?.[i * 3 + 2]?.result as number | undefined) ?? 18),
    }
  }
  if (!hasShop) return <OlderContract what="The shop" />
  const loading = (hasShop && count === undefined) || sales.isLoading
  const items = sales.data.map((s, i) => (s ? { s, id: sales.ids[i] } : null)).filter((x) => x !== null)

  return (
    <div>
      <PageHead
        title="Shop"
        intro="What this workspace sells: vouchers, credits, memberships, tickets. Pay with a stablecoin and the tokens land in your wallet at once."
        action={isAdmin ? <Button asChild><Link href={`${base}/shop/new`}>Sell in the shop</Link></Button> : undefined}
      />
      <Explainer id="shop" title="How buying works">
        <p>Each sale names a token, a price per token and how many are left. When you buy, your stablecoin goes to the workspace&apos;s treasury and the tokens come to you in the same transaction. Nobody holds your payment in between.</p>
        <p>To use what you bought, open the token and <b>redeem</b> it with a reference the workspace understands. Redeeming hands the token back to them, free of charge.</p>
      </Explainer>

      {loading && items.length === 0 && <Card flush><RowsSkeleton rows={2} /></Card>}
      {!loading && items.length === 0 && (
        <Card flush>
          <Empty
            title="Nothing for sale yet"
            body={isAdmin ? "Open the first sale: pick a token, set a price, choose how many." : "The admin has not put anything up for sale."}
            action={isAdmin ? <Button asChild size="sm"><Link href={`${base}/shop/new`}>Sell in the shop</Link></Button> : undefined}
          />
        </Card>
      )}

      {items.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map(({ s, id }) => {
            const tm = tokenMeta(s.token)
            const pay = payTokens.all.find((x) => x.address.toLowerCase() === s.payToken.toLowerCase())
            const st = saleStatus(s)
            const label = decodeLabel(s.metaHash)
            const onSale = st.label === "on sale"
            return (
              <li key={String(id)} className="flex flex-col rounded-xl border border-border bg-card px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="t-subheading wrap-break-word">{tm.name || tm.symbol}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{label ?? (tm.name ? tm.symbol : "")}</p>
                  </div>
                  <Pill tone={st.tone}>{cap(st.label)}</Pill>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-muted-foreground">Price each</dt>
                    <dd className="t-num mt-0.5 text-base font-[560]">{s.price === 0n ? "Free" : pay ? <Amount value={s.price} decimals={pay.decimals} symbol={pay.symbol} /> : "…"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Left</dt>
                    <dd className="t-num mt-0.5 text-base font-[560]"><Amount value={s.remaining} decimals={tm.decimals} /> <span className="font-normal text-muted-foreground">of <Amount value={s.remaining + s.sold} decimals={tm.decimals} /></span></dd>
                  </div>
                </dl>
                <div className="mt-5 flex flex-wrap gap-2 pt-1">
                  <Button asChild variant="secondary"><Link href={`${base}/shop/${String(id)}`}>{onSale ? "Buy" : "View"}</Link></Button>
                  {isAdmin && s.active && (
                    <Button variant="ghost" disabled={isPending} onClick={() => send(`Close sale #${String(id)}`, { address: t.instance, abi: abis.instance, functionName: "closeSale", args: [id] }).then(() => sales.refetch())}>
                      Close sale
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
