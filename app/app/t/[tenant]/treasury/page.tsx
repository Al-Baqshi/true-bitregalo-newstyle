"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { isAddress, parseUnits, type Address } from "viem"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useTx } from "@/lib/bitregalo/hooks"
import { useSettlementTokens } from "@/lib/bitregalo/instances"
import { abis, addresses } from "@/lib/bitregalo/config"
import { Card, Addr, Amount, PageHead, LedgerRow, Section, Notice, Field, inputCls, Empty, RowsSkeleton } from "@/components/app/ui"
import { Explainer } from "@/components/app/explain"
import { Button } from "@/components/ui/button"
import { OlderContract } from "@/components/app/older-contract"

export default function TreasuryPage() {
  const t = useTenant()
  const base = t.base
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
    /** Created for this workspace through the token factory, as opposed to a stablecoin. */
    ours: (((factoryTokens.data as Address[] | undefined) ?? []).some((x) => x.toLowerCase() === a.toLowerCase())),
  }))
  const [newOwner, setNewOwner] = useState("")
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const refresh = () => { head.refetch(); bal.refetch() }
  if (t.version < 1n) return <OlderContract what="A workspace treasury" />
  if (!tr) {
    return (
      <div className="space-y-8">
        <PageHead title="Treasury" />
        <Card flush><RowsSkeleton rows={3} /></Card>
      </div>
    )
  }
  const loadingRows = tokenList.length > 0 && !bal.data
  const withdrawable = rows.filter((r) => r.amount > 0n)
  const minting = rows.filter((r) => r.mintedByTreasury)
  const offered = pending && !/^0x0{40}$/.test(pending) ? pending : undefined

  return (
    <div className="space-y-10">
      <PageHead
        title="Treasury"
        intro="Your organisation's own money box. Sales, redemptions and payment links land here. Only its owner can take money out; BitRegalo cannot touch it."
        action={<Button asChild variant="secondary"><Link href={`${base}/get-paid?to=${tr}`}>Get paid into it</Link></Button>}
      />
      <Explainer id="treasury" title="What this is">
        <p>The treasury is a small contract created together with your workspace, at <Addr a={tr} />. It is owned by <Addr a={owner ?? ""} />{isOwner ? " (that is you)" : ""}. Anyone can pay into it. Only the owner can withdraw, and ownership only changes when the new owner accepts.</p>
        <p>It also holds the stock for your sales. If you hand it the minting of a token, it creates tokens as they sell, and you can take minting back here.</p>
      </Explainer>

      {isPending_ && (
        <Notice tone="accent" title="Ownership of this treasury has been offered to you" action={<Button disabled={isPending} onClick={() => send("Accept treasury ownership", { address: tr, abi: abis.workspaceTreasury, functionName: "acceptOwnership", args: [] }).then(refresh)}>Accept ownership</Button>}>
          <p>Nothing changes until you accept. Once you do, only your wallet can withdraw from it.</p>
        </Notice>
      )}

      <Card flush title="What the treasury holds" description="Read live from the chain. Every payment into it appears under Payments or on the sale it came from.">
        {loadingRows && <RowsSkeleton rows={2} />}
        {!loadingRows && rows.length === 0 && <Empty title="No tokens known yet" body="Once this workspace accepts a currency or creates a token, its balance shows here." />}
        {!loadingRows && rows.map((r) => (
          <LedgerRow
            key={r.token}
            title={r.symbol}
            meta={
              <>
                {r.ours ? (r.stable ? "This workspace's token, accepted as payment here" : "This workspace's token, stock for the shop") : r.stable ? "Accepted as payment here" : "Not accepted as payment here"}
                {r.mintedByTreasury && " · the treasury creates more as it sells"}
                {" · "}<span className="whitespace-nowrap"><Addr a={r.token} /></span>
              </>
            }
            amount={<Amount value={r.amount} decimals={r.decimals} symbol={r.symbol} />}
          />
        ))}
      </Card>

      {!isOwner && (
        <Notice title="Read-only view">
          <p>Only the treasury&apos;s owner, <Addr a={owner ?? ""} />, can take money out or hand the treasury over. {address ? "The connected wallet is not the owner." : "Connect the owner's wallet to do either."}</p>
        </Notice>
      )}

      {isOwner && (
        <Section title="Owner actions" description="Only you see these. Each one is a transaction your wallet signs.">
          <div className="space-y-6">
            <Card flush title="Take money out" description="It goes to your connected wallet. Leave the amount empty to take all of it.">
              {withdrawable.length === 0 && <Empty title="Nothing to withdraw" body="The treasury holds no balance yet." />}
              {withdrawable.map((r) => (
                <div key={r.token} className="grid gap-3 border-b border-border px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-end sm:px-6">
                  <div className="min-w-0">
                    <p className="text-base font-[560]">{r.symbol}</p>
                    <p className="text-sm text-muted-foreground">Holds <Amount value={r.amount} decimals={r.decimals} symbol={r.symbol} /></p>
                  </div>
                  <Field label={`Amount of ${r.symbol}`}>
                    <input className={`${inputCls} t-num`} type="number" inputMode="decimal" min="0" step="any" placeholder="All of it" value={amounts[r.token] ?? ""} onChange={(e) => setAmounts({ ...amounts, [r.token]: e.target.value })} />
                  </Field>
                  <Button variant="secondary" disabled={isPending} onClick={() => send(`Withdraw ${r.symbol}`, { address: tr, abi: abis.workspaceTreasury, functionName: "withdraw", args: [r.token, address, amounts[r.token] ? parseUnits(amounts[r.token], r.decimals) : r.amount] }).then(() => { setAmounts({ ...amounts, [r.token]: "" }); refresh() })}>Withdraw</Button>
                </div>
              ))}
            </Card>

            {minting.length > 0 && (
              <Card flush title="Minting" description="Tokens the treasury creates as they sell. Taking minting back hands the minter role to your wallet; sales then come from stock the treasury already holds.">
                {minting.map((r) => (
                  <div key={r.token} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border px-5 py-4 last:border-b-0 sm:px-6">
                    <div className="min-w-0">
                      <p className="text-base font-[560]">{r.symbol}</p>
                      <p className="text-sm text-muted-foreground">The treasury creates {r.symbol} on demand.</p>
                    </div>
                    <Button variant="secondary" disabled={isPending} onClick={() => send(`Take back minting of ${r.symbol}`, { address: tr, abi: abis.workspaceTreasury, functionName: "releaseToken", args: [r.token, address] }).then(refresh)}>Take minting back</Button>
                  </div>
                ))}
              </Card>
            )}

            <Card title="Hand over ownership" description="Offer the treasury to another wallet, for example a shared multi-signature wallet. Nothing changes until they accept.">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <Field label="New owner's wallet address">
                  <input className={`${inputCls} t-mono`} value={newOwner} onChange={(e) => setNewOwner(e.target.value.trim())} placeholder="0x…" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
                </Field>
                <Button variant="secondary" disabled={isPending || !isAddress(newOwner)} onClick={() => send("Offer ownership", { address: tr, abi: abis.workspaceTreasury, functionName: "transferOwnership", args: [newOwner] }).then(() => { setNewOwner(""); refresh() })}>Offer ownership</Button>
              </div>
              {offered && <p className="mt-3 text-sm text-muted-foreground">Offered to <Addr a={offered} />. Waiting for them to accept.</p>}
            </Card>
          </div>
        </Section>
      )}
    </div>
  )
}
