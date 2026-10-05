import type { Metadata } from "next"
import Link from "next/link"
import { DocNotice, DocPage } from "@/components/site/doc-page"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for the BitRegalo website, web app and public contracts",
}

export default function TermsPage() {
  return (
    <DocPage
      title={"Terms of Service"}
      updated={<>Last updated: 5 October 2026</>}
      meta={"BitRegalo® Limited | New Zealand"}
    >
      <DocNotice title="Important Notice">
        <p>
          These Terms cover your use of the BitRegalo website, web app and public contracts. BitRegalo® Limited is a technology company providing decentralised infrastructure for records and payment commitments. It is not a financial institution or a payment service. BitRegalo runs only on a public test network, where tokens have no value. It has not been independently audited. BitRegalo has not issued a token and is not offering one.
        </p>
      </DocNotice>

      <h2 id="acceptance-of-terms">1. Acceptance of Terms</h2>
      <p>
        By accessing or using the BitRegalo website, web app or public contracts (&quot;the Platform&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Platform. These Terms constitute a legally binding agreement between you and BitRegalo® Limited.
      </p>

      <h2 id="platform-description">2. What BitRegalo Is</h2>
      <p>
        BitRegalo is infrastructure. It is software and a set of public contracts that provide:
      </p>
      <ul>
        <li>Records that nobody can edit or delete once they are written</li>
        <li>Payment commitments with fixed outcomes: a payment held in escrow, or a payment settled directly</li>
        <li>Requests and listings, with offers, awards and the records of each</li>
        <li>Workspaces: each organisation gets its own contracts</li>
        <li>A web app, which is a reference implementation of the contracts</li>
        <li>A marketplace index that stores descriptions a wallet owner signs and publishes</li>
      </ul>
      <p>
        <strong>Important:</strong> BitRegalo provides technology only. Nothing on this site or in the app is financial, legal, tax or investment advice.
      </p>

      <h2 id="test-network-and-status">3. Test Network and Status</h2>
      <ul>
        <li>BitRegalo runs only on a public test network (BNB Smart Chain Testnet). Tokens on that network have no value.</li>
        <li>The contracts have not been independently audited.</li>
        <li>The software is still being developed and may change.</li>
      </ul>

      <h2 id="tokens">4. Tokens</h2>
      <p>
        BitRegalo has no token of its own. It has not issued one and sells none, anywhere. Earlier documents that described BTR or Regalo tokens are superseded.
      </p>
      <p>
        An organisation may issue its own utility tokens (vouchers, credits, memberships) inside its workspace. Those tokens belong to the organisation that issues them, not to BitRegalo, and that organisation is responsible for them. See <Link href="/token-terms">Tokens</Link>.
      </p>

      <h2 id="wallets-and-custody">5. Wallets and Custody</h2>
      <p>
        BitRegalo has no accounts and no email sign-up. You use the Platform with your own wallet, and every action is a transaction you sign.
      </p>
      <ul>
        <li>BitRegalo never holds your tokens or your keys</li>
        <li>You are solely responsible for safeguarding your wallet and private keys</li>
        <li>You are responsible for everything signed with your wallet</li>
        <li>BitRegalo cannot recover a lost wallet or lost tokens, and cannot reverse a signed transaction</li>
      </ul>

      <h2 id="escrow-and-held-payments">6. Escrow and Held Payments</h2>
      <p>
        A payment placed in escrow is held by a public contract, not by BitRegalo. It has fixed outcomes:
      </p>
      <ul>
        <li>The buyer can release it to the supplier</li>
        <li>The supplier can hand it back to the buyer</li>
        <li>After the deadline it can be returned to the buyer, once someone sends the transaction that triggers the return</li>
      </ul>
      <p>
        None of these happens by itself. Each one is a transaction that a person signs. Transactions on a public network are final and cannot be reversed. You are responsible for checking the details of a transaction before you sign it.
      </p>
      <p>
        BitRegalo is not a party to the payment and does not decide its outcome. BitRegalo is not liable for losses resulting from smart contract failures, user error, or disputes between parties.
      </p>

      <h2 id="fees">7. Fees</h2>
      <p>
        The contracts charge the following fees:
      </p>
      <ul>
        <li>A platform fee, which is a percentage of a payment</li>
        <li>A service fee, which is a flat amount per payment</li>
        <li>A launch fee when an organisation creates a workspace</li>
        <li>A fee when an organisation creates a token</li>
      </ul>
      <p>
        On the test network these fees are paid in test tokens, which have no value.
      </p>

      <h2 id="user-responsibilities">8. Your Responsibilities</h2>
      <p>
        You agree to use the Platform only for lawful purposes and in compliance with all applicable laws. You agree NOT to:
      </p>
      <ul>
        <li>Use the Platform for money laundering, terrorist financing, or illegal activities</li>
        <li>Provide false or misleading information, including in anything you publish to the marketplace index</li>
        <li>Engage in fraudulent transactions or misrepresent goods or services</li>
        <li>Violate the intellectual property rights or privacy of others</li>
        <li>Violate sanctions, export controls, or trade restrictions</li>
        <li>Attempt to exploit vulnerabilities in the contracts</li>
        <li>Harass, threaten, or defame other users</li>
        <li>Interfere with Platform operations or security measures</li>
      </ul>
      <p>
        Anything you publish to the marketplace index is signed by your wallet and is public. You are responsible for what you publish.
      </p>

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
        <li>WARRANTIES REGARDING THE VALUE, LIQUIDITY, OR FUTURE USE OF ANY TOKEN</li>
        <li>WARRANTIES THAT THE PLATFORM WILL MEET YOUR REQUIREMENTS OR EXPECTATIONS</li>
      </ul>
      <p>
        Blockchain technology involves inherent risks including technical failures, regulatory changes, and market volatility. The contracts have not been independently audited. You use the Platform at your own risk.
      </p>

      <h2 id="limitation-of-liability">11. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, BITREGALO AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUES, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM: (A) YOUR USE OR INABILITY TO USE THE PLATFORM; (B) ANY TRANSACTIONS CONDUCTED THROUGH THE PLATFORM; (C) ANY LOSS OR THEFT OF TOKENS OR DIGITAL ASSETS; (D) ANY UNAUTHORISED ACCESS TO YOUR WALLET; (E) ANY SMART CONTRACT FAILURES OR BUGS; (F) ANY REGULATORY CHANGES AFFECTING THE PLATFORM OR TOKENS.
      </p>
      <p>
        IN NO EVENT SHALL BITREGALO&apos;S TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO BITREGALO IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
      </p>

      <h2 id="indemnification">12. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless BitRegalo and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising from: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any rights of another party; (d) any illegal or unauthorised activities conducted with your wallet.
      </p>

      <h2 id="dispute-resolution">13. Disputes Between Users</h2>
      <p>
        A dispute between a buyer and a supplier is for the two of them to resolve. BitRegalo is not a party to disputes between users and has no obligation to resolve them. BitRegalo does not offer a mediation or arbitration service. The only outcomes for a held payment are the ones described in section 6.
      </p>

      <h2 id="termination">14. Suspension of Access</h2>
      <p>
        We may suspend or restrict access to the website and the web app immediately, without prior notice, for any reason, including breach of these Terms, suspicious activity, or regulatory requirements. Records already written to the public network are not changed by this.
      </p>

      <h2 id="modifications-to-terms">15. Modifications to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. Material changes will be posted on this site. Your continued use of the Platform after modifications constitutes acceptance of the updated Terms. If you do not agree to the modified Terms, you must discontinue use of the Platform.
      </p>

      <h2 id="governing-law-and-jurisdiction">16. Governing Law & Jurisdiction</h2>
      <p>
        These Terms are governed by the laws of New Zealand. Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts of New Zealand. You consent to the personal jurisdiction of such courts.
      </p>

      <h2 id="law-and-your-obligations">17. Law and Your Obligations</h2>
      <p>
        BitRegalo® Limited is a New Zealand company and intends to operate in line with the New Zealand law that applies to it. Law differs by country. Users, and organisations that run a workspace, are responsible for compliance with the laws that apply to them in their own jurisdictions.
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
        For questions about these Terms, please contact BitRegalo® Limited through the <Link href="/contact">contact page</Link> on our website.
      </p>
      <p>
        <strong>BitRegalo® Limited</strong><br />
        Website: bitregalo.com
      </p>
    </DocPage>
  )
}
