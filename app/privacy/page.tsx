import type { Metadata } from "next"
import { DocNotice, DocPage } from "@/components/site/doc-page"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for BitRegalo platform services",
}

export default function PrivacyPage() {
  return (
    <DocPage
      title={"Privacy Policy"}
      updated={<>Last updated: {new Date().toLocaleDateString()}</>}
      meta={"Compliant with the New Zealand Privacy Act 2020"}
    >
      <DocNotice title="Privacy Commitment">
        <p>
          BitRegalo® Limited is committed to protecting your privacy in accordance with the New Zealand Privacy Act 2020 and the 13 Information Privacy Principles (IPPs). This policy explains how we collect, use, store, and disclose your personal information.
        </p>
      </DocNotice>

      <h2 id="information-we-collect">1. Information We Collect</h2>
      <h3>1.1 Account Information (All Users)</h3>
      <ul>
        <li>Email address</li>
        <li>Wallet address (public blockchain address)</li>
        <li>Username (optional)</li>
        <li>Account creation date</li>
      </ul>
      <h3>1.2 Verification Information (Tier 2+ Users)</h3>
      <p>
        For users requiring identity verification (transactions ≥ NZD $1,000, service providers, enterprise clients):
      </p>
      <ul>
        <li>Government-issued photo ID (passport, driver&apos;s license, national ID)</li>
        <li>Selfie with ID (for liveness verification)</li>
        <li>Proof of address (utility bill, bank statement — service providers only)</li>
        <li>Business registration documents (service providers, if applicable)</li>
        <li>Tax identification number (service providers)</li>
      </ul>
      <h3>1.3 Transaction Information</h3>
      <ul>
        <li>Transaction hashes (public blockchain data)</li>
        <li>Transaction amounts and timestamps</li>
        <li>Escrow contract details</li>
        <li>RFP and RTS submissions</li>
      </ul>
      <h3>1.4 Technical Information</h3>
      <ul>
        <li>IP address</li>
        <li>Browser type and version</li>
        <li>Device information (operating system, device type)</li>
        <li>Usage data (pages visited, features used, time spent on Platform)</li>
        <li>Log files and analytics data</li>
      </ul>
      <h3>1.5 Blockchain Data</h3>
      <p>
        Certain information is inherently public and immutable on the blockchain, including transaction hashes, wallet addresses, and smart contract interactions. This data is part of the public ledger and cannot be deleted or modified by BitRegalo.
      </p>

      <h2 id="purpose-of-collection-ipp-1">2. Purpose of Collection (IPP 1)</h2>
      <p>
        We collect personal information for the following lawful purposes:
      </p>
      <ul>
        <li>To provide and maintain Platform services</li>
        <li>To process transactions and verify digital assets</li>
        <li>To authenticate users and prevent fraud</li>
        <li>To comply with legal obligations (AML/CFT Act for high-value transactions)</li>
        <li>To communicate with you about your account and Platform updates</li>
        <li>To improve Platform features and user experience</li>
        <li>To monitor and analyze usage patterns</li>
        <li>To enforce our Terms of Service</li>
      </ul>

      <h2 id="source-of-information-ipp-2">3. Source of Information (IPP 2)</h2>
      <p>
        We collect information from:
      </p>
      <ul>
        <li><strong>You directly:</strong> When you register, submit verification documents, or use Platform features</li>
        <li><strong>Automated collection:</strong> Through cookies, log files, and analytics tools</li>
        <li><strong>Third-party providers:</strong> Identity verification services (e.g., SumSub)</li>
        <li><strong>Public blockchain:</strong> Transaction data that is publicly available</li>
      </ul>

      <h2 id="use-of-information-ipp-10">4. Use of Information (IPP 10)</h2>
      <p>
        We use your information only for the purposes for which it was collected:
      </p>
      <ul>
        <li>Account management and authentication</li>
        <li>Transaction processing and escrow management</li>
        <li>Identity verification (where required)</li>
        <li>Customer support and communication</li>
        <li>Platform improvement and development</li>
        <li>Security monitoring and fraud prevention</li>
        <li>Legal compliance and regulatory reporting</li>
      </ul>

      <h2 id="disclosure-of-information-ipp-11">5. Disclosure of Information (IPP 11)</h2>
      <p>
        We do NOT sell, trade, or rent your personal information. We may disclose information only in the following circumstances:
      </p>
      <ul>
        <li>
          <strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (hosting, verification, analytics, customer support). These providers are contractually obligated to protect your data.
        </li>
        <li>
          <strong>Legal Requirements:</strong> When required by law, court order, or government authority (e.g., AML/CFT reporting obligations).
        </li>
        <li>
          <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.
        </li>
        <li>
          <strong>With Your Consent:</strong> When you explicitly authorize disclosure.
        </li>
        <li>
          <strong>Protection of Rights:</strong> To protect the rights, property, or safety of BitRegalo, users, or the public.
        </li>
      </ul>

      <h2 id="data-storage-and-security-ipp-5">6. Data Storage & Security (IPP 5)</h2>
      <p>
        We implement appropriate technical and organizational measures to protect your information:
      </p>
      <ul>
        <li>Encryption at rest and in transit (TLS 1.3, AES-256)</li>
        <li>Secure data centers with physical access controls</li>
        <li>Regular security audits and penetration testing</li>
        <li>Access controls and authentication for employees</li>
        <li>Incident response procedures for data breaches</li>
      </ul>
      <p>
        However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.
      </p>

      <h2 id="data-retention">7. Data Retention</h2>
      <p>
        We retain your information as follows:
      </p>
      <ul>
        <li><strong>Account information:</strong> Duration of account + 7 years after closure (AML/CFT Act Section 48)</li>
        <li><strong>Verification documents:</strong> 7 years after account closure (AML/CFT Act Section 48)</li>
        <li><strong>Transaction records:</strong> 7 years after transaction (legal requirement)</li>
        <li><strong>Technical logs:</strong> 12 months (for security and analytics)</li>
        <li><strong>Blockchain data:</strong> Permanent (cannot be deleted — public ledger)</li>
      </ul>

      <h2 id="your-rights-ipps-6-7-8">8. Your Rights (IPPs 6, 7, 8)</h2>
      <p>
        Under the Privacy Act 2020, you have the following rights:
      </p>
      <ul>
        <li>
          <strong>Access (IPP 6):</strong> You may request access to the personal information we hold about you.
        </li>
        <li>
          <strong>Correction (IPP 7):</strong> You may request correction of inaccurate or incomplete information.
        </li>
        <li>
          <strong>Accuracy (IPP 8):</strong> We take reasonable steps to ensure information is accurate, up-to-date, and complete before use.
        </li>
        <li>
          <strong>Deletion:</strong> You may request deletion of your personal information, subject to legal retention requirements (e.g., AML/CFT Act).
        </li>
        <li>
          <strong>Objection:</strong> You may object to certain processing of your information.
        </li>
        <li>
          <strong>Data Portability:</strong> You may request a copy of your information in a portable format.
        </li>
      </ul>
      <p>
        To exercise these rights, contact us at privacy@bitregalo.com or through our support channels.
      </p>

      <h2 id="cookies-and-tracking-ipp-3">9. Cookies & Tracking (IPP 3)</h2>
      <p>
        We use cookies and similar technologies to:
      </p>
      <ul>
        <li>Remember your preferences and settings</li>
        <li>Authenticate your session</li>
        <li>Analyze Platform usage and performance</li>
        <li>Improve user experience</li>
      </ul>
      <p>
        You can control cookies through your browser settings. Disabling cookies may affect Platform functionality.
      </p>

      <h2 id="international-data-transfers-ipp-12">10. International Data Transfers (IPP 12)</h2>
      <p>
        Your information may be transferred to and processed in countries other than New Zealand. These countries may have different data protection laws. We ensure appropriate safeguards are in place, including:
      </p>
      <ul>
        <li>Contractual clauses requiring equivalent privacy protection</li>
        <li>Data processing agreements with service providers</li>
        <li>Compliance with New Zealand&apos;s cross-border disclosure requirements</li>
      </ul>

      <h2 id="childrenandaposs-privacy">11. Children&apos;s Privacy</h2>
      <p>
        The Platform is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us and we will delete it.
      </p>

      <h2 id="data-breaches">12. Data Breaches</h2>
      <p>
        In the event of a privacy breach that poses a risk of serious harm, we will:
      </p>
      <ul>
        <li>Notify the Privacy Commissioner as soon as practicable</li>
        <li>Notify affected individuals as soon as practicable</li>
        <li>Take steps to contain the breach and prevent further harm</li>
        <li>Investigate the cause and implement corrective measures</li>
      </ul>

      <h2 id="third-party-links">13. Third-Party Links</h2>
      <p>
        The Platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
      </p>

      <h2 id="changes-to-this-policy">14. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will be notified via email or Platform announcement. Your continued use of the Platform after changes constitutes acceptance of the updated policy.
      </p>

      <h2 id="complaints">15. Complaints</h2>
      <p>
        If you believe your privacy has been breached, you may:
      </p>
      <ul>
        <li>Contact us directly to resolve the issue</li>
        <li>Complain to the New Zealand Privacy Commissioner</li>
        <li>Visit: www.privacy.org.nz or call 0800 803 734</li>
      </ul>

      <h2 id="contact-information">16. Contact Information</h2>
      <p>
        For privacy-related inquiries or to exercise your rights, please contact:
      </p>
      <p>
        <strong>BitRegalo® Limited</strong><br />
        Privacy Officer<br />
        Email: privacy@bitregalo.com<br />
        Website: bitregalo.com
      </p>
    </DocPage>
  )
}
