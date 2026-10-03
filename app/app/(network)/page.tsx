"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAccount, useReadContract } from "wagmi"
import { ArrowRight, Check } from "lucide-react"
import { abis, addresses, PUBLIC_WORKSPACE_ID } from "@/lib/bitregalo/config"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useSettlementTokens } from "@/lib/bitregalo/instances"
import { categoryLabel, countryName, guessCountry, listEntries, marketAvailable, type Entry } from "@/lib/bitregalo/market"
import { NEW_ACTIONS } from "@/components/app/nav"
import { Addr, Amount, Card, Empty, LedgerRow, PageHead, RowsSkeleton, Section } from "@/components/app/ui"
import { ConnectButton } from "@/components/app/connect-button"
import { FaucetButton } from "@/components/app/faucet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ActivityRow, useMyActivity } from "./activity/activity"

/** What each action is, in one line, as a first-time visitor would put it. */
const LINE: Record<string, string> = {
  pay: "Pay someone or send a gift. It reaches them straight away, with a receipt.",
  "get-paid": "Make a payment link or QR code that anyone can pay.",
  escrow: "Agree a job and a price. The payment is held until you say the work is done.",
  request: "Post a request. Suppliers send their prices and you choose one.",
  listing: "List what you sell at a fixed price, for anyone to take.",
}

