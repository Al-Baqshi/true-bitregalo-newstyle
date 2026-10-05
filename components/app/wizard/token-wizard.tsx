"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount, useReadContracts } from "wagmi"
import { formatUnits, isAddress, parseUnits, zeroAddress, type Address } from "viem"
import { abis, addresses, PUBLIC_WORKSPACE_ID, short } from "@/lib/bitregalo/config"
import { encodeLabel, eventArgs, instanceName, labelBytes, useInstances, useProjects } from "@/lib/bitregalo/instances"
import { Wizard, type WizardAction, type WizardStep } from "./wizard"
import { AddOn, Choice, Done, Label, Note, input } from "./fields"
import { Addr, Notice } from "@/components/app/ui"
import { ConnectButton } from "@/components/app/connect-button"
import { Button } from "@/components/ui/button"

type Supply = "fixed" | "capped" | "open"
type ProjectMode = "none" | "existing" | "new"
type Recipient = { to: string; amount: string }

const isNum = (s: string) => s.trim() !== "" && Number(s) >= 0 && Number.isFinite(Number(s))
const addressAttrs = { autoCapitalize: "none", autoCorrect: "off", spellCheck: false } as const
/** Every token the app creates has 18 decimals, like the stablecoins it sits next to. */
const DECIMALS = 18

/**
 * Create a token. Who may do it is the token factory's rule, not the app's: a token for the
 * workspace itself can only be created by the workspace admin; a token for a project by the
 * admin or by that project's owner. The wizard says which applies before anything is filled
 * in, and never offers a choice the connected wallet would be refused.
 */
