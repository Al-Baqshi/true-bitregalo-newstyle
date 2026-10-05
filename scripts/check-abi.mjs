#!/usr/bin/env node
/*
 * Checks every contract call in the app's source against the ABIs in lib/bitregalo/bitregalo.json.
 *
 *   node scripts/check-abi.mjs            a summary, and every mismatch
 *   node scripts/check-abi.mjs --verbose  also lists every call that was checked
 *   node scripts/check-abi.mjs --bundle <file>   check against another bundle file
 *
 * A call is an object literal with `functionName`, as wagmi and viem take it:
 *   { address, abi: abis.instance, functionName: "pay", args: [...] }      or
 *   { ...instance, functionName: "getRfp", args: [id] }
 * For each one the script finds the ABI it is called on, then checks that the function exists and
 * that the number of arguments is the number the ABI takes. Where an argument is written as an
 * object literal for a struct, its field names are checked against the struct's. Event names read
 * with `eventArgs(receipt, abi, "Name")` and `eventName: "Name"` are checked too.
 *
 * The code samples shown to integrators (components/app/connect/samples.ts) are checked the same
 * way. It exits non-zero when anything does not match, or when a call cannot be resolved.
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"

const root = path.join(import.meta.dirname, "..")
const verbose = process.argv.includes("--verbose")
// `--bundle <file>` checks against another bundle, for example one generated for another network.
const other = process.argv.indexOf("--bundle")
const bundle = JSON.parse(readFileSync(other > 0 ? process.argv[other + 1] : path.join(root, "lib/bitregalo/bitregalo.json"), "utf8"))

const OWNABLE = ["owner", "pendingOwner", "transferOwnership", "acceptOwnership"]
/** Names the source uses for an ABI, and the ABI each one stands for. */
const ABIS = {
  ...Object.fromEntries(Object.entries(bundle.abis).map(([k, v]) => [`abis.${k}`, v])),
  // Derived in lib/bitregalo/config.ts: two-step ownership, the same on every platform contract.
  "abis.ownable": bundle.abis.mother.filter((x) => x.type === "function" && OWNABLE.includes(x.name)),
  // The names the integrator samples import from the generated ABI file.
  recordsAbi: bundle.abis.instance,
  vaultAbi: bundle.abis.vault,
  workspaceTreasuryAbi: bundle.abis.workspaceTreasury,
  erc20Abi: bundle.abis.erc20,
  tokenFactoryAbi: bundle.abis.tokenFactory,
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(name)) out.push(p)
  }
  return out
}

const OPEN = "{[("
const CLOSE = "}])"

/** Index of the bracket that closes the one at `i`. */
function closing(text, i) {
  let depth = 0
  for (let j = i; j < text.length; j++) {
    if (OPEN.includes(text[j])) depth++
    else if (CLOSE.includes(text[j]) && --depth === 0) return j
  }
  return -1
}
/** Index of the `{` that encloses position `i`. */
function enclosingBrace(text, i) {
  let depth = 0
  for (let j = i; j >= 0; j--) {
    if (text[j] === "}") depth++
    else if (text[j] === "{") {
      if (depth === 0) return j
      depth--
    }
  }
  return -1
}
/** Splits at commas that are not inside brackets or quotes. */
function splitTop(text) {
  const parts = []
  let depth = 0
  let quote = null
  let from = 0
  for (let j = 0; j < text.length; j++) {
    const c = text[j]
    if (quote) {
      if (c === "\\") j++
      else if (c === quote) quote = null
    } else if (c === '"' || c === "`") quote = c
    else if (OPEN.includes(c)) depth++
    else if (CLOSE.includes(c)) depth--
    else if (c === "," && depth === 0) { parts.push(text.slice(from, j)); from = j + 1 }
  }
  parts.push(text.slice(from))
  return parts.map((p) => p.trim()).filter((p) => p !== "" && !p.startsWith("//"))
}
const stripComments = (text) => text.replace(/^\s*\/\/.*$/gm, "")
/** The properties of an object literal: `{ key: value, ...spread }`. */
function properties(objectText) {
  const out = { spreads: [], keys: {} }
  for (const part of splitTop(stripComments(objectText.slice(1, -1)))) {
    if (part.startsWith("...")) out.spreads.push(part.slice(3).trim())
    else {
      const m = part.match(/^([A-Za-z_$][\w$]*)\s*(?::\s*([\s\S]*))?$/)
      if (m) out.keys[m[1]] = (m[2] ?? m[1]).trim()
    }
  }
  return out
}
const strings = (text) => [...text.matchAll(/"([A-Za-z_]\w*)"/g)].map((m) => m[1])

