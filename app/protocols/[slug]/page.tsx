import type { Metadata } from "next"
import { Fragment, type ReactNode } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DocPage, DocTable } from "@/components/site/doc-page"

/*
 * The three protocol references. Each one is the same document shape: a summary,
 * the lifecycle as a numbered sequence, who may call what, a worked example, the
 * guarantees, and the links to the other two.
 */

interface Row {
  label: string
  value: ReactNode
}

interface State {
  from: string
  who: string
  call: ReactNode
  to: string
}

interface ProtocolDef {
  title: string
  shortName: string
  /** One phrase that places the protocol among the three. */
  descriptor: string
  intro: string
  /** The record the escrow is opened from, where there is one. */
  originRows: Row[] | null
  escrowRows: Row[]
  states: State[]
  flow: { title: string; text: string }[]
  facts: { title: string; text: string }[]
}

const protocols: Record<string, ProtocolDef> = {
  escrow: {
    title: "Escrow Protocol",
    shortName: "Escrow",
    descriptor: "the core primitive",
    intro:
      "A term-bound, non-custodial escrow. The issuer (in the app, the buyer) can only release. The receiver (the supplier) can only cancel, which hands the payment back. When the term ends untouched, the escrow can only return to the issuer.",
    originRows: null,
    escrowRows: [
      { label: "Escrow", value: "#4821 · locked" },
      { label: "Issuer", value: <code>0x3d9f…8a2c</code> },
      { label: "Receiver", value: <code>0x7e4b…c3f1</code> },
      { label: "Opened", value: "2026-08-05 · 14:32 UTC" },
      { label: "Term ends", value: "2026-09-04 · 14:32 UTC" },
      { label: "Issuer can", value: <><code>release()</code> → settles to receiver</> },
      { label: "Receiver can", value: <><code>cancel()</code> → returns to issuer</> },
      { label: "On expiry", value: "returns to issuer; anyone can trigger it" },
    ],
    states: [
      { from: "Locked, within the term", who: "The issuer (buyer)", call: <code>release(id)</code>, to: "Released: settled to the receiver" },
      { from: "Locked, within the term", who: "The receiver (supplier)", call: <code>cancel(id)</code>, to: "Cancelled (handed back): returned to the issuer" },
      { from: "Locked, term ended", who: "Anyone", call: <code>expire(id)</code>, to: "Expired: returned to the issuer, the only place it can go" },
    ],
    flow: [
      { title: "Open", text: "The issuer opens an escrow, names the receiver, and sets the term." },
      { title: "Lock", text: "The escrow locks on-chain: visible to both parties, spendable by neither." },
      {
        title: "Two keys",
        text: "The issuer can only release it forward. The receiver can only cancel it back. Neither can pull it toward themselves.",
      },
      {
        title: "Settle",
        text: "Released, cancelled, or expired: every path ends with the escrow settled to the receiver or returned to the issuer.",
      },
    ],
    facts: [
      {
        title: "One term, set up front",
        text: "Every escrow has an opening time and an expiry. Between them, the rules cannot change.",
      },
      {
        title: "Asymmetric keys",
        text: "release() belongs to the issuer, cancel() to the receiver. There is no action that moves the escrow toward the caller.",
      },
      {
        title: "Expiry with one way out",
        text: "If nothing happens by the end of the term, the escrow can only return to the issuer. Anyone can trigger the return; no claims process, no intervention.",
      },
      {
        title: "Non-custodial",
        text: "The escrow lives in the smart contract. BitRegalo never takes custody, and no admin can move held funds: the platform can pause new escrows, but release, hand back and expiry always work.",
      },
    ],
  },
  rfp: {
    title: "Request for Proposal",
    shortName: "RFP",
    descriptor: "tendering, on-chain",
    intro:
      "You publish what you need. Providers respond with a time frame and a proposal amount. The proposal you accept becomes the escrow, committed before any work begins.",
    originRows: [
      { label: "Request", value: "#310 · scope + deadline published" },
      { label: "Proposal", value: "6-week time frame · accepted 2026-08-05" },
    ],
    escrowRows: [
      { label: "Escrow", value: "#4822 · opened from accepted proposal" },
      { label: "Issuer", value: "you (the requester)" },
      { label: "Receiver", value: "the accepted provider" },
      { label: "Term ends", value: "2026-09-16 · end of proposed time frame" },
      { label: "Delivered", value: <>you <code>release()</code> → settles to provider</> },
      { label: "Not delivered", value: "term expires → can only return to you" },
    ],
    states: [
      { from: "Locked, within the time frame", who: "You, the requester (buyer)", call: <code>release(id)</code>, to: "Released: settled to the provider" },
      { from: "Locked, within the time frame", who: "The provider (supplier)", call: <code>cancel(id)</code>, to: "Cancelled (handed back): returned to you" },
      { from: "Locked, time frame ended", who: "Anyone", call: <code>expire(id)</code>, to: "Expired: returned to you, the only place it can go" },
    ],
    flow: [
      { title: "Request", text: "You publish what you need: scope and deadline. In construction terms, the tender goes out." },
      { title: "Propose", text: "Providers respond with a time frame and a proposal amount, recorded on-chain." },
      {
        title: "Commit",
        text: "You accept one proposal. Its amount and time frame lock into an escrow, and the provider starts work knowing the commitment is real.",
      },
      {
        title: "Deliver & release",
        text: "Delivered within the time frame and to your satisfaction: you release. Not delivered: you simply don't, and after expiry the escrow can only return to you.",
      },
    ],
    facts: [
      {
        title: "Tendering, auditable",
        text: "Requests, proposals, and acceptance are recorded on-chain, so every bidder can verify the process was fair.",
      },
      {
        title: "The proposal becomes the escrow",
        text: "Acceptance is commitment: the proposed amount and time frame lock in before any work begins.",
      },
      {
        title: "A deadline with teeth",
        text: "Miss the time frame and there is nothing to chase: the escrow can only expire back to the requester.",
      },
      {
        title: "Built on the same escrow",
        text: "An RFP is the escrow protocol with a tendering step in front. Same rules, same keys, same guarantees.",
      },
    ],
  },
  rts: {
    title: "Request to Supply",
    shortName: "RTS",
    descriptor: "supply, on-chain",
    intro:
      "The supplier states the time frame and escrow amount up front. Your confirmation opens the escrow. Delivery earns the release, and an undelivered order simply expires back to you.",
    originRows: [
      { label: "Listing", value: "#77 · time frame + escrow amount stated up front" },
      { label: "Confirmed", value: "2026-08-05 · by the buyer" },
    ],
    escrowRows: [
      { label: "Escrow", value: "#4823 · opened on confirmation" },
      { label: "Issuer", value: "you (the buyer)" },
      { label: "Receiver", value: "the supplier" },
      { label: "Term ends", value: "2026-08-19 · end of listed time frame" },
      { label: "On delivery", value: <>you <code>release()</code> → settles to supplier</> },
      { label: "Not delivered", value: "term expires → can only return to you" },
    ],
    states: [
      { from: "Locked, within the time frame", who: "You, the buyer", call: <code>release(id)</code>, to: "Released: settled to the supplier" },
      { from: "Locked, within the time frame", who: "The supplier", call: <code>cancel(id)</code>, to: "Cancelled (handed back): returned to you" },
      { from: "Locked, time frame ended", who: "Anyone", call: <code>expire(id)</code>, to: "Expired: returned to you, the only place it can go" },
    ],
    flow: [
      { title: "List", text: "A supplier lists what they deliver, with the time frame and escrow amount stated up front." },
      {
        title: "Confirm",
        text: "You confirm the listing. The stated amount locks into escrow for the stated time frame: that confirmation is the order.",
      },
      { title: "Deliver", text: "The supplier ships knowing the escrow is committed and cannot be pulled back mid-way." },
      {
        title: "Release or return",
        text: "You release on delivery. If nothing arrives, the escrow expires and can only return to you. No refund process, no dispute queue.",
      },
    ],
    facts: [
      {
        title: "Terms stated up front",
        text: "Time frame and escrow amount are part of the listing itself. Nothing is renegotiated after you commit.",
      },
      {
        title: "Confirm to commit",
        text: "Confirming a listing opens the escrow. The supplier ships against a commitment they can verify on-chain.",
      },
      {
        title: "Release on delivery",
        text: "Refund policies become unnecessary: an undelivered order can only expire back to the buyer.",
      },
      {
        title: "Built on the same escrow",
        text: "An RTS is the escrow protocol with a supply listing in front. Same rules, same keys, same guarantees.",
      },
    ],
  },
}

