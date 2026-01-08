import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms and Conditions — BitRegalo",
  description: "Terms and Conditions for BitRegalo services",
}

export default function TermsPage() {
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
            <h1 className="font-mono text-4xl font-bold tracking-tight sm:text-5xl">Terms and Conditions</h1>
            <p className="mt-4 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="mt-12 space-y-8 text-sm leading-relaxed">
              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using BitRegalo ("the Service"), you accept and agree to be bound by the terms and
                  provision of this agreement. If you do not agree to abide by the above, please do not use this
                  service.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground">
                  BitRegalo is a comprehensive verification layer that provides proof-of-existence, integrity
                  verification, and ownership validation for digital assets and transactions. The Service includes but is
                  not limited to:
                </p>
                <ul className="mt-4 ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Escrow services for secure transactions</li>
                  <li>Request for Proposal (RFP) protocols</li>
                  <li>Real-Time Settlement (RTS) systems</li>
                  <li>User authentication and verification services</li>
                  <li>Blockchain-based timestamping and verification</li>
                </ul>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">3. User Responsibilities</h2>
                <p className="text-muted-foreground mb-4">
                  You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree
                  not to:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon the rights of others</li>
                  <li>Transmit any malicious code, viruses, or harmful data</li>
                  <li>Attempt to gain unauthorized access to the Service</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Use the Service for any fraudulent or illegal activities</li>
                </ul>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">4. Account Registration</h2>
                <p className="text-muted-foreground">
                  To access certain features of the Service, you may be required to register for an account. You agree to:
                </p>
                <ul className="mt-4 ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your information to keep it accurate</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">5. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  The Service and its original content, features, and functionality are owned by BitRegalo and are
                  protected by international copyright, trademark, patent, trade secret, and other intellectual property
                  laws. You may not modify, reproduce, distribute, create derivative works, publicly display, or otherwise
                  exploit any content from the Service without our express written permission.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">6. BTR Token Usage</h2>
                <p className="text-muted-foreground">
                  The BTR token is a utility token that provides access to protocol services. By using BTR tokens, you
                  acknowledge that:
                </p>
                <ul className="mt-4 ml-6 list-disc space-y-2 text-muted-foreground">
                  <li>BTR tokens are utility tokens and do not represent equity, securities, or investment instruments</li>
                  <li>Token values may fluctuate and are subject to market conditions</li>
                  <li>You are responsible for the security of your tokens and wallet</li>
                  <li>We are not responsible for any loss of tokens due to user error or security breaches</li>
                </ul>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">7. Service Availability</h2>
                <p className="text-muted-foreground">
                  We strive to maintain high availability of the Service but do not guarantee uninterrupted access. The
                  Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our
                  control. We reserve the right to modify, suspend, or discontinue any part of the Service at any time
                  with or without notice.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">8. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  To the maximum extent permitted by law, BitRegalo and its affiliates shall not be liable for any
                  indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues,
                  whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible
                  losses resulting from your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">9. Indemnification</h2>
                <p className="text-muted-foreground">
                  You agree to defend, indemnify, and hold harmless BitRegalo and its officers, directors, employees, and
                  agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable
                  legal fees, arising out of or in any way connected with your access to or use of the Service or your
                  violation of these Terms.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">10. Privacy</h2>
                <p className="text-muted-foreground">
                  Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy,
                  which also governs your use of the Service, to understand our practices.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">11. Modifications to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these Terms at any time. We will notify users of any material changes
                  by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the
                  Service after such modifications constitutes your acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">12. Termination</h2>
                <p className="text-muted-foreground">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice
                  or liability, for any reason, including if you breach these Terms. Upon termination, your right to
                  use the Service will immediately cease.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">13. Governing Law</h2>
                <p className="text-muted-foreground">
                  These Terms shall be governed by and construed in accordance with applicable laws, without regard to
                  its conflict of law provisions. Any disputes arising from these Terms or your use of the Service shall
                  be resolved through appropriate legal channels.
                </p>
              </section>

              <section>
                <h2 className="font-mono text-xl font-semibold mb-4">14. Contact Information</h2>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms, please contact us through our official channels or visit
                  our website for support information.
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
