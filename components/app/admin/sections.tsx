"use client"
import { useState } from "react"
import Link from "next/link"
import type { Address } from "viem"
import { addresses, PUBLIC_WORKSPACE_ID, network } from "@/lib/bitregalo/config"
import { useCountryCounts, useMarketAvailable } from "@/lib/bitregalo/market"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { Addr, Amount, Card, Empty, Fact, Facts, LedgerRow, Pill, RowsSkeleton, Section, Stat } from "@/components/app/ui"
import { Button } from "@/components/ui/button"
import { Amounts, StatGrid, StatusPill, SubHead, fmtDate, plural } from "./parts"
import { OPEN_ITEMS, PHASES, type RoadmapItem } from "./roadmap"
import { LOW_BNB, MAX_RECORDS, ROLE_LABEL, deployment, type Platform, type WorkspaceRow } from "./use-platform"

const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase()
const isZero = (a?: string) => !a || /^0x0{40}$/.test(a)
const pct = (bps: number | undefined) => (bps === undefined ? "…" : `${bps / 100}%`)
const workspaceHref = (id: bigint) => (id === PUBLIC_WORKSPACE_ID ? "/app" : `/app/t/${id}`)
const nowSec = () => BigInt(Math.floor(Date.now() / 1000))

/** Section anchors, in page order. */
export const SECTIONS = [
  { id: "glance", label: "At a glance" },
  { id: "funding", label: "Funding" },
  { id: "workspaces", label: "Workspaces" },
  { id: "users", label: "Users" },
  { id: "contracts", label: "Contracts" },
  { id: "accounts", label: "Accounts and verification" },
  { id: "roadmap", label: "Roadmap" },
] as const

/* ── 1. At a glance ─────────────────────────────────────────────────────────── */

export function Glance({ p }: { p: Platform }) {
  const marketOn = useMarketAvailable()
  const market = useCountryCounts()
  const ws = p.workspaces
  const ready = p.ready.workspaces
  const sum = (f: (w: WorkspaceRow) => bigint | number | undefined) => (ready ? ws.reduce((a, w) => a + BigInt(f(w) ?? 0), 0n) : undefined)
  const onCurrent = p.latest === null || !ready ? undefined : ws.filter((w) => w.version === p.latest).length
  const states = [1, 2, 3, 4].map((s) => ws.reduce((a, w) => a + (w.escrowStates[s] ?? 0), 0))
  const entries = market.data ? market.data.countries.reduce((a, c) => a + c.requests + c.listings, 0) : undefined
  const n = (v: bigint | number | undefined) => (v === undefined ? "…" : <span className="t-num">{Number(v).toLocaleString()}</span>)
  const records = p.ready.records
  const heldRows = p.escrowHeld.filter((h) => p.tokenOf(h.token).stable || h.amount > 0n)

  return (
    <Section title="At a glance" description="Read live from the chain, every 30 seconds.">
      <StatGrid>
        <Stat label="Workspaces" value={n(ws.length || (ready ? 0 : undefined))} hint={onCurrent === undefined ? "…" : `${onCurrent} on the current contracts`} />
        <Stat label="Wallets seen on chain" value={n(records ? p.users.length : undefined)} hint="in any record, in any workspace" />
        <Stat label="Requests" value={n(sum((w) => w.requests))} hint={records ? plural(sum((w) => w.bids), "offer received", "offers received") : "…"} />
        <Stat label="Listings" value={n(sum((w) => w.listings))} hint={records ? `${String(sum((w) => w.listingsTaken))} taken` : "…"} />
        <Stat
          label="Escrows"
          value={n(sum((w) => w.escrows))}
          hint={ready ? `${states[0]} held · ${states[1]} released · ${states[2]} handed back · ${states[3]} returned` : "…"}
        />
        <Stat label="Direct payments" value={n(sum((w) => w.direct))} hint="settled straight away, including shop sales and redemptions" />
        <Stat
          label="Marketplace entries"
          value={n(entries)}
          hint={!marketOn ? "no marketplace index in this build" : market.isError ? "the marketplace index did not answer" : market.data ? plural(market.data.countries.length, "country", "countries") : "…"}
        />
        <Stat label="Platform fee" value={pct(p.feeBps)} hint={`for new workspaces, at most ${pct(p.maxFeeBps)}`} />
        {heldRows.map((h) => {
          const t = p.tokenOf(h.token)
          return <Stat key={h.token} label={`Held in escrow, ${t.symbol}`} value={ready ? <Amount value={h.amount} decimals={t.decimals} /> : "…"} hint="across every workspace's vault" />
        })}
        <Stat label="Tokens created" value={n(p.tokenCount)} hint="through the token maker" />
        <Stat
          label="Platform"
          value={p.paused === undefined ? "…" : p.paused ? "Paused" : "Running"}
          hint={p.paused ? "no new workspaces, escrows or direct payments; releases still work" : "new workspaces, escrows and payments are open"}
        />
      </StatGrid>
    </Section>
  )
}

