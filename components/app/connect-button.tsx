"use client"
import { useEffect, useState } from "react"
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { chain, short } from "@/lib/bitregalo/config"

/**
 * Wallet picker. wagmi discovers every installed wallet through EIP-6963 (MetaMask,
 * Brave Wallet, Trust, Rabby…) so the user chooses explicitly instead of us guessing
 * which one owns `window.ethereum` — the usual reason a single "Connect" button does
 * nothing when two wallets are installed.
 */
export function ConnectButton() {
  const { address, isConnected, chain: current } = useAccount()
  const { connectAsync, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <Button disabled>Connect wallet</Button>

  // Prefer the wallets the browser announced; keep the generic injected fallback last.
  const discovered = connectors.filter((c) => c.id !== "injected")
  const list = discovered.length > 0 ? discovered : connectors

  async function pick(id: string) {
    const connector = connectors.find((c) => c.id === id)
    if (!connector) return
    try {
      await connectAsync({ connector, chainId: chain.id })
      setOpen(false)
      toast.success(`Connected to ${connector.name}`)
    } catch (e) {
      const msg = (e as Error).message ?? String(e)
      toast.error("Could not connect", { description: msg.split("\n")[0].slice(0, 160) })
    }
  }

  if (!isConnected) {
    return (
      <div className="relative">
        <Button onClick={() => setOpen((v) => !v)} disabled={isPending}>{isPending ? "Connecting…" : "Connect wallet"}</Button>
        {open && (
          <div className="absolute right-0 z-30 mt-2 w-64 rounded-lg border border-border bg-card p-2 shadow-xl">
            {list.length === 0 && (
              <p className="p-2 text-xs text-muted-foreground">
                No wallet found in this browser. Install MetaMask, or open this page inside your wallet&apos;s browser on mobile.
              </p>
            )}
            {list.map((c) => (
              <button key={c.uid} onClick={() => pick(c.id)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-secondary">
                {c.icon ? <img src={c.icon} alt="" className="size-5 rounded" /> : <span className="size-5 rounded bg-secondary" />}
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
  if (current?.id !== chain.id) {
    return (
      <Button variant="destructive" onClick={() => switchChainAsync({ chainId: chain.id }).catch((e) => toast.error("Switch network", { description: (e as Error).message.split("\n")[0] }))}>
        Switch to {chain.name}
      </Button>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground">{short(address!)}</span>
      <Button variant="ghost" size="sm" onClick={() => disconnect()}>Disconnect</Button>
    </div>
  )
}
