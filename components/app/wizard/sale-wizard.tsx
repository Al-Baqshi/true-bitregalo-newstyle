"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { readContract } from "wagmi/actions"
import { formatUnits, isAddress, parseUnits, zeroAddress, type Address, type Hex } from "viem"
import { abis, addresses, short, wagmiConfig } from "@/lib/bitregalo/config"
import { encodeLabel, eventArgs, labelBytes, useProjects, useSettlementTokens, useWorkspaceTokens } from "@/lib/bitregalo/instances"
import { useInstanceRules } from "@/lib/bitregalo/instance-rules"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Wizard, type WizardAction, type WizardStep } from "./wizard"
import { AddOn, Choice, Done, Label, Note, input } from "./fields"
import { Addr, Amount, Notice } from "@/components/app/ui"
import { ConnectButton } from "@/components/app/connect-button"
import { Button } from "@/components/ui/button"

type Inventory = "deposit" | "mint" | "held"
type Pricing = "paid" | "free"

const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase()
const isZero = (a?: string) => !a || /^0x0{40}$/.test(a)

function toUnix(v: string) {
  const t = v ? Math.floor(new Date(v).getTime() / 1000) : 0
  return Number.isFinite(t) && t > 0 ? BigInt(t) : 0n
}

/**
 * Open a sale. Two different roles are involved, and they can be two different wallets:
 * the workspace admin opens the sale, and the owner of the workspace treasury approves it,
 * because the tokens are handed out from the treasury. When the connected wallet is both, the
 * approval is the next signature; when it is not, the wizard ends by saying who has to approve.
 * Letting holders redeem the token is a separate choice and is never switched on by a sale.
 */
