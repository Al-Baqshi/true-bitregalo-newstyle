"use client"
import { useEffect, useState } from "react"
import { instanceName } from "./instances"
import { PUBLIC_WORKSPACE_ID } from "./config"

/**
 * The name to show for a workspace. Names people gave their workspaces are kept in
 * this browser, so they are only read after the page has mounted; before that (and
 * on the server) every workspace has its plain name.
 */
export function useWorkspaceName() {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return (id: bigint) =>
    id === PUBLIC_WORKSPACE_ID
      ? "BitRegalo network"
      : (ready ? instanceName(id) : null) ?? (id === 0n ? "BitRegalo public workspace (first version)" : `Workspace #${id}`)
}
