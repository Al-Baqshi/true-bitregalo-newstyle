"use client"

import { useEffect, useState, useRef } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, Menu } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// Function to generate slug from text
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

// Extract headings for TOC
function extractHeadings(content: string): Array<{ level: number; text: string; id: string }> {
  const headings: Array<{ level: number; text: string; id: string }> = []
  const lines = content.split("\n")
  const usedIds = new Map<string, number>()

  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/)
    const h2Match = line.match(/^##\s+(.+)$/)
    const h3Match = line.match(/^###\s+(.+)$/)

    let text = ""
    let level = 0

    if (h1Match) {
      text = h1Match[1].replace(/\*\*/g, "").trim()
      level = 1
    } else if (h2Match) {
      text = h2Match[1].replace(/\*\*/g, "").trim()
      level = 2
    } else if (h3Match) {
      text = h3Match[1].replace(/\*\*/g, "").trim()
      level = 3
    }

    if (text && !text.includes("Table of Contents") && text !== "BitRegalo Whitepaper") {
      let baseId = slugify(text)
      let id = baseId
      let counter = usedIds.get(baseId) || 0

      if (counter > 0) {
        id = `${baseId}-${counter}`
      }
      usedIds.set(baseId, counter + 1)

      headings.push({ level, text, id })
    }
  }

  return headings
}

// Process markdown to replace TOC
function processMarkdown(content: string): string {
  const lines = content.split("\n")
  let tocStart = -1
  let tocEnd = -1

  // Find TOC section (look for "Table of Contents" line and find where it ends)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Table of Contents") && !lines[i].startsWith("#")) {
      tocStart = i
      // Find where TOC ends (empty line after last link or before next heading)
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].startsWith("#") || (lines[j].trim() === "" && j > i + 5)) {
          tocEnd = j
          break
        }
      }
      break
    }
  }

  // Remove old TOC if found
  if (tocStart !== -1 && tocEnd !== -1) {
    return [
      ...lines.slice(0, tocStart),
      "## Table of Contents",
      "",
      ...lines.slice(tocEnd),
    ].join("\n")
  }

  return content
}

export default function WhitepaperPage() {
  const [processedContent, setProcessedContent] = useState("")
  const [headings, setHeadings] = useState<Array<{ level: number; text: string; id: string }>>([])
  const [showToc, setShowToc] = useState(false)
  const headingIdTracker = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Client-side only: fetch the markdown
      fetch("/api/whitepaper")
        .then((res) => res.text())
        .then((content) => {
          const processed = processMarkdown(content)
          const extractedHeadings = extractHeadings(content)
          setProcessedContent(processed)
          setHeadings(extractedHeadings)
          // Reset tracker when content loads
          headingIdTracker.current.clear()
        })
        .catch((err) => {
          console.error("Error loading whitepaper:", err)
        })
    }
  }, [])

  // Function to get unique ID for a heading text
  const getUniqueId = (text: string): string => {
    const baseId = slugify(text)
    const counter = headingIdTracker.current.get(baseId) || 0
    const id = counter > 0 ? `${baseId}-${counter}` : baseId
    headingIdTracker.current.set(baseId, counter + 1)
    return id
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
    setShowToc(false)
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowToc(!showToc)}
                className="md:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={handleDownloadPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Table of Contents - Desktop */}
            <aside className="hidden md:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <h2 className="font-mono text-sm font-semibold mb-4 text-foreground">
                  Table of Contents
                </h2>
                <nav className="space-y-1">
                  {headings.map((heading, index) => (
                    <a
                      key={`${heading.id}-${index}`}
                      href={`#${heading.id}`}
                      onClick={(e) => handleSmoothScroll(e, heading.id)}
                      className={`block text-sm text-muted-foreground hover:text-accent transition-colors ${
                        heading.level === 1
                          ? "font-semibold"
                          : heading.level === 2
                            ? "ml-4"
                            : "ml-8"
                      }`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <article className="flex-1 min-w-0">
              <div className="prose prose-invert prose-lg max-w-none">
                <div className="rounded-2xl border border-border/60 bg-card p-8 sm:p-12">
                      {processedContent ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, children, ...props }) => {
                          const text = String(children).replace(/\*\*/g, "").trim()
                          if (text && !text.includes("Table of Contents") && text !== "BitRegalo Whitepaper") {
                            const id = getUniqueId(text)
                            return (
                              <h1
                                id={id}
                                className="font-mono text-3xl font-bold mb-6 mt-8 scroll-mt-24"
                                {...props}
                              >
                                {children}
                              </h1>
                            )
                          }
                          return <h1 className="font-mono text-3xl font-bold mb-6 mt-8" {...props}>{children}</h1>
                        },
                        h2: ({ node, children, ...props }) => {
                          const text = String(children).replace(/\*\*/g, "").trim()
                          if (text && !text.includes("Table of Contents")) {
                            const id = getUniqueId(text)
                            return (
                              <h2
                                id={id}
                                className="font-mono text-2xl font-semibold mb-4 mt-8 scroll-mt-24"
                                {...props}
                              >
                                {children}
                              </h2>
                            )
                          }
                          return <h2 className="font-mono text-2xl font-semibold mb-4 mt-8" {...props}>{children}</h2>
                        },
                        h3: ({ node, children, ...props }) => {
                          const text = String(children).replace(/\*\*/g, "").trim()
                          const id = getUniqueId(text)
                          return (
                            <h3
                              id={id}
                              className="font-mono text-xl font-semibold mb-3 mt-6 scroll-mt-24"
                              {...props}
                            >
                              {children}
                            </h3>
                          )
                        },
                        p: ({ node, ...props }) => (
                          <p className="text-muted-foreground mb-4 leading-relaxed" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc list-inside mb-4 space-y-2 text-muted-foreground ml-4" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal list-inside mb-4 space-y-2 text-muted-foreground ml-4" {...props} />
                        ),
                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                        strong: ({ node, ...props }) => (
                          <strong className="text-foreground font-semibold" {...props} />
                        ),
                        a: ({ node, ...props }) => (
                          <a
                            className="text-accent hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                          />
                        ),
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-6">
                            <table className="min-w-full border border-border/60" {...props} />
                          </div>
                        ),
                        th: ({ node, ...props }) => (
                          <th className="border border-border/60 px-4 py-2 text-left font-semibold bg-[#1a1a1a]" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="border border-border/60 px-4 py-2 text-muted-foreground" {...props} />
                        ),
                      }}
                    >
                      {processedContent}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Loading whitepaper...</p>
                    </div>
                  )}
                </div>
              </div>
            </article>
          </div>

          {/* Mobile TOC */}
          {showToc && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowToc(false)} />
              <div className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border/60 p-6 overflow-y-auto">
                <h2 className="font-mono text-lg font-semibold mb-4">Table of Contents</h2>
                <nav className="space-y-1">
                  {headings.map((heading, index) => (
                    <a
                      key={`${heading.id}-${index}`}
                      href={`#${heading.id}`}
                      onClick={(e) => handleSmoothScroll(e, heading.id)}
                      className={`block text-sm text-muted-foreground hover:text-accent transition-colors ${
                        heading.level === 1
                          ? "font-semibold"
                          : heading.level === 2
                            ? "ml-4"
                            : "ml-8"
                      }`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />

      <style jsx global>{`
        @media print {
          body {
            background: white;
            color: black;
          }
          .prose {
            color: black;
          }
          .prose h1,
          .prose h2,
          .prose h3 {
            color: black;
          }
          .prose p,
          .prose li {
            color: #333;
          }
          nav,
          button,
          aside {
            display: none !important;
          }
        }
      `}</style>
    </main>
  )
}
