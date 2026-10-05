"use client"
import { useState } from "react"
import { useAccount, useReadContracts, useSignTypedData } from "wagmi"
import { getBlock, readContract } from "wagmi/actions"
import { toast } from "sonner"
import { isAddress, zeroAddress, type Address } from "viem"
import { abis, wagmiConfig } from "@/lib/bitregalo/config"
import { errorText } from "@/lib/bitregalo/errors"
import { useNow, useTx } from "@/lib/bitregalo/hooks"
import { encodeLabel, labelBytes } from "@/lib/bitregalo/instances"
import { KYC_TYPES, kycDomain, packApproval, unpackApproval, type SignedApproval, type Voucher } from "@/lib/bitregalo/kyc"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Addr, Card, Fact, Facts, Field, Section, inputCls } from "@/components/app/ui"
import { AddOn } from "@/components/app/wizard/fields"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase()
const isZero = (a?: string) => !a || /^0x0{40}$/.test(a)
const when = (ts: bigint | number) => new Date(Number(ts) * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
const addressAttrs = { autoCapitalize: "none", autoCorrect: "off", spellCheck: false, autoComplete: "off" } as const
const NO_REF = `0x${"0".repeat(64)}` as const

/**
 * Identity checks for one workspace. When they are on, a wallet needs an approval signed by the
 * workspace's attester before it can post, offer, pay, buy or redeem. Four kinds of people use
 * this section: the admin (switches the checks on and names the attester), the attester (approves
 * people), the attester or the admin (ends an approval), and anyone (checks a wallet, or submits
 * an approval they were handed).
 */
export function IdentityChecks() {
  const t = useTenant()
  const { address } = useAccount()
  const { send, isPending } = useTx()
  const { signTypedDataAsync } = useSignTypedData()
  const q = useReadContracts({
    contracts: [
      { address: t.instance, abi: abis.instance, functionName: "kycRequired" },
      { address: t.instance, abi: abis.instance, functionName: "attester" },
      { address: t.instance, abi: abis.instance, functionName: "attesterEpoch" },
      { address: t.instance, abi: abis.instance, functionName: "admin" },
    ],
    query: { refetchInterval: 15_000 },
  })
  const [requiredRaw, attesterRaw, , adminRaw] = (q.data ?? []).map((r) => r.result) as [boolean?, Address?, number?, Address?]
  const required = !!requiredRaw
  const attester = isZero(attesterRaw) ? undefined : attesterRaw
  const isAdmin = same(adminRaw, address)
  const isAttester = same(attester, address)

  // Admin: the switch and the attester.
  const [on, setOn] = useState<boolean | null>(null)
  const [newAttester, setNewAttester] = useState<string | null>(null)
  const wantOn = on ?? required
  const wantAttester = (newAttester ?? attester ?? "").trim()
  const attesterChanges = wantAttester !== "" && !same(wantAttester, attester)
  const settingsChange = wantOn !== required || attesterChanges || (wantAttester === "" && !!attester)
  const settingsProblem = wantOn && !isAddress(wantAttester) ? "Enter the attester's wallet address" : wantAttester !== "" && !isAddress(wantAttester) ? "That is not a wallet address" : null

  // Attester: approve a person.
  const [subject, setSubject] = useState("")
  const [until, setUntil] = useState("")
  const [note, setNote] = useState("")
  const [signed, setSigned] = useState<SignedApproval | null>(null)
  const [busy, setBusy] = useState(false)
  const expiry = until ? BigInt(Math.floor(new Date(until).getTime() / 1000)) : 0n
  const now = useNow()
  const approveProblem = !isAddress(subject) ? "Enter the person's wallet address" : !until ? "Choose until when the approval is valid" : expiry <= BigInt(now) ? "The valid-until time must be in the future" : labelBytes(note) > 31 ? "Keep the reference to 31 characters" : null

  // Ending an approval, checking a wallet, submitting a pasted approval.
  const [revokee, setRevokee] = useState("")
  const [checked, setChecked] = useState<string | null>(null)
  const [pasted, setPasted] = useState("")
  const lookup = (checked ?? address ?? "").trim()
  const parsed = pasted.trim() ? unpackApproval(pasted, t.instance) : null

  const refresh = () => { q.refetch() }

  /** Builds the voucher from what the chain says now, and has the attester's wallet sign it. */
  async function sign(): Promise<SignedApproval> {
    // The epoch and the time come from the chain, not from this page or this computer's clock:
    // a voucher dated ahead of the network's time is refused.
    const [epoch, block] = await Promise.all([
      readContract(wagmiConfig, { address: t.instance, abi: abis.instance, functionName: "attesterEpoch" }) as Promise<number>,
      getBlock(wagmiConfig),
    ])
    const voucher: Voucher = {
      subject: subject as Address, tenantId: t.id, attesterEpoch: Number(epoch), issuedAt: block.timestamp, expiry,
      ref: note.trim() ? encodeLabel(note) : NO_REF,
    }
    const signature = await signTypedDataAsync({ domain: kycDomain(t.instance), types: KYC_TYPES, primaryType: "KycVoucher", message: voucher })
    return { voucher, signature }
  }
  const record = (a: SignedApproval) =>
    send("Record the approval", { address: t.instance, abi: abis.instance, functionName: "submitKycVoucher", args: [a.voucher, a.signature] })

  async function approve(alsoRecord: boolean) {
    setBusy(true)
    const id = toast.loading("Approve a person: sign the approval in your wallet…")
    try {
      const a = await sign()
      toast.success("Approval signed", { id })
      setSigned(a)
      if (alsoRecord) { await record(a); setChecked(a.voucher.subject); refresh() }
    } catch (e) {
      toast.error("The approval was not signed", { id, description: errorText(e) })
    } finally {
      setBusy(false)
    }
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); toast.success("Signed approval copied") } catch { toast.error("Could not copy. Select the text and copy it yourself.") }
  }

  return (
    <Section
      title="Identity checks"
      description="A workspace can ask that a wallet is approved by its attester before it posts, offers, pays, buys or redeems. The attester is a key the workspace trusts to check who people are. Reading is never restricted."
    >
      <div id="identity" className="scroll-mt-32 space-y-6">
        <Card title="How it stands">
          <Facts columns={2}>
            <Fact label="Identity checks">{q.data ? (required ? "On. A wallet needs an approval to act here." : "Off. Nobody needs an approval.") : "…"}</Fact>
            <Fact label="Attester">{q.data ? (attester ? <><Addr a={attester} />{isAttester ? " (you)" : ""}</> : "None set") : "…"}</Fact>
          </Facts>
        </Card>

        <Card title="Check a wallet" description="Anyone can look. An approval is public: which wallet, until when, and nothing about the person.">
          <Field label="Wallet address" hint={address && checked === null ? "Your connected wallet. Enter another address to check someone else." : undefined}>
            <input className={cn(inputCls, "t-mono")} value={lookup} onChange={(e) => setChecked(e.target.value)} placeholder="0x…" {...addressAttrs} />
          </Field>
          {isAddress(lookup) && <Status subject={lookup} required={required} />}
        </Card>

        {isAdmin && (
          <Card title="Switch on, and choose the attester" description="Admin only. The attester signs approvals; the admin does not need to be the attester.">
            <div className="grid max-w-160 gap-5">
              <AddOn
                checked={wantOn}
                onChange={setOn}
                title="Ask for an identity approval"
                description="When on, a wallet without a valid approval cannot post, offer, pay, buy or redeem here, and cannot be paid. The workspace treasury is exempt."
                tag={q.data ? (required ? "On now" : "Off now") : undefined}
              />
              <Field
                label="Attester's wallet address"
                hint="An ordinary wallet key, not a contract wallet: the workspace contract checks a plain signature. Changing the attester later ends every approval given so far. Leave it empty only while the checks are off."
              >
                <input className={cn(inputCls, "t-mono")} value={newAttester ?? attester ?? ""} onChange={(e) => setNewAttester(e.target.value.trim())} placeholder="0x…" {...addressAttrs} />
              </Field>
              {!!attester && (attesterChanges || wantAttester === "") && (
                <p className="rounded-lg bg-destructive-fill px-4 py-3 text-sm">
                  Changing the attester ends every approval given so far, for everyone, for good. Setting the old attester again does not bring them back: each person needs a new approval from the new attester.
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <Button
                  variant="secondary"
                  disabled={isPending || !q.data || !settingsChange || !!settingsProblem}
                  onClick={() => send("Save identity checks", { address: t.instance, abi: abis.instance, functionName: "setKyc", args: [wantOn, wantAttester === "" ? zeroAddress : wantAttester] }).then(() => { setOn(null); setNewAttester(null); refresh() })}
                >
                  Save identity checks
                </Button>
                <p className="text-sm text-muted-foreground" role="status">{settingsProblem ?? (settingsChange ? "" : "Nothing to save: this is how it stands now.")}</p>
              </div>
            </div>
          </Card>
        )}

        {isAttester && (
          <Card title="Approve a person" description="Attester only. Your wallet signs an approval for one wallet, valid until the time you choose. Signing costs nothing. Recording it in the workspace is a transaction, which you or anyone else can send.">
            <div className="grid max-w-160 gap-5">
              <Field label="The person's wallet address">
                <input className={cn(inputCls, "t-mono")} value={subject} onChange={(e) => { setSubject(e.target.value.trim()); setSigned(null) }} placeholder="0x…" {...addressAttrs} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Valid until" hint="After this the person needs a new approval.">
                  <input className={inputCls} type="datetime-local" value={until} onChange={(e) => { setUntil(e.target.value); setSigned(null) }} />
                </Field>
                <Field label="Your reference (optional)" hint="A case number, say. Public, so nothing personal. Up to 31 characters.">
                  <input className={inputCls} value={note} onChange={(e) => { setNote(e.target.value); setSigned(null) }} placeholder="Case 2026-0142" />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                <Button disabled={busy || isPending || !!approveProblem} onClick={() => approve(true)}>Sign and record the approval</Button>
                <Button variant="secondary" disabled={busy || isPending || !!approveProblem} onClick={() => approve(false)}>Sign only, to pass on</Button>
                {approveProblem && <p className="text-sm text-muted-foreground" role="status">{approveProblem}</p>}
              </div>
              {signed && (
                <div className="grid gap-3 border-t border-border pt-5">
                  <p className="text-sm text-muted-foreground">
                    The signed approval for <Addr a={signed.voucher.subject} />, valid until {when(signed.voucher.expiry)}. Whoever holds this text can record it under “Submit a signed approval” below; it cannot be changed or used for another wallet.
                  </p>
                  <textarea readOnly className={cn(inputCls, "t-mono h-auto min-h-40 py-2.5 text-xs")} value={packApproval(t.instance, signed)} aria-label="Signed approval" />
                  <div><Button variant="secondary" onClick={() => copy(packApproval(t.instance, signed))}>Copy the signed approval</Button></div>
                </div>
              )}
            </div>
          </Card>
        )}

        {(isAttester || isAdmin) && (
          <Card title="End a person's approval" description="The attester or the admin. The approval stops counting at once. A new approval for that person can be recorded only ten minutes later.">
            <div className="grid max-w-160 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Field label="The person's wallet address">
                <input className={cn(inputCls, "t-mono")} value={revokee} onChange={(e) => setRevokee(e.target.value.trim())} placeholder="0x…" {...addressAttrs} />
              </Field>
              <Button variant="secondary" disabled={isPending || !isAddress(revokee)} onClick={() => send("End the approval", { address: t.instance, abi: abis.instance, functionName: "revokeKyc", args: [revokee] }).then(() => { setChecked(revokee); setRevokee("") })}>End the approval</Button>
            </div>
          </Card>
        )}

        <Card title="Submit a signed approval" description="If the attester gave you a signed approval as text, paste it here to record it. Anyone can do this for anyone; it only costs the network fee.">
          <div className="grid max-w-160 gap-3">
            <textarea className={cn(inputCls, "t-mono h-auto min-h-32 py-2.5 text-xs")} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder='{ "bitregalo": "identity-approval", … }' aria-label="Signed approval to submit" spellCheck={false} />
            {typeof parsed === "string" && <p className="text-sm text-destructive" role="status">{parsed}</p>}
            {parsed && typeof parsed !== "string" && (
              <p className="text-sm text-muted-foreground">An approval for <Addr a={parsed.voucher.subject} />, valid until {when(parsed.voucher.expiry)}.</p>
            )}
            <div>
              <Button variant="secondary" disabled={isPending || !address || !parsed || typeof parsed === "string"} onClick={() => { if (parsed && typeof parsed !== "string") record(parsed).then(() => { setChecked(parsed.voucher.subject); setPasted("") }) }}>Record this approval</Button>
            </div>
            {!address && <p className="text-sm text-muted-foreground">Connect a wallet to send the transaction.</p>}
          </div>
        </Card>
      </div>
    </Section>
  )
}

/** Where one wallet stands, in a sentence. */
function Status({ subject, required }: { subject: string; required: boolean }) {
  const t = useTenant()
  const now = useNow()
  const q = useReadContracts({
    contracts: [
      { address: t.instance, abi: abis.instance, functionName: "kycOf", args: [subject] },
      { address: t.instance, abi: abis.instance, functionName: "isKycValid", args: [subject] },
      { address: t.instance, abi: abis.instance, functionName: "attesterEpoch" },
    ],
    query: { refetchInterval: 10_000 },
  })
  const k = q.data?.[0]?.result as { validUntil: bigint; issuedAt: bigint; attesterEpoch: number } | undefined
  const valid = q.data?.[1]?.result as boolean | undefined
  const epoch = q.data?.[2]?.result as number | undefined
  if (!k || valid === undefined) return <p className="mt-4 text-sm text-muted-foreground" role="status">Reading…</p>
  const none = k.validUntil === 0n && k.issuedAt === 0n
  const ended = k.validUntil === 0n && k.issuedAt > 0n
  const stale = !none && !ended && epoch !== undefined && Number(k.attesterEpoch) !== Number(epoch)
  const live = !none && !ended && !stale && k.validUntil > BigInt(now)
  return (
    <p className="mt-4 text-base" role="status">
      {live ? <><span className="font-[560] text-success">Approved</span> until {when(k.validUntil)}.</>
        : none ? <><span className="font-[560]">No approval</span> is recorded for this wallet.</>
        : ended ? <><span className="font-[560]">The approval was ended.</span> A new one can be recorded from {when(k.issuedAt)}.</>
        : stale ? <><span className="font-[560]">The approval no longer counts:</span> the attester has changed since it was given.</>
        : <><span className="font-[560]">The approval ran out</span> on {when(k.validUntil)}.</>}
      {!required && <span className="block text-sm text-muted-foreground">Identity checks are off here, so this wallet can act with or without an approval.</span>}
      {required && !valid && <span className="block text-sm text-muted-foreground">This wallet cannot post, offer, pay, buy or redeem here until the attester approves it.</span>}
    </p>
  )
}
