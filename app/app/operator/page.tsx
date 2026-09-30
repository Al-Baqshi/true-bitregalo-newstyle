"use client"
import { useState } from "react"
import { useAccount, useReadContracts } from "wagmi"
import { parseUnits, type Address } from "viem"
import { ArrowDownToLine, Coins, Percent, Rocket, Receipt, Fuel, Layers } from "lucide-react"
import { useTx } from "@/lib/bitregalo/hooks"
import { abis, addresses, short, versions } from "@/lib/bitregalo/config"
import { Card, Addr, Amount, Pill, PageHead } from "@/components/app/ui"
import { Explainer } from "@/components/app/explain"
import { input } from "@/components/app/wizard/fields"
import { Button } from "@/components/ui/button"

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
  const [mOwner, mPending, tOwner, tPending, fOwner, fPending, tenantCount, feeBps, deployFee, , tokenFee, , tokenCount, gasDeposit, versionCount] = r as [Address?, Address?, Address?, Address?, Address?, Address?, bigint?, number?, bigint?, Address?, bigint?, Address?, bigint?, bigint?, bigint?]
  const registered = Number(versionCount ?? 0n)
  const unregistered = versions.filter((v) => v.n >= registered)
  const me = address?.toLowerCase()
  const isOwner = !!me && mOwner?.toLowerCase() === me
  const ownsTreasury = !!me && tOwner?.toLowerCase() === me

  const n = Number(tokenCount ?? 0n)
  const factoryTokens = useReadContracts({
    contracts: Array.from({ length: n }, (_, i) => ({ address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "allTokens", args: [BigInt(i)] })),
    query: { enabled: n > 0 },
  })
  const tokenList = [addresses.usdt, ...((factoryTokens.data ?? []).map((x) => x.result as Address).filter(Boolean))]
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
  const [newTokenFee, setNewTokenFee] = useState("")
  const refresh = () => { head.refetch(); bal.refetch() }

  const pending = [
    { label: "Platform rules", addr: addresses.mother, pending: mPending },
    { label: "Fee vault", addr: addresses.treasury, pending: tPending },
    { label: "Token maker", addr: addresses.tokenFactory, pending: fPending },
  ].filter((p) => !!me && p.pending?.toLowerCase() === me)

  return (
    <div className="space-y-8">
      <PageHead eyebrow="Platform" title="Your platform and what it earns" intro="BitRegalo charges small fees as people use it. Every fee lands in one fee vault that only the platform owner controls — and you can move it to your own wallet whenever you like." />
      <Explainer id="platform" title="Who this page is for">
        <p>It is for the owner of the platform — the person who created the mother contract. Anyone can look; only the owner's wallet can change settings or withdraw.</p>
        <p>{isOwner ? "Your connected wallet is the owner, so every control below is live for you." : address ? "Your connected wallet is not the owner, so this page is read-only for you." : "Connect the owner's wallet to use the controls."}</p>
      </Explainer>

      {pending.length > 0 && (
        <Card title="One more step">
          <p className="text-sm text-[color:var(--bq-ivory-dim)]">Control of these contracts has been offered to your wallet. Accept to take over — until then, the previous owner still holds them.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {pending.map((p) => <Button key={p.addr} disabled={isPending} onClick={() => send(`Accept ${p.label}`, { address: p.addr, abi: ownableAbi as never, functionName: "acceptOwnership", args: [] }).then(refresh)}>Accept {p.label}</Button>)}
          </div>
        </Card>
      )}

      <Card title="Your earnings (in the fee vault)">
        <div className="divide-y divide-border">
          {earnings.map((e) => (
            <div key={e.token} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-4">
                <span className="bq-display text-3xl font-semibold tabular-nums"><Amount value={e.amount} decimals={e.decimals} /></span>
                <span className="text-sm text-muted-foreground">{e.symbol}</span>
              </div>
              {ownsTreasury && e.amount > 0n
                ? <Button disabled={isPending} onClick={() => send(`Withdraw ${e.symbol}`, { address: addresses.treasury, abi: treasuryAbi as never, functionName: "sweep", args: [e.token, address, e.amount] }).then(refresh)}><ArrowDownToLine className="size-4" />Withdraw to my wallet</Button>
                : <span className="text-xs text-muted-foreground">{e.amount > 0n ? "Only the vault owner can withdraw" : "Nothing yet"}</span>}
            </div>
          ))}
        </div>
        {!earningAny && (
          <p className="mt-2 rounded-lg bg-secondary/50 px-4 py-3 text-sm text-[color:var(--bq-ivory-dim)]">
            Nothing has been earned yet because no paid activity has happened: so far only “just record it” requests were made, and the launch and token fees are set to zero. Set prices below, or run a paid request — for example one paid in a token — and the fees appear here.
          </p>
        )}
      </Card>

      <div>
        <p className="bq-label">How you earn</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <div className="flex items-start gap-3"><Percent className="mt-0.5 size-5 shrink-0 text-primary" /><div>
              <p className="text-sm font-medium">Platform fee on every payment · now {feeBps !== undefined ? `${Number(feeBps) / 100}%` : "…"}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Taken from what the supplier receives, whenever a direct payment is made or an escrow is released. Each workspace keeps the rate it was created with, so a change applies to new workspaces only. The contract caps it at 5%.</p>
              {isOwner && <div className="mt-3 flex gap-2"><input className={`${input} bq-mono max-w-28`} type="number" min="0" max="5" step="0.1" placeholder="%" value={newFee} onChange={(e) => setNewFee(e.target.value)} /><Button variant="secondary" disabled={isPending || !(Number(newFee) >= 0 && Number(newFee) <= 5) || newFee === ""} onClick={() => send("Set platform fee", { address: addresses.mother, abi: abis.mother, functionName: "setDefaultFeeBps", args: [Math.round(Number(newFee) * 100)] }).then(refresh)}>Save</Button></div>}
            </div></div>
          </Card>
          <Card>
            <div className="flex items-start gap-3"><Receipt className="mt-0.5 size-5 shrink-0 text-primary" /><div>
              <p className="text-sm font-medium">Service fee on every payment</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">A flat amount the buyer pays on top of each payment, sent straight to your fee vault. Each workspace admin sets it per currency when creating the workspace (in the wizard) or under its Settings.</p>
            </div></div>
          </Card>
          <Card>
            <div className="flex items-start gap-3"><Rocket className="mt-0.5 size-5 shrink-0 text-primary" /><div>
              <p className="text-sm font-medium">Workspace launch fee · now {deployFee !== undefined ? (deployFee > 0n ? <><Amount value={deployFee} /> USDT</> : "free") : "…"}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Paid once by an organisation when it creates its workspace.</p>
              {isOwner && <div className="mt-3 flex gap-2"><input className={`${input} bq-mono max-w-28`} type="number" min="0" placeholder="USDT" value={newLaunch} onChange={(e) => setNewLaunch(e.target.value)} /><Button variant="secondary" disabled={isPending || newLaunch === ""} onClick={() => send("Set launch fee", { address: addresses.mother, abi: abis.mother, functionName: "setDeployFee", args: [addresses.usdt, parseUnits(newLaunch || "0", 18)] }).then(refresh)}>Save</Button></div>}
            </div></div>
          </Card>
          <Card>
            <div className="flex items-start gap-3"><Coins className="mt-0.5 size-5 shrink-0 text-primary" /><div>
              <p className="text-sm font-medium">Token creation fee · now {tokenFee !== undefined ? (tokenFee > 0n ? <><Amount value={tokenFee} /> USDT</> : "free") : "…"}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Paid once each time someone creates a token.</p>
              {isOwner && fOwner?.toLowerCase() === me && <div className="mt-3 flex gap-2"><input className={`${input} bq-mono max-w-28`} type="number" min="0" placeholder="USDT" value={newTokenFee} onChange={(e) => setNewTokenFee(e.target.value)} /><Button variant="secondary" disabled={isPending || newTokenFee === ""} onClick={() => send("Set token fee", { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "setCreationFee", args: [addresses.usdt, parseUnits(newTokenFee || "0", 18)] }).then(refresh)}>Save</Button></div>}
            </div></div>
          </Card>
        </div>
        <div className="mt-4" />
        <Card>
          <div className="mt-0 flex items-start gap-3"><Fuel className="mt-0.5 size-5 shrink-0 text-muted-foreground" /><div>
            <p className="text-sm font-medium">Your cost: gas you sponsor · balance {gasDeposit !== undefined ? <><Amount value={gasDeposit} /> tBNB</> : "…"}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">When sign-in without a wallet is switched on, BitRegalo pays users&apos; network fees from this deposit. The service fee above is what pays it back. Today users pay their own gas with MetaMask, so this is untouched.</p>
          </div></div>
        </Card>
      </div>

      <Card title="Contract versions">
        <div className="flex items-start gap-3"><Layers className="mt-0.5 size-5 shrink-0 text-primary" /><div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-muted-foreground">Each workspace keeps the contract version it was created with; new workspaces get the newest registered one. Registering a version tells the platform rules contract about a new implementation pair. It changes nothing for existing workspaces.</p>
          <div className="mt-4 divide-y divide-border text-sm">
            {versions.map((v) => (
              <div key={v.n} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div><span className="font-medium">Version {v.n}</span><span className="ml-2 text-xs text-muted-foreground">{v.n === 0 ? "requests, listings, escrow, tokens" : "adds a workspace treasury, utility sales with redemption, and payment links"}</span>
                  <p className="bq-mono mt-1 text-[11px] text-muted-foreground">instance {short(v.instanceImpl)} · vault {short(v.vaultImpl)}{v.treasuryImpl ? ` · treasury ${short(v.treasuryImpl)}` : ""}</p></div>
                {v.n < registered ? <Pill tone="good">registered</Pill>
                  : isOwner ? <Button size="sm" disabled={isPending || v.n !== registered} onClick={() => send(`Register version ${v.n}`, { address: addresses.mother, abi: abis.mother, functionName: "registerVersion", args: [v.instanceImpl, v.vaultImpl] }).then(refresh)}>Register version {v.n}</Button>
                  : <Pill>deployed, not registered</Pill>}
              </div>
            ))}
          </div>
          {unregistered.length > 0 && !isOwner && <p className="mt-3 text-xs text-muted-foreground">Only the owner of the platform rules contract can register a version.</p>}
        </div></div>
      </Card>

      <Card title="Your contracts, in plain words">
        <div className="divide-y divide-border text-sm">
          {[
            { name: "Platform rules", tech: "BitRegaloMother", what: "Creates new workspaces and holds the fee settings. Cannot touch anyone's money.", addr: addresses.mother, owner: mOwner },
            { name: "Fee vault", tech: "Treasury", what: "Receives every fee. Only its owner can withdraw.", addr: addresses.treasury, owner: tOwner },
            { name: "Token maker", tech: "TokenFactory", what: "Creates tokens for workspaces and projects.", addr: addresses.tokenFactory, owner: fOwner },
          ].map((c) => (
            <div key={c.addr} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-medium">{c.name} <span className="bq-mono ml-1 text-xs text-muted-foreground">{c.tech}</span></p>
                <p className="mt-0.5 text-muted-foreground">{c.what}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">owner <Addr a={String(c.owner ?? "")} />{!!me && c.owner?.toLowerCase() === me && <Pill tone="good">you</Pill>}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{String(tenantCount ?? "…")} workspace{tenantCount === 1n ? "" : "s"} launched so far. Before real money is involved, these owners should become a shared multi-signature wallet so no single key controls the platform. Contract addresses: <span className="bq-mono">{short(addresses.mother)} · {short(addresses.treasury)} · {short(addresses.tokenFactory)}</span>.</p>
      </Card>
    </div>
  )
}
