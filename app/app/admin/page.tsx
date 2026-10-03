"use client"
import { useAccount } from "wagmi"
import { Notice, PageHead } from "@/components/app/ui"
import { Accounts } from "@/components/app/admin/accounts"
import { Contracts, Funding, Glance, Roadmap, SECTIONS, Users, Workspaces } from "@/components/app/admin/sections"
import { usePlatform } from "@/components/app/admin/use-platform"

/*
 * Super admin: the whole platform on one page, for BitRegalo's platform owner (the wallet that
 * owns the registry). Anyone may open it; everything on chain is public. Only the off-chain
 * section (accounts and verification) needs the owner's signature.
 */
export default function SuperAdmin() {
  const { address } = useAccount()
  const p = usePlatform()
  const ownerKnown = p.owner !== undefined
  const isOwner = !!address && ownerKnown && p.owner!.toLowerCase() === address.toLowerCase()

  return (
    <div className="space-y-12">
      <PageHead
        title="Super admin"
        intro="The whole platform on one page: workspaces, wallets, where the tokens sit, the contracts and the plan. Everything on chain is public; accounts and verification load only for the owner."
      />

      {ownerKnown && !isOwner && (
        <Notice title="This page is for BitRegalo's platform owner">
          <p>
            You can read every on-chain section below, because it is public. Accounts and verification load only after the owner&apos;s
            wallet signs. {address ? "Your connected wallet is not the owner." : "No wallet is connected."}
          </p>
        </Notice>
      )}

      <nav aria-label="On this page" className="-mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="flex min-h-9 items-center transition-colors hover:text-foreground pointer-coarse:min-h-11">
            {s.label}
          </a>
        ))}
      </nav>

      <div id="glance" className="scroll-mt-32 lg:scroll-mt-24"><Glance p={p} /></div>
      <div id="funding" className="scroll-mt-32 lg:scroll-mt-24"><Funding p={p} /></div>
      <div id="workspaces" className="scroll-mt-32 lg:scroll-mt-24"><Workspaces p={p} /></div>
      <div id="users" className="scroll-mt-32 lg:scroll-mt-24"><Users p={p} me={address} /></div>
      <div id="contracts" className="scroll-mt-32 lg:scroll-mt-24"><Contracts p={p} me={address} /></div>
      <div id="accounts" className="scroll-mt-32 lg:scroll-mt-24"><Accounts isOwner={isOwner} ownerKnown={ownerKnown} address={address} /></div>
      <div id="roadmap" className="scroll-mt-32 lg:scroll-mt-24"><Roadmap p={p} /></div>
    </div>
  )
}
