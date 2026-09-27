"use client"
import { use, useState } from "react"
import { useAccount, useReadContracts } from "wagmi"
import { parseUnits, isAddress, type Address } from "viem"
import { useTx, useTokenCfg } from "@/lib/bitregalo/hooks"
import { abis, addresses } from "@/lib/bitregalo/config"
import { Card, Addr, Amount, Field, inputCls, Pill } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

export default function TokenDetail({ params }: { params: Promise<{ address: string }> }) {
  const { address: raw } = use(params)
  const token = raw as Address
  const { address, isConnected } = useAccount()
  const { send, isPending } = useTx()
  const q = useReadContracts({
    contracts: [
      { address: token, abi: abis.utilityToken, functionName: "name" },
      { address: token, abi: abis.utilityToken, functionName: "symbol" },
      { address: token, abi: abis.utilityToken, functionName: "decimals" },
      { address: token, abi: abis.utilityToken, functionName: "totalSupply" },
      { address: token, abi: abis.utilityToken, functionName: "cap" },
      { address: token, abi: abis.utilityToken, functionName: "owner" },
      { address: token, abi: abis.erc20, functionName: "balanceOf", args: [address ?? addresses.vault] },
    ],
    query: { refetchInterval: 10_000 },
  })
  const cfg = useTokenCfg(token)
  const [to, setTo] = useState("")
  const [amt, setAmt] = useState("")
  if (!isAddress(raw)) return <p className="text-sm text-muted-foreground">Not a valid address.</p>
  const [name, symbol, decimals, supply, cap, owner, balance] = (q.data ?? []).map((r) => r.result)
  const dec = Number(decimals ?? 18)
  const isOwner = !!address && !!owner && (owner as string).toLowerCase() === address.toLowerCase()
  async function act(fn: "mint" | "transfer") {
    await send(fn === "mint" ? "Mint" : "Transfer", { address: token, abi: abis.utilityToken, functionName: fn, args: [to, parseUnits(amt || "0", dec)] })
    q.refetch()
  }
  return (
    <div className="space-y-6">
      <Card title={`${(name as string) ?? "Token"} (${(symbol as string) ?? "…"})`}>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Addr a={token} />
          <span className="text-muted-foreground">supply <Amount value={(supply as bigint) ?? 0n} decimals={dec} /></span>
          <span className="text-muted-foreground">cap {cap && (cap as bigint) > 0n ? <Amount value={cap as bigint} decimals={dec} /> : "none"}</span>
          <span className="text-muted-foreground">owner <Addr a={String(owner ?? "")} /></span>
          {cfg?.[0] ? <Pill tone="good">allowlisted for settlement</Pill> : <Pill>not allowlisted — ask the tenant admin</Pill>}
        </div>
        {address && <p className="mt-3 text-sm">Your balance: <Amount value={(balance as bigint) ?? 0n} decimals={dec} symbol={symbol as string} /></p>}
      </Card>
      {isConnected && (
        <Card title={isOwner ? "Mint or transfer" : "Transfer"}>
          <div className="grid max-w-xl gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <Field label="To address"><input className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x…" /></Field>
            <Field label="Amount"><input className={inputCls} type="number" min="0" step="any" value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={isPending || !isAddress(to)} onClick={() => act("transfer")}>Transfer</Button>
              {isOwner && <Button disabled={isPending || !isAddress(to)} onClick={() => act("mint")}>Mint</Button>}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
