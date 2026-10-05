"use client"
import { createContext, useContext } from "react"
import { useReadContract } from "wagmi"
import type { Address } from "viem"
import { abis, addresses, protocolVersion, PUBLIC_WORKSPACE_ID } from "./config"

export type TenantAddrs = {
  id: bigint; instance: Address; vault: Address; admin: Address; treasury?: Address
  /** The protocol version this workspace runs (what it can do), not its number in the mother's list. */
  version: bigint
  /** Where this workspace's pages live: "/app" for the public network, "/app/t/{id}" for any other. */
  base: string
  /** True for the BitRegalo public network. */
  isPublic: boolean
}
const Ctx = createContext<TenantAddrs | null>(null)

/** Resolves a tenant id to its instance + vault addresses from the mother registry. */
export function TenantProvider({ id, base, children }: { id: bigint; base?: string; children: React.ReactNode }) {
  const q = useReadContract({ address: addresses.mother, abi: abis.mother, functionName: "tenants", args: [id] })
  const t = q.data as { instance: Address; vault: Address; admin: Address; version: bigint } | undefined
  const liveAdmin = useReadContract({ address: t?.instance, abi: abis.instance, functionName: "admin", query: { enabled: !!t, refetchInterval: 20_000 } })
  const version = t ? protocolVersion(t.version) : 0n
  // Version 1+ workspaces own a treasury; the call does not exist on older contracts.
  const treasury = useReadContract({ address: t?.instance, abi: abis.instance, functionName: "treasury", query: { enabled: !!t && version >= 1n } })
  if (q.isLoading) return <p className="text-sm text-muted-foreground" role="status">Loading…</p>
  if (!t || /^0x0{40}$/.test(t.instance)) return <p className="text-sm text-muted-foreground">There is no workspace #{String(id)} on this network.</p>
  return <Ctx.Provider value={{ id, instance: t.instance, vault: t.vault, admin: (liveAdmin.data as Address | undefined) ?? t.admin, version, treasury: treasury.data as Address | undefined, base: base ?? `/app/t/${id}`, isPublic: id === PUBLIC_WORKSPACE_ID }}>{children}</Ctx.Provider>
}

export function useTenant(): TenantAddrs {
  const t = useContext(Ctx)
  if (!t) throw new Error("useTenant must be used inside a TenantProvider")
  return t
}