export default function NetworkHome() {
  const t = useTenant()
  const { address, isConnected } = useAccount()
  const balance = useReadContract({
    address: addresses.testStable, abi: abis.erc20, functionName: "balanceOf", args: [address!],
    query: { enabled: !!address && !!addresses.testStable, refetchInterval: 15_000 },
  })
  const funded = ((balance.data as bigint | undefined) ?? 0n) > 0n
  const activity = useMyActivity()
  const settingUp = !isConnected || (!!addresses.testStable && !funded)
  // A connected wallet with no practice tokens and nothing done yet only needs the setup.
  const showActivity = isConnected && (!settingUp || activity.items.length > 0)
  const ready = (a: (typeof NEW_ACTIONS)[number]) => !a.minVersion || t.version >= BigInt(a.minVersion)
  // What works today comes first; what is still coming to the network goes last.
  const actions = NEW_ACTIONS.filter((a) => !a.workspaceOnly).sort((a, b) => Number(ready(b)) - Number(ready(a)))

  return (
    <div className="space-y-12">
      <PageHead
        title="BitRegalo network"
        intro="Open to everyone, anywhere. Payments, escrows, requests and listings here are settled by BitRegalo's public contracts, and people pay each other in USDT (tUSD on this practice network)."
      />

      <Section title="What would you like to do?">
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          {actions.map((a) => {
            if (!ready(a)) {
              return (
                <div key={a.key} className="flex flex-col bg-card px-5 py-4 sm:px-6 sm:py-5">
                  <span className="flex items-center gap-2.5">
                    <a.icon className="size-5 shrink-0 text-subtle" aria-hidden />
                    <span className="t-subheading text-muted-foreground">{a.label}</span>
                  </span>
                  <span className="mt-1.5 text-sm text-muted-foreground">
                    <span className="font-[560] text-foreground">Coming to the network soon.</span> It needs the current contracts, which the network is moving to.
                  </span>
                </div>
              )
            }
            return (
              <Link key={a.key} href={t.base + a.path} className="group flex flex-col bg-card px-5 py-4 outline-none transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 sm:px-6 sm:py-5">
                <span className="flex items-center gap-2.5">
                  <a.icon className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
                  <span className="t-subheading flex-1">{a.label}</span>
                  <ArrowRight className="size-4 shrink-0 text-subtle transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
                </span>
                <span className="mt-1.5 text-sm text-muted-foreground">{LINE[a.key] ?? a.hint}</span>
              </Link>
            )
          })}
          <Link href="/app/help" className="group flex flex-col bg-card px-5 py-4 outline-none transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 sm:px-6 sm:py-5">
            <span className="flex items-center gap-2.5">
              <span className="t-subheading flex-1 text-muted-foreground group-hover:text-foreground">Not sure yet?</span>
              <ArrowRight className="size-4 shrink-0 text-subtle transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="mt-1.5 text-sm text-muted-foreground">See how the network and organisation workspaces work, in plain words.</span>
          </Link>
        </div>
      </Section>

      {settingUp && (
        <Section title="First time here? Three steps" description="This is a practice network. Its tokens are free and have no value, so you can try everything.">
          <ol className="overflow-hidden rounded-xl border border-border bg-card">
            <SetupStep n={1} done={isConnected} title="Connect a wallet" body="A wallet such as MetaMask is how you sign in and approve each step. BitRegalo never holds your keys." action={!isConnected && <ConnectButton />} />
            <SetupStep n={2} done={funded} title="Take some practice tokens" body="1,000 tUSD a day from the faucet. It has no value; it is there to try things with." action={isConnected && !funded && <FaucetButton size="default" variant="default" label="Get 1,000 tUSD" onDone={() => balance.refetch()} />} />
            <SetupStep
              n={3} done={false} title="Try it"
              body="Hold 10 tUSD for a friend, or post a small request. Nothing happens until you sign."
              action={<Button asChild variant="secondary"><Link href={`${t.base}/escrows/new`}>Hold a payment for someone<ArrowRight /></Link></Button>}
            />
          </ol>
        </Section>
      )}

      {showActivity && (
        <Card
          flush
          title="Your activity"
          description={activity.needs.length > 0 ? `${activity.needs.length} ${activity.needs.length === 1 ? "thing needs" : "things need"} you.` : "Nothing is waiting for you."}
          action={<Button asChild size="sm" variant="ghost"><Link href={`${t.base}/activity`}>My activity<ArrowRight /></Link></Button>}
        >
          {activity.loading && activity.items.length === 0 && <RowsSkeleton rows={2} />}
          {!activity.loading && activity.items.length === 0 && (
            <Empty title="Nothing yet" body="What you send, hold, ask for or offer on the network appears here, with anything that needs you first." />
          )}
          {[...activity.needs, ...activity.rest].slice(0, 4).map((item) => <ActivityRow key={item.key} item={item} />)}
        </Card>
      )}

      <MarketPreview />

      <section className="border-t border-border pt-12">
        <Section
          title="For organisations"
          action={
            <>
              <Button asChild variant="secondary"><Link href="/app/workspaces">See workspaces</Link></Button>
              <Button asChild variant="ghost"><Link href="/app/launch">Create a workspace</Link></Button>
            </>
          }
        >
          <div className="max-w-[66ch] space-y-3 text-base text-muted-foreground">
            <p>
              An organisation can run its own <span className="font-[560] text-foreground">workspace</span>: its own contracts, rules and fees, the
              currencies it accepts (a local stablecoin, for example), its own tokens, shop and treasury. Everything done in a workspace is
              recorded under that workspace, apart from the network.
            </p>
            <p>Two examples of what that could look like:</p>
          </div>
          <dl className="mt-5 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="t-subheading">An aid platform</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                Funds for each delivery of aid are held in escrow and released to the local supplier once delivery is confirmed, in the
                currency the platform uses. Donors can see every step on the public record.
              </dd>
            </div>
            <div>
              <dt className="t-subheading">A construction marketplace</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                Head contractors post work, subcontractors send offers, and each stage is paid through escrow under the marketplace&apos;s
                own rules and fees.
              </dd>
            </div>
          </dl>
        </Section>
      </section>
    </div>
  )
}

