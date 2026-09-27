"use client"
import { use } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { Lock, Undo2, Clock } from "lucide-react"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useEscrow, useTx, useErc20 } from "@/lib/bitregalo/hooks"
import { abis } from "@/lib/bitregalo/config"
import { Card, Addr, Pill, Amount } from "@/components/app/ui"
import { Journey, when, inWords, type JourneyStep } from "@/components/app/journey"
import { ConnectButton } from "@/components/app/connect-button"
import { Button } from "@/components/ui/button"

const STATE = ["", "Money held", "Released to supplier", "Handed back to buyer", "Returned to buyer after deadline"]

export default function EscrowPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { id: raw } = use(params)
  const id = BigInt(raw)
  const { address, isConnected } = useAccount()
  const { escrow: e, refetch } = useEscrow(id)
  const { send, isPending } = useTx()
  const erc = useErc20(e?.token, address)
  if (!e) return <p className="text-sm text-muted-foreground">Loading escrow #{raw}…</p>

  const me = address?.toLowerCase()
  const isBuyer = me === e.issuer.toLowerCase()
  const isSupplier = me === e.receiver.toLowerCase()
  const active = e.state === 1
  const overdue = Number(e.expiresAt) <= Date.now() / 1000
  const fee = (e.amount * BigInt(e.feeBps)) / 10_000n
  const sym = erc.symbol
  const act = (label: string, fn: string) => () => send(label, { address: t.vault, abi: abis.vault, functionName: fn, args: [id] }).then(() => refetch())

  const journey: JourneyStep[] = [
    { title: "Money locked", note: `${new Intl.NumberFormat().format(Number(e.amount) / 10 ** erc.decimals)} ${sym} moved into the vault`, state: "done" },
    { title: "Work in progress", note: active ? (overdue ? `Deadline passed ${inWords(e.expiresAt)}` : `Deadline ${when(e.expiresAt)} (${inWords(e.expiresAt)})`) : "Finished", state: active ? "current" : "done" },
    { title: active ? "Settled" : STATE[e.state], note: active ? "Released, handed back, or returned at the deadline" : e.state === 2 ? "Supplier paid" : "Buyer refunded in full", state: active ? "next" : "done" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link href={`${base}/escrows`} className="bq-label hover:text-foreground">← All escrows</Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill tone={active ? "accent" : e.state === 2 ? "good" : "muted"}>{STATE[e.state]}</Pill>
          {isBuyer && <Pill>you are the buyer</Pill>}{isSupplier && <Pill>you are the supplier</Pill>}
        </div>
        <h1 className="bq-display mt-3 text-4xl font-semibold"><Amount value={e.amount} decimals={erc.decimals} symbol={sym} /> <span className="text-muted-foreground">held for delivery</span></h1>
        <p className="mt-2 text-sm text-muted-foreground">Buyer <Addr a={e.issuer} /> → supplier <Addr a={e.receiver} /> · escrow #{raw}</p>
      </div>

      <Card><Journey steps={journey} /></Card>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card title="The three ways this can end">
          <ul className="space-y-4 text-sm leading-relaxed">
            <li className="flex gap-3"><Lock className="mt-0.5 size-4 shrink-0 text-accent" /><span><b>The buyer releases it</b> once the work is done. The supplier receives <Amount value={e.amount - fee} decimals={erc.decimals} symbol={sym} /> — the amount minus the {e.feeBps / 100}% platform fee. Only the buyer can do this.</span></li>
            <li className="flex gap-3"><Undo2 className="mt-0.5 size-4 shrink-0 text-primary" /><span><b>The supplier hands it back</b> if they can&apos;t deliver. The buyer gets everything back. Only the supplier can do this.</span></li>
            <li className="flex gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span><b>The deadline passes</b> ({when(e.expiresAt)}) with neither happening. Anyone can then return it to the buyer, in full.</span></li>
          </ul>
          <p className="mt-5 rounded-lg bg-secondary/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">No person holds this money — not BitRegalo and not the workspace admin. The vault contract follows these three rules and nothing else, and nobody can move the money towards themselves.</p>
        </Card>

        <Card title="What you can do">
          {!active && <p className="text-sm text-muted-foreground">This escrow is finished: {STATE[e.state].toLowerCase()}.</p>}
          {active && !isConnected && <div className="space-y-3 text-sm text-muted-foreground"><p>Connect the buyer&apos;s or supplier&apos;s wallet to act.</p><ConnectButton /></div>}
          {active && isConnected && (
            <div className="space-y-4 text-sm">
              {isBuyer && !overdue && <><p className="text-[color:var(--bq-ivory-dim)]">Happy with the work? Release the payment to the supplier.</p><Button disabled={isPending} onClick={act("Release payment", "release")}>Release payment</Button></>}
              {isSupplier && !overdue && <><p className="text-[color:var(--bq-ivory-dim)]">Can&apos;t deliver? Hand the money back to the buyer.</p><Button variant="secondary" disabled={isPending} onClick={act("Hand back", "cancel")}>Hand the money back</Button></>}
              {overdue && <><p className="text-[color:var(--bq-ivory-dim)]">The deadline has passed without a release, so the money goes back to the buyer.</p><Button variant="secondary" disabled={isPending} onClick={act("Return to buyer", "expire")}>Return it to the buyer</Button></>}
              {!isBuyer && !isSupplier && !overdue && <p className="text-muted-foreground">You aren&apos;t the buyer or the supplier, so there is nothing for you to do here. Everyone can watch it, though.</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
