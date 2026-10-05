#!/usr/bin/env node
/*
 * Builds lib/bitregalo/bitregalo.json, the one file that tells the app which network it serves
 * and how to talk to the contracts on it: the deployment record for that network plus the
 * interface files (ABIs) the app calls.
 *
 *   node scripts/make-bundle.mjs <path to bitregalo-contracts> <chain id>
 *
 * The path needs two things in it: `out/` (run `forge build` in the contracts repository first)
 * and `deployments/<chain id>.json`. The app talks to protocol version 2 only, so the contracts
 * must be version 2. The app serves one network per build:
 * to point it at another network (a private one, say), generate the bundle for that network's
 * chain id and set the NEXT_PUBLIC_NETWORK_* variables described in README.md.
 */
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const [contracts, chainId] = process.argv.slice(2)
if (!contracts || !chainId) {
  console.error("usage: node scripts/make-bundle.mjs <path to bitregalo-contracts> <chain id>")
  process.exit(1)
}
const read = (p) => JSON.parse(readFileSync(path.join(contracts, p), "utf8"))
const abi = (file, name = file) => read(`out/${file}.sol/${name}.json`).abi
const ERC20 = new Set(["Approval", "Transfer", "allowance", "approve", "balanceOf", "totalSupply", "transfer", "transferFrom"])

const bundle = {
  chainId: Number(chainId),
  deployments: read(`deployments/${chainId}.json`),
  abis: {
    mother: abi("BitRegaloMother"),
    instance: abi("BitRegaloInstance"),
    vault: abi("EscrowVault"),
    tokenFactory: abi("TokenFactory"),
    utilityToken: abi("UtilityToken"),
    erc20: abi("IERC20").filter((x) => ERC20.has(x.name)),
    workspaceTreasury: abi("WorkspaceTreasury"),
    // The platform fee treasury (its owner withdraws with `sweep`) and the practice token's faucet.
    treasury: abi("Treasury"),
    testStable: abi("TestStable").filter((x) => !ERC20.has(x.name)),
  },
}
if (bundle.deployments.chainId !== bundle.chainId) {
  console.error(`deployments/${chainId}.json says chain ${bundle.deployments.chainId}`)
  process.exit(1)
}
// The record says which protocol version it is; the app is written for version 2 and nothing else.
const version = bundle.deployments.protocolVersion
if (version !== undefined && Number(version) !== 2) {
  console.error(`deployments/${chainId}.json is protocol version ${version}; this app works with version 2 only`)
  process.exit(1)
}
const out = path.join(import.meta.dirname, "..", "lib/bitregalo/bitregalo.json")
writeFileSync(out, JSON.stringify(bundle, null, 1) + "\n")
console.log(`wrote ${path.relative(process.cwd(), out)} for chain ${chainId}`)