/** ABI literals declared in a file, e.g. `const entryPointAbi = [ ... ] as const`. */
function localAbis(text) {
  const out = {}
  for (const m of text.matchAll(/const\s+(\w+)\s*(?::\s*Abi)?\s*=\s*\[/g)) {
    const start = m.index + m[0].length - 1
    const end = closing(text, start)
    const literal = text.slice(start, end + 1)
    if (!/type:\s*"function"/.test(literal)) continue
    try { out[m[1]] = new Function(`return ${literal}`)() } catch {}
  }
  for (const m of text.matchAll(/const\s+(\w+)\s*=\s*(abis\.\w+)\s*$/gm)) out[m[1]] = ABIS[m[2]]
  return out
}

/** The function names an identifier used as `functionName` can stand for. */
function namesOf(identifier, text, at) {
  // ["a", "b"].map((fn) => ({ ..., functionName: fn }))
  const before = text.slice(0, at)
  const map = [...before.matchAll(new RegExp(`\\[([^\\[\\]]*)\\]\\s*\\.map\\(\\(${identifier}\\)\\s*=>`, "g"))].pop()
  if (map) return strings(map[1])
  // const act = (label: string, fn: string) => ...   called as   act("Release payment", "release")
  const fn = [...before.matchAll(/const\s+(\w+)\s*=\s*\(([^()]*)\)\s*=>/g)].filter((m) => m[2].split(",").some((p) => p.trim().split(":")[0].trim() === identifier)).pop()
  if (fn) {
    const index = fn[2].split(",").findIndex((p) => p.trim().split(":")[0].trim() === identifier)
    const found = []
    for (const call of text.matchAll(new RegExp(`\\b${fn[1]}\\(`, "g"))) {
      const open = call.index + call[0].length - 1
      const args = splitTop(text.slice(open + 1, closing(text, open)))
      const lit = args[index]?.match(/^"(\w+)"$/)
      if (lit) found.push(lit[1])
    }
    return [...new Set(found)]
  }
  return []
}

const problems = []
const checked = []
const skipped = []
const perAbi = new Map()

function checkStruct(where, fn, input, argText) {
  if (input.type !== "tuple" || !argText.startsWith("{")) return
  const given = Object.keys(properties(argText.slice(0, closing(argText, 0) + 1)).keys).sort()
  const wanted = input.components.map((c) => c.name).sort()
  if (given.join(",") !== wanted.join(",")) {
    problems.push(`${where}  ${fn}: struct fields are {${given.join(", ")}}, the ABI wants {${wanted.join(", ")}}`)
  }
}

for (const file of [...walk(path.join(root, "app")), ...walk(path.join(root, "components")), ...walk(path.join(root, "lib"))]) {
  const text = readFileSync(file, "utf8")
  const rel = path.relative(root, file)
  const local = localAbis(text)
  const lineOf = (i) => text.slice(0, i).split("\n").length
  const resolve = (expr) => {
    const name = expr.replace(/\s+as\s+\w+$/, "").trim()
    return ABIS[name] ?? local[name]
  }

  for (const m of text.matchAll(/\bfunctionName\s*:/g)) {
    const where = `${rel}:${lineOf(m.index)}`
    const open = enclosingBrace(text, m.index)
    const object = text.slice(open, closing(text, open) + 1)
    const props = properties(object)
    const value = props.keys.functionName ?? ""

    // Which function(s): a literal, a choice between literals, or an identifier bound elsewhere.
    // In `cond ? "a" : "b"` only the two outcomes are names, not strings the condition compares with.
    let names = strings(value.includes("?") ? value.slice(value.indexOf("?")) : value)
    if (names.length === 0 && /^[A-Za-z_$][\w$]*$/.test(value)) names = namesOf(value, text, m.index)
    if (names.length === 0) {
      // A type declaration (`functionName: string`) or the generic sender is not a call.
      if (/^string\b/.test(value) || /TxParams|type Call\b/.test(text.slice(Math.max(0, open - 80), open))) { skipped.push(`${where}  a type, not a call: functionName: ${value.slice(0, 40)}`); continue }
      problems.push(`${where}  cannot tell which function \`${value}\` is`)
      continue
    }

    // Which ABI: `abi: X`, or a spread of an object that carries one.
    let abiName = props.keys.abi
    if (!abiName) {
      for (const s of props.spreads) {
        const def = [...text.matchAll(new RegExp(`(?:const\\s+${s}\\s*=|\\b${s}\\s*:)\\s*\\{[^{}]*\\babi:\\s*([\\w.]+)`, "g"))].pop()
        if (def) abiName = def[1]
      }
    }
    const abi = abiName ? resolve(abiName) : undefined
    if (!abi) { problems.push(`${where}  ${names.join("/")}: cannot find the ABI (${abiName ?? "none given"})`); continue }

    const argsText = props.keys.args
    let args = []
    if (argsText !== undefined) {
      if (!argsText.startsWith("[")) { problems.push(`${where}  ${names.join("/")}: args is not written as a list`); continue }
      args = splitTop(stripComments(argsText.slice(1, closing(argsText, 0))))
    }
    for (const name of names) {
      const candidates = abi.filter((x) => x.type === "function" && x.name === name)
      const label = abiName.replace(/^abis\./, "")
      perAbi.set(label, (perAbi.get(label) ?? 0) + 1)
      checked.push(`${where}  ${label}.${name}(${args.length})`)
      if (candidates.length === 0) { problems.push(`${where}  ${label} has no function ${name}`); continue }
      const match = candidates.find((x) => x.inputs.length === args.length)
      if (!match) { problems.push(`${where}  ${label}.${name} takes ${candidates.map((x) => x.inputs.length).join(" or ")} argument(s) (${candidates[0].inputs.map((i) => i.name || i.type).join(", ")}), the app passes ${args.length}`); continue }
      match.inputs.forEach((input, i) => checkStruct(where, `${label}.${name}`, input, args[i]))
    }
  }

  // Events: eventArgs<T>(receipt, abis.x, "Name") and parseEventLogs({ abi, eventName: "Name" }).
  const events = [
    ...[...text.matchAll(/eventArgs<[^>]*>\(\s*\w+\s*,\s*([\w.]+)\s*,\s*"(\w+)"\s*\)/g)].map((m) => ({ at: m.index, abiName: m[1], name: m[2] })),
    ...[...text.matchAll(/abi:\s*([\w.]+)\s*,\s*eventName:\s*"(\w+)"/g)].map((m) => ({ at: m.index, abiName: m[1], name: m[2] })),
  ]
  for (const e of events) {
    const where = `${rel}:${lineOf(e.at)}`
    const abi = resolve(e.abiName)
    const label = e.abiName.replace(/^abis\./, "")
    checked.push(`${where}  ${label} event ${e.name}`)
    if (!abi) problems.push(`${where}  event ${e.name}: cannot find the ABI (${e.abiName})`)
    else if (!abi.some((x) => x.type === "event" && x.name === e.name)) problems.push(`${where}  ${label} has no event ${e.name}`)
  }
}

if (verbose) for (const line of [...checked, ...skipped]) console.log(line)
console.log(`bundle: chain ${bundle.chainId}, mother ${bundle.deployments.mother}`)
console.log(`checked ${checked.length} calls and events in the source against the bundle's ABIs`)
console.log([...perAbi.entries()].sort().map(([k, n]) => `${k} ${n}`).join(" · "))
if (problems.length > 0) {
  console.log(`\n${problems.length} problem(s):`)
  for (const p of problems) console.log(`  ${p}`)
  process.exit(1)
}
console.log("every function exists, every argument count matches, every struct has the ABI's fields, every event exists")
