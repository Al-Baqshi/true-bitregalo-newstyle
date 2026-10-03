"use client"
import { useState } from "react"
import Link from "next/link"
import { abis } from "@/lib/bitregalo/config"
import { encodeLabel, eventArgs, fingerprint, labelBytes } from "@/lib/bitregalo/instances"
import { useWorkspaceName } from "@/lib/bitregalo/names"
import { useTenant } from "@/lib/bitregalo/tenant"
import { Wizard } from "./wizard"
import { Choice, Done, Label, input } from "./fields"
import { Button } from "@/components/ui/button"

export function ProjectWizard() {
  const t = useTenant()
  const base = t.base
  const nameOf = useWorkspaceName()
  const [name, setName] = useState("")
  const [vis, setVis] = useState<"public" | "private">("public")
  return (
    <Wizard
      title="Start a project"
      intro="A project groups your requests, listings, escrows and tokens under one name: a building site, a programme, a product line."
      steps={[{
        id: "name", title: "Name it", caption: "The name is the only thing a project needs.",
        valid: !name.trim() ? "Give the project a name" : vis === "public" && labelBytes(name) > 31 ? "Public names are at most 31 characters" : true,
        content: (
          <div className="grid gap-6">
            <Label title="Project name" counter={vis === "public" ? `${labelBytes(name)}/31` : undefined} hint={vis === "public" ? "Up to 31 characters. Anyone can read it on the public record." : "Any length. Only a fingerprint of it goes on the record."}>
              <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Riverside Stage 1" autoFocus />
            </Label>
            <fieldset>
              <legend className="t-label mb-2">Who can read the name?</legend>
              <Choice<"public" | "private">
                value={vis} onChange={setVis}
                options={[
                  { value: "public", title: "Public name", description: "Written to the public record as readable text, so everyone sees it." },
                  { value: "private", title: "Keep the name private", description: "Only a fingerprint of the name is stored. The words stay with you, and lists here show it by its number, marked “Name kept private”." },
                ]}
              />
            </fieldset>
          </div>
        ),
      }]}
      signLabel="Create project"
      plan={[{
        id: "create", label: `Create the project “${name.trim() || "…"}”`, detail: vis === "public" ? "The name is written to the public record." : "Only a fingerprint of the name is written to the record.",
        run: async ({ tx, results }) => {
          const r = await tx("Create project", { address: t.instance, abi: abis.instance, functionName: "createProject", args: [vis === "public" ? encodeLabel(name) : fingerprint(name)] })
          results.projectId = eventArgs<{ projectId: bigint }>(r, abis.instance, "ProjectCreated").projectId
        },
      }]}
      summary={[
        { label: "Project", value: name.trim() || "—" },
        { label: "Name", value: vis === "public" ? "Public" : "Hidden" },
        { label: "Workspace", value: nameOf(t.id) },
      ]}
      done={(r) => (
        <Done
          title={`Project #${String(r.projectId)} created`}
          actions={
            <>
              <Button asChild><Link href={`${base}/requests/new`}>Post a request for it</Link></Button>
              <Button asChild variant="secondary"><Link href={`/app/create/token?instance=${t.id}`}>Create a token for it</Link></Button>
              <Button asChild variant="ghost"><Link href={`${base}/projects`}>All projects</Link></Button>
            </>
          }
        >
          <p>{name.trim()} is now a project in {nameOf(t.id)}. You own it: only you can post requests under it.</p>
          <p>Next, post a request under it or create a token linked to it.</p>
        </Done>
      )}
    />
  )
}
