"use client"
/**
 * The connected wallet's own records in one place (the network, or the workspace it is in):
 * requests it posted, offers it made, listings it created or took, escrows where it is the
 * buyer or the supplier, and payments it sent or received. Everything is read from the chain
 * with the same hooks the list pages use, then filtered by address. Counts are small on the
 * practice network; each list reads its newest 50 records.
 */
import { useReadContracts, useAccount } from "wagmi"
import type { Address } from "viem"
import { abis } from "@/lib/bitregalo/config"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useEscrows, useOffers, useOverview, usePaymentCount, usePayments, useRfps, type Bid } from "@/lib/bitregalo/hooks"
import { decodeLabel, useSettlementTokens } from "@/lib/bitregalo/instances"
import { Addr, Amount, LedgerRow, Pill, timeLeft, type Tone } from "@/components/app/ui"

export type ActivityKind = "escrow" | "request" | "offer" | "listing" | "payment"

export type ActivityItem = {
  key: string
  kind: ActivityKind
  href: string
  title: string
  /** Who, how and when, in a sentence. */
  meta: React.ReactNode
  amount?: React.ReactNode
  status: { word: string; tone: Tone }
  /** What the visitor should do next, when there is something to do. */
  needs?: string
}

const HOW = ["record only", "paid directly", "paid by escrow"] as const
const ZERO = /^0x0{40}$/

function days(s: bigint) {
  const n = Number(s)
  if (n < 86400) return `${Math.max(1, Math.round(n / 3600))} h`
  const d = Math.round((n / 86400) * 10) / 10
  return `${d} ${d === 1 ? "day" : "days"}`
}

