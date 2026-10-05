"use client"
import { useState } from "react"
import { useAccount, useReadContracts } from "wagmi"
import { formatUnits, parseUnits } from "viem"
import { abis } from "@/lib/bitregalo/config"
import { useSaleApproval, useTx, type Sale } from "@/lib/bitregalo/hooks"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Addr, Amount } from "@/components/app/ui"
import { Label, input } from "@/components/app/wizard/fields"
import { Button } from "@/components/ui/button"

const when = (ts: bigint) => new Date(Number(ts) * 1000).toLocaleString()

/**
 * Where a sale stands with the workspace treasury, and the treasury owner's controls.
 *
 * Opening a sale gives the admin no claim on the treasury. Its owner approves one sale, on the
 * terms shown, for an amount; each purchase spends that approval. Approving 0 stops the sale.
 * The approval names the terms by their fingerprint as read here, so if the sale behind this
 * number were ever a different one, nothing would be approved.
 */
export function SaleApproval({ id, sale, onChange }: { id: bigint; sale: Sale; onChange?: () => void }) {
  const t = useTenant()
  const { address } = useAccount()
  const { send, isPending } = useTx()
  const a = useSaleApproval(id, sale.token)
  const free = sale.price === 0n
  const meta = useReadContracts({
    contracts: [
      { address: sale.token, abi: abis.utilityToken, functionName: "symbol" },
      { address: sale.token, abi: abis.utilityToken, functionName: "decimals" },
      ...(free ? [] : [
        { address: sale.payToken, abi: abis.utilityToken, functionName: "symbol" },
        { address: sale.payToken, abi: abis.utilityToken, functionName: "decimals" },
      ]),
    ],
  })
  const [symbol, decRaw, paySymbol, payDecRaw] = (meta.data ?? []).map((r) => r.result) as [string?, number?, string?, number?]
  const sym = symbol ?? "tokens"
  const dec = Number(decRaw ?? 18)
  const [amount, setAmount] = useState("")
  const isOwner = !!address && !!a.owner && a.owner.toLowerCase() === address.toLowerCase()
  const wanted = amount.trim() === "" ? sale.remaining : Number(amount) > 0 ? parseUnits(amount, dec) : 0n
  const tooMany = wanted > sale.remaining
  const short = !a.creates && a.held < (a.allowance < sale.remaining ? a.allowance : sale.remaining)
  const done = () => { a.refetch(); setAmount(""); onChange?.() }
  const approve = (label: string, value: bigint) =>
    send(label, { address: t.treasury!, abi: abis.workspaceTreasury, functionName: "approveSale", args: [id, value, a.termsHash] }).then(done)

  if (!a.loaded) return <p className="text-sm text-muted-foreground" role="status">Reading the approval…</p>

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-base font-[560]">
          {a.allowance === 0n
            ? "Waiting for the treasury owner's approval"
            : <><Amount value={a.allowance} decimals={dec} symbol={sym} /> approved for sale</>}
        </p>
        <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
          {a.allowance === 0n
            ? "Nothing can be bought until the owner of the workspace treasury approves this sale."
            : a.allowance < sale.remaining
              ? <>That is less than the <Amount value={sale.remaining} decimals={dec} /> still listed. Buying stops when the approved amount is sold, until the owner approves more.</>
              : "Each purchase uses up part of the approved amount."}
          {" "}
          {a.creates
            ? `Stock: the treasury creates ${sym} as they sell, within the approved amount.`
            : <>Stock: the treasury holds <Amount value={a.held} decimals={dec} symbol={sym} />.{short && a.allowance > 0n ? " That is fewer than the amount approved, so buying stops when the stock runs out." : ""}</>}
        </p>
      </div>

      {isOwner ? (
        <div className="grid gap-4 border-t border-border pt-4">
          <div>
            <p className="t-label">The terms you approve</p>
            <dl className="mt-2 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              <Term label="Token"><span className="font-[560]">{sym}</span> · <Addr a={sale.token} /></Term>
              <Term label="Price">{free ? "Free to claim" : <><Amount value={sale.price} decimals={Number(payDecRaw ?? 18)} symbol={paySymbol ?? ""} /> per {sym}</>}</Term>
              <Term label="Paid in">{free ? "Nothing is paid" : <><span className="font-[560]">{paySymbol ?? "…"}</span> · <Addr a={sale.payToken} /></>}</Term>
              <Term label="Limit per buyer">{sale.maxPerBuyer === 0n ? "No limit" : <Amount value={sale.maxPerBuyer} decimals={dec} symbol={sym} />}</Term>
              <Term label="Opens">{sale.start === 0n ? "Straight away" : when(sale.start)}</Term>
              <Term label="Closes">{sale.end === 0n ? "When sold out or closed" : when(sale.end)}</Term>
            </dl>
            <p className="mt-2 max-w-[62ch] text-xs text-subtle">A sale&apos;s terms never change once it exists. Your approval covers these terms and nothing else.</p>
          </div>
          {sale.active && sale.remaining > 0n && (
            <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_auto_auto] sm:items-end">
              <Label title={`Amount to approve (${sym})`}>
                <input className={`${input} t-num`} type="number" inputMode="decimal" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={formatUnits(sale.remaining, dec)} />
              </Label>
              <Button variant="secondary" disabled={isPending || !a.termsHash || !(wanted > 0n) || tooMany} onClick={() => approve(`Approve sale #${String(id)}`, wanted)}>
                {a.allowance === 0n ? "Approve this sale" : "Change the approved amount"}
              </Button>
              {a.allowance > 0n && <Button variant="ghost" disabled={isPending || !a.termsHash} onClick={() => approve(`Stop sale #${String(id)}`, 0n)}>Stop the sale</Button>}
            </div>
          )}
          <p className="max-w-[62ch] text-sm text-muted-foreground">
            {tooMany
              ? <span className="text-destructive">Only {formatUnits(sale.remaining, dec)} {sym} are left in this sale.</span>
              : sale.active && sale.remaining > 0n
                ? `Leave the amount empty to approve everything that is left. The new amount replaces the one approved so far. Stopping sets it to 0: nothing more can be bought, and what was already bought stays bought.`
                : "This sale is finished, so there is nothing to approve."}
          </p>
          {(!sale.active || sale.remaining === 0n) && a.allowance > 0n && (
            <div><Button variant="secondary" disabled={isPending || !a.termsHash} onClick={() => approve(`Remove the approval of sale #${String(id)}`, 0n)}>Remove the approval that is left</Button></div>
          )}
        </div>
      ) : (
        <p className="max-w-[62ch] text-sm text-muted-foreground">
          Only the owner of the workspace treasury, <Addr a={a.owner ?? ""} />, can approve this sale, change the approved amount or stop it.
          {address ? " Your connected wallet is a different one." : " Connect that wallet to do it."}
        </p>
      )}
    </div>
  )
}

function Term({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 border-b border-border py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  )
}
