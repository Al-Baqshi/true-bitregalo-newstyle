"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { formatUnits, isAddress, maxUint256, parseUnits, type Address } from "viem"
import { abis } from "@/lib/bitregalo/config"
import { useErc20 } from "@/lib/bitregalo/hooks"
import { encodeLabel, eventArgs, labelBytes, useProjects, useSettlementTokens } from "@/lib/bitregalo/instances"
import { useInstanceRules } from "@/lib/bitregalo/instance-rules"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Wizard, type WizardAction, type WizardStep } from "./wizard"
import { Done, Label, Note, input } from "./fields"
import { Amount } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

/** Values a payment link can carry. `fixed` locks the amount so the payer only confirms. */
export type PayPrefill = { to?: string; token?: string; amount?: string; ref?: string; project?: string; fixed?: boolean }

export function PayWizard({ prefill = {} }: { prefill?: PayPrefill }) {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { address } = useAccount()
  const rules = useInstanceRules(t.instance)
  const tokens = useSettlementTokens(t.instance, t.id)
  const projects = useProjects(t.instance)
  const [to, setTo] = useState(prefill.to ?? "")
  const [token, setToken] = useState(prefill.token ?? "")
  const [amount, setAmount] = useState(prefill.amount ?? "")
  const [ref, setRef] = useState(prefill.ref ?? "")
  const [project, setProject] = useState(prefill.project ?? "0")
  const locked = !!prefill.to && isAddress(prefill.to)
  const fixed = locked && !!prefill.fixed && Number(prefill.amount) > 0
  const chosen = tokens.accepted.find((x) => x.address.toLowerCase() === token.toLowerCase()) ?? tokens.accepted[0]
  const erc = useErc20(chosen?.address, address)
  const value = chosen && Number(amount) > 0 ? parseUnits(amount, chosen.decimals) : 0n
  const fee = (value * BigInt(rules.feeBps)) / 10_000n
  const total = value + (chosen?.serviceFee ?? 0n)
  const self = !!address && to.toLowerCase() === address.toLowerCase()
  const refLong = labelBytes(ref) > 31

  const steps: WizardStep[] = [
    {
      id: "who", title: "Recipient and amount",
      valid: !rules.loaded ? "Loading workspace rules…" : !rules.direct ? "Direct payment is switched off in this workspace" : !chosen ? "This workspace accepts no currency yet" : !isAddress(to) ? "Enter the recipient's address" : self ? "You cannot pay yourself" : !(value > 0n) ? "Enter an amount" : true,
      content: (
        <div className="grid gap-5">
          <Label title="Recipient" hint={locked ? "Set by the payment link." : "The wallet that receives the payment. Paste it, or open the link they sent you."}>
            <input className={`${input} bq-mono`} value={to} readOnly={locked} onChange={(e) => setTo(e.target.value.trim())} placeholder="0x…" />
          </Label>
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <Label title="Amount" hint={fixed ? "Set by the payment link." : undefined}>
              <input className={`${input} bq-mono`} type="number" min="0" step="any" value={amount} readOnly={fixed} onChange={(e) => setAmount(e.target.value)} placeholder="25" />
            </Label>
            <Label title="Currency">
              <select className={input} value={chosen?.address ?? ""} disabled={locked && !!prefill.token} onChange={(e) => setToken(e.target.value)}>
                {tokens.accepted.map((x) => <option key={x.address} value={x.address}>{x.symbol}</option>)}
              </select>
            </Label>
          </div>
          {chosen && (
            <Note>
              You send <Amount value={total} decimals={chosen.decimals} symbol={chosen.symbol} /> in total
              {chosen.serviceFee > 0n && <> (includes a <Amount value={chosen.serviceFee} decimals={chosen.decimals} symbol={chosen.symbol} /> service fee)</>}.
              The recipient gets <Amount value={value - fee} decimals={chosen.decimals} symbol={chosen.symbol} /> after the {rules.feeBps / 100}% platform fee.
              Your balance: <Amount value={erc.balance} decimals={erc.decimals} symbol={erc.symbol} />.
              {erc.balance < total && value > 0n && <strong className="text-destructive"> Not enough {chosen.symbol}.</strong>}
            </Note>
          )}
        </div>
      ),
    },
    {
      id: "ref", title: "Reference",
      valid: true,
      content: (
        <div className="grid gap-5">
          <Label title="Reference (optional)" hint={refLong ? "Longer than 31 characters, so only its fingerprint is stored. Keep the text yourself." : "An invoice number, order id or a short message. Shown on the receipt to anyone who looks."} counter={`${labelBytes(ref)}/31`}>
            <input className={input} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Invoice 1042 · Thanks, Ana" />
          </Label>
          <Label title="Project (optional)">
            <select className={input} value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="0">No project</option>
              {projects.list.filter((p) => p.active).map((p) => <option key={String(p.id)} value={String(p.id)}>#{String(p.id)} · {p.label ?? "private project"}</option>)}
            </select>
          </Label>
          <Note>A direct payment is final. It goes to the recipient in the same transaction; there is no escrow to release or cancel. For goods you have not received yet, ask the seller for an escrow listing instead.</Note>
        </div>
      ),
    },
  ]
  const needApprove = !!chosen && erc.allowance < total
  const approve: WizardAction[] = needApprove
    ? [{ id: "approve", label: `Allow the vault to move your ${chosen!.symbol}`, detail: "One-time approval, reused for later payments", run: async ({ tx }) => { await tx("Approve", { address: chosen!.address, abi: abis.erc20, functionName: "approve", args: [t.vault, maxUint256] }) } }]
    : []
  return (
    <Wizard
      eyebrow={`Workspace #${t.id} · payment`}
      title={locked ? "Confirm this payment" : "Pay someone"}
      intro={locked ? "Someone sent you a payment link. Check the recipient and amount, then sign. The money goes straight to them." : "Send a stablecoin or a workspace token to any wallet. Fees are the same as any direct settlement here."}
      steps={steps}
      signLabel="Pay now"
      plan={[
        ...approve,
        {
          id: "pay", label: chosen ? `Pay ${amount || "…"} ${chosen.symbol}` : "Pay", detail: `To ${to ? `${to.slice(0, 8)}…` : "…"}`,
          run: async ({ tx, results }) => {
            const r = await tx("Pay", {
              address: t.instance, abi: abis.instance, functionName: "pay",
              args: [to as Address, chosen!.address, value, encodeLabel(ref || ""), BigInt(project)],
            })
            results.paymentId = eventArgs<{ paymentId: bigint }>(r, abis.instance, "Paid").paymentId
            erc.refetch()
          },
        },
      ]}
      summary={[
        { label: "To", value: to ? `${to.slice(0, 10)}…` : "…" },
        { label: "Amount", value: chosen ? `${amount || "…"} ${chosen.symbol}` : "—" },
        { label: "They receive", value: chosen ? `${formatUnits(value - fee, chosen.decimals)} ${chosen.symbol}` : "—" },
        { label: "Reference", value: ref || "—" },
      ]}
      done={(r) => (
        <Done title="Paid" actions={<><Button asChild><Link href={`${base}/payments/${String(r.paymentId)}`}>Open receipt #{String(r.paymentId)}</Link></Button><Button asChild variant="secondary"><Link href={`${base}/pay`}>Pay someone else</Link></Button></>}>
          <p>The recipient has the funds now. Send them the receipt link as proof; it shows the amount, the reference and both wallets.</p>
        </Done>
      )}
    />
  )
}
