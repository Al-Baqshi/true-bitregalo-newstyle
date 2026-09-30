"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { isAddress, parseUnits, type Address } from "viem"
import { ArrowDownToLine, KeyRound, QrCode, Undo2 } from "lucide-react"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useTx } from "@/lib/bitregalo/hooks"
import { useSettlementTokens } from "@/lib/bitregalo/instances"
import { abis, addresses, explorerAddress, short } from "@/lib/bitregalo/config"
import { Card, Addr, Amount, PageHead, Pill } from "@/components/app/ui"
import { Explainer } from "@/components/app/explain"
import { input } from "@/components/app/wizard/fields"
import { Button } from "@/components/ui/button"
import { OlderContract } from "@/components/app/older-contract"

export default function TreasuryPage() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { address } = useAccount()
  const { send, isPending } = useTx()
  const tr = t.treasury
  const head = useReadContracts({
    contracts: tr ? [
      { address: tr, abi: abis.workspaceTreasury, functionName: "owner" },
      { address: tr, abi: abis.workspaceTreasury, functionName: "pendingOwner" },
    ] : [],
    query: { enabled: !!tr, refetchInterval: 15_000 },
  })
  const [owner, pending] = (head.data ?? []).map((r) => r.result) as [Address?, Address?]
  const me = address?.toLowerCase()
  const isOwner = !!me && owner?.toLowerCase() === me
  const isPending_ = !!me && pending?.toLowerCase() === me
  const settle = useSettlementTokens(t.instance, t.id)
  const factoryTokens = useReadContract({ address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tenantTokens", args: [t.id] })
  const tokenList = Array.from(new Set([...settle.all.map((x) => x.address), ...(((factoryTokens.data as Address[] | undefined) ?? []))]))
  const bal = useReadContracts({
    contracts: tokenList.flatMap((a) => [
      { address: a, abi: abis.utilityToken, functionName: "symbol" },
      { address: a, abi: abis.utilityToken, functionName: "decimals" },
      { address: a, abi: abis.erc20, functionName: "balanceOf", args: [tr ?? t.instance] },
      { address: a, abi: abis.utilityToken, functionName: "owner" },
    ]),
    query: { enabled: !!tr && tokenList.length > 0, refetchInterval: 15_000 },
  })
  const rows = tokenList.map((a, i) => ({
    token: a,
    symbol: (bal.data?.[i * 4]?.result as string) ?? "…",
    decimals: Number((bal.data?.[i * 4 + 1]?.result as number) ?? 18),
    amount: (bal.data?.[i * 4 + 2]?.result as bigint) ?? 0n,
    mintedByTreasury: !!tr && ((bal.data?.[i * 4 + 3]?.result as Address | undefined)?.toLowerCase() === tr.toLowerCase()),
    stable: settle.accepted.some((x) => x.address === a),
  }))
  const [newOwner, setNewOwner] = useState("")
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const refresh = () => { head.refetch(); bal.refetch() }
  if (t.version < 1n) return <OlderContract what="A workspace treasury" />
  if (!tr) return <p className="text-sm text-muted-foreground">Loading treasury…</p>
  return (
    <div className="space-y-8">
      <PageHead eyebrow={`Workspace #${String(t.id)}`} title="Treasury" intro="Your organisation's own money box. Sales, redemptions and payment links land here. Only its owner can take money out; BitRegalo cannot touch it." action={<Button asChild variant="secondary"><Link href={`${base}/get-paid?to=${tr}`}><QrCode className="size-4" />Get paid into it</Link></Button>} />
      <Explainer id="treasury" title="What this is">
        <p>The treasury is a small contract created together with your workspace, at <a className="bq-mono underline-offset-2 hover:underline" href={explorerAddress(tr)} target="_blank" rel="noreferrer">{short(tr)}</a>. It is owned by <Addr a={owner ?? ""} />{isOwner ? " — that's you" : ""}. Anyone can pay into it; only the owner can withdraw, and ownership only changes when the new owner accepts.</p>
        <p>It also holds the stock for your sales. If you hand it the minting of a token, it creates tokens as they sell and you can take minting back here.</p>
      </Explainer>
      {isPending_ && <Card title="Ownership offered to you"><Button disabled={isPending} onClick={() => send("Accept treasury ownership", { address: tr, abi: abis.workspaceTreasury, functionName: "acceptOwnership", args: [] }).then(refresh)}>Accept</Button></Card>}
      <Card title="Balances">
        <div className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.token} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-4">
                <span className="bq-display text-3xl font-semibold tabular-nums"><Amount value={r.amount} decimals={r.decimals} /></span>
                <span className="text-sm text-muted-foreground">{r.symbol}</span>
                {r.stable ? <Pill>accepted currency</Pill> : <Pill tone="accent">utility stock</Pill>}
                {r.mintedByTreasury && <Pill tone="good">mints on demand</Pill>}
              </div>
              {isOwner && (
                <div className="flex flex-wrap items-center gap-2">
                  {r.amount > 0n && <>
                    <input className={`${input} bq-mono max-w-36`} type="number" min="0" step="any" placeholder="all" value={amounts[r.token] ?? ""} onChange={(e) => setAmounts({ ...amounts, [r.token]: e.target.value })} />
                    <Button size="sm" disabled={isPending} onClick={() => send(`Withdraw ${r.symbol}`, { address: tr, abi: abis.workspaceTreasury, functionName: "withdraw", args: [r.token, address, amounts[r.token] ? parseUnits(amounts[r.token], r.decimals) : r.amount] }).then(() => { setAmounts({ ...amounts, [r.token]: "" }); refresh() })}><ArrowDownToLine className="size-4" />Withdraw</Button>
                  </>}
                  {r.mintedByTreasury && <Button size="sm" variant="secondary" disabled={isPending} onClick={() => send(`Take back minting of ${r.symbol}`, { address: tr, abi: abis.workspaceTreasury, functionName: "releaseToken", args: [r.token, address] }).then(refresh)}><Undo2 className="size-4" />Take minting back</Button>}
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && <p className="py-4 text-sm text-muted-foreground">No tokens known yet.</p>}
        </div>
        {!isOwner && address && <p className="mt-3 text-xs text-muted-foreground">Only the treasury owner can withdraw.</p>}
      </Card>
      {isOwner && (
        <Card title="Hand over ownership">
          <div className="flex items-start gap-3"><KeyRound className="mt-0.5 size-5 shrink-0 text-primary" /><div className="flex-1">
            <p className="text-sm text-muted-foreground">Offer the treasury to another wallet, for example a shared multi-signature wallet. Nothing changes until they accept.</p>
            <div className="mt-3 flex gap-2"><input className={`${input} bq-mono`} value={newOwner} onChange={(e) => setNewOwner(e.target.value.trim())} placeholder="0x…" /><Button variant="secondary" disabled={isPending || !isAddress(newOwner)} onClick={() => send("Offer ownership", { address: tr, abi: abis.workspaceTreasury, functionName: "transferOwnership", args: [newOwner] }).then(() => { setNewOwner(""); refresh() })}>Offer</Button></div>
            {pending && !/^0x0{40}$/.test(pending) && <p className="mt-2 text-xs text-muted-foreground">Offered to <Addr a={pending} />, awaiting acceptance.</p>}
          </div></div>
        </Card>
      )}
      <p className="text-xs text-muted-foreground">Balances are read live from the chain. Every payment into this treasury appears under Payments or on the sale it came from.</p>
    </div>
  )
}
