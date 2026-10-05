"use client"
import { use, useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useChainNow, useCredit, useDelivery, useEscrow, useTx, useErc20 } from "@/lib/bitregalo/hooks"
import { useInstanceRules } from "@/lib/bitregalo/instance-rules"
import { hasFingerprint, storedCode } from "@/lib/bitregalo/delivery"
import { abis, KEEPER_API } from "@/lib/bitregalo/config"
import { DeliveryCodeCard } from "@/components/app/delivery-code"
import { Label, input } from "@/components/app/wizard/fields"
import { Card, Addr, Pill, Amount, PageHead, Section, Facts, Fact, Empty, Notice, RowsSkeleton } from "@/components/app/ui"
import { Journey, when, inWords, type JourneyStep } from "@/components/app/journey"
import { ConnectButton } from "@/components/app/connect-button"
import { Button } from "@/components/ui/button"

/** What each state means, in the words the page uses. */
const STATE = ["", "Payment held", "Released to the supplier", "Handed back to the buyer", "Returned to the buyer after the deadline"]
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
  // A payout the token refused to deliver is credited to the same wallet, to collect later.
  const credit = useCredit(e?.token, address)
  // Delivery confirmation (protocol version 3): the code's fingerprint and the recorded handover.
  const delivery = useDelivery(id)
  const rules = useInstanceRules(t.instance)
  // Deadlines are judged by the network's clock.
  const now = useChainNow()
  const [newDeadline, setNewDeadline] = useState("")
  const [showCode, setShowCode] = useState(false)
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
  const overdue = Number(e.expiresAt) <= now
  const fee = (e.amount * BigInt(e.feeBps)) / 10_000n
  const sym = erc.symbol
  const dec = erc.decimals
  const pct = e.feeBps / 100
  const act = (label: string, fn: string) => () => send(label, { address: t.vault, abi: abis.vault, functionName: fn, args: [id] }).then(() => refetch())
  const pill = PILL[e.state] ?? { word: "—", tone: "muted" as const }
  const deadline = when(e.expiresAt)
  const hasCode = t.delivery && hasFingerprint(delivery.delivery?.codeHash)
  const deliveredAt = t.delivery && delivery.delivery && delivery.delivery.deliveredAt > 0n ? delivery.delivery.deliveredAt : null
  const myCode = isBuyer && hasCode ? storedCode(t.vault, id, delivery.delivery?.codeHash) : null
  // Giving more time: at least an hour from now, at most the workspace's longest term from now, and later than today's deadline.
  const extendTs = newDeadline ? Math.floor(new Date(newDeadline).getTime() / 1000) : 0
  const extendMin = Math.max(now + 3600, Number(e.expiresAt) + 1)
  const extendMax = now + rules.maxTerm
  const extendProblem = !newDeadline ? "Choose the new deadline" : extendTs <= Number(e.expiresAt) ? "The new deadline must be later than the current one" : extendTs < now + 3600 ? "The new deadline must be at least an hour from now" : rules.loaded && extendTs > extendMax ? `The longest term in this workspace is ${Math.round(rules.maxTerm / 86400)} days from now` : null
  const returnWord = KEEPER_API ? "anyone can trigger that, and BitRegalo's keeper service does so a few minutes after the deadline" : "someone has to trigger that"

  const journey: JourneyStep[] = [
    { title: "Payment locked", note: `${new Intl.NumberFormat().format(Number(e.amount) / 10 ** dec)} ${sym} moved into the vault`, state: "done" },
    { title: "Work in progress", note: active ? (overdue ? `Deadline passed ${inWords(e.expiresAt)}` : `Deadline ${deadline} (${inWords(e.expiresAt)})`) : "Finished", state: active ? "current" : "done" },
    { title: active ? "Settled" : STATE[e.state], note: active ? (hasCode ? "Released by the delivery code or the buyer, handed back, or returned at the deadline" : "Released, handed back, or returned at the deadline") : e.state === 2 ? (deliveredAt ? `Handover recorded ${when(deliveredAt)}; the supplier was paid` : "The supplier was paid") : "The buyer got it all back", state: active ? "next" : "done" },
  ]

  /** One sentence on where the payment stands right now. */
  const standing = active
    ? overdue
      ? `The deadline (${deadline}) has passed without a release or a hand-back, so this payment can only go back to the buyer.`
      : `Held by the vault until the buyer releases it, the supplier hands it back, or the deadline on ${deadline} passes.`
    : e.state === 2
      ? deliveredAt
        ? <>Delivery was confirmed with the code on {when(deliveredAt)}. The supplier was paid <Amount value={e.amount - fee} decimals={dec} symbol={sym} />, the amount minus the {pct}% platform fee.</>
        : <>The buyer released it. The supplier was paid <Amount value={e.amount - fee} decimals={dec} symbol={sym} />, the amount minus the {pct}% platform fee.</>
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

      {credit.amount > 0n && (
        <Notice
          tone="accent"
          title="A payout is credited to your wallet"
          action={<Button disabled={isPending} onClick={() => send(`Collect ${sym}`, { address: t.vault, abi: abis.vault, functionName: "claim", args: [e.token] }).then(() => { credit.refetch(); erc.refetch() })}>Collect</Button>}
        >
          <p>
            <Amount value={credit.amount} decimals={dec} symbol={sym} /> is waiting for you in this workspace&apos;s vault. The token did not deliver it when a held payment settled, so the vault credited it to your wallet instead. Collecting sends it to your wallet. Only your wallet can collect it.
          </p>
        </Notice>
      )}

      <Card><Journey steps={journey} /></Card>

      {active && (
        <Section title="Who can move this payment">
          <p className="max-w-[62ch] text-base">
            Only the buyer can release it{hasCode ? ", or whoever presents the delivery code at the handover" : ""}. Only the supplier can hand it back.
            {overdue
              ? " The deadline has passed, so neither can happen any more: anyone can now return it to the buyer, in full."
              : <> After <span className="font-[560]">{deadline}</span> neither can happen any more: the payment can then only go back to the buyer, in full, and anyone can trigger that.</>}
          </p>
          <dl className="mt-5 divide-y divide-border border-y border-border">
            <Outcome label={hasCode ? "If the buyer releases it, or the delivery code is presented" : "If the buyer releases it"} muted={overdue}>The supplier receives <Amount value={e.amount - fee} decimals={dec} symbol={sym} />: the amount minus the {pct}% platform fee.{hasCode ? " With the code, the handover is recorded with its time." : ""}</Outcome>
            <Outcome label="If the supplier hands it back" muted={overdue}>The buyer gets all <Amount value={e.amount} decimals={dec} symbol={sym} /> back.</Outcome>
            <Outcome label={overdue ? "Now that the deadline has passed" : `If neither happens by ${deadline}`}>It can only go back to the buyer, in full: {returnWord}.{t.delivery ? " The buyer can give it more time instead." : ""}</Outcome>
          </dl>
          <p className="mt-4 max-w-[68ch] text-sm text-muted-foreground">No person holds this payment: not BitRegalo, not the workspace admin. The vault contract follows these three rules and nothing else, and nobody can move the payment towards themselves.</p>
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
              <Action body={<>Can&apos;t deliver? Handing it back returns all <Amount value={e.amount} decimals={dec} symbol={sym} /> to the buyer. This cannot be undone.</>}>
                <Button variant={canRelease ? "secondary" : "default"} disabled={isPending} onClick={act("Hand back", "cancel")}>Hand the payment back</Button>
              </Action>
            )}
            {canReturn && (
              <Action body={<>The deadline has passed without a release, so the payment can only go back to the buyer. Anyone can send it on its way{KEEPER_API ? ", and BitRegalo's keeper service does so a few minutes after the deadline" : ""}.{isBuyer && t.delivery ? " Or give it more time below." : ""}</>}>
                <Button variant={isBuyer && t.delivery ? "secondary" : "default"} disabled={isPending} onClick={act("Return to buyer", "expire")}>Return it to the buyer</Button>
              </Action>
            )}
            {isBuyer && t.delivery && (
              <div className="border-t border-border pt-5">
                <p className="t-subheading">Give it more time</p>
                <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">
                  The deadline is {deadline}{overdue ? ", which has passed" : ""}. You can move it later, so the order can wait for a late delivery instead of going back to you. At least an hour from now, and at most {rules.loaded ? `${Math.round(rules.maxTerm / 86400)} days` : "the workspace's longest term"} from now. The supplier gains time; you give up nothing else.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,16rem)_auto] sm:items-end">
                  <Label title="New deadline">
                    <input className={input} type="datetime-local" value={newDeadline} min={new Date(extendMin * 1000).toISOString().slice(0, 16)} onChange={(ev) => setNewDeadline(ev.target.value)} />
                  </Label>
                  <div className="sm:pb-0.5">
                    <Button variant="secondary" disabled={isPending || !!extendProblem} onClick={() => send("Give it more time", { address: t.vault, abi: abis.vault, functionName: "extendTerm", args: [id, BigInt(extendTs)] }).then(() => { setNewDeadline(""); refetch() })}>Give it more time</Button>
                  </div>
                </div>
                {newDeadline && extendProblem && <p className="mt-2 text-sm text-destructive" role="status">{extendProblem}</p>}
              </div>
            )}
            {onlyWatching && <p className="text-base text-muted-foreground">You are not the buyer or the supplier, so there is nothing for you to do here. Anyone can watch it, though.</p>}
          </div>
        )}
      </Card>

      {t.delivery && (
        <Section title="Delivery confirmation" description={hasCode ? "This held payment carries a delivery code. Whoever presents it at the handover releases the payment to the supplier and records the delivery." : "This held payment carries no delivery code. Only the buyer can release it."}>
          <Card>
            <Facts columns={2}>
              <Fact label="Delivery code">{delivery.delivery === undefined ? "…" : hasCode ? "Yes" : "No"}</Fact>
              <Fact label="Handover">{deliveredAt ? `Recorded ${when(deliveredAt)}` : hasCode ? (active ? "Not yet" : "Not recorded") : "—"}</Fact>
            </Facts>
            {hasCode && isBuyer && (
              <div className="mt-6 border-t border-border pt-5">
                {myCode ? (
                  showCode ? <DeliveryCodeCard workspace={t.id} id={id} code={myCode} /> : (
                    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                      <p className="max-w-[52ch] text-base">The delivery code is kept in this browser. Show it to give it to the recipient again, or to print it.</p>
                      <Button variant="secondary" onClick={() => setShowCode(true)}>Show the delivery code</Button>
                    </div>
                  )
                ) : (
                  <p className="max-w-[62ch] text-base text-muted-foreground">The delivery code is not in this browser. It was shown once, when the payment was opened, and the chain keeps only its fingerprint. If the recipient has it, nothing is lost; otherwise only your wallet can release this payment.</p>
                )}
              </div>
            )}
            {hasCode && isSupplier && active && (
              <p className="mt-6 max-w-[62ch] border-t border-border pt-5 text-base">
                At the handover, scan the recipient&apos;s delivery code with your phone (it opens this app&apos;s delivery page) or open the link they show you, and press “Confirm delivery”. Hand over the goods once the release shows as confirmed, not before. The release reaches you as it would from the buyer, and the handover is recorded with its time.
              </p>
            )}
          </Card>
        </Section>
      )}

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

/** One of the ways an escrow can end: the condition on the left, what happens to the payment on the right. */
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
