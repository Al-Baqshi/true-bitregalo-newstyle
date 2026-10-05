import { Navbar } from "@/components/navbar"
import { Hero, HowItWorks, Trust, UseCases, Protocol, FinalCta } from "@/components/landing/sections"
import { BuildingBlocks } from "@/components/landing/building-blocks"
import { ThreeWays } from "@/components/landing/three-ways"
import { LegalDisclaimer } from "@/components/legal-disclaimer"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <HowItWorks />
        <ThreeWays />
        <Trust />
        <BuildingBlocks />
        <UseCases />
        <Protocol />
        <FinalCta />
      </main>
      <LegalDisclaimer />
      <Footer />
    </>
  )
}
