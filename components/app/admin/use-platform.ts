"use client"
/*
 * Everything the super admin page knows about the platform, read straight from the chain in a
 * few batched multicalls (each stage needs the answers of the one before it).
 *
 * NOTE: this walks every record of every workspace on each load: requests and the offers on
 * them, listings, escrows, payments and tokens. That is fine at practice-network volume (a
 * handful of workspaces and records). It must move to the indexer as volume grows: the page
 * should then ask the indexer for counts, wallets and totals instead of reading records here.
 * MAX_RECORDS is a guard so a busy workspace cannot stall the page in the meantime.
 */
import { useBalance, useReadContracts } from "wagmi"
import type { Abi, Address } from "viem"
import bundle from "@/lib/bitregalo/bitregalo.json"
import { abis, addresses, versions as fileVersions, STABLES } from "@/lib/bitregalo/config"
import { useInstances, useTokensOf } from "@/lib/bitregalo/instances"
import type { Bid, Escrow, Offer, Payment, Rfp } from "@/lib/bitregalo/hooks"

/** Per workspace and kind of record. Beyond this the page needs the indexer. */
export const MAX_RECORDS = 250
const REFRESH = 30_000
/** Wallets that pay their own network fees are flagged under this many tBNB (0.02). */
export const LOW_BNB = 20_000_000_000_000_000n

const dep = bundle.deployments as unknown as {
  entryPoint?: string
  paymasterSigner?: string
  deployer?: string
  utilityTokenImpl?: string
  accountFactory?: string
  accountImplementation?: string
}
export const deployment = {
  entryPoint: (dep.entryPoint ?? "0x0000000071727De22E5E9d8BAf0edAc6f37da032") as Address,
  paymasterSigner: dep.paymasterSigner as Address | undefined,
  deployer: dep.deployer as Address | undefined,
  utilityTokenImpl: dep.utilityTokenImpl as Address | undefined,
  accountFactory: dep.accountFactory as Address | undefined,
  accountImplementation: dep.accountImplementation as Address | undefined,
}

const ownableAbi = abis.ownable
/** EntryPoint v0.7: the paymaster's deposit and stake. */
const entryPointAbi: Abi = [
  {
    type: "function", name: "getDepositInfo", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "deposit", type: "uint256" },
        { name: "staked", type: "bool" },
        { name: "stake", type: "uint112" },
        { name: "unstakeDelaySec", type: "uint32" },
        { name: "withdrawTime", type: "uint48" },
      ],
    }],
  },
]

type Call = { address: Address; abi: Abi; functionName: string; args?: readonly unknown[] }
type Result = { status: "success" | "failure"; result?: unknown }

/** One multicall stage. `get` reads an answer by the key it was asked under. */
function useBatch(calls: [string, Call][], enabled: boolean) {
  const q = useReadContracts({
    contracts: calls.map(([, c]) => c),
    query: { enabled: enabled && calls.length > 0, refetchInterval: REFRESH },
  })
  const data = q.data as readonly Result[] | undefined
  const index = new Map(calls.map(([k], i) => [k, i]))
  function get<T>(key: string): T | undefined {
    const i = index.get(key)
    const r = i === undefined ? undefined : data?.[i]
    return r && r.status === "success" ? (r.result as T) : undefined
  }
  // Settled: every call has answered, or there was nothing to ask once the stage could run.
  const done = enabled && (calls.length === 0 || data?.length === calls.length)
  return { get, done, refetch: q.refetch }
}

const isZero = (a?: string) => !a || /^0x0{40}$/.test(a)
const lower = (a: string) => a.toLowerCase()
const uniq = (list: Address[]) => {
  const seen = new Set<string>()
  return list.filter((a) => !isZero(a) && !seen.has(lower(a)) && !!seen.add(lower(a)))
}
const range = (n: bigint | undefined) => Array.from({ length: Math.min(Number(n ?? 0n), MAX_RECORDS) }, (_, i) => BigInt(i + 1))

export type Role =
  | "admin" | "requester" | "bidder" | "supplier" | "buyer" | "namedBuyer"
  | "payer" | "payee" | "escrowBuyer" | "escrowSupplier" | "tokenCreator"