export function SaleWizard({ initialToken }: { initialToken?: string }) {
  const t = useTenant()
  const base = t.base
  const { address } = useAccount()
  const rules = useInstanceRules(t.instance)
  const payTokens = useSettlementTokens(t.instance, t.id)
  const projects = useProjects(t.instance)
  const own = useWorkspaceTokens(t.id, t.instance)
  const candidates = own.addresses
  // Symbols for the token picker, so people choose by name rather than by address.
  const candidateSymbols = useReadContracts({
    contracts: candidates.map((a) => ({ address: a, abi: abis.utilityToken, functionName: "symbol" })),
    query: { enabled: candidates.length > 0 },
  })
  const treasuryOwnerQ = useReadContract({ address: t.treasury, abi: abis.workspaceTreasury, functionName: "owner", query: { enabled: !!t.treasury, refetchInterval: 20_000 } })
  const treasuryOwner = treasuryOwnerQ.data as Address | undefined
  const isAdmin = same(t.admin, address)
  const isTreasuryOwner = same(treasuryOwner, address)

  const [token, setToken] = useState(initialToken ?? "")
  const [custom, setCustom] = useState("")
  const [label, setLabel] = useState("")
  const [project, setProject] = useState("0")
  const [pricing, setPricing] = useState<Pricing>("paid")
  const [payToken, setPayToken] = useState("")
  const [price, setPrice] = useState("")
  const [qty, setQty] = useState("")
  const [limit, setLimit] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [inventory, setInventory] = useState<Inventory>("deposit")
  const [redeem, setRedeem] = useState(false)

  const chosenToken = (isAddress(token) ? token : isAddress(custom) ? custom : "") as Address | ""
  const meta = useReadContracts({
    contracts: chosenToken ? [
      { address: chosenToken, abi: abis.utilityToken, functionName: "symbol" },
      { address: chosenToken, abi: abis.utilityToken, functionName: "decimals" },
      { address: chosenToken, abi: abis.utilityToken, functionName: "owner" },
      { address: chosenToken, abi: abis.utilityToken, functionName: "pendingOwner" },
      { address: chosenToken, abi: abis.erc20, functionName: "balanceOf", args: [address ?? zeroAddress] },
      { address: chosenToken, abi: abis.erc20, functionName: "balanceOf", args: [t.treasury ?? zeroAddress] },
      { address: t.instance, abi: abis.instance, functionName: "redeemable", args: [chosenToken] },
      { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tokenInfo", args: [chosenToken] },
    ] : [],
    query: { enabled: !!chosenToken, refetchInterval: 15_000 },
  })
  const [symbol, decimalsRaw, owner, pendingOwner, myBal, heldBal, redeemableNow, info] = (meta.data ?? []).map((r) => r.result) as
    [string?, number?, Address?, Address?, bigint?, bigint?, boolean?, (readonly [bigint, bigint, Address, bigint])?]
  const decimals = Number(decimalsRaw ?? 18)
  const sym = symbol ?? "tokens"
  const pay = payTokens.accepted.find((x) => x.address.toLowerCase() === payToken.toLowerCase()) ?? payTokens.accepted[0]
  const qtyUnits = Number(qty) > 0 ? parseUnits(qty, decimals) : 0n
  const priceUnits = pay && Number(price) > 0 ? parseUnits(price, pay.decimals) : 0n
  const iOwn = same(owner, address)
  const treasuryOwns = same(owner, t.treasury)
  const offeredToTreasury = same(pendingOwner, t.treasury)
  // Only a token the factory created for this workspace can be made redeemable here.
  const ours = !!info && !isZero(info[2]) && info[0] === t.id
  const held = heldBal ?? 0n
  const enoughHeld = held >= qtyUnits
  const enoughMine = (myBal ?? 0n) >= qtyUnits
  const startTs = toUnix(start)
  const endTs = toUnix(end)
  const now = BigInt(Math.floor(Date.now() / 1000))
  const minter = treasuryOwns ? "the treasury" : iOwn ? "you" : owner && isZero(owner) ? "nobody (the supply is fixed)" : "its owner"
  const switchRedeem = redeem && ours && !redeemableNow
  // The treasury must accept a token it is offered before it can create it; only its owner can do that.
  const treasuryMustAccept = inventory === "mint" && !treasuryOwns

  const notice = !address ? (
    <Notice title="Who can open a sale" action={<ConnectButton variant="outline" />}>
      <p>The workspace admin opens a sale. The owner of the workspace treasury then approves it, because the tokens are handed out from the treasury. Connect your wallet to see which applies to you.</p>
    </Notice>
  ) : !isAdmin ? (
    <Notice tone="accent" title="Only the workspace admin can open a sale">
      <p>This workspace is run by <Addr a={t.admin} />. Your connected wallet is a different one, so you cannot open a sale here.</p>
    </Notice>
  ) : treasuryOwner && !isTreasuryOwner ? (
    <Notice tone="accent" title="This sale will wait for the treasury owner's approval">
      <p>You can open the sale. Nothing can be bought until the owner of the workspace treasury, <Addr a={treasuryOwner} />, approves it. They see its terms and an Approve button on the sale&apos;s page.</p>
    </Notice>
  ) : null

  const steps: WizardStep[] = [
    {
      id: "what", title: "What you are selling", caption: "A token this workspace issues, such as a voucher, a credit or a membership.",
      valid: !!address && !isAdmin ? "Only the workspace admin can open a sale" : !chosenToken ? "Choose a token" : labelBytes(label) > 31 ? "Keep the description to 31 characters" : true,
      content: (
        <div className="grid gap-5">
          <Label title="Token" hint="One of this workspace's tokens, or another token you hold.">
            <select className={input} value={token} onChange={(e) => setToken(e.target.value)}>
              <option value="">Choose…</option>
              {candidates.map((a, i) => {
                const s = candidateSymbols.data?.[i]?.result as string | undefined
                return <option key={a} value={a}>{s ? `${s} · ${short(a)}` : a}</option>
              })}
              <option value="custom">Another token address…</option>
            </select>
          </Label>
          {token === "custom" && (
            <Label title="Token address" hint="Starts with 0x.">
              <input className={`${input} t-mono`} value={custom} onChange={(e) => setCustom(e.target.value.trim())} placeholder="0x…" autoComplete="off" spellCheck={false} />
            </Label>
          )}
          {chosenToken && symbol && (
            <Note>
              {sym}: you hold <Amount value={myBal ?? 0n} decimals={decimals} /> and the treasury holds <Amount value={held} decimals={decimals} />. New {sym} can be created by {minter}.
            </Note>
          )}
          <Label title="What it is (optional)" counter={`${labelBytes(label)}/31`} hint="Shown in the shop. Say what one token gives the holder.">
            <input className={input} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="One coffee at any branch" />
          </Label>
          <Label title="Project (optional)" hint="Groups this sale with related work.">
            <select className={input} value={project} onChange={(e) => setProject(e.target.value)}>
              <option value="0">No project</option>
              {projects.list.filter((p) => p.active).map((p) => <option key={String(p.id)} value={String(p.id)}>#{String(p.id)} · {p.label ?? "private project"}</option>)}
            </select>
          </Label>
        </div>
      ),
    },
    {
      id: "price", title: "Price",
      valid: pricing === "paid" && !rules.direct ? "Direct payment is off in this workspace. Turn it on under Settings to sell for a stablecoin" : pricing === "paid" && !pay ? "This workspace accepts no currency yet" : pricing === "paid" && !(priceUnits > 0n) ? "Set a price" : true,
      content: (
        <div className="grid gap-5">
          <Choice<Pricing> value={pricing} onChange={setPricing} options={[
            { value: "paid", title: "Sold for a stablecoin", description: "Buyers pay per token. The payment goes to your treasury, less the platform fee." },
            { value: "free", title: "Free to claim", description: "Buyers receive the tokens without paying. Good for vouchers, invitations and memberships." },
          ]} />
          {pricing === "paid" && pay && (
            <div className="grid gap-4">
              <Label title={`Price per ${sym}`} hint="What a buyer pays for one token. The price cannot be changed once the sale exists.">
                <input className={input} type="number" inputMode="decimal" min="0" step="any" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="10" />
              </Label>
              <Label title="Paid in">
                <select className={input} value={pay.address} onChange={(e) => setPayToken(e.target.value)}>
                  {payTokens.accepted.map((x) => <option key={x.address} value={x.address}>{x.symbol}</option>)}
                </select>
              </Label>
              <div>
                <Note>
                  Buyers pay the price{pay.serviceFee > 0n ? <> plus a service fee of <Amount value={pay.serviceFee} decimals={pay.decimals} symbol={pay.symbol} /></> : ""}. The platform fee of {rules.feeBps / 100}% is taken from what you receive: {price || "…"} {pay.symbol} less {rules.feeBps / 100}% for each {sym} sold.
                </Note>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "supply", title: "Supply and limits",
      valid: !(qtyUnits > 0n) ? "Say how many are for sale"
        : Number(limit) < 0 ? "The limit cannot be negative"
        : end && endTs <= (startTs > now ? startTs : now) ? "The closing time must be in the future and after the opening time"
        : inventory === "deposit" && !enoughMine ? `You hold fewer than ${qty} ${sym}`
        : inventory === "mint" && !iOwn && !treasuryOwns ? `Only the owner of ${sym} can hand it to the treasury`
        : inventory === "held" && !enoughHeld ? "The treasury does not hold that many yet"
        : true,
      content: (
        <div className="grid gap-5">
          <div className="grid gap-4">
            <Label title={`How many to sell (${sym})`}>
              <input className={input} type="number" inputMode="decimal" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="500" />
            </Label>
            <Label title="Limit per buyer (optional)" hint="Leave empty for no limit.">
              <input className={input} type="number" inputMode="decimal" min="0" step="any" value={limit} onChange={(e) => setLimit(e.target.value)} />
            </Label>
            <Label title="Opens (optional)" hint="Leave empty to open straight away.">
              <input className={input} type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </Label>
            <Label title="Closes (optional)" hint="Leave empty to stay open until sold out or closed.">
              <input className={input} type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </Label>
          </div>
          <div>
            <p className="t-label mb-3">Where do the tokens come from?</p>
            <Choice<Inventory> value={inventory} onChange={setInventory} options={[
              { value: "deposit", title: "Move them from my wallet into the treasury now", description: `Moves ${qty || "the quantity"} ${sym} to the workspace treasury. You hold ${formatUnits(myBal ?? 0n, decimals)}.` },
              {
                value: "mint", title: "Let the treasury create them as they sell",
                description: treasuryOwns ? `The treasury already owns ${sym} and creates it on demand.`
                  : iOwn ? `You offer ${sym} to the treasury, and the treasury's owner accepts it. After that the treasury creates what a sale needs, and your wallet can no longer create ${sym}.`
                  : `Only the owner of ${sym} can choose this.`,
                disabled: !iOwn && !treasuryOwns ? `You do not own ${sym}` : undefined,
              },
              { value: "held", title: "The treasury already holds them", description: `It holds ${formatUnits(held, decimals)} ${sym} now.`, disabled: held === 0n ? "Nothing there yet" : undefined },
            ]} />
          </div>
          {treasuryMustAccept && iOwn && !isTreasuryOwner && (
            <Note>The treasury&apos;s owner, <Addr a={treasuryOwner ?? ""} />, has to accept {sym} for the treasury before anything can be delivered. They do that on the Treasury page or on the token&apos;s page.</Note>
          )}
        </div>
      ),
    },
    {
      id: "redeem", title: "Redeeming", caption: "A separate choice. Opening a sale does not switch it on.",
      valid: true,
      content: (
        <div className="grid gap-4">
          <AddOn
            checked={(redeem && ours) || !!redeemableNow}
            onChange={(v) => { if (!redeemableNow && ours) setRedeem(v) }}
            title={`Let holders redeem ${sym}`}
            tag={redeemableNow ? "Already on" : !chosenToken || ours ? undefined : "Not possible for this token"}
            description={
              redeemableNow ? `Holders can already hand ${sym} back to the workspace treasury with a reference, at no fee.`
                : !chosenToken || ours ? `Holders can hand ${sym} back to the workspace treasury with a reference, at no fee. That is how a voucher, a credit or a ticket is spent. It adds one signature.`
                : "Only a token created for this workspace can be redeemed here."
            }
          />
          <Note>You can also decide this later, on the token&apos;s page. Without it, buyers can hold and send {sym}, but cannot redeem it here.</Note>
        </div>
      ),
    },
  ]

  const plan: WizardAction[] = []
  if (inventory === "deposit") {
    plan.push({ id: "deposit", label: `Move ${qty || "…"} ${sym} into the treasury`, run: async ({ tx }) => { await tx("Move tokens into the treasury", { address: chosenToken as Address, abi: abis.utilityToken, functionName: "transfer", args: [t.treasury!, qtyUnits] }) } })
  } else if (treasuryMustAccept) {
    if (!offeredToTreasury) {
      plan.push({ id: "mint", label: `Offer ${sym} to the treasury`, detail: "The treasury's owner has to accept before it takes effect.", run: async ({ tx }) => { await tx(`Offer ${sym} to the treasury`, { address: chosenToken as Address, abi: abis.utilityToken, functionName: "transferOwnership", args: [t.treasury!] }) } })
    }
    if (isTreasuryOwner) {
      plan.push({ id: "accept-token", label: `Accept ${sym} for the treasury`, detail: `From then on the treasury creates ${sym} as it sells. You can hand it back from the Treasury page.`, run: async ({ tx }) => { await tx(`Accept ${sym} for the treasury`, { address: t.treasury!, abi: abis.workspaceTreasury, functionName: "acceptToken", args: [chosenToken] }) } })
    }
  }
  plan.push({
    id: "sale", label: pricing === "paid" && pay ? `Open the sale at ${price || "…"} ${pay.symbol} per ${sym}` : `Open the free claim`, detail: `${qty || "…"} ${sym} for sale${limit ? `, up to ${limit} per buyer` : ""}`,
    run: async ({ tx, results }) => {
      const r = await tx("Open sale", {
        address: t.instance, abi: abis.instance, functionName: "createSale",
        args: [{
          token: chosenToken, payToken: pricing === "paid" ? pay!.address : zeroAddress, price: pricing === "paid" ? priceUnits : 0n,
          quantity: qtyUnits, maxPerBuyer: Number(limit) > 0 ? parseUnits(limit, decimals) : 0n,
          start: startTs, end: endTs, projectId: BigInt(project), metaHash: label.trim() ? encodeLabel(label) : `0x${"0".repeat(64)}`,
        }],
      })
      results.saleId = eventArgs<{ saleId: bigint }>(r, abis.instance, "SaleCreated").saleId
    },
  })
  if (isTreasuryOwner) {
    plan.push({
      id: "approve", label: `Approve the sale of ${qty || "…"} ${sym} from the treasury`, detail: "As the treasury's owner you approve this sale, on these terms, for this many tokens. Nothing can be bought before this.",
      run: async ({ tx, results }) => {
        const saleId = results.saleId as bigint
        // The approval names the sale's terms by their fingerprint, read from the sale that now exists.
        const termsHash = (await readContract(wagmiConfig, { address: t.treasury!, abi: abis.workspaceTreasury, functionName: "saleTermsHash", args: [saleId] })) as Hex
        await tx("Approve the sale", { address: t.treasury!, abi: abis.workspaceTreasury, functionName: "approveSale", args: [saleId, qtyUnits, termsHash] })
        results.approved = true
      },
    })
  }
  if (switchRedeem) {
    plan.push({
      id: "redeem", label: `Let holders redeem ${sym}`, detail: "Holders can then hand it back to the treasury with a reference, at no fee.",
      run: async ({ tx }) => { await tx(`Let holders redeem ${sym}`, { address: t.instance, abi: abis.instance, functionName: "setRedeemable", args: [chosenToken, true] }) },
    })
  }

  const stockWord = inventory === "deposit" ? "Your wallet, moved into the treasury now" : inventory === "mint" ? "Created by the treasury as they sell" : "Already in the treasury"

  return (
    <Wizard
      title="Sell in the shop"
      intro="Put one of your tokens on sale at a price in a stablecoin. Buyers pay into the workspace treasury and get the tokens in the same transaction. The sale starts once the treasury's owner has approved it."
      notice={notice}
      steps={steps}
      plan={plan}
      signLabel="Open the sale"
      summary={[
        { label: "Token", value: chosenToken ? sym : "—" },
        { label: "Price", value: pricing === "free" ? "Free" : pay ? `${price || "…"} ${pay.symbol}` : "—" },
        { label: "Quantity", value: qty || "—" },
        { label: "Limit per buyer", value: limit || "No limit" },
        { label: "Tokens come from", value: stockWord },
        { label: "Treasury owner's approval", value: !address ? "…" : isTreasuryOwner ? "You approve it in the signature after the sale opens" : <>Needed from <Addr a={treasuryOwner ?? ""} /> before anything can be bought</> },
        { label: "Redeeming", value: redeemableNow ? "Already on" : switchRedeem ? "Switched on with this sale" : "Not switched on" },
        { label: "Transactions to sign", value: String(plan.length) },
      ]}
      done={(r) => (
        <Done
          title={r.approved ? "Your sale is open" : "Your sale waits for approval"}
          actions={
            <>
              <Button asChild><Link href={`${base}/shop/${String(r.saleId)}`}>Open the sale page</Link></Button>
              <Button asChild variant="secondary"><Link href={`${base}/shop`}>Back to the shop</Link></Button>
            </>
          }
        >
          <p>Sale #{String(r.saleId)} is in the shop: {qty} {sym}{pricing === "paid" && pay ? ` at ${price} ${pay.symbol} each` : ", free to claim"}.</p>
          {r.approved ? (
            <p>You approved it as the treasury&apos;s owner, so anyone with a wallet can {pricing === "paid" ? "buy" : "claim"} now.{pricing === "paid" ? " Payments arrive in the workspace treasury, and its owner can withdraw them at any time." : ""}</p>
          ) : (
            <p>Nothing can be bought yet. The sale waits for the approval of the treasury&apos;s owner, <Addr a={treasuryOwner ?? ""} />. Send them the sale page: it shows the terms and an Approve button.</p>
          )}
          {treasuryMustAccept && !isTreasuryOwner && <p>The treasury&apos;s owner also has to accept {sym} for the treasury, so it can create the tokens as they sell.</p>}
          {!switchRedeem && !redeemableNow && <p>Holders cannot redeem {sym} yet. The admin can switch that on from the token&apos;s page.</p>}
        </Done>
      )}
    />
  )
}
