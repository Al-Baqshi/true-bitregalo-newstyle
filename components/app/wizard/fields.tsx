"use client"
import { Check } from "lucide-react"
import { inputCls } from "@/components/app/ui"
import { cn } from "@/lib/utils"

/** Text field, select and textarea share one look. Add `h-auto py-2.5` on a textarea. */
export const input = inputCls

export function Label({ title, hint, children, counter }: { title: string; hint?: React.ReactNode; children: React.ReactNode; counter?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="t-label">{title}</span>
        {counter && <span className="t-num text-xs text-subtle">{counter}</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-sm text-muted-foreground">{hint}</span>}
    </label>
  )
}

export type ChoiceOption<T extends string> = { value: T; title: string; description?: string; disabled?: string }

/** Large, readable options: the main way a person decides something in a wizard. */
export function Choice<T extends string>({ options, value, onChange, columns = 1 }: { options: ChoiceOption<T>[]; value: T; onChange: (v: T) => void; columns?: 1 | 2 | 3 }) {
  const cols = columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : ""
  return (
    <div role="radiogroup" className={cn("grid gap-3", cols)}>
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
            className={cn(
              "relative flex flex-col justify-start rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed",
              active ? "border-gold-line bg-gold-fill/50 ring-1 ring-gold-line" : "border-border-strong/60 hover:border-border-strong hover:bg-secondary/50",
              o.disabled && "border-border bg-secondary/40 hover:border-border"
            )}
          >
            <span className="flex items-start justify-between gap-3">
              <span className={cn("text-base font-[560]", o.disabled && "text-subtle")}>{o.title}</span>
              <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border", active ? "border-gold-line bg-gold-line text-[#17130a]" : "border-border-strong")}>
                {active && <Check className="size-3.5" strokeWidth={3} />}
              </span>
            </span>
            {o.description && <span className={cn("mt-1 block text-sm", o.disabled ? "text-subtle" : "text-muted-foreground")}>{o.description}</span>}
            {o.disabled && <span className="mt-1.5 block text-sm text-destructive">{o.disabled}</span>}
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
      className={cn(
        "flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors",
        checked ? "border-success bg-success-fill/50" : "border-border-strong/60 hover:border-border-strong hover:bg-secondary/50"
      )}
    >
      <span className={cn("mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors", checked ? "bg-success" : "bg-border-strong")}>
        <span className={cn("size-5 rounded-full bg-card shadow-sm transition-transform duration-200 ease-out", checked && "translate-x-4")} />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base font-[560]">
          {title}
          {tag && <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-[560] text-muted-foreground">{tag}</span>}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
      </span>
    </button>
  )
}

export function Note({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-foreground/85">{children}</p>
}

export function Done({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
      <span className="flex size-11 items-center justify-center rounded-full bg-success-fill text-success"><Check className="size-5" strokeWidth={2.5} /></span>
      <h1 className="t-title mt-5">{title}</h1>
      <div className="mt-3 max-w-[62ch] space-y-2 text-base text-muted-foreground">{children}</div>
      {actions && <div className="mt-7 flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}
