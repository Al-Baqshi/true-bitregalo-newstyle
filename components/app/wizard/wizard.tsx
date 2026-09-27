"use client"
import { useEffect, useRef, useState } from "react"
import { useAccount } from "wagmi"
import type { TransactionReceipt } from "viem"
import { Check, Loader2, AlertCircle, CircleDashed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@/components/app/connect-button"
import { useTx } from "@/lib/bitregalo/hooks"

/**
 * A wizard is a list of steps (what the person decides) and a plan (the transactions that make it real).
 * Callers rebuild both on every render from their own state, so switching an add-on on simply adds its
 * steps and its actions. The engine appends a "Review & sign" step, runs the plan in order, remembers
 * what already succeeded, and lets a failed run resume from the step that failed.
 */
export type WizardStep = {
  id: string
  title: string
  caption?: string
  content: React.ReactNode
  /** true when the step is complete; a string explains what is missing. */
  valid?: true | string
}
export type RunContext = {
  results: Record<string, unknown>
  tx: (label: string, params: Parameters<ReturnType<typeof useTx>["send"]>[1]) => Promise<TransactionReceipt>
}
export type WizardAction = { id: string; label: string; detail?: string; run: (ctx: RunContext) => Promise<void> }
export type SummaryRow = { label: string; value: React.ReactNode }

type Status = "idle" | "running" | "done" | "error"

export function Wizard(props: {
  eyebrow: string
  title: string
  intro: string
  steps: WizardStep[]
  plan: WizardAction[]
  summary?: SummaryRow[]
  signLabel: string
  done: (results: Record<string, unknown>) => React.ReactNode
}) {
  const { isConnected } = useAccount()
  const { send } = useTx()
  const steps: WizardStep[] = [
    ...props.steps,
    { id: "__review", title: "Review & sign", caption: "Nothing happens until you sign.", content: null, valid: true },
  ]
  const [index, setIndex] = useState(0)
  const [maxSeen, setMaxSeen] = useState(0)
  const [status, setStatus] = useState<Record<string, Status>>({})
  const [error, setError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const results = useRef<Record<string, unknown>>({})
  const running = Object.values(status).includes("running")

  useEffect(() => {
    if (index > steps.length - 1) setIndex(steps.length - 1)
  }, [steps.length, index])

  const current = steps[Math.min(index, steps.length - 1)]
  const isReview = current.id === "__review"
  const blocker = current.valid === undefined || current.valid === true ? null : current.valid
  const firstInvalid = props.steps.findIndex((s) => s.valid !== undefined && s.valid !== true)

  function go(i: number) {
    setIndex(i)
    setMaxSeen((m) => Math.max(m, i))
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function run() {
    setError(null)
    const ctx: RunContext = { results: results.current, tx: (label, params) => send(label, params) as Promise<TransactionReceipt> }
    for (const a of props.plan) {
      if (status[a.id] === "done") continue
      setStatus((s) => ({ ...s, [a.id]: "running" }))
      try {
        await a.run(ctx)
        setStatus((s) => ({ ...s, [a.id]: "done" }))
      } catch (e) {
        setStatus((s) => ({ ...s, [a.id]: "error" }))
        setError(((e as Error).message ?? String(e)).split("\n")[0].slice(0, 200))
        return
      }
    }
    setFinished(true)
  }

  if (finished) return <div className="bq-rise mx-auto max-w-3xl">{props.done(results.current)}</div>

  const doneCount = props.plan.filter((a) => status[a.id] === "done").length
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="bq-label">{props.eyebrow}</p>
        <h1 className="bq-display mt-2 text-3xl font-semibold text-balance sm:text-4xl">{props.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--bq-ivory-dim)]">{props.intro}</p>
      </header>

      {/* compact progress on small screens */}
      <div className="mb-4 lg:hidden">
        <div className="bq-label">Step {index + 1} of {steps.length} · {current.title}</div>
        <div className="mt-2 h-1 rounded-full bg-secondary"><div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${((index + 1) / steps.length) * 100}%` }} /></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        <nav aria-label="Wizard steps" className="hidden lg:block">
          <ol className="sticky top-24 space-y-1">
            {steps.map((s, i) => {
              const complete = i < index && (s.valid === undefined || s.valid === true)
              const reachable = i <= maxSeen || i <= index + 1
              return (
                <li key={s.id}>
                  <button
                    disabled={!reachable || running}
                    onClick={() => go(i)}
                    className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${i === index ? "bg-card" : "hover:bg-card/60"} disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <span className={`bq-mono mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] ${i === index ? "border-primary text-primary" : complete ? "border-accent/60 bg-accent/10 text-accent" : "border-border text-muted-foreground"}`}>
                      {complete ? <Check className="size-3.5" /> : String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className={`block text-sm ${i === index ? "text-foreground" : "text-[color:var(--bq-ivory-dim)]"}`}>{s.title}</span>
                      {s.caption && i === index && <span className="mt-0.5 block text-xs text-muted-foreground">{s.caption}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <section key={current.id} className="bq-rise min-w-0 rounded-2xl border border-border bg-card/80 p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] sm:p-8">
          <p className="bq-label">{String(index + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</p>
          <h2 className="bq-display mt-2 text-2xl font-semibold">{current.title}</h2>
          {current.caption && <p className="mt-1 text-sm text-muted-foreground">{current.caption}</p>}

          <div className="mt-6">
            {!isReview && current.content}
            {isReview && (
              <div className="space-y-5">
                {firstInvalid >= 0 && (
                  <button onClick={() => go(firstInvalid)} className="flex w-full items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-left text-sm">
                    <AlertCircle className="size-4 shrink-0 text-destructive" />
                    <span>Step {firstInvalid + 1} needs attention: {String(props.steps[firstInvalid].valid)}</span>
                  </button>
                )}
                <div>
                  <p className="text-sm text-[color:var(--bq-ivory-dim)]">
                    Your wallet will ask you to sign {props.plan.length === 1 ? "one transaction" : `${props.plan.length} transactions`}, in this order. Each one is public on the chain once confirmed.
                  </p>
                  <ol className="mt-4 divide-y divide-border rounded-xl border border-border">
                    {props.plan.map((a, i) => {
                      const st = status[a.id] ?? "idle"
                      return (
                        <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                          <span className="mt-0.5">
                            {st === "done" ? <Check className="size-4 text-accent" /> : st === "running" ? <Loader2 className="size-4 animate-spin text-primary" /> : st === "error" ? <AlertCircle className="size-4 text-destructive" /> : <CircleDashed className="size-4 text-muted-foreground" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm"><span className="bq-mono mr-2 text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>{a.label}</span>
                            {a.detail && <span className="mt-0.5 block text-xs text-muted-foreground">{a.detail}</span>}
                          </span>
                        </li>
                      )
                    })}
                  </ol>
                </div>
                {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">That step did not go through: {error}. Everything before it is already done; signing again continues from here.</p>}
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
            <Button variant="ghost" disabled={index === 0 || running} onClick={() => go(index - 1)}>Back</Button>
            <div className="flex items-center gap-3">
              {blocker && <span className="hidden text-xs text-muted-foreground sm:inline">{blocker}</span>}
              {!isReview && <Button disabled={!!blocker} onClick={() => go(index + 1)}>Continue</Button>}
              {isReview && !isConnected && <ConnectButton />}
              {isReview && isConnected && (
                <Button disabled={running || firstInvalid >= 0} onClick={run}>
                  {running ? `Signing ${doneCount + 1} of ${props.plan.length}…` : error ? "Continue signing" : props.signLabel}
                </Button>
              )}
            </div>
          </div>
        </section>

        {props.summary && props.summary.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border bg-card/50 p-5">
              <p className="bq-label">Summary</p>
              <dl className="mt-4 space-y-3">
                {props.summary.map((r) => (
                  <div key={r.label}>
                    <dt className="text-xs text-muted-foreground">{r.label}</dt>
                    <dd className="mt-0.5 break-words text-sm">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
