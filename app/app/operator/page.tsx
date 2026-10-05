"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { isAddress, parseUnits, type Address } from "viem"
import { useTx } from "@/lib/bitregalo/hooks"
import { useInstances, useTokensOf } from "@/lib/bitregalo/instances"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { abis, addresses, versions, PUBLIC_WORKSPACE_ID, STABLES, network } from "@/lib/bitregalo/config"
import { deployment } from "@/components/app/admin/use-platform"
import { PaymasterPanel } from "@/components/app/admin/paymaster-panel"
import { Addr, Amount, Card, Empty, Fact, Facts, Field, LedgerRow, Notice, PageHead, Pill, Section, Stat, Stats, inputCls } from "@/components/app/ui"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** The shared ERC-4337 EntryPoint, where the paymaster keeps its deposit. Not a BitRegalo contract. */
const entryPointAbi = [{ type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] }] as const
const isZero = (a?: string) => !a || /^0x0{40}$/.test(a)

export default function Platform() {
  const { address } = useAccount()
  const { send, isPending } = useTx()
  const head = useReadContracts({
    contracts: [
      { address: addresses.mother, abi: abis.ownable, functionName: "owner" },
      { address: addresses.mother, abi: abis.ownable, functionName: "pendingOwner" },
      { address: addresses.treasury, abi: abis.ownable, functionName: "owner" },
      { address: addresses.treasury, abi: abis.ownable, functionName: "pendingOwner" },
      { address: addresses.tokenFactory, abi: abis.ownable, functionName: "owner" },
      { address: addresses.tokenFactory, abi: abis.ownable, functionName: "pendingOwner" },
      { address: addresses.mother, abi: abis.mother, functionName: "tenantCount" },
      { address: addresses.mother, abi: abis.mother, functionName: "defaultFeeBps" },
      { address: addresses.mother, abi: abis.mother, functionName: "deployFeeAmount" },
      { address: addresses.mother, abi: abis.mother, functionName: "deployFeeToken" },
      { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "creationFeeAmount" },
      { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "creationFeeToken" },
      { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tokenCount" },
      { address: deployment.entryPoint, abi: entryPointAbi, functionName: "balanceOf", args: [addresses.paymaster] },
      { address: addresses.mother, abi: abis.mother, functionName: "versionCount" },
    ],
    query: { refetchInterval: 15_000 },
  })
  const r = (head.data ?? []).map((x) => x.result)
  const [mOwner, mPending, tOwner, tPending, fOwner, fPending, tenantCount, feeBps, deployFee, deployFeeToken, tokenFee, tokenFeeToken, tokenCount, gasDeposit, versionCount] = r as [Address?, Address?, Address?, Address?, Address?, Address?, bigint?, number?, bigint?, Address?, bigint?, Address?, bigint?, bigint?, bigint?]
  const symbolOf = (a?: string) => STABLES.find((x) => x.address.toLowerCase() === (a ?? "").toLowerCase())?.symbol ?? "tokens"
  const deployFeeSym = symbolOf(deployFeeToken)
  const tokenFeeSym = symbolOf(tokenFeeToken)
  const registered = Number(versionCount ?? 0n)
  const unregistered = versions.filter((v) => v.n >= registered)
  const me = address?.toLowerCase()
  const isOwner = !!me && mOwner?.toLowerCase() === me
  const ownsTreasury = !!me && tOwner?.toLowerCase() === me

  // The BitRegalo network at /app is one ordinary workspace, chosen in the app's settings.
  const pub = useReadContract({ address: addresses.mother, abi: abis.mother, functionName: "tenants", args: [PUBLIC_WORKSPACE_ID] })
  const pubT = pub.data as { instance: Address; vault: Address; version: bigint } | undefined
  const latest = versionCount !== undefined && registered > 0 ? registered - 1 : null
  const pubVersion = pubT ? Number(pubT.version) : null
  const pubBehind = pubVersion !== null && latest !== null && pubVersion < latest
  // The owner pays the launch fee like anyone else; check they hold enough of the fee token.
  const feeBalance = useReadContract({
    address: deployFeeToken, abi: abis.erc20, functionName: "balanceOf", args: [address!],
    query: { enabled: !!address && !!deployFeeToken && isOwner, refetchInterval: 15_000 },
  })
  const feeShort = isOwner && deployFee !== undefined && deployFee > 0n && feeBalance.data !== undefined && (feeBalance.data as bigint) < deployFee
  const canSwitchFeeToTest = !!addresses.testStable && deployFeeToken?.toLowerCase() !== addresses.testStable.toLowerCase()
  // "Set" is the mother's own numbering of the contract sets registered on this network, oldest first.
  const versionName = (v: number | null) => (v === null ? "…" : v === latest ? `The newest registered set (set ${v})` : `An earlier set (set ${v})`)

  // Every workspace, and every token the factory created for one: fees can arise in any of them.
  const nameOf = useWorkspaceName()
  const ws = useInstances()
  const created = useTokensOf(ws.list)
  const candidatesOf = (id: bigint) => Array.from(new Set([...STABLES.map((x) => x.address), ...created.of(id).map((x) => x.address)]))
  const tokenList = Array.from(new Set([...STABLES.map((x) => x.address), ...ws.list.flatMap((w) => created.of(w.id).map((x) => x.address))]))
  const bal = useReadContracts({
    contracts: tokenList.flatMap((t) => [
      { address: t, abi: abis.utilityToken, functionName: "symbol" },
      { address: t, abi: abis.utilityToken, functionName: "decimals" },
      { address: t, abi: abis.erc20, functionName: "balanceOf", args: [addresses.treasury] },
    ]),
    query: { refetchInterval: 15_000 },
  })
  const earnings = tokenList.map((t, i) => ({
    token: t,
    symbol: (bal.data?.[i * 3]?.result as string) ?? "…",
    decimals: Number((bal.data?.[i * 3 + 1]?.result as number) ?? 18),
    amount: (bal.data?.[i * 3 + 2]?.result as bigint) ?? 0n,
  }))
  const earningAny = earnings.some((e) => e.amount > 0n)
  const metaOf = (token: string) => earnings.find((e) => e.token.toLowerCase() === token.toLowerCase())

  // Fees are kept in each workspace's vault as payments happen, until someone sends them on.
  const waitingRefs = ws.list.flatMap((w) => candidatesOf(w.id).map((token) => ({ w, token })))
  const waitingQ = useReadContracts({
    contracts: waitingRefs.map((x) => ({ address: x.w.vault, abi: abis.vault, functionName: "accruedFees", args: [x.token] })),
    query: { enabled: waitingRefs.length > 0, refetchInterval: 15_000 },
  })
  const waiting = waitingRefs.map((x, i) => ({ ...x, amount: (waitingQ.data?.[i]?.result as bigint | undefined) ?? 0n })).filter((x) => x.amount > 0n)

  const [newFee, setNewFee] = useState("")
  const [newLaunch, setNewLaunch] = useState("")
  const [launchToken, setLaunchToken] = useState<string>(STABLES[0]?.address ?? "")
  const [newTokenFee, setNewTokenFee] = useState("")
  const [tokenFeeIn, setTokenFeeIn] = useState<string>(STABLES[0]?.address ?? "")
  const [handover, setHandover] = useState<{ contract: string; to: string }>({ contract: addresses.mother, to: "" })
  const refresh = () => { head.refetch(); bal.refetch(); waitingQ.refetch() }

  const pending = [
    { label: "Platform rules", addr: addresses.mother, pending: mPending },
    { label: "Platform fee treasury", addr: addresses.treasury, pending: tPending },
    { label: "Token maker", addr: addresses.tokenFactory, pending: fPending },
  ].filter((p) => !!me && p.pending?.toLowerCase() === me)

  const contracts = [
    { name: "Platform rules", tech: "BitRegaloMother", what: "Creates new workspaces and holds the fee settings. Cannot touch anyone's tokens.", addr: addresses.mother, owner: mOwner, pending: mPending },
    { name: "Platform fee treasury", tech: "Treasury", what: "Receives every fee. Only its owner can withdraw.", addr: addresses.treasury, owner: tOwner, pending: tPending },
    { name: "Token maker", tech: "TokenFactory", what: "Creates tokens for workspaces and projects.", addr: addresses.tokenFactory, owner: fOwner, pending: fPending },
  ]
  const owned = contracts.filter((c) => !!me && c.owner?.toLowerCase() === me)

  const count = (v: bigint | undefined) => (v === undefined ? "…" : String(v))
  const fees = [
    {
      name: "Platform fee",
      value: feeBps !== undefined ? `${Number(feeBps) / 100}%` : "…",
      body: "Taken from what the supplier receives whenever a direct payment is made or an escrow is released. Each workspace keeps the rate it was created with, so a change applies to new workspaces only. The contract caps it at 5%.",
    },
    {
      name: "Service fee",
      value: "Set per workspace",
      body: "A flat amount the buyer pays on top of each payment. Each workspace admin sets it per token when creating the workspace, or later in its Settings.",
    },
    {
      name: "Workspace launch fee",
      value: deployFee !== undefined ? (deployFee > 0n ? <><Amount value={deployFee} /> {deployFeeSym}</> : "Free") : "…",
      body: "Paid once by an organisation when it creates its workspace.",
    },
    {
      name: "Token creation fee",
      value: tokenFee !== undefined ? (tokenFee > 0n ? <><Amount value={tokenFee} /> {tokenFeeSym}</> : "Free") : "…",
      body: "Paid once each time someone creates a token.",
    },
  ]

  return (
    <div className="space-y-12">
      <PageHead
        title="Platform and earnings"
        intro="BitRegalo's own view: the fees the platform has earned, the deposit set aside for sponsoring network fees, and its contract versions. Anyone can look. Only the owner's wallet can change anything."
      />

      <Notice tone="muted">
        <p>
          {isOwner
            ? "Your connected wallet is the platform owner, so the owner-only controls on this page are live for you."
            : address
              ? "Your connected wallet is not the platform owner, so this page is read-only for you."
              : "No wallet is connected, so this page is read-only. Connect the owner's wallet to change settings or withdraw."}
        </p>
      </Notice>

      {pending.length > 0 && (
        <Notice tone="accent" title="Ownership offered to your wallet">
          <p>Control of these contracts has been offered to your wallet. Until you accept, the previous owner still holds them.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pending.map((p) => (
              <Button key={p.addr} disabled={isPending} onClick={() => send(`Accept ${p.label}`, { address: p.addr, abi: abis.ownable, functionName: "acceptOwnership", args: [] }).then(refresh)}>
                Accept {p.label}
              </Button>
            ))}
          </div>
        </Notice>
      )}

      <Section title="The public network" description="The BitRegalo network at /app runs on one ordinary workspace that BitRegalo operates. Which one is a setting of the app.">
        <Card>
          <Facts columns={3}>
            <Fact label="Runs on">Workspace #{String(PUBLIC_WORKSPACE_ID)}</Fact>
            <Fact label="Its contracts">{versionName(pubVersion)}</Fact>
            <Fact label="Newest registered">{latest === null ? "…" : `Set ${latest}`}</Fact>
          </Facts>
          <div className="mt-6 border-t border-border pt-5">
            {pubBehind ? (
              <div className="grid gap-4">
                <p className="max-w-[62ch] text-sm text-muted-foreground">
                  The network runs on an earlier set of contracts than the newest registered one. A workspace keeps the contracts it was
                  created with, so moving the network means creating a new public workspace on the newest set.{" "}
                  {deployFee === 0n
                    ? "Creating it is free: there is no launch fee right now."
                    : <>Creating it costs the normal launch fee{deployFee !== undefined && <> of <span className="t-num text-foreground"><Amount value={deployFee} /> {deployFeeSym}</span></>}, in practice tokens.</>}{" "}
                  Once it exists, the app is pointed at it: one setting, the public workspace number, which BitRegalo changes.
                </p>
                {isOwner && feeShort ? (
                  <Notice tone="accent" title={`First: your wallet has no ${deployFeeSym} for the launch fee`}
                    action={canSwitchFeeToTest ? (
                      <Button disabled={isPending} onClick={() => send("Charge the launch fee in tUSD", { address: addresses.mother, abi: abis.mother, functionName: "setDeployFee", args: [addresses.testStable!, deployFee!] }).then(refresh)}>
                        Charge it in tUSD instead
                      </Button>
                    ) : undefined}>
                    <p>
                      The launch fee is paid in {deployFeeSym}, and this wallet holds none.{" "}
                      {canSwitchFeeToTest
                        ? "On the practice network the fee is better charged in tUSD, which anyone can take from the faucet. One signature switches it, keeping the same amount; then create the network."
                        : "Take practice tokens from the faucet first, then create the network."}
                    </p>
                  </Notice>
                ) : isOwner ? (
                  <div><Button asChild><Link href="/app/launch?preset=public">Create the public network on the newest contracts</Link></Button></div>
                ) : (
                  <p className="text-sm text-muted-foreground">Only the platform owner creates it. {address ? "Your connected wallet is not the owner." : "Connect the owner's wallet to do it."}</p>
                )}
              </div>
            ) : (
              <p className="max-w-[62ch] text-sm text-muted-foreground">
                {pubVersion === null || latest === null ? "Reading the network's contracts…" : "The network runs on the newest registered contracts. Nothing to do."}
              </p>
            )}
          </div>
        </Card>
      </Section>

      <Stats>
        <Stat label="Workspaces" value={count(tenantCount)} hint="launched so far" />
        <Stat label="Tokens created" value={count(tokenCount)} hint="through the token maker" />
        <Stat label="Platform fee" value={feeBps !== undefined ? `${Number(feeBps) / 100}%` : "…"} hint="of each payment, new workspaces" />
        <Stat label="Sponsored gas" value={gasDeposit !== undefined ? <Amount value={gasDeposit} symbol={network.nativeSymbol} /> : "…"} hint="on deposit; not in use yet" />
      </Stats>

      <Section
        title="Fees waiting in workspace vaults"
        description="The platform fee and the service fee are kept in each workspace's vault as payments happen. They reach the platform fee treasury when someone sends them on. Anyone may do that; it only costs the network fee, and it cannot touch a held payment."
      >
        <Card flush>
          {(ws.isLoading || created.isLoading || (waitingRefs.length > 0 && !waitingQ.data)) && waiting.length === 0 && <p className="px-5 py-4 text-sm text-muted-foreground sm:px-6" role="status">Reading the vaults…</p>}
          {!ws.isLoading && !created.isLoading && (waitingRefs.length === 0 || !!waitingQ.data) && waiting.length === 0 && (
            <Empty title="Nothing is waiting" body="Fees appear here after a direct payment, a sale, or the release of a held payment in any workspace." />
          )}
          {waiting.map((x) => {
            const m = metaOf(x.token)
            return (
              <LedgerRow
                key={`${x.w.id}-${x.token}`}
                title={m?.symbol ?? "…"}
                meta={<>In the vault of {nameOf(x.w.id)} · <Addr a={x.w.vault} /></>}
                amount={<Amount value={x.amount} decimals={m?.decimals ?? 18} symbol={m?.symbol ?? ""} />}
                status={
                  <Button size="sm" variant="secondary" disabled={isPending || !address} onClick={() => send(`Send ${m?.symbol ?? "fees"} to the platform fee treasury`, { address: x.w.vault, abi: abis.vault, functionName: "collectFees", args: [x.token] }).then(refresh)}>
                    Send to the platform fee treasury
                  </Button>
                }
              />
            )
          })}
        </Card>
        {!address && waiting.length > 0 && <p className="mt-3 text-sm text-muted-foreground">Connect any wallet to send them on.</p>}
      </Section>

      <Section title="In the platform fee treasury" description="What the platform fee treasury holds now: launch and token fees, and the fees sent on from workspace vaults, not yet withdrawn.">
        <Card flush>
          {earnings.map((e) => (
            <LedgerRow
              key={e.token}
              title={e.symbol}
              meta={<Addr a={e.token} />}
              amount={<Amount value={e.amount} decimals={e.decimals} />}
              status={
                ownsTreasury && e.amount > 0n ? (
                  <Button size="sm" variant="secondary" disabled={isPending} onClick={() => send(`Withdraw ${e.symbol}`, { address: addresses.treasury, abi: abis.treasury, functionName: "sweep", args: [e.token, address, e.amount] }).then(refresh)}>
                    Withdraw
                  </Button>
                ) : undefined
              }
            />
          ))}
          <div className="border-t border-border px-5 py-3 sm:px-6">
            <p className="max-w-[68ch] text-sm text-muted-foreground">
              {!earningAny && bal.data && <>Nothing is here yet. Launch and token fees arrive straight away. Fees from payments arrive when someone sends them on from a workspace vault. </>}
              Only the treasury&apos;s owner, <Addr a={String(tOwner ?? "")} />, can withdraw. A withdrawal sends the whole balance of that token to the owner&apos;s wallet.
            </p>
          </div>
        </Card>
      </Section>

      <Section title="Where the fees come from" description="Four kinds of fee, all ending in the platform fee treasury.">
        <Card flush>
          <dl>
            {fees.map((f) => (
              <div key={f.name} className="border-b border-border px-5 py-4 last:border-b-0 sm:px-6">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-base font-[560]">{f.name}</dt>
                  <dd className="t-num shrink-0 text-right text-base font-[560]">{f.value}</dd>
                </div>
                <dd className="mt-0.5 max-w-[62ch] text-sm text-muted-foreground">{f.body}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {isOwner ? (
          <Card className="mt-6" title="Change the fees" description="Owner only. Each change is a transaction your wallet signs and takes effect once it confirms.">
            <div className="grid gap-8">
              <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
                <Field label="Platform fee for new workspaces (%)" hint={`Between 0 and 5. Now ${feeBps !== undefined ? `${Number(feeBps) / 100}%` : "…"}. Workspaces that already exist keep their rate. A workspace being created at a lower rate than the new one is refused, not created at the higher rate.`}>
                  <input className={cn(inputCls, "t-num max-w-40")} type="number" inputMode="decimal" min="0" max="5" step="0.1" value={newFee} onChange={(e) => setNewFee(e.target.value)} />
                </Field>
                <div>
                  <Button variant="secondary" disabled={isPending || !(Number(newFee) >= 0 && Number(newFee) <= 5) || newFee === ""} onClick={() => send("Set platform fee", { address: addresses.mother, abi: abis.mother, functionName: "setDefaultFeeBps", args: [Math.round(Number(newFee) * 100)] }).then(refresh)}>
                    Save platform fee
                  </Button>
                </div>
              </form>

              <form className="grid gap-4 border-t border-border pt-8" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-4 sm:grid-cols-[10rem_12rem]">
                  <Field label="Workspace launch fee">
                    <input className={cn(inputCls, "t-num")} type="number" inputMode="decimal" min="0" value={newLaunch} onChange={(e) => setNewLaunch(e.target.value)} />
                  </Field>
                  <Field label="Paid in">
                    <select className={inputCls} value={launchToken} onChange={(e) => setLaunchToken(e.target.value)}>
                      {STABLES.map((x) => <option key={x.address} value={x.address}>{x.symbol}</option>)}
                    </select>
                  </Field>
                </div>
                <p className="max-w-[62ch] text-sm text-muted-foreground">Paid once when a workspace is created. On the practice network, charge it in tUSD so anyone can pay it from the faucet. 0 makes it free. Someone who is creating a workspace at the old fee is refused, not charged more.</p>
                <div>
                  <Button variant="secondary" disabled={isPending || newLaunch === "" || !isAddress(launchToken)} onClick={() => send("Set launch fee", { address: addresses.mother, abi: abis.mother, functionName: "setDeployFee", args: [launchToken, parseUnits(newLaunch || "0", 18)] }).then(refresh)}>
                    Save launch fee
                  </Button>
                </div>
              </form>

              {fOwner?.toLowerCase() === me && (
                <form className="grid gap-4 border-t border-border pt-8" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid gap-4 sm:grid-cols-[10rem_12rem]">
                    <Field label="Token creation fee">
                      <input className={cn(inputCls, "t-num")} type="number" inputMode="decimal" min="0" value={newTokenFee} onChange={(e) => setNewTokenFee(e.target.value)} />
                    </Field>
                    <Field label="Paid in">
                      <select className={inputCls} value={tokenFeeIn} onChange={(e) => setTokenFeeIn(e.target.value)}>
                        {STABLES.map((x) => <option key={x.address} value={x.address}>{x.symbol}</option>)}
                      </select>
                    </Field>
                  </div>
                  <p className="max-w-[62ch] text-sm text-muted-foreground">Paid once each time someone creates a token. 0 makes it free. Someone who is creating a token at the old fee is refused, not charged more.</p>
                  <div>
                    <Button variant="secondary" disabled={isPending || newTokenFee === "" || !isAddress(tokenFeeIn)} onClick={() => send("Set token fee", { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "setCreationFee", args: [tokenFeeIn, parseUnits(newTokenFee || "0", 18)] }).then(refresh)}>
                      Save token fee
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
        ) : (
          <p className="mt-4 max-w-[62ch] text-sm text-muted-foreground">Only the platform owner can change the platform, launch and token creation fees.</p>
        )}
      </Section>

      <PaymasterPanel />
      {!abis.paymaster && (
        <Section
          title="Deposit for sponsored network fees"
          description="When sign-in without a wallet is switched on, BitRegalo will pay people's network fees from this deposit. That is not in use yet: today each person pays their own network fee from their wallet, so the deposit is untouched."
        >
          <Card>
            <Facts columns={2}>
              <Fact label="On deposit">{gasDeposit !== undefined ? <Amount value={gasDeposit} symbol={network.nativeSymbol} /> : "…"}</Fact>
              <Fact label="Paymaster contract"><Addr a={addresses.paymaster} /></Fact>
            </Facts>
          </Card>
        </Section>
      )}

      <Section
        title="Contract versions"
        description="Each workspace keeps the contracts it was created with; new workspaces get the newest registered set. Registering tells the platform rules contract about a new set of contracts. It changes nothing for existing workspaces. This app works with protocol version 2."
      >
        <Card flush>
          {versions.map((v) => (
            <LedgerRow
              key={v.n}
              title={`Contract set ${v.n}`}
              meta={
                <>
                  Protocol version 2: requests, listings, escrow, payments, the shop, redemption and a workspace treasury.
                  <span className="block">
                    Records <Addr a={v.instanceImpl} /> · Vault <Addr a={v.vaultImpl} />
                    {v.treasuryImpl && <> · Treasury <Addr a={v.treasuryImpl} /></>}
                  </span>
                </>
              }
              status={
                v.n < registered ? <Pill tone="good">Registered</Pill>
                  : isOwner ? <Button size="sm" disabled={isPending || v.n !== registered} onClick={() => send(`Register contract set ${v.n}`, { address: addresses.mother, abi: abis.mother, functionName: "registerVersion", args: [v.instanceImpl, v.vaultImpl] }).then(refresh)}>Register set {v.n}</Button>
                  : <Pill>Not registered</Pill>
              }
            />
          ))}
        </Card>
        {unregistered.length > 0 && !isOwner && <p className="mt-3 text-sm text-muted-foreground">Only the owner of the platform rules contract can register a set of contracts.</p>}
      </Section>

      <Section title="The platform's contracts" description="Three contracts, each with an owner. None of them can touch payments held in a workspace's vault. An owner cannot give ownership up, and handing it over takes two steps: the owner offers it, the new owner accepts.">
        <Card flush>
          {contracts.map((c) => (
            <LedgerRow
              key={c.addr}
              title={<>{c.name} <span className="font-normal text-muted-foreground">({c.tech})</span></>}
              meta={
                <>
                  {c.what}
                  <span className="block">Contract <Addr a={c.addr} /> · Owner <Addr a={String(c.owner ?? "")} /></span>
                  {!isZero(c.pending) && <span className="block">Offered to <Addr a={c.pending!} />. Waiting for that wallet to accept; until then the owner does not change.</span>}
                </>
              }
              status={!isZero(c.pending) ? <Pill tone="accent">Handover pending</Pill> : !!me && c.owner?.toLowerCase() === me ? <Pill tone="good">You</Pill> : undefined}
            />
          ))}
        </Card>

        {owned.length > 0 && (
          <Card className="mt-6" title="Hand over a platform contract" description="Owner only. You offer the contract to another wallet, for example a shared multi-signature wallet. Nothing changes until that wallet accepts on this page.">
            <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-[14rem_minmax(0,1fr)]">
                <Field label="Contract">
                  <select className={inputCls} value={owned.some((c) => c.addr === handover.contract) ? handover.contract : owned[0].addr} onChange={(e) => setHandover({ ...handover, contract: e.target.value })}>
                    {owned.map((c) => <option key={c.addr} value={c.addr}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="New owner's wallet address">
                  <input className={cn(inputCls, "t-mono")} value={handover.to} onChange={(e) => setHandover({ ...handover, to: e.target.value.trim() })} placeholder="0x…" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
                </Field>
              </div>
              <div>
                <Button
                  variant="secondary"
                  disabled={isPending || !isAddress(handover.to) || handover.to.toLowerCase() === me}
                  onClick={() => {
                    const target = owned.find((c) => c.addr === handover.contract) ?? owned[0]
                    send(`Offer ${target.name}`, { address: target.addr, abi: abis.ownable, functionName: "transferOwnership", args: [handover.to] }).then(() => { setHandover({ ...handover, to: "" }); refresh() })
                  }}
                >
                  Offer ownership
                </Button>
              </div>
            </form>
          </Card>
        )}
        <p className="mt-4 max-w-[62ch] text-sm text-muted-foreground">
          Before real funds are involved, these owners should become a shared multi-signature wallet, so that no single key controls the platform.
        </p>
      </Section>
    </div>
  )
}
