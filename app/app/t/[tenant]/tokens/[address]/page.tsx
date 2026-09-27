"use client"
import { use, useState } from "react"
import Link from "next/link"
import { useAccount, useReadContracts } from "wagmi"
import { parseUnits, isAddress, type Address } from "viem"
import { Send, Plus, BadgeCheck } from "lucide-react"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useTx } from "@/lib/bitregalo/hooks"
import { abis, addresses, explorerAddress, short } from "@/lib/bitregalo/config"
import { Card, Amount, Pill } from "@/components/app/ui"
import { input, Label } from "@/components/app/wizard/fields"
import { Button } from "@/components/ui/button"

export default function TokenPage({ params }: { params: Promise<{ address: string }> }) {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { address: raw } = use(params)
  const token = raw as Address
  const { address } = useAccount()
  const { send, isPending } = useTx()
  const q = useReadContracts({
    contracts: [
      { address: token, abi: abis.utilityToken, functionName: "name" },
      { address: token, abi: abis.utilityToken, functionName: "symbol" },
      { address: token, abi: abis.utilityToken, functionName: "totalSupply" },
      { address: token, abi: abis.utilityToken, functionName: "cap" },
      { address: token, abi: abis.utilityToken, functionName: "owner" },
      { address: token, abi: abis.erc20, functionName: "balanceOf", args: [address ?? addresses.treasury] },
      { address: t.instance, abi: abis.instance, functionName: "tokens", args: [token] },
    ],
    query: { refetchInterval: 10_000 },
  })
  const [name, symbol, supply, cap, owner, balance, cfg] = (q.data ?? []).map((r) => r.result) as [string?, string?, bigint?, bigint?, Address?, bigint?, (readonly [boolean, number, bigint])?]
  const [to, setTo] = useState("")
  const [amt, setAmt] = useState("")
  const [mintTo, setMintTo] = useState("")
  const [mintAmt, setMintAmt] = useState("")
  const [fee, setFee] = useState("0")
  if (!isAddress(raw)) return <p className="text-sm text-muted-foreground">That isn&apos;t a token address.</p>
  const sym = symbol ?? "tokens"
  const fixed = !!owner && /^0x0{40}$/.test(owner)
  const canMint = !!address && owner?.toLowerCase() === address.toLowerCase()
  const isAdmin = !!address && t.admin.toLowerCase() === address.toLowerCase()
  const accepted = !!cfg?.[0]
  const refresh = () => q.refetch()

  return (
    <div className="space-y-6">
      <div>
        <Link href={`${base}/tokens`} className="bq-label hover:text-foreground">← All tokens</Link>
        <div className="mt-3 flex flex-wrap gap-2">
          {accepted ? <Pill tone="good">accepted as payment here</Pill> : <Pill>not accepted as payment yet</Pill>}
          <Pill>{fixed ? "fixed supply" : cap && cap > 0n ? "capped supply" : "open supply"}</Pill>
        </div>
        <h1 className="bq-display mt-3 text-4xl font-semibold">{name ?? "…"} <span className="text-muted-foreground">({sym})</span></h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <Amount value={supply ?? 0n} /> {sym} exist{cap && cap > 0n ? <> of a maximum <Amount value={cap} /></> : null} · <a className="bq-mono underline-offset-2 hover:underline" href={explorerAddress(token)} target="_blank" rel="noreferrer">{short(token)}</a>
        </p>
      </div>

      <Card><p className="bq-label">You hold</p><p className="bq-display mt-2 text-4xl font-semibold">{address ? <Amount value={balance ?? 0n} symbol={sym} /> : "Connect a wallet"}</p></Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2 text-sm font-medium"><Send className="size-4 text-primary" />Send</div>
          <p className="mt-1 text-xs text-muted-foreground">Move some of your {sym} to another wallet.</p>
          <div className="mt-4 grid gap-3">
            <Label title="To"><input className={`${input} bq-mono`} value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x…" /></Label>
            <Label title="Amount"><input className={`${input} bq-mono`} type="number" min="0" step="any" value={amt} onChange={(e) => setAmt(e.target.value)} /></Label>
            <Button disabled={isPending || !address || !isAddress(to) || !(Number(amt) > 0)} onClick={() => send(`Send ${sym}`, { address: token, abi: abis.utilityToken, functionName: "transfer", args: [to, parseUnits(amt, 18)] }).then(() => { setAmt(""); refresh() })}>Send</Button>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-sm font-medium"><Plus className="size-4 text-primary" />Create more</div>
          {fixed && <p className="mt-1 text-xs text-muted-foreground">This token has a fixed supply. Nobody — including its creator — can create more, ever.</p>}
          {!fixed && !canMint && <p className="mt-1 text-xs text-muted-foreground">Only the token&apos;s creator can create more.</p>}
          {!fixed && canMint && (
            <>
              <p className="mt-1 text-xs text-muted-foreground">You created this token, so you can create more{cap && cap > 0n ? " up to its maximum" : ""}.</p>
              <div className="mt-4 grid gap-3">
                <Label title="Give them to"><input className={`${input} bq-mono`} value={mintTo} onChange={(e) => setMintTo(e.target.value)} placeholder={address} /></Label>
                <Label title="Amount"><input className={`${input} bq-mono`} type="number" min="0" step="any" value={mintAmt} onChange={(e) => setMintAmt(e.target.value)} /></Label>
                <Button disabled={isPending || !(Number(mintAmt) > 0)} onClick={() => send(`Create ${sym}`, { address: token, abi: abis.utilityToken, functionName: "mint", args: [isAddress(mintTo) ? mintTo : address, parseUnits(mintAmt, 18)] }).then(() => { setMintAmt(""); refresh() })}>Create</Button>
              </div>
            </>
          )}
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-sm font-medium"><BadgeCheck className="size-4 text-primary" />Accept as payment</div>
          <p className="mt-1 text-xs text-muted-foreground">{accepted ? `People can already pay in ${sym} in this workspace.` : `Let requests and listings in this workspace be paid in ${sym}.`}</p>
          {!isAdmin && <p className="mt-3 text-xs text-muted-foreground">Only this workspace&apos;s admin can change this.</p>}
          {isAdmin && !accepted && (
            <div className="mt-4 grid gap-3">
              <Label title={`Service fee per payment (${sym})`} hint="Added to each payment and paid to the platform. 0 is fine."><input className={`${input} bq-mono`} type="number" min="0" step="any" value={fee} onChange={(e) => setFee(e.target.value)} /></Label>
              <Button disabled={isPending} onClick={() => send(`Accept ${sym}`, { address: t.instance, abi: abis.instance, functionName: "setToken", args: [token, true, 18, parseUnits(fee || "0", 18)] }).then(refresh)}>Accept {sym}</Button>
            </div>
          )}
          {isAdmin && accepted && <Button className="mt-4" variant="secondary" disabled={isPending} onClick={() => send(`Stop accepting ${sym}`, { address: t.instance, abi: abis.instance, functionName: "setToken", args: [token, false, 18, 0n] }).then(refresh)}>Stop accepting it</Button>}
        </Card>
      </div>
    </div>
  )
}
