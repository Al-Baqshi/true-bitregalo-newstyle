"use client"
import Link from "next/link"
import type { Address, Hex } from "viem"
import { FileSearch, PackageCheck, Coins, FolderKanban } from "lucide-react"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useOverview, useRfps, useEscrows } from "@/lib/bitregalo/hooks"
import { decodeLabel, instanceName } from "@/lib/bitregalo/instances"
import { Card, Stat, Addr, Pill, Row, Amount, PageHead, Empty, timeLeft } from "@/components/app/ui"
import { RFP_STATE, ESCROW_STATE, SETTLEMENT } from "@/lib/bitregalo/config"
import { Button } from "@/components/ui/button"

export default function Overview() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const ov = useOverview()
  const [rfpCount, offerCount, escrowCount, directCount, admin, feeBps, direct, escrow, minTerm, maxTerm, tokenList] = (ov.data ?? []).map((r) => r.result)
  const rfps = useRfps(rfpCount as bigint | undefined)
  const escrows = useEscrows(escrowCount as bigint | undefined)
  const name = instanceName(t.id) ?? (t.id === 0n ? "BitRegalo public template" : `Workspace #${t.id}`)
  const actions = [
    { href: `${base}/rfps/new`, label: "Post a request", icon: <FileSearch className="size-4" /> },
    { href: `${base}/offers/new`, label: "Create a listing", icon: <PackageCheck className="size-4" /> },
    { href: `${base}/projects/new`, label: "Start a project", icon: <FolderKanban className="size-4" /> },
    { href: `${base}/tokens/new`, label: "Create a token", icon: <Coins className="size-4" /> },
  ]
  return (
    <div className="space-y-8">
      <PageHead
        eyebrow={`Workspace #${t.id}`}
        title={name}
        intro={t.id === 0n ? "The open workspace anyone can use: post requests, list offers, settle by escrow or direct payment, and create tokens. Every action is a transaction you sign." : "Requests, offers, escrows and tokens for this workspace. Share this page with the people you work with."}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {actions.map((a) => (
          <Link key={a.href} href={a.href} className="group flex items-center gap-3 rounded-xl border border-border bg-card/70 px-4 py-3.5 text-sm transition hover:border-primary/50">
            <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-[color:var(--bq-ivory-dim)] group-hover:text-primary">{a.icon}</span>
            {a.label}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Requests" value={String(rfpCount ?? "…")} />
        <Stat label="Listings" value={String(offerCount ?? "…")} />
        <Stat label="Escrows" value={String(escrowCount ?? "…")} />
        <Stat label="Direct payments" value={String(directCount ?? "…")} />
        <Stat label="Tokens" value={tokenList ? String((tokenList as Address[]).length) : "…"} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Latest requests" action={<Button asChild size="sm" variant="secondary"><Link href={`${base}/rfps`}>All requests</Link></Button>}>
          {rfps.data.length === 0 && <Empty title="No requests yet" body="Post the first one — suppliers bid, you award, and the payment settles the way you chose." action={<Button asChild size="sm"><Link href={`${base}/rfps/new`}>Post a request</Link></Button>} />}
          {rfps.data.slice(0, 6).map((r, i) => r && (
            <Row key={String(rfps.ids[i])} href={`${base}/rfps/${rfps.ids[i]}`}>
              <span className="bq-mono text-xs text-muted-foreground">#{String(rfps.ids[i])}</span>
              <span className="min-w-0 truncate text-sm">
                <span className="font-medium">{decodeLabel(r.scopeHash as Hex) ?? "Hidden title"}</span>
                <span className="text-muted-foreground"> · {SETTLEMENT[r.settlement]} · {timeLeft(r.deadline)}</span>
              </span>
              <Pill tone={r.state === 1 ? "accent" : r.state === 2 ? "good" : "muted"}>{RFP_STATE[r.state]}</Pill>
            </Row>
          ))}
        </Card>
        <Card title="Latest escrows" action={<Button asChild size="sm" variant="secondary"><Link href={`${base}/escrows`}>All escrows</Link></Button>}>
          {escrows.data.length === 0 && <Empty title="No escrows yet" body="An escrow opens when a request is awarded, or a listing taken, with escrow payment." />}
          {escrows.data.slice(0, 6).map((e, i) => e && (
            <Row key={String(escrows.ids[i])} href={`${base}/escrows/${escrows.ids[i]}`}>
              <span className="bq-mono text-xs text-muted-foreground">#{String(escrows.ids[i])}</span>
              <span className="text-sm"><Addr a={e.issuer} /> → <Addr a={e.receiver} /> · <Amount value={e.amount} /></span>
              <Pill tone={e.state === 1 ? "accent" : e.state === 2 ? "good" : "muted"}>{ESCROW_STATE[e.state]}</Pill>
            </Row>
          ))}
        </Card>
      </div>
      <Card title="Rules of this workspace">
        <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-xs text-muted-foreground">Platform fee</dt><dd className="mt-1">{feeBps !== undefined ? `${Number(feeBps) / 100}% per payment` : "…"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Payment options</dt><dd className="mt-1">record only{direct ? ", direct" : ""}{escrow ? ", escrow" : ""}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Escrow term</dt><dd className="mt-1">{minTerm !== undefined ? `${Math.round(Number(minTerm) / 3600)} h – ${Math.round(Number(maxTerm) / 86400)} days` : "…"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Admin</dt><dd className="mt-1"><Addr a={String(admin ?? "")} /></dd></div>
        </dl>
      </Card>
    </div>
  )
}
