import type { Metadata } from "next"
import Link from "next/link"
import { PageHead, Section } from "@/components/app/ui"
import { BuildingBlocks, Glossary, HowItWorks, SettleModes, TwoWays } from "@/components/app/explain"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: { absolute: "Help · BitRegalo App" } }

export default function Help() {
  return (
    <div className="space-y-14">
      <PageHead
        title="Help"
        intro="How BitRegalo works, in plain words. You need no blockchain knowledge: your wallet signs each step, and the record is public."
        action={<Button asChild variant="secondary"><Link href="/whitepaper">Read the whitepaper</Link></Button>}
      />

      <Section title="Two ways to use BitRegalo" description="The open network for everyone, and workspaces for organisations. Both run on the same public contracts.">
        <div id="model" className="scroll-mt-24"><TwoWays /></div>
        <p className="mt-4 max-w-[66ch] text-sm text-muted-foreground">
          The place switcher at the top of the app shows where you are. Anything you start on the network is recorded on the network;
          anything you start inside a workspace is recorded under that workspace.{" "}
          <Link href="/app/workspaces" className="text-gold underline underline-offset-4">See the workspaces</Link>.
        </p>
      </Section>

      <Section title="The building blocks" description="The same on the network and in every workspace.">
        <div id="blocks" className="scroll-mt-24"><BuildingBlocks /></div>
      </Section>

      <Section title="How a request works" description="Four steps, the same every time.">
        <div id="how" className="scroll-mt-24"><HowItWorks /></div>
      </Section>

      <Section title="Three ways to settle" description="Chosen for each request or listing.">
        <div id="settle" className="scroll-mt-24"><SettleModes /></div>
      </Section>

      <Section title="Before you start">
        <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="t-subheading">You need a wallet</dt>
            <dd className="mt-1 text-sm text-muted-foreground">A wallet such as MetaMask is how you sign in and approve each step. BitRegalo never holds your keys or your funds.</dd>
          </div>
          <div>
            <dt className="t-subheading">This is a practice network</dt>
            <dd className="mt-1 text-sm text-muted-foreground">Everything runs on BNB Smart Chain Testnet. Its tokens have no value, and the faucet gives 1,000 tUSD a day so you can try every step.</dd>
          </div>
          <div>
            <dt className="t-subheading">Nothing happens until you sign</dt>
            <dd className="mt-1 text-sm text-muted-foreground">Every guided task ends with a review. If a step fails, what came before it is already done, and signing again continues from there.</dd>
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