/* ── 2. Funding ─────────────────────────────────────────────────────────────── */

export function Funding({ p }: { p: Platform }) {
  const nameOf = useWorkspaceName()
  const vault = p.feeVault.filter((h) => p.tokenOf(h.token).stable || h.amount > 0n)
  const held = p.escrowHeld.filter((h) => h.amount > 0n)
  const withTreasury = p.workspaces.filter((w) => !!w.treasury)
  const waiting = p.feesWaiting.filter((h) => h.amount > 0n)
  const d = p.deposit

  return (
    <Section title="Funding" description="Where the platform's tokens and its users' tokens sit right now.">
      <div className="space-y-6">
        <Card flush title="Platform fee treasury" description="Launch and token fees arrive here straight away. Platform and service fees arrive when someone sends them on from a workspace vault." action={<Button asChild size="sm" variant="ghost"><Link href="/app/operator">Withdraw</Link></Button>}>
          {!p.ready.workspaces && vault.every((h) => h.amount === 0n) ? <RowsSkeleton rows={2} /> : vault.map((h) => {
            const t = p.tokenOf(h.token)
            return <LedgerRow key={h.token} title={t.symbol} meta={<Addr a={h.token} />} amount={<Amount value={h.amount} decimals={t.decimals} />} />
          })}
          <p className="border-t border-border px-5 py-3 text-sm text-muted-foreground sm:px-6">
            Only the treasury&apos;s owner, <Addr a={String(p.treasuryOwner ?? "")} />, can withdraw, on Platform and earnings.
          </p>
        </Card>

        <Card flush title="Fees waiting in workspace vaults" description="Kept in each workspace's vault as payments happen. Anyone can send them to the platform fee treasury." action={<Button asChild size="sm" variant="ghost"><Link href="/app/operator">Send them on</Link></Button>}>
          {!p.ready.workspaces ? <RowsSkeleton rows={1} /> : waiting.length === 0 ? (
            <Empty title="Nothing is waiting" body="Fees appear here after a direct payment, a sale, or the release of a held payment." />
          ) : waiting.map((h) => {
            const t = p.tokenOf(h.token)
            const where = p.workspaces.filter((w) => w.fees.some((x) => same(x.token, h.token)))
            return <LedgerRow key={h.token} title={t.symbol} meta={<>In {where.map((w) => nameOf(w.id)).join(", ")}</>} amount={<Amount value={h.amount} decimals={t.decimals} />} />
          })}
        </Card>

        <Card title="Sponsored gas" description="The paymaster's deposit and stake on the EntryPoint. The deposit pays users' network fees once sponsored gas is switched on.">
          <Facts columns={3}>
            <Fact label="Deposit">{d ? <Amount value={d.deposit} symbol={network.nativeSymbol} /> : "…"}</Fact>
            <Fact label="Stake">
              {d ? (
                <>
                  <Amount value={d.stake} symbol={network.nativeSymbol} />
                  <span className="block text-sm font-normal text-muted-foreground">
                    {d.staked ? `Staked, ${Math.round(d.unstakeDelaySec / 3600)} h to unstake` : d.withdrawTime > 0 ? "Unlocking" : "Not staked"}
                  </span>
                </>
              ) : "…"}
            </Fact>
            <Fact label="Paymaster">
              <Addr a={addresses.paymaster} />
              <span className="block text-sm font-normal text-muted-foreground">on EntryPoint <Addr a={deployment.entryPoint} /></span>
            </Fact>
          </Facts>
        </Card>

        <Card flush title="Wallets that pay their own network fees" description={`Each needs ${network.nativeSymbol} for its own transactions. Under 0.02 ${network.nativeSymbol} is flagged.`}>
          {p.gasWallets.length === 0 && <RowsSkeleton rows={2} />}
          {p.gasWallets.map((g) => (
            <LedgerRow
              key={g.address}
              title={g.label}
              meta={<>{g.what}<span className="block"><Addr a={g.address} /></span></>}
              amount={g.balance !== undefined ? <Amount value={g.balance} symbol={network.nativeSymbol} /> : "…"}
              status={g.balance === undefined ? undefined : g.balance < LOW_BNB ? <Pill tone="accent">Top up soon</Pill> : <Pill tone="good">Enough</Pill>}
            />
          ))}
        </Card>

        <Card flush title="Held in escrow" description="Locked in workspace vaults until each escrow is released, handed back or returned.">
          {!p.ready.workspaces ? <RowsSkeleton rows={2} /> : held.length === 0 ? (
            <Empty title="Nothing held right now" body="No workspace has an escrow waiting to be released or handed back." />
          ) : held.map((h) => {
            const t = p.tokenOf(h.token)
            const where = p.workspaces.filter((w) => w.held.some((x) => same(x.token, h.token)))
            return (
              <LedgerRow
                key={h.token}
                title={t.symbol}
                meta={<>In {where.map((w) => nameOf(w.id)).join(", ")}</>}
                amount={<Amount value={h.amount} decimals={t.decimals} />}
              />
            )
          })}
        </Card>

        <Card flush title="Workspace treasuries" description="Owned by each workspace's admin. They hold the shop's stock and what it earns.">
          {!p.ready.records ? <RowsSkeleton rows={1} /> : withTreasury.length === 0 ? (
            <Empty title="No workspace yet" body="Every workspace gets its own treasury when it is created. They appear here once a workspace exists." />
          ) : withTreasury.map((w) => (
            <LedgerRow
              key={String(w.id)}
              href={workspaceHref(w.id)}
              lead={`#${String(w.id)}`}
              title={nameOf(w.id)}
              meta={<>Treasury <Addr a={w.treasury!} /></>}
              amount={<Amounts held={w.treasuryBalances} tokenOf={p.tokenOf} none="Empty" />}
            />
          ))}
        </Card>
      </div>
    </Section>
  )
}

