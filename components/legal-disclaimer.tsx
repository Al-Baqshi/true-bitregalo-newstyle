import { AlertTriangle, Shield, FileText, Users } from "lucide-react"
import Link from "next/link"

export function LegalDisclaimer() {
  return (
    <section id="disclaimer" className="border-t border-border/40 bg-card/20 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-10">
          <div className="flex items-start gap-3 mb-6">
            <AlertTriangle className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold">Legal Notice & Regulatory Compliance</h3>
              <p className="text-xs text-muted-foreground mt-1">
                BitRegalo® Limited — New Zealand Registration: 7699356
              </p>
            </div>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold mb-1">Technology Platform, Not Financial Service</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    BitRegalo is a technology platform providing marketplace infrastructure and utility tokens. We are NOT a financial institution, reporting entity under the AML/CFT Act 2009, or issuer of financial products under the FMC Act 2013.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold mb-1">Utility Tokens Only</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    BTR and Regalo tokens are prepaid utility credits for platform access only. They are NOT securities, financial products, or investment contracts. No expectation of profit is created. Token value may fluctuate; you bear all risk of loss.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold mb-1">Tiered Verification</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Gifters under NZD $1,000: No KYC required. High-value transactions (≥$1,000): Basic ID verification. Service providers: Full KYC/CDD required. Enterprise clients: Enhanced due diligence.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold mb-1">Risk Acknowledgment</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Blockchain technology involves inherent risks including technical failures, regulatory changes, and market volatility. By using BitRegalo, you acknowledge and accept these risks. We provide no guarantees regarding token value or platform availability.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/40">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-center">
              <Link 
                href="/terms" 
                className="text-xs text-accent hover:underline transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                href="/privacy" 
                className="text-xs text-accent hover:underline transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/token-terms" 
                className="text-xs text-accent hover:underline transition-colors"
              >
                Token Terms
              </Link>
              <Link 
                href="/kyc-policy" 
                className="text-xs text-accent hover:underline transition-colors"
              >
                KYC Policy
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              This platform operates in compliance with New Zealand law including the AML/CFT Act 2009, FMC Act 2013, Privacy Act 2020, and Fair Trading Act 1986. Users are responsible for compliance with laws in their own jurisdictions.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
