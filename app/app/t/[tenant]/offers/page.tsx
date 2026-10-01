"use client"
import Link from "next/link"
import { Explainer } from "@/components/app/explain"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useOverview, useOffers } from "@/lib/bitregalo/hooks"
import { useSettlementTokens } from "@/lib/bitregalo/instances"
import { Addr, Amount, Card, Empty, LedgerRow, PageHead, Pill, RowsSkeleton } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

/** The state of a listing, in a word. The contract says listed / confirmed; people say open / taken. */
const STATE = ["—", "Open", "Taken", "Withdrawn"] as const
const HOW = ["record only", "settles by direct payment", "settles by escrow"] as const

function days(s: bigint) {
  const n = Number(s)
  if (n < 86400) return `${Math.max(1, Math.round(n / 3600))} h`
  const d = Math.round((n / 86400) * 10) / 10
  return `${d} ${d === 1 ? "day" : "days"}`
}

export default function OffersPage() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const ov = useOverview()
  const count = ov.data?.[1]?.result as bigint | undefined
  const offers = useOffers(count)
  const tokens = useSettlementTokens(t.instance, t.id)
  const loading = ov.isLoading || offers.isLoading
  const rows = offers.data.map((o, i) => (o ? { o, id: offers.ids[i] } : null)).filter((x) => x !== null)

  return (
    <div>
      <PageHead
        title="Listings"
        intro="Things suppliers in this workspace offer at a fixed price and delivery time. Take one, and the payment settles the way the supplier chose."
        action={<Button asChild><Link href={`${base}/offers/new`}>Create a listing</Link></Button>}
      />
      <Explainer id="listings" title="What is a listing?">
        <p>The other direction from a request: a supplier advertises what they sell, at a fixed price and delivery time, and a buyer takes it. A listing can be open to anyone or meant for one named buyer.</p>
        <p>When someone takes it, the payment settles the way the supplier chose: <b>recorded only</b>, <b>paid straight away</b>, or <b>held in escrow</b>.</p>
      </Explainer>

      <Card flush title={count !== undefined ? `All listings (${String(count)})` : "All listings"}>
        {loading && rows.length === 0 && <RowsSkeleton rows={3} />}
        {!loading && rows.length === 0 && (
          <Empty
            title="No listings yet"
            body="Create the first one: name your price and delivery time, and anyone with a wallet can take it."
            action={<Button asChild size="sm"><Link href={`${base}/offers/new`}>Create a listing</Link></Button>}
          />
        )}
        {rows.map(({ o, id }) => {
          const token = tokens.all.find((x) => x.address.toLowerCase() === o.token.toLowerCase())
          const forOne = !/^0x0{40}$/.test(o.designatedBuyer)
          return (
            <LedgerRow
              key={String(id)}
              href={`${base}/offers/${String(id)}`}
              title={`Listing #${String(id)}`}
              meta={
                <>
                  From <Addr a={o.supplier} /> · delivered within {days(o.timeframe)} · {HOW[o.settlement]}
                  {forOne ? <> · for <Addr a={o.designatedBuyer} /></> : " · open to anyone"}
                </>
              }
              amount={o.settlement ? <Amount value={o.amount} decimals={token?.decimals} symbol={token && token.symbol !== "…" ? token.symbol : undefined} /> : undefined}
              status={<Pill tone={o.state === 1 ? "accent" : o.state === 2 ? "good" : "muted"}>{STATE[o.state] ?? "—"}</Pill>}
            />
          )
        })}
      </Card>
    </div>
  )
}
