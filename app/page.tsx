import { Navbar } from "@/components/navbar"
import { Hero, HowItWorks, Assurance, InTheApp, UseCases, Protocol, FinalCta } from "@/components/landing/sections"
import { LegalDisclaimer } from "@/components/legal-disclaimer"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Assurance />
        <InTheApp />
        <UseCases />
        <Protocol />
        <FinalCta />
      </main>
      <LegalDisclaimer />
      <Footer />
    </>
  )
}
