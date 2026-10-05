import type { Metadata } from "next"
import Link from "next/link"
import { DocNotice, DocPage } from "@/components/site/doc-page"

export const metadata: Metadata = {
  title: "Tokens",
  description: "BitRegalo has no token of its own and sells none, anywhere. What that means, and how tokens issued by organisations work.",
}

export default function TokenTermsPage() {
  return (
    <DocPage
      title={"Tokens"}
      updated={<>Last updated: 5 October 2026</>}
      meta={"BitRegalo® Limited | New Zealand"}
    >
      <DocNotice title="The short version">
        <p>
          BitRegalo has no token of its own. It has not issued one and sells none, anywhere.
        </p>
      </DocNotice>

      <h2 id="no-bitregalo-token">No BitRegalo token</h2>
      <p>
        BitRegalo has no token of its own. It has not issued one and sells none, anywhere. BitRegalo is paid for the use of its infrastructure, and those fees are paid in the tokens people already use to pay.
      </p>
      <p>
        If BitRegalo ever issues a token, it will be issued through its own platform and announced on this site first. Anything offered elsewhere in BitRegalo&apos;s name is not from BitRegalo.
      </p>

      <h2 id="earlier-documents">Earlier documents</h2>
      <p>
        Earlier documents, including earlier versions of the whitepaper and of this page, described tokens called BTR and Regalo. Those documents are superseded. The current <Link href="/whitepaper">whitepaper</Link> and this page replace them.
      </p>

      <h2 id="tokens-issued-by-organisations">Tokens issued by organisations</h2>
      <p>
        An organisation can issue its own utility tokens inside its workspace, such as vouchers, credits and memberships. Those tokens belong to the organisation that issues them, not to BitRegalo. The organisation is responsible for them, including what they stand for, how they are sold and redeemed, and the laws that apply to them.
      </p>

      <h2 id="practice-network">The practice network</h2>
      <p>
        BitRegalo runs only on a public test network (BNB Smart Chain Testnet), which the app calls the practice network. Tokens on the practice network have no value. That includes the practice tokens the app gives out and any token an organisation creates there.
      </p>

      <h2 id="not-an-offer-not-advice">Not an offer, not advice</h2>
      <p>
        Nothing on this site is an offer of a financial product, and nothing on this site is financial advice.
      </p>

      <h2 id="contact-information">Contact</h2>
      <p>
        For questions about this page, please contact BitRegalo® Limited through the <Link href="/contact">contact page</Link> on our website. The <Link href="/terms">Terms of Service</Link> apply to your use of the site and the app.
      </p>
      <p>
        <strong>BitRegalo® Limited</strong><br />
        Website: bitregalo.com
      </p>
    </DocPage>
  )
}
