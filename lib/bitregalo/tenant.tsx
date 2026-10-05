"use client"
import { createContext, useContext } from "react"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { abis, addresses, PUBLIC_WORKSPACE_ID } from "./config"

export type TenantAddrs = {
  id: bigint; instance: Address; vault: Address; admin: Address
  /** The workspace's own treasury. Read from the workspace contract, so it is briefly undefined while loading. */
  treasury?: Address
  /** The address the admin role has been offered to, when a handover is waiting to be accepted. */
  pendingAdmin?: Address
  /** True when this workspace asks for an identity approval before a wallet can post, offer, pay, buy or redeem. */
  kycRequired: boolean
  /** The key that signs identity approvals for this workspace, when one is set. */
  attester?: Address
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
      { address: t!.instance, abi: abis.instance, functionName: "kycRequired" },
      { address: t!.instance, abi: abis.instance, functionName: "attester" },
    ] : [],
    query: { enabled: found, refetchInterval: 20_000 },
  })
  const [admin, pendingAdmin, treasury, kycRequired, attester] = (own.data ?? []).map((r) => r.result) as [Address?, Address?, Address?, boolean?, Address?]
  if (q.isLoading || (found && own.isLoading)) return <p className="text-sm text-muted-foreground" role="status">Loading…</p>
  if (!found) return <p className="text-sm text-muted-foreground">There is no workspace #{String(id)} on this network.</p>
  return (
    <Ctx.Provider
      value={{
        id, instance: t!.instance, vault: t!.vault,
        admin: admin ?? ("0x0000000000000000000000000000000000000000" as Address),
        pendingAdmin: pendingAdmin && !ZERO.test(pendingAdmin) ? pendingAdmin : undefined,
        treasury: treasury && !ZERO.test(treasury) ? treasury : undefined,
        kycRequired: !!kycRequired,
        attester: attester && !ZERO.test(attester) ? attester : undefined,
        base: base ?? `/app/t/${id}`, isPublic: id === PUBLIC_WORKSPACE_ID,
      }}
    >
      <IdentityNotice />
      {children}
    </Ctx.Provider>
  )
}

/**
 * Said once, above every page of a workspace that asks for identity approvals, to a connected
 * wallet that has none: posting, offering, paying, buying and redeeming would all be refused, so
 * the person is told before they try. Reading is never affected.
 */
function IdentityNotice() {
  const t = useTenant()
  const { address } = useAccount()
  const valid = useReadContract({
    address: t.instance, abi: abis.instance, functionName: "isKycValid", args: [address!],
    query: { enabled: t.kycRequired && !!address, refetchInterval: 20_000 },
  })
  if (!t.kycRequired || !address || valid.data !== false) return null
  return (
    <div className="mb-8 rounded-xl bg-gold-fill px-5 py-4" role="status">
      <p className="t-subheading">This workspace asks for an identity approval</p>
      <p className="mt-1 max-w-[68ch] text-sm text-foreground/85">
        Your wallet does not have one here. Ask its attester for one{t.attester ? <> (<span className="t-mono">{t.attester.slice(0, 6)}…{t.attester.slice(-4)}</span>)</> : null}. Until then you can read everything, but you cannot post, offer, pay, buy or redeem in this workspace.{" "}
        <Link className="underline decoration-1 underline-offset-[3px] hover:decoration-2" href={`${t.base}/settings#identity`}>Check your approval or submit one you were given</Link>.
      </p>
    </div>
  )
}

export function useTenant(): TenantAddrs {
  const t = useContext(Ctx)
  if (!t) throw new Error("useTenant must be used inside a TenantProvider")
  return t
}
