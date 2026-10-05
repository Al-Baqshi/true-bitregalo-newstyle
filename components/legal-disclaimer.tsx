import Link from "next/link"

/* The legal notice. Its wording is fixed by the company; only its layout lives here. */
const NOTICES = [
  {
    title: "Technology Company, Not a Financial Institution",
    text: "BitRegalo® Limited is a technology company providing decentralised infrastructure for records and payment commitments. It is not a financial institution or a payment service.",
  },
  {
    title: "No Token, No Offering",
    text: "BitRegalo does not have a token. There is no token sale, no initial offering, and no fundraising instrument of any kind. Nothing on this site is an invitation to acquire or register interest in any token, security, or financial product.",
  },
  {
    title: "Test Network, Not Audited",
    text: "BitRegalo runs only on a public test network, where tokens have no value. Its contracts have not been independently audited.",
  },
  {
    title: "Risk Acknowledgement",
    text: "Blockchain technology involves inherent risks including technical failures and regulatory changes. By using BitRegalo, you acknowledge and accept these risks. We provide no guarantees regarding platform availability.",
  },
]

export function LegalDisclaimer() {
  return (
    <section id="disclaimer" aria-labelledby="disclaimer-title" className="border-t border-border bg-secondary/50 py-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 id="disclaimer-title" className="t-subheading">Legal Notice</h2>
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
          BitRegalo® Limited is a New Zealand company and intends to operate in line with the New Zealand law that applies to it. Users and organisations are responsible for compliance with the laws that apply to them in their own jurisdictions.
        </p>
        <p className="mt-3 flex flex-wrap gap-x-6 text-sm">
          <Link href="/terms" className="flex min-h-9 items-center text-gold underline decoration-1 underline-offset-4 hover:decoration-2 pointer-coarse:min-h-11">Terms of Service</Link>
          <Link href="/privacy" className="flex min-h-9 items-center text-gold underline decoration-1 underline-offset-4 hover:decoration-2 pointer-coarse:min-h-11">Privacy Policy</Link>
          <Link href="/kyc-policy" className="flex min-h-9 items-center text-gold underline decoration-1 underline-offset-4 hover:decoration-2 pointer-coarse:min-h-11">Identity checks</Link>
        </p>
      </div>
    </section>
  )
}
