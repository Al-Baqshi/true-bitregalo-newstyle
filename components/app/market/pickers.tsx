"use client"
import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { CATEGORIES, countryName, countryOptions, guessCountry, type EntryKind } from "@/lib/bitregalo/market"
import { inputCls } from "@/components/app/ui"
import { cn } from "@/lib/utils"

export type CountryCount = { code: string; requests: number; listings: number }

/**
 * The country a list opens on. `guess` true: the visitor's own country, worked out after the
 * page has mounted (undefined until then, so a list does not load twice). false: all countries ("").
 */
export function useStartingCountry(guess: boolean, initial?: string | null) {
  const [country, setCountry] = useState<string | undefined>(initial ?? (guess ? undefined : ""))
  useEffect(() => {
    if (guess && country === undefined) setCountry(guessCountry() ?? "")
  }, [guess, country])
  return [country, setCountry] as const
}

function countFor(c: CountryCount, kind: EntryKind | "") {
  return kind === "request" ? c.requests : kind === "listing" ? c.listings : c.requests + c.listings
}

/**
 * Country filter: "All countries", then the countries that have something (most first, with
 * how many), then every other country by name. Country names only; no codes, no flags.
 */
export function CountryFilter({
  value,
  onChange,
  counts,
  kind = "",
  label = "Country",
  className,
}: {
  value: string
  onChange: (code: string) => void
  counts?: CountryCount[]
  kind?: EntryKind | ""
  label?: string
  className?: string
}) {
  const all = useMemo(() => countryOptions(), [])
  const withSome = (counts ?? []).map((c) => ({ code: c.code, n: countFor(c, kind) })).filter((c) => c.n > 0).sort((a, b) => b.n - a.n)
  const listed = new Set(withSome.map((c) => c.code))
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="t-label mb-1.5 block">{label}</span>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All countries</option>
        {withSome.length > 0 && (
          <optgroup label="With requests or listings">
            {withSome.map((c) => <option key={c.code} value={c.code}>{countryName(c.code)} ({c.n})</option>)}
          </optgroup>
        )}
        <optgroup label={withSome.length > 0 ? "Other countries" : "Countries"}>
          {all.filter((c) => !listed.has(c.code)).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </optgroup>
      </select>
    </label>
  )
}

/** Category filter (with "All categories") or form field (with a "Choose" prompt). */
export function CategoryPicker({
  value,
  onChange,
  mode = "filter",
  label = "Category",
  className,
}: {
  value: string
  onChange: (v: string) => void
  mode?: "filter" | "field"
  label?: string
  className?: string
}) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="t-label mb-1.5 block">{label}</span>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
        {mode === "filter" ? <option value="">All categories</option> : <option value="" disabled>Choose a category</option>}
        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
    </label>
  )
}

/** Requests, listings or both: a small segmented switch. */
export function KindSwitch({ value, onChange, className }: { value: EntryKind | ""; onChange: (v: EntryKind | "") => void; className?: string }) {
  const options: { value: EntryKind | ""; label: string }[] = [
    { value: "", label: "Both" },
    { value: "request", label: "Requests" },
    { value: "listing", label: "Listings" },
  ]
  return (
    <div role="radiogroup" aria-label="Show" className={cn("inline-flex rounded-lg border border-border-strong bg-card p-0.5", className)}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-9 rounded-md px-3.5 text-sm transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring pointer-coarse:h-10",
              on ? "bg-gold-fill font-[600] text-gold" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Text search that tells the page about a change once typing pauses. */
export function SearchField({ value, onChange, placeholder = "Search titles and descriptions", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  useEffect(() => {
    if (text === value) return
    const id = setTimeout(() => onChange(text.trim()), 350)
    return () => clearTimeout(id)
  }, [text, value, onChange])
  return (
    <label className={cn("relative block min-w-0", className)}>
      <span className="sr-only">Search</span>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      <input
        className={cn(inputCls, "pl-10")}
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onChange(text.trim()) }}
        placeholder={placeholder}
        maxLength={200}
        enterKeyHint="search"
      />
    </label>
  )
}
