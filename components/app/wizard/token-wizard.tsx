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
const addressAttrs = { autoCapitalize: "none", autoCorrect: "off", spellCheck: false } as const

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
  const modeWord = mode === "fixed" ? "fixed supply" : mode === "capped" ? "capped supply" : "open supply"

  const steps: WizardStep[] = [
    {
      id: "identity",
      title: "Name your token",
      caption: "What people will see in their wallets.",
      valid: !name.trim() ? "Give it a name" : !sym ? "Add a symbol" : sym.length > 11 ? "The symbol is at most 11 characters" : true,
      content: (
        <div className="grid gap-5">
          <Label title="Token name" hint="For example Acme Site Credits, Riverside Garden Vouchers or Guild Membership.">
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Site Credits" autoFocus />
          </Label>
          <Label title="Symbol" hint={suggested && !symbol ? <>A short ticker in letters and numbers. Suggestion: <button type="button" className="rounded-sm text-gold underline decoration-1 underline-offset-[3px] hover:decoration-2" onClick={() => setSymbol(suggested)}>{suggested}</button></> : "A short ticker in letters and numbers, shown in capitals."} counter={`${sym.length}/11`}>
            <input className={`${input} t-mono uppercase`} value={symbol} maxLength={11} onChange={(e) => setSymbol(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))} placeholder="ACME" {...addressAttrs} />
          </Label>
          <Note>Every token is a copy of the same standard contract: ERC-20, 18 decimals, no transfer fees and no hidden behaviour. That is also what lets an escrow vault hold it.</Note>
        </div>
      ),
    },
    {
      id: "supply",
      title: "Supply",
      caption: "How many exist, and whether more can be made.",
      valid: !isNum(supply) ? "Enter an initial supply" : mode === "capped" && (!isNum(cap) || Number(cap) < Number(supply)) ? "The maximum must be at least the initial supply" : mode === "fixed" && Number(supply) <= 0 ? "A fixed supply must be above zero" : true,
      content: (
        <div className="grid gap-5">
          <Label title="Initial supply" hint="Created in your wallet the moment the token exists.">
            <input className={`${input} t-num`} type="number" inputMode="decimal" min="0" value={supply} onChange={(e) => setSupply(e.target.value)} />
          </Label>
          <Choice<Supply>
            value={mode}
            onChange={setMode}
            options={[
              { value: "fixed", title: "Fixed supply", description: "Created once, then minting is switched off for good. Nobody, including you, can create more." },
              { value: "capped", title: "Capped supply", description: "You can create more later, up to a maximum written into the contract." },
              { value: "open", title: "Open supply", description: "You can create more whenever you need to, for example credits you top up." },
            ]}
          />
          {mode === "capped" && (
            <Label title="Maximum supply" hint="The most that can ever exist. It cannot be raised later.">
              <input className={`${input} t-num`} type="number" inputMode="decimal" min="0" value={cap} onChange={(e) => setCap(e.target.value)} />
            </Label>
          )}
        </div>
      ),
    },
    {
      id: "link",
      title: "Where it belongs",
      caption: "A token belongs to a workspace and, if you like, to one of its projects.",
      valid: !inst ? "Choose a workspace" : projectMode === "existing" && !projectId ? "Pick a project" : projectMode === "new" && !projectName.trim() ? "Name the new project" : projectMode === "new" && labelBytes(projectName) > 31 ? "Project names are at most 31 characters" : true,
      content: (
        <div className="grid gap-5">
          {fixedTenant === undefined ? (
            <Label title="Workspace" hint="The organisation or community this token serves.">
              <select className={input} value={tenant} onChange={(e) => { setTenant(e.target.value); setProjectId("") }}>
                {instances.list.map((i) => (
                  <option key={String(i.id)} value={String(i.id)}>
                    #{String(i.id)} · {instanceName(i.id) ?? (i.id === 0n ? "Public workspace" : "Workspace")}{address && i.admin.toLowerCase() === address.toLowerCase() ? " · you are the admin" : ""}
                  </option>
                ))}
              </select>
            </Label>
          ) : (
            <Note>This token will belong to workspace #{String(fixedTenant)}.</Note>
          )}
          <Choice<ProjectMode>
            value={projectMode}
            onChange={setProjectMode}
            columns={3}
            options={[
              { value: "none", title: "No project", description: "The token serves the whole workspace." },
              { value: "existing", title: "An existing project", description: "One of your projects here.", disabled: myProjects.length === 0 ? "You have no projects here yet" : undefined },
              { value: "new", title: "A new project", description: "Create one now and link the token to it." },
            ]}
          />
          {projectMode === "existing" && (
            <Label title="Project" hint="Only projects you own are listed.">
              <select className={input} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">Choose a project</option>
                {myProjects.map((p) => <option key={String(p.id)} value={String(p.id)}>#{String(p.id)} · {p.label ?? "Private project"}</option>)}
              </select>
            </Label>
          )}
          {projectMode === "new" && (
            <Label title="Project name" hint="Stored on the chain as readable text, so everyone sees what the token is for." counter={`${labelBytes(projectName)}/31`}>
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
            title="Accept it as payment in this workspace"
            tag={isAdmin ? undefined : "Admin only"}
            description={isAdmin ? "Requests, listings and escrows in your workspace can then be paid in this token." : "Only the workspace admin can do this. Ask them once the token exists."}
          />
          {accept && isAdmin && (
            <div className="pl-2 sm:pl-14">
              <Label title={`Service fee per payment (${sym || "tokens"})`} hint="Added to each payment, paid by the payer, and goes to the platform. 0 is fine.">
                <input className={`${input} t-num`} type="number" inputMode="decimal" min="0" step="any" value={fee} onChange={(e) => setFee(e.target.value)} />
              </Label>
            </div>
          )}
          <AddOn checked={distribute} onChange={setDistribute} title="Send tokens to people" description="Hand out part of the initial supply straight away: to a team, suppliers or members." />
          {distribute && (
            <div className="space-y-4 pl-2 sm:pl-14">
              {recipients.map((r, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end">
                  <Label title={`Recipient ${i + 1}`}>
                    <input className={`${input} t-mono`} placeholder="0x…" value={r.to} onChange={(e) => setRecipients(recipients.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))} {...addressAttrs} />
                  </Label>
                  <Label title="Amount">
                    <input className={`${input} t-num`} placeholder="0" type="number" inputMode="decimal" min="0" value={r.amount} onChange={(e) => setRecipients(recipients.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
                  </Label>
                  <Button variant="ghost" type="button" onClick={() => setRecipients(recipients.length > 1 ? recipients.filter((_, j) => j !== i) : [{ to: "", amount: "" }])}>Remove</Button>
                </div>
              ))}
              <p className="text-sm text-muted-foreground">Each wallet receives its amount out of the initial supply{sym ? ` of ${sym}` : ""}.</p>
              <Button variant="secondary" size="sm" type="button" onClick={() => setRecipients([...recipients, { to: "", amount: "" }])}>Add another recipient</Button>
            </div>
          )}
        </div>
      ),
    },
  ]

  const plan: WizardAction[] = []
  if (projectMode === "new") {
    plan.push({
      id: "project", label: `Create the project “${projectName.trim()}”`, detail: `In workspace #${tenant}`,
      run: async ({ tx, results }) => {
        const r = await tx("Create project", { address: inst!.instance, abi: abis.instance, functionName: "createProject", args: [encodeLabel(projectName)] })
        results.projectId = eventArgs<{ projectId: bigint }>(r, abis.instance, "ProjectCreated").projectId
      },
    })
  }
  plan.push({
    id: "token", label: `Create ${sym || "the token"}: ${name.trim() || "…"}`, detail: `${Number(supply || 0).toLocaleString()} created in your wallet · ${mode === "capped" ? `maximum ${Number(cap || 0).toLocaleString()}` : modeWord}`,
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
      id: "accept", label: `Accept ${sym || "the token"} as payment`, detail: `Service fee ${fee || 0} ${sym} per payment`,
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
      id: "fix", label: "Switch minting off for good", detail: "Gives up the right to create more, so the supply can never change.",
      run: async ({ tx, results }) => {
        await tx("Fix supply", { address: results.token as Address, abi: abis.utilityToken, functionName: "renounceOwnership", args: [] })
      },
    })
  }

  return (
    <Wizard
      title="Create a token"
      intro="A token is a credit your workspace issues: vouchers, site credits, memberships, loyalty points. It belongs to a workspace and, if you like, to one project. A few questions and a few signatures."
      steps={steps}
      plan={plan}
      signLabel="Create token"
      summary={[
        { label: "Token", value: name.trim() ? `${name.trim()} (${sym || "…"})` : "—" },
        { label: "Supply", value: `${Number(supply || 0).toLocaleString()} · ${modeWord}` },
        { label: "Workspace", value: `#${tenant}${inst && isAdmin ? " · you are the admin" : ""}` },
        { label: "Project", value: projectMode === "none" ? "None" : projectMode === "new" ? projectName || "New project" : `#${projectId || "…"}` },
        { label: "Accepted as payment", value: accept && isAdmin ? "Yes" : "No" },
        { label: "Signatures", value: String(plan.length) },
      ]}
      done={(results) => (
        <Done
          title={`${sym} exists`}
          actions={
            <>
              <Button asChild><Link href={`/app/t/${tenant}/tokens/${results.token as string}`}>Open the token</Link></Button>
              <Button asChild variant="secondary"><Link href={`/app/t/${tenant}/requests/new`}>Post a request paid in {sym}</Link></Button>
            </>
          }
        >
          <p><b className="font-[620] text-foreground">{name.trim()}</b> is live at <span className="t-mono">{short(results.token as string)}</span> in workspace #{tenant}{results.projectId ? `, linked to project #${String(results.projectId)}` : projectMode === "existing" ? `, linked to project #${projectId}` : ""}.</p>
          <p>{Number(supply).toLocaleString()} {sym} were created in your wallet{distributed.length ? ` and ${distributedTotal.toLocaleString()} were sent out` : ""}.{mode === "fixed" ? " Minting is now off for good." : ""}{accept && isAdmin ? ` People can pay in ${sym} in this workspace.` : ""}</p>
        </Done>
      )}
    />
  )
}
