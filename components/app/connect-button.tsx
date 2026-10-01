"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi"
import { toast } from "sonner"
import { ChevronDown, Copy, ExternalLink, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { chain, explorerAddress, short } from "@/lib/bitregalo/config"

/**
 * Wallet picker. wagmi discovers every installed wallet through EIP-6963 (MetaMask,
 * Brave Wallet, Trust, Rabby…) so the user chooses explicitly instead of us guessing
 * which one owns `window.ethereum` — the usual reason a single "Connect" button does
 * nothing when two wallets are installed.
 */
/** `variant="outline"` for the copy that lives in the header, so a page's own prompt to connect stays the one primary button. */
export function ConnectButton({ size = "default", variant = "default" }: { size?: "default" | "sm" | "lg"; variant?: "default" | "outline" }) {
  const { address, isConnected, chain: current } = useAccount()
  const { connectAsync, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <Button size={size} variant={variant} disabled>Connect wallet</Button>

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
      <Sheet open={open} onOpenChange={setOpen}>
        <Button size={size} variant={variant} onClick={() => setOpen(true)} disabled={isPending}>{isPending ? "Connecting…" : "Connect wallet"}</Button>
        <SheetContent title="Connect a wallet" description="Your wallet is how you sign in and approve each step. BitRegalo never holds your keys.">
          {list.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No wallet was found in this browser. Install one, or on a phone open this page inside your wallet app&apos;s browser.
              </p>
              <Button asChild variant="secondary" className="w-full">
                <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">Get MetaMask<ExternalLink /></a>
              </Button>
            </div>
          ) : (
            <ul className="-mx-2">
              {list.map((c) => (
                <li key={c.uid}>
                  <button
                    onClick={() => pick(c.id)}
                    disabled={isPending}
                    className="flex min-h-14 w-full items-center gap-3.5 rounded-xl px-3 text-left text-base font-[560] transition-colors hover:bg-secondary active:bg-secondary-hover disabled:text-subtle"
                  >
                    {c.icon ? <img src={c.icon} alt="" className="size-8 rounded-lg" /> : <span className="size-8 rounded-lg bg-secondary" aria-hidden />}
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
            This is a practice network. Once connected you can take free practice money and try every step.
          </p>
        </SheetContent>
      </Sheet>
    )
  }
  if (current?.id !== chain.id) {
    return (
      <Button size={size} variant="destructive" onClick={() => switchChainAsync({ chainId: chain.id }).catch((e) => toast.error("Could not switch network", { description: (e as Error).message.split("\n")[0] }))}>
        Switch network
      </Button>
    )
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={size} variant="outline" className="gap-2 px-3" aria-label={`Wallet ${short(address!)}`}>
          <span className="size-2 rounded-full bg-success" aria-hidden />
          <span className="t-mono text-[0.8125rem]">{short(address!)}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Connected on {chain.name}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => navigator.clipboard.writeText(address!).then(() => toast.success("Address copied"))}>
          <Copy />Copy address
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={explorerAddress(address!)} target="_blank" rel="noreferrer"><ExternalLink />View on the explorer</a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/operator">Platform and earnings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => disconnect()}>
          <LogOut />Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
