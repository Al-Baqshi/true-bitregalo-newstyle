import type { Metadata } from "next"
import { DocPage } from "@/components/site/doc-page"

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the BitRegalo team directly by email or phone. No forms.",
}

const WAYS = [
  {
    label: "Email",
    href: "mailto:ceo@bitregalo.com",
    value: "ceo@bitregalo.com",
    note: "Best for questions about the protocols, the app, or a project you want to run through escrow.",
  },
  {
    label: "Phone",
    href: "tel:+64273385000",
    value: "+64 27 338 5000",
    note: "A New Zealand mobile. Call or send a text message.",
  },
]

export default function ContactPage() {
  return (
    <DocPage
      title="Contact"
      summary="No forms and no tickets. Write or call, and a person answers."
      meta="BitRegalo® Limited, New Zealand"
      toc={false}
    >
      <ul className="list-none pl-0">
        {WAYS.map((w) => (
          <li key={w.href} className="border-t border-border py-7 first:border-t-0 first:pt-0 sm:py-8">
            <p className="text-base text-muted-foreground">{w.label}</p>
            <a
              href={w.href}
              className="mt-1 inline-flex min-h-11 items-center break-all text-2xl font-[560] text-gold underline decoration-1 underline-offset-[0.2em] hover:decoration-2 sm:text-3xl"
            >
              {w.value}
            </a>
            <p className="mt-2 max-w-[52ch] text-base">{w.note}</p>
          </li>
        ))}
      </ul>
    </DocPage>
  )
}