export const ROLE_LABEL: Record<Role, string> = {
  admin: "workspace admin",
  requester: "requester",
  bidder: "made offers",
  supplier: "listing supplier",
  buyer: "listing buyer",
  namedBuyer: "named buyer",
  payer: "payer",
  payee: "payee",
  escrowBuyer: "escrow buyer",
  escrowSupplier: "escrow supplier",
  tokenCreator: "token creator",
}
const ROLE_ORDER = Object.keys(ROLE_LABEL) as Role[]

export type TokenMeta = { address: Address; symbol: string; decimals: number; stable: boolean }
export type Held = { token: Address; amount: bigint }

export type WorkspaceRow = {
  id: bigint
  instance: Address
  vault: Address
  admin: Address
  version?: number
  treasury?: Address
  directOn?: boolean
  escrowOn?: boolean
  kycRequired?: boolean
  feeBps?: number
  accepted: Address[]
  requests?: bigint
  listings?: bigint
  escrows?: bigint
  /** Every direct settlement through the vault: payments, shop sales, redemptions, direct awards. */
  direct?: bigint
  /** Open-amount payments ("Send a payment"). */
  payments?: bigint
  sales?: bigint
  bids: number
  listingsTaken: number
  /** Escrows by state number (index 1 held, 2 released, 3 handed back, 4 returned). */
  escrowStates: number[]
  held: Held[]
  /** Platform fees kept in this workspace's vault until someone sends them to the platform fee treasury. */
  fees: Held[]
  treasuryBalances: Held[]
}

export type UserRow = {
  address: Address
  roles: Role[]
  records: number
  firstSeen: bigint
  /** Workspace ids this wallet appears in. Plain numbers: React's dev tools cannot print arrays of bigints. */
  active: number[]
  /** For workspaces that require identity checks: the expiry of this wallet's valid approval there (0 = none, expired, revoked or void). */
  kyc: { workspace: bigint; until: bigint }[]
}

export type GasWallet = { label: string; what: string; address: Address; balance?: bigint }

