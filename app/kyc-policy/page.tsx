import type { Metadata } from "next"
import Link from "next/link"
import { DocNotice, DocPage } from "@/components/site/doc-page"

export const metadata: Metadata = {
  title: "Identity checks",
  description: "What identity checks exist in BitRegalo today, and what the contracts allow a workspace to require",
}

export default function KYCPolicyPage() {
  return (
    <DocPage
      title={"Identity checks"}
      updated={<>Last updated: 5 October 2026</>}
    >
      <DocNotice title="Present position">
        <p>
          No identity verification (often called KYC) is built into the BitRegalo app today. BitRegalo does not ask for identity documents, and no verification provider is connected.
        </p>
      </DocNotice>

      <h2 id="today">1. What Is True Today</h2>
      <ul>
        <li>The app has no identity check. People use it with their own wallets.</li>
        <li>BitRegalo has no accounts and no email sign-up.</li>
        <li>BitRegalo runs only on a public test network (BNB Smart Chain Testnet), where tokens have no value.</li>
      </ul>

      <h2 id="what-the-contracts-allow">2. What the Contracts Allow</h2>
      <p>
        The contracts allow a workspace to require an identity attestation: a signed statement that a wallet has passed an identity check. No provider is connected to carry out such checks, so this is not in use in the app today.
      </p>

      <h2 id="organisations">3. Organisations Remain Responsible</h2>
      <p>
        Law differs by country. An organisation that uses BitRegalo remains responsible for its own obligations, including any duty it has to identify the people it deals with. BitRegalo does not carry out those checks for it.
      </p>

      <h2 id="before-main-network">4. Before Any Main-Network Launch</h2>
      <p>
        This page describes the position on 5 October 2026. It will be updated before any launch on a main network.
      </p>

      <h2 id="privacy">5. Privacy</h2>
      <p>
        The <Link href="/privacy">Privacy Policy</Link> describes what information the site, the app and the marketplace index process.
      </p>

      <h2 id="contact-information">6. Contact Information</h2>
      <p>
        For questions about this page, please contact BitRegalo® Limited through the <Link href="/contact">contact page</Link> on our website.
      </p>
      <p>
        <strong>BitRegalo® Limited</strong><br />
        Website: bitregalo.com
      </p>
    </DocPage>
  )
}
