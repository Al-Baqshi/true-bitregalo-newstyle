import Link from "next/link"

/* The legal notice. Its wording is fixed by the company; only its layout lives here. */
const NOTICES = [
  {
    title: "Technology Platform, Not Financial Service",
    text: "BitRegalo is a technology platform providing decentralised escrow infrastructure. We are NOT a financial institution, reporting entity under the AML/CFT Act 2009, or issuer of financial products under the FMC Act 2013.",
  },
  {
    title: "No Token, No Offering",
    text: "BitRegalo does not have a token. There is no token sale, no initial offering, and no fundraising instrument of any kind. Nothing on this site is an invitation to acquire or register interest in any token, security, or financial product.",
  },
  {
    title: "Tiered Verification",
    text: "Gifters under NZD $1,000: No KYC required. High-value transactions (≥$1,000): Basic ID verification. Service providers: Full KYC/CDD required. Enterprise clients: Enhanced due diligence.",
  },
  {
    title: "Risk Acknowledgment",
    text: "Blockchain technology involves inherent risks including technical failures and regulatory changes. By using BitRegalo, you acknowledge and accept these risks. We provide no guarantees regarding platform availability.",
  },
]

export function LegalDisclaimer() {
  return (
    <section id="disclaimer" aria-labelledby="disclaimer-title" className="border-t border-border bg-secondary/50 py-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 id="disclaimer-title" className="t-subheading">Legal Notice &amp; Regulatory Compliance</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">BitRegalo® Limited — New Zealand</p>
        <dl className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
          {NOTICES.map((n) => (
            <div key={n.title}>
              <dt className="text-sm font-semibold">{n.title}</dt>
              <dd className="mt-1 max-w-[68ch] text-sm text-muted-foreground">{n.text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 max-w-[68ch] border-t border-border pt-5 text-sm text-muted-foreground">
          This platform operates in compliance with New Zealand law including the AML/CFT Act 2009, FMC Act 2013, Privacy Act 2020, and Fair Trading Act 1986. Users are responsible for compliance with laws in their own jurisdictions.
        </p>
        <p className="mt-3 flex flex-wrap gap-x-6 text-sm">
          <Link href="/terms" className="flex min-h-9 items-center text-gold underline decoration-1 underline-offset-4 hover:decoration-2 pointer-coarse:min-h-11">Terms of Service</Link>
          <Link href="/privacy" className="flex min-h-9 items-center text-gold underline decoration-1 underline-offset-4 hover:decoration-2 pointer-coarse:min-h-11">Privacy Policy</Link>
          <Link href="/kyc-policy" className="flex min-h-9 items-center text-gold underline decoration-1 underline-offset-4 hover:decoration-2 pointer-coarse:min-h-11">KYC Policy</Link>
        </p>
      </div>
    </section>
  )
}
