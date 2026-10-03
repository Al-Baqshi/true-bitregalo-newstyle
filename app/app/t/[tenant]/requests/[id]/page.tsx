"use client"
import { use, useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { parseUnits, maxUint256, type Hex } from "viem"
import { decodeLabel } from "@/lib/bitregalo/instances"
import { categoryLabel, useEntry } from "@/lib/bitregalo/market"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useRfp, useTx, useErc20, useTokenCfg } from "@/lib/bitregalo/hooks"
import { abis, short } from "@/lib/bitregalo/config"
import { Addr, Amount, Card, Empty, Fact, Facts, Notice, PageHead, Pill, RowsSkeleton, Section } from "@/components/app/ui"
import { Journey, when, inWords, type JourneyStep } from "@/components/app/journey"
import { input, Label } from "@/components/app/wizard/fields"
import { ConnectButton } from "@/components/app/connect-button"
import { Button } from "@/components/ui/button"
import { EditDetailsButton, EntryDescription, OwnerDetails, titleProof } from "@/components/app/market/record-details"
import { placeOf } from "@/components/app/market/words"
import { cn } from "@/lib/utils"

const MODE = [
  { name: "Just record it", pill: "Record only", after: "Nothing is paid on-chain; the choice itself is the record." },
  { name: "Pay straight away", pill: "Direct payment", after: "The supplier is paid from the buyer's wallet the moment an offer is chosen." },
  { name: "Hold it safely", pill: "Escrow", after: "When an offer is chosen, its price is locked in the workspace vault until the buyer releases it." },
]

function duration(s: bigint) {
  const n = Number(s)
  if (n < 86400) return `${Math.max(1, Math.round(n / 3600))} hour${Math.round(n / 3600) === 1 ? "" : "s"}`
  const d = Math.round((n / 86400) * 10) / 10
  return `${d} day${d === 1 ? "" : "s"}`
}

