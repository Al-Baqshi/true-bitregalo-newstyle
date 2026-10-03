"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { parseUnits, type Address } from "viem"
import { useTx } from "@/lib/bitregalo/hooks"
import { abis, addresses, versions, PUBLIC_WORKSPACE_ID, STABLES } from "@/lib/bitregalo/config"
import { Addr, Amount, Card, Fact, Facts, Field, LedgerRow, Notice, PageHead, Pill, Section, Stat, Stats, inputCls } from "@/components/app/ui"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as Address
const entryPointAbi = [{ type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] }] as const
const ownableAbi = [
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "pendingOwner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "acceptOwnership", stateMutability: "nonpayable", inputs: [], outputs: [] },
] as const
const treasuryAbi = [{ type: "function", name: "sweep", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] }] as const

export default function Platform() {
  const { address } = useAccount()
  const { send, isPending } = useTx()
  const head = useReadContracts({
    contracts: [
      { address: addresses.mother, abi: ownableAbi, functionName: "owner" },
      { address: addresses.mother, abi: ownableAbi, functionName: "pendingOwner" },
      { address: addresses.treasury, abi: ownableAbi, functionName: "owner" },
      { address: addresses.treasury, abi: ownableAbi, functionName: "pendingOwner" },
      { address: addresses.tokenFactory, abi: ownableAbi, functionName: "owner" },
      { address: addresses.tokenFactory, abi: ownableAbi, functionName: "pendingOwner" },
      { address: addresses.mother, abi: abis.mother, functionName: "tenantCount" },
      { address: addresses.mother, abi: abis.mother, functionName: "defaultFeeBps" },
      { address: addresses.mother, abi: abis.mother, functionName: "deployFeeAmount" },
      { address: addresses.mother, abi: abis.mother, functionName: "deployFeeToken" },
      { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "creationFeeAmount" },
      { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "creationFeeToken" },
      { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tokenCount" },
      { address: ENTRY_POINT, abi: entryPointAbi, functionName: "balanceOf", args: [addresses.paymaster] },
      { address: addresses.mother, abi: abis.mother, functionName: "versionCount" },
    ],
    query: { refetchInterval: 15_000 },
  })
  const r = (head.data ?? []).map((x) => x.result)
  const [mOwner, mPending, tOwner, tPending, fOwner, fPending, tenantCount, feeBps, deployFee, deployFeeToken, tokenFee, , tokenCount, gasDeposit, versionCount] = r as [Address?, Address?, Address?, Address?, Address?, Address?, bigint?, number?, bigint?, Address?, bigint?, Address?, bigint?, bigint?, bigint?]
  const deployFeeSym = STABLES.find((x) => x.address.toLowerCase() === (deployFeeToken ?? "").toLowerCase())?.symbol ?? "tokens"
  const registered = Number(versionCount ?? 0n)
  const unregistered = versions.filter((v) => v.n >= registered)
  const me = address?.toLowerCase()
  const isOwner = !!me && mOwner?.toLowerCase() === me
  const ownsTreasury = !!me && tOwner?.toLowerCase() === me

  // The BitRegalo network at /app is one ordinary workspace, chosen in the app's settings.
  const pub = useReadContract({ address: addresses.mother, abi: abis.mother, functionName: "tenants", args: [PUBLIC_WORKSPACE_ID] })
  const pubT = pub.data as { instance: Address; admin: Address; version: bigint } | undefined
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
  const versionName = (v: number | null) => (v === null ? "…" : v === latest ? `Current contracts (version ${v})` : v === 0 ? "First version (version 0)" : `Version ${v}`)

  const n = Number(tokenCount ?? 0n)
  const factoryTokens = useReadContracts({
    contracts: Array.from({ length: n }, (_, i) => ({ address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "allTokens", args: [BigInt(i)] })),
    query: { enabled: n > 0 },
  })
  const tokenList = Array.from(new Set([...STABLES.map((x) => x.address), ...((factoryTokens.data ?? []).map((x) => x.result as Address).filter(Boolean))]))
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

  const [newFee, setNewFee] = useState("")
  const [newLaunch, setNewLaunch] = useState("")
  const [launchToken, setLaunchToken] = useState<string>(STABLES[0]?.address ?? addresses.usdt)
  const [newTokenFee, setNewTokenFee] = useState("")
  const refresh = () => { head.refetch(); bal.refetch() }

  const pending = [
    { label: "Platform rules", addr: addresses.mother, pending: mPending },
    { label: "Fee vault", addr: addresses.treasury, pending: tPending },
    { label: "Token maker", addr: addresses.tokenFactory, pending: fPending },
  ].filter((p) => !!me && p.pending?.toLowerCase() === me)

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
      body: "A flat amount the buyer pays on top of each payment, sent straight to the fee vault. Each workspace admin sets it per token when creating the workspace, or later in its Settings.",
    },
    {
      name: "Workspace launch fee",
      value: deployFee !== undefined ? (deployFee > 0n ? <><Amount value={deployFee} /> {deployFeeSym}</> : "Free") : "…",
      body: "Paid once by an organisation when it creates its workspace.",
    },
    {
      name: "Token creation fee",
      value: tokenFee !== undefined ? (tokenFee > 0n ? <><Amount value={tokenFee} /> USDT</> : "Free") : "…",
      body: "Paid once each time someone creates a token.",
    },
  ]

  return (
    <div className="space-y-12">
      <PageHead
        title="Platform and earnings"
        intro="BitRegalo's own view: the fees the platform has collected, the gas it sponsors, and its contract versions. Anyone can look. Only the owner's wallet can change anything."
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
              <Button key={p.addr} disabled={isPending} onClick={() => send(`Accept ${p.label}`, { address: p.addr, abi: ownableAbi as never, functionName: "acceptOwnership", args: [] }).then(refresh)}>
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
            <Fact label="Newest registered">{latest === null ? "…" : `Version ${latest}`}</Fact>
          </Facts>
          <div className="mt-6 border-t border-border pt-5">
            {pubBehind ? (
              <div className="grid gap-4">
                <p className="max-w-[62ch] text-sm text-muted-foreground">
                  The network runs on older contracts than the current ones, so it has no direct payments, shop or treasury. A new public
                  workspace on the current contracts fixes that.{" "}
                  {deployFee === 0n
                    ? "Creating it is free: there is no launch fee right now."
                    : <>Creating it costs the normal launch fee{deployFee !== undefined && <> of <span className="t-num text-foreground"><Amount value={deployFee} /> {deployFeeSym}</span></>}, in practice money.</>}{" "}
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
                        : "Take practice money from the faucet first, then create the network."}
                    </p>
                  </Notice>
                ) : isOwner ? (
                  <div><Button asChild><Link href="/app/launch?preset=public">Create the public network on the current contracts</Link></Button></div>
                ) : (
                  <p className="text-sm text-muted-foreground">Only the platform owner creates it. {address ? "Your connected wallet is not the owner." : "Connect the owner's wallet to do it."}</p>
                )}
              </div>
            ) : (
              <p className="max-w-[62ch] text-sm text-muted-foreground">
                {pubVersion === null || latest === null ? "Reading the network's contracts…" : "The network runs on the current contracts. Nothing to do."}
              </p>
            )}
          </div>
        </Card>
      </Section>

      <Stats>
        <Stat label="Workspaces" value={count(tenantCount)} hint="launched so far" />
        <Stat label="Tokens created" value={count(tokenCount)} hint="through the token maker" />
        <Stat label="Platform fee" value={feeBps !== undefined ? `${Number(feeBps) / 100}%` : "…"} hint="of each payment, new workspaces" />
        <Stat label="Sponsored gas" value={gasDeposit !== undefined ? <Amount value={gasDeposit} symbol="tBNB" /> : "…"} hint="on deposit for users' network fees" />
      </Stats>

      <Section title="In the fee vault" description="Every fee lands in one fee vault. This is what it holds now: what the platform has earned and not yet withdrawn.">
        <Card flush>
          {earnings.map((e) => (
            <LedgerRow
              key={e.token}
              title={e.symbol}
              meta={<Addr a={e.token} />}
              amount={<Amount value={e.amount} decimals={e.decimals} />}
              status={
                ownsTreasury && e.amount > 0n ? (
                  <Button size="sm" variant="secondary" disabled={isPending} onClick={() => send(`Withdraw ${e.symbol}`, { address: addresses.treasury, abi: treasuryAbi as never, functionName: "sweep", args: [e.token, address, e.amount] }).then(refresh)}>
                    Withdraw
                  </Button>
                ) : undefined
              }
            />
          ))}
          <div className="border-t border-border px-5 py-3 sm:px-6">
            <p className="max-w-[68ch] text-sm text-muted-foreground">
              {!earningAny && bal.data && <>Nothing has been collected yet. Fees arrive when a payment is made or an escrow is released in a workspace, and whenever a launch or token fee is charged. </>}
              Only the vault&apos;s owner, <Addr a={String(tOwner ?? "")} />, can withdraw. A withdrawal sends the whole balance of that token to the owner&apos;s wallet.
            </p>
          </div>
        </Card>
      </Section>

      <Section title="Where the fees come from" description="Four kinds of fee, all paid into the same vault.">
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
                <Field label="Platform fee for new workspaces (%)" hint={`Between 0 and 5. Now ${feeBps !== undefined ? `${Number(feeBps) / 100}%` : "…"}. Workspaces that already exist keep their rate.`}>
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
                <p className="max-w-[62ch] text-sm text-muted-foreground">Paid once when a workspace is created. On the practice network, charge it in tUSD so anyone can pay it from the faucet. 0 makes it free.</p>
                <div>
                  <Button variant="secondary" disabled={isPending || newLaunch === ""} onClick={() => send("Set launch fee", { address: addresses.mother, abi: abis.mother, functionName: "setDeployFee", args: [launchToken, parseUnits(newLaunch || "0", 18)] }).then(refresh)}>
                    Save launch fee
                  </Button>
                </div>
              </form>

              {fOwner?.toLowerCase() === me && (
                <form className="grid gap-4 border-t border-border pt-8" onSubmit={(e) => e.preventDefault()}>
                  <Field label="Token creation fee (USDT)" hint="Paid once each time someone creates a token. 0 makes it free.">
                    <input className={cn(inputCls, "t-num max-w-40")} type="number" inputMode="decimal" min="0" value={newTokenFee} onChange={(e) => setNewTokenFee(e.target.value)} />
                  </Field>
                  <div>
                    <Button variant="secondary" disabled={isPending || newTokenFee === ""} onClick={() => send("Set token fee", { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "setCreationFee", args: [addresses.usdt, parseUnits(newTokenFee || "0", 18)] }).then(refresh)}>
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

      <Section
        title="Gas the platform sponsors"
        description="When sign-in without a wallet is switched on, BitRegalo pays users' network fees from this deposit, and the service fee is what pays it back. Today people pay their own network fees from their wallet, so the deposit is untouched."
      >
        <Card>
          <Facts columns={2}>
            <Fact label="On deposit">{gasDeposit !== undefined ? <Amount value={gasDeposit} symbol="tBNB" /> : "…"}</Fact>
            <Fact label="Paymaster contract"><Addr a={addresses.paymaster} /></Fact>
          </Facts>
        </Card>
      </Section>

      <Section
        title="Contract versions"
        description="Each workspace keeps the contract version it was created with; new workspaces get the newest registered one. Registering a version tells the platform rules contract about a new set of contracts. It changes nothing for existing workspaces."
      >
        <Card flush>
          {versions.map((v) => (
            <LedgerRow
              key={v.n}
              title={`Version ${v.n}`}
              meta={
                <>
                  {v.n === 0 ? "Requests, listings, escrow and tokens." : "Adds a workspace treasury, sales with redemption, and payment links."}
                  <span className="block">
                    Records <Addr a={v.instanceImpl} /> · Vault <Addr a={v.vaultImpl} />
                    {v.treasuryImpl && <> · Treasury <Addr a={v.treasuryImpl} /></>}
                  </span>
                </>
              }
              status={
                v.n < registered ? <Pill tone="good">Registered</Pill>
                  : isOwner ? <Button size="sm" disabled={isPending || v.n !== registered} onClick={() => send(`Register version ${v.n}`, { address: addresses.mother, abi: abis.mother, functionName: "registerVersion", args: [v.instanceImpl, v.vaultImpl] }).then(refresh)}>Register version {v.n}</Button>
                  : <Pill>Not registered</Pill>
              }
            />
          ))}
        </Card>
        {unregistered.length > 0 && !isOwner && <p className="mt-3 text-sm text-muted-foreground">Only the owner of the platform rules contract can register a version.</p>}
      </Section>

      <Section title="The platform's contracts" description="Three contracts, each with an owner. None of them can touch money held in a workspace's vault.">
        <Card flush>
          {[
            { name: "Platform rules", tech: "BitRegaloMother", what: "Creates new workspaces and holds the fee settings. Cannot touch anyone's money.", addr: addresses.mother, owner: mOwner },
            { name: "Fee vault", tech: "Treasury", what: "Receives every fee. Only its owner can withdraw.", addr: addresses.treasury, owner: tOwner },
            { name: "Token maker", tech: "TokenFactory", what: "Creates tokens for workspaces and projects.", addr: addresses.tokenFactory, owner: fOwner },
          ].map((c) => (
            <LedgerRow
              key={c.addr}
              title={<>{c.name} <span className="font-normal text-muted-foreground">({c.tech})</span></>}
              meta={
                <>
                  {c.what}
                  <span className="block">Contract <Addr a={c.addr} /> · Owner <Addr a={String(c.owner ?? "")} /></span>
                </>
              }
              status={!!me && c.owner?.toLowerCase() === me ? <Pill tone="good">You</Pill> : undefined}
            />
          ))}
        </Card>
        <p className="mt-4 max-w-[62ch] text-sm text-muted-foreground">
          Before real money is involved, these owners should become a shared multi-signature wallet, so that no single key controls the platform.
        </p>
      </Section>
    </div>
  )
}
