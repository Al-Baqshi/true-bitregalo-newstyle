import type { Metadata } from "next"
import { AppProviders } from "@/components/app/providers"
import { AppShell } from "@/components/app/shell"

export const metadata: Metadata = {
  title: "BitRegalo App — tenant #0 on BNB Smart Chain Testnet",
  description: "Post RFPs, list offers, open escrows and launch utility tokens on the live BitRegalo instance.",
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AppShell>{children}</AppShell>
    </AppProviders>
  )
}
