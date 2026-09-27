"use client"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { parseUnits, zeroAddress } from "viem"
import { useTx } from "@/lib/bitregalo/hooks"
import { abis, addresses } from "@/lib/bitregalo/config"
import { Card, Field, inputCls } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

export default function NewToken() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { isConnected } = useAccount()
  const { send, isPending } = useTx()
  const router = useRouter()
  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [supply, setSupply] = useState("1000000")
  const [cap, setCap] = useState("")
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await send("Launch token", {
      address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "createToken",
      args: [{ name, symbol: symbol.toUpperCase(), decimals: 18, cap: cap ? parseUnits(cap, 18) : 0n, initialSupply: parseUnits(supply || "0", 18), owner: zeroAddress, tenantId: t.id, projectId: 0n }],
    })
    router.push(`${base}/tokens`)
  }
  return (
    <Card title="Launch a utility token">
      <form onSubmit={submit} className="grid max-w-xl gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className={inputCls} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Credits" /></Field>
          <Field label="Symbol"><input className={inputCls} required maxLength={11} value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="ACME" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Initial supply (minted to you)"><input className={inputCls} type="number" min="0" value={supply} onChange={(e) => setSupply(e.target.value)} /></Field>
          <Field label="Hard cap (optional)" hint="Leave empty for no cap. You can renounce minting later to fix the supply forever."><input className={inputCls} type="number" min="0" value={cap} onChange={(e) => setCap(e.target.value)} /></Field>
        </div>
        <p className="text-xs text-muted-foreground">18 decimals. You become the owner (the only minter). One audited implementation, cloned per token — no custom code, so the escrow vault can accept it.</p>
        <div><Button type="submit" disabled={!isConnected || isPending}>{isConnected ? "Launch token" : "Connect a wallet to launch"}</Button></div>
      </form>
    </Card>
  )
}
