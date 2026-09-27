"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { isAddress, parseUnits, zeroAddress, type Address } from "viem"
import { abis, addresses, short } from "@/lib/bitregalo/config"
import { encodeLabel, eventArgs, instanceName, labelBytes, useInstances, useProjects } from "@/lib/bitregalo/instances"
import { Wizard, type WizardAction, type WizardStep } from "./wizard"
import { AddOn, Choice, Done, Label, Note, input } from "./fields"
import { Button } from "@/components/ui/button"

type Supply = "fixed" | "capped" | "open"
type ProjectMode = "none" | "existing" | "new"
type Recipient = { to: string; amount: string }

const isNum = (s: string) => s.trim() !== "" && Number(s) >= 0 && Number.isFinite(Number(s))

export function TokenWizard({ fixedTenant, initialTenant }: { fixedTenant?: bigint; initialTenant?: string }) {
  const { address } = useAccount()
  const instances = useInstances()
  const [tenant, setTenant] = useState<string>(fixedTenant !== undefined ? String(fixedTenant) : initialTenant ?? "0")
  const inst = instances.list.find((i) => String(i.id) === tenant)
  const projects = useProjects(inst?.instance)
  const isAdmin = !!address && !!inst && inst.admin.toLowerCase() === address.toLowerCase()

  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [supply, setSupply] = useState("1000000")
  const [mode, setMode] = useState<Supply>("capped")
  const [cap, setCap] = useState("10000000")
  const [projectMode, setProjectMode] = useState<ProjectMode>("none")
  const [projectId, setProjectId] = useState("")
  const [projectName, setProjectName] = useState("")
  const [accept, setAccept] = useState(true)
  const [fee, setFee] = useState("0")
  const [distribute, setDistribute] = useState(false)
  const [recipients, setRecipients] = useState<Recipient[]>([{ to: "", amount: "" }])

  const sym = symbol.trim().toUpperCase()
  const suggested = name.trim().split(/\s+/).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 5)
  const myProjects = projects.list.filter((p) => p.active && !!address && p.owner.toLowerCase() === address.toLowerCase())
  const distributed = distribute ? recipients.filter((r) => r.to || r.amount) : []
  const distributedTotal = distributed.reduce((a, r) => a + (isNum(r.amount) ? Number(r.amount) : 0), 0)

  const steps: WizardStep[] = [
    {
      id: "identity",
      title: "Name your token",
      caption: "What people will see in their wallets.",
      valid: !name.trim() ? "Give it a name" : !sym ? "Add a symbol" : sym.length > 11 ? "Symbol is at most 11 characters" : true,
      content: (
        <div className="grid gap-5">
          <Label title="Token name" hint="e.g. Acme Site Credits, Riverside Garden Vouchers, Guild Membership.">
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Site Credits" autoFocus />
          </Label>
          <Label title="Symbol" hint={suggested && !symbol ? <>Suggestion: <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={() => setSymbol(suggested)}>{suggested}</button></> : "Short ticker, letters and numbers."} counter={`${sym.length}/11`}>
            <input className={`${input} bq-mono uppercase`} value={symbol} maxLength={11} onChange={(e) => setSymbol(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))} placeholder="ACME" />
          </Label>
          <Note>Every token is a clone of one audited contract: standard ERC-20, 18 decimals, no transfer fees and no hidden behaviour — which is also what lets an escrow vault accept it.</Note>
        </div>
      ),
    },
    {
      id: "supply",
      title: "Supply",
      caption: "How many exist, and whether more can be made.",
      valid: !isNum(supply) ? "Enter an initial supply" : mode === "capped" && (!isNum(cap) || Number(cap) < Number(supply)) ? "The cap must be at least the initial supply" : mode === "fixed" && Number(supply) <= 0 ? "A fixed supply must be above zero" : true,
      content: (
        <div className="grid gap-5">
          <Label title="Initial supply" hint="Minted to your wallet when the token is created.">
            <input className={`${input} bq-mono`} type="number" min="0" value={supply} onChange={(e) => setSupply(e.target.value)} />
          </Label>
          <Choice<Supply>
            value={mode}
            onChange={setMode}
            options={[
              { value: "fixed", title: "Fixed supply", description: "Mint once, then minting is switched off forever. Nobody — including you — can create more." },
              { value: "capped", title: "Capped", description: "You can mint more later, up to a hard limit written into the contract." },
              { value: "open", title: "Open", description: "You can mint more whenever you need to, e.g. credits you top up." },
            ]}
          />
          {mode === "capped" && (
            <Label title="Maximum supply">
              <input className={`${input} bq-mono`} type="number" min="0" value={cap} onChange={(e) => setCap(e.target.value)} />
            </Label>
          )}
        </div>
      ),
    },
    {
      id: "link",
      title: "Link it",
      caption: "Tokens belong to an instance, and optionally to one of its projects.",
      valid: !inst ? "Choose an instance" : projectMode === "existing" && !projectId ? "Pick a project" : projectMode === "new" && !projectName.trim() ? "Name the new project" : projectMode === "new" && labelBytes(projectName) > 31 ? "Project names are at most 31 characters" : true,
      content: (
        <div className="grid gap-5">
          {fixedTenant === undefined ? (
            <Label title="Instance" hint="The company or community this token serves.">
              <select className={input} value={tenant} onChange={(e) => { setTenant(e.target.value); setProjectId("") }}>
                {instances.list.map((i) => (
                  <option key={String(i.id)} value={String(i.id)}>
                    #{String(i.id)} · {instanceName(i.id) ?? (i.id === 0n ? "BitRegalo public template" : "Instance")}{address && i.admin.toLowerCase() === address.toLowerCase() ? " · you are admin" : ""}
                  </option>
                ))}
              </select>
            </Label>
          ) : (
            <Note>This token will belong to instance #{String(fixedTenant)}.</Note>
          )}
          <Choice<ProjectMode>
            value={projectMode}
            onChange={setProjectMode}
            columns={3}
            options={[
              { value: "none", title: "No project", description: "The token serves the whole instance." },
              { value: "existing", title: "Existing project", description: "One of your projects.", disabled: myProjects.length === 0 ? "You have no projects here yet" : undefined },
              { value: "new", title: "New project", description: "Create one now and link it." },
            ]}
          />
          {projectMode === "existing" && (
            <Label title="Project">
              <select className={input} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">Choose…</option>
                {myProjects.map((p) => <option key={String(p.id)} value={String(p.id)}>#{String(p.id)} · {p.label ?? "private project"}</option>)}
              </select>
            </Label>
          )}
          {projectMode === "new" && (
            <Label title="Project name" hint="Stored on-chain as readable text, so everyone sees what the token is for." counter={`${labelBytes(projectName)}/31`}>
              <input className={input} value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Riverside community garden" />
            </Label>
          )}
        </div>
      ),
    },
    {
      id: "use",
      title: "Put it to work",
      caption: "Optional extras. Each one adds a step to what you sign.",
      valid: distribute && distributed.some((r) => !isAddress(r.to) || !isNum(r.amount) || Number(r.amount) <= 0) ? "Check the recipients" : distribute && distributedTotal > Number(supply || 0) ? "You are sending more than the initial supply" : accept && isAdmin && !isNum(fee) ? "Enter a service fee (0 is fine)" : true,
      content: (
        <div className="grid gap-4">
          <AddOn
            checked={accept && isAdmin}
            onChange={(v) => setAccept(v)}
            title="Accept it as payment in this instance"
            tag={isAdmin ? undefined : "admin only"}
            description={isAdmin ? "Requests, offers and escrows in your instance can then be paid in this token." : "Only the instance admin can do this. Ask them after the token is created."}
          />
          {accept && isAdmin && (
            <div className="pl-2 sm:pl-14">
              <Label title={`Service fee per settlement (${sym || "tokens"})`} hint="Charged to the payer on top of each payment, paid into the platform treasury.">
                <input className={`${input} bq-mono`} type="number" min="0" step="any" value={fee} onChange={(e) => setFee(e.target.value)} />
              </Label>
            </div>
          )}
          <AddOn checked={distribute} onChange={setDistribute} title="Send tokens to people" description="Hand out part of the supply right away — to a team, suppliers, or members." />
          {distribute && (
            <div className="space-y-2 pl-2 sm:pl-14">
              {recipients.map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_auto] gap-2">
                  <input className={`${input} bq-mono`} placeholder="0x… address" value={r.to} onChange={(e) => setRecipients(recipients.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))} />
                  <input className={`${input} bq-mono`} placeholder="amount" type="number" min="0" value={r.amount} onChange={(e) => setRecipients(recipients.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
                  <Button variant="ghost" type="button" onClick={() => setRecipients(recipients.length > 1 ? recipients.filter((_, j) => j !== i) : [{ to: "", amount: "" }])}>Remove</Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" type="button" onClick={() => setRecipients([...recipients, { to: "", amount: "" }])}>Add recipient</Button>
            </div>
          )}
        </div>
      ),
    },
  ]

  const plan: WizardAction[] = []
  if (projectMode === "new") {
    plan.push({
      id: "project", label: `Create project “${projectName.trim()}”`, detail: `On instance #${tenant}`,
      run: async ({ tx, results }) => {
        const r = await tx("Create project", { address: inst!.instance, abi: abis.instance, functionName: "createProject", args: [encodeLabel(projectName)] })
        results.projectId = eventArgs<{ projectId: bigint }>(r, abis.instance, "ProjectCreated").projectId
      },
    })
  }
  plan.push({
    id: "token", label: `Create ${sym || "token"} — ${name.trim() || "…"}`, detail: `${Number(supply || 0).toLocaleString()} minted to you · ${mode === "fixed" ? "fixed supply" : mode === "capped" ? `cap ${Number(cap || 0).toLocaleString()}` : "open supply"}`,
    run: async ({ tx, results }) => {
      const pid = projectMode === "new" ? (results.projectId as bigint) : projectMode === "existing" ? BigInt(projectId) : 0n
      const r = await tx("Create token", {
        address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "createToken",
        args: [{ name: name.trim(), symbol: sym, decimals: 18, cap: mode === "capped" ? parseUnits(cap, 18) : 0n, initialSupply: parseUnits(supply, 18), owner: zeroAddress, tenantId: BigInt(tenant), projectId: pid }],
      })
      results.token = eventArgs<{ token: Address }>(r, abis.tokenFactory, "TokenCreated").token
    },
  })
  if (accept && isAdmin) {
    plan.push({
      id: "accept", label: `Accept ${sym || "the token"} as payment`, detail: `Service fee ${fee || 0} ${sym} per settlement`,
      run: async ({ tx, results }) => {
        await tx("Accept as payment", { address: inst!.instance, abi: abis.instance, functionName: "setToken", args: [results.token, true, 18, parseUnits(fee || "0", 18)] })
      },
    })
  }
  distributed.forEach((r, i) => {
    plan.push({
      id: `send-${i}`, label: `Send ${r.amount || "…"} ${sym} to ${isAddress(r.to) ? short(r.to) : "…"}`,
      run: async ({ tx, results }) => {
        await tx("Send tokens", { address: results.token as Address, abi: abis.utilityToken, functionName: "transfer", args: [r.to, parseUnits(r.amount, 18)] })
      },
    })
  })
  if (mode === "fixed") {
    plan.push({
      id: "fix", label: "Switch minting off forever", detail: "Gives up the minter role, so the supply can never change.",
      run: async ({ tx, results }) => {
        await tx("Fix supply", { address: results.token as Address, abi: abis.utilityToken, functionName: "renounceOwnership", args: [] })
      },
    })
  }

  return (
    <Wizard
      eyebrow="Create · token"
      title="Create a token for your project"
      intro="Launch a named ERC-20 — credits, vouchers, memberships, loyalty points — tied to your instance and, if you like, one project. It takes a few minutes and a few signatures."
      steps={steps}
      plan={plan}
      signLabel="Create token"
      summary={[
        { label: "Token", value: name.trim() ? `${name.trim()} (${sym || "…"})` : "—" },
        { label: "Supply", value: `${Number(supply || 0).toLocaleString()} · ${mode}` },
        { label: "Instance", value: `#${tenant}${inst && isAdmin ? " · you are admin" : ""}` },
        { label: "Project", value: projectMode === "none" ? "none" : projectMode === "new" ? projectName || "new" : `#${projectId || "…"}` },
        { label: "Accepted as payment", value: accept && isAdmin ? "yes" : "no" },
        { label: "Signatures", value: String(plan.length) },
      ]}
      done={(results) => (
        <Done
          title={`${sym} is live`}
          actions={
            <>
              <Button asChild><Link href={`/app/t/${tenant}/tokens/${results.token as string}`}>Open token</Link></Button>
              <Button asChild variant="secondary"><Link href={`/app/t/${tenant}/rfps/new`}>Post a request paid in {sym}</Link></Button>
            </>
          }
        >
          <p><b className="text-foreground">{name.trim()}</b> exists at <span className="bq-mono">{short(results.token as string)}</span> on instance #{tenant}{results.projectId ? `, linked to project #${String(results.projectId)}` : projectMode === "existing" ? `, linked to project #${projectId}` : ""}.</p>
          <p>{Number(supply).toLocaleString()} {sym} were minted to your wallet{distributed.length ? ` and ${distributedTotal.toLocaleString()} were sent out` : ""}.{mode === "fixed" ? " Minting is now off for good." : ""}</p>
        </Done>
      )}
    />
  )
}
