import { TenantProvider } from "@/lib/bitregalo/tenant"
import { PUBLIC_WORKSPACE_ID } from "@/lib/bitregalo/config"

/**
 * The BitRegalo public network. It runs on an ordinary workspace operated by BitRegalo,
 * so every page here is the same page a workspace has, served at /app instead of /app/t/{id}.
 */
export default function NetworkLayout({ children }: { children: React.ReactNode }) {
  return <TenantProvider id={PUBLIC_WORKSPACE_ID} base="/app">{children}</TenantProvider>
}
