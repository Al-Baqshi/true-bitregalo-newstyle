"use client"
import { useAccount, useReadContract } from "wagmi"
import { Droplets } from "lucide-react"
import { abis, addresses } from "@/lib/bitregalo/config"
import { useTx } from "@/lib/bitregalo/hooks"
import { Button } from "@/components/ui/button"

const faucetAbi = [
  { type: "function", name: "faucet", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "nextClaimAt", stateMutability: "view", inputs: [{ name: "who", type: "address" }], outputs: [{ type: "uint64" }] },
] as const

/** One click gives the connected wallet 1,000 tUSD, once a day. Only exists on test networks. */
export function FaucetButton({ size = "sm", variant = "secondary", onDone, label }: { size?: "sm" | "default" | "lg"; variant?: "secondary" | "default"; onDone?: () => void; label?: string }) {
  const { address, isConnected } = useAccount()
  const { send, isPending } = useTx()
  const stable = addresses.testStable
  const next = useReadContract({ address: addresses.testStable, abi: faucetAbi, functionName: "nextClaimAt", args: [address!], query: { enabled: !!address && !!addresses.testStable, refetchInterval: 15_000 } })
  const bal = useReadContract({ address: addresses.testStable, abi: abis.erc20, functionName: "balanceOf", args: [address!], query: { enabled: !!address && !!addresses.testStable, refetchInterval: 15_000 } })
  if (!stable) return null
  const nextAt = Number((next.data as bigint | undefined) ?? 0n)
  const wait = nextAt > Date.now() / 1000
  const hours = Math.ceil((nextAt - Date.now() / 1000) / 3600)
  async function claim() {
    await send("Get 1,000 tUSD", { address: stable!, abi: faucetAbi as never, functionName: "faucet", args: [] })
    next.refetch(); bal.refetch(); onDone?.()
  }
  return (
    <Button size={size} variant={variant} disabled={!isConnected || isPending || wait} onClick={claim} title={!isConnected ? "Connect a wallet first" : wait ? `Next claim in about ${hours} h` : "Practice money with no value"}>
      <Droplets className="size-4" />{wait ? `Test money again in ${hours} h` : label ?? "Get 1,000 tUSD test money"}
    </Button>
  )
}
