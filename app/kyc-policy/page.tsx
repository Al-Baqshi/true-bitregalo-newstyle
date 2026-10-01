import type { Metadata } from "next"
import { DocNotice, DocPage } from "@/components/site/doc-page"

export const metadata: Metadata = {
  title: "KYC & Verification Policy",
  description: "BitRegalo tiered verification policy for users and service providers",
}

export default function KYCPolicyPage() {
  return (
    <DocPage
      title={"KYC & Verification Policy"}
      updated={<>Last updated: {new Date().toLocaleDateString()}</>}
    >
      <DocNotice title="Legal Basis">
        <p>
          This policy is designed in accordance with the New Zealand Anti-Money Laundering and Countering Financing of Terrorism Act 2009 (AML/CFT Act). BitRegalo® Limited is a technology platform provider, not a reporting entity under Section 5 of the AML/CFT Act. However, we implement voluntary Customer Due Diligence (CDD) as a best practice and risk mitigation measure.
        </p>
      </DocNotice>

      <h2 id="purpose">1. Purpose</h2>
      <p>
        This policy outlines BitRegalo&apos;s approach to user verification and Know Your Customer (KYC) procedures. Our tiered verification system balances regulatory compliance with user privacy and ease of use.
      </p>

      <h2 id="legal-framework">2. Legal Framework</h2>
      <p>
        BitRegalo is NOT a reporting entity under the AML/CFT Act 2009 because:
      </p>
      <ul>
        <li>We provide technology services, not financial services</li>
        <li>BTR and Regalo tokens are utility credits, not financial products</li>
        <li>Escrow is a platform feature, not a financial service</li>
        <li>We do not hold client funds or operate as a financial institution</li>
      </ul>
      <p>
        However, we voluntarily implement CDD measures to:
      </p>
      <ul>
        <li>Mitigate money laundering and terrorist financing risks</li>
        <li>Comply with the occasional transaction threshold (NZD $1,000)</li>
        <li>Establish business relationships with service providers</li>
        <li>Protect the Platform and its users from fraud</li>
      </ul>

      <h2 id="tiered-verification-system">3. Tiered Verification System</h2>
      <h3>3.1 Tier 1: Gifters (Buyers) — Low Value</h3>
      <p>
        <strong>Transaction Value:</strong> Under NZD $1,000
      </p>
      <p>
        <strong>Verification Required:</strong> None
      </p>
      <p>
        <strong>Legal Basis:</strong> Section 11 of AML/CFT Act — CDD not required for occasional transactions under NZD $1,000
      </p>
      <p>
        <strong>Requirements:</strong>
      </p>
      <ul>
        <li>Email address (for account creation)</li>
        <li>Wallet address (for transactions)</li>
        <li>No identity documents required</li>
      </ul>
      <h3>3.2 Tier 2: Gifters (Buyers) — High Value</h3>
      <p>
        <strong>Transaction Value:</strong> NZD $1,000 or above
      </p>
      <p>
        <strong>Verification Required:</strong> Basic Identity Verification
      </p>
      <p>
        <strong>Legal Basis:</strong> Section 11 of AML/CFT Act — CDD required for occasional transactions of NZD $1,000 or more
      </p>
      <p>
        <strong>Requirements:</strong>
      </p>
      <ul>
        <li>Government-issued photo ID (passport, driver&apos;s license, or national ID)</li>
        <li>Selfie with ID (for liveness check)</li>
        <li>Email verification</li>
        <li>No proof of address required</li>
      </ul>
      <h3>3.3 Tier 3: Service Providers</h3>
      <p>
        <strong>Verification Required:</strong> Full Identity Verification (Enhanced CDD)
      </p>
      <p>
        <strong>Legal Basis:</strong> Section 11 of AML/CFT Act — Establishing a &quot;business relationship&quot; requires CDD
      </p>
      <p>
        <strong>Requirements:</strong>
      </p>
      <ul>
        <li>Government-issued photo ID</li>
        <li>Proof of address (utility bill, bank statement — within 3 months)</li>
        <li>Business registration documents (if operating as a business)</li>
        <li>Tax identification number (for tax reporting obligations)</li>
        <li>Selfie with ID</li>
        <li>Source of funds declaration (for high-volume providers)</li>
      </ul>
      <p>
        <strong>Rationale:</strong> Service providers receive payments from multiple sources, creating higher money laundering risk. They also have tax reporting obligations that require verified identity.
      </p>
      <h3>3.4 Tier 4: Enterprise Clients</h3>
      <p>
        <strong>Verification Required:</strong> Enhanced Due Diligence (EDD)
      </p>
      <p>
        <strong>Requirements:</strong>
      </p>
      <ul>
        <li>All Tier 3 requirements</li>
        <li>Corporate registration documents</li>
        <li>Beneficial ownership information (individuals owning 25% or more)</li>
        <li>Directors and authorized signatories identification</li>
        <li>Compliance certifications (AML/CFT program, if applicable)</li>
        <li>Ongoing monitoring and periodic re-verification (annually)</li>
      </ul>

      <h2 id="verification-process">4. Verification Process</h2>
      <p>
        BitRegalo uses third-party verification providers (such as SumSub) to process identity documents. The verification process:
      </p>
      <ul>
        <li>Documents are encrypted and stored securely</li>
        <li>Only verification status (verified/unverified) is stored on-chain, not personal data</li>
        <li>Verification typically completes within 24-48 hours</li>
        <li>Users are notified of verification status via email</li>
        <li>Failed verifications can be resubmitted with corrected documents</li>
      </ul>

      <h2 id="ongoing-monitoring">5. Ongoing Monitoring</h2>
      <p>
        BitRegalo implements automated transaction monitoring to detect suspicious activity:
      </p>
      <ul>
        <li>Velocity limits (maximum transactions per day/week)</li>
        <li>Unusual transaction patterns (structuring, rapid succession)</li>
        <li>Geographic risk (transactions from sanctioned countries)</li>
        <li>High-risk counterparties (known illicit addresses)</li>
      </ul>
      <p>
        Suspicious activity may result in:
      </p>
      <ul>
        <li>Temporary account restrictions</li>
        <li>Request for additional verification</li>
        <li>Account termination</li>
        <li>Voluntary reporting to authorities (if required by law)</li>
      </ul>

      <h2 id="data-privacy-and-retention">6. Data Privacy & Retention</h2>
      <p>
        Verification data is handled in accordance with the Privacy Act 2020:
      </p>
      <ul>
        <li>Personal data is encrypted at rest and in transit</li>
        <li>Only necessary data is collected (data minimization principle)</li>
        <li>Data is retained for 7 years after account closure (as per AML/CFT Act Section 48)</li>
        <li>Users can request access to their verification data</li>
        <li>Verification data is not shared with third parties except as required by law</li>
      </ul>

      <h2 id="exemptions-and-special-cases">7. Exemptions & Special Cases</h2>
      <h3>7.1 Recurring Transactions</h3>
      <p>
        Users who conduct multiple transactions that individually are under NZD $1,000 but collectively exceed this threshold may be required to complete Tier 2 verification.
      </p>
      <h3>7.2 Suspicious Activity</h3>
      <p>
        BitRegalo reserves the right to require verification at any tier if suspicious activity is detected, regardless of transaction value.
      </p>
      <h3>7.3 Sanctioned Jurisdictions</h3>
      <p>
        Users from sanctioned countries or territories may be subject to enhanced verification or restricted from using the Platform.
      </p>

      <h2 id="user-rights">8. User Rights</h2>
      <p>
        Under the Privacy Act 2020, users have the right to:
      </p>
      <ul>
        <li>Access their verification data</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion of verification data (subject to legal retention requirements)</li>
        <li>Complain to the Privacy Commissioner if they believe their privacy has been breached</li>
      </ul>

      <h2 id="changes-to-this-policy">9. Changes to This Policy</h2>
      <p>
        BitRegalo may update this policy from time to time. Material changes will be notified via email or Platform announcement. Continued use of the Platform after changes constitutes acceptance of the updated policy.
      </p>

      <h2 id="contact-information">10. Contact Information</h2>
      <p>
        For questions about this KYC Policy or verification requirements, please contact BitRegalo® Limited through our official website or support channels.
      </p>
      <p>
        <strong>BitRegalo® Limited</strong><br />
        Website: bitregalo.com
      </p>
    </DocPage>
  )
}
