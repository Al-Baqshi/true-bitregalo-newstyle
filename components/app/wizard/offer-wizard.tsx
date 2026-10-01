"use client"
import { useState } from "react"
import Link from "next/link"
import { isAddress, parseUnits, zeroAddress, type Address } from "viem"
import { abis } from "@/lib/bitregalo/config"
import { eventArgs, useProjects, useSettlementTokens } from "@/lib/bitregalo/instances"
import { useInstanceRules } from "@/lib/bitregalo/instance-rules"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Wizard, type WizardStep } from "./wizard"
import { Choice, Done, Label, Note, input } from "./fields"
import { Amount } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

type Pay = "0" | "1" | "2"

const PAY_NAME: Record<Pay, string> = { "2": "Escrow", "1": "Direct payment", "0": "Record only" }

export function OfferWizard() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const rules = useInstanceRules(t.instance)
  const tokens = useSettlementTokens(t.instance, t.id)
  const projects = useProjects(t.instance)
  const [settle, setSettle] = useState<Pay>("2")
  const [token, setToken] = useState("")
  const [price, setPrice] = useState("")
  const [days, setDays] = useState("7")
  const [who, setWho] = useState<"open" | "one">("open")
  const [buyer, setBuyer] = useState("")
  const [project, setProject] = useState("0")
  const paid = settle !== "0"
  const chosen = tokens.accepted.find((x) => x.address === token) ?? tokens.accepted[0]
  const termDays = Number(days)
  const termOk = settle !== "2" || (termDays * 86400 >= rules.minTerm && termDays * 86400 <= rules.maxTerm)
  const dayWord = termDays === 1 ? "day" : "days"

  const steps: WizardStep[] = [
    {
      id: "price", title: "Price and payment", caption: "What you charge, and how the buyer's money moves when they take the listing.",
      valid: (settle === "2" && !rules.escrow) || (settle === "1" && !rules.direct) ? "That payment option is off in this workspace" : paid && !chosen ? "This workspace accepts no currency yet" : paid && !(Number(price) > 0) ? "Set a price" : true,
      content: (
        <div className="grid gap-5">
          <Choice<Pay>
            value={settle} onChange={setSettle}
            options={[
              { value: "2", title: "Hold it safely (escrow)", description: "The buyer's payment is locked in the workspace vault when they take the listing. They release it to you on delivery.", disabled: rules.loaded && !rules.escrow ? "Off in this workspace" : undefined },
              { value: "1", title: "Pay straight away (direct payment)", description: "You are paid the moment a buyer takes the listing.", disabled: rules.loaded && !rules.direct ? "Off in this workspace" : undefined },
              { value: "0", title: "Just record it", description: "A recorded commitment to supply. No money moves on the blockchain." },
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
            hint={settle === "2" ? "This is also how long the money is held. If the buyer has not released it by then, it returns to them." : "How long you need once a buyer takes the listing."}
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
          <Note>A listing stores no description on the blockchain, only the price, the delivery time and the currency. Tell buyers what you are selling yourself, and send them the listing link.</Note>
        </div>
      ),
    },
  ]
  return (
    <Wizard
      title="Create a listing"
      intro="The other direction from a request: you say what you charge and how fast you deliver, and a buyer takes it. The payment settles the way you choose."
      steps={steps}
      signLabel="Publish listing"
      plan={[{
        id: "list", label: paid && chosen ? `List at ${price || "…"} ${chosen.symbol}` : "Publish the listing (record only)", detail: `Delivery within ${days} ${dayWord} · ${who === "one" ? "one named buyer" : "open to anyone"}`,
        run: async ({ tx, results }) => {
          const r = await tx("List offer", {
            address: t.instance, abi: abis.instance, functionName: "listOffer",
            args: [paid ? (chosen!.address as Address) : zeroAddress, paid ? parseUnits(price, chosen!.decimals) : 0n, BigInt(Math.round(termDays * 86400)), BigInt(project), Number(settle), who === "one" ? buyer : zeroAddress],
          })
          results.offerId = eventArgs<{ offerId: bigint }>(r, abis.instance, "OfferListed").offerId
        },
      }]}
      summary={[
        { label: "Payment", value: PAY_NAME[settle] },
        { label: "Price", value: paid && chosen ? `${price || "…"} ${chosen.symbol}` : "—" },
        { label: "Delivery", value: `${days} ${dayWord}` },
        { label: "Buyer", value: who === "one" ? (buyer ? `${buyer.slice(0, 8)}…` : "…") : "Anyone" },
      ]}
      done={(r) => (
        <Done
          title="Your listing is live"
          actions={
            <>
              <Button asChild><Link href={`${base}/offers/${String(r.offerId)}`}>Open listing #{String(r.offerId)}</Link></Button>
              <Button asChild variant="secondary"><Link href={`${base}/offers`}>All listings</Link></Button>
            </>
          }
        >
          <p>Listing #{String(r.offerId)} is published{paid && chosen ? ` at ${price} ${chosen.symbol}` : ""}, with delivery within {days} {dayWord}.</p>
          <p>Send the listing link to {who === "one" ? "your buyer" : "buyers"}. When someone takes it, you will see it on the listing page.</p>
        </Done>
      )}
    />
  )
}