/* ── 3. Workspaces ──────────────────────────────────────────────────────────── */

export function Workspaces({ p }: { p: Platform }) {
  const nameOf = useWorkspaceName()
  const symbols = (list: Address[]) => list.map((t) => p.tokenOf(t).symbol).join(", ")
  return (
    <Section title="Workspaces" description="Every workspace launched from the registry, oldest first. The BitRegalo network is one of them.">
      <Card flush title={p.workspaces.length > 0 ? `All workspaces (${p.workspaces.length})` : "All workspaces"}>
        {!p.ready.workspaces && p.workspaces.length === 0 && <RowsSkeleton rows={2} />}
        {p.ready.workspaces && p.workspaces.length === 0 && <Empty title="No workspaces yet" body="The first workspace appears here once it is launched." />}
        {p.workspaces.map((w) => {
          const current = w.version !== undefined && w.version === p.latest
          const settings = [
            w.directOn === undefined ? null : w.directOn ? "direct payments on" : "direct payments off",
            w.escrowOn === undefined ? null : w.escrowOn ? "escrow on" : "escrow off",
            w.kycRequired === undefined ? null : w.kycRequired ? "KYC required" : "no KYC",
            w.accepted.length > 0 ? `accepts ${symbols(w.accepted)}` : p.ready.workspaces ? "accepts no tokens yet" : null,
          ].filter(Boolean)
          const counts = [
            plural(w.requests, "request", "requests"),
            plural(w.listings, "listing", "listings"),
            plural(w.escrows, "escrow", "escrows"),
            plural(w.direct, "direct payment", "direct payments"),
            ...(w.payments !== undefined ? [`${plural(w.payments, "payment", "payments")} sent`] : []),
            ...(w.sales !== undefined ? [plural(w.sales, "shop sale", "shop sales")] : []),
          ]
          return (
            <LedgerRow
              key={String(w.id)}
              href={workspaceHref(w.id)}
              lead={`#${String(w.id)}`}
              title={nameOf(w.id)}
              meta={
                <>
                  <span className="block">
                    Workspace #{String(w.id)} · {w.version === undefined ? "contract set …" : `contract set ${w.version}`} · admin <Addr a={w.admin} /> · platform fee {pct(w.feeBps)}
                  </span>
                  {settings.length > 0 && <span className="block">{settings.join(" · ").replace(/^./, (c) => c.toUpperCase())}</span>}
                  <span className="block t-num">{counts.join(" · ")}</span>
                </>
              }
              amount={p.ready.workspaces ? <Amounts held={w.held} tokenOf={p.tokenOf} none="Nothing held" /> : undefined}
              status={w.version === undefined ? undefined : current ? <Pill tone="good">Current</Pill> : <Pill>Earlier contracts</Pill>}
            />
          )
        })}
      </Card>
    </Section>
  )
}

/* ── 4. Users ───────────────────────────────────────────────────────────────── */

const FIRST = 30

