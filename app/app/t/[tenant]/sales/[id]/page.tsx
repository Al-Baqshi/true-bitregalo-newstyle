"use client"
import { use, useState } from "react"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { formatUnits, maxUint256, parseUnits, type Address } from "viem"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useErc20, useSale, useTx } from "@/lib/bitregalo/hooks"
import { decodeLabel, useSettlementTokens, useProjects } from "@/lib/bitregalo/instances"
import { useInstanceRules } from "@/lib/bitregalo/instance-rules"
import { abis, explorerAddress, short } from "@/lib/bitregalo/config"
import { Card, Amount, PageHead, Pill } from "@/components/app/ui"
import { Label, Note, input } from "@/components/app/wizard/fields"
import { Button } from "@/components/ui/button"
import { saleStatus } from "@/lib/bitregalo/sales"

export default function SalePage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { id: raw } = use(params)
  const id = BigInt(raw)
  const { address, isConnected } = useAccount()
  const { sale: s, refetch } = useSale(id)
  const rules = useInstanceRules(t.instance)
  const payTokens = useSettlementTokens(t.instance, t.id)
  const projects = useProjects(t.instance)
  const { send, isPending } = useTx()
  const meta = useReadContracts({
    contracts: s ? [
      { address: s.token, abi: abis.utilityToken, functionName: "symbol" },
      { address: s.token, abi: abis.utilityToken, functionName: "name" },
      { address: s.token, abi: abis.utilityToken, functionName: "decimals" },
      { address: s.token, abi: abis.erc20, functionName: "balanceOf", args: [address ?? t.instance] },
    ] : [],
    query: { enabled: !!s, refetchInterval: 10_000 },
  })
  const [symbol, name, decRaw, myTokens] = (meta.data ?? []).map((r) => r.result) as [string?, string?, number?, bigint?]
  const decimals = Number(decRaw ?? 18)
  const mine = useReadContract({ address: t.instance, abi: abis.instance, functionName: "purchased", args: [id, address ?? t.instance], query: { enabled: !!address, refetchInterval: 10_000 } })
  const pay = s ? payTokens.all.find((x) => x.address.toLowerCase() === s.payToken.toLowerCase()) : undefined
  const erc = useErc20(s && s.price > 0n ? s.payToken : undefined, address)
  const [qty, setQty] = useState("1")
  if (!s) return <p className="text-sm text-muted-foreground">Loading sale #{raw}…</p>
  if (/^0x0{40}$/.test(s.token)) return <p className="text-sm text-muted-foreground">No sale #{raw} here.</p>
  const sym = symbol ?? "tokens"
  const st = saleStatus(s)
  const qtyUnits = Number(qty) > 0 ? parseUnits(qty, decimals) : 0n
  const cost = (s.price * qtyUnits) / s.unit
  const fee = (cost * BigInt(rules.feeBps)) / 10_000n
  const total = cost + (pay?.serviceFee ?? 0n)
  const bought = (mine.data as bigint | undefined) ?? 0n
  const overLimit = s.maxPerBuyer !== 0n && bought + qtyUnits > s.maxPerBuyer
  const overStock = qtyUnits > s.remaining
  const canBuy = st.label === "on sale" && isConnected && qtyUnits > 0n && !overLimit && !overStock && (s.price === 0n || erc.balance >= total)
  const label = decodeLabel(s.metaHash)
  const proj = projects.list.find((p) => p.id === s.projectId)
  async function buy() {
    if (s!.price > 0n && erc.allowance < total) await send(`Allow the vault to move ${pay?.symbol ?? ""}`, { address: s!.payToken, abi: abis.erc20, functionName: "approve", args: [t.vault, maxUint256] })
    await send(`Buy ${qty} ${sym}`, { address: t.instance, abi: abis.instance, functionName: "buy", args: [id, qtyUnits] })
    refetch(); erc.refetch(); meta.refetch(); mine.refetch()
  }
  const when = (ts: bigint) => new Date(Number(ts) * 1000).toLocaleString()
  return (
    <div className="space-y-6">
      <div>
        <Link href={`${base}/sales`} className="bq-label hover:text-foreground">← Shop</Link>
        <PageHead eyebrow={`Sale #${raw}`} title={label ?? `${name ?? sym}`} intro={label ? `${name ?? ""} (${sym})` : undefined} action={<Pill tone={st.tone}>{st.label}</Pill>} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="Buy">
          {st.label !== "on sale" && <p className="text-sm text-muted-foreground">This sale is {st.label}.</p>}
          {st.label === "on sale" && (
            <div className="grid gap-4">
              <Label title={`How many ${sym}`} hint={s.maxPerBuyer !== 0n ? `Limit ${formatUnits(s.maxPerBuyer, decimals)} per buyer; you have bought ${formatUnits(bought, decimals)}.` : undefined}>
                <input className={`${input} bq-mono max-w-48`} type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} />
              </Label>
              {s.price > 0n && pay && (
                <Note>
                  Cost <Amount value={cost} decimals={pay.decimals} symbol={pay.symbol} />
                  {pay.serviceFee > 0n && <> + <Amount value={pay.serviceFee} decimals={pay.decimals} symbol={pay.symbol} /> service fee</>}
                  {" "}= <b><Amount value={total} decimals={pay.decimals} symbol={pay.symbol} /></b>. The seller receives <Amount value={cost - fee} decimals={pay.decimals} symbol={pay.symbol} /> after the {rules.feeBps / 100}% platform fee.
                  {address && <> Your balance: <Amount value={erc.balance} decimals={pay.decimals} symbol={pay.symbol} />.</>}
                  {address && erc.balance < total && <strong className="text-destructive"> Not enough {pay.symbol}.</strong>}
                </Note>
              )}
              {s.price === 0n && <Note>Free. You only sign the transaction.</Note>}
              {overLimit && <p className="text-xs text-destructive">That would exceed the per-buyer limit.</p>}
              {overStock && <p className="text-xs text-destructive">Only <Amount value={s.remaining} decimals={decimals} /> left.</p>}
              <div><Button disabled={!canBuy || isPending} onClick={buy}>{s.price > 0n ? `Pay and receive ${qty || "…"} ${sym}` : `Claim ${qty || "…"} ${sym}`}</Button>{!isConnected && <p className="mt-2 text-xs text-muted-foreground">Connect a wallet to buy.</p>}</div>
            </div>
          )}
          {address && <p className="mt-5 text-xs text-muted-foreground">You hold <Amount value={myTokens ?? 0n} decimals={decimals} symbol={sym} />. <Link className="underline-offset-2 hover:underline" href={`${base}/tokens/${s.token}`}>Open the token</Link> to send or redeem it.</p>}
        </Card>
        <Card title="Details">
          <dl className="divide-y divide-border text-sm">
            {([
              ["Price", s.price === 0n ? "free" : pay ? <><Amount value={s.price} decimals={pay.decimals} symbol={pay.symbol} /> per {sym}</> : "…"],
              ["Left", <><Amount value={s.remaining} decimals={decimals} /> of <Amount value={s.remaining + s.sold} decimals={decimals} /></>],
              ["Per buyer", s.maxPerBuyer === 0n ? "no limit" : <Amount value={s.maxPerBuyer} decimals={decimals} />],
              ["Opens", s.start === 0n ? "immediately" : when(s.start)],
              ["Closes", s.end === 0n ? "when sold out or closed" : when(s.end)],
              ["Token", <a key="t" className="bq-mono text-xs underline-offset-2 hover:underline" href={explorerAddress(s.token)} target="_blank" rel="noreferrer">{short(s.token)}</a>],
              ["Project", s.projectId > 0n ? `#${String(s.projectId)}${proj?.label ? ` · ${proj.label}` : ""}` : "—"],
              ["Money goes to", t.treasury ? <Link key="tr" className="bq-mono text-xs underline-offset-2 hover:underline" href={`${base}/treasury`}>workspace treasury {short(t.treasury)}</Link> : "workspace treasury"],
            ] as [string, React.ReactNode][]).map(([k, v]) => <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[110px_1fr]"><dt className="text-xs text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </Card>
      </div>
    </div>
  )
}
