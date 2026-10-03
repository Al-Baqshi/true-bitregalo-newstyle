"use client"
import { useMemo, useState } from "react"
import { useAccount, useSignMessage } from "wagmi"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  LIMITS, MARKET_KEY, charCount, countryOptions, entryProblem, guessCountry, isCategory, putEntry,
  type Category, type Entry, type EntryKind,
} from "@/lib/bitregalo/market"
import { Label, Note, input } from "@/components/app/wizard/fields"
import { ConnectButton } from "@/components/app/connect-button"
import { Button } from "@/components/ui/button"
import { CategoryPicker } from "./pickers"
import { marketErrorText } from "./words"

/** What a person writes about a request or listing. `category` and `country` are "" until chosen. */
export type Details = { title: string; description: string; category: Category | ""; country: string; city: string }

export const emptyDetails = (over: Partial<Details> = {}): Details => ({ title: "", description: "", category: "", country: "", city: "", ...over })

export function detailsFromEntry(e: Entry): Details {
  return { title: e.title, description: e.description, category: isCategory(e.category) ? e.category : "", country: e.country, city: e.city }
}

/** The details as the index takes them; only call once `detailsProblem` is null. */
export const toInput = (d: Details) => ({ ...d, category: d.category as Category })

/** What would stop these details being published, or null. */
export function detailsProblem(d: Details) {
  return entryProblem({ ...d, category: d.category as Category })
}

export function TitleField({ value, onChange, hint, counter, autoFocus, placeholder = "Scaffolding for 12 weeks" }: { value: string; onChange: (v: string) => void; hint?: React.ReactNode; counter?: string; autoFocus?: boolean; placeholder?: string }) {
  return (
    <Label title="Title" hint={hint} counter={counter ?? `${charCount(value.trim())}/${LIMITS.title}`}>
      <input className={input} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={LIMITS.title * 2} autoFocus={autoFocus} />
    </Label>
  )
}

export function DescriptionField({ value, onChange, title = "Description (optional)", hint, placeholder = "Quantities, standards, dates, how to reach you…" }: { value: string; onChange: (v: string) => void; title?: string; hint?: React.ReactNode; placeholder?: string }) {
  const n = charCount(value.trim())
  return (
    <Label title={title} hint={hint} counter={n > 0 ? `${n}/${LIMITS.description}` : undefined}>
      <textarea className={`${input} h-auto min-h-28 py-2.5`} rows={5} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </Label>
  )
}

/** Country (a list of names) and city, side by side on wider screens. */
export function PlaceFields({
  country,
  city,
  onCountry,
  onCity,
  required,
  countryHint,
}: {
  country: string
  city: string
  onCountry: (v: string) => void
  onCity: (v: string) => void
  required: boolean
  countryHint?: React.ReactNode
}) {
  const options = useMemo(() => countryOptions(), [])
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Label title={required ? "Country" : "Country (optional)"} hint={countryHint}>
        <select className={input} value={country} onChange={(e) => onCountry(e.target.value)} autoComplete="country">
          {required ? <option value="" disabled>Choose a country</option> : <option value="">No country</option>}
          {options.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </Label>
      <Label title="City or area (optional)">
        <input className={input} value={city} onChange={(e) => onCity(e.target.value)} placeholder="Auckland" maxLength={LIMITS.city * 2} autoComplete="address-level2" />
      </Label>
    </div>
  )
}

/** Description, category, country and city: everything after the title. */
export function MoreDetailsFields({ value, set, countryRequired, countryHint, descriptionHint }: { value: Details; set: (patch: Partial<Details>) => void; countryRequired: boolean; countryHint?: React.ReactNode; descriptionHint?: React.ReactNode }) {
  return (
    <>
      <DescriptionField value={value.description} onChange={(description) => set({ description })} hint={descriptionHint} />
      <CategoryPicker mode="field" value={value.category} onChange={(category) => set({ category: category as Category })} />
      <PlaceFields country={value.country} city={value.city} onCountry={(country) => set({ country })} onCity={(city) => set({ city })} required={countryRequired} countryHint={countryHint} />
    </>
  )
}

/**
 * The owner's form on a record page: add or change the title, description, category and place.
 * Saving asks the wallet to sign a message (no transaction, no fee) and stores it in the index.
 */
export function DetailsEditor({
  kind,
  workspace,
  recordId,
  entry,
  initialTitle,
  onDone,
  onCancel,
}: {
  kind: EntryKind
  workspace: bigint
  recordId: bigint
  entry: Entry | null | undefined
  /** For a record with no entry yet: the title it already shows (a public on-chain title). */
  initialTitle?: string
  onDone: () => void
  onCancel: () => void
}) {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const qc = useQueryClient()
  const [d, setD] = useState<Details>(() => (entry ? detailsFromEntry(entry) : emptyDetails({ title: initialTitle ?? "", country: guessCountry() ?? "" })))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (patch: Partial<Details>) => setD((x) => ({ ...x, ...patch }))
  const problem = detailsProblem(d)
  const what = kind === "request" ? "request" : "listing"

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (problem || !address) return
    setBusy(true)
    setError(null)
    const id = toast.loading("Publish the details: sign the message in your wallet…")
    try {
      await putEntry({ workspace, kind, recordId }, toInput(d), address, signMessageAsync)
      toast.success("Details published", { id })
      await qc.invalidateQueries({ queryKey: MARKET_KEY })
      onDone()
    } catch (err) {
      const text = marketErrorText(err)
      setError(text)
      toast.error("The details were not saved", { id, description: text })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="grid gap-5">
      <TitleField value={d.title} onChange={(title) => set({ title })} autoFocus hint={`What people see first in the marketplace, ${LIMITS.titleMin} to ${LIMITS.title} characters.`} />
      <MoreDetailsFields value={d} set={set} countryRequired descriptionHint="The first line shows in lists. Plain text; line breaks are kept." />
      <Note>
        Your wallet signs a message to prove the details come from the {what}&apos;s owner. It is not a transaction and costs nothing. Everything here becomes public in the marketplace; the money and the state of the {what} stay on the blockchain.
      </Note>
      {error && <p className="rounded-lg bg-destructive-fill px-4 py-3 text-sm" role="alert">The details were not saved: {error}. Nothing else changed; you can try again.</p>}
      {problem && charCount(d.title.trim()) > 0 && <p className="text-sm text-muted-foreground" role="status">{problem}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {isConnected ? (
          <Button type="submit" disabled={busy || !!problem}>{busy ? "Waiting for your wallet…" : entry ? "Sign and save changes" : "Sign and publish details"}</Button>
        ) : (
          <ConnectButton />
        )}
        <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
