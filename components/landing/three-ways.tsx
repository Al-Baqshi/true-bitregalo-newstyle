import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

/*
 * The three ways to use BitRegalo, in the order the protocol is built for:
 *
 *   1. Connect a platform        an existing product reads the records and has its users
 *                                sign BitRegalo actions from inside its own site.
 *   2. Run a workspace           an organisation launches its own contracts.
 *   3. Use the BitRegalo network BitRegalo's own public workspace: the reference app,
 *                                and the place to try every part.
 *
 * The first is the one the surface is given to. What a developer gets today and what is
 * only planned are said side by side; keep both lists in step with PRODUCT.md ("What is
 * built and what is designed") and the "Connect a platform" page in the app.
 */
const CONNECT = [
  { title: "Read the records", text: "Any record can be read from the network without a key or an account. There is nothing to apply for." },
  { title: "Let your users sign", text: "Posting a request, taking a listing, funding or releasing an escrow: each is a transaction a user signs in their own wallet, from your own site." },
  { title: "Available today", text: "Contract addresses, interface files, typed code examples and payment links, on a public page for each workspace." },
  { title: "Planned, not built", text: "A published SDK, API keys for servers, webhooks, and records of any event your platform wants to prove." },
]

const WORKSPACE = [
  { title: "Its own contracts", text: "Records and rules, a vault that holds commitments, and a treasury its admin owns." },
  { title: "Its own rules", text: "The tokens it accepts, such as a local stablecoin, and which ways of settling are switched on." },
  { title: "Its own tokens and shop", text: "Vouchers, credits or memberships it issues, sells for a stablecoin and takes back when they are redeemed." },
  { title: "Used its own way", text: "Through the web app, through its own platform, or both." },
]

const NETWORK = [
  { title: "Hold a payment for someone", text: "Lock it in escrow until the work is done." },
  { title: "Ask for something", text: "Post a request. Suppliers answer with a price and a time, and you choose one." },
  { title: "Offer something", text: "List what you do or sell at a fixed price." },
  { title: "Settle it your way", text: "Each request or listing is recorded only, paid directly, or held in escrow." },
]

function Rows({ items }: { items: { title: string; text: string }[] }) {
  return (
    <dl className="divide-y divide-border border-y border-border">
      {items.map((n) => (
        <div key={n.title} className="grid gap-x-6 gap-y-0.5 py-3.5 sm:grid-cols-[13rem_1fr]">
          <dt className="text-base font-semibold">{n.title}</dt>
          <dd className="text-base text-muted-foreground">{n.text}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ThreeWays() {
  return (
    <section id="ways" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <h2 className="t-headline">Three ways to use it</h2>
          <p className="t-lede mt-5">Connect the platform you already run. Launch a workspace of your own. Or try it on the BitRegalo network, which is open to anyone.</p>
        </div>

        <div id="platforms" className="mt-12 rounded-2xl border border-border bg-card p-5 shadow-raised sm:p-8">
          <div className="grid gap-x-14 gap-y-8 lg:grid-cols-2 lg:items-start">
            <div>
              <h3 className="flare text-2xl font-[620] tracking-tight sm:text-3xl">Connect a platform</h3>
              <p className="mt-3 max-w-[60ch] text-base text-muted-foreground">
                For a product that already takes payments: a marketplace, an enterprise system, a bank, a startup. It keeps its own site, app or back office and connects BitRegalo for the records and commitments that should not depend on trusting it. This is the use the protocol is built for.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild size="lg" variant="secondary"><Link href="/app/connect">See how a platform connects<ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link href="#contact">Talk to us</Link></Button>
              </div>
            </div>
            <Rows items={CONNECT} />
          </div>
        </div>

        <div className="mt-12 grid gap-x-14 gap-y-12 lg:grid-cols-2 lg:items-start">
          <div id="workspace">
            <h3 className="flare text-2xl font-[620] tracking-tight sm:text-3xl">Run a workspace</h3>
            <p className="mt-3 max-w-[52ch] text-base text-muted-foreground">
              For an organisation that wants its own contracts, not an account on someone else&apos;s ledger. Everything done inside a workspace is recorded under it, and BitRegalo cannot change it after it is launched.
            </p>
            <div className="mt-6">
              <Rows items={WORKSPACE} />
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" variant="secondary"><Link href="/app/workspaces">See workspaces<ArrowRight /></Link></Button>
            </div>
          </div>

          <div id="network">
            <h3 className="flare text-2xl font-[620] tracking-tight sm:text-3xl">Use the BitRegalo network</h3>
            <p className="mt-3 max-w-[52ch] text-base text-muted-foreground">
              BitRegalo&apos;s own public workspace, open to anyone with no organisation behind them. Its web app is the reference implementation, and the place to try every part of the protocol with practice tokens that have no value.
            </p>
            <div className="mt-6">
              <Rows items={NETWORK} />
            </div>
            <p className="mt-5 max-w-[60ch] text-base text-muted-foreground">
              Requests and listings meet in a marketplace you can browse by country.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" variant="secondary"><Link href="/app">Try the reference app<ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/app/market">Browse the marketplace</Link></Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
