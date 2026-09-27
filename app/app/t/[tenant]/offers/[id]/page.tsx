"use client"
import { useTenant } from "@/lib/bitregalo/tenant"
import { use } from "react"
import { useAccount } from "wagmi"
import { maxUint256 } from "viem"
import { useOffer, useTx, useErc20, useTokenCfg } from "@/lib/bitregalo/hooks"
import { abis, OFFER_STATE, SETTLEMENT } from "@/lib/bitregalo/config"
import { Card, Addr, Pill, Amount } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

export default function OfferDetail({ params }: { params: Promise<{ id: string }> }) {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { id: raw } = use(params)
  const id = BigInt(raw)
  const { address, isConnected } = useAccount()
  const { offer, refetch } = useOffer(id)
  const { send, isPending } = useTx()
  const paid = !!offer && offer.settlement !== 0
  const erc = useErc20(paid ? offer!.token : undefined, address)
  const cfg = useTokenCfg(paid ? offer!.token : undefined)
  if (!offer) return <p className="text-sm text-muted-foreground">Loading offer #{raw}…</p>
  const isSupplier = !!address && address.toLowerCase() === offer.supplier.toLowerCase()
  const listed = offer.state === 1
  const designated = !/^0x0{40}$/.test(offer.designatedBuyer)
  const canConfirm = listed && isConnected && !isSupplier && (!designated || address!.toLowerCase() === offer.designatedBuyer.toLowerCase())

  async function confirm() {
    if (paid) {
      const need = offer!.amount + (cfg?.[2] ?? 0n)
      if (erc.allowance < need) await send("Approve vault", { address: offer!.token, abi: abis.erc20, functionName: "approve", args: [t.vault, maxUint256] })
    }
    await send("Confirm offer", { address: t.instance, abi: abis.instance, functionName: "confirmOffer", args: [id] })
    refetch(); erc.refetch()
  }
  async function withdraw() {
    await send("Withdraw offer", { address: t.instance, abi: abis.instance, functionName: "withdrawOffer", args: [id] })
    refetch()
  }
  return (
    <Card title={`Offer #${raw}`}>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Pill tone={listed ? "accent" : offer.state === 2 ? "good" : "muted"}>{OFFER_STATE[offer.state]}</Pill>
        <span>{SETTLEMENT[offer.settlement]}</span>
        <span className="text-muted-foreground">supplier <Addr a={offer.supplier} /></span>
        {paid && <span><Amount value={offer.amount} decimals={erc.decimals} symbol={erc.symbol} /></span>}
        <span className="text-muted-foreground">{Number(offer.timeframe) / 86400} days</span>
        {designated && <span className="text-muted-foreground">for <Addr a={offer.designatedBuyer} /></span>}
        {offer.state === 2 && <span className="text-muted-foreground">buyer <Addr a={offer.buyer} /></span>}
        {offer.state === 2 && offer.settlement === 2 && offer.settlementId > 0n && <a className="text-accent underline-offset-2 hover:underline" href={`${base}/escrows/${offer.settlementId}`}>escrow #{String(offer.settlementId)}</a>}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {canConfirm && <Button disabled={isPending} onClick={confirm}>{offer.settlement === 2 ? "Confirm and fund escrow" : offer.settlement === 1 ? "Confirm and pay" : "Confirm"}</Button>}
        {listed && isSupplier && <Button variant="secondary" disabled={isPending} onClick={withdraw}>Withdraw offer</Button>}
        {listed && designated && !canConfirm && isConnected && !isSupplier && <p className="text-xs text-muted-foreground">Only the designated buyer can confirm this offer.</p>}
      </div>
      {canConfirm && paid && <p className="mt-3 text-xs text-muted-foreground">Confirming pulls the price plus the service fee ({cfg ? <Amount value={cfg[2]} decimals={erc.decimals} symbol={erc.symbol} /> : "…"}) from your wallet; balance <Amount value={erc.balance} decimals={erc.decimals} symbol={erc.symbol} />.</p>}
    </Card>
  )
}
