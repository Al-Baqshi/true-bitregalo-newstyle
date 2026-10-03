"use client"
import { Suspense } from "react"
import { OfferWizard } from "@/components/app/wizard/offer-wizard"

/** The wizard reads a buyer's "hold a payment for someone" link from the address bar. */
export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground" role="status">Loading…</p>}>
      <OfferWizard />
    </Suspense>
  )
}
