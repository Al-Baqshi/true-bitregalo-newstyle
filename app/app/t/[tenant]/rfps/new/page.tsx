"use client"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { keccak256, toBytes, isAddress, zeroAddress } from "viem"
import { useTx } from "@/lib/bitregalo/hooks"
import { abis, addresses } from "@/lib/bitregalo/config"
import { Card, Field, inputCls } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

export default function NewRfp() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { isConnected } = useAccount()
  const { send, isPending } = useTx()
  const router = useRouter()
  const [scope, setScope] = useState("")
  const [days, setDays] = useState("7")
  const [settlement, setSettlement] = useState<"0" | "1" | "2">("2")
  const [token, setToken] = useState<string>(addresses.usdt)
  const paid = settlement !== "0"

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const deadline = BigInt(Math.floor(Date.now() / 1000) + Number(days) * 86400)
    const scopeHash = keccak256(toBytes(scope.trim()))
    await send("Post RFP", {
      address: t.instance, abi: abis.instance, functionName: "postRfp",
      args: [scopeHash, deadline, paid ? token : zeroAddress, 0n, Number(settlement)],
    })
    router.push(`${base}/rfps`)
  }
  return (
    <Card title="Post a request for proposal">
      <form onSubmit={submit} className="grid max-w-xl gap-4">
        <Field label="Scope" hint="Stored on-chain as its hash (keccak256), so the text stays private but is provable.">
          <textarea className={inputCls} rows={4} required value={scope} onChange={(e) => setScope(e.target.value)} placeholder="e.g. Install 20 kW solar array, Wellington, by end of November" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bidding closes in (days)">
            <input className={inputCls} type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
          </Field>
          <Field label="Settlement">
            <select className={inputCls} value={settlement} onChange={(e) => setSettlement(e.target.value as "0" | "1" | "2")}>
              <option value="2">Escrow — funds lock until you release</option>
              <option value="1">Direct — winner is paid on award</option>
              <option value="0">Record only — no payment on-chain</option>
            </select>
          </Field>
        </div>
        {paid && (
          <Field label="Settlement token" hint="Must be on the tenant's allowlist (testnet USDT, or a token you launched and the admin allowlisted).">
            <input className={inputCls} value={token} onChange={(e) => setToken(e.target.value)} />
          </Field>
        )}
        <div>
          <Button type="submit" disabled={!isConnected || isPending || (paid && !isAddress(token))}>
            {isConnected ? "Post RFP" : "Connect a wallet to post"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
