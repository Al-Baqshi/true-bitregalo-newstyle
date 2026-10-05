"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { type Address } from "viem"
import { abis, addresses, chain, explorerTx, KEEPER_API } from "@/lib/bitregalo/config"
import { codeFingerprint, hasFingerprint, parseDelivery, type DeliveryCode, type DeliveryRef } from "@/lib/bitregalo/delivery"
import { errorText } from "@/lib/bitregalo/errors"
import { useChainNow, useTx } from "@/lib/bitregalo/hooks"
import { Addr, Amount, Card, Notice, PageHead } from "@/components/app/ui"
import { ConnectButton } from "@/components/app/connect-button"
import { Button } from "@/components/ui/button"
import { inputCls } from "@/components/app/ui"
import { cn } from "@/lib/utils"

/*
 * The delivery page: what a QR code or delivery link opens, usually on a phone, at the handover.
 * No wallet is needed. The link carries the workspace, the held payment's number and the code in
 * its fragment, which the browser never sends to any server; this page reads it after it loads,
 * so nothing sensitive is ever rendered on the server. It checks the code against the fingerprint
 * on the chain locally, says in plain words what pressing the button does, and then asks
 * BitRegalo's keeper to present the code. The keeper pays the network fee; it can do nothing but
 * release this one payment to its supplier. Without a keeper, a connected wallet can send it.
 */

type Outcome = { released: true; transaction: string } | { error: string; message: string }
const isZero = (a?: string) => !a || /^0x0{40}$/.test(a)
const when = (ts: bigint | number) => new Date(Number(ts) * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

/** The relay's answers, in this app's words. The keeper's own sentence is shown when there is no better one. */
const RELAY_WORDS: Record<string, string> = {
  bad_code: "The code in this link is not in the right form. Ask the buyer for the link again.",
  wrong_code: "This code does not belong to this held payment.",
  no_delivery_code: "This held payment carries no delivery code, so only the buyer can release it.",
  deadline_passed: "The deadline has passed, so the code no longer works. Ask the buyer to give it more time; then try again.",
  not_held: "This payment is not held any more.",
  already_released: "This payment was already released to the supplier.",
  unknown_workspace: "There is no such workspace on this network.",
  too_many_requests: "Too many attempts from here. Wait a minute and try again.",
  network_unreachable: "BitRegalo's keeper could not reach the network. Try again in a moment, or send it from a wallet below.",
  not_sent: "BitRegalo's keeper could not send the transaction. Try again in a moment, or send it from a wallet below.",
}

export default function DeliverPage() {
  // Read after the page has loaded, from the fragment only. Nothing here is rendered on the server.
  const [ref, setRef] = useState<DeliveryRef | null>(null)
  const [typed, setTyped] = useState("")
  useEffect(() => {
    const apply = () => setRef(parseDelivery(window.location.hash))
    apply()
    window.addEventListener("hashchange", apply)
    return () => window.removeEventListener("hashchange", apply)
  }, [])
  const pasted = typed.trim() ? parseDelivery(typed) : null
  // What was pasted fills in what the link lacks.
  const w = pasted?.workspace ?? ref?.workspace
  const id = pasted?.id ?? ref?.id
  const code = pasted?.code ?? ref?.code
  const complete = w !== undefined && id !== undefined && !!code

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHead title="Confirm a delivery" intro="Opened from a delivery code. Pressing the button releases the held payment to the supplier and records the handover. No wallet is needed." />
      {ref === null ? (
        <p className="text-sm text-muted-foreground" role="status">Reading the link…</p>
      ) : complete ? (
        <Delivery workspace={w} id={id} code={code} />
      ) : null}
      {ref !== null && (
        <Card title={complete ? "Another code" : "Paste the link or the code"} description={complete ? "To confirm a different delivery, paste its link or code here." : "If the link did not carry everything, paste the whole link, or the code with the workspace and held payment numbers from the buyer."}>
          <div className="grid gap-3">
            <textarea className={cn(inputCls, "t-mono h-auto min-h-24 py-2.5 text-xs")} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="https://…/app/deliver#w=1&id=7&code=0x…   or   0x…" aria-label="Delivery link or code" spellCheck={false} autoCapitalize="none" autoCorrect="off" />
            {pasted && !pasted.code && <p className="text-sm text-destructive" role="status">No delivery code was found in that text. A code starts with 0x and has 64 letters and numbers after it.</p>}
            {pasted?.code && (w === undefined || id === undefined) && (
              <p className="text-sm text-muted-foreground">The code alone is not enough: the link also names the workspace and the held payment. Ask the buyer for the whole link.</p>
            )}
          </div>
        </Card>
      )}
      <p className="text-xs text-subtle">The code stays in this browser. It is sent only to BitRegalo&apos;s keeper when you press the button, and the keeper can do nothing with it but release this one payment to its supplier.</p>
    </div>
  )
}

