"use client"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { SaleWizard } from "@/components/app/wizard/sale-wizard"

function Inner() {
  const sp = useSearchParams()
  return <SaleWizard initialToken={sp.get("token") ?? undefined} />
}
export default function NewSale() {
  return <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}><Inner /></Suspense>
}