/** The newest requests and listings in the visitor's country, from the marketplace index. */
function MarketPreview() {
  const t = useTenant()
  const tokens = useSettlementTokens(t.instance, t.id)
  const [country, setCountry] = useState<string | null>(null)
  const [state, setState] = useState<{ status: "off" | "loading" | "error" | "ok"; entries: Entry[]; elsewhere?: boolean }>({ status: marketAvailable ? "loading" : "off", entries: [] })

  useEffect(() => {
    if (!marketAvailable) return
    const c = guessCountry()
    setCountry(c)
    let live = true
    ;(async () => {
      try {
        const here = await listEntries({ country: c ?? undefined, limit: 5 })
        // Nothing in the visitor's country yet: show the newest from anywhere instead.
        if (here.entries.length === 0 && c) {
          const all = await listEntries({ limit: 5 })
          if (live) setState({ status: "ok", entries: all.entries, elsewhere: all.entries.length > 0 })
        } else if (live) setState({ status: "ok", entries: here.entries })
      } catch {
        if (live) setState({ status: "error", entries: [] })
      }
    })()
    return () => { live = false }
  }, [])

  const place = country ? countryName(country) : null
  const browse = <Button asChild size="sm" variant="secondary"><Link href={`${t.base}/market`}>Browse by country</Link></Button>
  const network = Number(PUBLIC_WORKSPACE_ID)
  const hrefOf = (e: Entry) => `${e.workspace === network ? t.base : `/app/t/${e.workspace}`}/${e.kind === "request" ? "requests" : "listings"}/${e.recordId}`
  const tokenOf = (a: string) => tokens.all.find((x) => x.address.toLowerCase() === a.toLowerCase())

  return (
    <Card
      flush
      title={place ? `Marketplace in ${place}` : "Marketplace near you"}
      description={state.elsewhere ? `Nothing posted in ${place} yet. The newest from other countries:` : place ? "The newest requests and listings posted here." : "The newest requests and listings."}
      action={browse}
    >
      {state.status === "loading" && <RowsSkeleton rows={3} />}
      {state.status === "off" && (
        <Calm>
          The marketplace by country is not switched on in this copy of the app yet. Requests and listings on the network are still open
          to everyone: see <Link className="text-gold underline underline-offset-4" href={`${t.base}/requests`}>requests</Link> and{" "}
          <Link className="text-gold underline underline-offset-4" href={`${t.base}/listings`}>listings</Link>.
        </Calm>
      )}
      {state.status === "error" && (
        <Calm>
          The marketplace did not answer just now. Try again in a moment, or see the network&apos;s{" "}
          <Link className="text-gold underline underline-offset-4" href={`${t.base}/requests`}>requests</Link> and{" "}
          <Link className="text-gold underline underline-offset-4" href={`${t.base}/listings`}>listings</Link>.
        </Calm>
      )}
      {state.status === "ok" && state.entries.length === 0 && (
        <Empty
          title={place ? `Nothing posted in ${place} yet` : "Nothing posted yet"}
          body="Be the first: ask for something or offer something, and choose your country when you post it."
        />
      )}
      {state.status === "ok" && state.entries.map((e) => {
        const tk = tokenOf(e.token)
        const priced = e.kind === "listing" && e.amount !== "0" && !!tk
        return (
          <LedgerRow
            key={`${e.workspace}-${e.kind}-${e.recordId}`}
            href={hrefOf(e)}
            title={e.title}
            meta={
              <>
                {e.kind === "request" ? "Request" : "Listing"} · {categoryLabel(e.category)} · {e.city ? `${e.city}, ` : ""}{countryName(e.country)}
                {e.workspace !== network && <> · in workspace #{e.workspace}</>}
                {" · by "}<Addr a={e.poster} />
              </>
            }
            amount={priced ? <Amount value={BigInt(e.amount)} decimals={tk!.decimals} symbol={tk!.symbol} /> : undefined}
          />
        )
      })}
    </Card>
  )
}

function Calm({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[66ch] px-5 py-5 text-sm text-muted-foreground sm:px-6">{children}</p>
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
