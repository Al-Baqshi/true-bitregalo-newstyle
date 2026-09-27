"use client"
import { useState } from "react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { wagmiConfig } from "@/lib/bitregalo/config"

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={client}>
        {children}
        <Toaster theme="dark" richColors position="bottom-right" />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
