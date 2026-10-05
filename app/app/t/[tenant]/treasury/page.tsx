"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount, useReadContracts } from "wagmi"
import { isAddress, parseUnits, zeroAddress, type Address } from "viem"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useSaleCount, useSales, useTx } from "@/lib/bitregalo/hooks"
import { decodeLabel, useSettlementTokens, useWorkspaceTokens } from "@/lib/bitregalo/instances"
import { abis } from "@/lib/bitregalo/config"
import { Card, Addr, Amount, PageHead, LedgerRow, Section, Notice, Field, inputCls, Empty, RowsSkeleton } from "@/components/app/ui"
import { Explainer } from "@/components/app/explain"
import { Button } from "@/components/ui/button"
import { SaleApproval } from "@/components/app/sale-approval"

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
  const own = useWorkspaceTokens(t.id, t.instance)
  const tokenList = Array.from(new Set([...settle.all.map((x) => x.address), ...own.addresses]))
  // Sales hand tokens out of this treasury, each within what its owner approved for it.
  const { count: saleCount } = useSaleCount()
  const sales = useSales(saleCount)
  const saleApprovals = useReadContracts({
    contracts: sales.ids.map((id) => ({ address: tr!, abi: abis.workspaceTreasury, functionName: "saleAllowance", args: [id] })),
    query: { enabled: !!tr && sales.ids.length > 0, refetchInterval: 15_000 },
  })
  const bal = useReadContracts({
    contracts: tokenList.flatMap((a) => [
      { address: a, abi: abis.utilityToken, functionName: "symbol" },
      { address: a, abi: abis.utilityToken, functionName: "decimals" },
      { address: a, abi: abis.erc20, functionName: "balanceOf", args: [tr ?? t.instance] },
      { address: a, abi: abis.utilityToken, functionName: "owner" },
      { address: a, abi: abis.utilityToken, functionName: "pendingOwner" },
    ]),
    query: { enabled: !!tr && tokenList.length > 0, refetchInterval: 15_000 },
  })
  const rows = tokenList.map((a, i) => ({
    token: a,
    symbol: (bal.data?.[i * 5]?.result as string) ?? "…",
    decimals: Number((bal.data?.[i * 5 + 1]?.result as number) ?? 18),
    amount: (bal.data?.[i * 5 + 2]?.result as bigint) ?? 0n,
    mintedByTreasury: !!tr && ((bal.data?.[i * 5 + 3]?.result as Address | undefined)?.toLowerCase() === tr.toLowerCase()),
    /** Its owner has offered it to the treasury; the treasury's owner has not accepted yet. */
    offered: !!tr && ((bal.data?.[i * 5 + 4]?.result as Address | undefined)?.toLowerCase() === tr.toLowerCase()),
    stable: settle.accepted.some((x) => x.address === a),
    /** Created for this workspace through the token factory, as opposed to a stablecoin. */
    ours: own.addresses.some((x) => x.toLowerCase() === a.toLowerCase()),
  }))
  const [newOwner, setNewOwner] = useState("")
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const refresh = () => { head.refetch(); bal.refetch() }
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
  const offeredTokens = rows.filter((r) => r.offered)
  // Sales that still matter to the treasury: open ones, and finished ones with an approval left over.
  const liveSales = sales.data
    .map((s, i) => (s ? { s, id: sales.ids[i], approved: (saleApprovals.data?.[i]?.result as bigint | undefined) ?? 0n } : null))
    .filter((x) => x !== null)
    .filter((x) => (x.s.active && x.s.remaining > 0n) || x.approved > 0n)
  const waitingSales = liveSales.filter((x) => x.approved === 0n).length
  const offered = pending && !/^0x0{40}$/.test(pending) ? pending : undefined

  return (
    <div className="space-y-10">
      <PageHead
        title="Treasury"
        intro="Your organisation's own funds, in a contract it owns. Sales, redemptions and payment links land here. Only its owner can withdraw; BitRegalo cannot touch it."
        action={<Button asChild variant="secondary"><Link href={`${base}/get-paid?to=${tr}`}>Get paid into it</Link></Button>}
      />
      <Explainer id="treasury" title="What this is">
        <p>The treasury is a small contract created together with your workspace, at <Addr a={tr} />. It is owned by <Addr a={owner ?? ""} />{isOwner ? " (that is you)" : ""}. Anyone can pay into it. Only the owner can withdraw, and ownership only changes when the new owner accepts.</p>
        <p>It also holds the stock for your sales. A sale can only hand out tokens once the treasury&apos;s owner has approved that sale and an amount for it; opening a sale gives the workspace admin no claim on the treasury.</p>
        <p>If a token&apos;s owner offers the token to the treasury and the treasury&apos;s owner accepts, the treasury creates tokens as they sell. The owner can hand the token back here.</p>
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
                {r.offered && " · offered to the treasury, not accepted yet"}
                {" · "}<span className="whitespace-nowrap"><Addr a={r.token} /></span>
              </>
            }
            amount={<Amount value={r.amount} decimals={r.decimals} symbol={r.symbol} />}
          />
        ))}
      </Card>

      <Card
        flush
        title="Sales that draw on the treasury"
        description={liveSales.length === 0 ? undefined : waitingSales > 0 ? `${waitingSales} ${waitingSales === 1 ? "sale waits" : "sales wait"} for the owner's approval.` : "Every open sale has an approval."}
      >
        {liveSales.length === 0 && <Empty title="No open sales" body="When the workspace admin opens a sale, it appears here with its terms. Nothing can be bought until the treasury's owner approves it." />}
        {liveSales.map(({ s, id }) => (
          <div key={String(id)} className="border-b border-border px-5 py-5 last:border-b-0 sm:px-6">
            <p className="mb-3 text-sm text-muted-foreground">
              <Link className="text-base font-[560] text-foreground underline decoration-border-strong decoration-1 underline-offset-[3px] hover:decoration-foreground" href={`${base}/shop/${String(id)}`}>Sale #{String(id)}</Link>
              {decodeLabel(s.metaHash) ? <> · {decodeLabel(s.metaHash)}</> : null}
              {!s.active ? " · closed" : null}
            </p>
            <SaleApproval id={id} sale={s} onChange={() => { saleApprovals.refetch(); refresh() }} />
          </div>
        ))}
      </Card>

      {offeredTokens.length > 0 && (
        <Card flush title="Tokens offered to the treasury" description="Their owner wants the treasury to create them as they sell. It takes effect when the treasury's owner accepts.">
          {offeredTokens.map((r) => (
            <div key={r.token} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border px-5 py-4 last:border-b-0 sm:px-6">
              <div className="min-w-0">
                <p className="text-base font-[560]">{r.symbol}</p>
                <p className="text-sm text-muted-foreground">Once accepted, the treasury owns {r.symbol} and creates what an approved sale needs. <Addr a={r.token} /></p>
              </div>
              {isOwner
                ? <Button disabled={isPending} onClick={() => send(`Accept ${r.symbol} for the treasury`, { address: tr, abi: abis.workspaceTreasury, functionName: "acceptToken", args: [r.token] }).then(refresh)}>Accept {r.symbol}</Button>
                : <p className="text-sm text-muted-foreground">Waiting for the treasury&apos;s owner.</p>}
            </div>
          ))}
        </Card>
      )}

      {!isOwner && (
        <Notice title="Read-only view">
          <p>Only the treasury&apos;s owner, <Addr a={owner ?? ""} />, can withdraw, approve a sale or hand the treasury over. {address ? "The connected wallet is not the owner." : "Connect the owner's wallet to do either."}</p>
        </Notice>
      )}

      {isOwner && (
        <Section title="Owner actions" description="Only you see these. Each one is a transaction your wallet signs.">
          <div className="space-y-6">
            <Card flush title="Withdraw from the treasury" description="It goes to your connected wallet. Leave the amount empty to take all of it.">
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
              <Card flush title="Tokens the treasury creates" description="Tokens the treasury owns and creates as they sell. Handing one back takes two steps: you offer it to your wallet here, then accept it on the token's page. After that, sales come from stock the treasury already holds.">
                {minting.map((r) => (
                  <div key={r.token} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border px-5 py-4 last:border-b-0 sm:px-6">
                    <div className="min-w-0">
                      <p className="text-base font-[560]">{r.symbol}</p>
                      <p className="text-sm text-muted-foreground">The treasury creates {r.symbol} on demand.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="secondary" disabled={isPending} onClick={() => send(`Offer ${r.symbol} back to your wallet`, { address: tr, abi: abis.workspaceTreasury, functionName: "releaseToken", args: [r.token, address] }).then(refresh)}>Offer {r.symbol} back to my wallet</Button>
                      <Button asChild variant="ghost"><Link href={`${base}/tokens/${r.token}`}>Open the token</Link></Button>
                    </div>
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
              {offered && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">Offered to <Addr a={offered} />. Waiting for them to accept. You are still the owner and can withdraw the offer.</p>
                  <Button variant="secondary" disabled={isPending} onClick={() => send("Withdraw the offer", { address: tr, abi: abis.workspaceTreasury, functionName: "transferOwnership", args: [zeroAddress] }).then(refresh)}>Withdraw the offer</Button>
                </div>
              )}
            </Card>
          </div>
        </Section>
      )}
    </div>
  )
}
