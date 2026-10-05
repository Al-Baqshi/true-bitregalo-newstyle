"use client"
import { useState } from "react"
import { useAccount, useReadContracts } from "wagmi"
import { formatEther, formatGwei, isAddress, parseEther, parseGwei, zeroAddress, type Abi, type Address } from "viem"
import { abis, addresses, network, STABLES } from "@/lib/bitregalo/config"
import { useNow, useTx } from "@/lib/bitregalo/hooks"
import { useInstances } from "@/lib/bitregalo/instances"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { Addr, Amount, Card, Fact, Facts, Field, LedgerRow, Pill, Section, inputCls } from "@/components/app/ui"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { deployment } from "./use-platform"

const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase()
const isZero = (a?: string) => !a || /^0x0{40}$/.test(a)
/** EntryPoint v0.7: the paymaster's deposit and stake. Not a BitRegalo contract. */
const entryPointAbi = [{
  type: "function", name: "getDepositInfo", stateMutability: "view", inputs: [{ name: "account", type: "address" }],
  outputs: [{ type: "tuple", components: [
    { name: "deposit", type: "uint256" }, { name: "staked", type: "bool" }, { name: "stake", type: "uint112" },
    { name: "unstakeDelaySec", type: "uint32" }, { name: "withdrawTime", type: "uint48" },
  ] }],
}] as const
const addressAttrs = { autoCapitalize: "none", autoCorrect: "off", spellCheck: false, autoComplete: "off" } as const

/**
 * The gas sponsor (paymaster): what it holds, what it will pay for, and its owner's controls.
 * It pays network fees for people who sign in without a wallet, only for the workspaces its
 * owner lists, and only within the limits shown here. The app itself does not use it yet.
 */
export function PaymasterPanel() {
  // A bundle made before the paymaster was added has no ABI for it: there is nothing to show.
  if (!abis.paymaster || !addresses.paymaster) return null
  return <Panel />
}

