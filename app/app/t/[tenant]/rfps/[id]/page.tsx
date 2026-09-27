"use client"
import { useTenant } from "@/lib/bitregalo/tenant"
import { use, useState } from "react"
import { useAccount } from "wagmi"
import { parseUnits, maxUint256 } from "viem"
import { useRfp, useTx, useErc20, useTokenCfg } from "@/lib/bitregalo/hooks"
import { abis, RFP_STATE, SETTLEMENT } from "@/lib/bitregalo/config"
import { Card, Addr, Pill, Amount, Field, inputCls, timeLeft } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

export default function RfpDetail({ params }: { params: Promise<{ id: string }> }) {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { id: raw } = use(params)
  const id = BigInt(raw)
  const { address, isConnected } = useAccount()
  const { rfp, bids, refetch } = useRfp(id)
  const { send, isPending } = useTx()
  const paid = !!rfp && rfp.settlement !== 0
  const erc = useErc20(paid ? rfp!.token : undefined, address)
  const cfg = useTokenCfg(paid ? rfp!.token : undefined)
  const [amount, setAmount] = useState("")
  const [days, setDays] = useState("14")
  if (!rfp) return <p className="text-sm text-muted-foreground">Loading RFP #{raw}…</p>
  const isRequester = !!address && address.toLowerCase() === rfp.requester.toLowerCase()
  const open = rfp.state === 1

  async function bid(e: React.FormEvent) {
    e.preventDefault()
    const amt = paid ? parseUnits(amount || "0", erc.decimals) : 0n
    await send("Submit bid", { address: t.instance, abi: abis.instance, functionName: "bid", args: [id, amt, BigInt(Number(days) * 86400)] })
    refetch()
  }
  async function award(bidId: bigint, amt: bigint) {
    if (paid) {
      const need = amt + (cfg?.[2] ?? 0n)
      if (erc.allowance < need) {
        await send("Approve vault", { address: rfp!.token, abi: abis.erc20, functionName: "approve", args: [t.vault, maxUint256] })
      }
    }
    await send("Award bid", { address: t.instance, abi: abis.instance, functionName: "acceptBid", args: [id, bidId] })
    refetch(); erc.refetch()
  }
  return (
    <div className="space-y-6">
      <Card title={`RFP #${raw}`}>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Pill tone={open ? "accent" : rfp.state === 2 ? "good" : "muted"}>{RFP_STATE[rfp.state]}</Pill>
          <span>{SETTLEMENT[rfp.settlement]}</span>
          <span className="text-muted-foreground">requester <Addr a={rfp.requester} /></span>
          <span className="text-muted-foreground">deadline {timeLeft(rfp.deadline)}</span>
          {paid && <span className="text-muted-foreground">token {erc.symbol} <Addr a={rfp.token} /></span>}
          {rfp.state === 2 && rfp.settlementId > 0n && rfp.settlement === 2 && <a className="text-accent underline-offset-2 hover:underline" href={`${base}/escrows/${rfp.settlementId}`}>escrow #{String(rfp.settlementId)}</a>}
        </div>
        <p className="mt-3 font-mono text-xs text-muted-foreground">scope hash {rfp.scopeHash}</p>
      </Card>
      <Card title={`Bids (${bids.length})`}>
        {bids.length === 0 && <p className="text-sm text-muted-foreground">No bids yet.</p>}
        <div className="divide-y divide-border">
          {bids.map((b) => (
            <div key={String(b.id)} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3 text-sm">
              <span className="font-mono text-xs text-muted-foreground">#{String(b.id)}</span>
              <span><Addr a={b.provider} /> · {paid ? <Amount value={b.amount} decimals={erc.decimals} symbol={erc.symbol} /> : "no payment"} · {Number(b.timeframe) / 86400} days{b.withdrawn && " · withdrawn"}{rfp.acceptedBid === b.id && " · ✓ awarded"}</span>
              {open && isRequester && !b.withdrawn && <Button size="sm" disabled={isPending} onClick={() => award(b.id, b.amount)}>Award</Button>}
            </div>
          ))}
        </div>
      </Card>
      {open && !isRequester && (
        <Card title="Submit a bid">
          <form onSubmit={bid} className="grid max-w-md gap-4">
            {paid && <Field label={`Amount (${erc.symbol})`}><input className={inputCls} type="number" min="0" step="any" required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>}
            <Field label="Delivery time frame (days)" hint={rfp.settlement === 2 ? "Becomes the escrow term on award (1 h – 365 d)." : undefined}>
              <input className={inputCls} type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
            </Field>
            <div><Button type="submit" disabled={!isConnected || isPending}>{isConnected ? "Submit bid" : "Connect a wallet to bid"}</Button></div>
          </form>
        </Card>
      )}
      {open && isRequester && paid && (
        <p className="text-xs text-muted-foreground">
          Awarding pulls the bid amount plus the service fee ({cfg ? <Amount value={cfg[2]} decimals={erc.decimals} symbol={erc.symbol} /> : "…"}) from your wallet; your balance is <Amount value={erc.balance} decimals={erc.decimals} symbol={erc.symbol} />.
        </p>
      )}
    </div>
  )
}
