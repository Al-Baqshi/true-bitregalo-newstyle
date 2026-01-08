import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy — BitRegalo",
  description: "Privacy Policy for BitRegalo services",
}

export default function PrivacyPage() {
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
            <h1 className="font-mono text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
            <p className="mt-4 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="mt-12 space-y-8 text-sm leading-relaxed">
              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">1. Introduction</h2>
                <p className="text-muted-foreground">
                  BitRegalo ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains
                  how we collect, use, disclose, and safeguard your information when you use our Service. Please read
                  this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do
                  not access the Service.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">2. Information We Collect</h2>
                
                <h3 className="font-mono text-lg font-semibold mt-6 mb-3">2.1 Information You Provide</h3>
                <p className="text-muted-foreground mb-4">
                  We may collect information that you voluntarily provide to us when you:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Register for an account</li>
                  <li>Use our Service features</li>
                  <li>Contact us for support</li>
                  <li>Subscribe to our newsletter or communications</li>
                  <li>Participate in surveys or feedback</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  This information may include your name, email address, wallet address, and other contact or identifying
                  information.
                </p>

                <h3 className="font-mono text-lg font-semibold mt-6 mb-3">2.2 Automatically Collected Information</h3>
                <p className="text-muted-foreground mb-4">
                  When you use our Service, we may automatically collect certain information, including:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Usage data (pages visited, features used, time spent)</li>
                  <li>Transaction data (on-chain transaction hashes and metadata)</li>
                  <li>Log files and analytics data</li>
                </ul>

                <h3 className="font-mono text-lg font-semibold mt-6 mb-3">2.3 Blockchain Data</h3>
                <p className="text-muted-foreground">
                  As a blockchain-based service, certain information is inherently public and immutable, including
                  transaction hashes, wallet addresses, and on-chain verification records. This information is part of
                  the blockchain's public ledger and cannot be deleted or modified.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Provide, maintain, and improve our Service</li>
                  <li>Process transactions and verify digital assets</li>
                  <li>Authenticate users and prevent fraud</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Monitor and analyze usage patterns and trends</li>
                  <li>Develop new features and services</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
                <p className="text-muted-foreground mb-4">
                  We do not sell, trade, or rent your personal information to third parties. We may share your
                  information in the following circumstances:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>
                    <strong>Service Providers:</strong> We may share information with third-party service providers who
                    perform services on our behalf, such as hosting, analytics, and customer support.
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> We may disclose information if required by law or in response to
                    valid requests by public authorities.
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your
                    information may be transferred as part of that transaction.
                  </li>
                  <li>
                    <strong>With Your Consent:</strong> We may share your information with your explicit consent or at
                    your direction.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">5. Blockchain and Public Data</h2>
                <p className="text-muted-foreground">
                  When you use our Service to create verifications, timestamps, or other on-chain records, this
                  information becomes part of the public blockchain. This includes transaction hashes, verification
                  metadata, and associated wallet addresses. This data is permanent, publicly accessible, and cannot be
                  deleted. By using our Service, you acknowledge and consent to this public disclosure of verification
                  data.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">6. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational security measures to protect your information
                  against unauthorized access, alteration, disclosure, or destruction. However, no method of
                  transmission over the internet or electronic storage is 100% secure. While we strive to use
                  commercially acceptable means to protect your information, we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">7. Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your information for as long as necessary to fulfill the purposes outlined in this Privacy
                  Policy, unless a longer retention period is required or permitted by law. Note that blockchain data
                  cannot be deleted once recorded on-chain.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">8. Your Rights and Choices</h2>
                <p className="text-muted-foreground mb-4">Depending on your location, you may have certain rights regarding your information:</p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>
                    <strong>Access:</strong> You may request access to the personal information we hold about you.
                  </li>
                  <li>
                    <strong>Correction:</strong> You may request correction of inaccurate or incomplete information.
                  </li>
                  <li>
                    <strong>Deletion:</strong> You may request deletion of your personal information, subject to legal
                    and operational requirements.
                  </li>
                  <li>
                    <strong>Objection:</strong> You may object to certain processing of your information.
                  </li>
                  <li>
                    <strong>Data Portability:</strong> You may request a copy of your information in a portable format.
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  To exercise these rights, please contact us using the information provided in the Contact section.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">9. Cookies and Tracking Technologies</h2>
                <p className="text-muted-foreground">
                  We may use cookies, web beacons, and similar tracking technologies to collect and store information
                  about your use of our Service. You can control cookies through your browser settings, though this may
                  affect your ability to use certain features of the Service.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">10. Third-Party Links</h2>
                <p className="text-muted-foreground">
                  Our Service may contain links to third-party websites or services. We are not responsible for the
                  privacy practices of these third parties. We encourage you to read the privacy policies of any
                  third-party sites you visit.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">11. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal
                  information from children. If you become aware that a child has provided us with personal
                  information, please contact us, and we will take steps to delete such information.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">12. International Data Transfers</h2>
                <p className="text-muted-foreground">
                  Your information may be transferred to and processed in countries other than your country of
                  residence. These countries may have data protection laws that differ from those in your country. By
                  using our Service, you consent to the transfer of your information to these countries.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">13. Changes to This Privacy Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
                  new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this
                  Privacy Policy periodically for any changes.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">14. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us
                  through our official channels or visit our website for support information.
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
