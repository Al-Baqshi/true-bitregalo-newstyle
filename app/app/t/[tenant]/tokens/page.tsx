"use client"
import Link from "next/link"
import { useAccount, useReadContracts } from "wagmi"
import type { Address } from "viem"
import { useTenant } from "@/lib/bitregalo/tenant"
import { abis, addresses } from "@/lib/bitregalo/config"
import { useProjects, useWorkspaceTokens } from "@/lib/bitregalo/instances"
import { Addr, Amount, Pill, PageHead, Empty, Card } from "@/components/app/ui"
import { Explainer } from "@/components/app/explain"
import { Button } from "@/components/ui/button"

export default function TokensPage() {
  const t = useTenant()
  const base = t.base
  const { address } = useAccount()
  // The workspace's own tokens and its projects' tokens, newest first.
  const list = useWorkspaceTokens(t.id, t.instance)
  const tokens = list.addresses.slice().reverse()
  const projects = useProjects(t.instance)
  const meta = useReadContracts({
    contracts: tokens.flatMap((a) => [
      { address: a, abi: abis.utilityToken, functionName: "name" },
      { address: a, abi: abis.utilityToken, functionName: "symbol" },
      { address: a, abi: abis.utilityToken, functionName: "totalSupply" },
      { address: a, abi: abis.utilityToken, functionName: "owner" },
      { address: a, abi: abis.erc20, functionName: "balanceOf", args: [address ?? addresses.treasury] },
      { address: t.instance, abi: abis.instance, functionName: "tokens", args: [a] },
    ]),
    query: { enabled: tokens.length > 0, refetchInterval: 15_000 },
  })
  // Who issued each token, and for which project: recorded by the token maker when it was created.
  const info = useReadContracts({
    contracts: tokens.map((a) => ({ address: addresses.tokenFactory, abi: abis.tokenFactory, functionName: "tokenInfo", args: [a] })),
    query: { enabled: tokens.length > 0 },
  })
  const loading = list.isLoading
  const me = address?.toLowerCase()
  const isAdmin = !!me && t.admin.toLowerCase() === me
  const ownsProject = !!me && projects.list.some((p) => p.active && p.owner.toLowerCase() === me)
  /** Who may create a token here: the factory's rule, said before anyone starts. */
  const canCreate = !address
    ? "The workspace admin creates the workspace's own tokens. A project owner creates a token for their own project."
    : isAdmin ? "You are the admin here, so you can create a token for the workspace or for any of its projects."
    : ownsProject ? "You own a project here, so you can create a token for it. Only the admin can create a token for the workspace itself."
    : "Only the admin can create a token for the workspace itself. You can create one for a project of your own: start a project first, or as part of creating the token."
  /** ", by …" when the token maker recorded who created it. */
  const issuer = (creator: Address | undefined) =>
    !creator || /^0x0{40}$/.test(creator) ? null
      : creator.toLowerCase() === me ? <>, by you</>
      : creator.toLowerCase() === t.admin.toLowerCase() ? <>, by the workspace admin (<Addr a={creator} />)</>
      : <>, by <Addr a={creator} /></>

  return (
    <div className="space-y-8">
      <PageHead
        title="Tokens"
        intro="Credits, vouchers and memberships issued for this workspace and its projects. Each one says who issued it and whether it can be used to pay here."
        action={<Button asChild><Link href={`${base}/tokens/new`}>Create a token</Link></Button>}
      />
      <p className="-mt-3 max-w-[62ch] text-sm text-muted-foreground">{canCreate}</p>
      <Explainer id="tokens" title="What are tokens here?">
        <p>A token is a credit issued for this workspace or one of its projects: site credits, vouchers, memberships, loyalty points. Whoever holds it keeps it in their wallet like any other token.</p>
        <p>The workspace admin creates the workspace&apos;s own tokens. A project&apos;s owner can create a token for that project. Whoever creates a token owns it and receives the first supply.</p>
        <p>A token <b>can be used to pay here</b> once the workspace admin switches it on for payments. Then requests, listings and escrows in this workspace can be paid in it. Holders can <b>redeem</b> it once the admin allows that.</p>
      </Explainer>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2" aria-hidden>
          {[0, 1].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="h-5 w-1/3 animate-pulse rounded bg-secondary" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-secondary" />
              <div className="mt-6 h-4 w-1/2 animate-pulse rounded bg-secondary" />
            </div>
          ))}
        </div>
      )}
      {!loading && tokens.length === 0 && (
        <Card flush>
          <Empty title="No tokens yet" body="Create one in a few steps: name it, choose the supply, and link it to a project if you like." action={<Button asChild size="sm"><Link href={`${base}/tokens/new`}>Create a token</Link></Button>} />
        </Card>
      )}
      {!loading && tokens.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {tokens.map((a, i) => {
            const [name, symbol, supply, owner, mine, cfg] = (meta.data ?? []).slice(i * 6, i * 6 + 6).map((r) => r.result) as [string?, string?, bigint?, Address?, bigint?, (readonly [boolean, number, bigint])?]
            const created = info.data?.[i]?.result as readonly [bigint, bigint, Address, bigint] | undefined
            const project = created && created[1] > 0n ? created[1] : null
            const fixed = !!owner && /^0x0{40}$/.test(owner)
            const youMint = !!address && owner?.toLowerCase() === address.toLowerCase()
            const usable = !!cfg?.[0]
            return (
              <li key={a} className="relative flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-border-strong sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="t-heading truncate">
                      <Link href={`${base}/tokens/${a}`} className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring">
                        {symbol ?? "…"}
                      </Link>
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{name ?? ""}</p>
                  </div>
                  {cfg && (usable ? <Pill tone="good">Can be used to pay here</Pill> : <Pill>Not for payments yet</Pill>)}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {project ? `Issued for project #${String(project)}` : "The workspace's own token"}{issuer(created?.[2])}.
                </p>
                {cfg && !usable && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Not yet usable for payments in this workspace. {isAdmin ? "You run it, so you can switch payments on from the token's page." : "The workspace admin has not switched it on, and only the admin can."}
                  </p>
                )}
                <dl className="mt-5 grid grid-cols-2 gap-4">
                  {address && (
                    <div>
                      <dt className="text-sm text-muted-foreground">You hold</dt>
                      <dd className="mt-0.5 text-base font-[560]"><Amount value={mine ?? 0n} /></dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-muted-foreground">In existence</dt>
                    <dd className="mt-0.5 text-base font-[560]"><Amount value={supply ?? 0n} /></dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm text-muted-foreground">
                  {fixed ? "Fixed supply: nobody can create more." : youMint ? "You own it and can create more." : owner && t.treasury && owner.toLowerCase() === t.treasury.toLowerCase() ? "The workspace treasury creates more as it sells." : "Its owner can create more."}
                  {!address && " Connect a wallet to see your balance."}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
