"use client"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { parseUnits, isAddress, zeroAddress } from "viem"
import { useTx, useErc20 } from "@/lib/bitregalo/hooks"
import { abis, addresses } from "@/lib/bitregalo/config"
import { Card, Field, inputCls } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

export default function NewOffer() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { isConnected } = useAccount()
  const { send, isPending } = useTx()
  const router = useRouter()
  const [settlement, setSettlement] = useState<"0" | "1" | "2">("2")
  const [token, setToken] = useState<string>(addresses.usdt)
  const [amount, setAmount] = useState("")
  const [days, setDays] = useState("7")
  const [buyer, setBuyer] = useState("")
  const paid = settlement !== "0"
  const erc = useErc20(paid && isAddress(token) ? (token as `0x${string}`) : undefined, undefined)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await send("List offer", {
      address: t.instance, abi: abis.instance, functionName: "listOffer",
      args: [paid ? token : zeroAddress, paid ? parseUnits(amount || "0", erc.decimals) : 0n, BigInt(Number(days) * 86400), 0n, Number(settlement), buyer && isAddress(buyer) ? buyer : zeroAddress],
    })
    router.push(`${base}/offers`)
  }
  return (
    <Card title="List an offer (request to supply)">
      <form onSubmit={submit} className="grid max-w-xl gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Settlement">
            <select className={inputCls} value={settlement} onChange={(e) => setSettlement(e.target.value as "0" | "1" | "2")}>
              <option value="2">Escrow — buyer's funds lock until they release</option>
              <option value="1">Direct — buyer pays on confirmation</option>
              <option value="0">Record only</option>
            </select>
          </Field>
          <Field label="Delivery time frame (days)"><input className={inputCls} type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} /></Field>
        </div>
        {paid && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Token"><input className={inputCls} value={token} onChange={(e) => setToken(e.target.value)} /></Field>
            <Field label={`Price (${erc.symbol})`}><input className={inputCls} type="number" min="0" step="any" required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          </div>
        )}
        <Field label="Designated buyer (optional)" hint="Leave empty for an open listing. Set an address to make this a direct ask only they can confirm.">
          <input className={inputCls} value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="0x…" />
        </Field>
        <div><Button type="submit" disabled={!isConnected || isPending || (paid && !isAddress(token)) || (!!buyer && !isAddress(buyer))}>{isConnected ? "List offer" : "Connect a wallet to list"}</Button></div>
      </form>
    </Card>
  )
}
