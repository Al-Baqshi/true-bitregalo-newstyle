"use client"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { ArrowRight, Check } from "lucide-react"
import { abis, addresses } from "@/lib/bitregalo/config"
import { useInstances } from "@/lib/bitregalo/instances"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { Addr, Card, LedgerRow, PageHead, Pill, RowsSkeleton, Section } from "@/components/app/ui"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@/components/app/connect-button"
import { FaucetButton } from "@/components/app/faucet"
import { cn } from "@/lib/utils"

export default function Home() {
  const { address, isConnected } = useAccount()
  const ws = useInstances()
  const nameOf = useWorkspaceName()
  const counts = useReadContracts({
    contracts: ws.list.flatMap((w) => [
      { address: w.instance, abi: abis.instance, functionName: "rfpCount" },
      { address: w.vault, abi: abis.vault, functionName: "escrowCount" },
    ]),
    query: { enabled: ws.list.length > 0 },
  })
  const balance = useReadContract({
    address: addresses.testStable, abi: abis.erc20, functionName: "balanceOf", args: [address!],
    query: { enabled: !!address && !!addresses.testStable, refetchInterval: 15_000 },
  })
  const funded = ((balance.data as bigint | undefined) ?? 0n) > 0n
  const isMine = (admin: string) => !!address && admin.toLowerCase() === address.toLowerCase()
  // Your own workspaces first, then the rest in the order they were created.
  const rows = ws.list.map((w, i) => ({ w, i })).sort((a, b) => Number(isMine(b.w.admin)) - Number(isMine(a.w.admin)))
  const settingUp = !isConnected || (!!addresses.testStable && !funded)

  return (
    <div className="space-y-12">
      <PageHead
        title="Workspaces"
        intro="A workspace is one organisation's own space: its shop, requests, payments and escrows. Open one to take part, or create your own."
        action={<Button asChild variant="secondary"><Link href="/app/launch">Create a workspace</Link></Button>}
      />

      {settingUp && (
        <Section title="First time here? Three steps" description="This is a practice network. The money is free and has no value, so you can try every step.">
          <ol className="overflow-hidden rounded-xl border border-border bg-card">
            <SetupStep n={1} done={isConnected} title="Connect a wallet" body="A wallet such as MetaMask is how you sign in and approve each step." action={!isConnected && <ConnectButton />} />
            <SetupStep n={2} done={funded} title="Take some practice money" body="1,000 tUSD a day from the faucet. It has no value; it is there to try things with." action={isConnected && !funded && <FaucetButton size="default" variant="default" label="Get 1,000 tUSD" onDone={() => balance.refetch()} />} />
            <SetupStep n={3} done={false} title="Open the public workspace" body="Anyone can post a request, make a listing or take one there." action={<Button asChild variant="secondary"><Link href="/app/t/0">Open it<ArrowRight /></Link></Button>} />
          </ol>
        </Section>
      )}

      <Card flush title={ws.list.length > 0 ? `All workspaces (${ws.list.length})` : "All workspaces"}>
        {ws.list.length === 0 && <RowsSkeleton rows={2} />}
        {rows.map(({ w, i }) => {
          const rfps = counts.data?.[i * 2]?.result as bigint | undefined
          const escrows = counts.data?.[i * 2 + 1]?.result as bigint | undefined
          return (
            <LedgerRow
              key={String(w.id)}
              href={`/app/t/${w.id}`}
              title={nameOf(w.id)}
              meta={
                <>
                  Run by <Addr a={w.admin} />
                  {rfps !== undefined && <> · {String(rfps)} {rfps === 1n ? "request" : "requests"} · {String(escrows)} {escrows === 1n ? "escrow" : "escrows"}</>}
                </>
              }
              status={isMine(w.admin) ? <Pill tone="good">Yours</Pill> : undefined}
            />
          )
        })}
      </Card>

      <Section title="New to BitRegalo?">
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {[
            { href: "/app/help#how", title: "How it works", body: "Ask, get offers, choose, pay. Four steps, the same every time." },
            { href: "/app/help#settle", title: "Three ways to settle", body: "Just record it, pay straight away, or hold the money in escrow." },
            { href: "/app/help#glossary", title: "Words we use", body: "Workspace, request, listing, escrow and the rest, in plain language." },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="group bg-card px-5 py-4 transition-colors hover:bg-secondary/60 sm:px-6 sm:py-5">
              <span className="t-subheading flex items-center justify-between gap-3">
                {l.title}
                <ArrowRight className="size-4 text-subtle transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{l.body}</span>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  )
}

function SetupStep({ n, done, title, body, action }: { n: number; done: boolean; title: string; body: string; action?: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border px-5 py-4 last:border-b-0 sm:px-6">
      <span className={cn("t-num flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold", done ? "border-success bg-success-fill text-success" : "border-border-strong")}>
        {done ? <Check className="size-4" /> : n}
      </span>
      <div className="min-w-0 flex-1 basis-56">
        <p className={cn("text-base font-[560]", done && "text-muted-foreground")}>{title}</p>
        <p className="text-sm text-muted-foreground">{done ? "Done." : body}</p>
      </div>
      {action && <div className="pl-12 sm:pl-0">{action}</div>}
    </li>
  )
}
