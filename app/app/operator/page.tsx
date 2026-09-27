"use client"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { useTx } from "@/lib/bitregalo/hooks"
import { abis, addresses } from "@/lib/bitregalo/config"
import { Card, Stat, Addr, Amount, Pill } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as Address
const entryPointAbi = [{ type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] }] as const
const ownableAbi = [
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "pendingOwner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "acceptOwnership", stateMutability: "nonpayable", inputs: [], outputs: [] },
] as const

export default function Operator() {
  const { address } = useAccount()
  const { send, isPending } = useTx()
  const head = useReadContracts({
    contracts: [
      { address: addresses.mother, abi: ownableAbi, functionName: "owner" },
      { address: addresses.mother, abi: ownableAbi, functionName: "pendingOwner" },
      { address: addresses.treasury, abi: ownableAbi, functionName: "owner" },
      { address: addresses.treasury, abi: ownableAbi, functionName: "pendingOwner" },
      { address: addresses.tokenFactory, abi: ownableAbi, functionName: "owner" },
      { address: addresses.tokenFactory, abi: ownableAbi, functionName: "pendingOwner" },
      { address: addresses.mother, abi: abis.mother, functionName: "tenantCount" },
      { address: addresses.mother, abi: abis.mother, functionName: "defaultFeeBps" },
      { address: addresses.mother, abi: abis.mother, functionName: "deployFeeAmount" },
      { address: ENTRY_POINT, abi: entryPointAbi, functionName: "balanceOf", args: [addresses.paymaster] },
      { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tokenCount" },
    ],
    query: { refetchInterval: 15_000 },
  })
  const [mOwner, mPending, tOwner, tPending, fOwner, fPending, tenantCount, feeBps, deployFee, pmDeposit, tokenCount] = (head.data ?? []).map((r) => r.result)
  const n = Number((tokenCount as bigint) ?? 0n)
  const factoryTokens = useReadContracts({
    contracts: Array.from({ length: n }, (_, i) => ({ address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "allTokens", args: [BigInt(i)] })),
    query: { enabled: n > 0 },
  })
  const tokenList = [addresses.usdt, ...((factoryTokens.data ?? []).map((r) => r.result as Address).filter(Boolean))]
  const balances = useReadContracts({
    contracts: tokenList.flatMap((t) => [
      { address: t, abi: abis.utilityToken, functionName: "symbol" },
      { address: t, abi: abis.utilityToken, functionName: "decimals" },
      { address: t, abi: abis.erc20, functionName: "balanceOf", args: [addresses.treasury] },
    ]),
    query: { refetchInterval: 15_000 },
  })
  const me = address?.toLowerCase()
  const pendingFor = (p: unknown) => !!me && String(p ?? "").toLowerCase() === me
  const accept = (label: string, target: Address) => () => send(`Accept ${label} ownership`, { address: target, abi: ownableAbi as never, functionName: "acceptOwnership", args: [] }).then(() => head.refetch())

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Operator</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">What the platform earns and controls: every instance pays its protocol fee and service fees into the treasury; the paymaster deposit is what sponsors user gas.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Instances" value={String(tenantCount ?? "…")} />
        <Stat label="Protocol fee" value={feeBps !== undefined ? `${Number(feeBps) / 100}%` : "…"} />
        <Stat label="Launch fee" value={deployFee !== undefined ? ((deployFee as bigint) > 0n ? <Amount value={deployFee as bigint} /> : "free") : "…"} />
        <Stat label="Paymaster deposit" value={pmDeposit !== undefined ? <Amount value={pmDeposit as bigint} symbol="tBNB" /> : "…"} />
      </div>
      <Card title="Treasury balances (fees earned, by token)">
        <div className="divide-y divide-border">
          {tokenList.map((t, i) => {
            const [sym, dec, bal] = (balances.data ?? []).slice(i * 3, i * 3 + 3).map((r) => r.result)
            return (
              <div key={t} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3 text-sm">
                <span className="font-semibold">{(sym as string) ?? "…"}</span>
                <Addr a={t} />
                <Amount value={(bal as bigint) ?? 0n} decimals={Number(dec ?? 18)} />
              </div>
            )
          })}
        </div>
      </Card>
      <Card title="Control">
        <div className="divide-y divide-border text-sm">
          {[["Mother (factory & policy)", addresses.mother, mOwner, mPending], ["Treasury", addresses.treasury, tOwner, tPending], ["Token factory", addresses.tokenFactory, fOwner, fPending]].map(([label, addr, owner, pending]) => (
            <div key={String(addr)} className="grid grid-cols-[1fr_auto] items-center gap-4 py-3">
              <span>{label as string} <Addr a={addr as string} /> · owner <Addr a={String(owner ?? "")} />{!!me && String(owner ?? "").toLowerCase() === me && <> <Pill tone="good">you</Pill></>}</span>
              {pendingFor(pending) ? <Button size="sm" disabled={isPending} onClick={accept(label as string, addr as Address)}>Accept ownership</Button> : <span className="text-xs text-muted-foreground">{pending && !/^0x0{40}$/.test(String(pending)) ? `transfer pending to ${String(pending).slice(0, 8)}…` : ""}</span>}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Ownership moves in two steps (offer, then accept from the new wallet) so a typo can never lock the platform. On mainnet these owners become a multisig behind a timelock.</p>
      </Card>
    </div>
  )
}
