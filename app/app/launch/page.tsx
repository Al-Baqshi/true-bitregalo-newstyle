"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount, useReadContracts } from "wagmi"
import { decodeEventLog, isAddress, maxUint256, parseUnits } from "viem"
import { useTx } from "@/lib/bitregalo/hooks"
import { abis, addresses, chain, wagmiConfig } from "@/lib/bitregalo/config"
import { Card, Field, inputCls, Addr, Amount } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

const STEPS = ["Your instance", "How it settles", "Tokens", "Rules", "Review & launch"] as const

export default function LaunchWizard() {
  const { address, isConnected } = useAccount()
  const { send, isPending } = useTx()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [purpose, setPurpose] = useState("procurement")
  const [direct, setDirect] = useState(true)
  const [escrow, setEscrow] = useState(true)
  const [tokens, setTokens] = useState<string[]>([addresses.usdt])
  const [newToken, setNewToken] = useState("")
  const [serviceFee, setServiceFee] = useState("0.1")
  const [minDays, setMinDays] = useState("1")
  const [maxDays, setMaxDays] = useState("365")
  const [launched, setLaunched] = useState<{ id: bigint; instance: string; vault: string } | null>(null)

  const mother = useReadContracts({
    contracts: [
      { address: addresses.mother, abi: abis.mother, functionName: "deployFeeAmount" },
      { address: addresses.mother, abi: abis.mother, functionName: "deployFeeToken" },
      { address: addresses.mother, abi: abis.mother, functionName: "defaultFeeBps" },
      { address: addresses.mother, abi: abis.mother, functionName: "versionCount" },
    ],
  })
  const [deployFee, deployFeeToken, feeBps, versionCount] = (mother.data ?? []).map((r) => r.result)

  async function launch() {
    const fee = (deployFee as bigint) ?? 0n
    if (fee > 0n) {
      await send("Approve launch fee", { address: deployFeeToken as `0x${string}`, abi: abis.erc20, functionName: "approve", args: [addresses.mother, maxUint256] })
    }
    const version = ((versionCount as bigint) ?? 1n) - 1n
    const params = {
      admin: address!, version, tokens, decimals: tokens.map(() => 18), serviceFees: tokens.map(() => parseUnits(serviceFee || "0", 18)),
      minTerm: BigInt(Math.max(1, Number(minDays) * 24) * 3600), maxTerm: BigInt(Number(maxDays) * 86400),
      kycRequired: false, attester: "0x0000000000000000000000000000000000000000", directEnabled: direct, escrowEnabled: escrow,
    }
    const hash = await send("Launch instance", { address: addresses.mother, abi: abis.mother, functionName: "launchTenant", args: [params] })
    const { getTransactionReceipt } = await import("wagmi/actions")
    const receipt = await getTransactionReceipt(wagmiConfig, { hash })
    for (const log of receipt.logs) {
      try {
        const ev = decodeEventLog({ abi: abis.mother, data: log.data, topics: log.topics })
        if (ev.eventName === "TenantLaunched") {
          const a = ev.args as unknown as { tenantId: bigint; instance: string; vault: string }
          setLaunched({ id: a.tenantId, instance: a.instance, vault: a.vault })
          try { localStorage.setItem(`bitregalo:instance:${a.tenantId}:name`, name) } catch {}
          return
        }
      } catch {}
    }
  }

  if (launched) {
    return (
      <Card title="Your instance is live">
        <p className="text-sm">
          <b>{name || "Your instance"}</b> is now instance <b>#{String(launched.id)}</b> on {chain.name}. It has its own marketplace contract
          (<Addr a={launched.instance} />) and its own vault (<Addr a={launched.vault} />). You are its admin.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Share <code className="rounded bg-secondary px-1">/app/t/{String(launched.id)}</code> with your suppliers and customers.</li>
          <li>Post your first request, or launch a utility token for your project under Tokens.</li>
          <li>Change tokens, fees and modes any time under Settings.</li>
        </ul>
        <div className="mt-5"><Button onClick={() => router.push(`/app/t/${launched.id}`)}>Open my instance</Button></div>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Launch your instance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Five short steps. The last one is a single transaction from your wallet; the mother contract deploys your instance in it.</p>
      </div>
      <ol className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li key={s} className={`rounded-full border px-3 py-1 ${i === step ? "border-accent text-accent" : i < step ? "border-border text-foreground" : "border-border text-muted-foreground"}`}>{i + 1}. {s}</li>
        ))}
      </ol>

      {step === 0 && (
        <Card title="Your instance">
          <div className="grid gap-4">
            <Field label="Name" hint="Shown in your browser only; the chain records addresses, not names."><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Construction" /></Field>
            <Field label="What will it be used for?">
              <select className={inputCls} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                <option value="procurement">Tendering & procurement (RFPs from suppliers)</option>
                <option value="marketplace">Marketplace / on-demand supply (offers to buyers)</option>
                <option value="grants">Grants, charity or crowdfunding with accountability</option>
                <option value="records">Records only — prove who asked, who won, when</option>
              </select>
            </Field>
          </div>
        </Card>
      )}
      {step === 1 && (
        <Card title="How requests settle">
          <p className="mb-4 text-sm text-muted-foreground">Record-only is always available. Choose which paid modes your users may pick per request.</p>
          <label className="flex items-start gap-3 py-2 text-sm"><input type="checkbox" className="mt-1" checked={escrow} onChange={(e) => setEscrow(e.target.checked)} /><span><b>Escrow</b> — the payer&apos;s funds lock in your vault; only the payer can release, only the payee can cancel, expiry refunds the payer.</span></label>
          <label className="flex items-start gap-3 py-2 text-sm"><input type="checkbox" className="mt-1" checked={direct} onChange={(e) => setDirect(e.target.checked)} /><span><b>Direct payment</b> — the payee is paid the moment a request is awarded or an offer confirmed.</span></label>
          {purpose === "records" && <p className="mt-2 text-xs text-muted-foreground">Records-only instances can leave both off; you can switch them on later.</p>}
        </Card>
      )}
      {step === 2 && (
        <Card title="Settlement tokens">
          <p className="mb-3 text-sm text-muted-foreground">Standard tokens only (no fee-on-transfer or rebasing). Testnet USDT is pre-filled; you can add a token you launched with the factory.</p>
          <ul className="divide-y divide-border">
            {tokens.map((t) => (
              <li key={t} className="flex items-center justify-between py-2 text-sm"><Addr a={t} />{t.toLowerCase() === addresses.usdt.toLowerCase() && <span className="text-xs text-muted-foreground">testnet USDT</span>}<Button size="sm" variant="ghost" onClick={() => setTokens(tokens.filter((x) => x !== t))}>Remove</Button></li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input className={inputCls} value={newToken} onChange={(e) => setNewToken(e.target.value)} placeholder="0x… token address" />
            <Button variant="secondary" disabled={!isAddress(newToken) || tokens.includes(newToken)} onClick={() => { setTokens([...tokens, newToken]); setNewToken("") }}>Add</Button>
          </div>
          <div className="mt-4 max-w-xs"><Field label="Your service fee per settlement (in token units)" hint="Charged to the payer on top of the amount; it goes to the protocol treasury."><input className={inputCls} type="number" min="0" step="any" value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} /></Field></div>
        </Card>
      )}
      {step === 3 && (
        <Card title="Escrow rules">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shortest escrow term (days)" hint="Minimum 1 hour; 1 day is a sensible floor."><input className={inputCls} type="number" min="0.05" step="any" value={minDays} onChange={(e) => setMinDays(e.target.value)} /></Field>
            <Field label="Longest escrow term (days)"><input className={inputCls} type="number" min="1" value={maxDays} onChange={(e) => setMaxDays(e.target.value)} /></Field>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Identity gating (KYC vouchers) can be switched on later from Settings once your attester key is set up.</p>
        </Card>
      )}
      {step === 4 && (
        <Card title="Review">
          <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Name</dt><dd>{name || "—"}</dd></div>
            <div><dt className="text-muted-foreground">Admin</dt><dd><Addr a={address ?? ""} /></dd></div>
            <div><dt className="text-muted-foreground">Modes</dt><dd>record only{direct ? ", direct" : ""}{escrow ? ", escrow" : ""}</dd></div>
            <div><dt className="text-muted-foreground">Tokens</dt><dd>{tokens.length} allowlisted · service fee {serviceFee}</dd></div>
            <div><dt className="text-muted-foreground">Escrow term</dt><dd>{minDays} – {maxDays} days</dd></div>
            <div><dt className="text-muted-foreground">Protocol fee</dt><dd>{feeBps !== undefined ? `${Number(feeBps) / 100}% on settlement (fixed for your instance)` : "…"}</dd></div>
            <div><dt className="text-muted-foreground">Launch fee</dt><dd>{deployFee !== undefined ? ((deployFee as bigint) > 0n ? <Amount value={deployFee as bigint} /> : "free on testnet") : "…"}</dd></div>
          </dl>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
        {step < STEPS.length - 1
          ? <Button onClick={() => setStep(step + 1)} disabled={step === 2 && tokens.length === 0 && (direct || escrow)}>Continue</Button>
          : <Button disabled={!isConnected || isPending} onClick={launch}>{isConnected ? "Launch instance" : "Connect a wallet to launch"}</Button>}
      </div>
    </div>
  )
}
