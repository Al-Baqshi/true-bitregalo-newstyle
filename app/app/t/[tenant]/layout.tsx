import { notFound } from "next/navigation"
import { TenantProvider } from "@/lib/bitregalo/tenant"

export default async function TenantLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  // A workspace is a number. Anything else is not a page, rather than workspace 0.
  if (!/^\d+$/.test(tenant)) notFound()
  return <TenantProvider id={BigInt(tenant)}>{children}</TenantProvider>
}
