import type React from "react"
import type { Metadata } from "next"
import { Geist, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _geist = Geist({ subsets: ["latin"] })
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BitRegalo — The Global Gifting Marketplace | Smart Contracts as a Service",
  description:
    "Send gifts anywhere in the world with on-chain trust. BitRegalo is a decentralized marketplace for gifting, services, and escrow — powered by blockchain technology.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
