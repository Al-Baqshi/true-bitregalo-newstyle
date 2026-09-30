"use client"
import Link from "next/link"
import { useAccount, useReadContracts } from "wagmi"
import { abis } from "@/lib/bitregalo/config"
import { instanceName, useInstances } from "@/lib/bitregalo/instances"
import { Addr, Row, Pill } from "@/components/app/ui"
import { HowItWorks, SettleModes, Glossary } from "@/components/app/explain"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { address } = useAccount()
  const ws = useInstances()
  const counts = useReadContracts({
    contracts: ws.list.flatMap((w) => [
      { address: w.instance, abi: abis.instance, functionName: "rfpCount" },
      { address: w.vault, abi: abis.vault, functionName: "escrowCount" },
    ]),
    query: { enabled: ws.list.length > 0 },
  })
  return (
    <div className="space-y-16">
      <section className="pt-4">
        <p className="bq-label">BitRegalo · practice network</p>
        <h1 className="bq-display mt-3 max-w-3xl text-4xl font-semibold leading-[1.1] text-balance sm:text-5xl">
          Sell, get paid and settle deliveries — from your organisation&apos;s own contract.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[color:var(--bq-ivory-dim)]">
          Launch a workspace with its own treasury. Sell vouchers, credits or memberships for stablecoins, take payments by link or QR, post requests and hold money in escrow until work is delivered. Every step is written to a public blockchain that nobody, including BitRegalo, can alter.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link href="/app/t/0">Try it in the public workspace</Link></Button>
          <Button asChild size="lg" variant="secondary"><Link href="/app/launch">Create your own workspace</Link></Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">You need a wallet such as MetaMask set to BNB Smart Chain Testnet. The money here is practice money with no value.</p>
      </section>

      <section>
        <p className="bq-label">How it works</p>
        <h2 className="bq-display mt-2 text-2xl font-semibold">Four steps, the same every time</h2>
        <div className="mt-6"><HowItWorks /></div>
      </section>

      <section>
        <p className="bq-label">Paying</p>
        <h2 className="bq-display mt-2 text-2xl font-semibold">Three ways to settle — you choose per request</h2>
        <div className="mt-6"><SettleModes /></div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="bq-label">Workspaces</p>
            <h2 className="bq-display mt-2 text-2xl font-semibold">Where the work happens</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">A workspace is one organisation&apos;s own space: its requests, listings, payments and tokens. Anyone can take part in one; its admin sets the rules.</p>
          </div>
          <Button asChild variant="secondary"><Link href="/app/launch">Create a workspace</Link></Button>
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-card/70 px-6 py-2">
          {ws.list.map((w, i) => {
            const mine = !!address && w.admin.toLowerCase() === address.toLowerCase()
            const rfps = counts.data?.[i * 2]?.result as bigint | undefined
            const escrows = counts.data?.[i * 2 + 1]?.result as bigint | undefined
            return (
              <Row key={String(w.id)} href={`/app/t/${w.id}`}>
                <span className="bq-mono text-xs text-muted-foreground">#{String(w.id)}</span>
                <span className="min-w-0 truncate text-sm">
                  <span className="font-medium">{instanceName(w.id) ?? (w.id === 0n ? "Public workspace" : `Workspace #${w.id}`)}</span>
                  <span className="text-muted-foreground"> · run by <Addr a={w.admin} /></span>
                  {rfps !== undefined && <span className="text-muted-foreground"> · {String(rfps)} requests · {String(escrows)} escrows</span>}
                </span>
                {mine ? <Pill tone="good">yours</Pill> : <span />}
              </Row>
            )
          })}
          {ws.list.length === 0 && <p className="py-6 text-sm text-muted-foreground">Loading workspaces…</p>}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="bq-label">Words we use</p>
          <h2 className="bq-display mt-2 text-2xl font-semibold">A short glossary</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Tap a term to see what it means. None of it needs blockchain knowledge — your wallet just signs each step.</p>
        </div>
        <Glossary />
      </section>
    </div>
  )
}
