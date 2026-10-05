"use client"
import { use, useState } from "react"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { parseUnits, isAddress, zeroAddress, type Address } from "viem"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useErc20, useTx } from "@/lib/bitregalo/hooks"
import { encodeLabel, labelBytes } from "@/lib/bitregalo/instances"
import { abis, addresses } from "@/lib/bitregalo/config"
import { Card, Amount, PageHead, Stats, Stat, Facts, Fact, Section, Addr, Empty, Notice, Pill, type Tone } from "@/components/app/ui"
import { input, Label } from "@/components/app/wizard/fields"
import { Button } from "@/components/ui/button"

const isZero = (a?: string) => !a || /^0x0{40}$/.test(a)
const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase()
const addressAttrs = { autoCapitalize: "none", autoCorrect: "off", spellCheck: false } as const

export default function TokenPage({ params }: { params: Promise<{ address: string }> }) {
  const t = useTenant()
  const base = t.base
  const { address: raw } = use(params)
  const token = raw as Address
  const { address } = useAccount()
  const { send, isPending } = useTx()
  const q = useReadContracts({
    contracts: [
      { address: token, abi: abis.utilityToken, functionName: "name" },
      { address: token, abi: abis.utilityToken, functionName: "symbol" },
      { address: token, abi: abis.utilityToken, functionName: "decimals" },
      { address: token, abi: abis.utilityToken, functionName: "totalSupply" },
      { address: token, abi: abis.utilityToken, functionName: "cap" },
      { address: token, abi: abis.utilityToken, functionName: "owner" },
      { address: token, abi: abis.utilityToken, functionName: "pendingOwner" },
      { address: token, abi: abis.erc20, functionName: "balanceOf", args: [address ?? zeroAddress] },
      { address: t.instance, abi: abis.instance, functionName: "tokens", args: [token] },
      { address: t.instance, abi: abis.instance, functionName: "redeemable", args: [token] },
      // Who created it, for which workspace and project: recorded by the token factory.
      { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tokenInfo", args: [token] },
    ],
    query: { enabled: isAddress(raw), refetchInterval: 10_000 },
  })
  const [name, symbol, decRaw, supply, cap, owner, pendingOwner, balance, cfg, redeemableRaw, created] = (q.data ?? []).map((r) => r.result) as
    [string?, string?, number?, bigint?, bigint?, Address?, Address?, bigint?, (readonly [boolean, number, bigint])?, boolean?, (readonly [bigint, bigint, Address, bigint])?]
  const treasuryOwnerQ = useReadContract({ address: t.treasury, abi: abis.workspaceTreasury, functionName: "owner", query: { enabled: !!t.treasury, refetchInterval: 20_000 } })
  const treasuryOwner = treasuryOwnerQ.data as Address | undefined
  const erc = useErc20(isAddress(raw) ? token : undefined, address)
  const [redeemAmt, setRedeemAmt] = useState("")
  const [redeemRef, setRedeemRef] = useState("")
  const [to, setTo] = useState("")
  const [amt, setAmt] = useState("")
  const [mintTo, setMintTo] = useState("")
  const [mintAmt, setMintAmt] = useState("")
  const [fee, setFee] = useState("0")
  const [newOwner, setNewOwner] = useState("")
  const back = { href: `${base}/tokens`, label: "All tokens" }
  if (!isAddress(raw)) {
    return (
      <div className="space-y-8">
        <PageHead back={back} title="Token" />
        <Card flush><Empty title="That is not a token address" body="A token address starts with 0x and is 42 characters long. Check the link you followed." action={<Button asChild variant="secondary"><Link href={back.href}>All tokens</Link></Button>} /></Card>
      </div>
    )
  }
  const sym = symbol ?? "tokens"
  const dec = Number(decRaw ?? 18)
  const units = (s: string) => parseUnits(s || "0", dec)
  const fixed = !!owner && isZero(owner)
  const isOwner = same(owner, address)
  const isAdmin = same(t.admin, address)
  const accepted = !!cfg?.[0]
  const redeemable = !!redeemableRaw
  const capped = !!cap && cap > 0n
  // Only a token the factory created for this workspace can be made redeemable here.
  const ours = !!created && !isZero(created[2]) && created[0] === t.id
  const projectId = created && created[1] > 0n ? created[1] : null
  const treasuryOwns = same(owner, t.treasury)
  const offeredTo = !isZero(pendingOwner) ? pendingOwner : undefined
  const offeredToTreasury = same(offeredTo, t.treasury)
  const offeredToMe = same(offeredTo, address)
  const isTreasuryOwner = same(treasuryOwner, address)
  const refresh = () => { q.refetch(); erc.refetch() }

  async function redeem() {
    const n = units(redeemAmt)
    // Redeeming carries no fee, so the vault is allowed exactly the amount handed back.
    if (erc.allowance < n) await send(`Allow the vault to take ${redeemAmt} ${sym}`, { address: token, abi: abis.erc20, functionName: "approve", args: [t.vault, n] })
    await send(`Redeem ${redeemAmt} ${sym}`, { address: t.instance, abi: abis.instance, functionName: "redeem", args: [token, n, redeemRef.trim() ? encodeLabel(redeemRef) : `0x${"0".repeat(64)}`] })
    setRedeemAmt(""); setRedeemRef(""); refresh()
  }
  const offer = (label: string, to: Address) => send(label, { address: token, abi: abis.utilityToken, functionName: "transferOwnership", args: [to] }).then(() => { setNewOwner(""); refresh() })

  const runs = isAdmin || isOwner || isTreasuryOwner
  const who = isOwner && isAdmin ? "You own this token and you run this workspace." : isOwner ? "You own this token." : isAdmin ? "You run this workspace." : "You own this workspace's treasury."

  return (
    <div className="space-y-10">
      <PageHead
        back={back}
        title={<>{name ?? "…"} <span className="text-muted-foreground">{symbol ?? ""}</span></>}
        intro={<>A token issued for this workspace{projectId ? `, for project #${String(projectId)}` : ""}, at <Addr a={token} />. {accepted ? "It can be used to pay here." : "It is not yet usable for payments in this workspace; only the workspace admin can switch that on."}</>}
      />

      <Stats>
        <Stat label={address ? "You hold" : "Your balance"} value={address ? <Amount value={balance ?? 0n} decimals={dec} /> : "—"} hint={address ? sym : "Connect a wallet to see your balance"} />
        <Stat label="In existence" value={<Amount value={supply ?? 0n} decimals={dec} />} hint={sym} />
        <Stat label="Maximum" value={capped ? <Amount value={cap!} decimals={dec} /> : fixed ? <Amount value={supply ?? 0n} decimals={dec} /> : "No limit"} hint={fixed ? "Fixed: nobody can create more" : capped ? "Written into the contract" : "Its owner can create more"} />
      </Stats>

      {offeredToMe && (
        <Notice tone="accent" title={`Ownership of ${sym} has been offered to you`} action={<Button disabled={isPending} onClick={() => send(`Accept ownership of ${sym}`, { address: token, abi: abis.utilityToken, functionName: "acceptOwnership", args: [] }).then(refresh)}>Accept ownership</Button>}>
          <p>Nothing changes until you accept. Once you do, only your wallet can create new {sym}.</p>
        </Notice>
      )}

      {runs && (
        <Section title="What you can do next" description={who}>
          <Card flush>
            <Step
              title="Accept it for payments here"
              state={accepted ? "On" : "Not yet"} tone={accepted ? "good" : "muted"}
              action={isAdmin ? (
                accepted
                  ? <Button variant="secondary" disabled={isPending} onClick={() => send(`Stop accepting ${sym}`, { address: t.instance, abi: abis.instance, functionName: "setToken", args: [token, false, 0n] }).then(refresh)}>Stop payments in {sym}</Button>
                  : (
                    <div className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_auto] sm:items-end">
                      <Label title={`Service fee per payment (${sym})`} hint="Added to each payment and paid to the platform. 0 is fine."><input className={`${input} t-num`} type="number" inputMode="decimal" min="0" step="any" value={fee} onChange={(e) => setFee(e.target.value)} /></Label>
                      <div className="sm:pb-8"><Button variant="secondary" disabled={isPending} onClick={() => send(`Accept ${sym}`, { address: t.instance, abi: abis.instance, functionName: "setToken", args: [token, true, units(fee)] }).then(refresh)}>Allow payments in {sym}</Button></div>
                    </div>
                  )
              ) : undefined}
            >
              {accepted
                ? <>Requests, listings and escrows in this workspace can be paid in {sym}{cfg && cfg[2] > 0n ? <>, with a service fee of <Amount value={cfg[2]} decimals={dec} symbol={sym} /> per payment</> : ""}.</>
                : isAdmin ? `Let requests, listings and escrows in this workspace be paid in ${sym}.` : <>Only the workspace admin, <Addr a={t.admin} />, can switch this on.</>}
            </Step>

            <Step
              title="Sell it in the shop"
              action={isAdmin ? <Button asChild variant="secondary"><Link href={`${base}/shop/new?token=${token}`}>Open a sale of {sym}</Link></Button> : undefined}
            >
              {isAdmin
                ? <>Put {sym} on sale for a stablecoin, or free to claim. Buyers pay into the workspace treasury and get the tokens in the same transaction. A sale starts once the treasury&apos;s owner approves it.</>
                : <>Only the workspace admin, <Addr a={t.admin} />, can open a sale. The tokens for it come from the workspace treasury.</>}
            </Step>

            <Step
              title={`Let holders redeem ${sym}`}
              state={redeemable ? "On" : "Off"} tone={redeemable ? "good" : "muted"}
              action={isAdmin && (ours || redeemable) ? (
                redeemable
                  ? <Button variant="secondary" disabled={isPending} onClick={() => send(`Stop redeeming of ${sym}`, { address: t.instance, abi: abis.instance, functionName: "setRedeemable", args: [token, false] }).then(refresh)}>Stop redeeming</Button>
                  : <Button variant="secondary" disabled={isPending} onClick={() => send(`Let holders redeem ${sym}`, { address: t.instance, abi: abis.instance, functionName: "setRedeemable", args: [token, true] }).then(refresh)}>Let holders redeem {sym}</Button>
              ) : undefined}
            >
              {!created ? "…"
                : !ours ? "This token was not created for this workspace, so it cannot be made redeemable here."
                : redeemable ? <>Holders can hand {sym} back to the workspace treasury with a reference, at no fee. That is how a voucher or a credit is spent.</>
                : isAdmin ? <>Holders cannot redeem {sym} yet. Opening a sale does not switch this on: it is your separate decision.</>
                : <>Holders cannot redeem {sym} yet. Only the workspace admin, <Addr a={t.admin} />, can switch this on.</>}
            </Step>

            {!fixed && (
              <Step
                title="Let the treasury create it as it sells"
                state={treasuryOwns ? "On" : offeredToTreasury ? "Waiting for the treasury's owner" : "Off"} tone={treasuryOwns ? "good" : offeredToTreasury ? "accent" : "muted"}
                action={
                  offeredToTreasury && isTreasuryOwner ? <Button disabled={isPending} onClick={() => send(`Accept ${sym} for the treasury`, { address: t.treasury!, abi: abis.workspaceTreasury, functionName: "acceptToken", args: [token] }).then(refresh)}>Accept for the treasury</Button>
                    : isOwner && !offeredTo && t.treasury ? <Button variant="secondary" disabled={isPending} onClick={() => offer(`Offer ${sym} to the treasury`, t.treasury!)}>Offer {sym} to the treasury</Button>
                    : undefined
                }
              >
                {treasuryOwns
                  ? <>The workspace treasury owns {sym} and creates what a sale needs, within what its owner approved for that sale. Its owner can hand the token back from the <Link className="underline decoration-1 underline-offset-[3px] hover:text-foreground" href={`${base}/treasury`}>Treasury page</Link>.</>
                  : offeredToTreasury
                    ? <>{sym} has been offered to the workspace treasury. It takes effect when the treasury&apos;s owner, <Addr a={treasuryOwner ?? ""} />{isTreasuryOwner ? " (you)" : ""}, accepts. Until then {isOwner ? "you still own" : "the owner still owns"} the token.</>
                    : <>Two steps. The token&apos;s owner offers it to the workspace treasury, then the treasury&apos;s owner accepts. After that a sale needs no stock: the treasury creates the tokens as they sell, and the owner&apos;s wallet can no longer create them.</>}
              </Step>
            )}

            {isOwner && (
              <Step
                title="Hand ownership to someone else"
                state={offeredTo && !offeredToTreasury ? "Waiting for them to accept" : undefined} tone="accent"
                action={
                  offeredTo ? (
                    <Button variant="secondary" disabled={isPending} onClick={() => offer("Withdraw the offer", zeroAddress)}>Withdraw the offer</Button>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                      <Label title="New owner's wallet address"><input className={`${input} t-mono`} value={newOwner} onChange={(e) => setNewOwner(e.target.value.trim())} placeholder="0x…" {...addressAttrs} /></Label>
                      <Button variant="secondary" disabled={isPending || !isAddress(newOwner) || same(newOwner, address)} onClick={() => offer(`Offer ownership of ${sym}`, newOwner as Address)}>Offer ownership</Button>
                    </div>
                  )
                }
              >
                {offeredTo
                  ? <>Offered to {offeredToTreasury ? "the workspace treasury" : <Addr a={offeredTo} />}. You stay the owner until {offeredToTreasury ? "its owner accepts" : "they accept, which they do from this page"}. You can withdraw the offer until then.</>
                  : <>The owner is the wallet that can create new {sym}. Handing it over takes two steps: you offer it, and the new owner accepts from this page. A mistyped address cannot lose the token.</>}
              </Step>
            )}

            {isOwner && (
              <Step
                title="Create more"
                action={
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
                    <Label title="Give them to" hint="Leave empty to give them to yourself."><input className={`${input} t-mono`} value={mintTo} onChange={(e) => setMintTo(e.target.value)} placeholder={address} {...addressAttrs} /></Label>
                    <Label title="Amount" hint={capped ? "Up to the maximum." : "Any amount."}><input className={`${input} t-num`} type="number" inputMode="decimal" min="0" step="any" value={mintAmt} onChange={(e) => setMintAmt(e.target.value)} placeholder="0" /></Label>
                    <div className="sm:pb-8"><Button variant="secondary" disabled={isPending || !(Number(mintAmt) > 0)} onClick={() => send(`Create ${sym}`, { address: token, abi: abis.utilityToken, functionName: "mint", args: [isAddress(mintTo) ? mintTo : address, units(mintAmt)] }).then(() => { setMintAmt(""); refresh() })}>Create</Button></div>
                  </div>
                }
              >
                New {sym} go to the wallet you name, or to you{capped ? ", up to the maximum" : ""}.
              </Step>
            )}
          </Card>
        </Section>
      )}

      <Card title="About this token">
        <Facts>
          {(!created || !isZero(created[2])) && <Fact label="Issued by">
            {!created ? "…" : <><Addr a={created[2]} />{same(created[2], address) ? " (you)" : same(created[2], t.admin) ? " (the workspace admin)" : ""}{created[1] > 0n ? `, for project #${String(created[1])}` : ", as the workspace's own token"}</>}
          </Fact>}
          <Fact label="Can it be used to pay here?">{accepted ? `Yes. Requests, listings and escrows in this workspace can be paid in ${sym}.` : "Not yet. The workspace admin has not switched it on, and only the admin can."}</Fact>
          <Fact label="Redeeming">{redeemable ? `Yes. Holders can hand ${sym} back to the workspace with a reference, at no fee.` : "Not yet. The workspace admin decides whether holders can redeem it."}</Fact>
          <Fact label="Supply">{fixed ? "Fixed. Nobody can create more, including its creator." : capped ? <>Capped at <Amount value={cap!} decimals={dec} /> {sym}. Its owner can create more up to that.</> : "Open. Its owner can create more."}</Fact>
          <Fact label="Who can create more">
            {fixed ? "Nobody, ever. The right to create more was given up." : treasuryOwns ? "The workspace treasury, as it sells." : owner ? <><Addr a={owner} />{isOwner ? " (you)" : ""}</> : "…"}
            {offeredTo && !fixed && <span className="block text-sm font-normal text-muted-foreground">Offered to {offeredToTreasury ? "the workspace treasury" : <Addr a={offeredTo} />}, not accepted yet.</span>}
          </Fact>
        </Facts>
      </Card>

      <Section title="Your tokens" description={`What anyone holding ${sym} can do.`}>
        <div className="space-y-6">
          {redeemable && (
            <Card title="Redeem" description={`Spend your ${sym}: hand tokens back to the workspace with a reference they will recognise, such as an order, a seat or a booking. No fee is charged.`}>
              <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-end">
                <Label title="Amount"><input className={`${input} t-num`} type="number" inputMode="decimal" min="0" step="any" value={redeemAmt} onChange={(e) => setRedeemAmt(e.target.value)} placeholder="0" /></Label>
                <Label title="Reference" counter={`${labelBytes(redeemRef)}/31`}><input className={input} value={redeemRef} onChange={(e) => setRedeemRef(e.target.value)} placeholder="Order 1042, table 4" /></Label>
                <Button disabled={isPending || !address || !(Number(redeemAmt) > 0) || labelBytes(redeemRef) > 31 || (balance ?? 0n) < units(redeemAmt)} onClick={redeem}>Redeem</Button>
              </div>
              {!address && <p className="mt-3 text-sm text-muted-foreground">Connect a wallet that holds {sym} to redeem.</p>}
            </Card>
          )}
          <Card title="Send to another wallet" description={`Move some of your ${sym} to someone else. It leaves your wallet straight away.`}>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
              <Label title="To"><input className={`${input} t-mono`} value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x…" {...addressAttrs} /></Label>
              <Label title="Amount"><input className={`${input} t-num`} type="number" inputMode="decimal" min="0" step="any" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0" /></Label>
              <Button variant={redeemable ? "secondary" : "default"} disabled={isPending || !address || !isAddress(to) || !(Number(amt) > 0)} onClick={() => send(`Send ${sym}`, { address: token, abi: abis.utilityToken, functionName: "transfer", args: [to, units(amt)] }).then(() => { setAmt(""); refresh() })}>Send</Button>
            </div>
            {!address && <p className="mt-3 text-sm text-muted-foreground">Connect a wallet that holds {sym} to send.</p>}
          </Card>
        </div>
      </Section>
    </div>
  )
}

/** One thing the person can do next: what it is, where it stands in a word, and the action. */
function Step({ title, state, tone = "muted", children, action }: { title: string; state?: string; tone?: Tone; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="border-b border-border px-5 py-4 last:border-b-0 sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0 max-w-[60ch]">
          <h3 className="text-base font-[560]">{title}</h3>
          <div className="mt-0.5 text-sm text-muted-foreground">{children}</div>
        </div>
        {state && <Pill tone={tone}>{state}</Pill>}
      </div>
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  )
}
