"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAccount, useSignMessage } from "wagmi"
import { toast } from "sonner"
import { isAddress, parseUnits, zeroAddress, type Address } from "viem"
import { abis, short } from "@/lib/bitregalo/config"
import { eventArgs, useProjects, useSettlementTokens } from "@/lib/bitregalo/instances"
import { useInstanceRules } from "@/lib/bitregalo/instance-rules"
import { useTenant } from "@/lib/bitregalo/tenant"
import { COUNTRY_CODES, LIMITS, categoryLabel, charCount, countryName, guessCountry, putEntry, useMarketAvailable } from "@/lib/bitregalo/market"
import { MoreDetailsFields, TitleField, detailsProblem, emptyDetails, toInput, type Details } from "@/components/app/market/details-form"
import { ShareLink } from "@/components/app/market/share-link"
import { useTokenMeta } from "@/components/app/market/live"
import { marketErrorText, placeOf } from "@/components/app/market/words"
import { Wizard, type WizardAction, type WizardStep } from "./wizard"
import { Choice, Done, Label, Note, input } from "./fields"
import { Addr, Amount, Card, Fact, Facts, Notice, PageHead } from "@/components/app/ui"
import { ConnectButton } from "@/components/app/connect-button"
import { Button } from "@/components/ui/button"

type Pay = "0" | "1" | "2"

const PAY_NAME: Record<Pay, string> = { "2": "Escrow", "1": "Direct payment", "0": "Record only" }

/**
 * A buyer who wants to hold a payment for someone sends the supplier a link to this wizard:
 * `listings/new?for=<buyer>&supplier=<supplier>&token=<token>&amount=<decimal>&days=<n>&escrow=1&title=<text>&country=<CC>`.
 * The supplier lists the job for that buyer only; the buyer then funds the escrow by taking it.
 * `supplier` (optional) is the wallet the buyer meant the link for.
 */
type Prefill = { buyer: string; supplier: string; token: string; amount: string; days: string; escrow: boolean; title: string; country: string }
function readPrefill(sp: URLSearchParams): Prefill | null {
  const buyer = (sp.get("for") ?? "").trim()
  if (!buyer) return null
  const amount = (sp.get("amount") ?? "").trim()
  const days = (sp.get("days") ?? "").trim()
  const country = (sp.get("country") ?? "").trim().toUpperCase()
  return {
    buyer,
    supplier: (sp.get("supplier") ?? "").trim(),
    token: (sp.get("token") ?? "").trim(),
    amount: /^\d+(\.\d+)?$/.test(amount) ? amount : "",
    days: /^\d+(\.\d+)?$/.test(days) ? days : "",
    escrow: sp.get("escrow") === "1",
    title: (sp.get("title") ?? "").slice(0, LIMITS.title * 2),
    country: COUNTRY_CODES.includes(country) ? country : "",
  }
}

