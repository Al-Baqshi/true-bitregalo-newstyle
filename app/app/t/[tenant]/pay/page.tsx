"use client"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useTenant } from "@/lib/bitregalo/tenant"
import { PayWizard } from "@/components/app/wizard/pay-wizard"
import { OlderContract } from "@/components/app/older-contract"

function PayInner() {
  const t = useTenant()
  const sp = useSearchParams()
  if (t.version < 1n) return <OlderContract what="Paying" />
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
