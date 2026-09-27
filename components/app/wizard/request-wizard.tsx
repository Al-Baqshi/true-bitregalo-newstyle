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
import { Button } from "@/components/ui/button"

type Pay = "0" | "1" | "2"
type Vis = "public" | "private"

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
  const settleValid = (settle === "2" && !rules.escrow) || (settle === "1" && !rules.direct) ? "That payment option is off in this instance" : null

  const steps: WizardStep[] = [
    {
      id: "what", title: "What do you need?", caption: "The title suppliers see when they browse requests.",
      valid: !title.trim() ? "Add a title" : vis === "public" && labelBytes(title) > 31 ? "Public titles are at most 31 characters" : true,
      content: (
        <div className="grid gap-5">
          <Label title="Title" counter={vis === "public" ? `${labelBytes(title)}/31` : undefined}>
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Scaffolding for 12 weeks" autoFocus />
          </Label>
          <Choice<Vis>
            value={vis} onChange={setVis} columns={2}
            options={[
              { value: "public", title: "Public title", description: "The title is readable on-chain by anyone." },
              { value: "private", title: "Private", description: "Only a fingerprint goes on-chain; you share the details with bidders directly and can prove them later." },
            ]}
          />
          {vis === "private" && (
            <Label title="Details (kept off-chain)" hint="Keep a copy: its fingerprint is what proves the scope later.">
              <textarea className={input} rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Quantities, site address, standards…" />
            </Label>
          )}
        </div>
      ),
    },
    {
      id: "pay", title: "How the winner is paid",
      valid: settleValid ?? (paid && !chosenToken ? "This instance accepts no currency yet" : true),
      content: (
        <div className="grid gap-5">
          <Choice<Pay>
            value={settle} onChange={setSettle}
            options={[
              { value: "2", title: "Escrow", description: "When you award a bid, its amount locks in the instance vault. You release it when the work is done; if you never do, it returns to you at the end of the term.", disabled: rules.loaded && !rules.escrow ? "Off in this instance" : undefined },
              { value: "1", title: "Direct payment", description: "The winner is paid in full the moment you award the bid.", disabled: rules.loaded && !rules.direct ? "Off in this instance" : undefined },
              { value: "0", title: "Record only", description: "No money moves on-chain; the request, the bids and your award are the record." },
            ]}
          />
          {paid && (
            tokens.accepted.length > 0 ? (
              <Label title="Currency">
                <select className={input} value={chosenToken?.address ?? ""} onChange={(e) => setToken(e.target.value)}>
                  {tokens.accepted.map((x) => <option key={x.address} value={x.address}>{x.symbol}</option>)}
                </select>
              </Label>
            ) : <Note>This instance does not accept any currency yet. The admin can add one under Settings.</Note>
          )}
          {paid && <Note>Bidders name their price. Awarding charges you the bid plus a service fee{chosenToken ? ` of ${Number(chosenToken.serviceFee) / 1e18} ${chosenToken.symbol}` : ""}; the platform fee of {rules.feeBps / 100}% is taken from what the winner receives.</Note>}
        </div>
      ),
    },
    {
      id: "when", title: "Timing and project",
      valid: !(Number(days) >= 1) ? "Bidding needs at least a day" : true,
      content: (
        <div className="grid gap-5">
          <Label title="Bidding stays open for (days)" hint="You can still award after bidding closes.">
            <input className={`${input} bq-mono max-w-40`} type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} />
          </Label>
          <Label title="Project (optional)" hint="Only your own projects can carry your requests.">
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
      eyebrow={`Instance #${t.id} · request`}
      title="Post a request for proposals"
      intro="Describe what you need, choose how the winner gets paid, and suppliers bid their price and time frame. You pick the winner."
      steps={steps}
      signLabel="Post request"
      plan={[{
        id: "post", label: `Post “${title.trim() || "request"}”`, detail: `${settle === "2" ? "Escrow" : settle === "1" ? "Direct payment" : "Record only"}${paid && chosenToken ? ` in ${chosenToken.symbol}` : ""} · open ${days} days`,
        run: async ({ tx, results }) => {
          const scope = vis === "public" ? encodeLabel(title) : fingerprint(`${title}\n\n${details}`)
          const deadline = BigInt(Math.floor(Date.now() / 1000) + Math.round(Number(days) * 86400))
          const r = await tx("Post request", { address: t.instance, abi: abis.instance, functionName: "postRfp", args: [scope, deadline, paid ? (chosenToken!.address as Address) : zeroAddress, BigInt(project), Number(settle)] })
          results.rfpId = eventArgs<{ rfpId: bigint }>(r, abis.instance, "RfpPosted").rfpId
        },
      }]}
      summary={[
        { label: "Title", value: title.trim() || "—" },
        { label: "Visibility", value: vis },
        { label: "Payment", value: settle === "2" ? "escrow" : settle === "1" ? "direct" : "record only" },
        { label: "Currency", value: paid ? chosenToken?.symbol ?? "—" : "—" },
        { label: "Bidding", value: `${days} days` },
      ]}
      done={(r) => (
        <Done title="Your request is open" actions={<><Button asChild><Link href={`${base}/rfps/${String(r.rfpId)}`}>Open request #{String(r.rfpId)}</Link></Button><Button asChild variant="secondary"><Link href={`${base}/rfps`}>All requests</Link></Button></>}>
          <p>Share the link with suppliers. Each bid shows up on the request page, and you award the one you want.</p>
        </Done>
      )}
    />
  )
}
