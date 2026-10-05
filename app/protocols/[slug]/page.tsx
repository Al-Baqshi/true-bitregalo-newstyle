import type { Metadata } from "next"
import { Fragment, type ReactNode } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DocPage, DocTable } from "@/components/site/doc-page"

/*
 * The three protocol references: escrow, requests and listings. Each one is the same
 * document shape: a summary, the flow as a numbered sequence, how it settles, who may
 * call what, a worked example, what makes it hold, and the links to the other two.
 *
 * The prose uses the product's words (buyer, supplier, released, handed back, returned).
 * The contract's own terms (issuer, receiver, cancel, expire, Rfp, Offer) appear only
 * where a call or a state is named, as reference. The full mapping is in the contracts
 * repository, docs/PROTOCOL.md, section 4.
 *
 * One thing never to write here: that a held payment goes back by itself. After the
 * deadline someone has to send the transaction that returns it, and anyone can.
 */

interface Row {
  label: string
  value: ReactNode
}

interface Action {
  from: string
  who: ReactNode
  call: ReactNode
  to: ReactNode
}

interface ProtocolDef {
  /** The product's word, as the landing page and the footer name it. */
  title: string
  /** One phrase that places the protocol among the three. */
  descriptor: string
  intro: string
  /** The contract's own names for the same things. */
  reference: ReactNode
  flow: { title: string; text: string }[]
  /** The record's own calls, before any payment is held. Escrow has none. */
  actions: Action[] | null
  /** What the worked example shows. */
  exampleNote: string
  /** The record the escrow is opened from, where there is one. */
  originRows: Row[] | null
  escrowRows: Row[]
  facts: { title: string; text: string }[]
}