function Delivery({ workspace, id, code }: { workspace: bigint; id: bigint; code: DeliveryCode }) {
  const { address, isConnected } = useAccount()
  const { send, isPending } = useTx()
  // Deadlines are judged by the network's clock, not this phone's.
  const now = useChainNow()
  const tenant = useReadContract({ address: addresses.mother, abi: abis.mother, functionName: "tenants", args: [workspace] })
  const t = tenant.data as { instance: Address; vault: Address } | undefined
  const found = !!t && !isZero(t.instance)
  const q = useReadContracts({
    contracts: found ? [
      { address: t!.instance, abi: abis.instance, functionName: "PROTOCOL_VERSION" },
      { address: t!.instance, abi: abis.instance, functionName: "feeBps" },
      { address: t!.vault, abi: abis.vault, functionName: "getEscrow", args: [id] },
      { address: t!.vault, abi: abis.vault, functionName: "getDelivery", args: [id] },
    ] : [],
    query: { enabled: found, refetchInterval: 8_000 },
  })
  const [protocol, feeBps, escrow, delivery] = (q.data ?? []).map((r) => r.result) as [number?, number?, { issuer: Address; receiver: Address; token: Address; amount: bigint; expiresAt: bigint; state: number }?, { codeHash: `0x${string}`; deliveredAt: bigint }?]
  const token = useReadContracts({
    contracts: escrow ? [
      { address: escrow.token, abi: abis.utilityToken, functionName: "symbol" },
      { address: escrow.token, abi: abis.utilityToken, functionName: "decimals" },
    ] : [],
    query: { enabled: !!escrow },
  })
  const sym = (token.data?.[0]?.result as string | undefined) ?? "tokens"
  const dec = Number((token.data?.[1]?.result as number | undefined) ?? 18)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [sending, setSending] = useState(false)
  const [walletTx, setWalletTx] = useState<string | null>(null)

  if (tenant.isLoading || (found && !q.data)) return <p className="text-sm text-muted-foreground" role="status">Reading the held payment…</p>
  if (tenant.isError || (found && q.data?.some((r) => r.status === "failure" && r.error) && !escrow)) {
    return <Notice tone="bad" title="The network could not be reached"><p>Check your connection and open the link again.</p></Notice>
  }
  if (!found) return <Notice tone="bad" title="There is no such workspace"><p>Workspace #{String(workspace)} does not exist on {chain.name}. Ask the buyer for the link again.</p></Notice>
  if (!escrow || isZero(escrow.issuer)) return <Notice tone="bad" title="There is no such held payment"><p>Workspace #{String(workspace)} has no held payment #{String(id)}. Ask the buyer for the link again.</p></Notice>
  if ((protocol ?? 2) < 3) return <Notice tone="bad" title="This workspace has no delivery codes"><p>It runs an earlier version of the contracts. Only the buyer&apos;s wallet can release this payment.</p></Notice>

  const fee = (escrow.amount * BigInt(feeBps ?? 0)) / 10_000n
  const payout = escrow.amount - fee
  const codeMatches = hasFingerprint(delivery?.codeHash) && codeFingerprint(code).toLowerCase() === delivery!.codeHash.toLowerCase()
  const delivered = !!delivery && delivery.deliveredAt > 0n
  const overdue = Number(escrow.expiresAt) <= now

  async function confirmByRelay() {
    setSending(true)
    setOutcome(null)
    try {
      const r = await fetch(`${KEEPER_API}/v1/deliver`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workspace: Number(workspace), id: Number(id), code }) })
      const j = (await r.json().catch(() => null)) as Outcome | null
      setOutcome(j ?? { error: "not_sent", message: "" })
    } catch {
      setOutcome({ error: "network_unreachable", message: "" })
    } finally {
      setSending(false)
      q.refetch()
    }
  }
  async function confirmByWallet() {
    const r = await send("Confirm delivery", { address: t!.vault, abi: abis.vault, functionName: "releaseWithCode", args: [id, code] })
    setWalletTx(r.transactionHash)
    q.refetch()
  }

  const amount = <Amount value={payout} decimals={dec} symbol={sym} />
  const txHash = outcome && "released" in outcome ? outcome.transaction : walletTx

  // Where the payment stands, in large plain words. A code that does not belong here is said first,
  // whatever the payment's state: the page must not confirm anything about an order the code is not for.
  if (!hasFingerprint(delivery?.codeHash)) {
    return <Notice tone="bad" title="This held payment carries no delivery code"><p>Only the buyer, <Addr a={escrow.issuer} />, can release it from their wallet.</p></Notice>
  }
  if (!codeMatches) {
    return <Notice tone="bad" title="This code does not belong to this held payment"><p>The link may be garbled, or it is for another order. Ask the buyer for the link again. Nothing has happened.</p></Notice>
  }
  if (escrow.state === 2) {
    return (
      <Card>
        <p className="t-heading">{delivered ? "Delivery confirmed." : "This payment was already released."}</p>
        <p className="mt-3 text-base">
          {delivered ? <>The handover was recorded on <b className="font-[620]">{when(delivery!.deliveredAt)}</b> and </> : "The buyer released it from their wallet, and "}
          {amount} went to the supplier <Addr a={escrow.receiver} />. Nothing more can happen to it.
        </p>
        {txHash && explorerTx(txHash) && <p className="mt-3 text-sm"><a className="text-gold underline underline-offset-4" href={explorerTx(txHash)} target="_blank" rel="noreferrer">See the transaction</a></p>}
      </Card>
    )
  }
  if (escrow.state === 3 || escrow.state === 4) {
    return (
      <Card>
        <p className="t-heading">{escrow.state === 3 ? "The supplier handed this payment back." : "This payment was returned to the buyer."}</p>
        <p className="mt-3 text-base">{escrow.state === 3 ? "The supplier chose not to deliver, and the buyer got all of it back." : "Its deadline passed without a handover, and it went back to the buyer in full."} The code can no longer do anything.</p>
      </Card>
    )
  }
  if (overdue) {
    return (
      <Card>
        <p className="t-heading">The deadline has passed.</p>
        <p className="mt-3 text-base">The code no longer works: it could be used until {when(escrow.expiresAt)}. Ask the buyer to give the payment more time; the code works again as soon as they do. Otherwise the payment goes back to the buyer{KEEPER_API ? " when BitRegalo's keeper returns it, a few minutes after the deadline" : " once someone returns it"}.</p>
      </Card>
    )
  }

  return (
    <Card>
      <p className="t-heading">Confirm that the goods were handed over.</p>
      <p className="mt-3 text-base">
        This releases <b className="font-[620]">{amount}</b> to the supplier <Addr a={escrow.receiver} />. It cannot be undone.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">Held payment #{String(id)} in workspace #{String(workspace)} on {chain.name}. The code works until {when(escrow.expiresAt)}.</p>

      {outcome && "error" in outcome && (
        <Notice tone="bad" title="Not confirmed"><p>{RELAY_WORDS[outcome.error] ?? outcome.message ?? "BitRegalo's keeper could not do it. Try again."}</p></Notice>
      )}

      <div className="mt-6 grid gap-4">
        {KEEPER_API ? (
          <div>
            <Button size="lg" className="w-full sm:w-auto" disabled={sending} onClick={confirmByRelay}>{sending ? "Confirming…" : "Confirm delivery"}</Button>
            <p className="mt-2 text-sm text-muted-foreground">{sending ? "BitRegalo's keeper is sending the transaction. This takes a few seconds." : "Sent through BitRegalo's keeper, which pays the network fee. No wallet needed."}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">This network has no keeper, so the code is sent from a wallet.</p>
        )}
        {(!KEEPER_API || (outcome && "error" in outcome && ["network_unreachable", "not_sent", "too_many_requests"].includes(outcome.error))) && (
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">{KEEPER_API ? "Or send it from a wallet: any wallet can present the code." : "Any wallet can present the code; it pays only the network fee."}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {isConnected ? <Button variant="secondary" disabled={isPending} onClick={() => confirmByWallet().catch((e) => setOutcome({ error: "wallet", message: errorText(e) }))}>Send it from my wallet</Button> : <ConnectButton variant="outline" />}
              {address && <span className="text-xs text-subtle">Connected as {address.slice(0, 6)}…{address.slice(-4)}</span>}
            </div>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Hand over the goods once this page says the delivery is confirmed, not before. <Link className="underline decoration-1 underline-offset-[3px]" href={`/app/t/${workspace}/escrows/${id}`}>The held payment&apos;s page</Link> shows the same record to everyone.
        </p>
      </div>
    </Card>
  )
}
