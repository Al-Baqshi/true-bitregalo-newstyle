"use client"
import { Children, isValidElement, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/*
 * The reading pages of the public site: the whitepaper, the protocol references,
 * the legal documents and the contact page. One title block, one measure of text
 * (`.prose-doc`, 68 characters a line), and a list of the document's sections that
 * sits beside the text on a wide screen and folds above it on a phone.
 */

export type TocItem = { id: string; label: string }

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children)
  return ""
}

/** Every `<h2 id>` among the children, in order, becomes an entry in the contents list. */
function headingsIn(node: ReactNode, out: TocItem[] = []): TocItem[] {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return
    const props = child.props as { id?: string; children?: ReactNode }
    if (child.type === "h2" && props.id) out.push({ id: props.id, label: textOf(props.children).trim() })
    else if (props.children) headingsIn(props.children, out)
  })
  return out
}

export function DocPage({
  title,
  summary,
  updated,
  meta,
  toc = "auto",
  action,
  children,
}: {
  title: ReactNode
  /** One sentence under the title. */
  summary?: ReactNode
  /** A "last updated" line, rendered as written. */
  updated?: ReactNode
  /** A further small line under the title: the author, the version, the company. */
  meta?: ReactNode
  /** Section links. "auto" reads them from the `<h2 id>` elements in `children`. */
  toc?: TocItem[] | "auto" | false
  /** Something to do with the document, placed beside the title: a print button. */
  action?: ReactNode
  children: ReactNode
}) {
  const items = toc === "auto" ? headingsIn(children) : toc || []
  const hasToc = items.length > 1

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="print:hidden">
        <Navbar />
      </div>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:pb-28">
        <div className={cn("lg:grid lg:gap-x-16", hasToc ? "lg:grid-cols-[minmax(0,44rem)_minmax(11rem,1fr)]" : "lg:grid-cols-[minmax(0,44rem)]")}>
          <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 lg:col-span-full">
            <div className="min-w-0 max-w-176">
              <h1 className="t-headline">{title}</h1>
              {summary && <p className="t-lede mt-4">{summary}</p>}
              {(updated || meta) && (
                <div className="mt-4 space-y-0.5">
                  {updated && <p className="t-meta">{updated}</p>}
                  {meta && <p className="t-meta">{meta}</p>}
                </div>
              )}
            </div>
            {action && <div className="flex shrink-0 items-center gap-2 print:hidden">{action}</div>}
          </header>

          {hasToc && (
            <>
              <details className="group mt-8 rounded-xl border border-border bg-card lg:hidden print:hidden">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-2 text-base font-[560] marker:content-none [&::-webkit-details-marker]:hidden">
                  Contents
                  <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" aria-hidden />
                </summary>
                <ol className="border-t border-border px-4 py-2">
                  {items.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="flex min-h-11 items-center py-2 text-base leading-snug text-muted-foreground transition-colors hover:text-foreground active:text-foreground">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>

              <aside className="hidden lg:col-start-2 lg:row-start-2 lg:block print:hidden">
                <nav aria-label="Contents" className="sticky top-[calc(var(--topbar-h)+2rem)] mt-12 max-h-[calc(100dvh-var(--topbar-h)-4rem)] overflow-y-auto pr-2">
                  <p className="text-sm font-semibold">Contents</p>
                  <ol className="mt-2 border-l border-border">
                    {items.map((item) => (
                      <li key={item.id}>
                        <a href={`#${item.id}`} className="-ml-px flex min-h-9 items-center border-l border-transparent py-1.5 pl-4 text-sm leading-snug text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground pointer-coarse:min-h-11">
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </aside>
            </>
          )}

          <article className="prose-doc mt-10 lg:col-start-1 lg:row-start-2 lg:mt-12">{children}</article>
        </div>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  )
}

/** A short notice that belongs to the document: a legal basis, a warning, a thing to read first. */
export function DocNotice({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <aside className="rounded-xl bg-secondary px-5 py-4 sm:px-6 sm:py-5 [&>*+*]:mt-2">
      <p className="t-subheading">{title}</p>
      {children}
    </aside>
  )
}

/**
 * A table that scrolls sideways inside its own box on a narrow screen instead of
 * stretching the page. `minWidth` keeps columns readable; below it, the box scrolls.
 */
export function DocTable({ children, minWidth, className }: { children: ReactNode; minWidth?: string; className?: string }) {
  return (
    <div className="-mx-5 overflow-x-auto overscroll-x-contain px-5 sm:mx-0 sm:px-0">
      <table className={className} style={minWidth ? { minWidth } : undefined}>
        {children}
      </table>
    </div>
  )
}

/** Opens the browser's print dialog, where the document can be saved as a PDF. */
export function PrintButton({ className }: { className?: string }) {
  return (
    <Button type="button" variant="outline" className={className} onClick={() => window.print()}>
      Print or save as PDF
    </Button>
  )
}
