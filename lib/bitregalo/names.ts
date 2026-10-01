"use client"
import { useEffect, useState } from "react"
import { instanceName } from "./instances"

/**
 * The name to show for a workspace. Names people gave their workspaces are kept in
 * this browser, so they are only read after the page has mounted; before that (and
 * on the server) every workspace has its plain name.
 */
export function useWorkspaceName() {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return (id: bigint) => (ready ? instanceName(id) : null) ?? (id === 0n ? "Public workspace" : `Workspace #${id}`)
}
