import type { Metadata } from "next"
import Link from "next/link"
import { Notice, PageHead, Section } from "@/components/app/ui"
import { BuildingBlocks, Glossary, HowItWorks, SettleModes, ThreeWays } from "@/components/app/explain"
import { Button } from "@/components/ui/button"
import { chain } from "@/lib/bitregalo/config"

export const metadata: Metadata = { title: { absolute: "Help · BitRegalo App" } }

export default function Help() {
  return (
    <div className="space-y-14">
      <PageHead
        title="Help"
        intro="What BitRegalo is and how this app works, in plain words. You need no blockchain knowledge: your wallet signs each step, and the record is public."
        action={
          <>
            <Button asChild variant="secondary"><Link href="/app/connect">Connect a platform</Link></Button>
            <Button asChild variant="ghost"><Link href="/whitepaper">Read the whitepaper</Link></Button>
          </>
        }
      />

      <Section title="What BitRegalo is">
        <div className="max-w-[66ch] space-y-3 text-base text-muted-foreground">
          <p>
            BitRegalo is infrastructure that a platform already taking payments connects to. It gives that platform two things:{" "}
            <span className="font-[560] text-foreground">records nobody can edit</span> afterwards, the platform&apos;s own developers and
            BitRegalo included, and <span className="font-[560] text-foreground">payment commitments that execute exactly as agreed</span>{" "}
            when they are triggered, such as a payment held until the work is done or handed back to the buyer.
          </p>
          <p>
            This app is the reference implementation and BitRegalo&apos;s own public workspace. It is not the whole product: an
            organisation can do everything here from its own site, app or back office.
          </p>
        </div>
      </Section>

      <Section title="Three ways to use BitRegalo" description="In this order. All three use the same public contracts, and each organisation gets its own set of them, called a workspace.">
        <div id="model" className="scroll-mt-24"><ThreeWays /></div>
        <p className="mt-4 max-w-[66ch] text-sm text-muted-foreground">
          The place switcher at the top of the app shows where you are. Anything you start on the network is recorded on the network;
          anything you start inside a workspace is recorded under that workspace.
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
        <Notice title="A practice network, not audited yet">
          <p>
            BitRegalo runs today on {chain.name}, a practice network. Tokens here have no value, and the contracts have not been
            independently audited, so nothing of real value should pass through them. Main networks follow an audit.
          </p>
        </Notice>
        <dl className="mt-7 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="t-subheading">You need a wallet</dt>
            <dd className="mt-1 text-sm text-muted-foreground">A wallet such as MetaMask is how you sign in and approve each step. BitRegalo never holds your keys or your funds.</dd>
          </div>
          <div>
            <dt className="t-subheading">Practice tokens are free</dt>
            <dd className="mt-1 text-sm text-muted-foreground">The faucet gives 1,000 tUSD a day so you can try every step. Each person pays their own network fee from their wallet, in the practice network&apos;s own coin.</dd>
          </div>
          <div>
            <dt className="t-subheading">Nothing happens until you sign</dt>
            <dd className="mt-1 text-sm text-muted-foreground">Every guided task ends with a review. If a step fails, what came before it is already done, and signing again continues from there.</dd>
          </div>
          <div>
            <dt className="t-subheading">Everything is on the record</dt>
            <dd className="mt-1 text-sm text-muted-foreground">Requests, offers, choices and payments are written to a public blockchain, and nothing written can be edited or deleted afterwards. Private wording keeps the text private, not the amounts.</dd>
          </div>
        </dl>
      </Section>

      <Section title="Words we use">
        <div id="glossary" className="scroll-mt-24"><Glossary /></div>
      </Section>
    </div>
  )
}
