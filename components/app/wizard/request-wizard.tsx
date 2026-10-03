"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useAccount, useSignMessage } from "wagmi"
import { toast } from "sonner"
import { zeroAddress, type Address } from "viem"
import { abis } from "@/lib/bitregalo/config"
import { encodeLabel, eventArgs, fingerprint, labelBytes, useProjects, useSettlementTokens } from "@/lib/bitregalo/instances"
import { useInstanceRules } from "@/lib/bitregalo/instance-rules"
import { useTenant } from "@/lib/bitregalo/tenant"
import { LIMITS, categoryLabel, charCount, guessCountry, putEntry, useMarketAvailable } from "@/lib/bitregalo/market"
import { DescriptionField, MoreDetailsFields, TitleField, detailsProblem, emptyDetails, toInput, type Details } from "@/components/app/market/details-form"
import { marketErrorText, placeOf } from "@/components/app/market/words"
import { Wizard, type WizardAction, type WizardStep } from "./wizard"
import { Choice, Done, Label, Note, input } from "./fields"
import { Amount } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

type Pay = "0" | "1" | "2"
type Vis = "public" | "private"

const PAY_NAME: Record<Pay, string> = { "2": "Escrow", "1": "Direct payment", "0": "Record only" }

export function RequestWizard() {
  const t = useTenant()
  const base = t.base
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const rules = useInstanceRules(t.instance)
  const tokens = useSettlementTokens(t.instance, t.id)
  const projects = useProjects(t.instance)
  const mine = projects.list.filter((p) => p.active && !!address && p.owner.toLowerCase() === address.toLowerCase())
  const available = useMarketAvailable()

  // Title and description: `details` doubles as the private wording when the wording is private.
  const [d, setD] = useState<Details>(() => emptyDetails())
  const set = (patch: Partial<Details>) => setD((x) => ({ ...x, ...patch }))
  useEffect(() => {
    const g = guessCountry()
    if (g) setD((x) => (x.country ? x : { ...x, country: g }))
  }, [])
  const title = d.title
  const details = d.description
  const [vis, setVis] = useState<Vis>("public")
  const [settle, setSettle] = useState<Pay>("2")
  const [token, setToken] = useState<string>("")
  const [days, setDays] = useState("7")
  const [project, setProject] = useState("0")

  const chosenToken = tokens.accepted.find((x) => x.address === token) ?? tokens.accepted[0]
  const paid = settle !== "0"
  const settleValid = (settle === "2" && !rules.escrow) || (settle === "1" && !rules.direct) ? "That payment option is off in this workspace" : null

  // The marketplace lists public requests with a country. On the network the country is required.
  const countryRequired = t.isPublic
  const publish = available && vis === "public" && d.country !== ""
  const chars = charCount(title.trim())
  const bytes = labelBytes(title)
  const onChainOnly = vis === "public" && !publish
  const whatValid: true | string =
    chars < LIMITS.titleMin ? `Add a title of at least ${LIMITS.titleMin} characters`
    : chars > LIMITS.title ? `Titles are at most ${LIMITS.title} characters`
    : vis === "public" && available && countryRequired && !d.country ? "Choose a country"
    : publish ? detailsProblem(d) ?? true
    : onChainOnly && bytes > 31 ? "A title kept only on the blockchain can be at most 31 characters"
    : true

  const titleHint =
    vis === "private" || chars === 0 ? "A few plain words that say what you need."
    : publish ? (bytes <= 31 ? "Short enough to be readable on the blockchain too." : "Longer than 31 characters, so the blockchain keeps a fingerprint of it and the marketplace shows it in full.")
    : "Readable by anyone on the blockchain. A few plain words that say what you need."

  const steps: WizardStep[] = [
    {
      id: "what", title: "What and where", caption: "The title is what suppliers see first. Public requests are listed in the marketplace by country.",
      valid: whatValid,
      content: (
        <div className="grid gap-5">
          <TitleField value={title} onChange={(v) => set({ title: v })} autoFocus hint={titleHint} counter={onChainOnly ? `${bytes}/31` : `${chars}/${LIMITS.title}`} />
          <Choice<Vis>
            value={vis} onChange={setVis}
            options={[
              { value: "public", title: "Public", description: available ? "Anyone can read the title and description in the marketplace. Best for open tenders." : "Anyone can read the title on the blockchain. Best for open tenders." },
              { value: "private", title: "Keep the wording private", description: `Only a fingerprint of your text is stored, so the words are not readable. You share the details with suppliers yourself and can prove them later. Who posted it, the offers and any payment are still public.${available ? " It is not listed in the marketplace." : ""}` },
            ]}
          />
          {vis === "private" && (
            <DescriptionField
              title="Details (not stored on the blockchain)"
              value={details} onChange={(v) => set({ description: v })}
              hint="Keep a copy. Its fingerprint, with the title, is what proves later what you asked for."
              placeholder="Quantities, site address, standards…"
            />
          )}
          {vis === "public" && available && (
            <MoreDetailsFields
              value={d} set={set} countryRequired={countryRequired}
              descriptionHint="Shown in the marketplace under the title. The first line shows in lists."
              countryHint={countryRequired ? "Where the work or delivery is. People browse the marketplace by country." : "Leave it empty to keep this request out of the marketplace. Its title then lives only on the blockchain, up to 31 characters."}
            />
          )}
          {vis === "public" && !available && (
            <Note>
              The marketplace index is unavailable right now, so a description, category and country cannot be published. The request will show its short title only. You can add the details later from its page.
            </Note>
          )}
        </div>
      ),
    },
    {
      id: "pay", title: "How the chosen supplier is paid", caption: "You decide this now; suppliers see it before they make an offer.",
      valid: settleValid ?? (paid && !chosenToken ? "This workspace accepts no currency yet" : true),
      content: (
        <div className="grid gap-5">
          <Choice<Pay>
            value={settle} onChange={setSettle}
            options={[
              { value: "2", title: "Hold it safely (escrow)", description: "When you choose an offer, its price moves from your wallet into the workspace vault. You release it when the work is done. If you never do, once the supplier's delivery time is over it can only go back to you.", disabled: rules.loaded && !rules.escrow ? "Off in this workspace" : undefined },
              { value: "1", title: "Pay straight away (direct payment)", description: "The supplier is paid in full the moment you choose their offer.", disabled: rules.loaded && !rules.direct ? "Off in this workspace" : undefined },
              { value: "0", title: "Just record it", description: "Nothing is paid on the blockchain. The request, the offers and your choice are the record." },
            ]}
          />
          {paid && (
            tokens.accepted.length > 0 ? (
              <Label title="Currency" hint="What suppliers quote in and what you pay with.">
                <select className={input} value={chosenToken?.address ?? ""} onChange={(e) => setToken(e.target.value)}>
                  {tokens.accepted.map((x) => <option key={x.address} value={x.address}>{x.symbol}</option>)}
                </select>
              </Label>
            ) : <Note>This workspace does not accept any currency yet. The admin can add one under Settings.</Note>
          )}
          {paid && (
            <Note>
              Suppliers name their price. Choosing an offer charges you that price
              {chosenToken && chosenToken.serviceFee > 0n ? <> plus a service fee of <Amount value={chosenToken.serviceFee} decimals={chosenToken.decimals} symbol={chosenToken.symbol} /></> : null}
              . The platform fee of {rules.feeBps / 100}% is taken from what the supplier receives.
            </Note>
          )}
        </div>
      ),
    },
    {
      id: "when", title: "How long offers stay open",
      valid: !(Number(days) >= 1) ? "Offers need to stay open for at least a day" : true,
      content: (
        <div className="grid gap-5">
          <Label title="Offers stay open for (days)" hint="After this, nobody can send a new offer. You can still choose from the ones you have.">
            <input className={`${input} max-w-40`} type="number" inputMode="decimal" min="1" value={days} onChange={(e) => setDays(e.target.value)} />
          </Label>
          <Label title="Project (optional)" hint="Groups this request with related work. Only your own projects are listed.">
            <select className={input} value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="0">No project</option>
              {mine.map((p) => <option key={String(p.id)} value={String(p.id)}>#{String(p.id)} · {p.label ?? "private project"}</option>)}
            </select>
          </Label>
        </div>
      ),
    },
  ]

  const plan: WizardAction[] = [{
    id: "post", label: `Post “${title.trim() || "request"}”`, detail: `${PAY_NAME[settle]}${paid && chosenToken ? ` in ${chosenToken.symbol}` : ""} · offers open for ${days} ${Number(days) === 1 ? "day" : "days"}`,
    run: async ({ tx, results }) => {
      const scope = vis === "public" ? encodeLabel(title) : fingerprint(`${title}\n\n${details}`)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + Math.round(Number(days) * 86400))
      const r = await tx("Post request", { address: t.instance, abi: abis.instance, functionName: "postRfp", args: [scope, deadline, paid ? (chosenToken!.address as Address) : zeroAddress, BigInt(project), Number(settle)] })
      results.rfpId = eventArgs<{ rfpId: bigint }>(r, abis.instance, "RfpPosted").rfpId
    },
  }]
  if (publish) {
    plan.push({
      id: "details", kind: "message", label: "Publish the details", detail: "Your wallet signs a message, no fee. The title, description, category and place go to the marketplace.",
      run: async ({ results }) => {
        const rfpId = results.rfpId as bigint
        const id = toast.loading("Publish the details: sign the message in your wallet…")
        try {
          if (!address) throw new Error("connect your wallet first")
          await putEntry({ workspace: t.id, kind: "request", recordId: rfpId }, toInput(d), address, signMessageAsync)
          toast.success("Details published", { id })
          results.published = true
        } catch (e) {
          const why = marketErrorText(e)
          toast.error("The details were not saved", { id, description: why })
          throw new Error(`${why}. Request #${String(rfpId)} itself is posted; you can also add the details later from its page`)
        }
      },
    })
  }

  const listing =
    vis === "private" ? "Not listed: the wording is private"
    : !available ? "The marketplace index is unavailable, so the request will show its short title only. Add the details later from its page."
    : publish ? "Listed once you sign the message"
    : "Not listed: no country chosen"

  return (
    <Wizard
      title="Post a request"
      intro="Say what you need and how the chosen supplier will be paid. Suppliers send offers with their price and time, and you choose one."
      steps={steps}
      signLabel="Post request"
      plan={plan}
      summary={[
        { label: "Title", value: title.trim() || "—" },
        { label: "Wording", value: vis === "public" ? "Public" : "Private" },
        ...(publish ? [
          { label: "Category", value: d.category ? categoryLabel(d.category) : "—" },
          { label: "Where", value: placeOf(d) || "—" },
        ] : []),
        { label: "Payment", value: PAY_NAME[settle] },
        { label: "Currency", value: paid ? chosenToken?.symbol ?? "—" : "—" },
        { label: "Offers open for", value: `${days} ${Number(days) === 1 ? "day" : "days"}` },
        { label: "Marketplace", value: listing },
      ]}
      done={(r) => (
        <Done
          title="Your request is open"
          actions={
            <>
              <Button asChild><Link href={`${base}/requests/${String(r.rfpId)}`}>Open request #{String(r.rfpId)}</Link></Button>
              <Button asChild variant="secondary"><Link href={`${base}/requests`}>All requests</Link></Button>
            </>
          }
        >
          <p>Request #{String(r.rfpId)} is posted and takes offers for {days} {Number(days) === 1 ? "day" : "days"}.</p>
          {r.published ? (
            <p>Its title, description and place are in the marketplace, so suppliers browsing {placeOf({ city: "", country: d.country })} can find it.</p>
          ) : vis === "public" && !available ? (
            <p>The marketplace index was unavailable, so the request shows its short title only. You can add the details from its page later.</p>
          ) : vis === "public" ? (
            <p>It is not in the marketplace. To list it, add a country and details from its page.</p>
          ) : null}
          <p>Share its page with suppliers. Their offers appear there, and you choose the one you want.</p>
        </Done>
      )}
    />
  )
}
