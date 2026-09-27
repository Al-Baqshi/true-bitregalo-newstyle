"use client"
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi"
import { Button } from "@/components/ui/button"
import { chain, short } from "@/lib/bitregalo/config"

export function ConnectButton() {
  const { address, isConnected, chain: current } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  if (!isConnected) {
    const injected = connectors.find((c) => c.id === "injected") ?? connectors[0]
    return (
      <Button onClick={() => injected && connect({ connector: injected })} disabled={isPending || !injected}>
        {isPending ? "Connecting…" : "Connect wallet"}
      </Button>
    )
  }
  if (current?.id !== chain.id) {
    return (
      <Button variant="destructive" onClick={() => switchChain({ chainId: chain.id })}>
        Switch to {chain.name}
      </Button>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground">
        {short(address!)}
      </span>
      <Button variant="ghost" size="sm" onClick={() => disconnect()}>Disconnect</Button>
    </div>
  )
}
