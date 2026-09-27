"use client"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useState } from "react"
import { useAccount } from "wagmi"
import { isAddress, parseUnits } from "viem"
import { useOverview, useTx } from "@/lib/bitregalo/hooks"
import { abis } from "@/lib/bitregalo/config"
import { Card, Addr, Field, inputCls } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { address } = useAccount()
  const ov = useOverview()
  const admin = ov.data?.[4]?.result as string | undefined
  const direct = ov.data?.[6]?.result as boolean | undefined
  const escrow = ov.data?.[7]?.result as boolean | undefined
  const isAdmin = !!address && !!admin && admin.toLowerCase() === address.toLowerCase()
  const { send, isPending } = useTx()
  const [token, setToken] = useState("")
  const [fee, setFee] = useState("0.1")
  const [d, setD] = useState(true)
  const [e, setE] = useState(true)
  return (
    <div className="space-y-6">
      <Card title="Tenant #0 administration">
        <p className="text-sm text-muted-foreground">Admin: <Addr a={admin ?? ""} /> {isAdmin ? "— that's you." : "— connect that wallet to manage this tenant."}</p>
      </Card>
      {isAdmin && (
        <>
          <Card title="Allowlist a settlement token">
            <div className="grid max-w-xl gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <Field label="Token address" hint="Standard ERC-20 only (no fee-on-transfer, no rebasing). Tokens from the factory qualify."><input className={inputCls} value={token} onChange={(ev) => setToken(ev.target.value)} placeholder="0x…" /></Field>
              <Field label="Service fee per settlement"><input className={inputCls} type="number" min="0" step="any" value={fee} onChange={(ev) => setFee(ev.target.value)} /></Field>
              <Button disabled={isPending || !isAddress(token)} onClick={() => send("Allowlist token", { address: t.instance, abi: abis.instance, functionName: "setToken", args: [token, true, 18, parseUnits(fee || "0", 18)] }).then(() => ov.refetch())}>Allowlist</Button>
            </div>
          </Card>
          <Card title="Settlement modes">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={d} onChange={(ev) => setD(ev.target.checked)} /> Direct payments {direct !== undefined && <span className="text-muted-foreground">(now {direct ? "on" : "off"})</span>}</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={e} onChange={(ev) => setE(ev.target.checked)} /> Escrow {escrow !== undefined && <span className="text-muted-foreground">(now {escrow ? "on" : "off"})</span>}</label>
              <Button variant="secondary" disabled={isPending} onClick={() => send("Update modes", { address: t.instance, abi: abis.instance, functionName: "setSettlementModes", args: [d, e] }).then(() => ov.refetch())}>Save</Button>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
