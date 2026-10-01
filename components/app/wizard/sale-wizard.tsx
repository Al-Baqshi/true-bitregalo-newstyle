"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { formatUnits, isAddress, parseUnits, zeroAddress, type Address } from "viem"
import { abis, addresses, short } from "@/lib/bitregalo/config"
import { encodeLabel, eventArgs, labelBytes, useProjects, useSettlementTokens } from "@/lib/bitregalo/instances"
import { useInstanceRules } from "@/lib/bitregalo/instance-rules"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Wizard, type WizardAction, type WizardStep } from "./wizard"
import { Choice, Done, Label, Note, input } from "./fields"
import { Amount } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

type Inventory = "deposit" | "mint" | "held"
type Pricing = "paid" | "free"

function toUnix(v: string) {
  const t = v ? Math.floor(new Date(v).getTime() / 1000) : 0
  return Number.isFinite(t) && t > 0 ? BigInt(t) : 0n
}

export function SaleWizard({ initialToken }: { initialToken?: string }) {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const { address } = useAccount()
  const rules = useInstanceRules(t.instance)
  const payTokens = useSettlementTokens(t.instance, t.id)
  const projects = useProjects(t.instance)
  const factoryTokens = useReadContract({ address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tenantTokens", args: [t.id] })
  const candidates = ((factoryTokens.data as Address[] | undefined) ?? [])
  // Symbols for the token picker, so people choose by name rather than by address.
  const candidateSymbols = useReadContracts({
    contracts: candidates.map((a) => ({ address: a, abi: abis.utilityToken, functionName: "symbol" })),
    query: { enabled: candidates.length > 0 },
  })
  const isAdmin = !!address && t.admin.toLowerCase() === address.toLowerCase()

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

  const chosenToken = (isAddress(token) ? token : isAddress(custom) ? custom : "") as Address | ""
  const meta = useReadContracts({
    contracts: chosenToken ? [
      { address: chosenToken, abi: abis.utilityToken, functionName: "symbol" },
      { address: chosenToken, abi: abis.utilityToken, functionName: "decimals" },
      { address: chosenToken, abi: abis.utilityToken, functionName: "owner" },
      { address: chosenToken, abi: abis.erc20, functionName: "balanceOf", args: [address ?? zeroAddress] },
      { address: chosenToken, abi: abis.erc20, functionName: "balanceOf", args: [t.treasury ?? zeroAddress] },
    ] : [],
    query: { enabled: !!chosenToken, refetchInterval: 15_000 },
  })
  const [symbol, decimalsRaw, owner, myBal, heldBal] = (meta.data ?? []).map((r) => r.result) as [string?, number?, Address?, bigint?, bigint?]
  const decimals = Number(decimalsRaw ?? 18)
  const sym = symbol ?? "tokens"
  const pay = payTokens.accepted.find((x) => x.address.toLowerCase() === payToken.toLowerCase()) ?? payTokens.accepted[0]
  const qtyUnits = Number(qty) > 0 ? parseUnits(qty, decimals) : 0n
  const priceUnits = pay && Number(price) > 0 ? parseUnits(price, pay.decimals) : 0n
  const iOwn = !!address && !!owner && owner.toLowerCase() === address.toLowerCase()
  const treasuryOwns = !!t.treasury && !!owner && owner.toLowerCase() === t.treasury.toLowerCase()
  const held = heldBal ?? 0n
  const enoughHeld = held >= qtyUnits
  const enoughMine = (myBal ?? 0n) >= qtyUnits
  const startTs = toUnix(start)
  const endTs = toUnix(end)
  const minter = treasuryOwns ? "the treasury" : iOwn ? "you" : owner && /^0x0{40}$/.test(owner) ? "nobody (the supply is fixed)" : "someone else"

  const steps: WizardStep[] = [
    {
      id: "what", title: "What you are selling", caption: "A token this workspace issues, such as a voucher, a credit or a membership.",
      valid: !isAdmin ? "Only the workspace admin can open a sale" : !chosenToken ? "Choose a token" : labelBytes(label) > 31 ? "Keep the description to 31 characters" : true,
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
      valid: pricing === "paid" && !rules.direct ? "Direct payment is off in this workspace. Turn it on under Settings to sell for money" : pricing === "paid" && !pay ? "This workspace accepts no currency yet" : pricing === "paid" && !(priceUnits > 0n) ? "Set a price" : true,
      content: (
        <div className="grid gap-5">
          <Choice<Pricing> value={pricing} onChange={setPricing} options={[
            { value: "paid", title: "Sold for a stablecoin", description: "Buyers pay per token. The money goes to your treasury, less the platform fee." },
            { value: "free", title: "Free to claim", description: "Buyers receive the tokens without paying. Good for vouchers, invitations and memberships." },
          ]} />
          {pricing === "paid" && pay && (
            <div className="grid gap-4">
              <Label title={`Price per ${sym}`} hint="What a buyer pays for one token.">
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
      valid: !(qtyUnits > 0n) ? "Say how many are for sale" : Number(limit) < 0 ? "The limit cannot be negative" : end && endTs <= (startTs > BigInt(Math.floor(Date.now() / 1000)) ? startTs : BigInt(Math.floor(Date.now() / 1000))) ? "The closing time must be in the future and after the opening time" : inventory === "deposit" && !enoughMine ? `You hold fewer than ${qty} ${sym}` : inventory === "mint" && !iOwn && !treasuryOwns ? `Only whoever can create new ${sym} can hand that right to the treasury` : inventory === "held" && !enoughHeld ? "The treasury does not hold that many yet" : true,
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
              { value: "deposit", title: "Move them from my wallet into the treasury now", description: `Moves ${qty || "the quantity"} ${sym} to your workspace treasury. You hold ${formatUnits(myBal ?? 0n, decimals)}.` },
              { value: "mint", title: "Let the treasury create them as they sell", description: treasuryOwns ? `The treasury can already create new ${sym}.` : iOwn ? `Gives your treasury the right to create new ${sym}. You can take it back later from the Treasury page.` : `Only whoever can create new ${sym} can choose this.`, disabled: !iOwn && !treasuryOwns ? `You cannot create new ${sym}` : undefined },
              { value: "held", title: "The treasury already holds them", description: `It holds ${formatUnits(held, decimals)} ${sym} now.`, disabled: held === 0n ? "Nothing there yet" : undefined },
            ]} />
          </div>
        </div>
      ),
    },
  ]

  const plan: WizardAction[] = []
  if (inventory === "deposit") {
    plan.push({ id: "deposit", label: `Move ${qty || "…"} ${sym} into the treasury`, run: async ({ tx }) => { await tx("Deposit inventory", { address: chosenToken as Address, abi: abis.utilityToken, functionName: "transfer", args: [t.treasury!, qtyUnits] }) } })
  } else if (inventory === "mint" && !treasuryOwns) {
    plan.push({ id: "mint", label: `Let the treasury create new ${sym}`, detail: "You can take this back from the Treasury page", run: async ({ tx }) => { await tx("Hand over minting", { address: chosenToken as Address, abi: abis.utilityToken, functionName: "transferOwnership", args: [t.treasury!] }) } })
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

  return (
    <Wizard
      title="Sell in the shop"
      intro="Put one of your tokens on sale at a price in a stablecoin. Buyers pay into your treasury and get the tokens in the same transaction. Holders can later redeem them with you."
      steps={steps}
      plan={plan}
      signLabel="Open the sale"
      summary={[
        { label: "Token", value: chosenToken ? sym : "—" },
        { label: "Price", value: pricing === "free" ? "Free" : pay ? `${price || "…"} ${pay.symbol}` : "—" },
        { label: "Quantity", value: qty || "—" },
        { label: "Limit per buyer", value: limit || "No limit" },
        { label: "Tokens come from", value: inventory === "deposit" ? "Your wallet, moved now" : inventory === "mint" ? "Created as they sell" : "Already in the treasury" },
        { label: "Transactions to sign", value: String(plan.length) },
      ]}
      done={(r) => (
        <Done
          title="Your sale is open"
          actions={
            <>
              <Button asChild><Link href={`${base}/sales/${String(r.saleId)}`}>Open the sale page</Link></Button>
              <Button asChild variant="secondary"><Link href={`${base}/sales`}>Back to the shop</Link></Button>
            </>
          }
        >
          <p>Sale #{String(r.saleId)} is in the shop: {qty} {sym}{pricing === "paid" && pay ? ` at ${price} ${pay.symbol} each` : ", free to claim"}.</p>
          <p>Share the sale page. Anyone with a wallet can {pricing === "paid" ? "buy" : "claim"}.{pricing === "paid" ? " The money arrives in your treasury, and you can withdraw it at any time." : ""}</p>
        </Done>
      )}
    />
  )
}
