"use client"
import { use } from "react"
import { useAccount } from "wagmi"
import { useEscrow, useTx, useErc20 } from "@/lib/bitregalo/hooks"
import { abis, addresses, ESCROW_STATE } from "@/lib/bitregalo/config"
import { Card, Addr, Pill, Amount, timeLeft } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

export default function EscrowDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = use(params)
  const id = BigInt(raw)
  const { address } = useAccount()
  const { escrow, refetch } = useEscrow(id)
  const { send, isPending } = useTx()
  const erc = useErc20(escrow?.token, address)
  if (!escrow) return <p className="text-sm text-muted-foreground">Loading escrow #{raw}…</p>
  const me = address?.toLowerCase()
  const isIssuer = me === escrow.issuer.toLowerCase()
  const isReceiver = me === escrow.receiver.toLowerCase()
  const active = escrow.state === 1
  const elapsed = Number(escrow.expiresAt) <= Math.floor(Date.now() / 1000)
  const fee = (escrow.amount * BigInt(escrow.feeBps)) / 10_000n
  const act = (label: string, fn: string) => async () => {
    await send(label, { address: addresses.vault, abi: abis.vault, functionName: fn, args: [id] })
    refetch()
  }
  return (
    <div className="space-y-6">
      <Card title={`Escrow #${raw}`}>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Pill tone={active ? "accent" : escrow.state === 2 ? "good" : "muted"}>{ESCROW_STATE[escrow.state]}</Pill>
          <span><Amount value={escrow.amount} decimals={erc.decimals} symbol={erc.symbol} /></span>
          <span className="text-muted-foreground">issuer <Addr a={escrow.issuer} /></span>
          <span className="text-muted-foreground">receiver <Addr a={escrow.receiver} /></span>
          <span className="text-muted-foreground">{active ? (elapsed ? "term elapsed" : `expires in ${timeLeft(escrow.expiresAt)}`) : ""}</span>
          <span className="text-muted-foreground">fee {escrow.feeBps / 100}% (<Amount value={fee} decimals={erc.decimals} symbol={erc.symbol} />)</span>
        </div>
        <ul className="mt-4 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
          <li>Only the <b className="text-foreground">issuer</b> can release → receiver gets <Amount value={escrow.amount - fee} decimals={erc.decimals} symbol={erc.symbol} />.</li>
          <li>Only the <b className="text-foreground">receiver</b> can cancel → issuer gets everything back.</li>
          <li>After the term, <b className="text-foreground">anyone</b> can expire it → issuer gets everything back.</li>
        </ul>
      </Card>
      {active && (
        <Card title="Actions">
          <div className="flex flex-wrap gap-3">
            {isIssuer && !elapsed && <Button disabled={isPending} onClick={act("Release escrow", "release")}>Release to receiver</Button>}
            {isReceiver && !elapsed && <Button variant="secondary" disabled={isPending} onClick={act("Cancel escrow", "cancel")}>Cancel and refund issuer</Button>}
            {elapsed && <Button variant="secondary" disabled={isPending} onClick={act("Expire escrow", "expire")}>Expire and refund issuer</Button>}
            {!isIssuer && !isReceiver && !elapsed && <p className="text-xs text-muted-foreground">Connect as the issuer or the receiver to act on this escrow.</p>}
          </div>
        </Card>
      )}
    </div>
  )
}
