import type { Metadata } from "next"
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google"
import { AppProviders } from "@/components/app/providers"
import { AppShell } from "@/components/app/shell"

const sans = Geist({ subsets: ["latin"], variable: "--font-app-sans" })
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-app-mono" })
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-app-display", weight: ["500", "600", "700"] })

export const metadata: Metadata = {
  title: "BitRegalo App",
  description: "Launch your own workspace, post requests, settle by escrow or direct payment, and create tokens for your projects — on BNB Smart Chain.",
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`bq-app min-h-screen ${sans.variable} ${mono.variable} ${display.variable}`}>
      <AppProviders>
        <AppShell>{children}</AppShell>
      </AppProviders>
    </div>
  )
}
