"use client"
import { useState } from "react"
import { useSignMessage } from "wagmi"
import { countryName, useMarketAvailable } from "@/lib/bitregalo/market"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { Addr, Card, Empty, Notice, RowsSkeleton, Section, Stat } from "@/components/app/ui"
import { Button } from "@/components/ui/button"
import { StatGrid, SubHead, Table, Td, Tr, fmtDate } from "./parts"
import { AdminError, isDegraded, loadOverview, needsSignature, type AdminOverview, type AuthOverview, type Degraded, type KycOverview, type MarketOverview } from "./admin-api"

type State =
  | { kind: "idle" }
  | { kind: "busy"; step: "sign" | "load" }
  | { kind: "error"; title: string; message: string }
  | { kind: "done"; data: AdminOverview; at: Date }

const METHOD: Record<string, string> = { wallet: "Wallet", passkey: "Passkey", email: "Email", other: "Other" }
const num = (n: number | undefined) => (typeof n === "number" ? n.toLocaleString() : "…")
const date = (s: string | undefined) => {
  const d = s ? new Date(s) : null
  return d && !Number.isNaN(d.getTime()) ? fmtDate(d) : "…"
}

/* ── 6. Accounts and verification (off chain, owner only) ─────────────────── */

export function Accounts({ isOwner, ownerKnown, address }: { isOwner: boolean; ownerKnown: boolean; address?: string }) {
  const available = useMarketAvailable()
  const { signMessageAsync } = useSignMessage()
  const [state, setState] = useState<State>({ kind: "idle" })
  // What was loaded belongs to the wallet that signed for it: drop it when the wallet changes.
  const [forAddress, setForAddress] = useState(address)
  if (forAddress !== address) {
    setForAddress(address)
    setState({ kind: "idle" })
  }

  async function load() {
    if (!address) return
    setState({ kind: "busy", step: needsSignature(address) ? "sign" : "load" })
    try {
      const data = await loadOverview(address, async (args) => {
        const signature = await signMessageAsync(args)
        setState({ kind: "busy", step: "load" })
        return signature
      })
      setState({ kind: "done", data, at: new Date() })
    } catch (e) {
      if (e instanceof AdminError) {
        setState({ kind: "error", title: e.kind === "unavailable" ? "Not available yet" : "Not loaded", message: e.message })
      } else {
        setState({ kind: "error", title: "Not loaded", message: "The message was not signed, so nothing was loaded." })
      }
    }
  }

  const busy = state.kind === "busy"
  const action =
    isOwner && available ? (
      <Button variant={state.kind === "done" ? "secondary" : "default"} disabled={busy} onClick={load}>
        {busy ? (state.step === "sign" ? "Sign in your wallet…" : "Loading…") : state.kind === "done" ? "Load again" : "Load accounts and verification"}
      </Button>
    ) : undefined

  return (
    <Section
      title="Accounts and verification"
      description="Sign-in accounts, identity checks and marketplace details live off chain. Only the platform owner can see them: loading asks your wallet to sign a message (no transaction, no fee), and the signature is kept in this tab's memory for up to 9 minutes."
      action={action}
    >
      {!ownerKnown ? (
        <p className="text-sm text-muted-foreground" role="status">Checking who owns the platform…</p>
      ) : !isOwner ? (
        <Notice>
          <p>Only the platform owner can load this section. {address ? "Your connected wallet is not the owner." : "Connect the owner's wallet to load it."}</p>
        </Notice>
      ) : !available ? (
        <Notice title="No admin service in this build">
          <p>This build has no address for the admin service, so accounts and verification cannot be loaded here.</p>
        </Notice>
      ) : state.kind === "idle" ? (
        <Card>
          <Empty title="Not loaded" body="Press “Load accounts and verification”. Your wallet asks you to sign a short message; nothing is sent on chain." className="py-6" />
        </Card>
      ) : state.kind === "busy" ? (
        <Card flush><RowsSkeleton rows={3} /></Card>
      ) : state.kind === "error" ? (
        <Notice tone="muted" title={state.title}>
          <p>{state.message}</p>
        </Notice>
      ) : (
        <Overview data={state.data} at={state.at} />
      )}
    </Section>
  )
}

function Unavailable({ what, d }: { what: string; d: Degraded | undefined }) {
  return (
    <Notice title={`${what}: ${d?.reachable === false ? "not reachable" : "not connected"}`}>
      <p>{d?.reason || "The admin service did not say why."}</p>
    </Notice>
  )
}