function Panel() {
  const { address } = useAccount()
  const { send, isPending } = useTx()
  const nameOf = useWorkspaceName()
  const ws = useInstances()
  const now = useNow()
  const pm = { address: addresses.paymaster, abi: abis.paymaster as Abi } as const
  // Budgets are counted per hour, by the hour in which a sponsored action becomes valid.
  const hour = BigInt(Math.floor(now / 3600))
  const head = useReadContracts({
    contracts: [
      { ...pm, functionName: "owner" },
      { ...pm, functionName: "verifyingSigner" },
      { ...pm, functionName: "guardian" },
      { ...pm, functionName: "paused" },
      { ...pm, functionName: "limits" },
      { ...pm, functionName: "reserved", args: [hour] },
      { address: deployment.entryPoint, abi: entryPointAbi, functionName: "getDepositInfo", args: [addresses.paymaster] },
    ],
    query: { refetchInterval: 15_000 },
  })
  const [owner, signer, guardian, paused, limits, reserved, info] = (head.data ?? []).map((r) => r.result) as
    [Address?, Address?, Address?, boolean?, (readonly [bigint, bigint, bigint, bigint])?, bigint?, { deposit: bigint; staked: boolean; stake: bigint; unstakeDelaySec: number }?]
  const sponsored = useReadContracts({
    contracts: ws.list.map((w) => ({ ...pm, functionName: "sponsoredWorkspace", args: [w.id] })),
    query: { enabled: ws.list.length > 0, refetchInterval: 15_000 },
  })
  const tokens = useReadContracts({
    contracts: STABLES.map((s) => ({ ...pm, functionName: "allowedToken", args: [s.address] })),
    query: { enabled: STABLES.length > 0, refetchInterval: 15_000 },
  })
  const isOwner = same(owner, address)
  const isGuardian = same(guardian, address)
  const coin = network.nativeSymbol
  const refresh = () => { head.refetch(); sponsored.refetch(); tokens.refetch() }

  const [form, setForm] = useState<{ cost: string; fee: string; pvg: string; budget: string } | null>(null)
  const current = limits ? { cost: formatEther(limits[0]), fee: formatGwei(limits[1]), pvg: String(limits[2]), budget: formatEther(limits[3]) } : { cost: "", fee: "", pvg: "", budget: "" }
  const f = form ?? current
  const num = (s: string) => s.trim() !== "" && Number.isFinite(Number(s)) && Number(s) >= 0
  const limitsOk = num(f.cost) && num(f.fee) && num(f.pvg) && Number.isInteger(Number(f.pvg)) && num(f.budget)
  const [topUp, setTopUp] = useState("")
  const [newSigner, setNewSigner] = useState("")
  const [newGuardian, setNewGuardian] = useState("")
  const [token, setToken] = useState("")
  const notSet = !!limits && limits[0] === 0n

  return (
    <Section
      title="Gas sponsorship"
      description="The paymaster pays network fees for people who sign in without a wallet, for the workspaces listed here. It is deployed and funded, and the app does not use it yet."
    >
      <div className="space-y-6">
        <Card
          title="The paymaster"
          action={paused === undefined ? undefined : paused ? <Pill tone="bad">Paused</Pill> : notSet ? <Pill tone="accent">No limits set: nothing is sponsored</Pill> : <Pill tone="good">Sponsoring</Pill>}
        >
          <Facts columns={3}>
            <Fact label="Deposit">{info ? <Amount value={info.deposit} symbol={coin} /> : "…"}<span className="block text-sm font-normal text-muted-foreground">Pays the sponsored fees</span></Fact>
            <Fact label="Stake">{info ? <Amount value={info.stake} symbol={coin} /> : "…"}<span className="block text-sm font-normal text-muted-foreground">{info ? (info.staked ? `Locked, ${Math.round(info.unstakeDelaySec / 3600)} h to unlock` : "Not staked") : ""}</span></Fact>
            <Fact label="This hour">{reserved !== undefined && limits ? <><Amount value={reserved} /> of <Amount value={limits[3]} symbol={coin} /></> : "…"}<span className="block text-sm font-normal text-muted-foreground">Set aside against the hourly budget</span></Fact>
            <Fact label="Owner"><Addr a={owner ?? ""} />{isOwner ? " (you)" : ""}</Fact>
            <Fact label="Signer"><Addr a={signer ?? ""} /><span className="block text-sm font-normal text-muted-foreground">Approves each sponsored action</span></Fact>
            <Fact label="Guardian">{guardian === undefined ? "…" : isZero(guardian) ? "None" : <><Addr a={guardian} />{isGuardian ? " (you)" : ""}</>}<span className="block text-sm font-normal text-muted-foreground">Can pause, and nothing else</span></Fact>
          </Facts>
          <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
            Contract <Addr a={addresses.paymaster} /> on the EntryPoint <Addr a={deployment.entryPoint} />.
            {(isOwner || isGuardian) && paused === false && <> If the signer&apos;s key may have leaked, pause first.</>}
          </p>
          {(isOwner || isGuardian) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {paused === false && <Button variant="secondary" disabled={isPending} onClick={() => send("Pause sponsorship", { ...pm, functionName: "pause", args: [] }).then(refresh)}>Pause sponsorship</Button>}
              {paused === true && isOwner && <Button variant="secondary" disabled={isPending} onClick={() => send("Resume sponsorship", { ...pm, functionName: "unpause", args: [] }).then(refresh)}>Resume sponsorship</Button>}
              {paused === true && !isOwner && <p className="text-sm text-muted-foreground">Paused. Only the owner can resume.</p>}
            </div>
          )}
        </Card>

        <Card
          title="Limits"
          description="The limits cap what one sponsored action, and one hour of them, can cost. If the signer's key ever leaked, they are what keeps someone from emptying the deposit through inflated fees."
        >
          <Facts columns={4}>
            <Fact label="Most for one action">{limits ? <Amount value={limits[0]} symbol={coin} /> : "…"}</Fact>
            <Fact label="Highest fee per gas">{limits ? `${formatGwei(limits[1])} gwei` : "…"}</Fact>
            <Fact label="Most pre-verification gas">{limits ? <span className="t-num">{Number(limits[2]).toLocaleString()}</span> : "…"}</Fact>
            <Fact label="Budget per hour">{limits ? <Amount value={limits[3]} symbol={coin} /> : "…"}</Fact>
          </Facts>
          {isOwner && (
            <form className="mt-6 grid gap-4 border-t border-border pt-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label={`Most for one action (${coin})`}><input className={cn(inputCls, "t-num")} inputMode="decimal" value={f.cost} onChange={(e) => setForm({ ...f, cost: e.target.value })} /></Field>
                <Field label="Highest fee per gas (gwei)"><input className={cn(inputCls, "t-num")} inputMode="decimal" value={f.fee} onChange={(e) => setForm({ ...f, fee: e.target.value })} /></Field>
                <Field label="Most pre-verification gas"><input className={cn(inputCls, "t-num")} inputMode="numeric" value={f.pvg} onChange={(e) => setForm({ ...f, pvg: e.target.value })} /></Field>
                <Field label={`Budget per hour (${coin})`}><input className={cn(inputCls, "t-num")} inputMode="decimal" value={f.budget} onChange={(e) => setForm({ ...f, budget: e.target.value })} /></Field>
              </div>
              <p className="max-w-[66ch] text-sm text-muted-foreground">An action above any of the first three is refused. So is one that would take the hour over its budget. With “most for one action” at 0, nothing is sponsored.</p>
              <div>
                <Button
                  variant="secondary"
                  disabled={isPending || !limits || !form || !limitsOk}
                  onClick={() => send("Set sponsorship limits", { ...pm, functionName: "setLimits", args: [{ maxCostPerOp: parseEther(f.cost), maxFeePerGas: parseGwei(f.fee), maxPreVerificationGas: BigInt(f.pvg), budgetPerWindow: parseEther(f.budget) }] }).then(() => { setForm(null); refresh() })}
                >
                  Save limits
                </Button>
              </div>
            </form>
          )}
        </Card>

        <Card flush title="Sponsored workspaces" description="Only actions on a listed workspace's own contracts are paid for. Anyone can launch a workspace, so each one is listed by the owner.">
          {ws.list.length === 0 && <p className="px-5 py-4 text-sm text-muted-foreground sm:px-6">Reading the workspaces…</p>}
          {ws.list.map((w, i) => {
            const listed = sponsored.data?.[i]?.result as readonly [Address, Address, Address] | undefined
            const on = !!listed && !isZero(listed[0])
            return (
              <LedgerRow
                key={String(w.id)}
                lead={`#${String(w.id)}`}
                title={nameOf(w.id)}
                meta={<>Admin <Addr a={w.admin} /></>}
                status={
                  <span className="flex items-center gap-3">
                    {listed === undefined ? null : on ? <Pill tone="good">Sponsored</Pill> : <Pill>Not sponsored</Pill>}
                    {isOwner && listed !== undefined && (
                      <Button size="sm" variant="secondary" disabled={isPending} onClick={() => send(on ? `Stop sponsoring workspace #${w.id}` : `Sponsor workspace #${w.id}`, { ...pm, functionName: "setWorkspaceSponsored", args: [w.id, !on] }).then(refresh)}>
                        {on ? "Stop sponsoring" : "Sponsor"}
                      </Button>
                    )}
                  </span>
                }
              />
            )
          })}
        </Card>

        <Card flush title="Tokens whose approvals are sponsored" description="A sponsored action may approve a sponsored workspace's vault to take one of these tokens, and nothing else about a token.">
          {STABLES.map((s, i) => {
            const on = tokens.data?.[i]?.result as boolean | undefined
            return (
              <LedgerRow
                key={s.address}
                title={s.symbol}
                meta={<Addr a={s.address} />}
                status={
                  <span className="flex items-center gap-3">
                    {on === undefined ? null : on ? <Pill tone="good">Allowed</Pill> : <Pill>Not allowed</Pill>}
                    {isOwner && on !== undefined && (
                      <Button size="sm" variant="secondary" disabled={isPending} onClick={() => send(on ? `Stop allowing ${s.symbol}` : `Allow ${s.symbol}`, { ...pm, functionName: "setTokenAllowed", args: [s.address, !on] }).then(refresh)}>
                        {on ? "Stop allowing" : "Allow"}
                      </Button>
                    )}
                  </span>
                }
              />
            )
          })}
          {isOwner && (
            <div className="grid gap-3 border-t border-border px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end sm:px-6">
              <Field label="Another token, by address">
                <input className={cn(inputCls, "t-mono")} value={token} onChange={(e) => setToken(e.target.value.trim())} placeholder="0x…" {...addressAttrs} />
              </Field>
              <Button variant="secondary" disabled={isPending || !isAddress(token)} onClick={() => send("Allow the token", { ...pm, functionName: "setTokenAllowed", args: [token, true] }).then(() => { setToken(""); refresh() })}>Allow</Button>
              <Button variant="ghost" disabled={isPending || !isAddress(token)} onClick={() => send("Stop allowing the token", { ...pm, functionName: "setTokenAllowed", args: [token, false] }).then(() => { setToken(""); refresh() })}>Stop allowing</Button>
            </div>
          )}
        </Card>

        {isOwner ? (
          <Card title="Owner controls" description="Each one is a transaction your wallet signs.">
            <div className="grid gap-8">
              <form className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_auto] sm:items-end" onSubmit={(e) => e.preventDefault()}>
                <Field label={`Add to the deposit (${coin})`} hint="Sent from your wallet to the EntryPoint, for this paymaster. Keep the deposit small and top it up.">
                  <input className={cn(inputCls, "t-num")} inputMode="decimal" value={topUp} onChange={(e) => setTopUp(e.target.value)} placeholder="0.05" />
                </Field>
                <div className="sm:pb-8"><Button variant="secondary" disabled={isPending || !(Number(topUp) > 0)} onClick={() => send(`Add ${topUp} ${coin} to the deposit`, { ...pm, functionName: "deposit", args: [], value: parseEther(topUp) }).then(() => { setTopUp(""); refresh() })}>Add to the deposit</Button></div>
              </form>
              <form className="grid gap-3 border-t border-border pt-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" onSubmit={(e) => e.preventDefault()}>
                <Field label="New signer" hint="The key of the sponsor service. Change it at once if it may have leaked.">
                  <input className={cn(inputCls, "t-mono")} value={newSigner} onChange={(e) => setNewSigner(e.target.value.trim())} placeholder="0x…" {...addressAttrs} />
                </Field>
                <div className="sm:pb-8"><Button variant="secondary" disabled={isPending || !isAddress(newSigner) || isZero(newSigner)} onClick={() => send("Change the signer", { ...pm, functionName: "setSigner", args: [newSigner] }).then(() => { setNewSigner(""); refresh() })}>Change the signer</Button></div>
              </form>
              <form className="grid gap-3 border-t border-border pt-8 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end" onSubmit={(e) => e.preventDefault()}>
                <Field label="Guardian" hint="A key that can pause sponsorship and do nothing else, so it can be kept close at hand.">
                  <input className={cn(inputCls, "t-mono")} value={newGuardian} onChange={(e) => setNewGuardian(e.target.value.trim())} placeholder="0x…" {...addressAttrs} />
                </Field>
                <div className="sm:pb-8"><Button variant="secondary" disabled={isPending || !isAddress(newGuardian)} onClick={() => send("Set the guardian", { ...pm, functionName: "setGuardian", args: [newGuardian] }).then(() => { setNewGuardian(""); refresh() })}>Set the guardian</Button></div>
                {!isZero(guardian) && <div className="sm:pb-8"><Button variant="ghost" disabled={isPending} onClick={() => send("Remove the guardian", { ...pm, functionName: "setGuardian", args: [zeroAddress] }).then(refresh)}>Remove the guardian</Button></div>}
              </form>
            </div>
          </Card>
        ) : (
          <p className="max-w-[62ch] text-sm text-muted-foreground">Only the paymaster&apos;s owner can change its limits, signer, guardian, sponsored workspaces and deposit.{isGuardian ? " As the guardian you can pause it." : ""}</p>
        )}
      </div>
    </Section>
  )
}
