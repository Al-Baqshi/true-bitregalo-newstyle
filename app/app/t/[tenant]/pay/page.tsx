"use client"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PayWizard } from "@/components/app/wizard/pay-wizard"

function PayInner() {
  const sp = useSearchParams()
  return (
    <PayWizard prefill={{
      to: sp.get("to") ?? undefined, token: sp.get("token") ?? undefined, amount: sp.get("amount") ?? undefined,
      ref: sp.get("ref") ?? undefined, project: sp.get("project") ?? undefined, fixed: sp.get("fixed") === "1",
    }} />
  )
}
export default function PayPage() {
  return <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}><PayInner /></Suspense>
}