export function OfferWizard() {
  const t = useTenant()
  const base = t.base
  const sp = useSearchParams()
  const [pre] = useState(() => readPrefill(new URLSearchParams(sp.toString())))
  const [started, setStarted] = useState(!pre)
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const rules = useInstanceRules(t.instance)
  const tokens = useSettlementTokens(t.instance, t.id)
  const projects = useProjects(t.instance)
  const available = useMarketAvailable()
  const [settle, setSettle] = useState<Pay>("2")
  const [token, setToken] = useState(pre?.token ?? "")
  const [price, setPrice] = useState(pre?.amount ?? "")
  const [days, setDays] = useState(pre?.days || "7")
  const [who, setWho] = useState<"open" | "one">(pre ? "one" : "open")
  const [buyer, setBuyer] = useState(pre?.buyer ?? "")
  const [project, setProject] = useState("0")
  const [d, setD] = useState<Details>(() => emptyDetails({ title: pre?.title ?? "", country: pre?.country ?? "" }))
  const set = (patch: Partial<Details>) => setD((x) => ({ ...x, ...patch }))
  useEffect(() => {
    const g = guessCountry()
    if (g) setD((x) => (x.country ? x : { ...x, country: g }))
  }, [])
  const paid = settle !== "0"
  const chosen = tokens.accepted.find((x) => x.address.toLowerCase() === token.toLowerCase()) ?? tokens.accepted[0]
  const termDays = Number(days)
  const termOk = settle !== "2" || (termDays * 86400 >= rules.minTerm && termDays * 86400 <= rules.maxTerm)
  const dayWord = termDays === 1 ? "day" : "days"

  // Details go to the marketplace when it is connected and a country is chosen (required on the network).
  const countryRequired = t.isPublic
  const publish = available && d.country !== ""
  const chars = charCount(d.title.trim())
  const whatValid: true | string =
    chars < LIMITS.titleMin ? `Add a title of at least ${LIMITS.titleMin} characters`
    : chars > LIMITS.title ? `Titles are at most ${LIMITS.title} characters`
    : countryRequired && !d.country ? "Choose a country"
    : publish ? detailsProblem(d) ?? true
    : true

  const steps: WizardStep[] = [
    ...(available ? [{
      id: "what", title: "What and where", caption: "What you offer and where. This is what buyers see in the marketplace.",
      valid: whatValid,
      content: (
        <div className="grid gap-5">
          <TitleField value={d.title} onChange={(title) => set({ title })} autoFocus={!pre} placeholder="Kitchen fit-out, 3 days" hint="A few plain words that say what you offer." />
          <MoreDetailsFields
            value={d} set={set} countryRequired={countryRequired}
            descriptionHint="Shown in the marketplace under the title. The first line shows in lists."
            countryHint={countryRequired ? "Where you work or deliver. People browse the marketplace by country." : "Leave it empty to keep this listing out of the marketplace. Its title and description are then not published."}
          />
        </div>
      ),
    } satisfies WizardStep] : []),
    {
      id: "price", title: "Price and payment", caption: "What you charge, and how the buyer pays when they take the listing.",
      valid: (settle === "2" && !rules.escrow) || (settle === "1" && !rules.direct) ? "That payment option is off in this workspace" : paid && !chosen ? "This workspace accepts no currency yet" : paid && !(Number(price) > 0) ? "Set a price" : true,
      content: (
        <div className="grid gap-5">
          <Choice<Pay>
            value={settle} onChange={setSettle}
            options={[
              { value: "2", title: "Hold it safely (escrow)", description: "The buyer's payment is locked in the workspace vault when they take the listing. They release it to you on delivery.", disabled: rules.loaded && !rules.escrow ? "Off in this workspace" : undefined },
              { value: "1", title: "Pay straight away (direct payment)", description: "You are paid the moment a buyer takes the listing.", disabled: rules.loaded && !rules.direct ? "Off in this workspace" : undefined },
              { value: "0", title: "Just record it", description: "A recorded commitment to supply. Nothing is paid on the blockchain." },
            ]}
          />
          {paid && chosen && (
            <div className="grid gap-4">
              <Label title="Price" hint="What the buyer pays you.">
                <input className={input} type="number" inputMode="decimal" min="0" step="any" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="250" />
              </Label>
              <Label title="Currency">
                <select className={input} value={chosen.address} onChange={(e) => setToken(e.target.value)}>
                  {tokens.accepted.map((x) => <option key={x.address} value={x.address}>{x.symbol}</option>)}
                </select>
              </Label>
              <div>
                <Note>
                  The buyer pays this price{chosen.serviceFee > 0n ? <> plus a service fee of <Amount value={chosen.serviceFee} decimals={chosen.decimals} symbol={chosen.symbol} /></> : null}. The platform fee of {rules.feeBps / 100}% is taken from what you receive.
                </Note>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "delivery", title: "Delivery and buyer",
      valid: !(termDays > 0) ? "Set a delivery time" : !termOk ? `Escrows in this workspace run from ${Math.round(rules.minTerm / 3600)} h to ${Math.round(rules.maxTerm / 86400)} days` : who === "one" && !isAddress(buyer) ? "Enter the buyer's wallet address" : true,
      content: (
        <div className="grid gap-5">
          <Label
            title="You deliver within (days)"
            hint={settle === "2" ? "This is also how long the payment is held. If the buyer has not released it by then, it can only go back to them." : "How long you need once a buyer takes the listing."}
          >
            <input className={`${input} max-w-40`} type="number" inputMode="decimal" min="0.05" step="any" value={days} onChange={(e) => setDays(e.target.value)} />
          </Label>
          <Choice<"open" | "one">
            value={who} onChange={setWho}
            options={[
              { value: "open", title: "Anyone can take it", description: "A public listing." },
              { value: "one", title: "One named buyer", description: "Only that wallet address can take it." },
            ]}
          />
          {who === "one" && (
            <Label title="Buyer's wallet address" hint="Starts with 0x. Ask your buyer for it.">
              <input className={`${input} t-mono`} value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="0x…" autoComplete="off" spellCheck={false} />
            </Label>
          )}
          <Label title="Project (optional)" hint="Groups this listing with related work.">
            <select className={input} value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="0">No project</option>
              {projects.list.filter((p) => p.active).map((p) => <option key={String(p.id)} value={String(p.id)}>#{String(p.id)} · {p.label ?? "private project"}</option>)}
            </select>
          </Label>
          <Note>
            {publish
              ? "The blockchain stores only the price, the delivery time and the currency. Your title and description are kept in the marketplace, signed by your wallet."
              : "A listing stores no description on the blockchain, only the price, the delivery time and the currency. Tell buyers what you are selling yourself, and send them the listing link."}
          </Note>
        </div>
      ),
    },
  ]

  const plan: WizardAction[] = [{
    id: "list", label: paid && chosen ? `List at ${price || "…"} ${chosen.symbol}` : "Publish the listing (record only)", detail: `Delivery within ${days} ${dayWord} · ${who === "one" ? "one named buyer" : "open to anyone"}`,
    run: async ({ tx, results }) => {
      const r = await tx("List offer", {
        address: t.instance, abi: abis.instance, functionName: "listOffer",
        args: [paid ? (chosen!.address as Address) : zeroAddress, paid ? parseUnits(price, chosen!.decimals) : 0n, BigInt(Math.round(termDays * 86400)), BigInt(project), Number(settle), who === "one" ? buyer : zeroAddress],
      })
      results.offerId = eventArgs<{ offerId: bigint }>(r, abis.instance, "OfferListed").offerId
    },
  }]
  if (publish) {
    plan.push({
      id: "details", kind: "message", label: "Publish the details", detail: "Your wallet signs a message, no fee. The title, description, category and place go to the marketplace.",
      run: async ({ results }) => {
        const offerId = results.offerId as bigint
        const id = toast.loading("Publish the details: sign the message in your wallet…")
        try {
          if (!address) throw new Error("connect your wallet first")
          await putEntry({ workspace: t.id, kind: "listing", recordId: offerId }, toInput(d), address, signMessageAsync)
          toast.success("Details published", { id })
          results.published = true
        } catch (e) {
          const why = marketErrorText(e)
          toast.error("The details were not saved", { id, description: why })
          throw new Error(`${why}. Listing #${String(offerId)} itself is published; you can also add the details later from its page`)
        }
      },
    })
  }

  const listing =
    !available ? "The marketplace index is unavailable, so the listing will show as “Listing #…” only. Add the details later from its page."
    : publish ? (who === "one" ? "Details published once you sign; only the named buyer can take it" : "Listed once you sign the message")
    : "Not listed: no country chosen"

  const known = pre?.token ? tokens.all.find((x) => x.address.toLowerCase() === pre.token.toLowerCase() && x.symbol !== "…") : undefined
  if (pre && !started) return <JobIntro pre={pre} knownSymbol={known?.symbol} tokenAccepted={!pre.token || tokens.accepted.length === 0 || tokens.accepted.some((x) => x.address.toLowerCase() === pre.token.toLowerCase())} feeBps={rules.feeBps} onStart={() => setStarted(true)} />

  return (
    <Wizard
      title={pre ? "List the job for your buyer" : "Create a listing"}
      intro={pre
        ? "Check what the buyer asked for and change anything you need to, then sign. Only they can take this listing; when they do, their payment is held in escrow until they release it to you."
        : "The other direction from a request: you say what you charge and how fast you deliver, and a buyer takes it. The payment settles the way you choose."}
      steps={steps}
      signLabel={pre ? "List the job" : "Publish listing"}
      plan={plan}
      summary={[
        ...(available ? [{ label: "Title", value: d.title.trim() || "—" }] : []),
        ...(publish ? [
          { label: "Category", value: d.category ? categoryLabel(d.category) : "—" },
          { label: "Where", value: placeOf(d) || "—" },
        ] : []),
        { label: "Payment", value: PAY_NAME[settle] },
        { label: "Price", value: paid && chosen ? `${price || "…"} ${chosen.symbol}` : "—" },
        { label: "Delivery", value: `${days} ${dayWord}` },
        { label: "Buyer", value: who === "one" ? (buyer ? short(buyer) : "…") : "Anyone" },
        { label: "Marketplace", value: listing },
      ]}
      done={(r) => {
        const path = `${base}/listings/${String(r.offerId)}`
        return (
          <Done
            title={pre ? "The job is listed for your buyer" : "Your listing is live"}
            actions={
              <>
                <Button asChild><Link href={path}>Open listing #{String(r.offerId)}</Link></Button>
                <Button asChild variant="secondary"><Link href={`${base}/listings`}>All listings</Link></Button>
              </>
            }
          >
            <p>
              Listing #{String(r.offerId)} is published{paid && chosen ? ` at ${price} ${chosen.symbol}` : ""}, with delivery within {days} {dayWord}
              {who === "one" && isAddress(buyer) ? <>, for {short(buyer)} only</> : null}.
            </p>
            {r.published ? (
              <p>{who === "one" ? "Its title and description are saved, so the buyer sees what it is for." : "Its title, description and place are in the marketplace."}</p>
            ) : !available ? (
              <p>The marketplace index was unavailable, so the listing shows as Listing #{String(r.offerId)}. You can add the details from its page later.</p>
            ) : null}
            <ShareLink
              path={path}
              title={pre ? "Send this link to the buyer so they can fund it" : who === "one" ? "Send this link to your buyer" : "Share the link with buyers"}
            >
              {settle === "2"
                ? <>When the buyer takes the listing, the payment is held in escrow until they release it to you. If they never do, after {days} {dayWord} it can only go back to them.</>
                : settle === "1"
                  ? <>When the buyer takes the listing, you are paid straight away.</>
                  : <>When a buyer takes the listing, it is recorded. Nothing is paid.</>}
            </ShareLink>
          </Done>
        )
      }}
    />
  )
}

/** What the supplier sees first when a buyer sent them a "hold a payment for someone" link. */
function JobIntro({ pre, knownSymbol, tokenAccepted, feeBps, onStart }: { pre: Prefill; knownSymbol?: string; tokenAccepted: boolean; feeBps: number; onStart: () => void }) {
  const t = useTenant()
  const { address, isConnected } = useAccount()
  const meta = useTokenMeta(pre.token && !knownSymbol ? [pre.token] : [])(pre.token)
  // The buyer may have named the supplier's wallet: only that wallet can accept here.
  const meantFor = isAddress(pre.supplier) ? pre.supplier : null
  const wrongWallet = !!meantFor && isConnected && !!address && address.toLowerCase() !== meantFor.toLowerCase()
  const blocked = !!meantFor && (!isConnected || wrongWallet)
  const symbol = knownSymbol ?? meta?.symbol ?? ""
  const n = Number(pre.days)
  const validBuyer = isAddress(pre.buyer)
  const iAmBuyer = validBuyer && !!address && address.toLowerCase() === pre.buyer.toLowerCase()
  const what = pre.title.trim() || "a job"
  const money = pre.amount ? `${pre.amount}${symbol ? ` ${symbol}` : ""}` : null
  const time = pre.days ? `${pre.days} ${n === 1 ? "day" : "days"}` : null
  return (
    <div className="space-y-8">
      <PageHead
        title="Accept a job"
        intro={
          <>
            {validBuyer ? short(pre.buyer) : "Someone"} asked you to do this: {what}{money ? `, ${money}` : ""}{time ? `, ${time}` : ""}. Accepting lists the job for them only; they then put the payment in escrow, and you are paid when they release it.
          </>
        }
      />
      {meantFor && !isConnected && (
        <Notice tone="accent" title="Connect the wallet this was meant for" action={<ConnectButton />}>
          <p>The buyer sent this job to <Addr a={meantFor} />. Connect that wallet to accept it.</p>
        </Notice>
      )}
      {wrongWallet && (
        <Notice tone="bad" title="This is a different wallet">
          <p>This was meant for {short(meantFor!)}. You are connected as {short(address!)}. Switch wallets before accepting.</p>
        </Notice>
      )}
      {iAmBuyer && (
        <Notice tone="bad" title="You are connected as the buyer">
          <p>This link is for the person who will do the job. Send it to them; they list the job for you, and you fund it from the listing page.</p>
        </Notice>
      )}
      <Card>
        <p className="t-subheading break-words">{what}</p>
        <Facts columns={4} className="mt-5 border-t border-border pt-5">
          <Fact label="Asked by">{validBuyer ? <Addr a={pre.buyer} /> : "Not a valid address"}</Fact>
          <Fact label="Price">{money ?? "Not set"}</Fact>
          <Fact label="Time">{time ?? "Not set"}</Fact>
          <Fact label="Paid by">{pre.escrow ? "Escrow" : "Your choice"}</Fact>
          {pre.country && <Fact label="Country">{countryName(pre.country)}</Fact>}
        </Facts>
        <p className="mt-6 max-w-[62ch] text-sm text-muted-foreground">
          You can change any of this in the next steps before you sign. Nothing happens until you do. The platform fee{feeBps ? ` of ${feeBps / 100}%` : ""} is taken from what you receive.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
          <Button onClick={onStart} disabled={blocked}>Review and accept</Button>
          <Button asChild variant="ghost"><Link href={`${t.base}/listings`}>Not now</Link></Button>
        </div>
      </Card>
      {!validBuyer && (
        <Notice tone="bad" title="The buyer's address in this link is not valid">
          <p>Ask the buyer to send the link again, or enter their wallet address yourself in the next steps.</p>
        </Notice>
      )}
      {!tokenAccepted && (
        <Notice title="This workspace does not accept the currency in the link">
          <p>Choose one it accepts in the next steps, and tell the buyer.</p>
        </Notice>
      )}
    </div>
  )
}
