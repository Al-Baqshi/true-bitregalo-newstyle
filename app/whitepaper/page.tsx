import type { Metadata } from "next"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { Fragment, type ReactNode } from "react"
import Markdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { DocPage, DocTable, PrintButton, type TocItem } from "@/components/site/doc-page"

/*
 * The whitepaper is kept as Markdown in app/docs and rendered on the server. Each
 * top-level heading becomes a section with an id, so the page's contents list links
 * straight to it. PRODUCT.md (Vision) is the internal source of truth; this document
 * says the same thing for outside readers. Change them together.
 */

export const metadata: Metadata = {
  title: "Whitepaper",
  description: "The BitRegalo whitepaper: infrastructure that lets an organisation keep records nobody can edit and make payment commitments that execute as agreed, on a shared public network or its own private one. What is built, what is planned, and the rules the protocol keeps.",
}

const FILE = path.join(process.cwd(), "app/docs/bitregalo-whitepaper.md")
const BR = "{{br}}"

type Section = { id: string; title: string; body: string; levels: number[] }

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

/** Heading text as it should read: no bold markers, no escaped dots, no trailing colon. */
function cleanHeading(text: string) {
  return text.replace(/\*\*/g, "").replace(/\\\./g, ".").trim().replace(/:$/, "").trim()
}

function prepare(raw: string): { sections: Section[]; toc: TocItem[] } {
  const lines = raw.split(/\r?\n/)

  // The body starts at the first chapter heading (after a "Table of Contents" line, if the file has one).
  const tocLine = lines.findIndex((l) => l.trim() === "Table of Contents")
  let start = lines.findIndex((l, i) => i > tocLine && /^#\s+\S/.test(l))
  if (start < 0) start = 0

  const sections: Section[] = []
  const used = new Map<string, number>()
  let current: Section | null = null

  for (const line of lines.slice(start)) {
    const heading = /^(#{1,6})\s*(.*)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      const text = cleanHeading(heading[2])
      if (!text) continue // an empty heading is a page break in the export
      if (level === 1) {
        const base = slugify(text) || "section"
        const n = (used.get(base) ?? 0) + 1
        used.set(base, n)
        current = { id: n > 1 ? `${base}-${n}` : base, title: text, body: "", levels: [] }
        sections.push(current)
        continue
      }
      if (!current) continue
      if (!current.levels.includes(level)) current.levels.push(level)
      current.body += `${"#".repeat(level)} ${text}\n`
      continue
    }
    if (!current) continue
    if (/^\[@undefined\]\(#user_mention#undefined\)\s*$/.test(line)) continue // a broken mention left by the export
    current.body += (line.startsWith("|") ? line.replace(/<br\s*\/?>/gi, BR) : line) + "\n"
  }

  for (const s of sections) s.levels.sort((a, b) => a - b)
  return { sections, toc: sections.map((s) => ({ id: s.id, label: s.title })) }
}

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (typeof node === "object" && "props" in node) return textOf((node.props as { children?: ReactNode }).children)
  return ""
}

/** Table cells from Word carry <br> line breaks; a run of "- " lines is a list. */
function Cell({ children }: { children?: ReactNode }) {
  const text = textOf(children)
  if (!text.includes(BR)) return <>{children}</>
  const parts = text
    .split(BR)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length > 1 && parts.every((p) => p.startsWith("- "))) {
    return (
      <ul className="list-disc pl-4 [&>li+li]:mt-1">
        {parts.map((p, i) => (
          <li key={i}>{p.slice(2)}</li>
        ))}
      </ul>
    )
  }
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {p}
        </Fragment>
      ))}
    </>
  )
}

const base: Components = {
  a: ({ node: _node, href, children, ...props }) => {
    const external = typeof href === "string" && /^https?:/.test(href)
    return (
      <a href={href} {...props} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {children}
      </a>
    )
  },
  hr: () => null,
  table: ({ node: _node, children }) => <DocTable minWidth="36rem">{children}</DocTable>,
  th: ({ node: _node, children, ...props }) => (
    <th {...props}>
      <Cell>{children}</Cell>
    </th>
  ),
  td: ({ node: _node, children, ...props }) => (
    <td {...props}>
      <Cell>{children}</Cell>
    </td>
  ),
}

/**
 * Sub-headings keep their order but are renumbered so no level is skipped: the
 * first level used under a chapter becomes h3, the next h4, and so on.
 */
function componentsFor(levels: number[]): Components {
  const comps: Components = { ...base }
  const tags = ["h3", "h4", "h5", "h6"] as const
  levels.forEach((level, i) => {
    const Tag = tags[Math.min(i, tags.length - 1)]
    const key = `h${level}` as "h2" | "h3" | "h4" | "h5" | "h6"
    comps[key] = ({ node: _node, children }) => <Tag className={i >= 2 ? "font-[620]" : undefined}>{children}</Tag>
  })
  return comps
}

export default async function WhitepaperPage() {
  const raw = await readFile(FILE, "utf8")
  const { sections, toc } = prepare(raw)

  return (
    <DocPage title="BitRegalo Whitepaper" meta="Version 6 · 6 October 2026 · By Al Baqshi Mohammed" toc={toc} action={<PrintButton />}>
      {sections.map((s) => (
        <Fragment key={s.id}>
          <h2 id={s.id}>{s.title}</h2>
          <Markdown remarkPlugins={[remarkGfm]} components={componentsFor(s.levels)}>
            {s.body}
          </Markdown>
        </Fragment>
      ))}
    </DocPage>
  )
}
