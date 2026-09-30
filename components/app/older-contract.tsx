"use client"
import Link from "next/link"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Card } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

/** Shown when a page needs a contract feature this workspace's version does not have. */
export function OlderContract({ what }: { what: string }) {
  const t = useTenant()
  return (
    <Card title={`${what} needs a newer workspace`}>
      <p className="text-sm leading-relaxed text-[color:var(--bq-ivory-dim)]">Workspace #{String(t.id)} runs contract version {String(t.version)}. Payments, the shop and the workspace treasury arrived in version 1, and a workspace keeps the contract it was created with. Create a new workspace to get them; everything else here keeps working.</p>
      <div className="mt-4"><Button asChild><Link href="/app/launch">Create a workspace</Link></Button></div>
    </Card>
  )
}
