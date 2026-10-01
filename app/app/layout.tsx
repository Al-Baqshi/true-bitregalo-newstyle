import type { Metadata } from "next"
import { AppProviders } from "@/components/app/providers"
import { AppShell } from "@/components/app/shell"

export const metadata: Metadata = {
  title: { absolute: "BitRegalo App" },
  description: "Launch your own workspace, post requests, settle by escrow or direct payment, and create tokens for your projects — on BNB Smart Chain.",
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AppShell>{children}</AppShell>
    </AppProviders>
  )
}
