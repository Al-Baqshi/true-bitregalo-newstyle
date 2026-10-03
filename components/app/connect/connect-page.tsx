"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { abis, addresses, chain, EXPLORER, explorerAddress, RPC_URL } from "@/lib/bitregalo/config"
import { useSettlementTokens } from "@/lib/bitregalo/instances"
import { useInstanceRules } from "@/lib/bitregalo/instance-rules"
import { MARKET_API, useMarketAvailable } from "@/lib/bitregalo/market"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Addr, Amount, Card, Empty, Notice, PageHead, RowsSkeleton, Section } from "@/components/app/ui"
import { Button } from "@/components/ui/button"
import { CodeBlock, CopyButton, DownloadRow, ExplorerLink, Params, ValueRow, saveFile } from "./parts"
import {
  ABI_FILE, abiModule, marketSample, paySample, postSample, readSample, releaseSample, setupSample, takeSample,
  type SampleContext,
} from "./samples"

/**
 * How an organisation uses its workspace from its own platform. A workspace is a set of
 * public contracts, so any site, app or back office can read its records and let its users
 * sign the same actions this app offers. This page gives the addresses, the ABIs, working
 * code with the addresses filled in, the links that need no code, and the marketplace API.
 */
export function ConnectPlatform() {
  const t = useTenant()
  const { address: me } = useAccount()
  const tokens = useSettlementTokens(t.instance, t.id)
  const rules = useInstanceRules(t.instance)
  const marketOn = useMarketAvailable()
  const v1 = t.version >= 1n
  const id = String(t.id)

  // Browser-only facts, read after mount so the server render matches the first client render.
  const [env, setEnv] = useState({ origin: "", api: "" })
  useEffect(() => setEnv({ origin: window.location.origin, api: MARKET_API }), [])
  const pages = `${env.origin}${t.base}`

  const loadingTokens = tokens.all.some((x) => x.symbol === "…")
  const token = tokens.accepted[0]
  const ctx: SampleContext = {
    label: t.isPublic ? `The BitRegalo network (workspace ${id})` : `Workspace ${id}`,
    records: t.instance,
    vault: t.vault,
    version: Number(t.version),
    rpcUrl: RPC_URL,
    token: token ? { symbol: token.symbol, address: token.address, decimals: token.decimals } : undefined,
    pages,
  }
  const code = { setup: setupSample(ctx), read: readSample(ctx), post: postSample(ctx), take: takeSample(ctx), release: releaseSample(ctx), pay: paySample(ctx) }

  const here = t.isPublic ? "the network" : "this workspace"
  const tokenAddr = token?.address ?? "0x…"
  const wallet = me ?? "0x…"
  const feeText = rules.loaded ? `${rules.feeBps / 100}%` : null

  const files = [
    { title: "Records contract", body: "Requests, offers, listings, payments and the shop. The contracts call it the instance.", file: "bitregalo-records.abi.json", abi: abis.instance },
    { title: "Vault", body: "Holds payments in escrow and settles direct payments: release, hand back, return.", file: "bitregalo-vault.abi.json", abi: abis.vault },
    { title: "Workspace treasury", body: "Holds the workspace's own tokens, such as shop stock. Only the admin can move them out. Version 1 and later.", file: "bitregalo-workspace-treasury.abi.json", abi: abis.workspaceTreasury },
    { title: "ERC-20 token", body: "Balances and approvals for any token, USDT included.", file: "erc20.abi.json", abi: abis.erc20 },
    { title: "Token factory", body: "Creates a workspace's own tokens: vouchers, credits, memberships.", file: "bitregalo-token-factory.abi.json", abi: abis.tokenFactory },
  ]

  return (
    <div className="space-y-14">
      <PageHead
        title="Connect a platform"
        intro={t.isPublic
          ? "Use the BitRegalo network from your own website, app or back office. Everything on this page is public: there is nothing to apply for."
          : "Use this workspace from your own website, app or back office. Everything on this page is public: there is nothing to apply for."}
      />

      <nav aria-label="On this page" className="-mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {[
          ["contracts", "Contracts"], ["abis", "ABIs"], ["code", "Code examples"],
          ["links", "Links"], ["market-api", "Marketplace API"], ["next", "Coming next"],
        ].map(([href, label]) => (
          <a key={href} href={`#${href}`} className="inline-flex min-h-9 items-center text-muted-foreground underline decoration-border-strong decoration-1 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground pointer-coarse:min-h-11">
            {label}
          </a>
        ))}
      </nav>

      <Section title="What you can connect">
        <p className="max-w-[66ch] text-base">
          {t.isPublic
            ? "The BitRegalo network is BitRegalo's own public workspace: a set of public contracts on BNB Smart Chain. "
            : "Your workspace is a set of public contracts on BNB Smart Chain. "}
          Your own site or app can read its records (requests, listings, escrows{v1 ? " and payments" : ""}) and let your users sign the same actions this app offers, from their own wallets. You need no permission from BitRegalo to do this. Payments and escrows still go through {t.isPublic ? "the network's" : "the workspace's"} rules and fees, whichever site they start from.
        </p>
        {t.isPublic && (
          <p className="mt-3 max-w-[66ch] text-sm text-muted-foreground">
            An organisation that wants its own rules, fees and tokens runs its own workspace, and each workspace has this page with its own addresses.{" "}
            <Link href="/app/workspaces" className="text-gold underline decoration-1 underline-offset-4 hover:decoration-2">See the workspaces</Link>.
          </p>
        )}
      </Section>

      <Anchor id="contracts">
        <Section
          title={t.isPublic ? "The network's contracts" : "Your workspace's contracts"}
          description="Everything your code needs to find it. This is a practice network: tokens here have no value."
        >
          <div className="space-y-6">
            <Card flush title="Network">
              <dl>
                <ValueRow label="Network" value={chain.name} mono={false} copy="" />
                <ValueRow label="Chain id" value={String(chain.id)} />
                <ValueRow label="RPC URL" value={RPC_URL} hint="A public endpoint. For steady traffic, use your own RPC provider for BNB Smart Chain Testnet." />
                <ValueRow label="Explorer" mono={false} copy={EXPLORER}>
                  <a href={EXPLORER} target="_blank" rel="noreferrer" className="text-gold underline decoration-1 underline-offset-4 hover:decoration-2">{EXPLORER.replace(/^https:\/\//, "")}</a>
                </ValueRow>
              </dl>
            </Card>

            <Card flush title="Contracts">
              <dl>
                <ValueRow label="Workspace id" value={id} hint={t.isPublic ? "The BitRegalo network's number in the workspace registry." : "This workspace's number in the workspace registry."} />
                <ValueRow label="Records contract" value={t.instance} explorer={explorerAddress(t.instance)} hint="Requests, offers and listings, plus payments and the shop from version 1." />
                <ValueRow label="Vault" value={t.vault} explorer={explorerAddress(t.vault)} hint="Holds payments in escrow. Token approvals go to this address." />
                {v1 && (
                  t.treasury
                    ? <ValueRow label="Treasury" value={t.treasury} explorer={explorerAddress(t.treasury)} hint="Owned by the workspace admin." />
                    : <ValueRow label="Treasury" value="…" copy="" />
                )}
                <ValueRow label="Contract version" value={String(t.version)} mono={false} copy="" hint={v1 ? "Requests, listings, escrows, payments, the shop and the treasury." : "Requests, listings and escrows. Payments, the shop and the treasury need version 1."} />
              </dl>
              <p className="border-t border-border px-5 py-3.5 text-sm text-muted-foreground sm:px-6">
                Shared by every workspace: the workspace registry <Addr a={addresses.mother} />, where <code className="t-mono">tenants(id)</code> gives any workspace&apos;s contracts, and the token factory <Addr a={addresses.tokenFactory} />.
              </p>
            </Card>

            <Card
              flush
              title="Accepted tokens"
              description={`What payments ${t.isPublic ? "on the network" : "here"} can be made in.${feeText ? ` The platform fee of ${feeText} comes out of what the supplier receives.` : ""}`}
            >
              {loadingTokens ? (
                <RowsSkeleton rows={1} />
              ) : tokens.accepted.length === 0 ? (
                <Empty title="No accepted tokens yet" body="The admin adds them in Settings. Until then, requests and listings can only be recorded, with no payment." />
              ) : (
                tokens.accepted.map((x) => (
                  <div key={x.address} className="border-b border-border px-5 py-3 last:border-b-0 sm:px-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 pt-1">
                      <p className="text-base font-[560]">{x.symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="t-num">{x.decimals}</span> decimals · {x.serviceFee > 0n ? <>service fee <Amount value={x.serviceFee} decimals={x.decimals} symbol={x.symbol} /> per payment, paid by the buyer</> : "no service fee"}
                      </p>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="t-mono min-w-0 flex-1 break-all py-1.5 text-base text-muted-foreground sm:py-2">{x.address}</span>
                      <CopyButton text={x.address} label={`${x.symbol} address`} />
                      <ExplorerLink href={explorerAddress(x.address)} label={x.symbol} />
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>
        </Section>
      </Anchor>

      <Anchor id="abis">
        <Section
          title="Contract definitions (ABIs)"
          description="An ABI lists a contract's functions and events so your code can call them. The JSON files work with any library; the TypeScript file has all five, typed for viem."
        >
          <Card flush>
            <DownloadRow
              primary
              title="All five, for TypeScript"
              body="The file the code examples below import from."
              file={ABI_FILE}
              onDownload={() => saveFile(ABI_FILE, abiModule(abis as unknown as Record<string, unknown>), "text/plain;charset=utf-8")}
            />
            {files.map((f) => (
              <DownloadRow key={f.file} title={f.title} body={f.body} file={f.file} onDownload={() => saveFile(f.file, JSON.stringify(f.abi, null, 2) + "\n", "application/json")} />
            ))}
          </Card>
          {!v1 && (
            <p className="mt-4 max-w-[66ch] text-sm text-muted-foreground">
              {t.isPublic ? "The network" : "This workspace"} runs contract version 0. Its records contract has the request, listing and escrow functions in this file, but not <code className="t-mono">pay</code>, the shop or the treasury: calling those fails.
            </p>
          )}
        </Section>
      </Anchor>

      <Anchor id="code">
        <Section
          title="Code examples"
          description={`TypeScript with viem, with ${here}'s addresses filled in. Start with the setup file; each example imports from it and from ${ABI_FILE}.`}
        >
          <div className="space-y-12">
            <Example title="Set up" body={<>Reading needs only the public client and costs nothing. Every action is a transaction your user signs in their own wallet; your platform never holds their tokens.</>}>
              <CodeBlock name="bitregalo.ts" code={code.setup} />
            </Example>

            <Example title="Read requests" body={<>The number of requests, then one request with its state, how it settles and who posted it. No wallet needed.</>}>
              <CodeBlock name="read-requests.ts" code={code.read} />
            </Example>

            <Example
              title="Post a request"
              body={
                <>
                  On chain, a request&apos;s title is 32 bytes. Text of up to 31 bytes is stored as it is, so anyone can read it; longer or private wording is stored only as its keccak256 fingerprint. <code className="t-mono">encodeLabel</code> in the setup file follows the same rule as this app. The full title, a description and a country go to the marketplace index instead, signed by the poster (see below). Offers must stay open for at least 10 minutes.
                </>
              }
            >
              <CodeBlock name="post-a-request.ts" code={code.post} />
            </Example>

            <Example
              title="Take a listing and fund the escrow"
              body={<>The buyer allows the vault to take the price plus the service fee, then takes the listing. With escrow, the payment is held by the vault until the buyer releases it; with direct payment, the supplier is paid at once.</>}
            >
              <CodeBlock name="take-a-listing.ts" code={code.take} />
            </Example>

            <Example
              title="Release an escrow"
              body={<>Only the buyer can release, and only before the deadline. Nobody else, BitRegalo and the admin included, can send held tokens anywhere but to the supplier or back to the buyer.</>}
            >
              <CodeBlock name="release-an-escrow.ts" code={code.release} />
            </Example>

            <Example title="Pay someone" body={<>A direct payment with a reference and a receipt, in one transaction after the approval.</>}>
              {v1 ? (
                <CodeBlock name="pay-someone.ts" code={code.pay} />
              ) : (
                <Notice title="Needs contract version 1">
                  <p>{t.isPublic ? "The network runs" : "This workspace runs"} version 0, which has no <code className="t-mono">pay</code> function for paying a wallet outside a request or listing. The example appears here for workspaces on version 1 or later.</p>
                </Notice>
              )}
            </Example>
          </div>
        </Section>
      </Anchor>

      <Anchor id="links">
        <Section
          title="Links you can send without writing code"
          description="Each link opens the right screen in this app with the details filled in. Whoever opens it signs with their own wallet."
        >
          <div className="space-y-12">
            <Example
              title="Payment link"
              body={<>Asks someone to pay a wallet. Amounts are in whole tokens, such as 25 or 12.5.</>}
              action={v1 ? <Button asChild size="sm" variant="secondary"><Link href={`${t.base}/get-paid`}>Make one in Get paid</Link></Button> : undefined}
            >
              {v1 ? (
                <div className="space-y-5">
                  <CodeBlock wrap name="Payment link" code={`${pages}/pay?to=${wallet}&token=${tokenAddr}&amount=25&ref=Invoice%201042&fixed=1`} />
                  <Params
                    items={[
                      { name: "to", body: "The wallet that gets paid. The payer cannot change it." },
                      { name: "token", body: `The token's address. It must be one ${here} accepts.` },
                      { name: "amount", body: "How much, in whole tokens. Leave it out to let the payer choose." },
                      { name: "fixed=1", body: "Locks the amount, so the payer only confirms." },
                      { name: "ref", body: "A reference shown on the receipt, such as an invoice number. Up to 31 bytes stay readable on chain." },
                      { name: "project", body: `Optional: the number of a project in ${here}.` },
                    ]}
                  />
                </div>
              ) : (
                <Notice title="Needs contract version 1">
                  <p>Payment links use the <code className="t-mono">pay</code> function, which {t.isPublic ? "the network's" : "this workspace's"} contracts (version 0) do not have.</p>
                </Notice>
              )}
            </Example>

            <Example
              title="Hold a payment for someone"
              body={<>A buyer sends this link to a supplier. The supplier opens it and signs once, which lists the job for that buyer only, paid by escrow. The buyer then funds it from the listing page.</>}
              action={<Button asChild size="sm" variant="secondary"><Link href={`${t.base}/escrows/new`}>Make one</Link></Button>}
            >
              <div className="space-y-5">
                <CodeBlock wrap name="Job link" code={`${pages}/listings/new?for=${wallet}&supplier=0x…&token=${tokenAddr}&amount=250&days=7&escrow=1&title=Paint%20the%20fence&country=NZ`} />
                <Params
                  items={[
                    { name: "for", body: "The buyer's wallet. Only this wallet can take and fund the listing." },
                    { name: "supplier", body: "Optional: the wallet the link is meant for. Other wallets cannot accept it." },
                    { name: "token", body: `The token's address, one ${here} accepts.` },
                    { name: "amount", body: "The price, in whole tokens." },
                    { name: "days", body: "Time to deliver. It is also how long the payment can be held: after that it can only return to the buyer." },
                    { name: "escrow=1", body: "Tells the supplier the job is paid by escrow." },
                    { name: "title", body: "What the job is, 3 to 120 characters." },
                    { name: "country", body: "Optional: a two-letter country code such as NZ, where the work happens." },
                  ]}
                />
              </div>
            </Example>

            <Example title="Record pages" body={<>Every request, listing, escrow{v1 ? " and payment" : ""} has a public page anyone can open, numbered from 1.</>}>
              <CodeBlock
                wrap
              name="Record pages"
                code={[`${pages}/requests/{id}`, `${pages}/listings/{id}`, `${pages}/escrows/{id}`, ...(v1 ? [`${pages}/payments/{id}`] : [])].join("\n")}
              />
            </Example>
          </div>
        </Section>
      </Anchor>

      <Anchor id="market-api">
        <Section
          title="Marketplace API"
          description="The titles, descriptions, categories and countries of public requests and listings. Read-only and public: no key needed."
        >
          {!marketOn ? (
            <Notice title="The marketplace index is not connected here">
              <p>This version of the app has no marketplace index configured, so there is no address to show. The on-chain records above can always be read.</p>
            </Notice>
          ) : (
            <div className="space-y-6">
              <Card flush>
                <dl>
                  <ValueRow label="Base URL" value={env.api || "…"} copy={env.api} />
                </dl>
                <ul className="border-t border-border">
                  {[
                    { path: `GET /v1/entries?chainId=97&workspace=${id}`, body: <>Requests and listings, newest first. Narrow it with <Q>kind</Q> (request or listing), <Q>country</Q> (such as NZ), <Q>category</Q>, <Q>q</Q> (words to search for), <Q>poster</Q> (a wallet), <Q>limit</Q> (1 to 100) and <Q>cursor</Q> (the <Q>next</Q> value of the previous page).</> },
                    { path: `GET /v1/entries/97/${id}/{kind}/{number}`, body: <>One request or listing: <Q>kind</Q> is request or listing, <Q>number</Q> its number on chain.</> },
                    { path: `GET /v1/countries?chainId=97&workspace=${id}`, body: <>How many requests and listings each country has.</> },
                    { path: "GET /healthz", body: <>Whether the index is up.</> },
                  ].map((e) => (
                    <li key={e.path} className="border-b border-border px-5 py-3 last:border-b-0 sm:px-6">
                      <p className="t-mono break-all text-base">{e.path}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{e.body}</p>
                    </li>
                  ))}
                </ul>
              </Card>
              <CodeBlock name="Example request" code={marketSample(env.api || "https://…", id)} />
              <p className="max-w-[66ch] text-sm text-muted-foreground">
                Writing the details of a request or listing (<Q>PUT</Q> on the same address as one entry) needs a signature from the wallet that owns it on chain, so only its poster can describe it. Call the API from your server; a browser on another website is turned away unless BitRegalo adds that website to the index&apos;s allowed list.
              </p>
            </div>
          )}
        </Section>
      </Anchor>

      <Anchor id="next">
        <Section title="Coming next" description="Planned, not available yet.">
          <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {[
              { name: "API keys", body: "Keys for your servers, for access beyond the public reads." },
              { name: "Webhooks", body: "Your server is told when a request, an escrow or a payment happens in your workspace." },
              { name: "An SDK package", body: "These examples as a ready-made TypeScript library." },
              { name: "Hosted checkout", body: "Send your customers to a BitRegalo payment page that brings them back to your site." },
              { name: "Identity checks (KYC)", body: "For workspaces that need to know who their users are." },
            ].map((x) => (
              <div key={x.name}>
                <dt className="t-subheading">{x.name}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{x.body}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </Anchor>
    </div>
  )
}

/** One worked example: a title, a sentence or two, then the code or link. */
function Example({ title, body, action, children }: { title: string; body: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className="min-w-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 max-w-[66ch]">
          <h3 className="t-subheading">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
        {action}
      </div>
      {children}
    </article>
  )
}

/** A part of the page the links at the top jump to, clear of the sticky top bar. */
function Anchor({ id, children }: { id: string; children: React.ReactNode }) {
  return <div id={id} className="scroll-mt-32">{children}</div>
}

/** A parameter or keyword inside a sentence. */
function Q({ children }: { children: React.ReactNode }) {
  return <code className="t-mono text-foreground">{children}</code>
}
