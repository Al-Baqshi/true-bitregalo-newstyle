"use client"
import Link from "next/link"
import { Explainer } from "@/components/app/explain"
import { decodeLabel } from "@/lib/bitregalo/instances"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useOverview, useRfps } from "@/lib/bitregalo/hooks"
import { Addr, Card, Empty, LedgerRow, PageHead, Pill, RowsSkeleton, timeLeft } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

/** The state of a request, in a word. The contract calls state 3 "cancelled"; people call it withdrawn. */
const STATE = ["—", "Open", "Awarded", "Withdrawn"] as const
const HOW = ["record only", "settles by direct payment", "settles by escrow"] as const

export default function RfpsPage() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const ov = useOverview()
  const rfpCount = ov.data?.[0]?.result as bigint | undefined
  const rfps = useRfps(rfpCount)
  const loading = ov.isLoading || rfps.isLoading
  const rows = rfps.data.map((r, i) => (r ? { r, id: rfps.ids[i] } : null)).filter((x) => x !== null)

  return (
    <div>
      <PageHead
        title="Requests"
        intro="What people in this workspace have asked for. Suppliers answer with a price and a delivery time, and the buyer chooses one."
        action={<Button asChild><Link href={`${base}/rfps/new`}>Post a request</Link></Button>}
      />
      <Explainer id="requests" title="What is a request?">
        <p>Someone says what they need. Suppliers answer with an offer: a price and how many days they need. The buyer chooses one offer.</p>
        <p>Each request has a closing time for new offers and a payment choice: <b>just record it</b>, <b>pay straight away</b>, or <b>hold it in escrow</b> until the work is done. The buyer can also <b>keep the wording private</b>: only a fingerprint of it goes on the blockchain, but who asked, the offers and any payment are still public.</p>
      </Explainer>

      <Card flush title={rfpCount !== undefined ? `All requests (${String(rfpCount)})` : "All requests"}>
        {loading && rows.length === 0 && <RowsSkeleton rows={3} />}
        {!loading && rows.length === 0 && (
          <Empty
            title="No requests yet"
            body="Post the first one. Suppliers answer with a price, you choose one, and the payment settles the way you picked."
            action={<Button asChild size="sm"><Link href={`${base}/rfps/new`}>Post a request</Link></Button>}
          />
        )}
        {rows.map(({ r, id }) => {
          const open = r.state === 1
          const closed = timeLeft(r.deadline) === "elapsed"
          return (
            <LedgerRow
              key={String(id)}
              href={`${base}/rfps/${String(id)}`}
              lead={decodeLabel(r.scopeHash) ? `#${String(id)}` : undefined}
              title={decodeLabel(r.scopeHash) ?? `Request #${String(id)}`}
              meta={
                <>
                  {decodeLabel(r.scopeHash) ? null : "Wording kept private · "}Asked by <Addr a={r.requester} /> · {HOW[r.settlement]}
                  {open && <> · {closed ? "closed to new offers" : `offers close in ${timeLeft(r.deadline)}`}</>}
                </>
              }
              status={<Pill tone={open ? "accent" : r.state === 2 ? "good" : "muted"}>{STATE[r.state] ?? "—"}</Pill>}
            />
          )
        })}
      </Card>
    </div>
  )
}
