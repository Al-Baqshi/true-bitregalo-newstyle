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
import { Button } from "@/components/ui/button"

type Pay = "0" | "1" | "2"

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

  const steps: WizardStep[] = [
    {
      id: "price", title: "Price and payment",
      valid: (settle === "2" && !rules.escrow) || (settle === "1" && !rules.direct) ? "That payment option is off here" : paid && !chosen ? "This workspace accepts no currency yet" : paid && !(Number(price) > 0) ? "Set a price" : true,
      content: (
        <div className="grid gap-5">
          <Choice<Pay>
            value={settle} onChange={setSettle}
            options={[
              { value: "2", title: "Escrow", description: "The buyer's payment locks when they confirm; they release it to you on delivery.", disabled: rules.loaded && !rules.escrow ? "Off in this workspace" : undefined },
              { value: "1", title: "Direct payment", description: "You are paid the moment a buyer confirms.", disabled: rules.loaded && !rules.direct ? "Off in this workspace" : undefined },
              { value: "0", title: "Record only", description: "A recorded commitment to supply, no payment on-chain." },
            ]}
          />
          {paid && chosen && (
            <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
              <Label title="Price"><input className={`${input} bq-mono`} type="number" min="0" step="any" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="250" /></Label>
              <Label title="Currency">
                <select className={input} value={chosen.address} onChange={(e) => setToken(e.target.value)}>
                  {tokens.accepted.map((x) => <option key={x.address} value={x.address}>{x.symbol}</option>)}
                </select>
              </Label>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "delivery", title: "Delivery and buyer",
      valid: !(termDays > 0) ? "Set a delivery time" : !termOk ? `Escrow terms here run ${Math.round(rules.minTerm / 3600)} h – ${Math.round(rules.maxTerm / 86400)} days` : who === "one" && !isAddress(buyer) ? "Enter the buyer's address" : true,
      content: (
        <div className="grid gap-5">
          <Label title="You deliver within (days)" hint={settle === "2" ? "This becomes the escrow term: if the buyer never releases, funds return to them after it." : undefined}>
            <input className={`${input} bq-mono max-w-40`} type="number" min="0.05" step="any" value={days} onChange={(e) => setDays(e.target.value)} />
          </Label>
          <Choice<"open" | "one">
            value={who} onChange={setWho} columns={2}
            options={[
              { value: "open", title: "Anyone can buy", description: "A public listing." },
              { value: "one", title: "One specific buyer", description: "A direct ask — only that address can confirm." },
            ]}
          />
          {who === "one" && <Label title="Buyer's wallet address"><input className={`${input} bq-mono`} value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="0x…" /></Label>}
          <Label title="Project (optional)">
            <select className={input} value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="0">No project</option>
              {projects.list.filter((p) => p.active).map((p) => <option key={String(p.id)} value={String(p.id)}>#{String(p.id)} · {p.label ?? "private project"}</option>)}
            </select>
          </Label>
          <Note>Listings carry no description on-chain — only the price, time and currency. Tell buyers what you are selling where you meet them, and send them the listing link.</Note>
        </div>
      ),
    },
  ]
  return (
    <Wizard
      eyebrow={`Workspace #${t.id} · listing`}
      title="Create a listing"
      intro="The other direction from a request: you say what you charge and how fast you deliver, and a buyer takes it. Payment settles the way you choose."
      steps={steps}
      signLabel="Publish listing"
      plan={[{
        id: "list", label: paid && chosen ? `List at ${price || "…"} ${chosen.symbol}` : "List offer (record only)", detail: `Delivery ${days} days · ${who === "one" ? "one buyer" : "open to anyone"}`,
        run: async ({ tx, results }) => {
          const r = await tx("List offer", {
            address: t.instance, abi: abis.instance, functionName: "listOffer",
            args: [paid ? (chosen!.address as Address) : zeroAddress, paid ? parseUnits(price, chosen!.decimals) : 0n, BigInt(Math.round(termDays * 86400)), BigInt(project), Number(settle), who === "one" ? buyer : zeroAddress],
          })
          results.offerId = eventArgs<{ offerId: bigint }>(r, abis.instance, "OfferListed").offerId
        },
      }]}
      summary={[
        { label: "Payment", value: settle === "2" ? "escrow" : settle === "1" ? "direct" : "record only" },
        { label: "Price", value: paid && chosen ? `${price || "…"} ${chosen.symbol}` : "—" },
        { label: "Delivery", value: `${days} days` },
        { label: "Buyer", value: who === "one" ? (buyer ? `${buyer.slice(0, 8)}…` : "…") : "anyone" },
      ]}
      done={(r) => (
        <Done title="Your listing is live" actions={<><Button asChild><Link href={`${base}/offers/${String(r.offerId)}`}>Open listing #{String(r.offerId)}</Link></Button><Button asChild variant="secondary"><Link href={`${base}/offers`}>All listings</Link></Button></>}>
          <p>Send the listing link to {who === "one" ? "your buyer" : "buyers"}. When someone takes it, you will see it on the listing page.</p>
        </Done>
      )}
    />
  )
}
