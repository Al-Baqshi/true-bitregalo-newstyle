"use client"
import Link from "next/link"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Notice, PageHead } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

/** Shown when a page needs a contract feature this workspace's version does not have. */
export function OlderContract({ what }: { what: string }) {
  const t = useTenant()
  return (
    <div>
      <PageHead title={what} />
      <Notice
        tone="accent"
        title={`${what} needs a newer workspace`}
        action={<Button asChild><Link href="/app/launch">Create a workspace</Link></Button>}
      >
        <p>
          Workspace #{String(t.id)} runs contract version {String(t.version)}. Payments, the shop and the workspace treasury arrived in version 1, and a workspace keeps the contract it was created with. Create a new workspace to get them; everything else here keeps working.
        </p>
      </Notice>
    </div>
  )
}
