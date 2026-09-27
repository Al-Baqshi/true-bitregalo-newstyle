import { TenantProvider } from "@/lib/bitregalo/tenant"

export default async function TenantLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant } = await params
  const id = /^\d+$/.test(tenant) ? BigInt(tenant) : 0n
  return <TenantProvider id={id}>{children}</TenantProvider>
}
