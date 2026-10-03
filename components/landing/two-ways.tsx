import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

/*
 * Who BitRegalo is for, in two plain answers: a person on the BitRegalo network,
 * or an organisation in a workspace of its own. The organisation examples are
 * illustrations of what could be built; they name no one.
 */
const NETWORK = [
  { title: "Send a payment", text: "Pay someone or send a gift in USDT, with a reference and a receipt." },
  { title: "Hold a payment for someone", text: "Lock it in escrow until the work is done." },
  { title: "Ask for something", text: "Post a request. Suppliers send a price and you choose one." },
  { title: "Offer something", text: "List what you do or sell at a fixed price." },
]

const EXAMPLES = [
  {
    title: "An NGO platform that releases aid on delivery",
    text: "Donations wait in escrow and are released to the local supplier when the aid arrives. The platform accepts a local stablecoin, and donors can see every amount and when it moved.",
  },
  {
    title: "A construction marketplace that pays subcontractors through escrow",
    text: "Head contractors post a request for each package. Subcontractors answer with a price and a time, and the chosen offer is paid into escrow before work starts. The marketplace sets its own platform fee.",
  },
]

export function TwoWays() {
  return (
    <section id="two-ways" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <h2 className="t-headline">Two ways to use it</h2>
          <p className="t-lede mt-5">On your own, on the BitRegalo network. Or as an organisation, in a workspace of your own.</p>
        </div>

        <div className="mt-12 grid gap-x-14 gap-y-12 lg:grid-cols-2 lg:items-start">
          <div id="network">
            <h3 className="flare text-2xl font-[620] tracking-tight sm:text-3xl">The BitRegalo network</h3>
            <p className="mt-3 max-w-[52ch] text-base text-muted-foreground">For anyone, anywhere. Open the app and start: no organisation needed.</p>
            <dl className="mt-6 divide-y divide-border border-y border-border">
              {NETWORK.map((n) => (
                <div key={n.title} className="grid gap-x-6 gap-y-0.5 py-3.5 sm:grid-cols-[13rem_1fr]">
                  <dt className="text-base font-semibold">{n.title}</dt>
                  <dd className="text-base text-muted-foreground">{n.text}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 max-w-[60ch] text-base text-muted-foreground">
              Requests and listings meet in one marketplace you can browse by country. Between people, the everyday currency is USDT. On the practice network it is tUSD, which is free.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" variant="secondary"><Link href="/app">Open the app<ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/app/market">Browse the marketplace</Link></Button>
            </div>
          </div>

          <div id="organisations" className="rounded-2xl border border-border bg-card p-5 shadow-raised sm:p-8">
            <h3 className="flare text-2xl font-[620] tracking-tight sm:text-3xl">A workspace for your organisation</h3>
            <p className="mt-3 max-w-[60ch] text-base text-muted-foreground">
              Your own copy of the infrastructure: your own contracts, rules and fees, the currencies you accept (a local stablecoin, for example), and your own tokens, shop and treasury. Everything done inside it is recorded under your workspace, and you run it as its admin.
            </p>
            <p className="mt-6 text-base">For example:</p>
            <div className="mt-2 divide-y divide-border border-y border-border">
              {EXAMPLES.map((e) => (
                <div key={e.title} className="py-4">
                  <h4 className="t-subheading">{e.title}</h4>
                  <p className="mt-1 text-base text-muted-foreground">{e.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" variant="secondary"><Link href="/app/workspaces">See workspaces<ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="#contact">Talk to us</Link></Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
