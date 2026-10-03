"use client"
import { useState } from "react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { useTheme } from "next-themes"
import { wagmiConfig } from "@/lib/bitregalo/config"

/** Toasts take the app's own surface colours and sit above the phone's tab bar. */
function AppToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      mobileOffset={{ bottom: "calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px) + 12px)" }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "0.75rem",
          fontFamily: "var(--font-sans)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "!shadow-overlay !text-sm",
          description: "!text-muted-foreground",
          success: "[&_[data-icon]]:!text-success",
          error: "[&_[data-icon]]:!text-destructive",
        },
      }}
    />
  )
}

// React's development tooling turns props into JSON to label renders, and chain reads are full of
// bigints, which JSON cannot represent. Teach bigints to serialise in development only.
if (process.env.NODE_ENV !== "production" && !("toJSON" in BigInt.prototype)) {
  Object.defineProperty(BigInt.prototype, "toJSON", { value: function (this: bigint) { return this.toString() }, configurable: true })
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={client}>
        {children}
        <AppToaster />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
