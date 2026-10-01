"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { zeroAddress, type Address } from "viem"
import { abis } from "@/lib/bitregalo/config"
import { encodeLabel, eventArgs, fingerprint, labelBytes, useProjects, useSettlementTokens } from "@/lib/bitregalo/instances"
import { useInstanceRules } from "@/lib/bitregalo/instance-rules"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Wizard, type WizardStep } from "./wizard"
import { Choice, Done, Label, Note, input } from "./fields"
import { Amount } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

type Pay = "0" | "1" | "2"
type Vis = "public" | "private"

const PAY_NAME: Record<Pay, string> = { "2": "Escrow", "1": "Direct payment", "0": "Record only" }

export function RequestWizard() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { address } = useAccount()
  const rules = useInstanceRules(t.instance)
  const tokens = useSettlementTokens(t.instance, t.id)
  const projects = useProjects(t.instance)
  const mine = projects.list.filter((p) => p.active && !!address && p.owner.toLowerCase() === address.toLowerCase())

  const [title, setTitle] = useState("")
  const [vis, setVis] = useState<Vis>("public")
  const [details, setDetails] = useState("")
  const [settle, setSettle] = useState<Pay>("2")
  const [token, setToken] = useState<string>("")
  const [days, setDays] = useState("7")
  const [project, setProject] = useState("0")

  const chosenToken = tokens.accepted.find((x) => x.address === token) ?? tokens.accepted[0]
  const paid = settle !== "0"
  const settleValid = (settle === "2" && !rules.escrow) || (settle === "1" && !rules.direct) ? "That payment option is off in this workspace" : null

  const steps: WizardStep[] = [
    {
      id: "what", title: "What do you need?", caption: "The title is what suppliers see when they browse requests.",
      valid: !title.trim() ? "Add a title" : vis === "public" && labelBytes(title) > 31 ? "Public titles are at most 31 characters" : true,
      content: (
        <div className="grid gap-5">
          <Label title="Title" hint="A few plain words that say what you need." counter={vis === "public" ? `${labelBytes(title)}/31` : undefined}>
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Scaffolding for 12 weeks" autoFocus />
          </Label>
          <Choice<Vis>
            value={vis} onChange={setVis}
            options={[
              { value: "public", title: "Public title", description: "Anyone can read the title on the blockchain. Best for open tenders." },
              { value: "private", title: "Keep the wording private", description: "Only a fingerprint of your text is stored, so the words are not readable. You share the details with suppliers yourself and can prove them later. Who posted it, the offers and any payment are still public." },
            ]}
          />
          {vis === "private" && (
            <Label title="Details (not stored on the blockchain)" hint="Keep a copy. Its fingerprint is what proves later what you asked for.">
              <textarea className={`${input} h-auto py-2.5`} rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Quantities, site address, standards…" />
            </Label>
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
              { value: "2", title: "Hold it safely (escrow)", description: "When you choose an offer, its price moves from your wallet into the workspace vault. You release it when the work is done. If you never do, it returns to you once the supplier's delivery time is over.", disabled: rules.loaded && !rules.escrow ? "Off in this workspace" : undefined },
              { value: "1", title: "Pay straight away (direct payment)", description: "The supplier is paid in full the moment you choose their offer.", disabled: rules.loaded && !rules.direct ? "Off in this workspace" : undefined },
              { value: "0", title: "Just record it", description: "No money moves on the blockchain. The request, the offers and your choice are the record." },
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

  return (
    <Wizard
      title="Post a request"
      intro="Say what you need and how the chosen supplier will be paid. Suppliers send offers with their price and time, and you choose one."
      steps={steps}
      signLabel="Post request"
      plan={[{
        id: "post", label: `Post “${title.trim() || "request"}”`, detail: `${PAY_NAME[settle]}${paid && chosenToken ? ` in ${chosenToken.symbol}` : ""} · offers open for ${days} ${Number(days) === 1 ? "day" : "days"}`,
        run: async ({ tx, results }) => {
          const scope = vis === "public" ? encodeLabel(title) : fingerprint(`${title}\n\n${details}`)
          const deadline = BigInt(Math.floor(Date.now() / 1000) + Math.round(Number(days) * 86400))
          const r = await tx("Post request", { address: t.instance, abi: abis.instance, functionName: "postRfp", args: [scope, deadline, paid ? (chosenToken!.address as Address) : zeroAddress, BigInt(project), Number(settle)] })
          results.rfpId = eventArgs<{ rfpId: bigint }>(r, abis.instance, "RfpPosted").rfpId
        },
      }]}
      summary={[
        { label: "Title", value: title.trim() || "—" },
        { label: "Wording", value: vis === "public" ? "Public" : "Hidden" },
        { label: "Payment", value: PAY_NAME[settle] },
        { label: "Currency", value: paid ? chosenToken?.symbol ?? "—" : "—" },
        { label: "Offers open for", value: `${days} ${Number(days) === 1 ? "day" : "days"}` },
      ]}
      done={(r) => (
        <Done
          title="Your request is open"
          actions={
            <>
              <Button asChild><Link href={`${base}/rfps/${String(r.rfpId)}`}>Open request #{String(r.rfpId)}</Link></Button>
              <Button asChild variant="secondary"><Link href={`${base}/rfps`}>All requests</Link></Button>
            </>
          }
        >
          <p>Request #{String(r.rfpId)} is posted and takes offers for {days} {Number(days) === 1 ? "day" : "days"}.</p>
          <p>Share its page with suppliers. Their offers appear there, and you choose the one you want.</p>
        </Done>
      )}
    />
  )
}
