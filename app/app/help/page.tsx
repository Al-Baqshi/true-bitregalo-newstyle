import type { Metadata } from "next"
import Link from "next/link"
import { PageHead, Section } from "@/components/app/ui"
import { HowItWorks, SettleModes, Glossary } from "@/components/app/explain"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: { absolute: "Help · BitRegalo App" } }

export default function Help() {
  return (
    <div className="space-y-14">
      <PageHead
        title="Help"
        intro="How BitRegalo works, in plain language. None of it needs blockchain knowledge: your wallet signs each step, and the record is public."
        action={<Button asChild variant="secondary"><Link href="/whitepaper">Read the whitepaper</Link></Button>}
      />

      <Section title="How it works" description="Four steps, the same every time." className="scroll-mt-24" >
        <div id="how" className="scroll-mt-24"><HowItWorks /></div>
      </Section>

      <Section title="Three ways to settle" description="You choose one for each request or listing.">
        <div id="settle" className="scroll-mt-24"><SettleModes /></div>
      </Section>

      <Section title="Before you start">
        <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="t-subheading">You need a wallet</dt>
            <dd className="mt-1 text-sm text-muted-foreground">A wallet such as MetaMask is how you sign in and approve each step. BitRegalo never holds your keys or your money.</dd>
          </div>
          <div>
            <dt className="t-subheading">This is a practice network</dt>
            <dd className="mt-1 text-sm text-muted-foreground">Everything runs on BNB Smart Chain Testnet. The money has no value, and the faucet gives 1,000 tUSD a day so you can try every step.</dd>
          </div>
          <div>
            <dt className="t-subheading">Nothing happens until you sign</dt>
            <dd className="mt-1 text-sm text-muted-foreground">Every wizard ends with a review. If a step fails, what came before it is already done, and signing again continues from there.</dd>
          </div>
          <div>
            <dt className="t-subheading">Everything is on the record</dt>
            <dd className="mt-1 text-sm text-muted-foreground">Requests, offers, choices and payments are written to a public blockchain. Private wording keeps the text private, not the amounts.</dd>
          </div>
        </dl>
      </Section>

      <Section title="Words we use">
        <div id="glossary" className="scroll-mt-24"><Glossary /></div>
      </Section>
    </div>
  )
}
