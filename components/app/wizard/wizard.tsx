"use client"
import { useEffect, useRef, useState } from "react"
import { useAccount } from "wagmi"
import type { TransactionReceipt } from "viem"
import { Check, Loader2, AlertCircle, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@/components/app/connect-button"
import { useTx } from "@/lib/bitregalo/hooks"
import { cn } from "@/lib/utils"

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
/** `kind: "message"` for a step that only asks the wallet to sign a message (no fee, nothing on the chain). */
export type WizardAction = { id: string; label: string; detail?: string; kind?: "tx" | "message"; run: (ctx: RunContext) => Promise<void> }
export type SummaryRow = { label: string; value: React.ReactNode }

type Status = "idle" | "running" | "done" | "error"

const count = (n: number, one: string, many: string) => (n === 1 ? `one ${one}` : `${n} ${many}`)
function signSummary(plan: WizardAction[]) {
  const messages = plan.filter((a) => a.kind === "message").length
  const txs = plan.length - messages
  if (messages === 0) return count(txs, "transaction", "transactions")
  if (txs === 0) return count(messages, "message", "messages")
  return `${count(txs, "transaction", "transactions")} and ${count(messages, "message", "messages")}`
}

export function Wizard(props: {
  /** Kept so callers compile; the title says what the wizard is. */
  eyebrow?: string
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
    { id: "__review", title: "Review and sign", caption: "Nothing happens until you sign.", content: null, valid: true },
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

  if (finished) return <div className="rise mx-auto max-w-2xl">{props.done(results.current)}</div>

  const doneCount = props.plan.filter((a) => status[a.id] === "done").length
  const summary = props.summary && props.summary.length > 0 ? props.summary : null
  // Laid out by the space the wizard actually has (a container query), not the window:
  // inside a workspace the sidebar takes part of the screen.
  return (
    <div className="@container">
      <header className="mb-7 max-w-[62ch]">
        <h1 className="t-title">{props.title}</h1>
        <p className="mt-2.5 text-base text-muted-foreground">{props.intro}</p>
      </header>

      {/* Phones and tablets: where you are, in one line. */}
      <div className="mb-5 @3xl:hidden">
        <p className="text-sm text-muted-foreground">
          Step {index + 1} of {steps.length}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={index + 1} aria-label="Progress">
          <div className="h-full origin-left rounded-full bg-gold-line transition-transform duration-300 ease-out" style={{ transform: `scaleX(${(index + 1) / steps.length})` }} />
        </div>
      </div>

      <div className={cn("grid gap-x-8 gap-y-6", summary ? "@3xl:grid-cols-[12rem_minmax(0,1fr)] @4xl:grid-cols-[12rem_minmax(0,1fr)_15rem]" : "@3xl:grid-cols-[12rem_minmax(0,1fr)]")}>
        <nav aria-label="Steps" className="hidden @3xl:block">
          <ol className="sticky top-[calc(var(--topbar-h)+1.5rem)] space-y-0.5">
            {steps.map((s, i) => {
              const complete = i < index && (s.valid === undefined || s.valid === true)
              const reachable = i <= maxSeen || i <= index + 1
              const here = i === index
              return (
                <li key={s.id}>
                  <button
                    disabled={!reachable || running}
                    onClick={() => go(i)}
                    aria-current={here ? "step" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed",
                      here ? "bg-secondary font-[600] text-foreground" : reachable ? "text-muted-foreground hover:bg-secondary/60 hover:text-foreground" : "text-subtle"
                    )}
                  >
                    <span className={cn("t-num flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-[600]",
                      here ? "border-gold-line bg-gold-fill text-gold" : complete ? "border-success bg-success-fill text-success" : "border-border")}>
                      {complete ? <Check className="size-3.5" /> : i + 1}
                    </span>
                    {s.title}
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <section key={current.id} className="rise min-w-0 rounded-xl border border-border bg-card px-5 py-6 sm:px-7 sm:py-7">
          <h2 className="t-heading">{current.title}</h2>
          {current.caption && <p className="mt-1 text-sm text-muted-foreground">{current.caption}</p>}

          <div className="mt-6">
            {!isReview && current.content}
            {isReview && (
              <div className="space-y-5">
                {firstInvalid >= 0 && (
                  <button onClick={() => go(firstInvalid)} className="flex w-full items-center gap-3 rounded-lg bg-destructive-fill px-4 py-3 text-left text-sm text-foreground">
                    <AlertCircle className="size-4 shrink-0 text-destructive" />
                    <span>Step {firstInvalid + 1} needs attention: {String(props.steps[firstInvalid].valid)}</span>
                  </button>
                )}
                {summary && (
                  <dl className="grid gap-x-8 gap-y-3 rounded-lg bg-secondary px-4 py-4 sm:grid-cols-2 @4xl:hidden">
                    {summary.map((r) => (
                      <div key={r.label} className="min-w-0">
                        <dt className="text-xs text-muted-foreground">{r.label}</dt>
                        <dd className="mt-0.5 break-words text-sm font-[520]">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Your wallet will ask you to sign {signSummary(props.plan)}, in this order. {props.plan.some((a) => a.kind === "message") ? "Transactions are public on the chain once confirmed; a signed message costs nothing." : "Each one is public on the chain once confirmed."}
                  </p>
                  <ol className="mt-4 divide-y divide-border rounded-lg border border-border">
                    {props.plan.map((a, i) => {
                      const st = status[a.id] ?? "idle"
                      return (
                        <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                          <span className="mt-0.5">
                            {st === "done" ? <Check className="size-4 text-success" /> : st === "running" ? <Loader2 className="size-4 animate-spin text-gold" /> : st === "error" ? <AlertCircle className="size-4 text-destructive" /> : <Circle className="size-4 text-subtle" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-[520]"><span className="t-num mr-2 text-subtle">{i + 1}.</span>{a.label}</span>
                            {a.detail && <span className="mt-0.5 block text-xs text-muted-foreground">{a.detail}</span>}
                          </span>
                        </li>
                      )
                    })}
                  </ol>
                </div>
                {error && <p className="rounded-lg bg-destructive-fill px-4 py-3 text-sm">That step did not go through: {error}. Everything before it is already done; signing again continues from here.</p>}
              </div>
            )}
          </div>

          {blocker && <p className="mt-6 text-sm text-muted-foreground" role="status">{blocker}</p>}
          <div className={cn("flex items-center justify-between gap-3 border-t border-border pt-5", blocker ? "mt-3" : "mt-8")}>
            <Button variant="ghost" disabled={index === 0 || running} onClick={() => go(index - 1)}>Back</Button>
            {!isReview && <Button disabled={!!blocker} onClick={() => go(index + 1)}>Continue</Button>}
            {isReview && !isConnected && <ConnectButton />}
            {isReview && isConnected && (
              <Button disabled={running || firstInvalid >= 0} onClick={run}>
                {running ? `Signing ${doneCount + 1} of ${props.plan.length}…` : error ? "Continue signing" : props.signLabel}
              </Button>
            )}
          </div>
        </section>

        {summary && (
          <aside className="hidden @4xl:block">
            <div className="sticky top-[calc(var(--topbar-h)+1.5rem)]">
              <h2 className="text-sm font-[600]">Summary</h2>
              <dl className="mt-3 space-y-3 border-t border-border pt-3">
                {summary.map((r) => (
                  <div key={r.label}>
                    <dt className="text-xs text-muted-foreground">{r.label}</dt>
                    <dd className="mt-0.5 break-words text-sm font-[520]">{r.value}</dd>
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