const protocolOrder = ["escrow", "rfp", "rts"]

const SIGNATURES = `release(id)   // issuer only: settles the escrow to the receiver
cancel(id)    // receiver only: returns the escrow to the issuer
expire(id)    // anyone, once the term has ended: returns the escrow to the issuer`

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

export default async function ProtocolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const protocol = protocols[slug]
  if (!protocol) notFound()

  const noun = protocol.shortName === "Escrow" ? "escrow" : protocol.shortName
  const others = protocolOrder.filter((s) => s !== slug)

  return (
    <DocPage title={protocol.title} summary={protocol.intro}>
      <h2 id="how-it-flows">How it flows</h2>
      <ol>
        {protocol.flow.map((step) => (
          <li key={step.title}>
            <strong>{step.title}.</strong> {step.text}
          </li>
        ))}
      </ol>

      <h2 id="who-can-do-what">Who can do what</h2>
      <p>
        One escrow, two keys. Each key moves the escrow in one direction only, and the clock settles anything left
        untouched.
      </p>
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
          {protocol.states.map((s, i) => (
            <tr key={i}>
              <td>{s.from}</td>
              <td>{s.who}</td>
              <td className="whitespace-nowrap">{s.call}</td>
              <td>{s.to}</td>
            </tr>
          ))}
        </tbody>
      </DocTable>
      <pre>
        <code>{SIGNATURES}</code>
      </pre>

      <h2 id="the-transaction">The transaction</h2>
      <p>
        Every {noun} resolves to the same on-chain object: a term-bound escrow with one key on each side. This is
        what both parties see for the entire term. The figures below are an example.
      </p>
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
