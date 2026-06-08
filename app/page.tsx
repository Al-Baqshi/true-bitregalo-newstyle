import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { TrustBar } from "@/components/trust-bar"
import { HowItWorks } from "@/components/how-it-works"
import { AppDownload } from "@/components/app-download"
import { FeaturesSection } from "@/components/features-section"
import { UseCasesSection } from "@/components/use-cases-section"
import { DeveloperPortal } from "@/components/developer-portal"
import { TokenomicsSection } from "@/components/tokenomics-section"
import { EnterpriseSection } from "@/components/enterprise-section"
import { CTASection } from "@/components/cta-section"
import { LegalDisclaimer } from "@/components/legal-disclaimer"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <TrustBar />
      <HowItWorks />
      <AppDownload />
      <FeaturesSection />
      <UseCasesSection />
      <DeveloperPortal />
      <TokenomicsSection />
      <EnterpriseSection />
      <CTASection />
      <LegalDisclaimer />
      <Footer />
    </main>
  )
}
