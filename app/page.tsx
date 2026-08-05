import { Navbar } from "@/components/navbar"
import { HeroCinematic } from "@/components/landing/hero-cinematic"
import { LifecycleStory } from "@/components/landing/lifecycle-story"
import { AssuranceSection } from "@/components/landing/assurance-section"
import { UseCasesCinematic } from "@/components/landing/use-cases-cinematic"
import { ProtocolSection } from "@/components/landing/protocol-section"
import { FinalCTA } from "@/components/landing/final-cta"
import { LegalDisclaimer } from "@/components/legal-disclaimer"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroCinematic />
      <LifecycleStory />
      <AssuranceSection />
      <UseCasesCinematic />
      <ProtocolSection />
      <FinalCTA />
      <LegalDisclaimer />
      <Footer />
    </main>
  )
}
