"use client"
import { useMemo, useState } from "react"
import { useTenant } from "@/lib/bitregalo/tenant"
import { useSettlementTokens } from "@/lib/bitregalo/instances"
import { categoryLabel, countryName, useCountryCounts, useEntries, useMarketAvailable, type Entry, type EntryKind } from "@/lib/bitregalo/market"
import { Button } from "@/components/ui/button"
import { Empty, Notice } from "@/components/app/ui"
import { CategoryPicker, CountryFilter, useStartingCountry, type CountryCount } from "./pickers"
import { useLiveRecords, type LiveRecord, type TokenMeta } from "./live"

export type ListRow = { id: bigint; live: LiveRecord | undefined; entry: Entry | null }

/**
 * A workspace's requests or listings, described by the marketplace index where it has an entry.
 *
 * With no country or category chosen, the list is the chain's (newest 50 records) and the index
 * only adds titles, descriptions and places. With a filter, the list is the index's matching
 * entries (newest first, a page at a time), each read live from the chain.
 */
export function useRecordList(kind: EntryKind, chain: { ids: bigint[]; data: (LiveRecord | undefined)[]; isLoading: boolean }) {
  const t = useTenant()
  const available = useMarketAvailable()
  // A list shows everything at first; narrowing to a country is the job of "Browse by country".
  const [country, setCountry] = useStartingCountry(false)
  const [category, setCategory] = useState("")
  const decided = country !== undefined
  const filtered = available && decided && (country !== "" || category !== "")

  const all = useEntries({ workspace: t.id, kind, limit: 100 }, { enabled: decided && !filtered })
  const matches = useEntries({ workspace: t.id, kind, country: country || undefined, category: category || undefined, limit: 30 }, { enabled: filtered })
  const counts = useCountryCounts({ workspace: t.id })
  const matchList = useMemo(() => matches.data?.pages.flatMap((p) => p.entries) ?? [], [matches.data])
  const live = useLiveRecords(filtered ? matchList : [], () => t.instance)

  const byId = useMemo(() => new Map((all.data?.pages.flatMap((p) => p.entries) ?? []).map((e) => [e.recordId, e])), [all.data])
  const rows: ListRow[] = filtered
    ? matchList.map((e) => ({ id: BigInt(e.recordId), live: live.get(e), entry: e }))
    : chain.ids.flatMap((id, i) => (chain.data[i] ? [{ id, live: chain.data[i], entry: byId.get(Number(id)) ?? null }] : []))

  const tokens = useSettlementTokens(t.instance, t.id)
  const tokenOf = (a: string | undefined): TokenMeta | undefined => {
    const x = a ? tokens.all.find((k) => k.address.toLowerCase() === a.toLowerCase()) : undefined
    return x && x.symbol !== "…" ? { symbol: x.symbol, decimals: x.decimals } : undefined
  }

  return {
    available,
    country: country ?? "",
    setCountry,
    category,
    setCategory,
    filtered,
    rows,
    counts: counts.data?.countries as CountryCount[] | undefined,
    loading: !decided || (filtered ? matches.isLoading : chain.isLoading),
    indexFailed: filtered ? matches.isError : all.isError,
    more: filtered && matches.hasNextPage ? { load: () => matches.fetchNextPage(), busy: matches.isFetchingNextPage } : null,
    retry: () => (filtered ? matches.refetch() : all.refetch()),
    tokenOf,
  }
}

type List = ReturnType<typeof useRecordList>

/** Country and category for a list page. Only shown when the marketplace index is connected. */
export function ListFilters({ list, kind }: { list: List; kind: EntryKind }) {
  if (!list.available) return null
  return (
    <div className="mb-5 grid gap-4 sm:max-w-xl sm:grid-cols-2">
      <CountryFilter value={list.country} onChange={list.setCountry} counts={list.counts} kind={kind} />
      <CategoryPicker value={list.category} onChange={list.setCategory} />
    </div>
  )
}

/** The list's heading: what is shown, and where. */
export function listTitle(list: List, plural: string, total: bigint | undefined) {
  if (!list.filtered) return total !== undefined ? `All ${plural} (${String(total)})` : `All ${plural}`
  const what = list.category ? `${categoryLabel(list.category)}: ${plural}` : plural[0].toUpperCase() + plural.slice(1)
  return list.country ? `${what} in ${countryName(list.country)}` : what
}

/** Nothing matches the filters: say so, say what else exists, and offer the way back. */
export function FilteredEmpty({ list, plural, total, where }: { list: List; plural: string; total: bigint | undefined; where: string }) {
  const place = list.country ? ` in ${countryName(list.country)}` : ""
  const kindWord = list.category ? `${categoryLabel(list.category).toLowerCase()} ${plural}` : plural
  const n = Number(total ?? 0n)
  return (
    <Empty
      title={`No ${kindWord}${place} yet`}
      body={
        n > 0
          ? `${where} has ${n} ${n === 1 ? plural.replace(/s$/, "") : plural} in all. Those posted without a country, or elsewhere, show under All countries.`
          : `Nothing has been posted ${where === "The BitRegalo network" ? "on the network" : "in this workspace"} yet.`
      }
      action={<Button size="sm" variant="secondary" onClick={() => { list.setCountry(""); list.setCategory("") }}>Show all countries</Button>}
    />
  )
}

/** The index did not answer: the list still works from the chain, without the descriptions. */
export function IndexTrouble({ list }: { list: List }) {
  if (!list.indexFailed) return null
  return (
    <div className="mb-5">
      <Notice tone={list.filtered ? "bad" : "muted"} title="The marketplace index did not answer" action={<Button size="sm" variant="outline" onClick={() => list.retry()}>Try again</Button>}>
        <p>{list.filtered ? "Filtering by country and category needs it. Show all countries to see every record straight from the blockchain." : "Titles, descriptions and places may be missing. The records themselves come straight from the blockchain."}</p>
      </Notice>
    </div>
  )
}

/** "Load more" under a filtered list. */
export function LoadMore({ list }: { list: List }) {
  if (!list.more) return null
  return (
    <div className="mt-5 flex justify-center">
      <Button variant="secondary" disabled={list.more.busy} onClick={list.more.load}>{list.more.busy ? "Loading…" : "Load more"}</Button>
    </div>
  )
}