export default function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTenant()
  const base = t.base
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
  const [editing, setEditing] = useState(false)
  // Title, description, category and place, signed by the requester, from the marketplace index.
  const { data: entry } = useEntry(t.id, "request", id)
  const back = { href: `${base}/requests`, label: "All requests" }

  if (!rfp) {
    return (
      <div>
        <PageHead back={back} title={`Request #${raw}`} />
        <Card flush><RowsSkeleton rows={3} /></Card>
      </div>
    )
  }
  if (/^0x0{40}$/.test(rfp.requester)) {
    return (
      <div>
        <PageHead back={back} title={`Request #${raw}`} />
        <Card flush><Empty title="There is no such request" body={`Nothing has been posted as request #${raw} in this workspace.`} action={<Button asChild size="sm" variant="secondary"><Link href={back.href}>All requests</Link></Button>} /></Card>
      </div>
    )
  }

  const onChainTitle = decodeLabel(rfp.scopeHash as Hex)
  const title = entry?.title ?? onChainTitle
  const proof = titleProof(entry, rfp.scopeHash as Hex)
  const place = placeOf(entry)
  const mode = MODE[rfp.settlement]
  const isRequester = !!address && address.toLowerCase() === rfp.requester.toLowerCase()
  const open = rfp.state === 1
  const awarded = rfp.state === 2
  const closedForOffers = Number(rfp.deadline) <= Date.now() / 1000
  const liveBids = bids.filter((b) => !b.withdrawn)
  const serviceFee = cfg?.[2] ?? 0n
  const canChoose = open && isRequester
  const fee = serviceFee > 0n ? <Amount value={serviceFee} decimals={erc.decimals} symbol={erc.symbol} /> : null

  const journey: JourneyStep[] = [
    { title: "Posted", note: `by ${isRequester ? "you" : short(rfp.requester)}`, state: "done" },
    { title: "Taking offers", note: open ? (closedForOffers ? `Closed ${inWords(rfp.deadline)}. An offer can still be chosen` : `Until ${when(rfp.deadline)} (${inWords(rfp.deadline)})`) : `Closed`, state: open && !closedForOffers ? "current" : "done" },
    { title: "Offer chosen", note: awarded ? `Offer #${String(rfp.acceptedBid)}` : rfp.state === 3 ? "Request withdrawn" : "The buyer picks one", state: awarded ? "done" : rfp.state === 3 ? "skipped" : open && closedForOffers ? "current" : "next" },
    {
      title: rfp.settlement === 2 ? "Payment held in escrow" : rfp.settlement === 1 ? "Supplier paid" : "Recorded",
      note: awarded ? (rfp.settlement === 2 ? `Escrow #${String(rfp.settlementId)}, released when the work is done` : rfp.settlement === 1 ? "Paid in full on choosing" : "No payment on-chain") : mode.after,
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

  // Offers line up in columns so prices and delivery times can be compared at a glance.
  const cols = canChoose
    ? (paid ? "sm:grid-cols-[minmax(0,1fr)_7rem_9rem_10rem]" : "sm:grid-cols-[minmax(0,1fr)_7rem_10rem]")
    : (paid ? "sm:grid-cols-[minmax(0,1fr)_7rem_9rem]" : "sm:grid-cols-[minmax(0,1fr)_7rem]")

  return (
    <div className="space-y-10">
      <PageHead
        back={back}
        title={title ?? `Request #${raw}`}
        intro={
          <>
            {title ? <>Request #{raw}.{proof ? <> {proof}</> : null}</> : <>The wording is kept private: only a fingerprint of it is on the blockchain, so the buyer can prove later what they asked for. Who posted it, the offers and any payment are still public.</>}
          </>
        }
        action={<EditDetailsButton isOwner={isRequester} entry={entry} editing={editing} onEdit={() => setEditing(true)} />}
      />

      <EntryDescription entry={entry} />

      <Facts columns={4}>
        <Fact label="Status"><Pill tone={open ? "accent" : awarded ? "good" : "muted"}>{open ? (closedForOffers ? "Choosing" : "Taking offers") : awarded ? "Offer chosen" : "Withdrawn"}</Pill></Fact>
        <Fact label="Asked by">{isRequester ? <>You (<Addr a={rfp.requester} />)</> : <Addr a={rfp.requester} />}</Fact>
        <Fact label="How it settles">
          {mode.name}
          <span className="block text-sm font-normal text-muted-foreground">{mode.pill}{paid ? `, in ${erc.symbol}` : ""}</span>
        </Fact>
        <Fact label={closedForOffers ? "Offers closed" : "Offers close"}>{when(rfp.deadline)}</Fact>
        {entry && <Fact label="Category">{categoryLabel(entry.category)}</Fact>}
        {place && <Fact label="Where">{place}</Fact>}
      </Facts>

      <OwnerDetails kind="request" recordId={id} entry={entry} isOwner={isRequester} editing={editing} setEditing={setEditing} initialTitle={onChainTitle ?? undefined} wordingHidden={!onChainTitle} />

      <Card><Journey steps={journey} /></Card>

      <Section
        title={`Offers (${liveBids.length})`}
        description={!paid ? "This request is record only, so offers carry no price: just a delivery time." : undefined}
      >
        <div className="space-y-4">
          {canChoose && (
            <Notice tone="accent" title="This is your request">
              <p>
                {rfp.settlement === 2 && <>Choosing an offer moves its price{fee && <> plus a {fee} service fee</>} from your wallet into the vault. It stays there until you release it. If you never do, once the supplier&apos;s delivery time is over it can only go back to you.</>}
                {rfp.settlement === 1 && <>Choosing an offer pays the supplier straight away from your wallet{fee && <>, plus a {fee} service fee</>}.</>}
                {rfp.settlement === 0 && <>Choosing an offer only records your decision. Nothing is paid.</>}
                {paid && <> Your balance: <Amount value={erc.balance} decimals={erc.decimals} symbol={erc.symbol} />.</>}
              </p>
            </Notice>
          )}

          <Card flush>
            {bids.length === 0 && (
              <Empty
                title="No offers yet"
                body={isRequester ? "Share this page with the suppliers you would like to hear from." : open && !closedForOffers ? "Be the first to make one." : "Nobody made an offer on this request."}
              />
            )}
            {bids.length > 0 && (
              <>
                <div className={cn("hidden border-b border-border px-6 py-2.5 text-sm text-muted-foreground sm:grid sm:items-center sm:gap-x-4", cols)} aria-hidden>
                  <span>Offer</span>
                  <span>Delivers in</span>
                  {paid && <span className="text-right">Price</span>}
                  {canChoose && <span />}
                </div>
                <ul>
                  {bids.map((b) => {
                    const chosen = awarded && rfp.acceptedBid === b.id
                    const mine = !!address && address.toLowerCase() === b.provider.toLowerCase()
                    const dim = b.withdrawn
                    return (
                      <li
                        key={String(b.id)}
                        className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:border-b-0 sm:px-6", cols, chosen && "bg-success-fill/50")}
                      >
                        <div className="min-w-0">
                          <div className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base font-[560]", dim && "text-subtle")}>
                            Offer #{String(b.id)}
                            {chosen && <Pill tone="good">Chosen</Pill>}
                            {b.withdrawn && <Pill>Withdrawn</Pill>}
                          </div>
                          <div className="mt-0.5 text-sm text-muted-foreground">From <Addr a={b.provider} />{mine && " (you)"}</div>
                        </div>
                        <div className={cn("t-num text-sm sm:order-0 sm:col-span-1 sm:text-base", paid ? "order-3 col-span-2" : "order-2 text-right", dim ? "text-subtle" : paid ? "text-muted-foreground sm:text-foreground" : "")}>
                          <span className="sm:hidden">Delivers in </span>{duration(b.timeframe)}
                        </div>
                        {paid && (
                          <div className={cn("order-2 text-right text-base font-[560] sm:order-0", dim && "text-subtle line-through")}>
                            <Amount value={b.amount} decimals={erc.decimals} symbol={erc.symbol} />
                          </div>
                        )}
                        {canChoose && (
                          <div className="order-4 col-span-2 sm:order-0 sm:col-span-1 sm:text-right">
                            {!b.withdrawn && <Button size="sm" variant="secondary" className="w-full sm:w-auto" disabled={isPending} onClick={() => choose(b.id, b.amount)}>Choose this offer</Button>}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </Card>
        </div>
      </Section>

      {!isConnected && open && (
        <Notice tone="accent" title="Connect a wallet to take part" action={<ConnectButton />}>
          <p>Make an offer or, if this is your request, choose one.</p>
        </Notice>
      )}

      {isConnected && isRequester && open && (
        <Section title="Withdraw this request" description="Changed your mind? Withdrawing closes this request to offers.">
          <Button variant="outline" disabled={isPending} onClick={() => send("Withdraw request", { address: t.instance, abi: abis.instance, functionName: "cancelRfp", args: [id] }).then(() => refetch())}>
            Withdraw this request
          </Button>
        </Section>
      )}

      {isConnected && !isRequester && open && !closedForOffers && (
        <Section title="Make an offer" description="Once sent, an offer cannot be edited, only withdrawn, so the buyer always sees exactly what you offered.">
          <Card>
            <form onSubmit={sendOffer} className="grid gap-5">
              <div className={cn("grid gap-5", paid && "sm:grid-cols-2")}>
                {paid && (
                  <Label title={`Your price (${erc.symbol})`} hint={`What you want to be paid, in ${erc.symbol}. The platform fee is taken from it.`}>
                    <input className={input} type="number" inputMode="decimal" min="0" step="any" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                  </Label>
                )}
                <Label
                  title="You can deliver in (days)"
                  hint={rfp.settlement === 2 ? "If chosen, the payment is held for this long. If it is not released by then, it can only go back to the buyer." : "How long you need once your offer is chosen."}
                >
                  <input className={input} type="number" inputMode="decimal" min="0.05" step="any" value={days} onChange={(e) => setDays(e.target.value)} />
                </Label>
              </div>
              <div><Button type="submit" disabled={isPending}>Send offer</Button></div>
            </form>
          </Card>
        </Section>
      )}

      {isConnected && !isRequester && open && closedForOffers && (
        <Notice title="Closed to new offers">
          <p>Offers closed {inWords(rfp.deadline)}. The buyer can still choose one of the offers already sent.</p>
        </Notice>
      )}

      {awarded && rfp.settlement === 2 && (
        <Notice tone="good" title={`The payment is held in escrow #${String(rfp.settlementId)}`} action={<Button asChild size="sm"><Link href={`${base}/escrows/${rfp.settlementId}`}>Open the escrow</Link></Button>}>
          <p>The chosen offer&apos;s price sits in the workspace vault until the buyer releases it.</p>
        </Notice>
      )}
      {awarded && rfp.settlement !== 2 && (
        <Notice tone="good" title="This request is complete">
          <p>{rfp.settlement === 1 ? "The supplier has been paid." : "The decision is recorded. Nothing was paid."}</p>
        </Notice>
      )}
      {rfp.state === 3 && (
        <Notice title="Withdrawn">
          <p>The buyer withdrew this request.</p>
        </Notice>
      )}
    </div>
  )
}
