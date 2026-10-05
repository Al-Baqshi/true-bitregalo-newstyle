import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/* Small pieces the landing demonstrations share. Kept here so the public site does not
 * load the app's component library (and its wallet code) just to draw a status chip. */

/** 12500 → "12,500.00". Written out by hand so the server and the browser agree. */
export function fmt(n: number) {
  const [i, f] = n.toFixed(2).split(".")
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + f
}

const TONES = {
  gold: { chip: "bg-gold-fill text-gold", dot: "bg-gold-line" },
  good: { chip: "bg-success-fill text-success", dot: "bg-success" },
  muted: { chip: "bg-secondary text-muted-foreground", dot: "bg-subtle" },
} as const

/** A state said in a word, the way the app's own status chips say it. */
export function Chip({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-[560] transition-colors duration-300", TONES[tone].chip)}>
      <span className={cn("size-1.5 rounded-full", TONES[tone].dot)} aria-hidden />
      {children}
    </span>
  )
}

/** The demonstrations' own buttons: quiet outlines, so the page's one primary action stays the hero's. */
export const moveCls =
  "flex min-h-11 w-full items-center justify-center rounded-lg border border-border-strong px-2 text-sm font-[560] outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-secondary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
