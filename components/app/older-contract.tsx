"use client"
import Link from "next/link"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Notice, PageHead } from "@/components/app/ui"
import { Button } from "@/components/ui/button"

/**
 * Shown when a page needs a contract feature this workspace's version does not have.
 * On the BitRegalo network the answer is to wait: BitRegalo moves the network to the newer
 * contracts. In an organisation's workspace the answer is a new workspace, because a
 * workspace keeps the contracts it was created with.
 */
export function OlderContract({ what }: { what: string }) {
  const t = useTenant()
  if (t.isPublic) {
    return (
      <div>
        <PageHead title={what} />
        <Notice
          tone="accent"
          title={`${what}: not on the network yet`}
          action={<Button asChild variant="secondary"><Link href={t.base}>Back to the network</Link></Button>}
        >
          <p>
            This part needs the newer contracts. The BitRegalo network runs contract version {String(t.version)} today; payments, the shop and the workspace treasury arrived in version 1, which the network will move to. Until then, requests, listings and escrows here keep working.
          </p>
        </Notice>
      </div>
    )
  }
  return (
    <div>
      <PageHead title={what} />
      <Notice
        tone="accent"
        title={`${what} needs a newer workspace`}
        action={<Button asChild><Link href="/app/launch">Create a workspace</Link></Button>}
      >
        <p>
          Workspace #{String(t.id)} runs contract version {String(t.version)}. Payments, the shop and the workspace treasury arrived in version 1, and a workspace keeps the contracts it was created with. Launch a new workspace to get them; everything else here keeps working.
        </p>
      </Notice>
    </div>
  )
}