export function usePlatform() {
  /* ── Stage 1: the platform's own contracts ───────────────────────────────── */
  const head = useBatch([
    ["owner", { address: addresses.mother, abi: ownableAbi, functionName: "owner" }],
    ["pendingOwner", { address: addresses.mother, abi: ownableAbi, functionName: "pendingOwner" }],
    ["paused", { address: addresses.mother, abi: abis.mother, functionName: "paused" }],
    ["feeBps", { address: addresses.mother, abi: abis.mother, functionName: "defaultFeeBps" }],
    ["maxFeeBps", { address: addresses.mother, abi: abis.mother, functionName: "MAX_FEE_BPS" }],
    ["deployFee", { address: addresses.mother, abi: abis.mother, functionName: "deployFeeAmount" }],
    ["deployFeeToken", { address: addresses.mother, abi: abis.mother, functionName: "deployFeeToken" }],
    ["versionCount", { address: addresses.mother, abi: abis.mother, functionName: "versionCount" }],
    ["treasury.owner", { address: addresses.treasury, abi: ownableAbi, functionName: "owner" }],
    ["treasury.pending", { address: addresses.treasury, abi: ownableAbi, functionName: "pendingOwner" }],
    ["factory.owner", { address: addresses.tokenFactory, abi: ownableAbi, functionName: "owner" }],
    ["factory.pending", { address: addresses.tokenFactory, abi: ownableAbi, functionName: "pendingOwner" }],
    ["factory.count", { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tokenCount" }],
    ["paymaster.owner", { address: addresses.paymaster, abi: ownableAbi, functionName: "owner" }],
    ["paymaster.pending", { address: addresses.paymaster, abi: ownableAbi, functionName: "pendingOwner" }],
    ["paymaster.deposit", { address: deployment.entryPoint, abi: entryPointAbi, functionName: "getDepositInfo", args: [addresses.paymaster] }],
  ], true)
  const owner = head.get<Address>("owner")
  const versionCount = head.get<bigint>("versionCount")
  const tokenCount = head.get<bigint>("factory.count")
  const latest = versionCount !== undefined && versionCount > 0n ? Number(versionCount) - 1 : null

  /* ── Stage 2: versions, every token, and each workspace's settings and counts ── */
  const ws = useInstances()
  // The factory lists a workspace's own tokens and each project's tokens separately, in pages.
  const created = useTokensOf(ws.list)
  const s2 = useBatch([
    ...Array.from({ length: Number(versionCount ?? 0n) }, (_, i): [string, Call] => [`version.${i}`, { address: addresses.mother, abi: abis.mother, functionName: "versions", args: [BigInt(i)] }]),
    ...ws.list.flatMap((w): [string, Call][] => {
      const inst = { address: w.instance, abi: abis.instance }
      const vault = { address: w.vault, abi: abis.vault }
      const k = String(w.id)
      return [
        [`${k}.requests`, { ...inst, functionName: "rfpCount" }],
        [`${k}.listings`, { ...inst, functionName: "offerCount" }],
        [`${k}.directOn`, { ...inst, functionName: "directEnabled" }],
        [`${k}.escrowOn`, { ...inst, functionName: "escrowEnabled" }],
        [`${k}.kyc`, { ...inst, functionName: "kycRequired" }],
        [`${k}.fee`, { ...inst, functionName: "feeBps" }],
        [`${k}.escrows`, { ...vault, functionName: "escrowCount" }],
        [`${k}.direct`, { ...vault, functionName: "directCount" }],
        [`${k}.payments`, { ...inst, functionName: "paymentCount" }],
        [`${k}.sales`, { ...inst, functionName: "saleCount" }],
        [`${k}.treasury`, { ...inst, functionName: "treasury" }],
      ]
    }),
  ], head.done && !ws.isLoading)

  const factoryTokens = uniq(ws.list.flatMap((w) => created.of(w.id).map((x) => x.address)))
  const known = uniq([...STABLES.map((s) => s.address), ...factoryTokens])
  const candidatesOf = (id: bigint) => uniq([...STABLES.map((s) => s.address), ...created.of(id).map((x) => x.address)])

  /* ── Stage 3: token details, balances held, fees waiting, and the records themselves ── */
  const s3 = useBatch([
    ...known.flatMap((t): [string, Call][] => [
      [`sym.${lower(t)}`, { address: t, abi: abis.utilityToken, functionName: "symbol" }],
      [`dec.${lower(t)}`, { address: t, abi: abis.utilityToken, functionName: "decimals" }],
      [`feeVault.${lower(t)}`, { address: t, abi: abis.erc20, functionName: "balanceOf", args: [addresses.treasury] }],
    ]),
    ...factoryTokens.map((t): [string, Call] => [`info.${lower(t)}`, { address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tokenInfo", args: [t] }]),
    ...ws.list.flatMap((w): [string, Call][] => {
      const inst = { address: w.instance, abi: abis.instance }
      const vault = { address: w.vault, abi: abis.vault }
      const k = String(w.id)
      return [
        ...candidatesOf(w.id).flatMap((t): [string, Call][] => [
          [`${k}.locked.${lower(t)}`, { ...vault, functionName: "totalLocked", args: [t] }],
          [`${k}.fees.${lower(t)}`, { ...vault, functionName: "accruedFees", args: [t] }],
          [`${k}.accepts.${lower(t)}`, { ...inst, functionName: "tokens", args: [t] }],
        ]),
        ...range(s2.get<bigint>(`${k}.requests`)).flatMap((id): [string, Call][] => [
          [`${k}.rfp.${id}`, { ...inst, functionName: "getRfp", args: [id] }],
          [`${k}.bidCount.${id}`, { ...inst, functionName: "bidCount", args: [id] }],
        ]),
        ...range(s2.get<bigint>(`${k}.listings`)).map((id): [string, Call] => [`${k}.offer.${id}`, { ...inst, functionName: "getOffer", args: [id] }]),
        ...range(s2.get<bigint>(`${k}.escrows`)).map((id): [string, Call] => [`${k}.escrow.${id}`, { ...vault, functionName: "getEscrow", args: [id] }]),
      ]
    }),
  ], s2.done && !created.isLoading)

  /* ── Stage 4: offers on requests, payments, and each workspace treasury's balances ── */
  const s4 = useBatch(
    ws.list.flatMap((w): [string, Call][] => {
      const inst = { address: w.instance, abi: abis.instance }
      const k = String(w.id)
      const treasury = s2.get<Address>(`${k}.treasury`)
      return [
        ...range(s2.get<bigint>(`${k}.payments`)).map((id): [string, Call] => [`${k}.payment.${id}`, { ...inst, functionName: "getPayment", args: [id] }]),
        ...range(s2.get<bigint>(`${k}.requests`)).flatMap((rfp) =>
          range(s3.get<bigint>(`${k}.bidCount.${rfp}`)).map((b): [string, Call] => [`${k}.bid.${rfp}.${b}`, { ...inst, functionName: "getBid", args: [rfp, b] }]),
        ),
        ...(treasury && !isZero(treasury)
          ? candidatesOf(w.id).map((t): [string, Call] => [`${k}.treasuryBal.${lower(t)}`, { address: t, abi: abis.erc20, functionName: "balanceOf", args: [treasury] }])
          : []),
      ]
    }),
    s3.done,
  )

  /* ── Tokens ─────────────────────────────────────────────────────────────── */
  const tokens = new Map<string, TokenMeta>(
    known.map((t) => [
      lower(t),
      {
        address: t,
        symbol: s3.get<string>(`sym.${lower(t)}`) ?? STABLES.find((s) => lower(s.address) === lower(t))?.symbol ?? "…",
        decimals: Number(s3.get<number>(`dec.${lower(t)}`) ?? 18),
        stable: STABLES.some((s) => lower(s.address) === lower(t)),
      },
    ]),
  )
  const tokenOf = (a: string): TokenMeta => tokens.get(lower(a)) ?? { address: a as Address, symbol: "tokens", decimals: 18, stable: false }

  /* ── Workspaces and the wallets in their records ──────────────────────────── */
  const users = new Map<string, { address: Address; roles: Set<Role>; recordKeys: Set<string>; firstSeen: bigint; active: Set<bigint> }>()
  const seen = (a: Address | undefined, role: Role, workspace: bigint, record?: string) => {
    if (!a || isZero(a)) return
    let u = users.get(lower(a))
    if (!u) users.set(lower(a), (u = { address: a, roles: new Set(), recordKeys: new Set(), firstSeen: workspace, active: new Set() }))
    u.roles.add(role)
    if (record) u.recordKeys.add(record)
    if (workspace < u.firstSeen) u.firstSeen = workspace
    u.active.add(workspace)
  }

  const workspaces: WorkspaceRow[] = ws.list.map((w) => {
    const k = String(w.id)
    const cands = candidatesOf(w.id)
    seen(w.admin, "admin", w.id)
    let bids = 0
    for (const id of range(s2.get<bigint>(`${k}.requests`))) {
      const r = s3.get<Rfp>(`${k}.rfp.${id}`)
      seen(r?.requester, "requester", w.id, `${k}.rfp.${id}`)
      for (const b of range(s3.get<bigint>(`${k}.bidCount.${id}`))) {
        const bid = s4.get<Bid>(`${k}.bid.${id}.${b}`)
        if (bid) bids++
        seen(bid?.provider, "bidder", w.id, `${k}.bid.${id}.${b}`)
      }
    }
    let listingsTaken = 0
    for (const id of range(s2.get<bigint>(`${k}.listings`))) {
      const o = s3.get<Offer>(`${k}.offer.${id}`)
      if (o?.state === 2) listingsTaken++
      seen(o?.supplier, "supplier", w.id, `${k}.offer.${id}`)
      seen(o?.buyer, "buyer", w.id, `${k}.offer.${id}`)
      if (o && lower(o.designatedBuyer) !== lower(o.buyer)) seen(o.designatedBuyer, "namedBuyer", w.id, `${k}.offer.${id}`)
    }
    const escrowStates = [0, 0, 0, 0, 0]
    for (const id of range(s2.get<bigint>(`${k}.escrows`))) {
      const e = s3.get<Escrow>(`${k}.escrow.${id}`)
      if (e) escrowStates[e.state] = (escrowStates[e.state] ?? 0) + 1
      seen(e?.issuer, "escrowBuyer", w.id, `${k}.escrow.${id}`)
      seen(e?.receiver, "escrowSupplier", w.id, `${k}.escrow.${id}`)
    }
    for (const id of range(s2.get<bigint>(`${k}.payments`))) {
      const p = s4.get<Payment>(`${k}.payment.${id}`)
      seen(p?.payer, "payer", w.id, `${k}.payment.${id}`)
      seen(p?.payee, "payee", w.id, `${k}.payment.${id}`)
    }
    const treasury = s2.get<Address>(`${k}.treasury`)
    return {
      id: w.id,
      instance: w.instance,
      vault: w.vault,
      admin: w.admin,
      version: Number(w.version),
      treasury: treasury && !isZero(treasury) ? treasury : undefined,
      directOn: s2.get<boolean>(`${k}.directOn`),
      escrowOn: s2.get<boolean>(`${k}.escrowOn`),
      kycRequired: s2.get<boolean>(`${k}.kyc`),
      feeBps: s2.get<number>(`${k}.fee`),
      accepted: cands.filter((t) => !!s3.get<readonly [boolean, number, bigint]>(`${k}.accepts.${lower(t)}`)?.[0]),
      requests: s2.get<bigint>(`${k}.requests`),
      listings: s2.get<bigint>(`${k}.listings`),
      escrows: s2.get<bigint>(`${k}.escrows`),
      direct: s2.get<bigint>(`${k}.direct`),
      payments: s2.get<bigint>(`${k}.payments`),
      sales: s2.get<bigint>(`${k}.sales`),
      bids,
      listingsTaken,
      escrowStates,
      held: cands.map((t) => ({ token: t, amount: s3.get<bigint>(`${k}.locked.${lower(t)}`) ?? 0n })).filter((h) => h.amount > 0n),
      fees: cands.map((t) => ({ token: t, amount: s3.get<bigint>(`${k}.fees.${lower(t)}`) ?? 0n })).filter((h) => h.amount > 0n),
      treasuryBalances: cands.map((t) => ({ token: t, amount: s4.get<bigint>(`${k}.treasuryBal.${lower(t)}`) ?? 0n })).filter((h) => h.amount > 0n),
    }
  })
  for (const t of factoryTokens) {
    const info = s3.get<readonly [bigint, bigint, Address, bigint]>(`info.${lower(t)}`)
    if (info) seen(info[2], "tokenCreator", info[0], `token.${lower(t)}`)
  }

  /* ── Stage 5: identity checks, for workspaces that require them ─────────────── */
  const kycWorkspaces = workspaces.filter((w) => w.kycRequired)
  const wallets = [...users.values()]
  const s5 = useBatch(
    // `kycOf` gives the recorded approval; `isKycValid` says whether it counts now (not expired, not
    // revoked, and recorded since the attester was last changed).
    kycWorkspaces.flatMap((w) =>
      wallets.flatMap((u): [string, Call][] => [
        [`${w.id}.kycOf.${lower(u.address)}`, { address: w.instance, abi: abis.instance, functionName: "kycOf", args: [u.address] }],
        [`${w.id}.kycValid.${lower(u.address)}`, { address: w.instance, abi: abis.instance, functionName: "isKycValid", args: [u.address] }],
      ]),
    ),
    s4.done,
  )

  const userRows: UserRow[] = wallets
    .map((u) => ({
      address: u.address,
      roles: ROLE_ORDER.filter((r) => u.roles.has(r)),
      records: u.recordKeys.size,
      firstSeen: u.firstSeen,
      active: [...u.active].map(Number).sort((a, b) => a - b),
      kyc: kycWorkspaces.map((w) => ({
        workspace: w.id,
        until: s5.get<boolean>(`${w.id}.kycValid.${lower(u.address)}`) ? BigInt(s5.get<{ validUntil: bigint }>(`${w.id}.kycOf.${lower(u.address)}`)?.validUntil ?? 0n) : 0n,
      })),
    }))
    // Most active first: records, then how many roles, then the earliest workspace.
    .sort((a, b) => b.records - a.records || b.roles.length - a.roles.length || Number(a.firstSeen - b.firstSeen))

  /* ── Totals ────────────────────────────────────────────────────────────── */
  const heldTotals = new Map<string, bigint>()
  for (const w of workspaces) for (const h of w.held) heldTotals.set(lower(h.token), (heldTotals.get(lower(h.token)) ?? 0n) + h.amount)
  const escrowHeld: Held[] = known.map((t) => ({ token: t, amount: heldTotals.get(lower(t)) ?? 0n }))
  const feeVault: Held[] = known.map((t) => ({ token: t, amount: s3.get<bigint>(`feeVault.${lower(t)}`) ?? 0n }))
  const feeTotals = new Map<string, bigint>()
  for (const w of workspaces) for (const h of w.fees) feeTotals.set(lower(h.token), (feeTotals.get(lower(h.token)) ?? 0n) + h.amount)
  /** Fees still in workspace vaults, summed per token. */
  const feesWaiting: Held[] = known.map((t) => ({ token: t, amount: feeTotals.get(lower(t)) ?? 0n }))

  const registered = Number(versionCount ?? 0n)
  const onChainVersions = Array.from({ length: registered }, (_, i) => s2.get<{ instanceImpl: Address; vaultImpl: Address; deprecated: boolean }>(`version.${i}`))
  const allVersionNumbers = [...new Set([...fileVersions.map((v) => v.n), ...Array.from({ length: registered }, (_, i) => i)])].sort((a, b) => a - b)
  const versionRows = allVersionNumbers.map((n) => {
    const file = fileVersions.find((v) => v.n === n)
    const chain = onChainVersions[n]
    return {
      n,
      instanceImpl: chain?.instanceImpl ?? file?.instanceImpl,
      vaultImpl: chain?.vaultImpl ?? file?.vaultImpl,
      treasuryImpl: file?.treasuryImpl,
      registered: versionCount !== undefined ? n < registered : undefined,
      deprecated: !!chain?.deprecated,
      workspaces: workspaces.filter((w) => w.version === n).length,
    }
  })

  /* ── Wallets that pay network fees ──────────────────────────────────────── */
  const paymasterOwner = head.get<Address>("paymaster.owner")
  const gasCandidates: Omit<GasWallet, "balance">[] = [
    ...(owner ? [{ label: "Platform owner", what: "Owns the registry, the platform fee treasury and the token maker, and signs every platform change.", address: owner }] : []),
    ...(deployment.deployer ? [{ label: "Deployer", what: "Deploys new contracts and versions.", address: deployment.deployer }] : []),
    ...(paymasterOwner ? [{ label: "Paymaster owner", what: "Owns the paymaster and tops up its deposit on the EntryPoint.", address: paymasterOwner }] : []),
    ...(deployment.paymasterSigner ? [{ label: "Paymaster signer", what: "Approves the transactions the paymaster sponsors.", address: deployment.paymasterSigner }] : []),
  ]
  // One row per wallet, even when it has several jobs.
  const gasMerged: Omit<GasWallet, "balance">[] = []
  for (const g of gasCandidates) {
    const same = gasMerged.find((x) => lower(x.address) === lower(g.address))
    if (same) {
      same.label = `${same.label}, ${g.label.toLowerCase()}`
      same.what = `${same.what} ${g.what}`
    } else gasMerged.push({ ...g })
  }
  const b0 = useBalance({ address: gasMerged[0]?.address, query: { enabled: !!gasMerged[0], refetchInterval: REFRESH } })
  const b1 = useBalance({ address: gasMerged[1]?.address, query: { enabled: !!gasMerged[1], refetchInterval: REFRESH } })
  const b2 = useBalance({ address: gasMerged[2]?.address, query: { enabled: !!gasMerged[2], refetchInterval: REFRESH } })
  const b3 = useBalance({ address: gasMerged[3]?.address, query: { enabled: !!gasMerged[3], refetchInterval: REFRESH } })
  const gasWallets: GasWallet[] = gasMerged.map((g, i) => ({ ...g, balance: [b0, b1, b2, b3][i]?.data?.value }))

  const deposit = head.get<{ deposit: bigint; staked: boolean; stake: bigint; unstakeDelaySec: number; withdrawTime: number }>("paymaster.deposit")

  return {
    owner,
    pendingOwner: head.get<Address>("pendingOwner"),
    paused: head.get<boolean>("paused"),
    feeBps: head.get<number>("feeBps"),
    maxFeeBps: head.get<number>("maxFeeBps"),
    deployFee: head.get<bigint>("deployFee"),
    deployFeeToken: head.get<Address>("deployFeeToken"),
    versionCount,
    latest,
    tokenCount,
    treasuryOwner: head.get<Address>("treasury.owner"),
    treasuryPending: head.get<Address>("treasury.pending"),
    factoryOwner: head.get<Address>("factory.owner"),
    factoryPending: head.get<Address>("factory.pending"),
    paymasterOwner,
    paymasterPending: head.get<Address>("paymaster.pending"),
    deposit,
    tokens,
    tokenOf,
    feeVault,
    feesWaiting,
    escrowHeld,
    workspaces,
    users: userRows,
    kycWorkspaces: kycWorkspaces.map((w) => Number(w.id)),
    versions: versionRows,
    gasWallets,
    ready: {
      head: head.done,
      workspaces: s2.done && (ws.list.length === 0 || s3.done),
      records: s4.done,
      kyc: s4.done && (kycWorkspaces.length === 0 || s5.done),
    },
  }
}

export type Platform = ReturnType<typeof usePlatform>
