import type { Metadata } from "next"
import Link from "next/link"
import { DocNotice, DocPage } from "@/components/site/doc-page"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What information the BitRegalo website, web app and marketplace index process",
}

export default function PrivacyPage() {
  return (
    <DocPage
      title={"Privacy Policy"}
      updated={<>Last updated: 5 October 2026</>}
      meta={"BitRegalo® Limited | New Zealand"}
    >
      <DocNotice title="Privacy Commitment">
        <p>
          BitRegalo® Limited aims to handle personal information in line with the New Zealand Privacy Act 2020. This policy explains what information the website, the web app and the marketplace index process, and what they do not.
        </p>
      </DocNotice>

      <h2 id="what-we-do-not-collect">1. What We Do Not Collect</h2>
      <p>
        BitRegalo has no accounts and no email sign-up. You use the app with your own wallet.
      </p>
      <ul>
        <li>We do not ask for your name, email address or a password to use the app</li>
        <li>We do not collect identity documents. No identity verification is built into the app today (see <Link href="/kyc-policy">Identity checks</Link>)</li>
        <li>We never hold your tokens or your wallet keys</li>
      </ul>

      <h2 id="public-network-data">2. Public Network Data</h2>
      <p>
        BitRegalo&apos;s contracts run on a public network. Everything written to a public network is public and anyone can read it. This includes:
      </p>
      <ul>
        <li>Wallet addresses</li>
        <li>Amounts, tokens and times of transactions</li>
        <li>Records of requests, offers, awards, listings, payments, sales and redemptions, and any reference attached to them</li>
      </ul>
      <p>
        This data is part of the public ledger. It cannot be edited or deleted by BitRegalo or by anyone else. The app reads it directly from the network. To do that, your browser and your wallet connect to network nodes run by third parties, which can see technical information such as your IP address.
      </p>

      <h2 id="what-your-browser-stores">3. What Your Browser Stores</h2>
      <p>
        The app keeps a small amount of information in your own browser&apos;s storage:
      </p>
      <ul>
        <li>Names you give to workspaces</li>
        <li>Preferences, such as light or dark theme and which explanations you have hidden</li>
        <li>Which wallet you last connected</li>
      </ul>
      <p>
        This stays on your device. You can remove it at any time by clearing the site&apos;s data in your browser settings.
      </p>

      <h2 id="marketplace-index">4. The Marketplace Index</h2>
      <p>
        The marketplace index is a service BitRegalo runs. It stores the description of a request or listing when the wallet that owns the record signs and publishes it:
      </p>
      <ul>
        <li>Title and description</li>
        <li>Category</li>
        <li>Country and city</li>
        <li>The wallet address that published it, and the times it was published and updated</li>
      </ul>
      <p>
        The index keeps these beside details of the record that it reads from the public network. Everything in the index is published. Anyone can read and search it. The owner of a record can replace its description. Do not put personal information in a description unless you want it to be public.
      </p>

      <h2 id="contacting-us">5. Contacting Us</h2>
      <p>
        The site has no contact form. The <Link href="/contact">contact page</Link> gives an email address and a phone number. If you write to us or call us, we receive what you choose to tell us, such as your email address, your phone number and your message, and we use it to reply to you.
      </p>

      <h2 id="technical-information">6. Technical Information</h2>
      <p>
        Like most websites, the services that host this site and the marketplace index process technical information when your browser connects to them, such as IP address, browser type and device type. The site also uses Vercel Web Analytics to count visits to its pages.
      </p>
      <p>
        The site does not use cookies to sign you in, because there is no sign-in.
      </p>

      <h2 id="how-we-use-information">7. How We Use Information</h2>
      <ul>
        <li>To show the site and run the app</li>
        <li>To run the marketplace index</li>
        <li>To reply when you contact us</li>
        <li>To understand how the site is used and keep it working</li>
      </ul>

      <h2 id="disclosure-of-information">8. Disclosure of Information</h2>
      <p>
        We do NOT sell, trade, or rent your personal information. We may disclose information only in the following circumstances:
      </p>
      <ul>
        <li>
          <strong>Service Providers:</strong> Third-party providers who perform services on our behalf, such as hosting and analytics.
        </li>
        <li>
          <strong>Legal Requirements:</strong> When required by law, court order, or government authority.
        </li>
        <li>
          <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.
        </li>
        <li>
          <strong>With Your Consent:</strong> When you explicitly authorise disclosure.
        </li>
        <li>
          <strong>Protection of Rights:</strong> To protect the rights, property, or safety of BitRegalo, users, or the public.
        </li>
      </ul>
      <p>
        Public network data and the marketplace index are public already, as described above.
      </p>

      <h2 id="storage-and-security">9. Storage & Security</h2>
      <p>
        We take reasonable steps to protect the information we hold. However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security. BitRegalo&apos;s contracts have not been independently audited.
      </p>

      <h2 id="data-retention">10. Data Retention</h2>
      <ul>
        <li><strong>Public network data:</strong> Permanent. It cannot be deleted because it is part of a public ledger.</li>
        <li><strong>Marketplace index:</strong> A description stays published in the index. Its owner can replace it.</li>
        <li><strong>Browser storage:</strong> Until you clear it.</li>
        <li><strong>Messages you send us:</strong> Kept with our business correspondence.</li>
      </ul>

      <h2 id="your-rights">11. Your Rights</h2>
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
          <strong>Deletion:</strong> You may request deletion of personal information we hold about you.
        </li>
        <li>
          <strong>Objection:</strong> You may object to certain processing of your information.
        </li>
        <li>
          <strong>Data Portability:</strong> You may request a copy of your information in a portable format.
        </li>
      </ul>
      <p>
        Data on the public network cannot be changed or deleted by us or by anyone else.
      </p>
      <p>
        To exercise these rights, contact us at privacy@bitregalo.com.
      </p>

      <h2 id="international-data-transfers">12. International Data Transfers</h2>
      <p>
        The public network, the marketplace index and the services that host this site may operate in countries other than New Zealand. Your information may be processed in those countries, which may have different data protection laws.
      </p>

      <h2 id="childrens-privacy">13. Children&apos;s Privacy</h2>
      <p>
        BitRegalo is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us and we will delete it where we are able to.
      </p>

      <h2 id="data-breaches">14. Data Breaches</h2>
      <p>
        In the event of a privacy breach that poses a risk of serious harm, we will:
      </p>
      <ul>
        <li>Notify the Privacy Commissioner as soon as practicable</li>
        <li>Notify affected individuals as soon as practicable</li>
        <li>Take steps to contain the breach and prevent further harm</li>
        <li>Investigate the cause and implement corrective measures</li>
      </ul>

      <h2 id="third-party-links">15. Third-Party Services and Links</h2>
      <p>
        Your wallet, the network and its block explorers are run by third parties, and the site may link to other third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
      </p>

      <h2 id="changes-to-this-policy">16. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will be posted on this page. Your continued use of the site and the app after changes constitutes acceptance of the updated policy.
      </p>

      <h2 id="complaints">17. Complaints</h2>
      <p>
        If you believe your privacy has been breached, you may:
      </p>
      <ul>
        <li>Contact us directly to resolve the issue</li>
        <li>Complain to the New Zealand Privacy Commissioner</li>
        <li>Visit: www.privacy.org.nz or call 0800 803 734</li>
      </ul>

      <h2 id="contact-information">18. Contact Information</h2>
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
