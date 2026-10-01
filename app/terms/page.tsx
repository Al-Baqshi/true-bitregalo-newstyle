import type { Metadata } from "next"
import { DocNotice, DocPage } from "@/components/site/doc-page"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for BitRegalo platform and utility tokens",
}

export default function TermsPage() {
  return (
    <DocPage
      title={"Terms of Service"}
      updated={<>Last updated: {new Date().toLocaleDateString()}</>}
      meta={"BitRegalo® Limited | New Zealand"}
    >
      <DocNotice title="Important Notice">
        <p>
          These Terms govern your use of the BitRegalo platform, a technology service providing marketplace infrastructure and utility tokens. BitRegalo is NOT a financial institution, reporting entity, or issuer of financial products. BTR and Regalo tokens are utility credits for platform access only.
        </p>
      </DocNotice>

      <h2 id="acceptance-of-terms">1. Acceptance of Terms</h2>
      <p>
        By accessing or using BitRegalo (&quot;the Platform&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Platform. These Terms constitute a legally binding agreement between you and BitRegalo® Limited.
      </p>

      <h2 id="platform-description">2. Platform Description</h2>
      <p>
        BitRegalo is a decentralized technology platform that provides:
      </p>
      <ul>
        <li>Marketplace infrastructure for gift and service exchanges</li>
        <li>Smart contract deployment tools (Smart Contract as a Service)</li>
        <li>Conditional payment processing via escrow smart contracts</li>
        <li>Request for Proposal (RFP) and Request to Supply (RTS) protocols</li>
        <li>Utility tokens (BTR and Regalo) for platform access</li>
      </ul>
      <p>
        <strong>Important:</strong> BitRegalo provides technology services only. We do not provide financial services, investment advice, or operate as a reporting entity under the AML/CFT Act 2009.
      </p>

      <h2 id="utility-tokens-btr-and-regalo">3. Utility Tokens (BTR & Regalo)</h2>
      <p>
        BTR and Regalo tokens are <strong>prepaid utility credits</strong> that provide access to Platform services. By acquiring or using tokens, you acknowledge and agree:
      </p>
      <ul>
        <li>Tokens are utility instruments, NOT securities, financial products, or investment contracts</li>
        <li>Tokens provide access to Platform features (escrow, RFP, marketplace) only</li>
        <li>No expectation of profit, dividend, or investment return is created</li>
        <li>Token value may fluctuate based on market conditions; you bear all risk of loss</li>
        <li>BitRegalo makes no guarantees regarding token value, liquidity, or future utility</li>
        <li>Tokens are non-refundable once used for Platform services</li>
        <li>You are solely responsible for securing your tokens and wallet credentials</li>
      </ul>
      <p>
        Tokens do not represent equity, ownership, or any claim against BitRegalo® Limited.
      </p>

      <h2 id="user-classification-and-verification">4. User Classification & Verification</h2>
      <p>
        The Platform classifies users into different categories with varying verification requirements:
      </p>
      <h3>4.1 Gifters (Buyers)</h3>
      <p>
        Users who purchase gifts or services through the Platform.
      </p>
      <ul>
        <li><strong>Transactions under NZD $1,000:</strong> No identity verification required</li>
        <li><strong>Transactions NZD $1,000 or above:</strong> Basic identity verification required</li>
        <li>Basic verification: Email confirmation and government-issued ID</li>
      </ul>
      <h3>4.2 Service Providers</h3>
      <p>
        Users who offer services or products through the Platform.
      </p>
      <ul>
        <li><strong>Full identity verification required</strong> (KYC/CDD)</li>
        <li>Required documents: Government-issued ID, proof of address, business registration (if applicable)</li>
        <li>Service providers are responsible for tax reporting on income received</li>
        <li>Service providers establish a &quot;business relationship&quot; with BitRegalo</li>
      </ul>
      <h3>4.3 Enterprise Clients</h3>
      <p>
        Organizations using Platform services for business operations.
      </p>
      <ul>
        <li><strong>Enhanced due diligence required</strong></li>
        <li>Corporate documents, beneficial ownership information, compliance certifications</li>
        <li>Ongoing monitoring and periodic re-verification</li>
      </ul>

      <h2 id="escrow-and-conditional-payments">5. Escrow & Conditional Payments</h2>
      <p>
        The Platform provides escrow smart contracts for conditional payment processing:
      </p>
      <ul>
        <li>Funds are held in smart contracts, not BitRegalo accounts</li>
        <li>Release conditions are automated and executed by code, not human discretion</li>
        <li>BitRegalo does not act as a licensed escrow agent or financial intermediary</li>
        <li>Escrow is a Platform feature, not a financial service</li>
        <li>Users are responsible for verifying transaction details before confirming</li>
        <li>Disputes are resolved through Platform mediation, not legal arbitration</li>
      </ul>
      <p>
        BitRegalo is not liable for losses resulting from smart contract failures, user error, or disputes between parties.
      </p>

      <h2 id="user-responsibilities">6. User Responsibilities</h2>
      <p>
        You agree to use the Platform only for lawful purposes and in compliance with all applicable laws. You agree NOT to:
      </p>
      <ul>
        <li>Use the Platform for money laundering, terrorist financing, or illegal activities</li>
        <li>Circumvent verification requirements or provide false information</li>
        <li>Engage in fraudulent transactions or misrepresent goods/services</li>
        <li>Violate intellectual property rights or privacy of others</li>
        <li>Attempt to manipulate token prices or engage in market abuse</li>
        <li>Use the Platform in sanctioned countries or by sanctioned individuals</li>
        <li>Interfere with Platform operations or security measures</li>
      </ul>

      <h2 id="account-registration-and-security">7. Account Registration & Security</h2>
      <p>
        To access certain Platform features, you must register an account. You agree to:
      </p>
      <ul>
        <li>Provide accurate, current, and complete information</li>
        <li>Maintain the security of your account credentials and private keys</li>
        <li>Accept responsibility for all activities under your account</li>
        <li>Notify us immediately of any unauthorized access or security breaches</li>
        <li>Comply with verification requirements for your user classification</li>
      </ul>
      <p>
        You are solely responsible for safeguarding your wallet, private keys, and tokens. BitRegalo cannot recover lost tokens or reverse unauthorized transactions.
      </p>

      <h2 id="prohibited-activities">8. Prohibited Activities</h2>
      <p>
        The following activities are strictly prohibited and may result in account termination:
      </p>
      <ul>
        <li>Money laundering or structuring transactions to avoid reporting thresholds</li>
        <li>Providing false or misleading identity information</li>
        <li>Using the Platform for illegal goods, services, or activities</li>
        <li>Engaging in deceptive practices or fraud</li>
        <li>Violating sanctions, export controls, or trade restrictions</li>
        <li>Attempting to exploit smart contract vulnerabilities</li>
        <li>Harassing, threatening, or defaming other users</li>
      </ul>

      <h2 id="intellectual-property">9. Intellectual Property</h2>
      <p>
        The Platform, including all content, features, and functionality, is owned by BitRegalo® Limited and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission. You retain ownership of content you submit to the Platform.
      </p>

      <h2 id="disclaimers">10. Disclaimers</h2>
      <p>
        THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING:
      </p>
      <ul>
        <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
        <li>WARRANTIES THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE</li>
        <li>WARRANTIES REGARDING TOKEN VALUE, LIQUIDITY, OR FUTURE UTILITY</li>
        <li>WARRANTIES THAT THE PLATFORM WILL MEET YOUR REQUIREMENTS OR EXPECTATIONS</li>
      </ul>
      <p>
        Blockchain technology involves inherent risks including technical failures, regulatory changes, and market volatility. You use the Platform at your own risk.
      </p>

      <h2 id="limitation-of-liability">11. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, BITREGALO AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUES, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM: (A) YOUR USE OR INABILITY TO USE THE PLATFORM; (B) ANY TRANSACTIONS CONDUCTED THROUGH THE PLATFORM; (C) ANY LOSS OR THEFT OF TOKENS OR DIGITAL ASSETS; (D) ANY UNAUTHORIZED ACCESS TO YOUR ACCOUNT; (E) ANY SMART CONTRACT FAILURES OR BUGS; (F) ANY REGULATORY CHANGES AFFECTING THE PLATFORM OR TOKENS.
      </p>
      <p>
        IN NO EVENT SHALL BITREGALO&apos;S TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO BITREGALO IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
      </p>

      <h2 id="indemnification">12. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless BitRegalo and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising from: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any rights of another party; (d) any illegal or unauthorized activities conducted through your account.
      </p>

      <h2 id="dispute-resolution">13. Dispute Resolution</h2>
      <p>
        Disputes between users regarding transactions shall be resolved through:
      </p>
      <ul>
        <li>Direct negotiation between parties</li>
        <li>Platform-mediated resolution (if requested)</li>
        <li>Escrow smart contract automated release (if conditions met)</li>
      </ul>
      <p>
        BitRegalo is not a party to disputes between users and has no obligation to resolve disputes. Platform mediation is provided as a courtesy and is not legally binding.
      </p>

      <h2 id="termination">14. Termination</h2>
      <p>
        We may terminate or suspend your account and access to the Platform immediately, without prior notice, for any reason, including breach of these Terms, suspicious activity, or regulatory requirements. Upon termination, your right to use the Platform ceases. Unused tokens may be forfeited at our discretion.
      </p>

      <h2 id="modifications-to-terms">15. Modifications to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. Material changes will be notified via email or Platform announcement. Your continued use of the Platform after modifications constitutes acceptance of the updated Terms. If you do not agree to the modified Terms, you must discontinue use of the Platform.
      </p>

      <h2 id="governing-law-and-jurisdiction">16. Governing Law & Jurisdiction</h2>
      <p>
        These Terms are governed by the laws of New Zealand. Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts of New Zealand. You consent to the personal jurisdiction of such courts.
      </p>

      <h2 id="regulatory-compliance">17. Regulatory Compliance</h2>
      <p>
        BitRegalo operates in compliance with applicable New Zealand laws:
      </p>
      <ul>
        <li><strong>AML/CFT Act 2009:</strong> BitRegalo is not a reporting entity but implements voluntary CDD for high-risk scenarios</li>
        <li><strong>FMC Act 2013:</strong> Tokens are utility credits, not financial products</li>
        <li><strong>Privacy Act 2020:</strong> Data handling complies with Information Privacy Principles</li>
        <li><strong>Fair Trading Act 1986:</strong> No misleading conduct or false representations</li>
      </ul>
      <p>
        Users are responsible for compliance with laws in their own jurisdictions.
      </p>

      <h2 id="severability">18. Severability</h2>
      <p>
        If any provision of these Terms is held to be invalid or unenforceable, such provision shall be struck and the remaining provisions shall remain in full force and effect.
      </p>

      <h2 id="entire-agreement">19. Entire Agreement</h2>
      <p>
        These Terms, together with the Privacy Policy and any additional agreements you may enter into with BitRegalo, constitute the entire agreement between you and BitRegalo regarding the Platform and supersede all prior agreements and understandings.
      </p>

      <h2 id="contact-information">20. Contact Information</h2>
      <p>
        For questions about these Terms, please contact BitRegalo® Limited through our official website or support channels.
      </p>
      <p>
        <strong>BitRegalo® Limited</strong><br />
        Website: bitregalo.com
      </p>
    </DocPage>
  )
}
