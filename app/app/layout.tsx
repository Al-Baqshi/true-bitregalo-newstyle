import type { Metadata } from "next"
import { AppProviders } from "@/components/app/providers"
import { AppShell } from "@/components/app/shell"
import { chain } from "@/lib/bitregalo/config"

export const metadata: Metadata = {
  title: { absolute: "BitRegalo App" },
  description: `BitRegalo's reference app and public workspace. Connect a platform, run an organisation's workspace, or use the BitRegalo network: records nobody can edit, and payment commitments that execute as agreed. Today on ${chain.name}, a practice network.`,
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AppShell>{children}</AppShell>
    </AppProviders>
  )
}
