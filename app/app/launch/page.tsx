"use client"
import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAccount, useReadContracts } from "wagmi"
import { formatUnits, isAddress, parseUnits, zeroAddress, type Address } from "viem"
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

export default function Launch() {
  return <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}><LaunchWizard /></Suspense>
}

function LaunchWizard() {
  const { address } = useAccount()
  // ?preset=public: the BitRegalo network's own workspace on the current contracts. Same steps, other defaults.
  const preset = useSearchParams().get("preset") === "public"
  const mother = useReadContracts({
    contracts: [
      { address: addresses.mother, abi: abis.mother, functionName: "deployFeeAmount" },
      { address: addresses.mother, abi: abis.mother, functionName: "deployFeeToken" },
      { address: addresses.mother, abi: abis.mother, functionName: "defaultFeeBps" },
      { address: addresses.mother, abi: abis.mother, functionName: "versionCount" },
      { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "creationFeeAmount" },
      { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "creationFeeToken" },
    ],
    // Kept fresh while the person reads: what they see at review is what they agree to.
    query: { refetchInterval: 20_000 },
  })
  const [deployFee, deployFeeTokenRaw, feeBps, versionCount, tokenFeeRaw, tokenFeeTokenRaw] = (mother.data ?? []).map((r) => r.result) as [bigint?, Address?, number?, bigint?, bigint?, Address?]
  const loaded = !!mother.data && feeBps !== undefined && deployFee !== undefined
  const fee = deployFee ?? 0n
  const deployFeeToken = deployFeeTokenRaw ?? zeroAddress
  const feeStable = STABLES.find((x) => x.address.toLowerCase() === deployFeeToken.toLowerCase())
  // The token factory's own fee, for the optional first token.
  const tokenFee = tokenFeeRaw ?? 0n
  const tokenFeeToken = tokenFeeTokenRaw ?? zeroAddress
  // Fees are amounts of someone else's token: read its symbol and decimals rather than assume them.
  const feeMeta = useReadContracts({
    contracts: [
      { address: deployFeeToken, abi: abis.utilityToken, functionName: "symbol" },
      { address: deployFeeToken, abi: abis.utilityToken, functionName: "decimals" },
      { address: tokenFeeToken, abi: abis.utilityToken, functionName: "symbol" },
      { address: tokenFeeToken, abi: abis.utilityToken, functionName: "decimals" },
    ],
    query: { enabled: fee > 0n || tokenFee > 0n },
  })
  const feeSymbol = (feeMeta.data?.[0]?.result as string | undefined) ?? feeStable?.symbol ?? "tokens"
  const feeDecimals = Number((feeMeta.data?.[1]?.result as number | undefined) ?? 18)
  const tokenFeeText = tokenFee > 0n ? `${formatUnits(tokenFee, Number((feeMeta.data?.[3]?.result as number | undefined) ?? 18))} ${(feeMeta.data?.[2]?.result as string | undefined) ?? "tokens"}` : null

  // basics
  const [name, setName] = useState(preset ? "BitRegalo network" : "")
  const [purpose, setPurpose] = useState<Purpose>(preset ? "marketplace" : "shop")
  // payments
  const [direct, setDirect] = useState(PRESETS[preset ? "marketplace" : "shop"].direct)
  const [escrow, setEscrow] = useState(PRESETS[preset ? "marketplace" : "shop"].escrow)
  const [stables, setStables] = useState<string[]>(STABLES.map((x) => x.address))
  const [extraTokens, setExtraTokens] = useState<string[]>([])
  const [newToken, setNewToken] = useState("")
  const [serviceFee, setServiceFee] = useState("0.1")
  const [minDays, setMinDays] = useState("1")
  const [maxDays, setMaxDays] = useState(preset ? "365" : "180")
  // add-ons
  const [withProject, setWithProject] = useState(!preset)
  const [withToken, setWithToken] = useState(false)
  const [withRequest, setWithRequest] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [tokenName, setTokenName] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [tokenSupply, setTokenSupply] = useState("1000000")
  const [reqTitle, setReqTitle] = useState("")
  const [reqSettle, setReqSettle] = useState<Pay>("2")
  const [reqCurrency, setReqCurrency] = useState<"stable" | "own">("stable")
  const [reqDays, setReqDays] = useState("7")

  const paid = direct || escrow
  const baseTokens = [...stables, ...extraTokens] as Address[]
  // The first stablecoin switched on: what a first request is paid in unless it uses the new token.
  const firstStable = STABLES.find((x) => stables.includes(x.address))
  // The service fee is typed in whole tokens; each token's own decimals turn it into units.
  const tokenDecimals = useReadContracts({
    contracts: baseTokens.map((a) => ({ address: a, abi: abis.utilityToken, functionName: "decimals" })),
    query: { enabled: baseTokens.length > 0 },
  })
  const decimalsOf = (i: number) => Number((tokenDecimals.data?.[i]?.result as number | undefined) ?? 18)
  const decimalsKnown = baseTokens.every((_, i) => tokenDecimals.data?.[i]?.result !== undefined)
  const sym = tokenSymbol.trim().toUpperCase()
  const requestNeedsProject = withRequest && withProject
  const launchFeeText = fee > 0n ? `${formatUnits(fee, feeDecimals)} ${feeSymbol}` : null
  const pct = feeBps !== undefined ? `${Number(feeBps) / 100}%` : "…"

  function choosePurpose(p: Purpose) {
    setPurpose(p)
    setDirect(PRESETS[p].direct)
    setEscrow(PRESETS[p].escrow)
    if (p === "records") setReqSettle("0")
  }

  const steps: WizardStep[] = [
    {
      id: "basics", title: preset ? "The public network" : "Your workspace", caption: preset ? "Its name in this app, and what it is for. Both are filled in for the network." : "What to call it and what it is for.",
      valid: !loaded ? "Reading the platform's fees…" : !name.trim() ? "Give your workspace a name" : true,
      content: (
        <div className="grid gap-6">
          <Label title="Workspace name" hint="Shown in this app, in this browser. The public record holds addresses, not names.">
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Construction" autoFocus={!preset} />
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
                { value: "records", title: PURPOSE_NAME.records, description: "Prove who asked, who was chosen and when. Nothing is paid." },
              ]}
            />
          </fieldset>
        </div>
      ),
    },
    {
      id: "payments", title: "How people pay", caption: "“Just record it” always works. Switch on the ways to pay.",
      valid: paid && baseTokens.length === 0 ? "Choose at least one token people can pay in" : paid && !(Number(serviceFee) >= 0) ? "Enter a service fee (0 is fine)" : paid && !decimalsKnown ? "One of the tokens does not answer like a token. Check the addresses you added" : true,
      content: (
        <div className="grid gap-4">
          <AddOn checked={escrow} onChange={setEscrow} title="Hold it safely (escrow)" description="The buyer's payment is locked in your workspace's vault. Only the buyer can release it to the supplier, and only the supplier can hand it back. After the deadline it can only go back to the buyer, and anyone can trigger that." />
          <AddOn checked={direct} onChange={setDirect} title="Pay straight away (direct payment)" description="The supplier is paid from the buyer's wallet the moment an offer is chosen on a request or a listing is taken." />

          {paid && (
            <div className="mt-4 grid gap-4 border-t border-border pt-6">
              <div>
                <h3 className="t-subheading">Tokens you accept</h3>
                <p className="mt-1 text-sm text-muted-foreground">What people can pay with here. Switch each one on or off; you can add more later in Settings.</p>
              </div>
              {STABLES.map((st) => (
                <AddOn key={st.address} checked={stables.includes(st.address)} onChange={(v) => setStables(v ? [...stables, st.address] : stables.filter((x) => x !== st.address))} title={st.symbol} tag={st.faucet ? "Free practice token" : undefined} description={st.name} />
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
              <Label title="Service fee per payment" hint="A flat amount added to each payment and paid by the buyer, in units of the token being paid. It goes to BitRegalo. Network fees are separate: each person pays their own. The same figure applies to every token above.">
                <input className={cn(input, "t-num max-w-40")} type="number" inputMode="decimal" min="0" step="any" value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} />
              </Label>
            </div>
          )}

          {!paid && <Note>With both switched off, your workspace records requests, offers and choices, and nothing is paid through it. You can switch payments on later in Settings.</Note>}

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
                    <dd className="text-muted-foreground"><span className="t-num text-foreground">{Number(feeBps) / 100}%</span> platform fee. This percentage is fixed into the workspace when it is created and never changes for it.</dd>
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
      id: "rules", title: "Escrow rules", caption: "How long a payment may stay held in the vault.",
      valid: !(Number(minDays) > 0) || !(Number(maxDays) >= Number(minDays)) ? "The longest term must be at least the shortest" : Number(minDays) * 24 < 1 ? "The shortest term is at least one hour" : true,
      content: (
        <div className="grid gap-5 sm:grid-cols-2">
          <Label title="Shortest term (days)" hint="The soonest an escrow can be due. At least one hour, which is about 0.05 days.">
            <input className={cn(input, "t-num")} type="number" inputMode="decimal" min="0.05" step="any" value={minDays} onChange={(e) => setMinDays(e.target.value)} />
          </Label>
          <Label title="Longest term (days)" hint="The longest an escrow can run. A payment not released by its deadline can only go back to the buyer.">
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
        <AddOn checked={withToken} onChange={setWithToken} title="Create your own token" tag={tokenFeeText ? `Costs ${tokenFeeText}` : undefined} description={paid ? "Credits, vouchers or memberships for your workspace. It is accepted as payment straight away." : "Credits, vouchers or memberships for your workspace. With payments off, it is created but not accepted as payment yet."} />
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
      { value: "2" as Pay, title: "Hold it safely", description: "The payment is locked when you choose an offer and released when you say so.", disabled: escrow ? undefined : "Escrow is switched off for this workspace" },
      { value: "1" as Pay, title: "Pay straight away", description: "The supplier is paid the moment you choose their offer.", disabled: direct ? undefined : "Direct payment is switched off for this workspace" },
      { value: "0" as Pay, title: "Just record it", description: "Nothing is paid." },
    ]
    steps.push({
      id: "request", title: "Your first request", caption: "Suppliers answer with offers. You choose one.",
      valid: !reqTitle.trim() ? "Say what you need" : labelBytes(reqTitle) > 31 ? "Keep the public title to 31 characters" : !(Number(reqDays) >= 1) ? "Offers need to stay open for at least a day" : reqSettle !== "0" && reqCurrency === "stable" && !firstStable ? "No stablecoin is switched on for this workspace" : reqSettle !== "0" && reqCurrency === "own" && !withToken ? "Switch on “Create your own token” first" : true,
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
              <Choice<"stable" | "own">
                value={reqCurrency} onChange={setReqCurrency} columns={2}
                options={[
                  { value: "stable", title: `Pay in ${firstStable?.symbol ?? "a stablecoin"}`, disabled: firstStable ? undefined : "No stablecoin is switched on above" },
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
  if (fee > 0n) {
    plan.push({ id: `fee-${fee}`, label: `Approve the launch fee of ${launchFeeText}`, detail: "Lets BitRegalo's platform contract take exactly this amount from your wallet, and no more.", run: async ({ tx }) => { await tx("Approve launch fee", { address: deployFeeToken, abi: abis.erc20, functionName: "approve", args: [addresses.mother, fee] }) } })
  }
  plan.push({
    id: "launch", label: `Create “${name.trim() || "your workspace"}”`, detail: `BitRegalo's platform contract creates your workspace's own contracts, with you as admin.${launchFeeText ? ` The ${launchFeeText} fee is paid here.` : ""} The platform fee of ${pct} is fixed into the workspace.`,
    run: async ({ tx, results }) => {
      const version = ((versionCount as bigint | undefined) ?? 1n) - 1n
      const r = await tx("Launch workspace", {
        address: addresses.mother, abi: abis.mother, functionName: "launchTenant",
        args: [
          {
            admin: address!, version, tokens: paid ? baseTokens : [],
            serviceFees: paid ? baseTokens.map((_, i) => parseUnits(serviceFee || "0", decimalsOf(i))) : [],
            minTerm: BigInt(Math.max(3600, Math.round(Number(minDays) * 86400))), maxTerm: BigInt(Math.round(Number(maxDays) * 86400)),
            kycRequired: false, attester: zeroAddress, directEnabled: direct, escrowEnabled: escrow,
          },
          // What this wallet agrees to, exactly as shown at review: the fee's token, the most of it to pay,
          // and the highest platform percentage to accept. If the platform changed any of them, the launch is refused.
          { feeToken: deployFeeToken, maxDeployFee: fee, maxFeeBps: Number(feeBps) },
        ],
      })
      // A workspace's number is only known from its launch: read it from the event, never assume it.
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
    if (tokenFee > 0n) {
      plan.push({ id: `token-fee-${tokenFee}`, label: `Approve the token creation fee of ${tokenFeeText}`, detail: "Lets the token factory take exactly this amount from your wallet, and no more.", run: async ({ tx }) => { await tx("Approve creation fee", { address: tokenFeeToken, abi: abis.erc20, functionName: "approve", args: [addresses.tokenFactory, tokenFee] }) } })
    }
    plan.push({
      id: "token", label: `Create the token ${sym || "…"} (${tokenName.trim() || "…"})`, detail: `${Number(tokenSupply || 0).toLocaleString()} ${sym || "tokens"} go to your wallet${withProject ? ", linked to the project" : ""}.${tokenFeeText ? ` The ${tokenFeeText} fee is paid here.` : ""}`,
      run: async ({ tx, results }) => {
        const r = await tx("Create token", {
          address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "createToken",
          // You are the new workspace's admin, so you may create its token. You own it and receive the supply.
          args: [
            { name: tokenName.trim(), symbol: sym, decimals: 18, cap: 0n, initialSupply: parseUnits(tokenSupply, 18), tenantId: results.tenantId as bigint, projectId: (results.projectId as bigint | undefined) ?? 0n },
            tokenFeeToken,
            tokenFee,
          ],
        })
        results.token = eventArgs<{ token: Address }>(r, abis.tokenFactory, "TokenCreated").token
      },
    })
    if (paid) {
      plan.push({
        id: "accept", label: `Accept ${sym || "your token"} as payment`, detail: `Requests and listings in your workspace can then be paid in ${sym || "it"}, with the same service fee.`,
        run: async ({ tx, results }) => { await tx("Accept as payment", { address: results.instance as Address, abi: abis.instance, functionName: "setToken", args: [results.token, true, parseUnits(serviceFee || "0", 18)] }) },
      })
    }
  }
  if (withRequest) {
    plan.push({
      id: "request", label: `Post the request “${reqTitle.trim()}”`, detail: `${reqSettle === "2" ? "Hold it safely (escrow)" : reqSettle === "1" ? "Pay straight away (direct payment)" : "Just record it"} · open for offers for ${reqDays} ${Number(reqDays) === 1 ? "day" : "days"}.`,
      run: async ({ tx, results }) => {
        const token = reqSettle === "0" ? zeroAddress : reqCurrency === "own" ? (results.token as Address) : firstStable!.address
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
      title={preset ? "Create the public network" : "Create a workspace"}
      intro={
        preset
          ? "This creates the BitRegalo network's new workspace on the current contracts: open to everyone, with escrow and direct payments in tUSD and USDT. Your wallet signs as its admin. Once it exists, BitRegalo points the app at it, and everything people do on the network is recorded there."
          : "Your organisation's own workspace: its own contracts, rules and fees, the currencies it accepts, its tokens, shop and treasury. Everything done in it is recorded under it, apart from the BitRegalo network, whether people use this app or a platform you connect. You are its admin, and its treasury belongs to you alone."
      }
      steps={steps}
      plan={plan}
      signLabel={preset ? "Create the public network" : "Create workspace"}
      summary={[
        { label: "Workspace", value: name.trim() || "—" },
        { label: "Used for", value: PURPOSE_NAME[purpose] },
        { label: "Ways to settle", value: ["Just record it", escrow && "hold it safely (escrow)", direct && "pay straight away"].filter(Boolean).join(", ") },
        { label: "Accepted tokens", value: acceptedWords },
        ...(escrow ? [{ label: "Escrow term", value: `${minDays || "…"} to ${maxDays || "…"} days` }] : []),
        { label: "Platform fee", value: feeBps !== undefined ? `${pct} of each payment, taken from the supplier. Fixed into this workspace for good` : "…" },
        ...(paid ? [{ label: "Service fee", value: `${serviceFee || "0"} per payment, from the buyer` }] : []),
        { label: "Launch fee", value: !loaded ? "…" : launchFeeText ? `${launchFeeText}, paid once when you sign` : "None" },
        ...(withToken && tokenFeeText ? [{ label: "Token creation fee", value: `${tokenFeeText}, paid once` }] : []),
        { label: "Extras", value: [withProject && "a project", withToken && "a token", withRequest && "a first request"].filter(Boolean).join(", ") || "none" },
        { label: "Transactions to sign", value: String(plan.length) },
      ]}
      done={(r) => preset ? (
        <Done
          title="The new public network is created"
          actions={
            <>
              <Button asChild><Link href="/app/operator">Back to Platform and earnings</Link></Button>
              <Button asChild variant="secondary"><Link href={`/app/t/${String(r.tenantId)}`}>Open workspace #{String(r.tenantId)}</Link></Button>
            </>
          }
        >
          <p className="t-figure text-foreground">Workspace #{String(r.tenantId)}</p>
          <p className="text-foreground">Tell BitRegalo: workspace #{String(r.tenantId)} is the new public network.</p>
          <p>It has its own records contract (<Addr a={String(r.instance)} />), vault (<Addr a={String(r.vault)} />) and treasury, and your wallet is its admin. Until the app is pointed at it, the network at /app still runs on its old workspace. After that one setting changes, everything people do on the network is recorded in workspace #{String(r.tenantId)}.</p>
        </Done>
      ) : (
        <Done
          title={`${name.trim()} is live`}
          actions={
            <>
              <Button asChild><Link href={`/app/t/${String(r.tenantId)}`}>Open your workspace</Link></Button>
              <Button asChild variant="secondary"><Link href={`/app/t/${String(r.tenantId)}/shop/new`}>Sell in the shop</Link></Button>
              <Button asChild variant="secondary"><Link href={`/app/t/${String(r.tenantId)}/connect`}>Connect your platform</Link></Button>
              {r.rfpId !== undefined && <Button asChild variant="secondary"><Link href={`/app/t/${String(r.tenantId)}/requests/${String(r.rfpId)}`}>View your request</Link></Button>}
              {r.token !== undefined && <Button asChild variant="secondary"><Link href={`/app/t/${String(r.tenantId)}/tokens/${String(r.token)}`}>View {sym}</Link></Button>}
            </>
          }
        >
          <p>Workspace #{String(r.tenantId)} has its own records contract (<Addr a={String(r.instance)} />), vault (<Addr a={String(r.vault)} />) and treasury. You are its admin and the treasury&apos;s owner.</p>
          <p>Next, open your workspace: everything you set up is there. Share its link with suppliers and customers; anyone with a wallet can make offers, create listings and get paid through it. To use it from your own site or app, see its Connect a platform page.</p>
          <p className="t-mono break-all text-sm text-foreground">{origin}/app/t/{String(r.tenantId)}</p>
        </Done>
      )}
    />
  )
}
