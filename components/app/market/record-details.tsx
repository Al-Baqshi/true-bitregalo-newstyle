"use client"
import type { Hex } from "viem"
import { useTenant } from "@/lib/bitregalo/tenant"
import { decodeLabel, encodeLabel } from "@/lib/bitregalo/instances"
import { useMarketAvailable, type Entry, type EntryKind } from "@/lib/bitregalo/market"
import { Card, Notice, Section } from "@/components/app/ui"
import { Button } from "@/components/ui/button"
import { DetailsEditor } from "./details-form"

/** The description as its owner wrote it, line breaks kept. */
export function EntryDescription({ entry }: { entry: Entry | null | undefined }) {
  if (!entry?.description) return null
  return <p className="-mt-2 max-w-[68ch] whitespace-pre-line break-words text-base">{entry.description}</p>
}

/**
 * How the marketplace title relates to what the request itself recorded on the blockchain:
 * the same short title, a fingerprint that matches, or a different short title.
 */
export function titleProof(entry: Entry | null | undefined, scopeHash: Hex | undefined) {
  if (!entry || !scopeHash) return null
  const label = decodeLabel(scopeHash)
  if (label !== null) return label === entry.title ? "The title is also recorded on the blockchain." : `Title recorded on the blockchain: “${label}”.`
  if (encodeLabel(entry.title) === scopeHash) return "The title matches the fingerprint recorded on the blockchain."
  return null
}

/** "Edit details" for the owner of a record that already has some. */
export function EditDetailsButton({ isOwner, entry, editing, onEdit }: { isOwner: boolean; entry: Entry | null | undefined; editing: boolean; onEdit: () => void }) {
  const available = useMarketAvailable()
  if (!isOwner || !available || !entry || editing) return null
  return <Button variant="secondary" onClick={onEdit}>Edit details</Button>
}

/**
 * What the owner of a request or listing sees about its marketplace details: an invitation to
 * add them, the form, or (when the index is not connected) why they cannot be added now.
 */
export function OwnerDetails({
  kind,
  recordId,
  entry,
  isOwner,
  editing,
  setEditing,
  initialTitle,
  wordingHidden,
}: {
  kind: EntryKind
  recordId: bigint
  entry: Entry | null | undefined
  isOwner: boolean
  editing: boolean
  setEditing: (v: boolean) => void
  initialTitle?: string
  /** A request whose wording is only a fingerprint on the blockchain. */
  wordingHidden?: boolean
}) {
  const t = useTenant()
  const available = useMarketAvailable()
  const what = kind === "request" ? "request" : "listing"
  if (!isOwner) return null
  if (!available) {
    if (entry !== undefined && entry !== null) return null
    return (
      <Notice title="Details cannot be added right now">
        <p>The marketplace index is not connected here, so a title, description and country cannot be published for this {what} yet. Everything on the blockchain works as usual.</p>
      </Notice>
    )
  }
  if (editing) {
    return (
      <Section title={entry ? "Edit the details" : "Add details"} description={`This is your ${what}. What you write here is public and signed by your wallet.`}>
        <Card>
          <DetailsEditor kind={kind} workspace={t.id} recordId={recordId} entry={entry} initialTitle={initialTitle} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
        </Card>
      </Section>
    )
  }
  if (entry === null) {
    return (
      <Notice tone="accent" title={`Add details so people can find your ${what}`} action={<Button onClick={() => setEditing(true)}>Add details</Button>}>
        <p>
          {wordingHidden ? "Its wording is not readable on the blockchain. " : ""}
          A title, a description, a category and a country put it in the marketplace by country{wordingHidden ? "; they become public" : ""}. Your wallet signs a message. There is no fee.
        </p>
      </Notice>
    )
  }
  return null
}