const protocols: Record<string, ProtocolDef> = {
  escrow: {
    title: "Escrow protocol",
    descriptor: "how a held payment works, and the only three things that can happen to it",
    intro:
      "A payment held by a public contract until a deadline, with its outcomes fixed in advance. The buyer can only release it to the supplier. The supplier can only hand it back to the buyer. After the deadline it can only be returned to the buyer, and anyone can trigger that.",
    reference: (
      <>
        In the contracts the buyer is the <code>issuer</code>, the supplier is the <code>receiver</code>, and the three
        outcomes are <code>release</code>, <code>cancel</code> and <code>expire</code> on the workspace&apos;s{" "}
        <code>EscrowVault</code>. The states are <code>Active</code>, <code>Released</code>, <code>Cancelled</code> and{" "}
        <code>Expired</code>.
      </>
    ),
    flow: [
      {
        title: "Open",
        text: "An escrow opens when a buyer awards an offer on a request, or takes a listing, that is set to hold the payment. The buyer, the supplier, the amount and the deadline are fixed at that moment.",
      },
      {
        title: "Hold",
        text: "In the same transaction the buyer's payment moves into the workspace's vault. Both sides can see it there. Neither can spend it.",
      },
      {
        title: "One action each",
        text: "The buyer can only release it to the supplier. The supplier can only hand it back to the buyer. Neither can move it toward themselves.",
      },
      {
        title: "Settle",
        text: "Before the deadline, the buyer releases or the supplier hands back. After the deadline neither can act, and anyone can trigger the return to the buyer. Every path ends with the payment with the supplier or back with the buyer.",
      },
    ],
    actions: null,
    exampleNote: "What both sides see for as long as the payment is held. The figures are an example.",
    originRows: null,
    escrowRows: [
      { label: "Escrow", value: <>#4821 · held (<code>Active</code>)</> },
      { label: "Buyer (issuer)", value: <code>0x3d9f…8a2c</code> },
      { label: "Supplier (receiver)", value: <code>0x7e4b…c3f1</code> },
      { label: "Opened", value: "2026-08-05 · 14:32 UTC" },
      { label: "Deadline", value: "2026-09-04 · 14:32 UTC" },
      { label: "Buyer can", value: <><code>release()</code> → paid to the supplier</> },
      { label: "Supplier can", value: <><code>cancel()</code> → handed back to the buyer</> },
      { label: "After the deadline", value: <>anyone can call <code>expire()</code> → returned to the buyer</> },
    ],
    facts: [
      {
        title: "A deadline set up front",
        text: "Every escrow has an opening time and a deadline. Between them the rules cannot change, and nobody can extend or shorten the term.",
      },
      {
        title: "Each side can only give",
        text: "Release belongs to the buyer and hand-back to the supplier. No action moves a held payment toward the wallet that calls it.",
      },
      {
        title: "After the deadline, one way out",
        text: "Once the deadline passes, the payment can only go back to the buyer. Someone has to send the transaction that returns it, and anyone can: the buyer, the supplier or a third party. Until someone does, it stays in the vault.",
      },
      {
        title: "Nobody else can move it",
        text: "The payment sits in the workspace's vault, a public contract. BitRegalo never holds it, and neither BitRegalo nor the workspace admin can move it. They can pause new escrows. A release, a hand-back and a return always work.",
      },
      {
        title: "A limit to know",
        text: "If the buyer does not release and the supplier does not hand back, the payment goes back to the buyer once the return is triggered. A supplier who has already delivered depends on the buyer releasing. A commitment that pays the supplier after a set time unless the buyer objects is planned, not built.",
      },
    ],
  },
  rfp: {
    title: "Requests protocol",
    descriptor: "a buyer asks, suppliers answer with a price and a time, and one offer is chosen",
    intro:
      "A buyer posts what they need. Suppliers answer with a price and a time, and the buyer chooses one offer. The request, every offer and the choice are permanent records, and the chosen offer settles the way the request said it would: recorded only, paid directly, or held in escrow.",
    reference: (
      <>
        The contracts call a request an <code>Rfp</code> (request for proposal), an offer a <code>Bid</code>, and the
        buyer&apos;s choice an award (<code>acceptBid</code>). The buyer is the <code>requester</code> and the supplier
        the <code>provider</code>. A request is <code>Open</code>, then <code>Awarded</code> or <code>Cancelled</code>.
      </>
    ),
    flow: [
      {
        title: "Post",
        text: "The buyer posts a request: a reference to what is needed, the time until which offers are accepted, the token it will be paid in, and how it settles.",
      },
      {
        title: "Offer",
        text: "Suppliers answer with a price and a time to deliver. An offer cannot be edited once it is made. Its supplier can only withdraw it, and only while the request is open.",
      },
      {
        title: "Award",
        text: "The buyer chooses one offer. The choice is recorded and no other offer can be chosen afterwards. In the same transaction the offer settles the way the request stated: nothing is paid, the supplier is paid directly, or the payment is held in escrow for the time the supplier offered.",
      },
      {
        title: "Deliver",
        text: "When the payment is held, the buyer releases it on delivery. A supplier who cannot deliver hands it back. If neither acts before the deadline, anyone can trigger the return to the buyer.",
      },
    ],
    actions: [
      { from: "Any time", who: "A buyer", call: <code>postRfp(…)</code>, to: <>A request is recorded as <code>Open</code></> },
      { from: "Open, while offers are accepted", who: "A supplier", call: <code>bid(rfpId, amount, timeframe)</code>, to: "An offer is recorded" },
      { from: "Open", who: "The supplier who made the offer", call: <code>withdrawBid(rfpId, bidId)</code>, to: "The offer is marked withdrawn. It stays on the record." },
      { from: "Open", who: "The buyer", call: <code>acceptBid(rfpId, bidId)</code>, to: <><code>Awarded</code>: the choice is recorded and the offer settles</> },
      { from: "Open", who: "The buyer", call: <code>cancelRfp(rfpId)</code>, to: <><code>Cancelled</code>: no offer can be chosen</> },
    ],
    exampleNote: "A request that settles by escrow, from the award to the held payment. The figures are an example.",
    originRows: [
      { label: "Request", value: "#310 · offers accepted until 2026-08-01 · settles by escrow" },
      { label: "Chosen offer", value: "12,500 USDT · delivered in 6 weeks · awarded 2026-08-05" },
    ],
    escrowRows: [
      { label: "Escrow", value: "#4822 · opened by the award" },
      { label: "Buyer (issuer)", value: "the buyer who posted the request" },
      { label: "Supplier (receiver)", value: "the supplier whose offer was chosen" },
      { label: "Deadline", value: "2026-09-16 · six weeks after the award" },
      { label: "Delivered", value: <>the buyer calls <code>release()</code> → paid to the supplier</> },
      { label: "Not delivered", value: <>after the deadline anyone can call <code>expire()</code> → returned to the buyer</> },
    ],
    facts: [
      {
        title: "A tender anyone can check",
        text: "The request, every offer and the award are records. A supplier who was not chosen can check that nothing was rearranged afterwards.",
      },
      {
        title: "Offers cannot be edited",
        text: "An offer stays as it was made. Its supplier can withdraw it and never change it, so the buyer awards exactly the terms they read.",
      },
      {
        title: "Wording can stay private",
        text: "The record holds a fingerprint of the request's text, not the text itself. The wording can stay private, and its owner can still prove later what it said.",
      },
      {
        title: "The same escrow underneath",
        text: "A request that holds the payment uses the escrow protocol unchanged: the same three outcomes and the same limits on who can act.",
      },
    ],
  },
  rts: {
    title: "Listings protocol",
    descriptor: "a supplier offers something at a fixed price, and a buyer takes it as it stands",
    intro:
      "A supplier lists what they offer at a fixed price and a time to deliver, open to anyone or to one named buyer. A buyer takes it as it stands. The listing and its taking are permanent records, and it settles the way the listing said it would: recorded only, paid directly, or held in escrow.",
    reference: (
      <>
        The contracts call a listing an <code>Offer</code> and this flow request to supply (RTS). Taking a listing is{" "}
        <code>confirmOffer</code>. A listing is <code>Listed</code>, then <code>Confirmed</code> or{" "}
        <code>Withdrawn</code>.
      </>
    ),
    flow: [
      {
        title: "List",
        text: "The supplier lists a price, a time to deliver, the token, and how it settles. A listing can be open to any buyer or made for one named buyer.",
      },
      {
        title: "Take",
        text: "A buyer takes the listing as it stands. Its terms cannot be changed after it is listed, so there is nothing to renegotiate.",
      },
      {
        title: "Settle",
        text: "In the same transaction it settles the way the listing stated: nothing is paid, the supplier is paid directly, or the payment is held in escrow for the listed time.",
      },
      {
        title: "Deliver",
        text: "When the payment is held, the buyer releases it on delivery. A supplier who cannot deliver hands it back. If neither acts before the deadline, anyone can trigger the return to the buyer.",
      },
    ],
    actions: [
      { from: "Any time", who: "A supplier", call: <code>listOffer(…)</code>, to: <>A listing is recorded as <code>Listed</code></> },
      { from: "Listed", who: "The supplier", call: <code>withdrawOffer(offerId)</code>, to: <><code>Withdrawn</code>: it can no longer be taken</> },
      { from: "Listed", who: "A buyer, or the named buyer if there is one", call: <code>confirmOffer(offerId)</code>, to: <><code>Confirmed</code>: the buyer is recorded and the listing settles</> },
    ],
    exampleNote: "A listing that settles by escrow, from the moment it is taken to the held payment. The figures are an example.",
    originRows: [
      { label: "Listing", value: "#77 · 1,200 USDT · delivered in 14 days · settles by escrow" },
      { label: "Taken", value: "2026-08-05 · by the buyer" },
    ],
    escrowRows: [
      { label: "Escrow", value: "#4823 · opened when the listing was taken" },
      { label: "Buyer (issuer)", value: "the buyer who took the listing" },
      { label: "Supplier (receiver)", value: "the supplier who listed it" },
      { label: "Deadline", value: "2026-08-19 · 14 days after it was taken" },
      { label: "On delivery", value: <>the buyer calls <code>release()</code> → paid to the supplier</> },
      { label: "Not delivered", value: <>after the deadline anyone can call <code>expire()</code> → returned to the buyer</> },
    ],
    facts: [
      {
        title: "Terms fixed up front",
        text: "The price and the time to deliver are part of the listing. Nothing can be changed after it is listed, and nothing is renegotiated when it is taken.",
      },
      {
        title: "Taking it is the order",
        text: "Taking a listing records the buyer and settles it in one transaction. With escrow, the supplier can check the payment is held before starting.",
      },
      {
        title: "A way back that needs nobody's approval",
        text: "If a held order is not delivered, the supplier can hand the payment back, and after the deadline anyone can trigger its return to the buyer. No refund request has to be approved by the supplier or by a platform.",
      },
      {
        title: "The same escrow underneath",
        text: "A listing that holds the payment uses the escrow protocol unchanged: the same three outcomes and the same limits on who can act.",
      },
    ],
  },
}

const protocolOrder = ["escrow", "rfp", "rts"]

/* The three ways a request or a listing settles, the same on the landing page and in the whitepaper. */
const SETTLEMENT: { way: string; code: string; text: string }[] = [
  { way: "Recorded only", code: "Settlement.None", text: "Nothing is paid. The choice itself is the record." },
  { way: "Paid directly", code: "Settlement.Direct", text: "The payment passes through the vault to the supplier in the same transaction." },
  { way: "Held", code: "Settlement.Escrow", text: "The payment becomes an escrow. The supplier's time to deliver becomes its deadline." },
]

/* The only calls that move a held payment. The same for every escrow, however it was opened. */
const HELD: Action[] = [
  { from: "Active, before the deadline", who: <>The buyer (<code>issuer</code>)</>, call: <code>release(id)</code>, to: <>Released: paid to the supplier, less the platform fee</> },
  { from: "Active, before the deadline", who: <>The supplier (<code>receiver</code>)</>, call: <code>cancel(id)</code>, to: <>Handed back (<code>Cancelled</code>): the held amount goes to the buyer</> },
  { from: "Active, after the deadline", who: "Anyone", call: <code>expire(id)</code>, to: <>Returned (<code>Expired</code>): the held amount goes to the buyer, the only place it can go</> },
]

const SIGNATURES = `release(id)   // the buyer (issuer) only, before the deadline: pays the supplier (receiver)
cancel(id)    // the supplier (receiver) only, before the deadline: hands the payment back to the buyer
expire(id)    // anyone, after the deadline: returns the payment to the buyer`

export async function generateStaticParams() {
  return protocolOrder.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const protocol = protocols[slug]
  if (!protocol) return { title: "Protocol not found" }
  return { title: protocol.title, description: protocol.intro }
}

function Rows({ rows }: { rows: Row[] }) {
  return (
    <>
      {rows.map((row) => (
        <tr key={row.label}>
          <th scope="row" className="whitespace-nowrap pr-6 font-[560] text-muted-foreground">
            {row.label}
          </th>
          <td>{row.value}</td>
        </tr>
      ))}
    </>
  )
}

function ActionTable({ actions }: { actions: Action[] }) {
  return (
    <DocTable minWidth="40rem">
      <thead>
        <tr>
          <th scope="col">State</th>
          <th scope="col">Who may act</th>
          <th scope="col">Call</th>
          <th scope="col">What happens next</th>
        </tr>
      </thead>
      <tbody>
        {actions.map((a, i) => (
          <tr key={i}>
            <td>{a.from}</td>
            <td>{a.who}</td>
            <td className="whitespace-nowrap">{a.call}</td>
            <td>{a.to}</td>
          </tr>
        ))}
      </tbody>
    </DocTable>
  )
}

export default async function ProtocolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const protocol = protocols[slug]
  if (!protocol) notFound()

  const others = protocolOrder.filter((s) => s !== slug)

  return (
    <DocPage
      title={protocol.title}
      summary={protocol.intro}
      meta="Technical reference. Today the contracts run on BNB Smart Chain Testnet, a public test network, and have not been independently audited."
    >
      <h2 id="how-it-flows">How it flows</h2>
      <ol>
        {protocol.flow.map((step) => (
          <li key={step.title}>
            <strong>{step.title}.</strong> {step.text}
          </li>
        ))}
      </ol>

      {protocol.actions && (
        <>
          <h2 id="how-it-settles">How it settles</h2>
          <p>
            Each request or listing states how it settles when it is accepted. A workspace can switch direct payment
            or escrow off. Recording only is always available.
          </p>
          <DocTable minWidth="34rem">
            <thead>
              <tr>
                <th scope="col">Way</th>
                <th scope="col">In the contracts</th>
                <th scope="col">What happens</th>
              </tr>
            </thead>
            <tbody>
              {SETTLEMENT.map((s) => (
                <tr key={s.code}>
                  <td className="whitespace-nowrap">{s.way}</td>
                  <td className="whitespace-nowrap">
                    <code>{s.code}</code>
                  </td>
                  <td>{s.text}</td>
                </tr>
              ))}
            </tbody>
          </DocTable>
        </>
      )}

      <h2 id="who-can-do-what">Who can do what</h2>
      {protocol.actions && (
        <>
          <p>Every call below writes a record. None of them can be undone or edited afterwards.</p>
          <ActionTable actions={protocol.actions} />
          <h3>When the payment is held</h3>
        </>
      )}
      <p>
        One held payment, one action on each side. Each action moves the payment in one direction only. After the
        deadline the only action left is the return to the buyer. It does not happen by itself: someone has to send
        that transaction, and anyone can.
      </p>
      <ActionTable actions={HELD} />
      <pre>
        <code>{SIGNATURES}</code>
      </pre>

      <h2 id="an-example">An example</h2>
      <p>{protocol.exampleNote}</p>
      <DocTable>
        {protocol.originRows && (
          <tbody>
            <Rows rows={protocol.originRows} />
            <tr>
              <th scope="colgroup" colSpan={2} className="pt-5 text-foreground">
                Becomes the escrow
              </th>
            </tr>
          </tbody>
        )}
        <tbody>
          <Rows rows={protocol.escrowRows} />
        </tbody>
      </DocTable>

      <h2 id="what-makes-it-hold">What makes it hold</h2>
      {protocol.facts.map((fact) => (
        <Fragment key={fact.title}>
          <h3>{fact.title}</h3>
          <p>{fact.text}</p>
        </Fragment>
      ))}

      <h2 id="in-the-contracts">In the contracts</h2>
      <p>{protocol.reference}</p>
      <p>
        A developer gets the contract addresses, the interface files and code examples for these calls from the{" "}
        <Link href="/app/connect">Connect a platform</Link> page. The <Link href="/whitepaper">whitepaper</Link> sets
        out the rules that hold across all three.
      </p>

      <h2 id="other-protocols">Other protocols</h2>
      <ul>
        {others.map((s) => (
          <li key={s}>
            <Link href={`/protocols/${s}`}>{protocols[s].title}</Link>: {protocols[s].descriptor}.
          </li>
        ))}
      </ul>
      <p>
        Questions about any of them? <Link href="/contact">Contact us</Link>.
      </p>
    </DocPage>
  )
}
