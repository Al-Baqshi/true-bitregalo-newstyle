"use client"
import { useState } from "react"
import Link from "next/link"
import { abis } from "@/lib/bitregalo/config"
import { encodeLabel, eventArgs, fingerprint, labelBytes } from "@/lib/bitregalo/instances"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Wizard } from "./wizard"
import { Choice, Done, Label, input } from "./fields"
import { Button } from "@/components/ui/button"

export function ProjectWizard() {
  const t = useTenant()
  const base = `/app/t/${t.id}`
  const [name, setName] = useState("")
  const [vis, setVis] = useState<"public" | "private">("public")
  return (
    <Wizard
      eyebrow={`Instance #${t.id} · project`}
      title="Start a project"
      intro="A project groups your requests, offers, escrows and tokens under one name — a building site, a programme, a product line."
      steps={[{
        id: "name", title: "Name it",
        valid: !name.trim() ? "Name the project" : vis === "public" && labelBytes(name) > 31 ? "Public names are at most 31 characters" : true,
        content: (
          <div className="grid gap-5">
            <Label title="Project name" counter={vis === "public" ? `${labelBytes(name)}/31` : undefined}><input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Riverside Stage 1" autoFocus /></Label>
            <Choice<"public" | "private">
              value={vis} onChange={setVis} columns={2}
              options={[
                { value: "public", title: "Public name", description: "Readable by anyone on-chain." },
                { value: "private", title: "Private", description: "Only a fingerprint on-chain; the name stays with you." },
              ]}
            />
          </div>
        ),
      }]}
      signLabel="Create project"
      plan={[{
        id: "create", label: `Create project “${name.trim() || "…"}”`,
        run: async ({ tx, results }) => {
          const r = await tx("Create project", { address: t.instance, abi: abis.instance, functionName: "createProject", args: [vis === "public" ? encodeLabel(name) : fingerprint(name)] })
          results.projectId = eventArgs<{ projectId: bigint }>(r, abis.instance, "ProjectCreated").projectId
        },
      }]}
      summary={[{ label: "Project", value: name.trim() || "—" }, { label: "Visibility", value: vis }]}
      done={(r) => (
        <Done title={`Project #${String(r.projectId)} created`} actions={<><Button asChild><Link href={`${base}/rfps/new`}>Post a request for it</Link></Button><Button asChild variant="secondary"><Link href={`/app/create/token?instance=${t.id}`}>Create a token for it</Link></Button><Button asChild variant="ghost"><Link href={`${base}/projects`}>All projects</Link></Button></>}>
          <p>{name.trim()} is now a project in instance #{String(t.id)}. You own it: only you can post requests under it.</p>
        </Done>
      )}
    />
  )
}
