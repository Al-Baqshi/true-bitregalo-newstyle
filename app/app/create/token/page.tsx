"use client"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { TokenWizard } from "@/components/app/wizard/token-wizard"

function Inner() {
  const q = useSearchParams()
  const inst = q.get("instance")
  return <TokenWizard initialTenant={inst && /^\d+$/.test(inst) ? inst : undefined} />
}
export default function Page() {
  return <Suspense><Inner /></Suspense>
}
