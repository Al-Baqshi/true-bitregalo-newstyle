"use client"
import { useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { ArrowRight, Building2, Coins, FolderKanban, FileSearch, PackageCheck } from "lucide-react"
import { instanceName, useInstances } from "@/lib/bitregalo/instances"

type Item = { title: string; body: string; href: (id: string) => string; icon: React.ReactNode; needsInstance: boolean; time: string }

const ITEMS: Item[] = [
  { title: "Launch your instance", body: "Your company's own requests, offers, escrows and tokens, with you as admin. Optionally start a project, a token and a first request in the same flow.", href: () => "/app/launch", icon: <Building2 className="size-5" />, needsInstance: false, time: "5 steps" },
  { title: "Create a token", body: "A named ERC-20 for credits, vouchers or memberships, linked to an instance and a project, and accepted as payment if you are the admin.", href: (id) => `/app/create/token?instance=${id}`, icon: <Coins className="size-5" />, needsInstance: false, time: "4 steps" },
  { title: "Start a project", body: "Group requests, offers, escrows and tokens under one name — a site, a programme, a product line.", href: (id) => `/app/t/${id}/projects/new`, icon: <FolderKanban className="size-5" />, needsInstance: true, time: "1 step" },
  { title: "Post a request", body: "Ask for proposals. Suppliers bid their price and time; you award one and pay by escrow, directly, or just record it.", href: (id) => `/app/t/${id}/rfps/new`, icon: <FileSearch className="size-5" />, needsInstance: true, time: "3 steps" },
  { title: "List an offer", body: "Offer to supply at a price and delivery time — to anyone, or as a direct ask to one buyer.", href: (id) => `/app/t/${id}/offers/new`, icon: <PackageCheck className="size-5" />, needsInstance: true, time: "2 steps" },
]

export default function CreateHub() {
  const { address } = useAccount()
  const instances = useInstances()
  const [instance, setInstance] = useState("0")
  return (
    <div className="mx-auto max-w-5xl">
      <p className="bq-label">Create</p>
      <h1 className="bq-display mt-2 text-4xl font-semibold text-balance">What would you like to set up?</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--bq-ivory-dim)]">
        Each option is a short guided wizard. You review everything before anything happens, and each step you sign is recorded on BNB Smart Chain.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-sm">
        <span className="bq-label">Working in</span>
        <select className="rounded-md border border-border bg-input px-3 py-1.5 text-sm" value={instance} onChange={(e) => setInstance(e.target.value)}>
          {instances.list.map((i) => (
            <option key={String(i.id)} value={String(i.id)}>
              #{String(i.id)} · {instanceName(i.id) ?? (i.id === 0n ? "BitRegalo public template" : "Instance")}{address && i.admin.toLowerCase() === address.toLowerCase() ? " (yours)" : ""}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">Used by the wizards that work inside an instance.</span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {ITEMS.map((it, i) => (
          <Link key={it.title} href={it.href(instance)}
            className={`group bq-rise relative flex flex-col rounded-2xl border border-border bg-card/80 p-6 transition hover:-translate-y-0.5 hover:border-primary/50 ${i === 0 ? "sm:col-span-2 sm:flex-row sm:items-center sm:gap-8" : ""}`}
            style={{ animationDelay: `${i * 50}ms` }}>
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${i === 0 ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-secondary/60 text-[color:var(--bq-ivory-dim)]"}`}>{it.icon}</span>
            <span className="mt-4 flex-1 sm:mt-0">
              <span className="flex items-center gap-3">
                <span className="bq-display text-xl font-semibold">{it.title}</span>
                <span className="bq-label rounded-full border border-border px-2 py-0.5 text-[9px]">{it.time}</span>
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{it.body}</span>
              {it.needsInstance && <span className="mt-3 block text-xs text-muted-foreground">In instance #{instance}</span>}
            </span>
            <ArrowRight className="mt-4 size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary sm:mt-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
