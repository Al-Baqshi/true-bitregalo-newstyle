"use client"
import { Check } from "lucide-react"

export const input =
  "w-full rounded-lg border border-border bg-input px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/70 focus:ring-2 focus:ring-primary/15"

export function Label({ title, hint, children, counter }: { title: string; hint?: React.ReactNode; children: React.ReactNode; counter?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-foreground">{title}</span>
        {counter && <span className="bq-mono text-[11px] text-muted-foreground">{counter}</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">{hint}</span>}
    </label>
  )
}

export type ChoiceOption<T extends string> = { value: T; title: string; description?: string; disabled?: string }

/** Large, readable option cards — the main way a person decides something in a wizard. */
export function Choice<T extends string>({ options, value, onChange, columns = 1 }: { options: ChoiceOption<T>[]; value: T; onChange: (v: T) => void; columns?: 1 | 2 | 3 }) {
  const cols = columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : ""
  return (
    <div role="radiogroup" className={`grid gap-3 ${cols}`}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={!!o.disabled}
            onClick={() => onChange(o.value)}
            className={`group relative rounded-xl border p-4 text-left transition ${active ? "border-primary/70 bg-primary/[0.06]" : "border-border hover:border-[color:var(--bq-line-strong)] hover:bg-secondary/40"} disabled:cursor-not-allowed disabled:opacity-45`}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium">{o.title}</span>
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                {active && <Check className="size-3" />}
              </span>
            </span>
            {o.description && <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">{o.description}</span>}
            {o.disabled && <span className="mt-1.5 block text-xs text-destructive/90">{o.disabled}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** An optional extra a person can switch into the wizard; switching it on adds its own steps. */
export function AddOn({ checked, onChange, title, description, tag }: { checked: boolean; onChange: (v: boolean) => void; title: string; description: string; tag?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${checked ? "border-accent/60 bg-accent/[0.06]" : "border-border hover:border-[color:var(--bq-line-strong)] hover:bg-secondary/40"}`}
    >
      <span className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${checked ? "bg-accent" : "bg-secondary"}`}>
        <span className={`size-4 rounded-full bg-foreground transition ${checked ? "translate-x-4" : ""}`} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-medium">{title}{tag && <span className="bq-label rounded-full border border-border px-2 py-0.5 text-[9px]">{tag}</span>}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span>
      </span>
    </button>
  )
}

export function Note({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-xs leading-relaxed text-[color:var(--bq-ivory-dim)]">{children}</p>
}

export function Done({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-accent/40 bg-card p-8">
      <span className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent"><Check className="size-5" /></span>
      <h1 className="bq-display mt-5 text-3xl font-semibold">{title}</h1>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-[color:var(--bq-ivory-dim)]">{children}</div>
      {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}