export function TokenWizard({ fixedTenant, initialTenant }: { fixedTenant?: bigint; initialTenant?: string }) {
  const { address } = useAccount()
  const instances = useInstances()
  const [tenant, setTenant] = useState<string>(fixedTenant !== undefined ? String(fixedTenant) : initialTenant ?? String(PUBLIC_WORKSPACE_ID))
  const inst = instances.list.find((i) => String(i.id) === tenant)
  const projects = useProjects(inst?.instance)
  const me = address?.toLowerCase()
  const isAdmin = !!me && !!inst && inst.admin.toLowerCase() === me
  const base = BigInt(tenant) === PUBLIC_WORKSPACE_ID ? "/app" : `/app/t/${tenant}`
  const place = fixedTenant !== undefined ? "this workspace" : `workspace #${tenant}`

  // What the factory charges to create a token, read now and passed as the most this wallet agrees to pay.
  const factory = { address: addresses.tokenFactory, abi: abis.tokenFactory } as const
  const feeQ = useReadContracts({
    contracts: [
      { ...factory, functionName: "creationFeeAmount" },
      { ...factory, functionName: "creationFeeToken" },
    ],
    query: { refetchInterval: 20_000 },
  })
  const feeAmount = feeQ.data?.[0]?.result as bigint | undefined
  const feeToken = (feeQ.data?.[1]?.result as Address | undefined) ?? zeroAddress
  const charged = feeAmount !== undefined && feeAmount > 0n
  const feeMeta = useReadContracts({
    contracts: [
      { address: feeToken, abi: abis.utilityToken, functionName: "symbol" },
      { address: feeToken, abi: abis.utilityToken, functionName: "decimals" },
      { address: feeToken, abi: abis.erc20, functionName: "balanceOf", args: [address ?? zeroAddress] },
    ],
    query: { enabled: charged, refetchInterval: 20_000 },
  })
  const feeSymbol = (feeMeta.data?.[0]?.result as string | undefined) ?? "tokens"
  const feeDecimals = Number((feeMeta.data?.[1]?.result as number | undefined) ?? 18)
  const feeBalance = feeMeta.data?.[2]?.result as bigint | undefined
  const feeText = charged ? `${formatUnits(feeAmount!, feeDecimals)} ${feeSymbol}` : null
  const feeShort = charged && !!address && feeBalance !== undefined && feeBalance < feeAmount!

  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [supply, setSupply] = useState("1000000")
  const [mode, setMode] = useState<Supply>("capped")
  const [cap, setCap] = useState("10000000")
  // Until the person chooses, the wizard picks the first option their wallet is allowed.
  const [projectChoice, setProjectChoice] = useState<ProjectMode | null>(null)
  const [projectId, setProjectId] = useState("")
  const [projectName, setProjectName] = useState("")
  const [accept, setAccept] = useState(true)
  const [fee, setFee] = useState("0")
  const [distribute, setDistribute] = useState(false)
  const [recipients, setRecipients] = useState<Recipient[]>([{ to: "", amount: "" }])

  const sym = symbol.trim().toUpperCase()
  const suggested = name.trim().split(/\s+/).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 5)
  const openProjects = projects.list.filter((p) => p.active)
  const myProjects = openProjects.filter((p) => !!me && p.owner.toLowerCase() === me)
  // The admin may create a token for any project; anyone else only for a project they own.
  const selectable = isAdmin ? openProjects : myProjects
  const projectMode: ProjectMode = projectChoice ?? (!address || isAdmin ? "none" : myProjects.length > 0 ? "existing" : "new")
  const chosenProject = selectable.find((p) => String(p.id) === projectId)
  const distributed = distribute ? recipients.filter((r) => r.to || r.amount) : []
  const distributedTotal = distributed.reduce((a, r) => a + (isNum(r.amount) ? Number(r.amount) : 0), 0)
  const modeWord = mode === "fixed" ? "fixed supply" : mode === "capped" ? "capped supply" : "open supply"
  const amountText = `${Number(supply || 0).toLocaleString()} ${sym || "tokens"}`
  const adminOnly = "Only the workspace admin can create a token for the whole workspace"

  const notice = !inst ? null : !address ? (
    <Notice title="Who can create a token here" action={<ConnectButton variant="outline" />}>
      <p>The workspace admin creates the workspace&apos;s own tokens. A project owner creates a token for their own project. Connect your wallet to see which applies to you.</p>
    </Notice>
  ) : isAdmin ? (
    <Notice tone="good" title="You can create tokens here">
      <p>You are the admin of {place}. You can create a token for the workspace itself, or for any of its projects.</p>
    </Notice>
  ) : myProjects.length > 0 ? (
    <Notice tone="accent" title="You can create a token for your own project">
      <p>
        You own {myProjects.length === 1 ? "a project" : `${myProjects.length} projects`} in {place}, so you can create a token for {myProjects.length === 1 ? "it" : "one of them"}.
        A token for the workspace itself can only be created by its admin, <Addr a={inst.admin} />.
      </p>
    </Notice>
  ) : (
    <Notice tone="accent" title="You can create a token only for a project of your own">
      <p>
        A token for the workspace itself can only be created by its admin, <Addr a={inst.admin} />. You do not own a project in {place} yet.
        You can start one in step 3 and create the token for it. That adds one signature.
      </p>
    </Notice>
  )

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
          <Note>Every token is a copy of the same standard contract: ERC-20, 18 decimals, no transfer fees, no pausing and no blocklist. That is also what lets an escrow vault hold it.</Note>
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
          <Label title="Initial supply" hint="Created in your wallet the moment the token exists. You, the creator, own the token and receive all of it.">
            <input className={`${input} t-num`} type="number" inputMode="decimal" min="0" value={supply} onChange={(e) => setSupply(e.target.value)} />
          </Label>
          <Choice<Supply>
            value={mode}
            onChange={setMode}
            options={[
              { value: "fixed", title: "Fixed supply", description: "Created once. You then give up the right to create more, for good: nobody, including you, can ever create more. This cannot be undone." },
              { value: "capped", title: "Capped supply", description: "You can create more later, up to a maximum written into the contract." },
              { value: "open", title: "Open supply", description: "You can create more whenever you need to, for example credits you top up." },
            ]}
          />
          {mode === "capped" && (
            <Label title="Maximum supply" hint="The most that can be in circulation at once. It cannot be raised later.">
              <input className={`${input} t-num`} type="number" inputMode="decimal" min="0" value={cap} onChange={(e) => setCap(e.target.value)} />
            </Label>
          )}
          {mode === "fixed" && (
            <Note>With a fixed supply, a sale can only hand out tokens that already exist. The treasury cannot create them as they sell.</Note>
          )}
        </div>
      ),
    },
    {
      id: "link",
      title: "Where it belongs",
      caption: "A token belongs to a workspace and, if you like, to one of its projects.",
      valid: !inst ? "Choose a workspace"
        : projectMode === "none" && !!address && !isAdmin ? `${adminOnly}. Choose a project instead`
        : projectMode === "existing" && !chosenProject ? "Pick a project"
        : projectMode === "new" && !projectName.trim() ? "Name the new project"
        : projectMode === "new" && labelBytes(projectName) > 31 ? "Project names are at most 31 characters"
        : true,
      content: (
        <div className="grid gap-5">
          {fixedTenant === undefined ? (
            <Label title="Workspace" hint="The organisation or community this token serves.">
              <select className={input} value={tenant} onChange={(e) => { setTenant(e.target.value); setProjectId(""); setProjectChoice(null) }}>
                {instances.list.map((i) => (
                  <option key={String(i.id)} value={String(i.id)}>
                    #{String(i.id)} · {i.id === PUBLIC_WORKSPACE_ID ? "BitRegalo network" : instanceName(i.id) ?? "Workspace"}{me && i.admin.toLowerCase() === me ? " · you are the admin" : ""}
                  </option>
                ))}
              </select>
            </Label>
          ) : (
            <Note>This token will belong to workspace #{String(fixedTenant)}.</Note>
          )}
          <Choice<ProjectMode>
            value={projectMode}
            onChange={setProjectChoice}
            columns={3}
            options={[
              { value: "none", title: "No project", description: "The token serves the whole workspace and is listed as the workspace's own.", disabled: !!address && !isAdmin ? adminOnly : undefined },
              { value: "existing", title: "An existing project", description: isAdmin ? "Any open project in this workspace." : "One of your projects here.", disabled: selectable.length === 0 ? (isAdmin ? "This workspace has no open project yet" : "You have no projects here yet") : undefined },
              { value: "new", title: "A new project", description: "Create one now and link the token to it. You will be the project's owner." },
            ]}
          />
          {projectMode === "existing" && (
            <Label title="Project" hint={isAdmin ? "As the admin you can create a token for any open project." : "Only projects you own are listed."}>
              <select className={input} value={chosenProject ? projectId : ""} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">Choose a project</option>
                {selectable.map((p) => <option key={String(p.id)} value={String(p.id)}>#{String(p.id)} · {p.label ?? "Private project"}</option>)}
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
      caption: "Optional extras. Each one adds a signature. You can also do them later from the token's page.",
      valid: feeAmount === undefined ? "Reading the creation fee…"
        : feeShort ? `Your wallet holds less than the creation fee of ${feeText}`
        : distribute && distributed.some((r) => !isAddress(r.to) || !isNum(r.amount) || Number(r.amount) <= 0) ? "Check the recipients"
        : distribute && distributedTotal > Number(supply || 0) ? "You are sending more than the initial supply"
        : accept && isAdmin && !isNum(fee) ? "Enter a service fee (0 is fine)"
        : true,
      content: (
        <div className="grid gap-4">
          <AddOn
            checked={accept && isAdmin}
            onChange={(v) => setAccept(v)}
            title="Accept it for payments in this workspace"
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
          {charged && (
            <Note>
              Creating a token costs <span className="t-num font-[560] text-foreground">{feeText}</span>, paid once to the platform when the token is created.
              {address && feeBalance !== undefined && <> Your wallet holds {formatUnits(feeBalance, feeDecimals)} {feeSymbol}.</>}
              {feeShort && <strong className="text-destructive"> That is not enough.</strong>}
            </Note>
          )}
        </div>
      ),
    },
  ]

  const plan: WizardAction[] = []
  if (projectMode === "new") {
    plan.push({
      id: "project", label: `Create the project “${projectName.trim()}”`, detail: `In workspace #${tenant}. You will be its owner.`,
      run: async ({ tx, results }) => {
        const r = await tx("Create project", { address: inst!.instance, abi: abis.instance, functionName: "createProject", args: [encodeLabel(projectName)] })
        results.projectId = eventArgs<{ projectId: bigint }>(r, abis.instance, "ProjectCreated").projectId
      },
    })
  }
  if (charged) {
    plan.push({
      // Named after the amount, so a fee that changed after a refused attempt is approved afresh.
      id: `fee-${feeAmount}`, label: `Approve the creation fee of ${feeText}`, detail: "Lets the token factory take exactly this amount from your wallet, and no more.",
      run: async ({ tx }) => {
        await tx("Approve creation fee", { address: feeToken, abi: abis.erc20, functionName: "approve", args: [addresses.tokenFactory, feeAmount!] })
      },
    })
  }
  plan.push({
    id: "token", label: `Create ${sym || "the token"}: ${name.trim() || "…"}`,
    detail: `${amountText} created in your wallet · ${mode === "capped" ? `maximum ${Number(cap || 0).toLocaleString()}` : modeWord}${charged ? ` · the ${feeText} fee is paid here` : ""}`,
    run: async ({ tx, results }) => {
      const pid = projectMode === "new" ? (results.projectId as bigint) : projectMode === "existing" ? BigInt(projectId) : 0n
      // The creator owns the token and receives the initial supply. The last two arguments are the
      // fee's token and the most to pay, exactly as shown above: a fee raised since then is refused.
      const r = await tx("Create token", {
        address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "createToken",
        args: [
          { name: name.trim(), symbol: sym, decimals: DECIMALS, cap: mode === "capped" ? parseUnits(cap, DECIMALS) : 0n, initialSupply: parseUnits(supply, DECIMALS), tenantId: BigInt(tenant), projectId: pid },
          feeToken,
          feeAmount ?? 0n,
        ],
      })
      results.token = eventArgs<{ token: Address }>(r, abis.tokenFactory, "TokenCreated").token
    },
  })
  if (accept && isAdmin) {
    plan.push({
      id: "accept", label: `Accept ${sym || "the token"} for payments`, detail: `Service fee ${fee || 0} ${sym} per payment`,
      run: async ({ tx, results }) => {
        await tx("Accept for payments", { address: inst!.instance, abi: abis.instance, functionName: "setToken", args: [results.token, true, parseUnits(fee || "0", DECIMALS)] })
      },
    })
  }
  distributed.forEach((r, i) => {
    plan.push({
      id: `send-${i}`, label: `Send ${r.amount || "…"} ${sym} to ${isAddress(r.to) ? short(r.to) : "…"}`,
      run: async ({ tx, results }) => {
        await tx("Send tokens", { address: results.token as Address, abi: abis.utilityToken, functionName: "transfer", args: [r.to, parseUnits(r.amount, DECIMALS)] })
      },
    })
  })
  if (mode === "fixed") {
    plan.push({
      id: "fix", label: "Fix the supply for good", detail: "Gives up the right to create more, so the supply can never grow. This cannot be undone.",
      run: async ({ tx, results }) => {
        await tx("Fix supply", { address: results.token as Address, abi: abis.utilityToken, functionName: "renounceOwnership", args: [] })
      },
    })
  }

  const belongs =
    projectMode === "none" ? `Workspace #${tenant}, as its own token`
    : projectMode === "new" ? `A new project, “${projectName.trim() || "…"}”, in workspace #${tenant}`
    : `Project #${projectId || "…"}${chosenProject?.label ? ` (${chosenProject.label})` : ""} in workspace #${tenant}`

  return (
    <Wizard
      title="Create a token"
      intro="A token is a credit a workspace or one of its projects issues: vouchers, site credits, memberships, loyalty points. Whoever creates it owns it and receives the first supply. A few questions and a few signatures."
      notice={notice}
      steps={steps}
      plan={plan}
      signLabel="Create token"
      summary={[
        { label: "Token", value: name.trim() ? `${name.trim()} (${sym || "…"})` : "—" },
        { label: "Created now", value: <>{amountText}, in your wallet{address ? <> (<span className="t-mono">{short(address)}</span>)</> : null}. You own the token.</> },
        { label: "Can more be made?", value: mode === "fixed" ? "No. The supply is fixed for good with the last signature. This cannot be undone." : mode === "capped" ? `Yes, by you, up to ${Number(cap || 0).toLocaleString()} in total` : "Yes, by you, with no limit" },
        { label: "Belongs to", value: belongs },
        { label: "Creation fee", value: feeAmount === undefined ? "…" : charged ? `${feeText}, paid once to the platform` : "None" },
        { label: "Accepted for payments here", value: accept && isAdmin ? `Yes, with a service fee of ${fee || 0} ${sym}` : isAdmin ? "Not yet" : "Not yet. Only the admin can switch it on" },
        ...(distributed.length > 0 ? [{ label: "Sent on", value: `${distributedTotal.toLocaleString()} ${sym} to ${distributed.length} ${distributed.length === 1 ? "wallet" : "wallets"}` }] : []),
        { label: "Signatures", value: String(plan.length) },
      ]}
      done={(results) => (
        <Done
          title={`${sym} exists`}
          actions={
            <>
              <Button asChild><Link href={`${base}/tokens/${results.token as string}`}>Open the token and see the next steps</Link></Button>
              {isAdmin && <Button asChild variant="secondary"><Link href={`${base}/shop/new?token=${results.token as string}`}>Sell it in the shop</Link></Button>}
            </>
          }
        >
          <p><b className="font-[620] text-foreground">{name.trim()}</b> is live at <span className="t-mono">{short(results.token as string)}</span> in workspace #{tenant}{results.projectId ? `, linked to project #${String(results.projectId)}` : projectMode === "existing" ? `, linked to project #${projectId}` : ""}.</p>
          <p>{Number(supply).toLocaleString()} {sym} were created in your wallet{distributed.length ? ` and ${distributedTotal.toLocaleString()} were sent on` : ""}.{mode === "fixed" ? " The supply is now fixed for good." : " You own the token, so only you can create more."}{accept && isAdmin ? ` People can pay in ${sym} in this workspace.` : ""}</p>
          <p>The token&apos;s page shows what you can do next: accept it for payments, sell it, let holders redeem it, or hand it over to someone else.</p>
        </Done>
      )}
    />
  )
}
