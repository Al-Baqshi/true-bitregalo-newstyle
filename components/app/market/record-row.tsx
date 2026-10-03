"use client"
import { Fragment } from "react"
import type { Hex } from "viem"
import type { Offer, Rfp } from "@/lib/bitregalo/hooks"
import { decodeLabel } from "@/lib/bitregalo/instances"
import { categoryLabel, type Entry, type EntryKind } from "@/lib/bitregalo/market"
import { Addr, Amount, LedgerRow, Pill, timeLeft, type Tone } from "@/components/app/ui"
import type { LiveRecord, TokenMeta } from "./live"
import { SETTLES, firstLine, placeOf } from "./words"

const ZERO = /^0x0{40}$/

function days(s: bigint) {
  const n = Number(s)
  if (n < 86400) return `${Math.max(1, Math.round(n / 3600))} h`
  const d = Math.round((n / 86400) * 10) / 10
  return `${d} ${d === 1 ? "day" : "days"}`
}

/** A record's state in a word, from the chain. */
export function stateWord(kind: EntryKind, r: LiveRecord): { word: string; tone: Tone } {
  if (kind === "request") {
    const rfp = r as Rfp
    if (rfp.state === 1) return Number(rfp.deadline) > Date.now() / 1000 ? { word: "Open", tone: "accent" } : { word: "Choosing", tone: "accent" }
    if (rfp.state === 2) return { word: "Offer chosen", tone: "good" }
    return { word: "Withdrawn", tone: "muted" }
  }
  const o = r as Offer
  if (o.state === 1) return ZERO.test(o.designatedBuyer) ? { word: "Open", tone: "accent" } : { word: "For one buyer", tone: "accent" }
  if (o.state === 2) return { word: "Taken", tone: "good" }
  return { word: "Withdrawn", tone: "muted" }
}

/** The name a record goes by: its marketplace title, its public on-chain title, or (untitled) its number. */
export function recordTitle(kind: EntryKind, id: bigint | number, entry: Entry | null | undefined, live: LiveRecord | undefined) {
  if (entry?.title) return { title: entry.title, titled: true }
  if (kind === "request" && live) {
    const label = decodeLabel((live as Rfp).scopeHash as Hex)
    if (label) return { title: label, titled: true }
  }
  return { title: `${kind === "request" ? "Request" : "Listing"} #${String(id)}`, titled: false }
}

/**
 * One request or listing in a list. The marketplace entry (if any) gives the title, the first
 * line of the description, the category and the place; the chain gives the money and the state.
 * `who` adds the poster's address and, for a listing, who may take it. `mixed` is for lists that hold
 * both kinds: each row then says which it is, instead of showing its number.
 */
export function RecordRow({
  kind,
  id,
  href,
  entry,
  live,
  token,
  workspaceName,
  who = true,
  mixed = false,
}: {
  kind: EntryKind
  id: bigint | number
  href: string
  entry?: Entry | null
  live?: LiveRecord
  token?: TokenMeta
  /** Set for records from an organisation's workspace, shown alongside the place. */
  workspaceName?: string
  who?: boolean
  mixed?: boolean
}) {
  const rfp = kind === "request" ? (live as Rfp | undefined) : undefined
  const offer = kind === "listing" ? (live as Offer | undefined) : undefined
  const { title, titled } = recordTitle(kind, id, entry, live)
  const privateWording = kind === "request" && !entry && !!rfp && !titled
  const settlement = live?.settlement ?? entry?.settlement
  const paid = settlement !== undefined && settlement !== 0
  const desc = firstLine(entry?.description)
  const place = placeOf(entry)

  const parts: React.ReactNode[] = []
  if (mixed) parts.push(kind === "request" ? "Request" : "Listing")
  if (privateWording) parts.push("Wording kept private")
  if (entry) parts.push(categoryLabel(entry.category))
  if (place) parts.push(place)
  if (workspaceName) parts.push(<>in {workspaceName}</>)
  if (who && rfp) parts.push(<>Asked by <Addr a={rfp.requester} /></>)
  if (who && offer) parts.push(<>From <Addr a={offer.supplier} /></>)
  if (settlement !== undefined) parts.push(`${SETTLES[settlement] ?? ""}${paid && kind === "request" && token ? ` in ${token.symbol}` : ""}`)
  if (rfp && rfp.state === 1) parts.push(timeLeft(rfp.deadline) === "elapsed" ? "closed to new offers" : `offers close in ${timeLeft(rfp.deadline)}`)
  if (offer) parts.push(`delivered within ${days(offer.timeframe)}`)
  if (who && offer && offer.state === 1) parts.push(ZERO.test(offer.designatedBuyer) ? "open to anyone" : <>for <Addr a={offer.designatedBuyer} /></>)

  const amount = kind === "listing" && paid ? (offer?.amount ?? (entry ? BigInt(entry.amount || "0") : 0n)) : null
  const state = live ? stateWord(kind, live) : null

  return (
    <LedgerRow
      href={href}
      lead={titled && !mixed ? `#${String(id)}` : undefined}
      title={title}
      meta={
        <>
          {desc && <span className="mb-0.5 line-clamp-1 break-words">{desc}</span>}
          <span className="block">
            {/* The dot keeps to the word before it, so a wrapped line never starts with one. */}
            {parts.map((p, i) => <Fragment key={i}>{i > 0 && "\u00a0· "}{p}</Fragment>)}
          </span>
        </>
      }
      amount={amount !== null ? <Amount value={amount} decimals={token?.decimals ?? 18} symbol={token?.symbol} /> : undefined}
      status={state ? <Pill tone={state.tone}>{state.word}</Pill> : undefined}
    />
  )
}