function Overview({ data, at }: { data: AdminOverview; at: Date }) {
  return (
    <div className="space-y-10">
      <p className="text-sm text-muted-foreground">
        Loaded at <span className="t-num">{at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>. Shown here only; nothing is kept once you leave the page.
      </p>
      <div>
        <SubHead description={!isDegraded(data.auth) && (data.auth as AuthOverview).realm ? `Realm “${(data.auth as AuthOverview).realm}”` : undefined}>Sign-in accounts</SubHead>
        {isDegraded(data.auth) ? <Unavailable what="Sign-in accounts" d={data.auth} /> : <Auth a={data.auth as AuthOverview} />}
      </div>
      <div>
        <SubHead description={!isDegraded(data.kyc) && (data.kyc as KycOverview).baseUrl ? `From ${(data.kyc as KycOverview).baseUrl}` : undefined}>Identity verification</SubHead>
        {isDegraded(data.kyc) ? <Unavailable what="Identity verification" d={data.kyc} /> : <Kyc k={data.kyc as KycOverview} />}
      </div>
      <div>
        <SubHead>Marketplace index</SubHead>
        {isDegraded(data.market) ? <Unavailable what="Marketplace index" d={data.market} /> : <Market m={data.market as MarketOverview} />}
      </div>
    </div>
  )
}

function Auth({ a }: { a: AuthOverview }) {
  const recent = Array.isArray(a.recent) ? a.recent : []
  return (
    <div className="space-y-4">
      <StatGrid>
        <Stat label="Accounts" value={<span className="t-num">{num(a.users)}</span>} />
        <Stat label="New in 7 days" value={<span className="t-num">{num(a.newLast7Days)}</span>} />
        <Stat label="New in 30 days" value={<span className="t-num">{num(a.newLast30Days)}</span>} />
        <Stat label="With a wallet" value={<span className="t-num">{num(a.withWallet)}</span>} />
      </StatGrid>
      <Card flush title="Recent sign-ups">
        {recent.length === 0 ? (
          <Empty title="No sign-ups yet" body="New accounts appear here, newest first." className="py-6" />
        ) : (
          <Table caption="Recent sign-ups" columns={[{ label: "Date" }, { label: "Wallet" }, { label: "Signed up with" }]}>
            {recent.map((r, i) => (
              <Tr key={i}>
                <Td className="t-num whitespace-nowrap">{date(r.createdAt)}</Td>
                <Td>{r.wallet ? <Addr a={r.wallet} /> : <span className="text-subtle">None</span>}</Td>
                <Td>{METHOD[r.method] ?? "Other"}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}

function Kyc({ k }: { k: KycOverview }) {
  const clients = Array.isArray(k.clients) ? k.clients : []
  return (
    <Card flush>
      {clients.length === 0 ? (
        <Empty title="No clients yet" body="Each service that sends people to the identity check appears here with its counts." className="py-6" />
      ) : (
        <Table
          caption="Identity checks by client"
          columns={[{ label: "Client" }, { label: "Approved", num: true }, { label: "Rejected", num: true }, { label: "Manual review", num: true }, { label: "Pending", num: true }]}
        >
          {clients.map((c) => (
            <Tr key={c.name}>
              <Td className="font-[560]">{c.name}</Td>
              <Td num>{num(c.approved)}</Td>
              <Td num>{num(c.rejected)}</Td>
              <Td num>{num(c.manual_review)}</Td>
              <Td num>{num(c.pending)}</Td>
            </Tr>
          ))}
        </Table>
      )}
      <p className="border-t border-border px-5 py-3 text-sm text-muted-foreground sm:px-6">
        Requests for access waiting for approval: <span className="t-num font-[560] text-foreground">{num(k.pendingAccessRequests)}</span>
      </p>
    </Card>
  )
}

function Market({ m }: { m: MarketOverview }) {
  const nameOf = useWorkspaceName()
  const byCountry = Array.isArray(m.byCountry) ? m.byCountry : []
  const byWorkspace = Array.isArray(m.byWorkspace) ? m.byWorkspace : []
  return (
    <div className="space-y-4">
      <StatGrid>
        <Stat label="Entries" value={<span className="t-num">{num(m.entries)}</span>} />
        <Stat label="Requests" value={<span className="t-num">{num(m.requests)}</span>} />
        <Stat label="Listings" value={<span className="t-num">{num(m.listings)}</span>} />
        <Stat label="New in 7 days" value={<span className="t-num">{num(m.newLast7Days)}</span>} />
      </StatGrid>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card flush title="By country">
          {byCountry.length === 0 ? (
            <Empty title="No entries yet" body="Countries appear once requests and listings carry details." className="py-6" />
          ) : (
            <Table caption="Marketplace entries by country" columns={[{ label: "Country" }, { label: "Requests", num: true }, { label: "Listings", num: true }]}>
              {byCountry.map((c) => (
                <Tr key={c.code}>
                  <Td>{countryName(c.code)}</Td>
                  <Td num>{num(c.requests)}</Td>
                  <Td num>{num(c.listings)}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
        <Card flush title="By workspace">
          {byWorkspace.length === 0 ? (
            <Empty title="No entries yet" body="Workspaces appear once their records carry details." className="py-6" />
          ) : (
            <Table caption="Marketplace entries by workspace" columns={[{ label: "Workspace" }, { label: "Entries", num: true }]}>
              {byWorkspace.map((w) => (
                <Tr key={w.workspace}>
                  <Td>{nameOf(BigInt(w.workspace))} <span className="t-num text-subtle">#{w.workspace}</span></Td>
                  <Td num>{num(w.entries)}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
