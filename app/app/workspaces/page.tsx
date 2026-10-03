"use client"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { ArrowRight } from "lucide-react"
import { abis, addresses, PUBLIC_WORKSPACE_ID } from "@/lib/bitregalo/config"
import { useInstances } from "@/lib/bitregalo/instances"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { Addr, Card, Empty, LedgerRow, PageHead, Pill, RowsSkeleton, Section } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

export default function Workspaces() {
  const { address } = useAccount()
  const ws = useInstances()
  const nameOf = useWorkspaceName()
  const orgs = ws.list.filter((w) => w.id !== PUBLIC_WORKSPACE_ID)
  const versionCount = useReadContract({ address: addresses.mother, abi: abis.mother, functionName: "versionCount" })
  const current = versionCount.data !== undefined ? Number(versionCount.data as bigint) - 1 : null
  const details = useReadContracts({
    contracts: orgs.flatMap((w) => [
      { address: addresses.mother, abi: abis.mother, functionName: "tenants", args: [w.id] },
      { address: w.instance, abi: abis.instance, functionName: "rfpCount" },
      { address: w.instance, abi: abis.instance, functionName: "offerCount" },
      { address: w.vault, abi: abis.vault, functionName: "escrowCount" },
    ]),
    query: { enabled: orgs.length > 0 },
  })
  const isMine = (admin: string) => !!address && admin.toLowerCase() === address.toLowerCase()
  // Your own workspaces first, then the rest in the order they were created.
  const rows = orgs.map((w, i) => ({ w, i })).sort((a, b) => Number(isMine(b.w.admin)) - Number(isMine(a.w.admin)))
  /** Workspace 0 was the first public workspace; when the network has moved on, say so. */
  const title = (id: bigint) => (id === 0n ? "BitRegalo public workspace (first version)" : nameOf(id))
  const versionWord = (v: number | undefined) =>
    v === undefined ? null : current !== null && v === current ? "Current contracts" : v === 0 ? "First version" : `Version ${v}`
  const plural = (n: bigint | undefined, one: string, many: string) => (n === undefined ? null : `${String(n)} ${n === 1n ? one : many}`)

  return (
    <div className="space-y-12">
      <PageHead
        title="Workspaces"
        intro="A workspace is an organisation's own BitRegalo: its own contracts, rules and fees, the currencies it accepts, its tokens, shop and treasury. Everything done inside it is recorded under that workspace, run by its admin."
        action={<Button asChild><Link href="/app/launch">Create a workspace</Link></Button>}
      />

      <Card flush title={orgs.length > 0 ? `Organisation workspaces (${orgs.length})` : "Organisation workspaces"}>
        {ws.isLoading && <RowsSkeleton rows={2} />}
        {!ws.isLoading && orgs.length === 0 && (
          <Empty
            title="No organisation workspaces yet"
            body="The first one could be yours. It takes a few short steps, and you review everything before you sign."
            action={<Button asChild size="sm" variant="secondary"><Link href="/app/launch">Create a workspace</Link></Button>}
          />
        )}
        {rows.map(({ w, i }) => {
          const tenant = details.data?.[i * 4]?.result as { version: bigint } | undefined
          const rfps = details.data?.[i * 4 + 1]?.result as bigint | undefined
          const listings = details.data?.[i * 4 + 2]?.result as bigint | undefined
          const escrows = details.data?.[i * 4 + 3]?.result as bigint | undefined
          const version = versionWord(tenant ? Number(tenant.version) : undefined)
          const counts = [plural(rfps, "request", "requests"), plural(listings, "listing", "listings"), plural(escrows, "escrow", "escrows")].filter(Boolean)
          return (
            <LedgerRow
              key={String(w.id)}
              href={`/app/t/${w.id}`}
              lead={`#${String(w.id)}`}
              title={title(w.id)}
              meta={
                <>
                  Run by {isMine(w.admin) ? <span className="font-[560] text-foreground">you</span> : <Addr a={w.admin} />}
                  {version && <> · {version}</>}
                  {counts.length > 0 && <span className="block">{counts.join(" · ")}</span>}
                </>
              }
              status={isMine(w.admin) ? <Pill tone="good">Yours</Pill> : undefined}
            />
          )
        })}
      </Card>

      <Section title="Workspace or network?">
        <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="t-subheading">Use the BitRegalo network</dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              For people and businesses on their own: send money, hold it in escrow, ask for things and offer them, in USDT, in a
              marketplace by country. Nothing to set up.
            </dd>
            <dd className="mt-2"><Button asChild variant="link" className="text-sm"><Link href="/app">Go to the network<ArrowRight /></Link></Button></dd>
          </div>
          <div>
            <dt className="t-subheading">Create a workspace</dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              When an organisation needs its own rules, fees or currency (a local stablecoin, for example), its own tokens or shop, or
              wants its records kept together under its own name. You become its admin.
            </dd>
            <dd className="mt-2"><Button asChild variant="link" className="text-sm"><Link href="/app/help#model">How workspaces work<ArrowRight /></Link></Button></dd>
          </div>
        </dl>
      </Section>
    </div>
  )
}
