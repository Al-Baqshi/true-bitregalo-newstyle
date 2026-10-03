"use client"
import Link from "next/link"
import { Explainer } from "@/components/app/explain"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useOverview, useRfps, type Rfp } from "@/lib/bitregalo/hooks"
import { Card, Empty, PageHead, RowsSkeleton } from "@/components/app/ui"
import { RecordRow } from "@/components/app/market/record-row"
import { FilteredEmpty, IndexTrouble, ListFilters, LoadMore, listTitle, useRecordList } from "@/components/app/market/record-list"
import { Button } from "@/components/ui/button"

export default function RfpsPage() {
  const t = useTenant()
  const base = t.base
  const ov = useOverview()
  const rfpCount = ov.data?.[0]?.result as bigint | undefined
  const rfps = useRfps(rfpCount)
  const list = useRecordList("request", { ids: rfps.ids, data: rfps.data, isLoading: ov.isLoading || rfps.isLoading })
  const where = t.isPublic ? "The BitRegalo network" : "This workspace"

  return (
    <div>
      <PageHead
        title="Requests"
        intro={t.isPublic
          ? "What people on the BitRegalo network have asked for. Suppliers answer with a price and a delivery time, and the buyer chooses one."
          : "What people in this workspace have asked for. Suppliers answer with a price and a delivery time, and the buyer chooses one."}
        action={<Button asChild><Link href={`${base}/requests/new`}>Post a request</Link></Button>}
      />
      <Explainer id="requests" title="What is a request?">
        <p>Someone says what they need. Suppliers answer with an offer: a price and how many days they need. The buyer chooses one offer.</p>
        <p>Each request has a closing time for new offers and a payment choice: <b>just record it</b>, <b>pay straight away</b>, or <b>hold it in escrow</b> until the work is done. The buyer can also <b>keep the wording private</b>: only a fingerprint of it goes on the blockchain, but who asked, the offers and any payment are still public.</p>
      </Explainer>

      <ListFilters list={list} kind="request" />
      <IndexTrouble list={list} />

      <Card flush title={listTitle(list, "requests", rfpCount)}>
        {list.loading && list.rows.length === 0 && <RowsSkeleton rows={3} />}
        {!list.loading && list.rows.length === 0 && (list.filtered
          ? <FilteredEmpty list={list} plural="requests" total={rfpCount} where={where} />
          : (
            <Empty
              title="No requests yet"
              body="Post the first one. Suppliers answer with a price, you choose one, and the payment settles the way you picked."
              action={<Button asChild size="sm"><Link href={`${base}/requests/new`}>Post a request</Link></Button>}
            />
          ))}
        {list.rows.map(({ id, live, entry }) => (
          <RecordRow
            key={String(id)}
            kind="request"
            id={id}
            href={`${base}/requests/${String(id)}`}
            entry={entry}
            live={live}
            token={list.tokenOf((live as Rfp | undefined)?.token ?? entry?.token)}
          />
        ))}
      </Card>
      <LoadMore list={list} />
    </div>
  )
}
