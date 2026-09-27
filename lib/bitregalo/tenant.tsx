"use client"
import { createContext, useContext } from "react"
import { useReadContract } from "wagmi"
import type { Address } from "viem"
import { abis, addresses } from "./config"

export type TenantAddrs = { id: bigint; instance: Address; vault: Address; admin: Address; version: bigint }
const Ctx = createContext<TenantAddrs | null>(null)

/** Resolves a tenant id to its instance + vault addresses from the mother registry. */
export function TenantProvider({ id, children }: { id: bigint; children: React.ReactNode }) {
  const q = useReadContract({ address: addresses.mother, abi: abis.mother, functionName: "tenants", args: [id] })
  const t = q.data as { instance: Address; vault: Address; admin: Address; version: bigint } | undefined
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading instance #{String(id)}…</p>
  if (!t || /^0x0{40}$/.test(t.instance)) return <p className="text-sm text-muted-foreground">No instance #{String(id)} on this network.</p>
  return <Ctx.Provider value={{ id, instance: t.instance, vault: t.vault, admin: t.admin, version: t.version }}>{children}</Ctx.Provider>
}

export function useTenant(): TenantAddrs {
  const t = useContext(Ctx)
  if (!t) throw new Error("useTenant must be used inside /app/t/[tenant]")
  return t
}
