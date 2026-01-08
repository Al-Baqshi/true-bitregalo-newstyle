import Link from "next/link"
import Image from "next/image"

const footerLinks = {
  Protocols: ["Escrow", "RFP", "RTS", "UserAuth"],
  Resources: ["Whitepaper", "Documentation", "API Reference", "Community"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Security"],
}

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/BrandLogo copy.svg"
                alt="BitRegalo"
                width={120}
                height={28}
                className="h-7 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              A comprehensive verification layer providing institutional-grade proof-of-existence, integrity
              verification, and ownership validation for digital assets and transactions.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold">{title}</h3>
              <ul className="mt-4 space-y-2">
                {links.map((link) => {
                  const href =
                    link === "Privacy"
                      ? "/privacy"
                      : link === "Terms"
                        ? "/terms"
                        : link === "Security"
                          ? "#security"
                          : "#"
                  return (
                    <li key={link}>
                      <Link
                        href={href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border/40 pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} BitRegalo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
