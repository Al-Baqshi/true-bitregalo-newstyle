import type React from "react"
import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

/*
 * Fonts are served from this repo (app/fonts), not fetched from Google at build time.
 * Commissioner is one variable file: weight, slant, and the flare/volume axes the
 * headings use. The Latin Extended file is only downloaded when a page needs it
 * (macrons in Māori names, accents in supplier names).
 *
 * next/font needs every option written out as a literal, so the unicode ranges are
 * repeated rather than shared through a constant.
 */
const sans = localFont({
  src: "./fonts/Commissioner-latin.woff2",
  variable: "--font-commissioner",
  weight: "100 900",
  style: "oblique 0deg 12deg",
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" }],
})
const sansExt = localFont({
  src: "./fonts/Commissioner-latin-ext.woff2",
  variable: "--font-commissioner-ext",
  weight: "100 900",
  style: "oblique 0deg 12deg",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
})
const mono = localFont({
  src: "./fonts/GeistMono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" }],
})
const monoExt = localFont({
  src: "./fonts/GeistMono-latin-ext.woff2",
  variable: "--font-geist-mono-ext",
  weight: "100 900",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
})

// Icons come from the files beside this one (favicon.ico, icon.svg, apple-icon.png).
export const metadata: Metadata = {
  title: {
    default: "BitRegalo — Decentralised Escrow Infrastructure",
    template: "%s · BitRegalo",
  },
  description:
    "Non-custodial escrow on multiple chains. The buyer can only release, the supplier can only hand back, and after the deadline the money can only return to the buyer. No middleman, no custodian.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d10" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${sansExt.variable} ${mono.variable} ${monoExt.variable}`}>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
