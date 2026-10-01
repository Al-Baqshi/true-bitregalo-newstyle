"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { ArrowRight } from "lucide-react"
import { useInstances } from "@/lib/bitregalo/instances"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { Field, PageHead, Section, inputCls } from "@/components/app/ui"

type Item = { title: string; body: string; href: (id: string) => string; time: string }

/* Options that work inside a workspace take the id from the "Working in" picker. */
const START: Item[] = [
  { title: "Create your workspace", body: "Your organisation's own shop, treasury, payments, requests and escrows, with you as admin.", href: () => "/app/launch", time: "About six short steps" },
]
const SELL: Item[] = [
  { title: "Get paid", body: "A link or QR code anyone can open to pay you, or your treasury, in a stablecoin.", href: (id) => `/app/t/${id}/get-paid`, time: "No signing needed" },
  { title: "Sell in the shop", body: "Put vouchers, credits or memberships on sale. Buyers pay into your treasury and redeem with you later.", href: (id) => `/app/t/${id}/sales/new`, time: "Four short steps" },
  { title: "Create a listing", body: "Offer something at a fixed price and delivery time, to anyone or to one buyer you name.", href: (id) => `/app/t/${id}/offers/new`, time: "Three short steps" },
]
const ORGANISE: Item[] = [
  { title: "Post a request", body: "Ask suppliers for a price, choose one, and pay by escrow, straight away, or just record it.", href: (id) => `/app/t/${id}/rfps/new`, time: "Four short steps" },
  { title: "Start a project", body: "Group related requests, listings and tokens under one name.", href: (id) => `/app/t/${id}/projects/new`, time: "Two short steps" },
  { title: "Create a token", body: "A credit, voucher or membership your workspace issues, and can accept as payment.", href: (id) => `/app/create/token?instance=${id}`, time: "Five short steps" },
]

export default function CreateHub() {
  const { address } = useAccount()
  const instances = useInstances()
  const nameOf = useWorkspaceName()
  const [instance, setInstance] = useState("0")
  const optionLabel = (id: bigint, admin: string) => {
    const name = nameOf(id)
    const numbered = id === 0n || name.includes(`#${id}`) ? name : `${name} (#${id})`
    return address && admin.toLowerCase() === address.toLowerCase() ? `${numbered} · yours` : numbered
  }
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <PageHead
        title="What would you like to set up?"
        intro="Each option is a short guided set of steps. You review everything before anything happens, and each step you sign is recorded on BNB Smart Chain."
      />

      <Section title="Start" description="Your organisation's own space. You do not need one to try things out: the public workspace is open to anyone.">
        <OptionList items={START} id={instance} />
      </Section>

      <div className="space-y-10">
        <Field label="Working in" hint="Everything below opens inside this workspace.">
          <select className={`${inputCls} max-w-sm`} value={instance} onChange={(e) => setInstance(e.target.value)}>
            {instances.list.length === 0 && <option value={instance}>{nameOf(BigInt(instance))}</option>}
            {instances.list.map((i) => (
              <option key={String(i.id)} value={String(i.id)}>{optionLabel(i.id, i.admin)}</option>
            ))}
          </select>
        </Field>

        <Section title="Sell and get paid">
          <OptionList items={SELL} id={instance} />
        </Section>

        <Section title="Buy and organise">
          <OptionList items={ORGANISE} id={instance} />
        </Section>
      </div>
    </div>
  )
}

/** One row per option: what it is, one sentence, how long it takes. The whole row is the link. */
function OptionList({ items, id }: { items: Item[]; id: string }) {
  return (
    <ul className="overflow-hidden rounded-xl border border-border bg-card">
      {items.map((it) => (
        <li key={it.title} className="border-b border-border last:border-b-0">
          <Link href={it.href(id)} className="group flex items-center gap-4 px-5 py-4 outline-none transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 sm:px-6">
            <span className="min-w-0 flex-1">
              <span className="block text-base font-[560] leading-snug">{it.title}</span>
              <span className="mt-0.5 block max-w-[62ch] text-sm text-muted-foreground">{it.body}</span>
              <span className="mt-1 block text-sm text-subtle sm:hidden">{it.time}</span>
            </span>
            <span className="hidden shrink-0 text-sm text-muted-foreground sm:block">{it.time}</span>
            <ArrowRight className="size-4 shrink-0 text-subtle transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  )
}
