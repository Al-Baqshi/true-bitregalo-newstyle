"use client"
import { use, useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { maxUint256 } from "viem"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useOffer, useTx, useErc20, useTokenCfg } from "@/lib/bitregalo/hooks"
import { abis } from "@/lib/bitregalo/config"
import { categoryLabel, useEntry } from "@/lib/bitregalo/market"
import { EditDetailsButton, EntryDescription, OwnerDetails } from "@/components/app/market/record-details"
import { placeOf } from "@/components/app/market/words"
import { Addr, Amount, Card, Empty, Fact, Facts, Notice, PageHead, Pill, RowsSkeleton, Section } from "@/components/app/ui"
import { ConnectButton } from "@/components/app/connect-button"
import { Button } from "@/components/ui/button"

/** The state of a listing, in a word. The contract says listed / confirmed; people say open / taken. */
const STATE = ["—", "Open", "Taken", "Withdrawn"] as const
const MODE = [
  { name: "Just record it", pill: "record only", after: "No money moves. The listing and who took it are the record." },
  { name: "Pay straight away", pill: "direct payment", after: "The supplier is paid from the buyer's wallet the moment the listing is taken." },
  { name: "Hold it safely", pill: "escrow", after: "When the listing is taken, the price is locked in the workspace vault. The buyer releases it when the work is delivered; if they never do, it returns to them after the delivery time." },
]

function duration(s: bigint) {
  const n = Number(s)
  if (n < 86400) return `${Math.max(1, Math.round(n / 3600))} hour${Math.round(n / 3600) === 1 ? "" : "s"}`
  const d = Math.round((n / 86400) * 10) / 10
  return `${d} day${d === 1 ? "" : "s"}`
}

