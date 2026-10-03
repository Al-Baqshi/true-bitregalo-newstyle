import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowDown, ArrowRight } from "lucide-react"

/*
 * The four building blocks, drawn the way they fit together rather than as four
 * equal tiles: a request or a listing decides who does the work and for how much,
 * an escrow holds the money until it is done, and a workspace (the dashed boundary)
 * holds all of it for one organisation. The BitRegalo network is BitRegalo's own
 * workspace, open to everyone.
 */
const HOLDS = ["Its own contracts", "Rules and fees", "Currencies it accepts, such as a local stablecoin", "Tokens", "Shop", "Treasury"]

const OUTCOMES = [
  { name: "Release", text: "the buyer pays the supplier." },
  { name: "Hand back", text: "the supplier returns it to the buyer." },
  { name: "Deadline passes", text: "it can only go back to the buyer." },
]

function Block({ name, aside, used, children, className = "" }: { name: string; aside?: string; used: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 sm:p-6 ${className}`}>
      <h3 className="t-heading">
        {name}
        {aside && <span className="font-[450] text-muted-foreground"> {aside}</span>}
      </h3>
      <div className="mt-2 text-base text-muted-foreground">{children}</div>
      <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
        <span className="font-[560] text-foreground">Used by </span>
        {used}
      </p>
    </div>
  )
}

/** A link between two blocks on a wide screen, with what moves the work along it. */
function Joint({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`hidden flex-col justify-center gap-1.5 lg:flex ${className}`} aria-hidden>
      <span className="flex items-center text-subtle">
        <span className="h-px flex-1 bg-border-strong" />
        <ArrowRight className="-ml-2 size-4" />
      </span>
      <span className="text-center text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

export function BuildingBlocks() {
  return (
    <section id="building-blocks" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <h2 className="t-headline">Four building blocks, one set of public contracts</h2>
          <p className="t-lede mt-5">
            Each does one job, and they fit together. A request or a listing settles who does the work and for how much. An escrow holds the money until it is done. A workspace holds all of it for one organisation.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-dashed border-border-strong p-3 sm:p-6 lg:p-8">
          <div className="px-2 pt-2 sm:px-0 sm:pt-0">
            <h3 className="flare text-2xl font-[620] tracking-tight">Workspace</h3>
            <p className="mt-2 max-w-[68ch] text-base text-muted-foreground">
              An organisation&apos;s own copy of the infrastructure. Everything done inside it is recorded under it. Used by organisations that run a platform, a programme or a supply chain.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="What a workspace has of its own">
              {HOLDS.map((h) => (
                <li key={h} className="rounded-md border border-border bg-card px-2.5 py-1 text-sm font-[520]">{h}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6 grid gap-3 sm:gap-4 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)] lg:grid-rows-2 lg:gap-x-0">
            <Block name="Requests" aside="(RFP)" used="buyers who want to compare prices, from a household job to a building package." className="lg:col-start-1 lg:row-start-1">
              <p>&ldquo;I need this.&rdquo; Suppliers answer with a price and a time, and the buyer chooses one offer.</p>
            </Block>
            <Joint label="Offer chosen" className="lg:col-start-2 lg:row-start-1 lg:px-3" />
            <Block name="Listings" aside="(RTS)" used="suppliers who sell a set job or product." className="lg:col-start-1 lg:row-start-2">
              <p>&ldquo;I offer this.&rdquo; A fixed price and delivery time, open to anyone or to one named buyer.</p>
            </Block>
            <Joint label="Listing taken" className="lg:col-start-2 lg:row-start-2 lg:px-3" />

            <div className="flex items-center justify-center gap-2 py-1 text-sm text-muted-foreground lg:hidden" aria-hidden>
              <ArrowDown className="size-4 text-subtle" />Either can settle through
            </div>

            <Block name="Escrow" used="anyone paying for work before it is delivered, including one person holding money for another." className="lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:flex lg:flex-col">
              <p>Holds the money until the work is done. Then only three things can happen to it:</p>
              <dl className="mt-3 space-y-1.5">
                {OUTCOMES.map((o) => (
                  <div key={o.name} className="text-base">
                    <dt className="inline font-[560] text-foreground">{o.name}: </dt>
                    <dd className="inline">{o.text}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-sm">A request or a listing can also be paid straight away, or just recorded with no money moving.</p>
            </Block>
          </div>

          <p className="mt-6 px-2 pb-1 text-base text-muted-foreground sm:px-0 lg:mt-8">
            <span className="font-[560] text-foreground">The BitRegalo network</span> is BitRegalo&apos;s own workspace, open to everyone.{" "}
            <Link href="#organisations" className="text-gold underline decoration-1 underline-offset-4 hover:decoration-2">An organisation can run its own.</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
