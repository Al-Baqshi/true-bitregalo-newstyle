"use client"
import { createContext, useContext } from "react"
import { useReadContract, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { abis, addresses, PUBLIC_WORKSPACE_ID } from "./config"

export type TenantAddrs = {
  id: bigint; instance: Address; vault: Address; admin: Address
  /** The workspace's own treasury. Read from the workspace contract, so it is briefly undefined while loading. */
  treasury?: Address
  /** The address the admin role has been offered to, when a handover is waiting to be accepted. */
  pendingAdmin?: Address
  /** Where this workspace's pages live: "/app" for the public network, "/app/t/{id}" for any other. */
  base: string
  /** True for the BitRegalo public network. */
  isPublic: boolean
}
const Ctx = createContext<TenantAddrs | null>(null)
const ZERO = /^0x0{40}$/

/**
 * Resolves a workspace number to its contracts. The mother keeps the workspace contract and the
 * vault; the admin, a pending admin and the treasury are read from the workspace contract itself.
 */
export function TenantProvider({ id: given, base, children }: { id: bigint | string; base?: string; children: React.ReactNode }) {
  // The number comes from a server layout. In development it can arrive as a string (bigints are
  // made printable there), and "0" === 0n is false: make it a bigint again so comparisons hold.
  const id = BigInt(given)
  const q = useReadContract({ address: addresses.mother, abi: abis.mother, functionName: "tenants", args: [id] })
  const t = q.data as { instance: Address; vault: Address; version: bigint } | undefined
  const found = !!t && !ZERO.test(t.instance)
  const own = useReadContracts({
    contracts: found ? [
      { address: t!.instance, abi: abis.instance, functionName: "admin" },
      { address: t!.instance, abi: abis.instance, functionName: "pendingAdmin" },
      { address: t!.instance, abi: abis.instance, functionName: "treasury" },
    ] : [],
    query: { enabled: found, refetchInterval: 20_000 },
  })
  const [admin, pendingAdmin, treasury] = (own.data ?? []).map((r) => r.result) as [Address?, Address?, Address?]
  if (q.isLoading || (found && own.isLoading)) return <p className="text-sm text-muted-foreground" role="status">Loading…</p>
  if (!found) return <p className="text-sm text-muted-foreground">There is no workspace #{String(id)} on this network.</p>
  return (
    <Ctx.Provider
      value={{
        id, instance: t!.instance, vault: t!.vault,
        admin: admin ?? ("0x0000000000000000000000000000000000000000" as Address),
        pendingAdmin: pendingAdmin && !ZERO.test(pendingAdmin) ? pendingAdmin : undefined,
        treasury: treasury && !ZERO.test(treasury) ? treasury : undefined,
        base: base ?? `/app/t/${id}`, isPublic: id === PUBLIC_WORKSPACE_ID,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useTenant(): TenantAddrs {
  const t = useContext(Ctx)
  if (!t) throw new Error("useTenant must be used inside a TenantProvider")
  return t
}
