"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount, useReadContracts } from "wagmi"
import { isAddress, maxUint256, parseUnits, zeroAddress, type Address } from "viem"
import { abis, addresses, short } from "@/lib/bitregalo/config"
import { encodeLabel, eventArgs, labelBytes, rememberInstanceName } from "@/lib/bitregalo/instances"
import { Wizard, type WizardAction, type WizardStep } from "@/components/app/wizard/wizard"
import { AddOn, Choice, Done, Label, Note, input } from "@/components/app/wizard/fields"
import { Button } from "@/components/ui/button"

type Purpose = "procurement" | "marketplace" | "grants" | "records"
type Pay = "0" | "1" | "2"

const PRESETS: Record<Purpose, { direct: boolean; escrow: boolean }> = {
  procurement: { direct: false, escrow: true },
  marketplace: { direct: true, escrow: true },
  grants: { direct: false, escrow: true },
  records: { direct: false, escrow: false },
}

export default function LaunchWizard() {
  const { address } = useAccount()
  const mother = useReadContracts({
    contracts: [
      { address: addresses.mother, abi: abis.mother, functionName: "deployFeeAmount" },
      { address: addresses.mother, abi: abis.mother, functionName: "deployFeeToken" },
      { address: addresses.mother, abi: abis.mother, functionName: "defaultFeeBps" },
      { address: addresses.mother, abi: abis.mother, functionName: "versionCount" },
    ],
  })
  const [deployFee, deployFeeToken, feeBps, versionCount] = (mother.data ?? []).map((r) => r.result) as [bigint?, Address?, number?, bigint?]

  // basics
  const [name, setName] = useState("")
  const [purpose, setPurpose] = useState<Purpose>("procurement")
  // payments
  const [direct, setDirect] = useState(PRESETS.procurement.direct)
  const [escrow, setEscrow] = useState(PRESETS.procurement.escrow)
  const [useUsdt, setUseUsdt] = useState(true)
  const [extraTokens, setExtraTokens] = useState<string[]>([])
  const [newToken, setNewToken] = useState("")
  const [serviceFee, setServiceFee] = useState("0.1")
  const [minDays, setMinDays] = useState("1")
  const [maxDays, setMaxDays] = useState("180")
  // add-ons
  const [withProject, setWithProject] = useState(true)
  const [withToken, setWithToken] = useState(false)
  const [withRequest, setWithRequest] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [tokenName, setTokenName] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [tokenSupply, setTokenSupply] = useState("1000000")
  const [reqTitle, setReqTitle] = useState("")
  const [reqSettle, setReqSettle] = useState<Pay>("2")
  const [reqCurrency, setReqCurrency] = useState<"usdt" | "own">("usdt")
  const [reqDays, setReqDays] = useState("7")

  const paid = direct || escrow
  const baseTokens = [...(useUsdt ? [addresses.usdt] : []), ...extraTokens] as Address[]
  const sym = tokenSymbol.trim().toUpperCase()
  const requestNeedsProject = withRequest && withProject

  function choosePurpose(p: Purpose) {
    setPurpose(p)
    setDirect(PRESETS[p].direct)
    setEscrow(PRESETS[p].escrow)
    if (p === "records") setReqSettle("0")
  }

  const steps: WizardStep[] = [
    {
      id: "basics", title: "Your workspace", caption: "Who it is for and what it will do.",
      valid: !name.trim() ? "Give your workspace a name" : true,
      content: (
        <div className="grid gap-6">
          <Label title="Name" hint="Shown to you in this app. The chain itself records addresses, not names.">
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Construction" autoFocus />
          </Label>
          <div>
            <p className="mb-3 text-sm">What will it be used for?</p>
            <Choice<Purpose>
              value={purpose} onChange={choosePurpose} columns={2}
              options={[
                { value: "procurement", title: "Tendering & procurement", description: "Post requests, suppliers bid, the winner is paid through escrow." },
                { value: "marketplace", title: "Marketplace & supply", description: "Suppliers list what they sell, buyers take it and pay and pay directly or by escrow." },
                { value: "grants", title: "Grants & community funds", description: "Every payment tied to a request, visible to donors and members." },
                { value: "records", title: "Records only", description: "Prove who asked, who won and when — no money on-chain." },
              ]}
            />
          </div>
        </div>
      ),
    },
    {
      id: "payments", title: "How people pay", caption: "Record-only is always on. Pick the paid options.",
      valid: paid && baseTokens.length === 0 ? "Choose at least one currency" : paid && !(Number(serviceFee) >= 0) ? "Enter a service fee (0 is fine)" : true,
      content: (
        <div className="grid gap-4">
          <AddOn checked={escrow} onChange={setEscrow} title="Escrow" description="The payer's funds lock in your vault. Only the payer can release them to the payee; only the payee can cancel back; when the term ends they return to the payer." />
          <AddOn checked={direct} onChange={setDirect} title="Direct payment" description="The payee is paid the moment a request is awarded or a listing is taken." />
          {paid && (
            <div className="mt-2 grid gap-4 rounded-xl border border-border p-4">
              <p className="bq-label">Currencies you accept</p>
              <AddOn checked={useUsdt} onChange={setUseUsdt} title="USDT (testnet)" description={`Tether on BNB Smart Chain Testnet · ${short(addresses.usdt)}`} />
              {extraTokens.map((t) => (
                <div key={t} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm">
                  <span className="bq-mono text-xs">{t}</span>
                  <Button variant="ghost" size="sm" onClick={() => setExtraTokens(extraTokens.filter((x) => x !== t))}>Remove</Button>
                </div>
              ))}
              <div className="flex gap-2">
                <input className={`${input} bq-mono`} value={newToken} onChange={(e) => setNewToken(e.target.value)} placeholder="Add another token address (0x…)" />
                <Button variant="secondary" disabled={!isAddress(newToken) || baseTokens.includes(newToken as Address)} onClick={() => { setExtraTokens([...extraTokens, newToken]); setNewToken("") }}>Add</Button>
              </div>
              <Label title="Service fee per payment" hint="In token units, charged to the payer on top of each payment and paid to the platform. It covers the gas BitRegalo sponsors.">
                <input className={`${input} bq-mono max-w-40`} type="number" min="0" step="any" value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} />
              </Label>
            </div>
          )}
          {!paid && <Note>No paid options: your workspace records requests, bids and awards without moving money. You can switch payments on later in Settings.</Note>}
        </div>
      ),
    },
  ]

  if (escrow) {
    steps.push({
      id: "rules", title: "Escrow rules", caption: "How long funds may stay locked.",
      valid: !(Number(minDays) > 0) || !(Number(maxDays) >= Number(minDays)) ? "The longest term must be at least the shortest" : Number(minDays) * 24 < 1 ? "The shortest term is at least one hour" : true,
      content: (
        <div className="grid gap-5 sm:grid-cols-2">
          <Label title="Shortest term (days)" hint="How quickly a job can be due. Minimum one hour (0.05 days).">
            <input className={`${input} bq-mono`} type="number" min="0.05" step="any" value={minDays} onChange={(e) => setMinDays(e.target.value)} />
          </Label>
          <Label title="Longest term (days)" hint="After this, unreleased funds go back to the payer automatically.">
            <input className={`${input} bq-mono`} type="number" min="1" value={maxDays} onChange={(e) => setMaxDays(e.target.value)} />
          </Label>
        </div>
      ),
    })
  }

  steps.push({
    id: "addons", title: "Add to your launch", caption: "Optional. Each one you switch on adds a step.",
    valid: true,
    content: (
      <div className="grid gap-3">
        <AddOn checked={withProject} onChange={setWithProject} title="Start a project" description="A named project inside your workspace — a site, a programme, a product line. Requests and tokens can be linked to it." />
        <AddOn checked={withToken} onChange={setWithToken} title="Launch your own token" description="Credits, vouchers or memberships for your workspace. It will be accepted as payment right away." />
        <AddOn checked={withRequest} onChange={setWithRequest} title="Post your first request" description="Open a request for proposals so suppliers can start bidding the moment you are live." />
      </div>
    ),
  })

  if (withProject) {
    steps.push({
      id: "project", title: "Your first project", caption: "Stored on-chain as readable text.",
      valid: !projectName.trim() ? "Name the project" : labelBytes(projectName) > 31 ? "At most 31 characters" : true,
      content: (
        <Label title="Project name" counter={`${labelBytes(projectName)}/31`} hint="Everyone can read it, so keep it to what you'd put on a sign.">
          <input className={input} value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Riverside Stage 1" />
        </Label>
      ),
    })
  }
  if (withToken) {
    steps.push({
      id: "token", title: "Your token", caption: "Minted to you; you can mint more later.",
      valid: !tokenName.trim() ? "Name the token" : !sym ? "Add a symbol" : !(Number(tokenSupply) > 0) ? "Enter a supply" : true,
      content: (
        <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
          <Label title="Token name"><input className={input} value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder={name ? `${name} Credits` : "Acme Credits"} /></Label>
          <Label title="Symbol" counter={`${sym.length}/11`}><input className={`${input} bq-mono uppercase`} maxLength={11} value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))} placeholder="ACME" /></Label>
          <div className="sm:col-span-2"><Label title="Initial supply" hint="Standard ERC-20, 18 decimals. You stay the minter; the full token wizard offers fixed and capped supplies too."><input className={`${input} bq-mono`} type="number" min="1" value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} /></Label></div>
        </div>
      ),
    })
  }
  if (withRequest) {
    const settleOpts = [
      { value: "2" as Pay, title: "Escrow", description: "Winner's pay locks until you release it.", disabled: escrow ? undefined : "Escrow is off for this workspace" },
      { value: "1" as Pay, title: "Direct", description: "Winner is paid when you award.", disabled: direct ? undefined : "Direct payment is off" },
      { value: "0" as Pay, title: "Record only", description: "No payment on-chain." },
    ]
    steps.push({
      id: "request", title: "Your first request", caption: "Suppliers bid on it; you award the best one.",
      valid: !reqTitle.trim() ? "Say what you need" : labelBytes(reqTitle) > 31 ? "Keep the public title to 31 characters" : !(Number(reqDays) >= 1) ? "Bidding needs at least a day" : reqSettle !== "0" && reqCurrency === "usdt" && !useUsdt ? "USDT is not one of your currencies" : true,
      content: (
        <div className="grid gap-5">
          <Label title="What do you need?" counter={`${labelBytes(reqTitle)}/31`} hint="A short public title. Details can be shared with bidders off-chain.">
            <input className={input} value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} placeholder="Scaffolding for 12 weeks" />
          </Label>
          <Choice<Pay> value={reqSettle} onChange={setReqSettle} columns={3} options={settleOpts} />
          {reqSettle !== "0" && (
            <Choice<"usdt" | "own">
              value={reqCurrency} onChange={setReqCurrency} columns={2}
              options={[
                { value: "usdt", title: "Pay in USDT", disabled: useUsdt ? undefined : "Not accepted by this workspace" },
                { value: "own", title: `Pay in ${sym || "your token"}`, disabled: withToken ? undefined : "Switch on “Launch your own token”" },
              ]}
            />
          )}
          <Label title="Bidding stays open for (days)"><input className={`${input} bq-mono max-w-40`} type="number" min="1" value={reqDays} onChange={(e) => setReqDays(e.target.value)} /></Label>
        </div>
      ),
    })
  }

  // ── plan ────────────────────────────────────────────────────────────────
  const fee = (deployFee as bigint | undefined) ?? 0n
  const plan: WizardAction[] = []
  if (fee > 0n && deployFeeToken) {
    plan.push({ id: "fee", label: "Approve the launch fee", run: async ({ tx }) => { await tx("Approve launch fee", { address: deployFeeToken, abi: abis.erc20, functionName: "approve", args: [addresses.mother, maxUint256] }) } })
  }
  plan.push({
    id: "launch", label: `Launch “${name.trim() || "your workspace"}”`, detail: "The mother contract deploys your marketplace and your vault, with you as admin.",
    run: async ({ tx, results }) => {
      const version = ((versionCount as bigint | undefined) ?? 1n) - 1n
      const r = await tx("Launch workspace", {
        address: addresses.mother, abi: abis.mother, functionName: "launchTenant",
        args: [{
          admin: address!, version, tokens: paid ? baseTokens : [], decimals: paid ? baseTokens.map(() => 18) : [],
          serviceFees: paid ? baseTokens.map(() => parseUnits(serviceFee || "0", 18)) : [],
          minTerm: BigInt(Math.max(3600, Math.round(Number(minDays) * 86400))), maxTerm: BigInt(Math.round(Number(maxDays) * 86400)),
          kycRequired: false, attester: zeroAddress, directEnabled: direct, escrowEnabled: escrow,
        }],
      })
      const ev = eventArgs<{ tenantId: bigint; instance: Address; vault: Address }>(r, abis.mother, "TenantLaunched")
      Object.assign(results, ev)
      rememberInstanceName(ev.tenantId, name)
    },
  })
  if (withProject) {
    plan.push({
      id: "project", label: `Create project “${projectName.trim()}”`,
      run: async ({ tx, results }) => {
        const r = await tx("Create project", { address: results.instance as Address, abi: abis.instance, functionName: "createProject", args: [encodeLabel(projectName)] })
        results.projectId = eventArgs<{ projectId: bigint }>(r, abis.instance, "ProjectCreated").projectId
      },
    })
  }
  if (withToken) {
    plan.push({
      id: "token", label: `Create ${sym || "token"} — ${tokenName.trim() || "…"}`, detail: `${Number(tokenSupply || 0).toLocaleString()} minted to you${withProject ? ", linked to the project" : ""}`,
      run: async ({ tx, results }) => {
        const r = await tx("Create token", {
          address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "createToken",
          args: [{ name: tokenName.trim(), symbol: sym, decimals: 18, cap: 0n, initialSupply: parseUnits(tokenSupply, 18), owner: zeroAddress, tenantId: results.tenantId as bigint, projectId: (results.projectId as bigint | undefined) ?? 0n }],
        })
        results.token = eventArgs<{ token: Address }>(r, abis.tokenFactory, "TokenCreated").token
      },
    })
    if (paid) {
      plan.push({
        id: "accept", label: `Accept ${sym || "your token"} as payment`,
        run: async ({ tx, results }) => { await tx("Accept as payment", { address: results.instance as Address, abi: abis.instance, functionName: "setToken", args: [results.token, true, 18, parseUnits(serviceFee || "0", 18)] }) },
      })
    }
  }
  if (withRequest) {
    plan.push({
      id: "request", label: `Post request “${reqTitle.trim()}”`, detail: `${reqSettle === "2" ? "Escrow" : reqSettle === "1" ? "Direct payment" : "Record only"} · bidding open ${reqDays} days`,
      run: async ({ tx, results }) => {
        const token = reqSettle === "0" ? zeroAddress : reqCurrency === "own" ? (results.token as Address) : addresses.usdt
        const deadline = BigInt(Math.floor(Date.now() / 1000) + Math.round(Number(reqDays) * 86400))
        const r = await tx("Post request", {
          address: results.instance as Address, abi: abis.instance, functionName: "postRfp",
          args: [encodeLabel(reqTitle), deadline, token, requestNeedsProject ? ((results.projectId as bigint | undefined) ?? 0n) : 0n, Number(reqSettle)],
        })
        results.rfpId = eventArgs<{ rfpId: bigint }>(r, abis.instance, "RfpPosted").rfpId
      },
    })
  }

  return (
    <Wizard
      eyebrow="Create · workspace"
      title="Create your own workspace"
      intro="Your organisation's own requests, listings, escrows and tokens — launched from the BitRegalo mother contract with the same audited rules as everyone else. You stay the admin."
      steps={steps}
      plan={plan}
      signLabel="Create workspace"
      summary={[
        { label: "Instance", value: name.trim() || "—" },
        { label: "Purpose", value: { procurement: "Tendering & procurement", marketplace: "Marketplace & supply", grants: "Grants & community funds", records: "Records only" }[purpose] },
        { label: "Payments", value: [escrow && "escrow", direct && "direct"].filter(Boolean).join(" + ") || "records only" },
        { label: "Currencies", value: paid ? `${baseTokens.length}${withToken ? ` + ${sym || "own token"}` : ""}` : "—" },
        { label: "Platform fee", value: feeBps !== undefined ? `${Number(feeBps) / 100}% per payment${paid ? ` + ${serviceFee} service` : ""}` : "…" },
        { label: "Add-ons", value: [withProject && "project", withToken && "token", withRequest && "first request"].filter(Boolean).join(", ") || "none" },
        { label: "Signatures", value: String(plan.length) },
      ]}
      done={(r) => (
        <Done
          title={`${name.trim()} is live`}
          actions={
            <>
              <Button asChild><Link href={`/app/t/${String(r.tenantId)}`}>Open my workspace</Link></Button>
              {r.rfpId !== undefined && <Button asChild variant="secondary"><Link href={`/app/t/${String(r.tenantId)}/rfps/${String(r.rfpId)}`}>View my request</Link></Button>}
              {r.token !== undefined && <Button asChild variant="secondary"><Link href={`/app/t/${String(r.tenantId)}/tokens/${String(r.token)}`}>View {sym}</Link></Button>}
            </>
          }
        >
          <p>Workspace <b className="text-foreground">#{String(r.tenantId)}</b> has its own marketplace contract (<span className="bq-mono">{short(String(r.instance))}</span>) and vault (<span className="bq-mono">{short(String(r.vault))}</span>). You are its admin.</p>
          <p>Share <span className="bq-mono text-foreground">/app/t/{String(r.tenantId)}</span> with your suppliers and customers — anyone with a wallet can bid, list offers and get paid through it.</p>
        </Done>
      )}
    />
  )
}