export default function OfferDetail({ params }: { params: Promise<{ id: string }> }) {
  const t = useTenant()
  const base = t.base
  const { id: raw } = use(params)
  const id = BigInt(raw)
  const { address, isConnected } = useAccount()
  const { offer, refetch } = useOffer(id)
  const { send, isPending } = useTx()
  const paid = !!offer && offer.settlement !== 0
  const erc = useErc20(paid ? offer!.token : undefined, address)
  const cfg = useTokenCfg(paid ? offer!.token : undefined)
  const [editing, setEditing] = useState(false)
  // Title, description, category and place, signed by the supplier, from the marketplace index.
  const { data: entry } = useEntry(t.id, "listing", id)
  const back = { href: `${base}/listings`, label: "All listings" }

  if (!offer) {
    return (
      <div>
        <PageHead back={back} title={`Listing #${raw}`} />
        <Card flush><RowsSkeleton rows={3} /></Card>
      </div>
    )
  }
  if (/^0x0{40}$/.test(offer.supplier)) {
    return (
      <div>
        <PageHead back={back} title={`Listing #${raw}`} />
        <Card flush><Empty title="There is no such listing" body={`Nothing has been listed as #${raw} in this workspace.`} action={<Button asChild size="sm" variant="secondary"><Link href={back.href}>All listings</Link></Button>} /></Card>
      </div>
    )
  }

  const isSupplier = !!address && address.toLowerCase() === offer.supplier.toLowerCase()
  const listed = offer.state === 1
  const taken = offer.state === 2
  const isBuyer = taken && !!address && address.toLowerCase() === offer.buyer.toLowerCase()
  const designated = !/^0x0{40}$/.test(offer.designatedBuyer)
  const canConfirm = listed && isConnected && !isSupplier && (!designated || address!.toLowerCase() === offer.designatedBuyer.toLowerCase())
  const mode = MODE[offer.settlement]
  const serviceFee = cfg?.[2] ?? 0n
  const fee = paid && serviceFee > 0n ? <Amount value={serviceFee} decimals={erc.decimals} symbol={erc.symbol} /> : null
  const total = offer.amount + serviceFee
  const place = placeOf(entry)

  async function confirm() {
    if (paid) {
      const need = offer!.amount + (cfg?.[2] ?? 0n)
      if (erc.allowance < need) await send("Allow the vault to take the payment", { address: offer!.token, abi: abis.erc20, functionName: "approve", args: [t.vault, maxUint256] })
    }
    await send("Take listing", { address: t.instance, abi: abis.instance, functionName: "confirmOffer", args: [id] })
    refetch(); erc.refetch()
  }
  async function withdraw() {
    await send("Withdraw listing", { address: t.instance, abi: abis.instance, functionName: "withdrawOffer", args: [id] })
    refetch()
  }

  return (
    <div className="space-y-10">
      <PageHead
        back={back}
        title={entry?.title ?? `Listing #${raw}`}
        intro={<>{entry ? <>Listing #{raw}, a</> : "A"} fixed-price offer from {isSupplier ? <>you (<Addr a={offer.supplier} />)</> : <Addr a={offer.supplier} />}. {mode.after}</>}
        action={<EditDetailsButton isOwner={isSupplier} entry={entry} editing={editing} onEdit={() => setEditing(true)} />}
      />

      <EntryDescription entry={entry} />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="t-figure mt-1">{paid ? <Amount value={offer.amount} decimals={erc.decimals} symbol={erc.symbol} /> : "No payment"}</p>
          </div>
          <Pill tone={listed ? "accent" : taken ? "good" : "muted"}>{STATE[offer.state] ?? "—"}</Pill>
        </div>
        <Facts columns={4} className="mt-6 border-t border-border pt-5">
          <Fact label="Delivered within">{duration(offer.timeframe)}</Fact>
          <Fact label="Who can take it">{designated ? <>Only <Addr a={offer.designatedBuyer} /></> : "Anyone"}</Fact>
          <Fact label="How it settles">{mode.name} <span className="text-muted-foreground">({mode.pill})</span></Fact>
          <Fact label="Supplier"><Addr a={offer.supplier} /></Fact>
          {entry && <Fact label="Category">{categoryLabel(entry.category)}</Fact>}
          {place && <Fact label="Where">{place}</Fact>}
          {taken && <Fact label="Taken by"><Addr a={offer.buyer} /></Fact>}
          {taken && offer.settlement === 2 && offer.settlementId > 0n && (
            <Fact label="Escrow"><Link className="underline decoration-1 underline-offset-[3px] hover:decoration-2" href={`${base}/escrows/${offer.settlementId}`}>Escrow #{String(offer.settlementId)}</Link></Fact>
          )}
        </Facts>
      </Card>

      <OwnerDetails kind="listing" recordId={id} entry={entry} isOwner={isSupplier} editing={editing} setEditing={setEditing} />

      {canConfirm && (
        <Section title="Take this listing">
          <Notice tone="accent" action={<Button disabled={isPending} onClick={confirm}>{offer.settlement === 2 ? "Take it and fund the escrow" : offer.settlement === 1 ? "Take it and pay" : "Take this listing"}</Button>}>
            <p>
              {offer.settlement === 2 && <>Taking it moves <Amount value={offer.amount} decimals={erc.decimals} symbol={erc.symbol} />{fee && <> plus a {fee} service fee</>} from your wallet into the vault. You release it to the supplier when the work is delivered. If you never do, it returns to you after {duration(offer.timeframe)}.</>}
              {offer.settlement === 1 && <>Taking it pays the supplier <Amount value={offer.amount} decimals={erc.decimals} symbol={erc.symbol} /> straight away from your wallet{fee && <>, plus a {fee} service fee</>}.</>}
              {offer.settlement === 0 && <>Taking it records that you accepted this offer. No money moves.</>}
              {paid && <> Your wallet will be charged <Amount value={total} decimals={erc.decimals} symbol={erc.symbol} />. Your balance: <Amount value={erc.balance} decimals={erc.decimals} symbol={erc.symbol} />.</>}
            </p>
          </Notice>
        </Section>
      )}

      {listed && !isConnected && (
        <Notice tone="accent" title="Connect a wallet to take this listing" action={<ConnectButton />}>
          <p>Your wallet signs the transaction. Nothing happens until you do.</p>
        </Notice>
      )}

      {listed && designated && !canConfirm && isConnected && !isSupplier && (
        <Notice title="Meant for one buyer">
          <p>Only <Addr a={offer.designatedBuyer} /> can take this listing.</p>
        </Notice>
      )}

      {listed && isSupplier && (
        <Section title="Withdraw this listing" description="This is your listing. Withdrawing takes it off the market; nobody can take it afterwards.">
          <Button variant="outline" disabled={isPending} onClick={withdraw}>Withdraw listing</Button>
        </Section>
      )}

      {taken && (
        <Notice tone="good" title={isBuyer ? "You took this listing" : "Taken"} action={offer.settlement === 2 && offer.settlementId > 0n ? <Button asChild size="sm"><Link href={`${base}/escrows/${offer.settlementId}`}>Open the escrow</Link></Button> : undefined}>
          <p>
            {offer.settlement === 2 ? <>The price is held in escrow #{String(offer.settlementId)} until the buyer releases it.</> : offer.settlement === 1 ? "The supplier has been paid. This listing is complete." : "The decision is recorded. This listing is complete."}
          </p>
        </Notice>
      )}

      {offer.state === 3 && (
        <Notice title="Withdrawn">
          <p>The supplier withdrew this listing.</p>
        </Notice>
      )}
    </div>
  )
}
