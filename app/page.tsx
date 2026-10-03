import { Navbar } from "@/components/navbar"
import { Hero, HowItWorks, Trust, UseCases, Protocol, FinalCta } from "@/components/landing/sections"
import { BuildingBlocks } from "@/components/landing/building-blocks"
import { TwoWays } from "@/components/landing/two-ways"
import { LegalDisclaimer } from "@/components/legal-disclaimer"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <HowItWorks />
        <BuildingBlocks />
        <TwoWays />
        <Trust />
        <UseCases />
        <Protocol />
        <FinalCta />
      </main>
      <LegalDisclaimer />
      <Footer />
    </>
  )
}
