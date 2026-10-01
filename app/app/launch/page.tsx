"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount, useReadContracts } from "wagmi"
import { formatUnits, isAddress, maxUint256, parseUnits, zeroAddress, type Address } from "viem"
import { abis, addresses, STABLES } from "@/lib/bitregalo/config"
import { FaucetButton } from "@/components/app/faucet"
import { encodeLabel, eventArgs, labelBytes, rememberInstanceName } from "@/lib/bitregalo/instances"
import { Wizard, type WizardAction, type WizardStep } from "@/components/app/wizard/wizard"
import { AddOn, Choice, Done, Label, Note, input } from "@/components/app/wizard/fields"
import { Addr } from "@/components/app/ui"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Purpose = "shop" | "procurement" | "marketplace" | "grants" | "records"
type Pay = "0" | "1" | "2"

const PRESETS: Record<Purpose, { direct: boolean; escrow: boolean }> = {
  shop: { direct: true, escrow: true },
  procurement: { direct: false, escrow: true },
  marketplace: { direct: true, escrow: true },
  grants: { direct: false, escrow: true },
  records: { direct: false, escrow: false },
}
const PURPOSE_NAME: Record<Purpose, string> = {
  shop: "Sell and take payments",
  procurement: "Tendering and procurement",
  marketplace: "Marketplace and supply",
  grants: "Grants and community funds",
  records: "Records only",
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
  const fee = (deployFee as bigint | undefined) ?? 0n
  const feeStable = STABLES.find((x) => x.address.toLowerCase() === (deployFeeToken ?? "").toLowerCase())

  // basics
  const [name, setName] = useState("")
  const [purpose, setPurpose] = useState<Purpose>("shop")
  // payments
  const [direct, setDirect] = useState(PRESETS.shop.direct)
  const [escrow, setEscrow] = useState(PRESETS.shop.escrow)
  const [stables, setStables] = useState<string[]>(STABLES.map((x) => x.address))
  const useUsdt = stables.includes(addresses.usdt)
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
  const baseTokens = [...stables, ...extraTokens] as Address[]
  const sym = tokenSymbol.trim().toUpperCase()
  const requestNeedsProject = withRequest && withProject
  const launchFeeText = fee > 0n && feeStable ? `${formatUnits(fee, 18)} ${feeStable.symbol}` : null

  function choosePurpose(p: Purpose) {
    setPurpose(p)
    setDirect(PRESETS[p].direct)
    setEscrow(PRESETS[p].escrow)
    if (p === "records") setReqSettle("0")
  }

  const steps: WizardStep[] = [
    {
      id: "basics", title: "Your workspace", caption: "What to call it and what it is for.",
      valid: !name.trim() ? "Give your workspace a name" : true,
      content: (
        <div className="grid gap-6">
          <Label title="Workspace name" hint="Shown in this app, in this browser. The public record holds addresses, not names.">
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Construction" autoFocus />
          </Label>
          <fieldset>
            <legend className="t-label">What will it be used for?</legend>
            <p className="mb-3 mt-0.5 text-sm text-muted-foreground">This sets sensible defaults for the next step. You can change them there.</p>
            <Choice<Purpose>
              value={purpose} onChange={choosePurpose} columns={2}
              options={[
                { value: "shop", title: PURPOSE_NAME.shop, description: "Sell your own vouchers, credits or memberships for stablecoins into your treasury, and take payments by link or QR code." },
                { value: "procurement", title: PURPOSE_NAME.procurement, description: "Post requests, suppliers make offers, and the one you choose is paid through escrow." },
                { value: "marketplace", title: PURPOSE_NAME.marketplace, description: "Suppliers list what they sell. Buyers take a listing and pay straight away or by escrow." },
                { value: "grants", title: PURPOSE_NAME.grants, description: "Every payment is tied to a request that donors and members can see." },
                { value: "records", title: PURPOSE_NAME.records, description: "Prove who asked, who was chosen and when. No money moves." },
              ]}
            />
          </fieldset>
        </div>
      ),
    },
    {
      id: "payments", title: "How people pay", caption: "“Just record it” always works. Switch on the ways that move money.",
      valid: paid && baseTokens.length === 0 ? "Choose at least one token people can pay in" : paid && !(Number(serviceFee) >= 0) ? "Enter a service fee (0 is fine)" : true,
      content: (
        <div className="grid gap-4">
          <AddOn checked={escrow} onChange={setEscrow} title="Hold it safely (escrow)" description="The buyer's money is locked in your workspace's vault. Only the buyer can release it to the supplier, only the supplier can hand it back, and at the deadline it returns to the buyer by itself." />
          <AddOn checked={direct} onChange={setDirect} title="Pay straight away (direct payment)" description="The supplier is paid from the buyer's wallet the moment an offer is chosen on a request or a listing is taken." />

          {paid && (
            <div className="mt-4 grid gap-4 border-t border-border pt-6">
              <div>
                <h3 className="t-subheading">Tokens you accept</h3>
                <p className="mt-1 text-sm text-muted-foreground">The money people can pay in here. Switch each one on or off; you can add more later in Settings.</p>
              </div>
              {STABLES.map((st) => (
                <AddOn key={st.address} checked={stables.includes(st.address)} onChange={(v) => setStables(v ? [...stables, st.address] : stables.filter((x) => x !== st.address))} title={st.symbol} tag={st.faucet ? "Free practice money" : undefined} description={st.name} />
              ))}
              {extraTokens.map((t) => (
                <div key={t} className="flex items-center justify-between gap-3 rounded-xl border border-border-strong/60 px-4 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-sm font-[560]">Added by address</span>
                    <span className="t-mono block break-all text-sm text-muted-foreground">{t}</span>
                  </span>
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setExtraTokens(extraTokens.filter((x) => x !== t))}>Remove</Button>
                </div>
              ))}
              <div>
                <label htmlFor="launch-add-token" className="t-label mb-1.5 block">Add another token</label>
                <div className="flex gap-2">
                  <input id="launch-add-token" className={cn(input, "t-mono min-w-0 flex-1")} value={newToken} onChange={(e) => setNewToken(e.target.value)} placeholder="0x…" autoComplete="off" spellCheck={false} />
                  <Button variant="secondary" className="shrink-0" disabled={!isAddress(newToken) || baseTokens.includes(newToken as Address)} onClick={() => { setExtraTokens([...extraTokens, newToken]); setNewToken("") }}>Add</Button>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">Paste the address of any standard token (ERC-20).</p>
              </div>
              <Label title="Service fee per payment" hint="A flat amount added to each payment and paid by the buyer, in units of the token being paid. It goes to BitRegalo and covers the network costs it pays on users' behalf. The same figure applies to every token above.">
                <input className={cn(input, "t-num max-w-40")} type="number" inputMode="decimal" min="0" step="any" value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} />
              </Label>
            </div>
          )}

          {!paid && <Note>With both switched off, your workspace records requests, offers and choices without moving money. You can switch payments on later in Settings.</Note>}

          {(launchFeeText || (paid && feeBps !== undefined)) && (
            <div className="mt-2 rounded-lg bg-secondary px-4 py-4">
              <h3 className="t-subheading">What it costs</h3>
              <dl className="mt-2 grid gap-2.5 text-sm">
                {launchFeeText && (
                  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                    <div className="max-w-[48ch]">
                      <dt className="font-[560]">To create the workspace</dt>
                      <dd className="text-muted-foreground"><span className="t-num text-foreground">{launchFeeText}</span>, paid once to BitRegalo when you sign.</dd>
                    </div>
                    {feeStable?.faucet && <FaucetButton />}
                  </div>
                )}
                {paid && feeBps !== undefined && (
                  <div className="max-w-[48ch]">
                    <dt className="font-[560]">On each payment, taken from the supplier</dt>
                    <dd className="text-muted-foreground"><span className="t-num text-foreground">{Number(feeBps) / 100}%</span> platform fee, fixed for this workspace when it is created.</dd>
                  </div>
                )}
                {paid && (
                  <div className="max-w-[48ch]">
                    <dt className="font-[560]">On each payment, paid by the buyer</dt>
                    <dd className="text-muted-foreground">The service fee you set above, <span className="t-num text-foreground">{serviceFee || "0"}</span> per payment.</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      ),
    },
  ]

  if (escrow) {
    steps.push({
      id: "rules", title: "Escrow rules", caption: "How long money may stay held in the vault.",
      valid: !(Number(minDays) > 0) || !(Number(maxDays) >= Number(minDays)) ? "The longest term must be at least the shortest" : Number(minDays) * 24 < 1 ? "The shortest term is at least one hour" : true,
      content: (
        <div className="grid gap-5 sm:grid-cols-2">
          <Label title="Shortest term (days)" hint="The soonest an escrow can be due. At least one hour, which is about 0.05 days.">
            <input className={cn(input, "t-num")} type="number" inputMode="decimal" min="0.05" step="any" value={minDays} onChange={(e) => setMinDays(e.target.value)} />
          </Label>
          <Label title="Longest term (days)" hint="The longest an escrow can run. Money not released by then goes back to the buyer by itself.">
            <input className={cn(input, "t-num")} type="number" inputMode="numeric" min="1" value={maxDays} onChange={(e) => setMaxDays(e.target.value)} />
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
        <AddOn checked={withProject} onChange={setWithProject} title="Start a project" description="A name that groups related work inside your workspace: a site, a programme, a product line. Requests and tokens can be linked to it." />
        <AddOn checked={withToken} onChange={setWithToken} title="Create your own token" description={paid ? "Credits, vouchers or memberships for your workspace. It is accepted as payment straight away." : "Credits, vouchers or memberships for your workspace. With payments off, it is created but not accepted as payment yet."} />
        <AddOn checked={withRequest} onChange={setWithRequest} title="Post your first request" description="Open a request so suppliers can start making offers as soon as your workspace is live." />
      </div>
    ),
  })

  if (withProject) {
    steps.push({
      id: "project", title: "Your first project", caption: "The name goes on the public record as readable text.",
      valid: !projectName.trim() ? "Name the project" : labelBytes(projectName) > 31 ? "At most 31 characters" : true,
      content: (
        <Label title="Project name" counter={`${labelBytes(projectName)}/31`} hint="Anyone can read it, so keep it to what you would put on a sign.">
          <input className={input} value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Riverside Stage 1" />
        </Label>
      ),
    })
  }
  if (withToken) {
    steps.push({
      id: "token", title: "Your token", caption: "The whole supply goes to your wallet. You can create more later.",
      valid: !tokenName.trim() ? "Name the token" : !sym ? "Add a symbol" : !(Number(tokenSupply) > 0) ? "Enter a supply" : true,
      content: (
        <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
          <Label title="Token name" hint="The full name, as people will see it."><input className={input} value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder={name ? `${name} Credits` : "Acme Credits"} /></Label>
          <Label title="Symbol" counter={`${sym.length}/11`} hint="Letters and numbers only."><input className={input} maxLength={11} value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())} placeholder="ACME" autoCapitalize="characters" autoComplete="off" spellCheck={false} /></Label>
          <div className="sm:col-span-2">
            <Label title="Initial supply" hint="How many exist to begin with. This is a standard token (ERC-20, 18 decimals) and you stay able to create more. For a fixed or capped supply, use “Create a token” after launch instead.">
              <input className={cn(input, "t-num")} type="number" inputMode="numeric" min="1" value={tokenSupply} onChange={(e) => setTokenSupply(e.target.value)} />
            </Label>
          </div>
        </div>
      ),
    })
  }
  if (withRequest) {
    const settleOpts = [
      { value: "2" as Pay, title: "Hold it safely", description: "The money is locked when you choose an offer and released when you say so.", disabled: escrow ? undefined : "Escrow is switched off for this workspace" },
      { value: "1" as Pay, title: "Pay straight away", description: "The supplier is paid the moment you choose their offer.", disabled: direct ? undefined : "Direct payment is switched off for this workspace" },
      { value: "0" as Pay, title: "Just record it", description: "No money moves." },
    ]
    steps.push({
      id: "request", title: "Your first request", caption: "Suppliers answer with offers. You choose one.",
      valid: !reqTitle.trim() ? "Say what you need" : labelBytes(reqTitle) > 31 ? "Keep the public title to 31 characters" : !(Number(reqDays) >= 1) ? "Offers need to stay open for at least a day" : reqSettle !== "0" && reqCurrency === "usdt" && !useUsdt ? "USDT is not one of the tokens you accept" : true,
      content: (
        <div className="grid gap-6">
          <Label title="What do you need?" counter={`${labelBytes(reqTitle)}/31`} hint="A short public title. Share the details with suppliers yourself.">
            <input className={input} value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} placeholder="Scaffolding for 12 weeks" />
          </Label>
          <fieldset>
            <legend className="t-label mb-2">How will the chosen supplier be paid?</legend>
            <Choice<Pay> value={reqSettle} onChange={setReqSettle} options={settleOpts} />
          </fieldset>
          {reqSettle !== "0" && (
            <fieldset>
              <legend className="t-label mb-2">In which token?</legend>
              <Choice<"usdt" | "own">
                value={reqCurrency} onChange={setReqCurrency} columns={2}
                options={[
                  { value: "usdt", title: "Pay in USDT", disabled: useUsdt ? undefined : "Not one of the tokens you accept" },
                  { value: "own", title: `Pay in ${sym || "your token"}`, disabled: withToken ? undefined : "Switch on “Create your own token” first" },
                ]}
              />
            </fieldset>
          )}
          <Label title="Offers stay open for (days)" hint="After this, no new offers can be made.">
            <input className={cn(input, "t-num max-w-40")} type="number" inputMode="numeric" min="1" value={reqDays} onChange={(e) => setReqDays(e.target.value)} />
          </Label>
        </div>
      ),
    })
  }

  // ── plan ────────────────────────────────────────────────────────────────
  const plan: WizardAction[] = []
  if (fee > 0n && deployFeeToken) {
    plan.push({ id: "fee", label: `Approve the launch fee (${formatUnits(fee, 18)} ${feeStable?.symbol ?? "tokens"})`, detail: "Gives BitRegalo's platform contract permission to collect the fee from your wallet.", run: async ({ tx }) => { await tx("Approve launch fee", { address: deployFeeToken, abi: abis.erc20, functionName: "approve", args: [addresses.mother, maxUint256] }) } })
  }
  plan.push({
    id: "launch", label: `Create “${name.trim() || "your workspace"}”`, detail: `BitRegalo's platform contract creates your workspace's own contracts, with you as admin.${launchFeeText ? ` The ${launchFeeText} fee is paid here.` : ""}`,
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
      id: "project", label: `Create the project “${projectName.trim()}”`, detail: "Its name goes on the public record.",
      run: async ({ tx, results }) => {
        const r = await tx("Create project", { address: results.instance as Address, abi: abis.instance, functionName: "createProject", args: [encodeLabel(projectName)] })
        results.projectId = eventArgs<{ projectId: bigint }>(r, abis.instance, "ProjectCreated").projectId
      },
    })
  }
  if (withToken) {
    plan.push({
      id: "token", label: `Create the token ${sym || "…"} (${tokenName.trim() || "…"})`, detail: `${Number(tokenSupply || 0).toLocaleString()} ${sym || "tokens"} go to your wallet${withProject ? ", linked to the project" : ""}.`,
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
        id: "accept", label: `Accept ${sym || "your token"} as payment`, detail: `Requests and listings in your workspace can then be paid in ${sym || "it"}, with the same service fee.`,
        run: async ({ tx, results }) => { await tx("Accept as payment", { address: results.instance as Address, abi: abis.instance, functionName: "setToken", args: [results.token, true, 18, parseUnits(serviceFee || "0", 18)] }) },
      })
    }
  }
  if (withRequest) {
    plan.push({
      id: "request", label: `Post the request “${reqTitle.trim()}”`, detail: `${reqSettle === "2" ? "Hold it safely (escrow)" : reqSettle === "1" ? "Pay straight away (direct payment)" : "Just record it"} · open for offers for ${reqDays} ${Number(reqDays) === 1 ? "day" : "days"}.`,
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

  const acceptedWords = paid
    ? [
        ...STABLES.filter((x) => stables.includes(x.address)).map((x) => x.symbol),
        ...(extraTokens.length > 0 ? [`${extraTokens.length} added by address`] : []),
        ...(withToken ? [sym || "your token"] : []),
      ].join(", ") || "none yet"
    : "None: nothing is paid here"
  const origin = typeof window !== "undefined" ? window.location.origin : ""

  return (
    <Wizard
      title="Create a workspace"
      intro="Your organisation's own space for selling, taking payments, posting requests and holding money in escrow. It runs on its own contracts, under the same rules as every other workspace. You are the admin, and its treasury belongs to you alone."
      steps={steps}
      plan={plan}
      signLabel="Create workspace"
      summary={[
        { label: "Workspace", value: name.trim() || "—" },
        { label: "Used for", value: PURPOSE_NAME[purpose] },
        { label: "Ways to settle", value: ["Just record it", escrow && "hold it safely (escrow)", direct && "pay straight away"].filter(Boolean).join(", ") },
        { label: "Accepted tokens", value: acceptedWords },
        ...(escrow ? [{ label: "Escrow term", value: `${minDays || "…"} to ${maxDays || "…"} days` }] : []),
        { label: "Platform fee", value: feeBps !== undefined ? `${Number(feeBps) / 100}% of each payment, from the supplier` : "…" },
        ...(paid ? [{ label: "Service fee", value: `${serviceFee || "0"} per payment, from the buyer` }] : []),
        ...(launchFeeText ? [{ label: "One-off cost", value: `${launchFeeText} to create it` }] : []),
        { label: "Extras", value: [withProject && "a project", withToken && "a token", withRequest && "a first request"].filter(Boolean).join(", ") || "none" },
        { label: "Transactions to sign", value: String(plan.length) },
      ]}
      done={(r) => (
        <Done
          title={`${name.trim()} is live`}
          actions={
            <>
              <Button asChild><Link href={`/app/t/${String(r.tenantId)}`}>Open your workspace</Link></Button>
              <Button asChild variant="secondary"><Link href={`/app/t/${String(r.tenantId)}/sales/new`}>Sell in the shop</Link></Button>
              {r.rfpId !== undefined && <Button asChild variant="secondary"><Link href={`/app/t/${String(r.tenantId)}/rfps/${String(r.rfpId)}`}>View your request</Link></Button>}
              {r.token !== undefined && <Button asChild variant="secondary"><Link href={`/app/t/${String(r.tenantId)}/tokens/${String(r.token)}`}>View {sym}</Link></Button>}
            </>
          }
        >
          <p>Workspace #{String(r.tenantId)} has its own records contract (<Addr a={String(r.instance)} />), vault (<Addr a={String(r.vault)} />) and treasury. You are its admin and the treasury&apos;s owner.</p>
          <p>Next, open your workspace: everything you set up is there. Share its link with suppliers and customers; anyone with a wallet can make offers, create listings and get paid through it.</p>
          <p className="t-mono break-all text-sm text-foreground">{origin}/app/t/{String(r.tenantId)}</p>
        </Done>
      )}
    />
  )
}
