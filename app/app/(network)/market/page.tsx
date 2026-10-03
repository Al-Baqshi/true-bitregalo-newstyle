"use client"
import { Suspense, useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useInstances, useSettlementTokens } from "@/lib/bitregalo/instances"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { categoryLabel, countryName, isCategory, useCountryCounts, useEntries, useMarketAvailable, type EntryKind } from "@/lib/bitregalo/market"
import { Card, Empty, Notice, PageHead, RowsSkeleton } from "@/components/app/ui"
import { Label, input } from "@/components/app/wizard/fields"
import { CategoryPicker, CountryFilter, KindSwitch, SearchField, useStartingCountry } from "@/components/app/market/pickers"
import { RecordRow } from "@/components/app/market/record-row"
import { stillOpen, useLiveRecords, useTokenMeta, type TokenMeta } from "@/components/app/market/live"
import { Button } from "@/components/ui/button"

type Scope = "network" | "all"

/**
 * The marketplace of the BitRegalo network, by country. The index says what each request and
 * listing is about and where; the chain says what it costs and whether it is still open.
 * Filters live in the address (?country=NZ&show=listings&category=…&q=…&where=all) so a view can be shared.
 */
function Market() {
  const t = useTenant()
  const available = useMarketAvailable()
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const fromUrl = sp.get("country")
  const [country, setCountryState] = useStartingCountry(true, fromUrl === null ? undefined : fromUrl === "all" ? "" : fromUrl.toUpperCase())
  const [kind, setKindState] = useState<EntryKind | "">(sp.get("show") === "requests" ? "request" : sp.get("show") === "listings" ? "listing" : "")
  const [category, setCategoryState] = useState(() => (isCategory(sp.get("category") ?? "") ? sp.get("category")! : ""))
  const [q, setQState] = useState(sp.get("q") ?? "")
  const [scope, setScopeState] = useState<Scope>(sp.get("where") === "all" ? "all" : "network")
  const [showClosed, setShowClosed] = useState(false)

  /** Writes one filter into the address without a new history entry (other parameters are kept). */
  const remember = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(window.location.search)
    if (value) p.set(key, value)
    else p.delete(key)
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname])
  const setCountry = (v: string) => { setCountryState(v); remember("country", v || "all") }
  const setKind = (v: EntryKind | "") => { setKindState(v); remember("show", v ? `${v}s` : "") }
  const setCategory = (v: string) => { setCategoryState(v); remember("category", v) }
  const setQ = useCallback((v: string) => { setQState(v); remember("q", v) }, [remember])
  const setScope = (v: Scope) => { setScopeState(v); remember("where", v === "all" ? "all" : "") }

  const workspace = scope === "network" ? t.id : undefined
  const ready = country !== undefined
  const entries = useEntries(
    { workspace, kind: kind || undefined, country: country || undefined, category: category || undefined, q: q || undefined, limit: 20 },
    { enabled: ready },
  )
  const counts = useCountryCounts({ workspace })
  const list = useMemo(() => entries.data?.pages.flatMap((p) => p.entries) ?? [], [entries.data])

  // Live state from each record's own workspace contract.
  const instances = useInstances()
  const instanceOf = (ws: bigint) => (ws === t.id ? t.instance : instances.list.find((w) => w.id === ws)?.instance)
  const live = useLiveRecords(list, instanceOf)
  const tokens = useSettlementTokens(t.instance, t.id)
  const meta = useTokenMeta(list.filter((e) => !/^0x0{40}$/.test(e.token)).map((e) => e.token))
  const tokenOf = (a: string): TokenMeta | undefined => {
    const x = tokens.all.find((k) => k.address.toLowerCase() === a.toLowerCase() && k.symbol !== "…")
    return x ? { symbol: x.symbol, decimals: x.decimals } : meta(a)
  }
  const nameOf = useWorkspaceName()

  const now = Date.now() / 1000
  const shown = showClosed ? list : list.filter((e) => stillOpen(e.kind, live.get(e), now))
  const hidden = list.length - shown.length
  const what = kind === "request" ? "requests" : kind === "listing" ? "listings" : "requests or listings"
  const place = country ? ` in ${countryName(country)}` : ""
  const others = (counts.data?.countries ?? [])
    .map((c) => ({ code: c.code, n: kind === "request" ? c.requests : kind === "listing" ? c.listings : c.requests + c.listings }))
    .filter((c) => c.n > 0 && c.code !== country)
    .slice(0, 3)

  return (
    <div className="space-y-8">
      <PageHead
        title="Browse by country"
        intro="What people on the BitRegalo network ask for and offer, country by country. Prices and status come live from the blockchain; titles and places are signed by the people who posted them."
        action={
          <>
            <Button asChild><Link href={`${t.base}/requests/new`}>Ask for something</Link></Button>
            <Button asChild variant="secondary"><Link href={`${t.base}/listings/new`}>Offer something</Link></Button>
          </>
        }
      />

      {!available ? (
        <Notice
          title="The marketplace index is not connected"
          action={
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline"><Link href={`${t.base}/requests`}>All requests</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href={`${t.base}/listings`}>All listings</Link></Button>
            </div>
          }
        >
          <p>Browsing by country needs the marketplace index, which keeps the titles, descriptions and places that people sign. It is not available here right now. Every request and listing is still on the blockchain, and the lists show them by number and status.</p>
        </Notice>
      ) : (
        <>
          <section aria-label="Filters" className="grid gap-4">
            <SearchField value={q} onChange={setQ} />
            <div className="grid gap-4 sm:grid-cols-3">
              <CountryFilter value={country ?? ""} onChange={setCountry} counts={counts.data?.countries} kind={kind} />
              <CategoryPicker value={category} onChange={setCategory} />
              <Label title="Where">
                <select className={input} value={scope} onChange={(e) => setScope(e.target.value as Scope)}>
                  <option value="network">BitRegalo network</option>
                  <option value="all">Network and organisations</option>
                </select>
              </Label>
            </div>
            <KindSwitch value={kind} onChange={setKind} className="justify-self-start" />
          </section>

          {entries.isError ? (
            <Notice tone="bad" title="The marketplace index did not answer" action={<Button size="sm" variant="outline" onClick={() => entries.refetch()}>Try again</Button>}>
              <p>The requests and listings themselves are safe on the blockchain. Try again in a moment, or see them in the lists without their descriptions.</p>
            </Notice>
          ) : (
            <div>
              <Card flush title={country ? `In ${countryName(country)}` : "All countries"} description={scope === "all" ? "Newest first, from the network and organisation workspaces." : "Newest first."}>
                {(!ready || entries.isLoading) && <RowsSkeleton rows={4} />}
                {ready && !entries.isLoading && list.length === 0 && (
                  <Empty
                    title={q ? `Nothing matches “${q}”${place}` : `No ${category ? `${categoryLabel(category).toLowerCase()} ` : ""}${what}${place} yet`}
                    body={
                      q || category
                        ? "Try other words, another category, or every country."
                        : others.length > 0
                          ? `Be the first here, or look where people are already active: ${others.map((o) => `${countryName(o.code)} (${o.n})`).join(", ")}.`
                          : "Requests and listings appear here once their details are published. Ask for something or offer something to be the first."
                    }
                    action={
                      country || q || category ? (
                        <div className="flex flex-wrap justify-center gap-2">
                          {others.slice(0, 2).map((o) => <Button key={o.code} size="sm" variant="secondary" onClick={() => setCountry(o.code)}>{countryName(o.code)}</Button>)}
                          <Button size="sm" variant="secondary" onClick={() => { setCountry(""); setCategory(""); setQ("") }}>Every country</Button>
                        </div>
                      ) : (
                        <Button asChild size="sm"><Link href={`${t.base}/requests/new`}>Ask for something</Link></Button>
                      )
                    }
                  />
                )}
                {list.length > 0 && shown.length === 0 && (
                  <Empty
                    title="Nothing still open here"
                    body={`${hidden} ${hidden === 1 ? "is" : "are"} closed, taken, withdrawn or meant for one named buyer.`}
                    action={<Button size="sm" variant="secondary" onClick={() => setShowClosed(true)}>Show {hidden === 1 ? "it" : "them"}</Button>}
                  />
                )}
                {shown.map((e) => {
                  const own = BigInt(e.workspace) === t.id
                  const base = own ? t.base : `/app/t/${e.workspace}`
                  return (
                    <RecordRow
                      key={`${e.workspace}:${e.kind}:${e.recordId}`}
                      kind={e.kind}
                      id={e.recordId}
                      href={`${base}/${e.kind === "request" ? "requests" : "listings"}/${e.recordId}`}
                      entry={e}
                      live={live.get(e)}
                      token={tokenOf(e.token)}
                      workspaceName={own ? undefined : nameOf(BigInt(e.workspace))}
                      who={false}
                      mixed
                    />
                  )
                })}
                {shown.length > 0 && (hidden > 0 || showClosed) && (
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border px-5 py-3 text-sm text-muted-foreground sm:px-6">
                    <span>{showClosed ? "Showing closed ones too." : `${hidden} more ${hidden === 1 ? "is" : "are"} closed, taken or meant for one named buyer.`}</span>
                    <Button size="sm" variant="ghost" onClick={() => setShowClosed(!showClosed)}>{showClosed ? "Hide them" : "Show them"}</Button>
                  </div>
                )}
              </Card>
              {entries.hasNextPage && (
                <div className="mt-5 flex justify-center">
                  <Button variant="secondary" disabled={entries.isFetchingNextPage} onClick={() => entries.fetchNextPage()}>
                    {entries.isFetchingNextPage ? "Loading…" : "Load more"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function MarketPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground" role="status">Loading…</p>}>
      <Market />
    </Suspense>
  )
}
