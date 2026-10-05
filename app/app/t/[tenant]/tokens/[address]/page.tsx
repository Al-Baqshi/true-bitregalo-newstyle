"use client"
import { use, useState } from "react"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { parseUnits, isAddress, maxUint256, type Address } from "viem"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useErc20, useTx } from "@/lib/bitregalo/hooks"
import { encodeLabel, labelBytes } from "@/lib/bitregalo/instances"
import { abis, addresses } from "@/lib/bitregalo/config"
import { Card, Amount, PageHead, Stats, Stat, Facts, Fact, Section, Addr, Empty } from "@/components/app/ui"
import { input, Label } from "@/components/app/wizard/fields"
import { Button } from "@/components/ui/button"

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
      { address: token, abi: abis.utilityToken, functionName: "totalSupply" },
      { address: token, abi: abis.utilityToken, functionName: "cap" },
      { address: token, abi: abis.utilityToken, functionName: "owner" },
      { address: token, abi: abis.erc20, functionName: "balanceOf", args: [address ?? addresses.treasury] },
      { address: t.instance, abi: abis.instance, functionName: "tokens", args: [token] },
      ...(t.version >= 1n ? [{ address: t.instance, abi: abis.instance, functionName: "redeemable", args: [token] }] : []),
    ],
    query: { refetchInterval: 10_000 },
  })
  const [name, symbol, supply, cap, owner, balance, cfg, redeemableRaw] = (q.data ?? []).map((r) => r.result) as [string?, string?, bigint?, bigint?, Address?, bigint?, (readonly [boolean, number, bigint])?, boolean?]
  const erc = useErc20(token, address)
  // Who issued it, and for which project: recorded by the token maker when it was created.
  const info = useReadContract({ address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tokenInfo", args: [token], query: { enabled: isAddress(raw) } })
  const created = info.data as readonly [bigint, bigint, Address, bigint] | undefined
  const [redeemAmt, setRedeemAmt] = useState("")
  const [redeemRef, setRedeemRef] = useState("")
  const [to, setTo] = useState("")
  const [amt, setAmt] = useState("")
  const [mintTo, setMintTo] = useState("")
  const [mintAmt, setMintAmt] = useState("")
  const [fee, setFee] = useState("0")
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
  const fixed = !!owner && /^0x0{40}$/.test(owner)
  const canMint = !!address && owner?.toLowerCase() === address.toLowerCase()
  const isAdmin = !!address && t.admin.toLowerCase() === address.toLowerCase()
  const accepted = !!cfg?.[0]
  const redeemable = !!redeemableRaw
  const treasuryOwns = !!t.treasury && !!owner && owner.toLowerCase() === t.treasury.toLowerCase()
  const capped = !!cap && cap > 0n
  const hasPay = t.version >= 1n
  const refresh = () => { q.refetch(); erc.refetch() }
  async function redeem() {
    const units = parseUnits(redeemAmt, 18)
    if (erc.allowance < units) await send(`Allow the vault to move ${sym}`, { address: token, abi: abis.erc20, functionName: "approve", args: [t.vault, maxUint256] })
    await send(`Redeem ${redeemAmt} ${sym}`, { address: t.instance, abi: abis.instance, functionName: "redeem", args: [token, units, redeemRef.trim() ? encodeLabel(redeemRef) : `0x${"0".repeat(64)}`] })
    setRedeemAmt(""); setRedeemRef(""); refresh()
  }
  const showRedeem = hasPay && redeemable
  const showAllowRedeem = hasPay && !redeemable && isAdmin
  const showMint = !fixed && canMint
  const runs = showMint || isAdmin

  return (
    <div className="space-y-10">
      <PageHead
        back={back}
        title={<>{name ?? "…"} <span className="text-muted-foreground">{symbol ?? ""}</span></>}
        intro={<>A token issued for this workspace, at <Addr a={token} />. {accepted ? `It can be used to pay here.` : `It is not yet usable for payments in this workspace; only the workspace admin can switch that on.`}</>}
        action={isAdmin && hasPay ? <Button asChild variant="secondary"><Link href={`${base}/shop/new?token=${token}`}>Sell {sym} in the shop</Link></Button> : undefined}
      />

      <Stats>
        <Stat label={address ? "You hold" : "Your balance"} value={address ? <Amount value={balance ?? 0n} /> : "—"} hint={address ? sym : "Connect a wallet to see your balance"} />
        <Stat label="In existence" value={<Amount value={supply ?? 0n} />} hint={sym} />
        <Stat label="Maximum" value={capped ? <Amount value={cap!} /> : fixed ? <Amount value={supply ?? 0n} /> : "No limit"} hint={fixed ? "Fixed: nobody can create more" : capped ? "Written into the contract" : "Its creator can create more"} />
      </Stats>

      <Card title="About this token">
        <Facts>
          {(!created || !/^0x0{40}$/.test(created[2])) && <Fact label="Issued by">
            {!created ? "…" : <><Addr a={created[2]} />{address && created[2].toLowerCase() === address.toLowerCase() ? " (you)" : created[2].toLowerCase() === t.admin.toLowerCase() ? " (the workspace admin)" : ""}{created[1] > 0n ? `, for project #${String(created[1])}` : ""}</>}
          </Fact>}
          <Fact label="Can it be used to pay here?">{accepted ? `Yes. Requests, listings and escrows in this workspace can be paid in ${sym}.` : isAdmin ? "Not yet usable for payments in this workspace. You run it, so you can switch payments on below." : "Not yet usable for payments in this workspace. The workspace admin has not switched it on, and only the admin can."}</Fact>
          <Fact label="Redeeming">{!hasPay ? "Not available in this workspace version." : redeemable ? `Yes. Holders can hand ${sym} back to the workspace with a reference, at no fee.` : "Not yet. Opening a sale switches it on, or the admin can switch it on below."}</Fact>
          <Fact label="Supply">{fixed ? "Fixed. Nobody can create more, including its creator." : capped ? <>Capped at <Amount value={cap!} /> {sym}. {canMint ? "You created it and can create more up to that." : "Its creator can create more up to that."}</> : canMint ? "Open. You created it and can create more whenever you need to." : "Open. Its creator can create more."}</Fact>
          <Fact label="Who can create more">{fixed ? "Nobody, ever. Minting is switched off." : treasuryOwns ? "The workspace treasury, as it sells." : owner ? <><Addr a={owner} />{canMint ? " (you)" : ""}</> : "…"}</Fact>
        </Facts>
      </Card>

      <Section title="Your tokens" description={`What anyone holding ${sym} can do.`}>
        <div className="space-y-6">
          {showRedeem && (
            <Card title="Redeem" description={`Spend your ${sym}: hand tokens back to the workspace with a reference they will recognise, such as an order, a seat or a booking. No fee is charged.`}>
              <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-end">
                <Label title="Amount"><input className={`${input} t-num`} type="number" inputMode="decimal" min="0" step="any" value={redeemAmt} onChange={(e) => setRedeemAmt(e.target.value)} placeholder="0" /></Label>
                <Label title="Reference" counter={`${labelBytes(redeemRef)}/31`}><input className={input} value={redeemRef} onChange={(e) => setRedeemRef(e.target.value)} placeholder="Order 1042, table 4" /></Label>
                <Button disabled={isPending || !address || !(Number(redeemAmt) > 0) || labelBytes(redeemRef) > 31 || (balance ?? 0n) < parseUnits(redeemAmt || "0", 18)} onClick={redeem}>Redeem</Button>
              </div>
              {!address && <p className="mt-3 text-sm text-muted-foreground">Connect a wallet that holds {sym} to redeem.</p>}
            </Card>
          )}
          <Card title="Send to another wallet" description={`Move some of your ${sym} to someone else. It leaves your wallet straight away.`}>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
              <Label title="To"><input className={`${input} t-mono`} value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x…" autoCapitalize="none" autoCorrect="off" spellCheck={false} /></Label>
              <Label title="Amount"><input className={`${input} t-num`} type="number" inputMode="decimal" min="0" step="any" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0" /></Label>
              <Button variant={showRedeem ? "secondary" : "default"} disabled={isPending || !address || !isAddress(to) || !(Number(amt) > 0)} onClick={() => send(`Send ${sym}`, { address: token, abi: abis.utilityToken, functionName: "transfer", args: [to, parseUnits(amt, 18)] }).then(() => { setAmt(""); refresh() })}>Send</Button>
            </div>
            {!address && <p className="mt-3 text-sm text-muted-foreground">Connect a wallet that holds {sym} to send.</p>}
          </Card>
        </div>
      </Section>

      {runs && (
        <Section title="Running this token" description={showMint && isAdmin ? "You created it and you run this workspace." : showMint ? "You created this token." : "You run this workspace."}>
          <div className="space-y-6">
            {showMint && (
              <Card title="Create more" description={`New ${sym} go to the wallet you name, or to you${capped ? ", up to the maximum" : ""}.`}>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
                  <Label title="Give them to" hint="Leave empty to give them to yourself."><input className={`${input} t-mono`} value={mintTo} onChange={(e) => setMintTo(e.target.value)} placeholder={address} autoCapitalize="none" autoCorrect="off" spellCheck={false} /></Label>
                  <Label title="Amount" hint={capped ? "Up to the maximum." : "Any amount."}><input className={`${input} t-num`} type="number" inputMode="decimal" min="0" step="any" value={mintAmt} onChange={(e) => setMintAmt(e.target.value)} placeholder="0" /></Label>
                  <div className="sm:pb-8"><Button variant="secondary" disabled={isPending || !(Number(mintAmt) > 0)} onClick={() => send(`Create ${sym}`, { address: token, abi: abis.utilityToken, functionName: "mint", args: [isAddress(mintTo) ? mintTo : address, parseUnits(mintAmt, 18)] }).then(() => { setMintAmt(""); refresh() })}>Create</Button></div>
                </div>
              </Card>
            )}
            {isAdmin && (
              <Card title="Payments in this workspace" description={accepted ? `${sym} can already be used to pay here.` : `Let requests, listings and escrows in this workspace be paid in ${sym}.`}>
                {!accepted && (
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <Label title={`Service fee per payment (${sym})`} hint="Added to each payment and paid to the platform. 0 is fine."><input className={`${input} t-num`} type="number" inputMode="decimal" min="0" step="any" value={fee} onChange={(e) => setFee(e.target.value)} /></Label>
                    <div className="sm:pb-8"><Button variant="secondary" disabled={isPending} onClick={() => send(`Accept ${sym}`, { address: t.instance, abi: abis.instance, functionName: "setToken", args: [token, true, 18, parseUnits(fee || "0", 18)] }).then(refresh)}>Allow payments in {sym}</Button></div>
                  </div>
                )}
                {accepted && <Button variant="secondary" disabled={isPending} onClick={() => send(`Stop accepting ${sym}`, { address: t.instance, abi: abis.instance, functionName: "setToken", args: [token, false, 18, 0n] }).then(refresh)}>Stop payments in {sym}</Button>}
              </Card>
            )}
            {showAllowRedeem && (
              <Card title="Redeeming" description={`Holders cannot redeem ${sym} yet. Opening a sale switches it on as well, or switch it on here.`}>
                <Button variant="secondary" disabled={isPending} onClick={() => send(`Make ${sym} redeemable`, { address: t.instance, abi: abis.instance, functionName: "setRedeemable", args: [token, true] }).then(refresh)}>Allow redeeming</Button>
              </Card>
            )}
          </div>
        </Section>
      )}
    </div>
  )
}
