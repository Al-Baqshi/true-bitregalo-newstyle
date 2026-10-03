"use client"
import Link from "next/link"
import { Explainer } from "@/components/app/explain"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useOverview, useOffers, type Offer } from "@/lib/bitregalo/hooks"
import { Card, Empty, PageHead, RowsSkeleton } from "@/components/app/ui"
import { RecordRow } from "@/components/app/market/record-row"
import { FilteredEmpty, IndexTrouble, ListFilters, LoadMore, listTitle, useRecordList } from "@/components/app/market/record-list"
import { Button } from "@/components/ui/button"

export default function OffersPage() {
  const t = useTenant()
  const base = t.base
  const ov = useOverview()
  const count = ov.data?.[1]?.result as bigint | undefined
  const offers = useOffers(count)
  const list = useRecordList("listing", { ids: offers.ids, data: offers.data, isLoading: ov.isLoading || offers.isLoading })
  const where = t.isPublic ? "The BitRegalo network" : "This workspace"

  return (
    <div>
      <PageHead
        title="Listings"
        intro={t.isPublic
          ? "What suppliers on the BitRegalo network offer at a fixed price and delivery time. Take one, and the payment settles the way the supplier chose."
          : "Things suppliers in this workspace offer at a fixed price and delivery time. Take one, and the payment settles the way the supplier chose."}
        action={<Button asChild><Link href={`${base}/listings/new`}>Create a listing</Link></Button>}
      />
      <Explainer id="listings" title="What is a listing?">
        <p>The other direction from a request: a supplier advertises what they sell, at a fixed price and delivery time, and a buyer takes it. A listing can be open to anyone or meant for one named buyer.</p>
        <p>When someone takes it, the payment settles the way the supplier chose: <b>recorded only</b>, <b>paid straight away</b>, or <b>held in escrow</b>.</p>
      </Explainer>

      <ListFilters list={list} kind="listing" />
      <IndexTrouble list={list} />

      <Card flush title={listTitle(list, "listings", count)}>
        {list.loading && list.rows.length === 0 && <RowsSkeleton rows={3} />}
        {!list.loading && list.rows.length === 0 && (list.filtered
          ? <FilteredEmpty list={list} plural="listings" total={count} where={where} />
          : (
            <Empty
              title="No listings yet"
              body="Create the first one: name your price and delivery time, and anyone with a wallet can take it."
              action={<Button asChild size="sm"><Link href={`${base}/listings/new`}>Create a listing</Link></Button>}
            />
          ))}
        {list.rows.map(({ id, live, entry }) => (
          <RecordRow
            key={String(id)}
            kind="listing"
            id={id}
            href={`${base}/listings/${String(id)}`}
            entry={entry}
            live={live}
            token={list.tokenOf((live as Offer | undefined)?.token ?? entry?.token)}
          />
        ))}
      </Card>
      <LoadMore list={list} />
    </div>
  )
}
