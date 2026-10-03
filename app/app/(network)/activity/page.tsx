"use client"
import Link from "next/link"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Card, Empty, Notice, PageHead, RowsSkeleton, Section } from "@/components/app/ui"
import { ConnectButton } from "@/components/app/connect-button"
import { Button } from "@/components/ui/button"
import { ActivityRow, useMyActivity, type ActivityKind } from "./activity"

const GROUPS: { kind: ActivityKind; title: string }[] = [
  { kind: "escrow", title: "Escrows" },
  { kind: "request", title: "Requests you posted" },
  { kind: "offer", title: "Offers you made" },
  { kind: "listing", title: "Listings" },
  { kind: "payment", title: "Payments" },
]

export default function MyActivity() {
  const t = useTenant()
  const a = useMyActivity()
  const where = t.isPublic ? "on the BitRegalo network" : "in this workspace"

  if (!a.connected) {
    return (
      <div className="space-y-8">
        <PageHead title="My activity" intro={`Everything your wallet has done ${where}: requests, offers, listings, escrows and payments, with what needs you first.`} />
        <Card flush>
          <Empty
            title="Connect a wallet to see your activity"
            body="Your activity is read from the public record by your wallet address. Connecting only lets this page know which address is yours; it signs nothing."
            action={<ConnectButton />}
          />
        </Card>
      </div>
    )
  }

  const groups = GROUPS.map((g) => ({ ...g, items: a.rest.filter((x) => x.kind === g.kind) })).filter((g) => g.items.length > 0)
  const nothing = !a.loading && a.items.length === 0

  return (
    <div className="space-y-10">
      <PageHead
        title="My activity"
        intro={`Everything your wallet has done ${where}: requests, offers, listings, escrows and payments. Things waiting for you come first.`}
      />

      {a.loading && a.items.length === 0 && (
        <Card flush title="Reading the record…">
          <RowsSkeleton rows={3} />
        </Card>
      )}

      {nothing && (
        <Card flush>
          <Empty
            title="Nothing yet"
            body={`When you post a request, make an offer, create or take a listing, or hold a payment for someone ${where}, it appears here.`}
            action={<Button asChild size="sm"><Link href={`${t.base}/escrows/new`}>Hold a payment for someone</Link></Button>}
          />
        </Card>
      )}

      {a.needs.length > 0 && (
        <Card flush title={`Needs you (${a.needs.length})`} description="Each one waits for your signature. Open it to see what happens to the payment.">
          {a.needs.map((item) => <ActivityRow key={item.key} item={item} />)}
        </Card>
      )}

      {groups.length > 0 && (
        <Section title={a.needs.length > 0 ? "Everything else" : undefined}>
          <div className="space-y-6">
            {groups.map((g) => (
              <Card key={g.kind} flush title={`${g.title} (${g.items.length})`}>
                {g.items.map((item) => <ActivityRow key={item.key} item={item} />)}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {!a.hasPay && (
        <Notice tone="muted" title="Payments are not listed here yet">
          <p>
            {t.isPublic
              ? "The network's current contracts have no direct payments, so there are none to show. Sending payments and getting paid arrive when the network moves to the current contracts."
              : "This workspace runs the first version of the contracts, which has no direct payments."}
          </p>
        </Notice>
      )}

      <p className="max-w-[62ch] text-sm text-muted-foreground">
        This page reads the newest 50 of each kind of record {where}.{" "}
        {t.isPublic ? "Work you do inside an organisation's workspace is recorded there, and shows on that workspace's own pages." : "Work done on the BitRegalo network is recorded there, under My activity on the network."}
      </p>
    </div>
  )
}
