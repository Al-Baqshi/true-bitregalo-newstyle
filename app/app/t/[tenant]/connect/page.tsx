import type { Metadata } from "next"
import { ConnectPlatform } from "@/components/app/connect/connect-page"

export const metadata: Metadata = { title: { absolute: "Connect a platform · BitRegalo App" } }

/** How an organisation uses its workspace from its own site, app or back office. */
export default function ConnectPage() {
  return <ConnectPlatform />
}
