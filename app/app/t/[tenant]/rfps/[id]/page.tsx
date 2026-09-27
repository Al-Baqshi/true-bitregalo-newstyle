"use client"
import { use, useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { parseUnits, maxUint256, type Hex } from "viem"
import { EyeOff } from "lucide-react"
import { decodeLabel } from "@/lib/bitregalo/instances"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useRfp, useTx, useErc20, useTokenCfg } from "@/lib/bitregalo/hooks"
import { abis } from "@/lib/bitregalo/config"
import { Card, Addr, Pill, Amount } from "@/components/app/ui"
import { Journey, when, inWords, type JourneyStep } from "@/components/app/journey"
import { input, Label } from "@/components/app/wizard/fields"
import { ConnectButton } from "@/components/app/connect-button"
import { Button } from "@/components/ui/button"

const MODE = [
  { name: "Just record it", pill: "Record only", after: "Nothing is paid on-chain; the choice itself is the record." },
  { name: "Pay straight away", pill: "Direct payment", after: "The supplier is paid from the requester's wallet the moment an offer is chosen." },
  { name: "Hold it safely", pill: "Escrow", after: "When an offer is chosen, its price is locked in the workspace vault until the requester releases it." },
]

function duration(s: bigint) {
  const n = Number(s)
  if (n < 86400) return `${Math.max(1, Math.round(n / 3600))} hour${Math.round(n / 3600) === 1 ? "" : "s"}`
  const d = Math.round((n / 86400) * 10) / 10
  return `${d} day${d === 1 ? "" : "s"}`
}