export function useMyActivity() {
  const t = useTenant()
  const base = t.base
  const { address } = useAccount()
  const me = address?.toLowerCase()
  const ov = useOverview()
  const [rfpCount, offerCount, escrowCount] = (ov.data ?? []).map((r) => r.result) as [bigint?, bigint?, bigint?]
  const rfps = useRfps(rfpCount)
  const offers = useOffers(offerCount)
  const escrows = useEscrows(escrowCount)
  const { count: payCount } = usePaymentCount()
  const payments = usePayments(payCount)
  const tokens = useSettlementTokens(t.instance, t.id)

  // Offers on requests: one count per request, then every offer.
  const bidCounts = useReadContracts({
    contracts: rfps.ids.map((id) => ({ address: t.instance, abi: abis.instance, functionName: "bidCount", args: [id] })),
    query: { enabled: !!me && rfps.ids.length > 0, refetchInterval: 15_000 },
  })
  const bidRefs = rfps.ids.flatMap((rfpId, i) => {
    const n = Number((bidCounts.data?.[i]?.result as bigint | undefined) ?? 0n)
    return Array.from({ length: n }, (_, j) => ({ i, rfpId, bidId: BigInt(j + 1) }))
  })
  const bids = useReadContracts({
    contracts: bidRefs.map((b) => ({ address: t.instance, abi: abis.instance, functionName: "getBid", args: [b.rfpId, b.bidId] })),
    query: { enabled: !!me && bidRefs.length > 0, refetchInterval: 15_000 },
  })

  const tokenOf = (a: string) => tokens.all.find((x) => x.address.toLowerCase() === a.toLowerCase())
  const money = (value: bigint, token: Address) => {
    const tk = tokenOf(token)
    return <Amount value={value} decimals={tk?.decimals ?? 18} symbol={tk && tk.symbol !== "…" ? tk.symbol : ""} />
  }
  const who = (a: string) => (me && a.toLowerCase() === me ? "you" : <Addr a={a} />)
  const mine = (a: string | undefined) => !!me && !!a && a.toLowerCase() === me

  const items: ActivityItem[] = []
  const loading = !!me && (ov.isLoading || rfps.isLoading || offers.isLoading || escrows.isLoading || payments.isLoading || bidCounts.isLoading || bids.isLoading)

  if (me) {
    const allBids = bidRefs.map((ref, k) => ({ ...ref, bid: bids.data?.[k]?.result as Bid | undefined }))

    // Escrows first: they hold payments.
    escrows.data.forEach((e, i) => {
      if (!e || (!mine(e.issuer) && !mine(e.receiver))) return
      const id = String(escrows.ids[i])
      const buyer = mine(e.issuer)
      const held = e.state === 1
      const overdue = held && timeLeft(e.expiresAt) === "elapsed"
      const word = ["—", "Held", "Released", "Handed back", "Returned"][e.state] ?? "—"
      items.push({
        key: `escrow-${id}`,
        kind: "escrow",
        href: `${base}/escrows/${id}`,
        title: `Escrow #${id}`,
        meta: buyer
          ? <>You are the buyer · for {who(e.receiver)}{held && <> · {overdue ? "past its deadline" : `deadline in ${timeLeft(e.expiresAt)}`}</>}</>
          : <>You are the supplier · from {who(e.issuer)}{held && <> · {overdue ? "past its deadline, goes back to the buyer" : `the buyer releases it when the work is done`}</>}</>,
        amount: money(e.amount, e.token),
        status: { word, tone: held ? "accent" : e.state === 2 ? "good" : "muted" },
        needs: buyer && held ? (overdue ? "Past its deadline: send it back to yourself" : "Release it when the work is done") : undefined,
      })
    })

    // Requests you posted.
    rfps.data.forEach((r, i) => {
      if (!r || !mine(r.requester)) return
      const id = rfps.ids[i]
      const label = decodeLabel(r.scopeHash)
      // Offers that can still be chosen: not withdrawn, and not past their valid-until time.
      const live = allBids.filter((b) => b.rfpId === id && b.bid && !b.bid.withdrawn && timeLeft(b.bid.validUntil) !== "elapsed").length
      const open = r.state === 1
      const closed = timeLeft(r.deadline) === "elapsed"
      items.push({
        key: `request-${id}`,
        kind: "request",
        href: `${base}/requests/${id}`,
        title: label ?? `Request #${id}`,
        meta: <>Request you posted · {HOW[r.settlement]}{open && <> · {live === 0 ? "no offers yet" : `${live} ${live === 1 ? "offer" : "offers"}`}{!closed && <>, closes in {timeLeft(r.deadline)}</>}</>}</>,
        status: { word: ["—", "Open", "Awarded", "Withdrawn"][r.state] ?? "—", tone: open ? "accent" : r.state === 2 ? "good" : "muted" },
        needs: open && live > 0 ? `Choose one of ${live} ${live === 1 ? "offer" : "offers"}` : undefined,
      })
    })

    // Offers you made on other people's requests.
    allBids.forEach((b) => {
      if (!b.bid || !mine(b.bid.provider)) return
      const r = rfps.data[b.i]
      if (!r) return
      const label = decodeLabel(r.scopeHash)
      const chosen = r.state === 2 && r.acceptedBid === b.bidId
      const status: ActivityItem["status"] = b.bid.withdrawn
        ? { word: "Withdrawn", tone: "muted" }
        : r.state === 1 ? (timeLeft(b.bid.validUntil) === "elapsed" ? { word: "Expired", tone: "muted" } : { word: "Waiting", tone: "accent" })
        : chosen ? { word: "Chosen", tone: "good" }
        : r.state === 2 ? { word: "Not chosen", tone: "muted" }
        : { word: "Request withdrawn", tone: "muted" }
      items.push({
        key: `offer-${b.rfpId}-${b.bidId}`,
        kind: "offer",
        href: `${base}/requests/${b.rfpId}`,
        title: label ? `Your offer on “${label}”` : `Your offer on request #${b.rfpId}`,
        meta: <>To {who(r.requester)} · delivery in {days(b.bid.timeframe)}{r.state === 1 && !b.bid.withdrawn ? (timeLeft(b.bid.validUntil) === "elapsed" ? " · its valid-until time has passed" : ` · the buyer has not chosen yet · valid for ${timeLeft(b.bid.validUntil)}`) : ""}</>,
        amount: r.settlement !== 0 ? money(b.bid.amount, r.token) : undefined,
        status,
      })
    })

    // Listings you created, took, or that were made for you.
    offers.data.forEach((o, i) => {
      if (!o) return
      const id = String(offers.ids[i])
      const supplier = mine(o.supplier)
      const took = o.state === 2 && mine(o.buyer)
      // A listing can carry a last moment to take it (0 means open until withdrawn).
      const lapsed = o.state === 1 && o.validUntil > 0n && timeLeft(o.validUntil) === "elapsed"
      const named = o.state === 1 && !ZERO.test(o.designatedBuyer) && mine(o.designatedBuyer) && !supplier
      const forMe = named && !lapsed
      if (!supplier && !took && !named) return
      const word = lapsed ? "Expired" : ["—", "Open", "Taken", "Withdrawn"][o.state] ?? "—"
      items.push({
        key: `listing-${id}`,
        kind: "listing",
        href: `${base}/listings/${id}`,
        title: `Listing #${id}`,
        meta: supplier
          ? <>Listing you created · {HOW[o.settlement]} · {o.state === 2 ? <>taken by {who(o.buyer)}</> : ZERO.test(o.designatedBuyer) ? "open to anyone" : <>for {who(o.designatedBuyer)}</>}</>
          : took
            ? <>Listing you took · from {who(o.supplier)} · {HOW[o.settlement]}</>
            : <>Made for you by {who(o.supplier)} · delivery within {days(o.timeframe)} · {HOW[o.settlement]}{o.validUntil > 0n && <> · {timeLeft(o.validUntil) === "elapsed" ? "no longer valid" : `valid for ${timeLeft(o.validUntil)}`}</>}</>,
        amount: o.settlement !== 0 ? money(o.amount, o.token) : undefined,
        status: forMe ? { word: "Waiting for you", tone: "accent" } : { word, tone: lapsed ? "muted" : o.state === 1 ? "accent" : o.state === 2 ? "good" : "muted" },
        needs: forMe ? (o.settlement === 2 ? "Fund it: the payment is then held until you release it" : o.settlement === 1 ? "Take it and pay" : "Take it") : undefined,
      })
    })

    // Payments you sent or received.
    payments.data.forEach((p, i) => {
      if (!p || (!mine(p.payer) && !mine(p.payee))) return
      const id = String(payments.ids[i])
      const sent = mine(p.payer)
      const ref = decodeLabel(p.ref)
      items.push({
        key: `payment-${id}`,
        kind: "payment",
        href: `${base}/payments/${id}`,
        title: ref ?? `Payment #${id}`,
        meta: sent ? <>You sent it to {who(p.payee)}</> : <>From {who(p.payer)} to you</>,
        amount: money(p.amount, p.token),
        status: sent ? { word: "Sent", tone: "muted" } : { word: "Received", tone: "good" },
      })
    })
  }

  return {
    connected: !!me,
    loading,
    items,
    needs: items.filter((x) => x.needs),
    rest: items.filter((x) => !x.needs),
  }
}

/** One record of the visitor's own, with what to do next when there is something. */
export function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <LedgerRow
      href={item.href}
      title={item.title}
      meta={
        item.needs ? (
          <>
            <span className="font-[560] text-gold">{item.needs}</span>
            <span className="block">{item.meta}</span>
          </>
        ) : (
          item.meta
        )
      }
      amount={item.amount}
      status={<Pill tone={item.status.tone}>{item.status.word}</Pill>}
    />
  )
}