export function Users({ p, me }: { p: Platform; me?: string }) {
  const nameOf = useWorkspaceName()
  const [all, setAll] = useState(false)
  const now = nowSec()
  const kycOn = p.kycWorkspaces.length > 0
  const list = all ? p.users : p.users.slice(0, FIRST)
  return (
    <Section
      title="Users"
      description={
        <>
          Every wallet that appears in a record of any workspace: admins, requesters, suppliers, buyers, payers, payees and token creators, most
          active first. {kycOn ? "Identity checks are shown for workspaces that require them." : "No workspace requires identity checks yet."}
        </>
      }
    >
      <Card flush title={p.ready.records ? `Wallets (${p.users.length})` : "Wallets"}>
        {!p.ready.records && <RowsSkeleton rows={3} />}
        {p.ready.records && p.users.length === 0 && <Empty title="No wallets yet" body="Wallets appear here once they post, offer, pay or launch something." />}
        {p.ready.records && list.map((u) => {
          const verified = u.kyc.filter((k) => k.until > now)
          const needs = u.kyc.filter((k) => k.until <= now && u.active.includes(Number(k.workspace)))
          const roles = u.roles.map((r) => ROLE_LABEL[r]).join(", ")
          return (
            <LedgerRow
              key={u.address}
              title={
                <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Addr a={u.address} className="text-base text-foreground" />
                  {same(u.address, p.owner) && <Pill>Platform owner</Pill>}
                  {same(u.address, me) && <Pill tone="good">You</Pill>}
                </span>
              }
              meta={
                <>
                  <span className="block">{roles.replace(/^./, (c) => c.toUpperCase())}</span>
                  <span className="block">
                    First seen in {nameOf(u.firstSeen)}
                    {u.active.length > 1 && <>, active in {u.active.length} workspaces</>}
                  </span>
                  {verified.length > 0 && (
                    <span className="block">
                      Verified in {verified.map((k) => `#${String(k.workspace)} until ${fmtDate(new Date(Number(k.until) * 1000))}`).join(", ")}
                    </span>
                  )}
                </>
              }
              amount={<span className="t-num">{plural(u.records, "record", "records")}</span>}
              status={!kycOn || !p.ready.kyc ? undefined : verified.length > 0 ? <Pill tone="good">Verified</Pill> : needs.length > 0 ? <Pill>Not verified</Pill> : undefined}
            />
          )
        })}
        {p.ready.records && p.users.length > FIRST && (
          <div className="border-t border-border px-5 py-3 sm:px-6">
            <Button size="sm" variant="ghost" onClick={() => setAll((v) => !v)}>{all ? `Show the first ${FIRST}` : `Show all ${p.users.length}`}</Button>
          </div>
        )}
      </Card>
      <p className="mt-3 max-w-[68ch] text-xs text-subtle">
        Read record by record from the chain (up to {MAX_RECORDS} of each kind per workspace). This list moves to the indexer as volume grows.
      </p>
    </Section>
  )
}

/* ── 5. Contracts ───────────────────────────────────────────────────────────── */