export default function RequestPage({ params }: { params: Promise<{ id: string }> }) {
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
  if (!rfp) return <p className="text-sm text-muted-foreground">Loading request #{raw}…</p>

  const title = decodeLabel(rfp.scopeHash as Hex)
  const mode = MODE[rfp.settlement]
  const isRequester = !!address && address.toLowerCase() === rfp.requester.toLowerCase()
  const open = rfp.state === 1
  const awarded = rfp.state === 2
  const closedForOffers = Number(rfp.deadline) <= Date.now() / 1000
  const liveBids = bids.filter((b) => !b.withdrawn)
  const serviceFee = cfg?.[2] ?? 0n

  const journey: JourneyStep[] = [
    { title: "Posted", note: `by ${isRequester ? "you" : rfp.requester.slice(0, 8) + "…"}`, state: "done" },
    { title: "Taking offers", note: open ? (closedForOffers ? `Closed ${inWords(rfp.deadline)} — you can still choose` : `Until ${when(rfp.deadline)} (${inWords(rfp.deadline)})`) : `Closed`, state: open && !closedForOffers ? "current" : "done" },
    { title: "Offer chosen", note: awarded ? `Offer #${String(rfp.acceptedBid)}` : rfp.state === 3 ? "Request withdrawn" : "Requester picks one", state: awarded ? "done" : rfp.state === 3 ? "skipped" : open && closedForOffers ? "current" : "next" },
    {
      title: rfp.settlement === 2 ? "Money held in escrow" : rfp.settlement === 1 ? "Supplier paid" : "Recorded",
      note: awarded ? (rfp.settlement === 2 ? `Escrow #${String(rfp.settlementId)} — released when the work is done` : rfp.settlement === 1 ? "Paid in full on choosing" : "No payment on-chain") : mode.after,
      state: awarded ? "done" : rfp.state === 3 ? "skipped" : "next",
    },
  ]

  async function sendOffer(e: React.FormEvent) {
    e.preventDefault()
    await send("Send offer", { address: t.instance, abi: abis.instance, functionName: "bid", args: [id, paid ? parseUnits(amount || "0", erc.decimals) : 0n, BigInt(Math.round(Number(days) * 86400))] })
    setAmount(""); refetch()
  }
  async function choose(bidId: bigint, amt: bigint) {
    if (paid && erc.allowance < amt + serviceFee) {
      await send("Allow the vault to take the payment", { address: rfp!.token, abi: abis.erc20, functionName: "approve", args: [t.vault, maxUint256] })
    }
    await send("Choose offer", { address: t.instance, abi: abis.instance, functionName: "acceptBid", args: [id, bidId] })
    refetch(); erc.refetch()
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`${base}/rfps`} className="bq-label hover:text-foreground">← All requests</Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill tone={open ? "accent" : awarded ? "good" : "muted"}>{open ? "Taking offers" : awarded ? "Offer chosen" : "Withdrawn"}</Pill>
          <Pill>{mode.pill}</Pill>
          {paid && <Pill>paid in {erc.symbol}</Pill>}
        </div>
        <h1 className="bq-display mt-3 text-3xl font-semibold sm:text-4xl">{title ?? <span className="inline-flex items-center gap-3"><EyeOff className="size-7 text-muted-foreground" />Hidden title</span>}</h1>
        {!title && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">The requester chose to keep the wording off the blockchain; only a fingerprint of it is stored, so they can prove later what they asked for. Who posted it, the offers and any payment are still public.</p>}
      </div>

      <Card><Journey steps={journey} /></Card>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title={`Offers received (${liveBids.length})`}>
          {liveBids.length === 0 && <p className="text-sm text-muted-foreground">No offers yet. {isRequester ? "Share this page with suppliers you'd like to hear from." : ""}</p>}
          <div className="divide-y divide-border">
            {bids.map((b) => {
              const chosen = awarded && rfp.acceptedBid === b.id
              return (
                <div key={String(b.id)} className={`flex flex-wrap items-center justify-between gap-3 py-4 ${b.withdrawn ? "opacity-50" : ""}`}>
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{paid ? <Amount value={b.amount} decimals={erc.decimals} symbol={erc.symbol} /> : "No price (record only)"}</span>
                      {chosen && <Pill tone="good">chosen</Pill>}{b.withdrawn && <Pill>withdrawn</Pill>}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">from <Addr a={b.provider} /> · delivers in {duration(b.timeframe)}</div>
                  </div>
                  {open && isRequester && !b.withdrawn && <Button size="sm" disabled={isPending} onClick={() => choose(b.id, b.amount)}>Choose this offer</Button>}
                </div>
              )
            })}
          </div>
        </Card>

        <Card title="What you can do">
          {!isConnected && open && <div className="space-y-3 text-sm text-muted-foreground"><p>Connect a wallet to send an offer or, if this is your request, choose one.</p><ConnectButton /></div>}
          {isConnected && isRequester && open && (
            <div className="space-y-3 text-sm leading-relaxed text-[color:var(--bq-ivory-dim)]">
              <p>This is your request. Choose the offer you want from the list.</p>
              {rfp.settlement === 2 && <p>Choosing moves the offer&apos;s price{serviceFee > 0n ? <> plus a <Amount value={serviceFee} decimals={erc.decimals} symbol={erc.symbol} /> service fee</> : null} from your wallet into the vault. It stays there until <b className="text-foreground">you</b> release it. If you never do, it comes back to you once the supplier&apos;s delivery time is over.</p>}
              {rfp.settlement === 1 && <p>Choosing pays the supplier straight away from your wallet{serviceFee > 0n ? <>, plus a <Amount value={serviceFee} decimals={erc.decimals} symbol={erc.symbol} /> service fee</> : null}.</p>}
              {rfp.settlement === 0 && <p>Choosing only records your decision — no money moves.</p>}
              {paid && <p className="text-xs">Your balance: <Amount value={erc.balance} decimals={erc.decimals} symbol={erc.symbol} /></p>}
              <Button variant="ghost" size="sm" disabled={isPending} onClick={() => send("Withdraw request", { address: t.instance, abi: abis.instance, functionName: "cancelRfp", args: [id] }).then(() => refetch())}>Withdraw this request</Button>
            </div>
          )}
          {isConnected && !isRequester && open && !closedForOffers && (
            <form onSubmit={sendOffer} className="grid gap-4">
              <p className="text-sm text-[color:var(--bq-ivory-dim)]">Send your offer. Once sent it can&apos;t be edited — only withdrawn — so the requester always sees exactly what you offered.</p>
              {paid && <Label title={`Your price (${erc.symbol})`}><input className={`${input} bq-mono`} type="number" min="0" step="any" required value={amount} onChange={(e) => setAmount(e.target.value)} /></Label>}
              <Label title="You can deliver in (days)" hint={rfp.settlement === 2 ? "If chosen, the money is held for this long. If it isn't released by then, it goes back to the requester." : undefined}>
                <input className={`${input} bq-mono`} type="number" min="0.05" step="any" value={days} onChange={(e) => setDays(e.target.value)} />
              </Label>
              <Button type="submit" disabled={isPending}>Send offer</Button>
            </form>
          )}
          {isConnected && !isRequester && open && closedForOffers && <p className="text-sm text-muted-foreground">Offers closed {inWords(rfp.deadline)}. The requester can still choose one of the offers already sent.</p>}
          {awarded && rfp.settlement === 2 && (
            <div className="space-y-3 text-sm text-[color:var(--bq-ivory-dim)]">
              <p>The chosen offer&apos;s money is held in escrow #{String(rfp.settlementId)}.</p>
              <Button asChild size="sm"><Link href={`${base}/escrows/${rfp.settlementId}`}>Open the escrow</Link></Button>
            </div>
          )}
          {awarded && rfp.settlement !== 2 && <p className="text-sm text-muted-foreground">{rfp.settlement === 1 ? "The supplier has been paid. This request is complete." : "The decision is recorded. This request is complete."}</p>}
          {rfp.state === 3 && <p className="text-sm text-muted-foreground">The requester withdrew this request.</p>}
        </Card>
      </div>
    </div>
  )
}
