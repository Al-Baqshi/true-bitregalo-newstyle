"use client"
import { useEffect } from "react"
import { ThemeProvider as NextThemes, useTheme } from "next-themes"

/** Page colour at the very top of each theme: what the phone's status bar should match. */
const BAR = { light: "#fbfaf7", dark: "#0b0d10" } as const

/**
 * The layout declares a status-bar colour per OS colour scheme. When someone picks a
 * theme by hand that differs from their OS, those tags are wrong, so set them to the
 * theme actually on screen.
 */
function StatusBarColour() {
  const { resolvedTheme } = useTheme()
  useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", BAR[resolvedTheme]))
  }, [resolvedTheme])
  return null
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="bitregalo-theme">
      {children}
      <StatusBarColour />
    </NextThemes>
  )
}