export function Contracts({ p, me }: { p: Platform; me?: string }) {
  const rows = [
    { name: "Registry", tech: "BitRegaloMother", what: "Launches workspaces, registers contract versions and holds the fee settings. Cannot touch anyone's tokens.", addr: addresses.mother, owner: p.owner, pending: p.pendingOwner },
    { name: "Platform fee treasury", tech: "Treasury", what: "Receives every platform fee. Only its owner can withdraw.", addr: addresses.treasury, owner: p.treasuryOwner, pending: p.treasuryPending },
    { name: "Paymaster", tech: "BitRegaloPaymaster", what: "Pays network fees for sponsored transactions from its EntryPoint deposit, for the workspaces its owner lists.", addr: addresses.paymaster, owner: p.paymasterOwner, pending: p.paymasterPending },
    { name: "Token maker", tech: "TokenFactory", what: "Creates utility tokens for workspaces and projects. A workspace's own token can only be created by its admin.", addr: addresses.tokenFactory, owner: p.factoryOwner, pending: p.factoryPending },
    { name: "Test stablecoin", tech: "tUSD", what: "Practice tokens with no value, from the public faucet. It has no owner.", addr: addresses.testStable },
    { name: "EntryPoint", tech: "ERC-4337 v0.7", what: "The shared contract that runs sponsored transactions and keeps the paymaster's deposit and stake. Not BitRegalo's own.", addr: deployment.entryPoint },
    { name: "Utility token template", tech: "UtilityToken", what: "The code every new utility token copies.", addr: deployment.utilityTokenImpl },
    { name: "Smart account factory", tech: "BitRegaloAccountFactory", what: "Creates smart accounts for the embedded wallet, which the app does not use yet.", addr: deployment.accountFactory },
    { name: "Smart account template", tech: "BitRegaloAccount", what: "The code each smart account runs. It cannot be upgraded.", addr: deployment.accountImplementation },
  ].filter((c): c is typeof c & { addr: Address } => !!c.addr) as { name: string; tech: string; what: string; addr: Address; owner?: Address; pending?: Address }[]

  return (
    <Section title="Contracts" description="The platform's own contracts and every registered set of workspace contracts. Each workspace keeps the set it was created with. An owner of a platform contract cannot give ownership up, and a handover takes two steps.">
      <div className="space-y-6">
        <Card flush title="Platform contracts">
          {rows.map((c) => (
            <LedgerRow
              key={c.addr}
              title={<>{c.name} <span className="font-normal text-muted-foreground">({c.tech})</span></>}
              meta={
                <>
                  {c.what}
                  <span className="block">
                    Contract <Addr a={c.addr} />
                    {!isZero(c.owner) && <> · owner <Addr a={c.owner!} /></>}
                    {!isZero(c.pending) && <> · offered to <Addr a={c.pending!} /></>}
                  </span>
                </>
              }
              status={same(c.owner, me) ? <Pill tone="good">You</Pill> : !isZero(c.pending) ? <Pill tone="accent">Handover pending</Pill> : undefined}
            />
          ))}
        </Card>

        <Card flush title="Contract sets" description="Numbered by the registry in the order they were registered on this network. New workspaces get the newest one. This app works with protocol version 2.">
          {p.versions.map((v) => (
            <LedgerRow
              key={v.n}
              lead={`#${v.n}`}
              title={<>Contract set {v.n}{v.n === p.latest && <span className="font-normal text-muted-foreground"> (current)</span>}</>}
              meta={
                <>
                  <span className="block">
                    Records <Addr a={v.instanceImpl ?? ""} /> · vault <Addr a={v.vaultImpl ?? ""} />
                    {v.treasuryImpl && <> · treasury <Addr a={v.treasuryImpl} /></>}
                  </span>
                  {p.ready.workspaces && <span className="block">{v.workspaces === 1 ? "1 workspace uses it" : `${v.workspaces} workspaces use it`}</span>}
                </>
              }
              status={
                v.registered === undefined ? undefined
                  : v.deprecated ? <Pill>Deprecated</Pill>
                    : v.registered ? <Pill tone="good">Registered</Pill>
                      : <Pill tone="accent">Not registered</Pill>
              }
            />
          ))}
        </Card>
      </div>
    </Section>
  )
}

/* ── 7. Roadmap ─────────────────────────────────────────────────────────────── */

export function Roadmap({ p }: { p: Platform }) {
  const network = p.workspaces.find((w) => w.id === PUBLIC_WORKSPACE_ID)
  const liveDone = (item: RoadmapItem) =>
    item.live === "public-network"
      ? network?.version !== undefined && p.latest !== null && network.version >= p.latest
      : item.live === "launch-fee-tusd"
        ? same(p.deployFeeToken, addresses.testStable)
        : false
  const statusOf = (item: RoadmapItem) => (liveDone(item) ? "Done" : item.status)

  return (
    <Section title="Roadmap" description="What is built, then what is designed and not built yet, in the order it is planned. The open items that are not part of a phase come last.">
      <div className="space-y-6">
        <Card flush title="Phases">
          <ol>
            {PHASES.map((ph) => {
              const done = ph.items.filter((i) => statusOf(i) === "Done").length
              return (
                <li key={ph.n} className="border-b border-border px-5 py-4 last:border-b-0 sm:px-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="t-subheading"><span className="t-num mr-2 text-subtle">{ph.n}</span>{ph.title}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground"><span className="t-num">{done}</span> of <span className="t-num">{ph.items.length}</span> done</p>
                    </div>
                    <StatusPill status={ph.status} />
                  </div>
                  <ul className="mt-3 grid gap-2">
                    {ph.items.map((i) => (
                      <li key={i.title} className="flex items-start justify-between gap-4 text-sm">
                        <span className="min-w-0">
                          {i.title}
                          {i.note && <span className="text-muted-foreground"> · {i.note}</span>}
                        </span>
                        <StatusPill status={statusOf(i)} />
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ol>
        </Card>

        <div>
          <SubHead>Open items</SubHead>
          <Card flush>
            {OPEN_ITEMS.map((i) => (
              <LedgerRow key={i.title} title={i.title} meta={liveDone(i) ? "Done: the chain shows it." : i.note} status={<StatusPill status={statusOf(i)} />} />
            ))}
          </Card>
        </div>
      </div>
    </Section>
  )
}
