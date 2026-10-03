"use client"
import Link from "next/link"
import { useAccount, useReadContract } from "wagmi"
import type { Address, Hex } from "viem"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useOverview, useRfps, useEscrows, useSaleCount } from "@/lib/bitregalo/hooks"
import { decodeLabel, useSettlementTokens } from "@/lib/bitregalo/instances"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { Card, Addr, Pill, LedgerRow, Amount, PageHead, Empty, Facts, Fact, Section, timeLeft } from "@/components/app/ui"
import { abis, addresses, RFP_STATE, ESCROW_STATE, SETTLEMENT } from "@/lib/bitregalo/config"
import { Button } from "@/components/ui/button"

export default function Overview() {
  const t = useTenant()
  const base = t.base
  const { address } = useAccount()
  const nameOf = useWorkspaceName()
  const ov = useOverview()
  const [rfpCount, offerCount, escrowCount, directCount, admin, feeBps, direct, escrow, minTerm, maxTerm, tokenList] = (ov.data ?? []).map((r) => r.result)
  const rfps = useRfps(rfpCount as bigint | undefined)
  const escrows = useEscrows(escrowCount as bigint | undefined)
  const hasPay = t.version >= 1n
  const { count: saleCount } = useSaleCount(hasPay)
  const tokens = useSettlementTokens(t.instance, t.id)
  const versionCount = useReadContract({ address: addresses.mother, abi: abis.mother, functionName: "versionCount" })
  const current = versionCount.data !== undefined ? BigInt(versionCount.data as bigint) - 1n : null
  const tokenOf = (a: string) => tokens.all.find((x) => x.address.toLowerCase() === a.toLowerCase())
  const n = (v: unknown) => (v === undefined || v === null ? "…" : String(v))
  const runBy = String(admin ?? t.admin ?? "")
  const isAdmin = !!address && runBy.toLowerCase() === address.toLowerCase()
  const name = t.id === 0n && !t.isPublic ? "BitRegalo public workspace (first version)" : nameOf(t.id)
  const recorded = hasPay ? "its shop, payments, requests, listings, escrows, tokens and treasury" : "its requests, listings, escrows and tokens"
  const versionWord = current !== null && t.version === current ? "Current contracts" : t.version === 0n ? "First version of the contracts" : `Contract version ${String(t.version)}`

  return (
    <div className="space-y-12">
      <PageHead
        title={name}
        intro={
          t.isPublic
            ? "BitRegalo's own public workspace: the network anyone can use."
            : `An organisation's own workspace on BitRegalo, run by its admin. Everything done here (${recorded}) is recorded under this workspace, separately from the BitRegalo network.`
        }
        action={
          hasPay ? (
            <>
              <Button asChild><Link href={`${base}/get-paid`}>Get paid</Link></Button>
              <Button asChild variant="secondary"><Link href={`${base}/pay`}>Send a payment</Link></Button>
              <Button asChild variant="secondary"><Link href={`${base}/requests/new`}>Ask for something</Link></Button>
            </>
          ) : (
            <>
              <Button asChild><Link href={`${base}/requests/new`}>Ask for something</Link></Button>
              <Button asChild variant="secondary"><Link href={`${base}/listings/new`}>Offer something</Link></Button>
            </>
          )
        }
      />

      <p className="-mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        {[
          ...(hasPay ? [{ label: "sale", n: saleCount, href: `${base}/shop` }] : []),
          { label: "request", n: rfpCount, href: `${base}/requests` },
          { label: "listing", n: offerCount, href: `${base}/listings` },
          { label: "escrow", n: escrowCount, href: `${base}/escrows` },
          ...(hasPay ? [{ label: "payment", n: directCount, href: `${base}/payments` }] : []),
          { label: "token", n: tokenList ? (tokenList as Address[]).length : undefined, href: `${base}/tokens` },
        ].map((c) => (
          <Link key={c.label} href={c.href} className="flex min-h-9 items-center gap-1.5 transition-colors hover:text-foreground pointer-coarse:min-h-11">
            <span className="t-num font-semibold text-foreground">{n(c.n)}</span> {c.label}{c.n === undefined || Number(c.n) === 1 ? "" : "s"}
          </Link>
        ))}
      </p>

      <Card
        title="Who runs it and its rules"
        description="Set by the admin. They apply to everyone who uses this workspace."
        action={isAdmin ? <Button asChild size="sm" variant="ghost"><Link href={`${base}/settings`}>Change in Settings</Link></Button> : undefined}
      >
        <Facts columns={3}>
          <Fact label="Run by">{isAdmin ? <>You <span className="font-normal text-muted-foreground">(<Addr a={runBy} />)</span></> : <Addr a={runBy} />}</Fact>
          <Fact label="Accepted currencies">
            {tokens.accepted.length > 0 ? tokens.accepted.map((x) => x.symbol).join(", ") : tokens.all.length > 0 && tokens.all.every((x) => x.symbol !== "…") ? "None yet: payments are off" : "…"}
          </Fact>
          <Fact label="Ways to settle">{["Just record it", direct ? "pay straight away" : null, escrow ? "hold it in escrow" : null].filter(Boolean).join(", ")}</Fact>
          <Fact label="Platform fee">{feeBps !== undefined ? `${Number(feeBps) / 100}%, taken from what the supplier receives` : "…"}</Fact>
          <Fact label="Service fee">
            {tokens.accepted.some((x) => x.serviceFee > 0n)
              ? <>{tokens.accepted.filter((x) => x.serviceFee > 0n).map((x, i) => <span key={x.address}>{i > 0 && ", "}<Amount value={x.serviceFee} decimals={x.decimals} symbol={x.symbol} /></span>)} per payment, paid by the buyer</>
              : "None"}
          </Fact>
          <Fact label="Escrow length">{minTerm !== undefined ? `${Math.round(Number(minTerm) / 3600)} h to ${Math.round(Number(maxTerm) / 86400)} days` : "…"}</Fact>
        </Facts>
        <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
          {versionWord}. Its own contracts: records <Addr a={t.instance} />, vault <Addr a={t.vault} />
          {t.treasury && <>, treasury <Addr a={t.treasury} /></>}. Payments held in escrow sit in the vault, and nobody, including BitRegalo and the admin, can send them anywhere but to the supplier or back to the buyer.
        </p>
      </Card>

      <Section title="Latest activity" description="The newest records in this workspace. Everyone can see them; amounts are public.">
        <div className="space-y-6">
          <Card flush title="Requests" action={<Button asChild size="sm" variant="ghost"><Link href={`${base}/requests`}>All requests</Link></Button>}>
            {rfps.data.length === 0 && (
              <Empty title="No requests yet" body="Post the first one. Suppliers answer with a price, you choose one, and the payment settles the way you picked." action={<Button asChild size="sm" variant="secondary"><Link href={`${base}/requests/new`}>Ask for something</Link></Button>} />
            )}
            {rfps.data.slice(0, 5).map((r, i) => r && (
              <LedgerRow
                key={String(rfps.ids[i])}
                href={`${base}/requests/${rfps.ids[i]}`}
                lead={decodeLabel(r.scopeHash as Hex) ? `#${String(rfps.ids[i])}` : undefined}
                title={decodeLabel(r.scopeHash as Hex) ?? `Request #${String(rfps.ids[i])}`}
                meta={<>{decodeLabel(r.scopeHash as Hex) ? null : "Private wording · "}{SETTLEMENT[r.settlement]} · {r.state === 1 ? (timeLeft(r.deadline) === "elapsed" ? "closed to new offers" : `open for ${timeLeft(r.deadline)}`) : RFP_STATE[r.state].toLowerCase()}</>}
                status={<Pill tone={r.state === 1 ? "accent" : r.state === 2 ? "good" : "muted"}>{RFP_STATE[r.state]}</Pill>}
              />
            ))}
          </Card>

          <Card flush title="Escrows" action={<Button asChild size="sm" variant="ghost"><Link href={`${base}/escrows`}>All escrows</Link></Button>}>
            {escrows.data.length === 0 && <Empty title="No escrows yet" body="An escrow opens when someone chooses an offer on a request, or takes a listing, that is paid by escrow." action={<Button asChild size="sm" variant="secondary"><Link href={`${base}/escrows/new`}>Hold a payment for someone</Link></Button>} />}
            {escrows.data.slice(0, 5).map((e, i) => e && (
              <LedgerRow
                key={String(escrows.ids[i])}
                href={`${base}/escrows/${escrows.ids[i]}`}
                title={<>Escrow #{String(escrows.ids[i])}</>}
                meta={<>From <Addr a={e.issuer} /> to <Addr a={e.receiver} />{e.state === 1 && <> · {timeLeft(e.expiresAt) === "elapsed" ? "past its deadline, can go back to the buyer" : `deadline in ${timeLeft(e.expiresAt)}`}</>}</>}
                amount={<Amount value={e.amount} decimals={tokenOf(e.token)?.decimals ?? 18} symbol={tokenOf(e.token)?.symbol ?? ""} />}
                status={<Pill tone={e.state === 1 ? "accent" : e.state === 2 ? "good" : "muted"}>{ESCROW_STATE[e.state]}</Pill>}
              />
            ))}
          </Card>
        </div>
      </Section>
    </div>
  )
}
