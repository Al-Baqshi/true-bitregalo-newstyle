# BitRegalo web

BitRegalo's public site (bitregalo.com) and the reference web app (`/app`), in one Next.js project.

## What BitRegalo is

BitRegalo is infrastructure for decentralising the part of a system that has to be trusted: its financial actions and its sensitive records. A platform that already takes payments (a marketplace, an enterprise, a bank, a startup) connects to it so that its records cannot be edited afterwards by anyone, its own developers included, and its payment commitments (a held payment, a refund) execute exactly as agreed when they are triggered. Each organisation gets its own contracts, called a workspace. The protocol is not tied to one network: EVM is first, with BNB Smart Chain Testnet as the only deployment today. The web app in this repository is the reference implementation and BitRegalo's own public workspace. It is not the whole product.

Status: a public test network only. The contracts have not been independently audited, nothing runs on a main network, and BitRegalo has no token. An SDK, API keys and webhooks are planned, not built.

## Source-of-truth documents

Read these before changing copy or behaviour. If two of them disagree, fix both.

| Document | What it settles |
| --- | --- |
| `PRODUCT.md` | The vision, what is built and what is only designed, the users, the wording rules and the product vocabulary. |
| `DESIGN.md` | The design system and the voice: themes, type, layout, components, motion. |
| `app/docs/bitregalo-whitepaper.md` | The whitepaper (version 5), rendered at `/whitepaper`. The same vision for outside readers. |
| `docs/market-api.md` | The interface of the marketplace index, shared with `bitregalo-platform`. |
| `docs/admin-api.md` | The interface of the owner's admin overview. |
| `docs/PROTOCOL.md` in the `bitregalo-contracts` repository | The engineering reference: the protocol's rules and how the product's words map to the contracts. |

## Run it

Use npm. The lockfile is `package-lock.json`.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npx tsc --noEmit -p .   # type check
```

`npm run lint` is defined, but ESLint is not among the dependencies yet, so it does not run as the project stands.

## Environment variables

All are optional and read at build time. Put them in `.env.local`.

| Variable | Read in | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_MARKET_API` | `lib/bitregalo/market.ts` | Base URL of the marketplace index. Defaults to the index BitRegalo runs for the built-in network; on another network, without it the app shows records with no descriptions. |
| `NEXT_PUBLIC_NETWORK_NAME`, `NEXT_PUBLIC_NATIVE_SYMBOL`, `NEXT_PUBLIC_EXPLORER_URL`, `NEXT_PUBLIC_PRACTICE_NETWORK` | `lib/bitregalo/config.ts` | Describe a network that is not built in. See "Another network". |
| `NEXT_PUBLIC_RPC_URL` | `lib/bitregalo/config.ts` | RPC endpoint. Defaults to a public BNB Smart Chain Testnet endpoint; set it to point the app at a local fork. |
| `NEXT_PUBLIC_PUBLIC_WORKSPACE` | `lib/bitregalo/config.ts`, `next.config.ts` | Which workspace is the public BitRegalo network served at `/app`. Defaults to `publicWorkspace` in `lib/bitregalo/bitregalo.json`, or 0. |

## Another network

The app serves one network per build. `lib/bitregalo/bitregalo.json` says which: it holds that
network's deployment record and the contract interface files. To build for another network, a
private one included:

```sh
# in bitregalo-contracts: forge build, and deploy (script/try-network.sh does both checks)
node scripts/make-bundle.mjs ../bitregalo-contracts <chainId>
NEXT_PUBLIC_RPC_URL=http://your-node:8545 \
NEXT_PUBLIC_NETWORK_NAME="Your network" \
NEXT_PUBLIC_NATIVE_SYMBOL=ETH \
NEXT_PUBLIC_PRACTICE_NETWORK=1 \
npm run build
```

`NEXT_PUBLIC_EXPLORER_URL` is optional: a private network may have no public block explorer, and
addresses are then shown without links. Networks BitRegalo itself runs on are listed in `NETWORKS`
in `lib/bitregalo/config.ts` and need no variables. This was checked against a private Hyperledger
Besu network on 5 October 2026.

## Where things are

```
app/
  page.tsx              landing page (sections in components/landing)
  layout.tsx            fonts, metadata, theme
  globals.css           design tokens and type roles
  protocols/[slug]/     protocol reference pages: escrow, rfp (requests), rts (listings)
  whitepaper/           renders app/docs/bitregalo-whitepaper.md
  contact/ terms/ privacy/ kyc-policy/ token-terms/
  api/whitepaper/       the whitepaper as Markdown
  docs/                 the whitepaper source and LEGAL-STRATEGY.md
  fonts/                Commissioner and Geist Mono, self-hosted
  app/                  the reference web app
    (network)/          the BitRegalo network, served at /app
    t/[tenant]/         an organisation's workspace, served at /app/t/{id}
    workspaces/ launch/ create/ help/ operator/ admin/
components/
  landing/              landing page sections and demonstrations
  site/                 the document page layout shared by the reading pages
  app/                  the web app: shell, navigation model (nav.ts), UI parts, wizards, connect, market, admin
  brand/ ui/            the logo; buttons, sheets and menus
  navbar.tsx footer.tsx legal-disclaimer.tsx
lib/bitregalo/          chain configuration, hooks, and bitregalo.json (addresses and ABIs of the deployment)
docs/                   market-api.md, admin-api.md
public/                 the brand logo and images
```

The contracts' addresses and interface files come from `lib/bitregalo/bitregalo.json`, a copy of the deployment published by `bitregalo-contracts`.

## Branches and deployment

| Branch | Environment | Built by |
| --- | --- | --- |
| `main` | Production, bitregalo.com | Vercel |
| `app` | Staging, app.bitregalo.com | Railway |

## Related repositories

- `bitregalo-contracts`: the Solidity contracts, their tests and deployments, and the protocol reference (`docs/PROTOCOL.md`).
- `bitregalo-platform`: the services around the contracts (the marketplace index, the gas sponsor, the owner's admin overview). None of them holds tokens.

## Licence

© 2026 BitRegalo® Limited, New Zealand. All rights reserved.
