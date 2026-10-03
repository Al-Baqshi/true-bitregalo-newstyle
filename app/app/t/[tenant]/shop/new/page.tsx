"use client"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useTenant } from "@/lib/bitregalo/tenant"
import { SaleWizard } from "@/components/app/wizard/sale-wizard"
import { OlderContract } from "@/components/app/older-contract"

function Inner() {
  const t = useTenant()
  const sp = useSearchParams()
  if (t.version < 1n) return <OlderContract what="The shop" />
  return <SaleWizard initialToken={sp.get("token") ?? undefined} />
}
export default function NewSale() {
  return <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}><Inner /></Suspense>
}
