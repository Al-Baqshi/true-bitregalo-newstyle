"use client"
import { use, useState } from "react"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { formatUnits, parseUnits, type Address } from "viem"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useErc20, useSale, useSaleApproval, useTokenCfg, useTx } from "@/lib/bitregalo/hooks"
import { decodeLabel, useProjects } from "@/lib/bitregalo/instances"
import { useInstanceRules } from "@/lib/bitregalo/instance-rules"
import { abis, addresses } from "@/lib/bitregalo/config"
import { Addr, Amount, Card, Empty, PageHead, Pill, RowsSkeleton, Section } from "@/components/app/ui"
import { Label, input } from "@/components/app/wizard/fields"
import { ConnectButton } from "@/components/app/connect-button"
import { SaleApproval } from "@/components/app/sale-approval"
import { Button } from "@/components/ui/button"
import { FaucetButton } from "@/components/app/faucet"
import { saleStatus } from "@/lib/bitregalo/sales"
import { cn } from "@/lib/utils"

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default function SalePage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTenant()
  const base = t.base
  const { id: raw } = use(params)
  const id = BigInt(raw)
  const { address, isConnected } = useAccount()
  const { sale: s, refetch } = useSale(id)
  const rules = useInstanceRules(t.instance)
  const projects = useProjects(t.instance)
  const { send, isPending } = useTx()
  const meta = useReadContracts({
    contracts: s ? [
      { address: s.token, abi: abis.utilityToken, functionName: "symbol" },
      { address: s.token, abi: abis.utilityToken, functionName: "name" },
      { address: s.token, abi: abis.utilityToken, functionName: "decimals" },
      { address: s.token, abi: abis.erc20, functionName: "balanceOf", args: [address ?? t.instance] },
      { address: t.instance, abi: abis.instance, functionName: "redeemable", args: [s.token] },
      { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tokenInfo", args: [s.token] },
    ] : [],
    query: { enabled: !!s, refetchInterval: 10_000 },
  })
  const [symbol, name, decRaw, myTokens, redeemableNow, info] = (meta.data ?? []).map((r) => r.result) as [string?, string?, number?, bigint?, boolean?, (readonly [bigint, bigint, Address, bigint])?]
  const decimals = Number(decRaw ?? 18)
  const mine = useReadContract({ address: t.instance, abi: abis.instance, functionName: "purchased", args: [id, address ?? t.instance], query: { enabled: !!address, refetchInterval: 10_000 } })
  // What the buyer pays in: its symbol and decimals, the buyer's balance and approval, and this workspace's service fee for it.
  const paid = !!s && s.price > 0n
  const erc = useErc20(paid ? s!.payToken : undefined, address)
  const cfg = useTokenCfg(paid ? s!.payToken : undefined)
  const approval = useSaleApproval(s ? id : undefined, s?.token)
  const [qty, setQty] = useState("1")
  const back = { href: `${base}/shop`, label: "Shop" }

  if (!s) {
    return (
      <div>
        <PageHead back={back} title={`Sale #${raw}`} />
        <Card flush><RowsSkeleton rows={3} /></Card>
      </div>
    )
  }
  if (/^0x0{40}$/.test(s.token)) {
    return (
      <div>
        <PageHead back={back} title={`Sale #${raw}`} />
        <Card flush><Empty title="There is no such sale" body={`Nothing has been put on sale as #${raw} in this workspace.`} action={<Button asChild size="sm" variant="secondary"><Link href={back.href}>Back to the shop</Link></Button>} /></Card>
      </div>
    )
  }

  const sym = symbol ?? "tokens"
  const free = !paid
  const st = saleStatus(s, approval.loaded ? approval.allowance : undefined)
  const onSale = st.label === "on sale"
  const waiting = st.label === "waiting for approval"
  const qtyUnits = Number(qty) > 0 ? parseUnits(qty, decimals) : 0n
  // The contract rounds the cost up, never in the buyer's favour. Same sum here, so the total shown is the total charged.
  const cost = (s.price * qtyUnits + s.unit - 1n) / s.unit
  const fee = (cost * BigInt(rules.feeBps)) / 10_000n
  const serviceFee = cfg?.[2] ?? 0n
  const total = cost + serviceFee
  const feeKnown = free || cfg !== undefined
  const pay = paid ? { symbol: erc.symbol, decimals: erc.decimals } : undefined
  const bought = (mine.data as bigint | undefined) ?? 0n
  const overLimit = s.maxPerBuyer !== 0n && bought + qtyUnits > s.maxPerBuyer
  const overStock = qtyUnits > s.remaining
  const overApproved = approval.loaded && !overStock && qtyUnits > approval.allowance
  const noStock = approval.loaded && !approval.creates && qtyUnits > approval.held
  const insufficient = paid && !!address && feeKnown && erc.balance < total
  const canBuy = onSale && isConnected && feeKnown && approval.loaded && qtyUnits > 0n && !overLimit && !overStock && !overApproved && !noStock && (free || erc.balance >= total)
  const label = decodeLabel(s.metaHash)
  const proj = projects.list.find((p) => p.id === s.projectId)
  const isAdmin = !!address && t.admin.toLowerCase() === address.toLowerCase()
  // Only a token the factory created for this workspace can be made redeemable here.
  const ours = !!info && !/^0x0{40}$/.test(info[2]) && info[0] === t.id
  const reload = () => { refetch(); erc.refetch(); meta.refetch(); mine.refetch(); approval.refetch() }
  async function buy() {
    // Approve exactly what is shown, and tell the contract that total is the most to charge.
    // If the service fee went up in the meantime, the purchase is refused and nothing is charged.
    if (paid && erc.allowance < total) await send(`Allow the vault to take ${formatUnits(total, erc.decimals)} ${erc.symbol}`, { address: s!.payToken, abi: abis.erc20, functionName: "approve", args: [t.vault, total] })
    await send(`Buy ${qty} ${sym}`, { address: t.instance, abi: abis.instance, functionName: "buy", args: [id, qtyUnits, paid ? total : 0n] })
    reload()
  }
  const when = (ts: bigint) => new Date(Number(ts) * 1000).toLocaleString()
  const money = (v: bigint) => (pay ? <Amount value={v} decimals={pay.decimals} symbol={pay.symbol} /> : "…")

  return (
    <div className="space-y-10">
      <PageHead
        back={back}
        title={label ?? (name || sym)}
        intro={
          <>
            {label ? <>{name ? `${name} (${sym})` : sym}. </> : null}
            {free ? "Free to claim: you only sign the transaction." : <>Sold for {money(s.price)} each. The payment goes to the workspace treasury and the {sym} come to your wallet in the same transaction.</>}
          </>
        }
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-12">
        <Card title={free ? "Claim" : "Buy"} action={<Pill tone={st.tone}>{cap(st.label)}</Pill>}>
          {waiting && <p className="text-base text-muted-foreground">This sale is waiting for the treasury owner&apos;s approval. Nothing can be bought until then.</p>}
          {!onSale && !waiting && <p className="text-base text-muted-foreground">This sale is {st.label}. Nothing can be bought here right now.</p>}
          {onSale && (
            <div className="grid gap-6">
              <Label
                title={`How many ${sym}`}
                hint={s.maxPerBuyer !== 0n ? `Up to ${formatUnits(s.maxPerBuyer, decimals)} per buyer. You have bought ${formatUnits(bought, decimals)} so far.` : `${formatUnits(s.remaining, decimals)} left.`}
              >
                <input className={cn(input, "max-w-48")} type="number" inputMode="decimal" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} />
              </Label>

              <dl className="divide-y divide-border text-base">
                {!free && (
                  <>
                    <Line label="Price each">{money(s.price)}</Line>
                    <Line label="Quantity"><span className="t-num">{qty || "0"} {sym}</span></Line>
                    <Line label="Cost">{money(cost)}</Line>
                    <Line label="Service fee" hint="A flat amount per payment, paid by the buyer.">{feeKnown ? money(serviceFee) : "…"}</Line>
                    <Line label="Total you pay" strong>{feeKnown ? money(total) : "…"}</Line>
                  </>
                )}
                <Line label="You receive" strong><span className="t-num">{qty || "0"} {sym}</span></Line>
              </dl>

              {!free && pay && (
                <p className="max-w-[62ch] text-sm text-muted-foreground">
                  The organisation receives {money(cost - fee)} after the {rules.feeBps / 100}% platform fee.
                  {address && <> Your balance: <Amount value={erc.balance} decimals={pay.decimals} symbol={pay.symbol} />.</>}
                </p>
              )}

              {!free && (
                <p className="max-w-[62ch] text-sm text-muted-foreground">
                  Your wallet first approves exactly this total, then pays it. If a fee changes before your payment confirms, the purchase is refused and nothing is charged.
                </p>
              )}

              {(insufficient || overLimit || overStock || overApproved || noStock) && (
                <div className="space-y-1 text-sm text-destructive" role="status">
                  {insufficient && <p>Not enough {pay?.symbol ?? "balance"} in your wallet for this quantity.</p>}
                  {overLimit && <p>That is more than the limit per buyer.</p>}
                  {overStock && <p>Only <Amount value={s.remaining} decimals={decimals} /> left.</p>}
                  {overApproved && <p>Only <Amount value={approval.allowance} decimals={decimals} /> are approved for sale right now.</p>}
                  {noStock && !overApproved && <p>The treasury holds only <Amount value={approval.held} decimals={decimals} /> right now.</p>}
                </div>
              )}
              {insufficient && s.payToken.toLowerCase() === (addresses.testStable ?? "").toLowerCase() && <div><FaucetButton onDone={() => erc.refetch()} /></div>}

              <div className="flex flex-wrap items-center gap-3">
                {isConnected ? (
                  <Button disabled={!canBuy || isPending} onClick={buy}>{!free ? `Pay and receive ${qty || "…"} ${sym}` : `Claim ${qty || "…"} ${sym}`}</Button>
                ) : (
                  <>
                    <ConnectButton />
                    <p className="text-sm text-muted-foreground">Connect a wallet to {free ? "claim" : "buy"}.</p>
                  </>
                )}
              </div>
            </div>
          )}
          {address && (
            <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
              You hold <Amount value={myTokens ?? 0n} decimals={decimals} symbol={sym} />. <Link className="underline decoration-1 underline-offset-[3px] hover:text-foreground" href={`${base}/tokens/${s.token}`}>Open the token</Link> to send or redeem it.
            </p>
          )}
        </Card>

        <Section title="Details">
          <dl className="space-y-4">
            <Detail label="Status">{cap(st.label)}</Detail>
            <Detail label="Approved for sale">{!approval.loaded ? "…" : approval.allowance === 0n ? "Waiting for the treasury owner's approval" : <><Amount value={approval.allowance} decimals={decimals} /> approved</>}</Detail>
            <Detail label="Stock">{!approval.loaded ? "…" : approval.creates ? "The treasury creates them as they sell" : <>The treasury holds <Amount value={approval.held} decimals={decimals} /></>}</Detail>
            <Detail label="Price">{free ? "Free" : <>{money(s.price)} per {sym}</>}</Detail>
            <Detail label="Left"><Amount value={s.remaining} decimals={decimals} /> of <Amount value={s.remaining + s.sold} decimals={decimals} /></Detail>
            <Detail label="Limit per buyer">{s.maxPerBuyer === 0n ? "No limit" : <Amount value={s.maxPerBuyer} decimals={decimals} />}</Detail>
            <Detail label="Opens">{s.start === 0n ? "Straight away" : when(s.start)}</Detail>
            <Detail label="Closes">{s.end === 0n ? "When sold out or closed" : when(s.end)}</Detail>
            <Detail label="Token"><Addr a={s.token} /></Detail>
            {s.projectId > 0n && <Detail label="Project">#{String(s.projectId)}{proj?.label ? ` · ${proj.label}` : ""}</Detail>}
            <Detail label="Payment goes to">
              {t.treasury ? <Link className="underline decoration-1 underline-offset-[3px] hover:text-foreground" href={`${base}/treasury`}>The workspace treasury</Link> : "The workspace treasury"}
            </Detail>
          </dl>
        </Section>
      </div>

      <Card title="Approval by the treasury's owner" description="The tokens are handed out from the workspace treasury, so its owner approves each sale and how many it may sell.">
        <SaleApproval id={id} sale={s} onChange={reload} />
      </Card>

      {isAdmin && (
        <Card title={`Redeeming ${sym}`} description="A separate choice from selling. Opening a sale does not switch it on.">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <p className="max-w-[56ch] text-base">
              {redeemableNow
                ? <>Holders can hand {sym} back to the workspace treasury with a reference, at no fee.</>
                : ours
                  ? <>Holders cannot redeem {sym} yet. Switch it on if buying {sym} should give people something to hand back, such as a voucher or a ticket.</>
                  : <>This token was not created for this workspace, so it cannot be made redeemable here.</>}
            </p>
            {ours && !redeemableNow && (
              <Button variant="secondary" disabled={isPending} onClick={() => send(`Let holders redeem ${sym}`, { address: t.instance, abi: abis.instance, functionName: "setRedeemable", args: [s.token, true] }).then(reload)}>Let holders redeem {sym}</Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

/** One line of the buying statement: a label on the left, the figure on the right. */
function Line({ label, hint, strong, children }: { label: string; hint?: string; strong?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className={cn("min-w-0", strong ? "font-semibold" : "text-muted-foreground")}>
        {label}
        {hint && <span className="mt-0.5 block text-xs text-subtle">{hint}</span>}
      </dt>
      <dd className={cn("shrink-0 text-right", strong ? "t-num text-lg font-[620]" : "font-[520]")}>{children}</dd>
    </div>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 wrap-break-word text-base font-[520]">{children}</dd>
    </div>
  )
}
