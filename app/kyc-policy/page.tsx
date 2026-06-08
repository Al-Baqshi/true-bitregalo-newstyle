import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"

export const metadata: Metadata = {
  title: "KYC & Verification Policy — BitRegalo",
  description: "BitRegalo tiered verification policy for users and service providers",
}

export default function KYCPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to Home
            </Link>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-8 sm:p-12">
            <h1 className="font-mono text-4xl font-bold tracking-tight sm:text-5xl">KYC & Verification Policy</h1>
            <p className="mt-4 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="mt-12 space-y-8 text-sm leading-relaxed">
              <section className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-foreground font-semibold mb-2">Legal Basis</p>
                <p className="text-muted-foreground">
                  This policy is designed in accordance with the New Zealand Anti-Money Laundering and Countering Financing of Terrorism Act 2009 (AML/CFT Act). BitRegalo® Limited is a technology platform provider, not a reporting entity under Section 5 of the AML/CFT Act. However, we implement voluntary Customer Due Diligence (CDD) as a best practice and risk mitigation measure.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">1. Purpose</h2>
                <p className="text-muted-foreground">
                  This policy outlines BitRegalo&apos;s approach to user verification and Know Your Customer (KYC) procedures. Our tiered verification system balances regulatory compliance with user privacy and ease of use.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">2. Legal Framework</h2>
                <p className="text-muted-foreground mb-4">
                  BitRegalo is NOT a reporting entity under the AML/CFT Act 2009 because:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>We provide technology services, not financial services</li>
                  <li>BTR and Regalo tokens are utility credits, not financial products</li>
                  <li>Escrow is a platform feature, not a financial service</li>
                  <li>We do not hold client funds or operate as a financial institution</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  However, we voluntarily implement CDD measures to:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground mt-2">
                  <li>Mitigate money laundering and terrorist financing risks</li>
                  <li>Comply with the occasional transaction threshold (NZD $1,000)</li>
                  <li>Establish business relationships with service providers</li>
                  <li>Protect the Platform and its users from fraud</li>
                </ul>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">3. Tiered Verification System</h2>
                
                <h3 className="font-mono text-lg font-semibold mt-6 mb-3">3.1 Tier 1: Gifters (Buyers) — Low Value</h3>
                <p className="text-muted-foreground mb-2">
                  <strong>Transaction Value:</strong> Under NZD $1,000
                </p>
                <p className="text-muted-foreground mb-2">
                  <strong>Verification Required:</strong> None
                </p>
                <p className="text-muted-foreground mb-2">
                  <strong>Legal Basis:</strong> Section 11 of AML/CFT Act — CDD not required for occasional transactions under NZD $1,000
                </p>
                <p className="text-muted-foreground">
                  <strong>Requirements:</strong>
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Email address (for account creation)</li>
                  <li>Wallet address (for transactions)</li>
                  <li>No identity documents required</li>
                </ul>

                <h3 className="font-mono text-lg font-semibold mt-6 mb-3">3.2 Tier 2: Gifters (Buyers) — High Value</h3>
                <p className="text-muted-foreground mb-2">
                  <strong>Transaction Value:</strong> NZD $1,000 or above
                </p>
                <p className="text-muted-foreground mb-2">
                  <strong>Verification Required:</strong> Basic Identity Verification
                </p>
                <p className="text-muted-foreground mb-2">
                  <strong>Legal Basis:</strong> Section 11 of AML/CFT Act — CDD required for occasional transactions of NZD $1,000 or more
                </p>
                <p className="text-muted-foreground">
                  <strong>Requirements:</strong>
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Government-issued photo ID (passport, driver&apos;s license, or national ID)</li>
                  <li>Selfie with ID (for liveness check)</li>
                  <li>Email verification</li>
                  <li>No proof of address required</li>
                </ul>

                <h3 className="font-mono text-lg font-semibold mt-6 mb-3">3.3 Tier 3: Service Providers</h3>
                <p className="text-muted-foreground mb-2">
                  <strong>Verification Required:</strong> Full Identity Verification (Enhanced CDD)
                </p>
                <p className="text-muted-foreground mb-2">
                  <strong>Legal Basis:</strong> Section 11 of AML/CFT Act — Establishing a &quot;business relationship&quot; requires CDD
                </p>
                <p className="text-muted-foreground">
                  <strong>Requirements:</strong>
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Government-issued photo ID</li>
                  <li>Proof of address (utility bill, bank statement — within 3 months)</li>
                  <li>Business registration documents (if operating as a business)</li>
                  <li>Tax identification number (for tax reporting obligations)</li>
                  <li>Selfie with ID</li>
                  <li>Source of funds declaration (for high-volume providers)</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  <strong>Rationale:</strong> Service providers receive payments from multiple sources, creating higher money laundering risk. They also have tax reporting obligations that require verified identity.
                </p>

                <h3 className="font-mono text-lg font-semibold mt-6 mb-3">3.4 Tier 4: Enterprise Clients</h3>
                <p className="text-muted-foreground mb-2">
                  <strong>Verification Required:</strong> Enhanced Due Diligence (EDD)
                </p>
                <p className="text-muted-foreground">
                  <strong>Requirements:</strong>
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>All Tier 3 requirements</li>
                  <li>Corporate registration documents</li>
                  <li>Beneficial ownership information (individuals owning 25% or more)</li>
                  <li>Directors and authorized signatories identification</li>
                  <li>Compliance certifications (AML/CFT program, if applicable)</li>
                  <li>Ongoing monitoring and periodic re-verification (annually)</li>
                </ul>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">4. Verification Process</h2>
                <p className="text-muted-foreground mb-4">
                  BitRegalo uses third-party verification providers (such as SumSub) to process identity documents. The verification process:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Documents are encrypted and stored securely</li>
                  <li>Only verification status (verified/unverified) is stored on-chain, not personal data</li>
                  <li>Verification typically completes within 24-48 hours</li>
                  <li>Users are notified of verification status via email</li>
                  <li>Failed verifications can be resubmitted with corrected documents</li>
                </ul>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">5. Ongoing Monitoring</h2>
                <p className="text-muted-foreground mb-4">
                  BitRegalo implements automated transaction monitoring to detect suspicious activity:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Velocity limits (maximum transactions per day/week)</li>
                  <li>Unusual transaction patterns (structuring, rapid succession)</li>
                  <li>Geographic risk (transactions from sanctioned countries)</li>
                  <li>High-risk counterparties (known illicit addresses)</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Suspicious activity may result in:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground mt-2">
                  <li>Temporary account restrictions</li>
                  <li>Request for additional verification</li>
                  <li>Account termination</li>
                  <li>Voluntary reporting to authorities (if required by law)</li>
                </ul>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">6. Data Privacy & Retention</h2>
                <p className="text-muted-foreground mb-4">
                  Verification data is handled in accordance with the Privacy Act 2020:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Personal data is encrypted at rest and in transit</li>
                  <li>Only necessary data is collected (data minimization principle)</li>
                  <li>Data is retained for 7 years after account closure (as per AML/CFT Act Section 48)</li>
                  <li>Users can request access to their verification data</li>
                  <li>Verification data is not shared with third parties except as required by law</li>
                </ul>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">7. Exemptions & Special Cases</h2>
                
                <h3 className="font-mono text-lg font-semibold mt-6 mb-3">7.1 Recurring Transactions</h3>
                <p className="text-muted-foreground">
                  Users who conduct multiple transactions that individually are under NZD $1,000 but collectively exceed this threshold may be required to complete Tier 2 verification.
                </p>

                <h3 className="font-mono text-lg font-semibold mt-6 mb-3">7.2 Suspicious Activity</h3>
                <p className="text-muted-foreground">
                  BitRegalo reserves the right to require verification at any tier if suspicious activity is detected, regardless of transaction value.
                </p>

                <h3 className="font-mono text-lg font-semibold mt-6 mb-3">7.3 Sanctioned Jurisdictions</h3>
                <p className="text-muted-foreground">
                  Users from sanctioned countries or territories may be subject to enhanced verification or restricted from using the Platform.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">8. User Rights</h2>
                <p className="text-muted-foreground mb-4">
                  Under the Privacy Act 2020, users have the right to:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Access their verification data</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of verification data (subject to legal retention requirements)</li>
                  <li>Complain to the Privacy Commissioner if they believe their privacy has been breached</li>
                </ul>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">9. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  BitRegalo may update this policy from time to time. Material changes will be notified via email or Platform announcement. Continued use of the Platform after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">10. Contact Information</h2>
                <p className="text-muted-foreground">
                  For questions about this KYC Policy or verification requirements, please contact BitRegalo® Limited through our official website or support channels.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>BitRegalo® Limited</strong><br />
                  New Zealand Registration: 7699356<br />
                  Website: bitregalo.com
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
