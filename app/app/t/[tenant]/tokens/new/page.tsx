"use client"
import { TokenWizard } from "@/components/app/wizard/token-wizard"
import { useTenant } from "@/lib/bitregalo/tenant"

export default function Page() {
  const t = useTenant()
  return <TokenWizard fixedTenant={t.id} />
}
