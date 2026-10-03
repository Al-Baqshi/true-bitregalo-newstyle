"use client"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { isAddress, parseUnits } from "viem"
import { useOverview, useTx } from "@/lib/bitregalo/hooks"
import { abis, STABLES } from "@/lib/bitregalo/config"
import { useSettlementTokens } from "@/lib/bitregalo/instances"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { Addr, Amount, Card, Fact, Facts, Field, LedgerRow, Notice, PageHead, Section, inputCls } from "@/components/app/ui"
import { AddOn } from "@/components/app/wizard/fields"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function AdminPage() {
  const t = useTenant()
  const nameOf = useWorkspaceName()
  const { address } = useAccount()
  const ov = useOverview()
  const admin = ov.data?.[4]?.result as string | undefined
  const direct = ov.data?.[6]?.result as boolean | undefined
  const escrow = ov.data?.[7]?.result as boolean | undefined
  const isAdmin = !!address && !!admin && admin.toLowerCase() === address.toLowerCase()
  const accepted = useSettlementTokens(t.instance, t.id)
  const tokensLoaded = accepted.all.length > 0 && accepted.all.some((x) => x.symbol !== "…")
  const { send, isPending } = useTx()
  const [token, setToken] = useState("")
  const [fee, setFee] = useState("0.1")
  const [d, setD] = useState(true)
  const [e, setE] = useState(true)
  // Start the switches from what the workspace has now, so saving untouched changes nothing.
  const [synced, setSynced] = useState(false)
  useEffect(() => {
    if (synced || direct === undefined || escrow === undefined) return
    setD(direct)
    setE(escrow)
    setSynced(true)
  }, [synced, direct, escrow])
  const refetch = () => { ov.refetch(); accepted.refetch() }

  const onOff = (v: boolean | undefined) => (v === undefined ? "…" : v ? "On" : "Off")
  const willChange = [
    direct !== undefined && d !== direct ? `switch direct payment ${d ? "on" : "off"}` : null,
    escrow !== undefined && e !== escrow ? `switch escrow ${e ? "on" : "off"}` : null,
  ].filter(Boolean)

  return (
    <div className="space-y-12">
      <PageHead
        title="Settings"
        intro="Which tokens this workspace accepts, and how its requests and listings can be settled. Settings apply to everyone who uses the workspace."
      />

      {admin === undefined && <p className="text-sm text-muted-foreground">Reading who runs this workspace…</p>}

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
              <Fact label="Admin"><Addr a={admin} /></Fact>
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
            <p>You are connected as the admin, <Addr a={admin} />. Each change below is a transaction your wallet signs, and it applies to everyone who uses this workspace as soon as it confirms.</p>
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
                  <input className={cn(inputCls, "t-mono")} value={token} onChange={(ev) => setToken(ev.target.value)} placeholder="0x…" autoComplete="off" spellCheck={false} />
                </Field>
              </div>
              <Field label="Service fee per payment" hint="A flat amount in this token, added to each payment and paid by the buyer. It goes to BitRegalo to cover network costs. 0 is allowed.">
                <input className={cn(inputCls, "t-num max-w-48")} type="number" inputMode="decimal" min="0" step="any" value={fee} onChange={(ev) => setFee(ev.target.value)} />
              </Field>
              <div>
                <Button
                  disabled={isPending || !isAddress(token)}
                  onClick={() => send("Accept token", { address: t.instance, abi: abis.instance, functionName: "setToken", args: [token, true, 18, parseUnits(fee || "0", 18)] }).then(refetch)}
                >
                  Accept this token
                </Button>
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
        </>
      )}
    </div>
  )
}
