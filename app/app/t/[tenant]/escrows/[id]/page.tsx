"use client"
import { use } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useEscrow, useTx, useErc20 } from "@/lib/bitregalo/hooks"
import { abis } from "@/lib/bitregalo/config"
import { Card, Addr, Pill, Amount, PageHead, Section, Facts, Fact, Empty, RowsSkeleton } from "@/components/app/ui"
import { Journey, when, inWords, type JourneyStep } from "@/components/app/journey"
import { ConnectButton } from "@/components/app/connect-button"
import { Button } from "@/components/ui/button"

/** What each state means, in the words the page uses. */
const STATE = ["", "Money held", "Released to the supplier", "Handed back to the buyer", "Returned to the buyer after the deadline"]
const PILL: Record<number, { word: string; tone: "accent" | "good" | "muted" }> = {
  1: { word: "Held", tone: "accent" },
  2: { word: "Released", tone: "good" },
  3: { word: "Handed back", tone: "muted" },
  4: { word: "Returned", tone: "muted" },
}

export default function EscrowPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTenant()
  const base = t.base
  const { id: raw } = use(params)
  const id = BigInt(raw)
  const { address, isConnected } = useAccount()
  const { escrow: e, refetch } = useEscrow(id)
  const { send, isPending } = useTx()
  const erc = useErc20(e?.token, address)
  const back = { href: `${base}/escrows`, label: "All escrows" }
  const title = `Escrow #${raw}`

  if (!e) {
    return (
      <div className="space-y-8">
        <PageHead back={back} title={title} />
        <Card flush><RowsSkeleton rows={3} /></Card>
      </div>
    )
  }
  if (/^0x0{40}$/.test(e.issuer)) {
    return (
      <div className="space-y-8">
        <PageHead back={back} title={title} />
        <Card flush>
          <Empty title={`No escrow #${raw} here`} body="This workspace has no escrow with that number." action={<Button asChild variant="secondary"><Link href={back.href}>All escrows</Link></Button>} />
        </Card>
      </div>
    )
  }

  const me = address?.toLowerCase()
  const isBuyer = me === e.issuer.toLowerCase()
  const isSupplier = me === e.receiver.toLowerCase()
  const active = e.state === 1
  const overdue = Number(e.expiresAt) <= Date.now() / 1000
  const fee = (e.amount * BigInt(e.feeBps)) / 10_000n
  const sym = erc.symbol
  const dec = erc.decimals
  const pct = e.feeBps / 100
  const act = (label: string, fn: string) => () => send(label, { address: t.vault, abi: abis.vault, functionName: fn, args: [id] }).then(() => refetch())
  const pill = PILL[e.state] ?? { word: "—", tone: "muted" as const }
  const deadline = when(e.expiresAt)

  const journey: JourneyStep[] = [
    { title: "Money locked", note: `${new Intl.NumberFormat().format(Number(e.amount) / 10 ** dec)} ${sym} moved into the vault`, state: "done" },
    { title: "Work in progress", note: active ? (overdue ? `Deadline passed ${inWords(e.expiresAt)}` : `Deadline ${deadline} (${inWords(e.expiresAt)})`) : "Finished", state: active ? "current" : "done" },
    { title: active ? "Settled" : STATE[e.state], note: active ? "Released, handed back, or returned at the deadline" : e.state === 2 ? "The supplier was paid" : "The buyer got it all back", state: active ? "next" : "done" },
  ]

  /** One sentence on where the money stands right now. */
  const standing = active
    ? overdue
      ? `The deadline (${deadline}) has passed without a release or a hand-back, so this money can only go back to the buyer.`
      : `Held by the vault until the buyer releases it, the supplier hands it back, or the deadline on ${deadline} passes.`
    : e.state === 2
      ? <>The buyer released it. The supplier received <Amount value={e.amount - fee} decimals={dec} symbol={sym} />, the amount minus the {pct}% platform fee.</>
      : e.state === 3
        ? "The supplier handed it back. The buyer got all of it back."
        : "The deadline passed with no release and no hand-back, so it went back to the buyer in full."

  // What the connected wallet may do now. The conditions are the vault's own rules.
  const canRelease = active && isConnected && isBuyer && !overdue
  const canHandBack = active && isConnected && isSupplier && !overdue
  const canReturn = active && isConnected && overdue
  const onlyWatching = active && isConnected && !isBuyer && !isSupplier && !overdue

  return (
    <div className="space-y-10">
      <PageHead
        back={back}
        title={title}
        intro={<>From buyer <Addr a={e.issuer} /> for supplier <Addr a={e.receiver} />, held by this workspace&apos;s vault.</>}
      />

      {/* The amount and its state, in one glance. */}
      <section>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="t-figure text-4xl sm:text-5xl"><Amount value={e.amount} decimals={dec} symbol={sym} /></p>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={pill.tone}>{pill.word}</Pill>
            {isBuyer && <Pill>You are the buyer</Pill>}
            {isSupplier && <Pill>You are the supplier</Pill>}
          </div>
        </div>
        <p className="mt-3 max-w-[62ch] text-base text-muted-foreground">{standing}</p>
      </section>

      <Card><Journey steps={journey} /></Card>

      {active && (
        <Section title="Who can move this money">
          <p className="max-w-[62ch] text-base">
            Only the buyer can release it. Only the supplier can hand it back.
            {overdue
              ? " The deadline has passed, so neither can happen any more: anyone can now return it to the buyer, in full."
              : <> After <span className="font-[560]">{deadline}</span> neither can happen any more: the money can then only go back to the buyer, in full, and anyone can trigger that.</>}
          </p>
          <dl className="mt-5 divide-y divide-border border-y border-border">
            <Outcome label="If the buyer releases it" muted={overdue}>The supplier receives <Amount value={e.amount - fee} decimals={dec} symbol={sym} />: the amount minus the {pct}% platform fee.</Outcome>
            <Outcome label="If the supplier hands it back" muted={overdue}>The buyer gets all <Amount value={e.amount} decimals={dec} symbol={sym} /> back.</Outcome>
            <Outcome label={overdue ? "Now that the deadline has passed" : `If neither happens by ${deadline}`}>Anyone can return it to the buyer, in full.</Outcome>
          </dl>
          <p className="mt-4 max-w-[68ch] text-sm text-muted-foreground">No person holds this money: not BitRegalo, not the workspace admin. The vault contract follows these three rules and nothing else, and nobody can move the money towards themselves.</p>
        </Section>
      )}

      <Card title={active ? "What you can do" : "Finished"}>
        {!active && <p className="text-base text-muted-foreground">This escrow is finished: {STATE[e.state].toLowerCase()}. Nothing more can happen to it.</p>}
        {active && !isConnected && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-[48ch] text-base text-muted-foreground">Connect the buyer&apos;s or the supplier&apos;s wallet to act on it. Anyone else can only watch.</p>
            <ConnectButton />
          </div>
        )}
        {active && isConnected && (
          <div className="space-y-5">
            {canRelease && (
              <Action body={<>Happy with the work? Releasing sends <Amount value={e.amount - fee} decimals={dec} symbol={sym} /> to the supplier. This cannot be undone.</>}>
                <Button disabled={isPending} onClick={act("Release payment", "release")}>Release payment</Button>
              </Action>
            )}
            {canHandBack && (
              <Action body={<>Can&apos;t deliver? Handing the money back returns all <Amount value={e.amount} decimals={dec} symbol={sym} /> to the buyer. This cannot be undone.</>}>
                <Button variant={canRelease ? "secondary" : "default"} disabled={isPending} onClick={act("Hand back", "cancel")}>Hand the money back</Button>
              </Action>
            )}
            {canReturn && (
              <Action body={<>The deadline has passed without a release, so the money goes back to the buyer. Anyone can send it on its way.</>}>
                <Button disabled={isPending} onClick={act("Return to buyer", "expire")}>Return it to the buyer</Button>
              </Action>
            )}
            {onlyWatching && <p className="text-base text-muted-foreground">You are not the buyer or the supplier, so there is nothing for you to do here. Anyone can watch it, though.</p>}
          </div>
        )}
      </Card>

      <Card title="Details">
        <Facts columns={3}>
          <Fact label="Buyer"><Addr a={e.issuer} /></Fact>
          <Fact label="Supplier"><Addr a={e.receiver} /></Fact>
          <Fact label="Deadline">{deadline}</Fact>
          <Fact label="Currency">{sym} · <Addr a={e.token} /></Fact>
          <Fact label="Platform fee on release">{pct}% · <Amount value={fee} decimals={dec} symbol={sym} /></Fact>
          <Fact label="Held by">Vault <Addr a={t.vault} /></Fact>
        </Facts>
      </Card>
    </div>
  )
}

/** One of the ways an escrow can end: the condition on the left, what happens to the money on the right. */
function Outcome({ label, children, muted = false }: { label: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <div className={`grid gap-1 py-3 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-6 ${muted ? "text-subtle" : ""}`}>
      <dt className={`text-sm ${muted ? "" : "font-[560]"}`}>{label}{muted ? " (no longer possible)" : ""}</dt>
      <dd className={`text-sm ${muted ? "" : "text-muted-foreground"}`}>{children}</dd>
    </div>
  )
}

/** One thing the connected wallet may do, explained before the button. */
function Action({ body, children }: { body: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <p className="max-w-[52ch] text-base">{body}</p>
      {children}
    </div>
  )
}
