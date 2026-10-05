"use client"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useEffect, useState } from "react"
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { isAddress, parseUnits, zeroAddress, type Address } from "viem"
import { useOverview, useTx } from "@/lib/bitregalo/hooks"
import { abis, STABLES } from "@/lib/bitregalo/config"
import { useSettlementTokens } from "@/lib/bitregalo/instances"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { Addr, Amount, Card, Empty, Fact, Facts, Field, LedgerRow, Notice, PageHead, Section, inputCls } from "@/components/app/ui"
import { AddOn } from "@/components/app/wizard/fields"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase()

export default function AdminPage() {
  const t = useTenant()
  const nameOf = useWorkspaceName()
  const { address } = useAccount()
  const ov = useOverview()
  const admin = ov.data?.[4]?.result as string | undefined
  const direct = ov.data?.[6]?.result as boolean | undefined
  const escrow = ov.data?.[7]?.result as boolean | undefined
  const isAdmin = same(admin, address)
  const accepted = useSettlementTokens(t.instance, t.id)
  const tokensLoaded = accepted.all.length > 0 && accepted.all.some((x) => x.symbol !== "…")
  const { send, isPending } = useTx()
  const [token, setToken] = useState("")
  const [fee, setFee] = useState("0.1")
  const [d, setD] = useState(true)
  const [e, setE] = useState(true)
  const [newAdmin, setNewAdmin] = useState("")
  // Start the switches from what the workspace has now, so saving untouched changes nothing.
  const [synced, setSynced] = useState(false)
  useEffect(() => {
    if (synced || direct === undefined || escrow === undefined) return
    setD(direct)
    setE(escrow)
    setSynced(true)
  }, [synced, direct, escrow])

  // The service fee is entered in whole tokens, so the token's own decimals are needed. The contract reads them itself.
  const tokenMeta = useReadContracts({
    contracts: [
      { address: token as Address, abi: abis.utilityToken, functionName: "symbol" },
      { address: token as Address, abi: abis.utilityToken, functionName: "decimals" },
    ],
    query: { enabled: isAddress(token) },
  })
  const tokenSymbol = tokenMeta.data?.[0]?.result as string | undefined
  const tokenDecimals = tokenMeta.data?.[1]?.result as number | undefined

  // The admin role moves in two steps: the admin offers it, the other wallet accepts.
  const pendingQ = useReadContract({ address: t.instance, abi: abis.instance, functionName: "pendingAdmin", query: { refetchInterval: 15_000 } })
  const pendingAdmin = pendingQ.data && !/^0x0{40}$/.test(pendingQ.data as string) ? (pendingQ.data as Address) : undefined
  const offeredToMe = same(pendingAdmin, address)

  // Platform fees are kept in the vault as they arise. Anyone can send them on to the platform fee treasury.
  const feesQ = useReadContracts({
    contracts: accepted.all.map((x) => ({ address: t.vault, abi: abis.vault, functionName: "accruedFees", args: [x.address] })),
    query: { enabled: accepted.all.length > 0, refetchInterval: 15_000 },
  })
  const fees = accepted.all.map((x, i) => ({ ...x, amount: feesQ.data?.[i]?.result as bigint | undefined })).filter((x) => x.allowed || (x.amount ?? 0n) > 0n)

  const refetch = () => { ov.refetch(); accepted.refetch(); pendingQ.refetch() }

  const onOff = (v: boolean | undefined) => (v === undefined ? "…" : v ? "On" : "Off")
  const willChange = [
    direct !== undefined && d !== direct ? `switch direct payment ${d ? "on" : "off"}` : null,
    escrow !== undefined && e !== escrow ? `switch escrow ${e ? "on" : "off"}` : null,
  ].filter(Boolean)

  return (
    <div className="space-y-12">
      <PageHead
        title="Settings"
        intro="Which tokens this workspace accepts, how its requests and listings can be settled, and who runs it. Settings apply to everyone who uses the workspace."
      />

      {admin === undefined && <p className="text-sm text-muted-foreground">Reading who runs this workspace…</p>}

      {offeredToMe && (
        <Notice
          tone="accent"
          title="The admin role of this workspace has been offered to you"
          action={<Button disabled={isPending} onClick={() => send("Accept the admin role", { address: t.instance, abi: abis.instance, functionName: "acceptAdmin", args: [] }).then(refetch)}>Accept the admin role</Button>}
        >
          <p>
            Nothing changes until you accept. Once you do, your wallet runs {nameOf(t.id)} and <Addr a={admin ?? ""} /> no longer does. The workspace treasury has its own owner and is not part of this handover.
          </p>
        </Notice>
      )}

      {admin !== undefined && !isAdmin && (
        <>
          <Notice tone="muted" title="Only the admin can change these settings">
            <p>
              {nameOf(t.id)} is run by the wallet <Addr a={admin} />.{" "}
              {address ? "The wallet you are connected with is a different one, so this page is read-only for you." : "Connect that wallet to change settings. Until then this page is read-only."}
            </p>
          </Notice>
          <Card title="How this workspace is set up" description="Everyone who uses the workspace sees the same rules.">
            <Facts columns={2}>
              <Fact label="Admin">
                <Addr a={admin} />
                {pendingAdmin && <span className="block text-sm font-normal text-muted-foreground">Handover offered to <Addr a={pendingAdmin} />, not accepted yet.</span>}
              </Fact>
              <Fact label="Accepted tokens">{tokensLoaded ? (accepted.accepted.length > 0 ? accepted.accepted.map((x) => x.symbol).join(", ") : "None yet") : "…"}</Fact>
              <Fact label="Pay straight away (direct payment)">{onOff(direct)}</Fact>
              <Fact label="Hold it safely (escrow)">{onOff(escrow)}</Fact>
            </Facts>
          </Card>
        </>
      )}

      {isAdmin && (
        <>
          <Notice tone="muted">
            <p>You are connected as the admin, <Addr a={admin!} />. Each change below is a transaction your wallet signs, and it applies to everyone who uses this workspace as soon as it confirms.</p>
          </Notice>

          <Section
            title="Accepted tokens"
            description="The tokens people can pay in here. Accepting one makes it a payment option for every request, listing and escrow in this workspace."
          >
            <Card flush title="Accepted now">
              {!tokensLoaded && <p className="px-5 py-4 text-sm text-muted-foreground sm:px-6">Reading the list…</p>}
              {tokensLoaded && accepted.accepted.length === 0 && (
                <p className="px-5 py-4 text-sm text-muted-foreground sm:px-6">No token is accepted yet, so requests and listings here can only be recorded, not paid.</p>
              )}
              {tokensLoaded && accepted.accepted.map((x) => (
                <LedgerRow
                  key={x.address}
                  title={x.symbol}
                  meta={<Addr a={x.address} />}
                  amount={<Amount value={x.serviceFee} decimals={x.decimals} symbol={x.symbol} />}
                  status={<span className="text-sm text-muted-foreground">service fee per payment</span>}
                />
              ))}
              <p className="border-t border-border px-5 py-3 text-xs text-subtle sm:px-6">
                Shows the known stablecoins and this workspace&apos;s own tokens. A token accepted by address from elsewhere works too, but is not listed here.
              </p>
            </Card>

            <form className="mt-8 grid max-w-160 gap-5" onSubmit={(ev) => ev.preventDefault()}>
              <h3 className="t-subheading">Accept another token</h3>
              <div className="grid gap-5 sm:grid-cols-[14rem_minmax(0,1fr)]">
                <Field label="Token">
                  <select className={inputCls} value={STABLES.some((x) => x.address === token) ? token : ""} onChange={(ev) => setToken(ev.target.value)}>
                    <option value="">Another token (enter its address)</option>
                    {STABLES.map((x) => <option key={x.address} value={x.address}>{x.symbol}</option>)}
                  </select>
                </Field>
                <Field label="Token address" hint="Pick a known stablecoin, or paste the address of any standard token (ERC-20). Tokens created in this workspace qualify. Tokens that take a fee on transfer, or change balances by themselves, do not work.">
                  <input className={cn(inputCls, "t-mono")} value={token} onChange={(ev) => setToken(ev.target.value.trim())} placeholder="0x…" autoComplete="off" spellCheck={false} />
                </Field>
              </div>
              <Field
                label={`Service fee per payment${tokenSymbol ? ` (${tokenSymbol})` : ""}`}
                hint="A flat amount in this token, added to each payment and paid by the buyer. It goes to BitRegalo. Network fees are separate: each person pays their own. 0 is allowed. If you change a fee later, a payment that was already on its way at the old total is refused, not charged more."
              >
                <input className={cn(inputCls, "t-num max-w-48")} type="number" inputMode="decimal" min="0" step="any" value={fee} onChange={(ev) => setFee(ev.target.value)} />
              </Field>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <Button
                  disabled={isPending || !isAddress(token) || tokenDecimals === undefined}
                  onClick={() => send("Accept token", { address: t.instance, abi: abis.instance, functionName: "setToken", args: [token, true, parseUnits(fee || "0", Number(tokenDecimals))] }).then(refetch)}
                >
                  Accept this token
                </Button>
                {isAddress(token) && tokenMeta.data && tokenDecimals === undefined && <p className="text-sm text-destructive" role="status">That address does not answer like a token.</p>}
              </div>
            </form>
          </Section>

          <Section
            title="Ways to settle"
            description="How a request or listing here can be paid. “Just record it” is always available; these two make an actual payment."
          >
            <div className="grid max-w-160 gap-3">
              <AddOn
                checked={d}
                onChange={setD}
                title="Pay straight away (direct payment)"
                description="The supplier is paid from the buyer's wallet the moment an offer is chosen or a listing is taken."
                tag={direct === undefined ? undefined : direct ? "On now" : "Off now"}
              />
              <AddOn
                checked={e}
                onChange={setE}
                title="Hold it safely (escrow)"
                description="The payment is locked in the workspace's vault until the buyer releases it or the supplier hands it back. After the deadline it can only go back to the buyer."
                tag={escrow === undefined ? undefined : escrow ? "On now" : "Off now"}
              />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button
                variant="secondary"
                disabled={isPending || !synced || willChange.length === 0}
                onClick={() => send("Update modes", { address: t.instance, abi: abis.instance, functionName: "setSettlementModes", args: [d, e] }).then(() => ov.refetch())}
              >
                Save ways to settle
              </Button>
              <p className="text-sm text-muted-foreground" role="status">
                {direct === undefined || escrow === undefined ? "Reading the current setting…" : willChange.length > 0 ? `Saving will ${willChange.join(" and ")}.` : "The switches match what is saved now."}
              </p>
            </div>
          </Section>

          <Section
            title="Hand over the admin role"
            description="Two steps, so a mistyped address cannot lose the workspace: you offer the role to another wallet, and that wallet accepts it on this page. Until it accepts, you stay the admin."
          >
            <Card>
              {pendingAdmin ? (
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <p className="max-w-[56ch] text-base">
                    Offered to <Addr a={pendingAdmin} />. Waiting for that wallet to accept. You are still the admin and can withdraw the offer.
                  </p>
                  <Button variant="secondary" disabled={isPending} onClick={() => send("Withdraw the offer", { address: t.instance, abi: abis.instance, functionName: "transferAdmin", args: [zeroAddress] }).then(refetch)}>Withdraw the offer</Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <Field label="New admin's wallet address">
                    <input className={cn(inputCls, "t-mono")} value={newAdmin} onChange={(ev) => setNewAdmin(ev.target.value.trim())} placeholder="0x…" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
                  </Field>
                  <Button variant="secondary" disabled={isPending || !isAddress(newAdmin) || same(newAdmin, address)} onClick={() => send("Offer the admin role", { address: t.instance, abi: abis.instance, functionName: "transferAdmin", args: [newAdmin] }).then(() => { setNewAdmin(""); refetch() })}>Offer the admin role</Button>
                </div>
              )}
              <p className="mt-4 max-w-[62ch] text-sm text-muted-foreground">
                The admin sets the accepted tokens and fees, opens sales and decides which tokens can be redeemed. The workspace treasury has its own owner and is handed over separately, on the Treasury page.
              </p>
            </Card>
          </Section>
        </>
      )}

      <Section
        title="Platform fees waiting in the vault"
        description="The platform fee and the service fee are kept in this workspace's vault as payments happen. They go to the platform fee treasury when someone sends them on. Anyone may do that; it only costs the network fee."
      >
        <Card flush>
          {!feesQ.data && fees.length === 0 && <p className="px-5 py-4 text-sm text-muted-foreground sm:px-6">Reading the vault…</p>}
          {feesQ.data && fees.length === 0 && <Empty title="No accepted token yet" body="Fees appear here once this workspace accepts a token and payments are made in it." />}
          {fees.map((x) => (
            <LedgerRow
              key={x.address}
              title={x.symbol}
              meta={<Addr a={x.address} />}
              amount={x.amount === undefined ? "…" : <Amount value={x.amount} decimals={x.decimals} symbol={x.symbol} />}
              status={
                x.amount !== undefined && x.amount > 0n ? (
                  <Button size="sm" variant="secondary" disabled={isPending || !address} onClick={() => send(`Send ${x.symbol} fees to the platform fee treasury`, { address: t.vault, abi: abis.vault, functionName: "collectFees", args: [x.address] }).then(() => feesQ.refetch())}>
                    Send to the platform fee treasury
                  </Button>
                ) : <span className="text-sm text-muted-foreground">Nothing waiting</span>
              }
            />
          ))}
        </Card>
        <p className="mt-3 max-w-[62ch] text-xs text-subtle">These fees never belong to a buyer or a supplier, and sending them on cannot touch a held payment.</p>
      </Section>
    </div>
  )
}
