# Product

<!-- impeccable:product-schema 1 -->

> Written 2 Oct 2026 from the repository, the live app copy and the owner's design brief, without a
> separate interview (the owner asked for the work to carry on). Items marked *(inferred)* were not
> confirmed in words and should be corrected here if wrong.

## Platform

web

A native mobile app is planned by the owner. The web app must already work well on a phone, and its
navigation is organised so the same structure can carry over to that app.

## Users

- **People in organisations who pay, get paid, or commission work**: a builder paying subcontractors,
  a charity releasing a grant, a business selling vouchers or memberships, a freelancer invoicing a
  client. Many have never used a blockchain. They arrive wanting to do one thing (pay someone, get
  paid, post a request, sell something) and need to see where their payment is at every moment.
- **Workspace admins**: the person who launches an organisation's workspace, sets its rules and fees,
  and runs its shop, treasury and tokens.
- **Suppliers and buyers invited into someone else's workspace**: they answer requests, take listings,
  pay links and redeem what they bought.
- **The platform operator** (BitRegalo itself): watches platform earnings, gas sponsorship and
  contract versions.
- **Evaluators** *(inferred)*: finance, legal and technical people deciding whether to trust the
  protocol. They read the landing page, the protocol pages and the whitepaper.

## Product Purpose

BitRegalo is decentralised infrastructure for commerce: it turns a promise about a payment into a
rule a public contract enforces. It offers four building blocks, all on the same contracts:

- **Escrow**: a payment held until the work is done. The buyer can only release it, the supplier can
  only hand it back, and after the deadline it can only return to the buyer.
- **Requests (RFP)**: "I need this." Suppliers answer with a price and a time; the buyer chooses
  one and settles by escrow, by direct payment, or just records the choice.
- **Listings (RTS)**: "I offer this." A fixed price and delivery time, open to anyone or to one
  named buyer.
- **Workspaces (entities)**: an organisation's own copy of the infrastructure, with its own
  contracts, rules, fees, accepted currencies, tokens, shop and treasury.

There are two ways to use it:

1. **The BitRegalo network**, for anyone, anywhere. Send USDT or a gift to someone, hold a payment in
   escrow for someone, ask for things and offer them in a marketplace browsed by country. USDT is
   the everyday currency between people (tUSD on the practice network). It runs on BitRegalo's own
   public workspace.
2. **Workspaces for organisations.** An organisation (for example an NGO platform, or a
   construction marketplace) runs its own workspace: its own contracts and rules, its own currencies
   (such as a local stablecoin) and its own tokens. Everything done inside it is recorded under it.

Success is a first-time visitor understanding this within seconds, and a first-time user sending
a payment, holding a payment in escrow, or posting a request without needing to understand blockchains.

## Positioning

- **Non-custodial escrow with fixed outcomes.** Nobody else, including BitRegalo and the workspace
  admin, can move a held payment anywhere but to the supplier or back to the buyer.
- **Each organisation runs its own contracts.** A workspace is a pair of contracts (records + vault)
  plus a treasury owned by its admin, not an account on someone else's ledger.
- **A global marketplace by country, on public rails.** Requests and listings are public records;
  their descriptions, country and category are signed by the poster's wallet.

## Operating Context

- Used through a browser wallet (MetaMask, Brave Wallet, Rabby, Trust and others found via EIP-6963).
  Every action is a transaction the user signs; nothing happens until they sign.
- Currently runs on **BNB Smart Chain Testnet**, presented as a *practice network*: tokens there have
  no value, and a faucet gives 1,000 tUSD of practice tokens per day. Mainnet follows an audit.
- Three ways to settle a request or listing: **just record it** (nothing is paid), **pay straight
  away** (direct), or **hold it safely** (escrow).
- Fees: a **platform fee** (a percentage taken from what the supplier receives, fixed per workspace)
  and a **service fee** (a flat amount per payment, paid by the buyer).
- Named use cases on the site: construction (head contractor and subcontractors), nonprofits and
  donations, freelance work and milestones, cross-border trade, grants and allocations.

## Capabilities and Constraints

Confirmed functionality in the app today (on the network and in every workspace):

- Workspaces: launch wizard, overview, settings (accepted tokens, settlement modes).
- Shop: sell utilities (tokens such as vouchers, credits, memberships) for a stablecoin; buyers redeem.
- Payments: pay someone, payment links and QR codes ("Get paid"), receipts.
- Requests (RFP): post, receive offers, award, settle. Listings (fixed-price offers a buyer takes).
- Escrows: release, hand back, and after the deadline a return to the buyer that anyone can trigger.
- Projects (grouping), Tokens (create, accept as payment), Treasury (workspace-owned funds).
- Platform page for the operator: earnings by token, gas sponsorship, contract versions, ownership.
- Older workspaces (version 0) lack shop, payments and treasury and show an "older contract" notice.
- Marketplace details (title, description, category, country, city) live in an off-chain index
  (bitregalo-platform `cmd/market`, Postgres on Railway), each entry signed by the record's owner.
  Contract of record: `docs/market-api.md`.
- A super admin page (`/app/admin`) for the registry owner: contracts, workspaces, wallets seen
  on chain, value held, funding and gas balances, marketplace and roadmap; sign-in and KYC
  statistics come from an owner-signed admin API (`docs/admin-api.md`).
- Every workspace has a "Connect a platform" page: addresses, ABIs, code examples, link formats
  and the marketplace API, so an organisation can use its workspace from its own platform.
- Not built yet, by decision: the KYC bridge (contracts already support EIP-712 KYC vouchers per
  workspace; kyc.baqshi.com would verify and a BitRegalo attester would sign), goal-based
  crowdfunding (needs a new contract and NZ legal advice: reward/donation pre-sales differ from
  offers of financial products under the FMC Act).
- "Hold a payment for someone" uses today's contracts: the buyer sends the supplier a link, the supplier
  lists the job for that one buyer with escrow, the buyer funds it. A one-sided `openEscrow` would
  need a new contract version.

Wording rule (owner, 4 Oct 2026): never "money" in the site or the app. Say "payment(s)", "USDT"
(described accurately as a stablecoin, never as a utility token), "tokens", or "funds" sparingly.
"Utility tokens" means only the vouchers, credits and memberships workspaces issue.

Product vocabulary (use these words, with these meanings): BitRegalo network, Workspace,
Organisation, Request, Offer (an answer to a request), Listing, Escrow, Buyer, Supplier, Release,
Hand back, Returned, Marketplace, Country, Private wording, Project, Token, Treasury, Shop,
Redeem, Payment link, Platform fee, Service fee, Practice network. The contract's own terms
(issuer, receiver, cancel, RFP, RTS, tenant, instance) appear only in technical reference.

Constraints:

- **Legal framing is part of the product.** BitRegalo® Limited (New Zealand) presents itself as a
  technology platform providing decentralised escrow infrastructure, not a financial institution or
  payment service. There is no BitRegalo token and no offering. Copy must not add claims that
  contradict the legal notice, the terms, or the KYC policy.
- No real customers, volumes, testimonials, audits or certifications exist to cite. Do not invent them.
- All chain data is read live; pages must tolerate loading, empty and wrong-network states.

## Brand Commitments

- Name: **BitRegalo®**. Logo: the BR monogram plus the "BitRegalo" wordmark with an orange dot on
  the i (`public/BrandLogo copy.svg`).
- The owner likes the existing colour world (obsidian, ivory, gold, emerald) and wants **both dark
  and light** options.
- Voice: plain, direct, calm. Explains what happens to a payment in everyday words. No hype, no
  crypto slang. British/NZ spelling (organisation, decentralised).
- Owner's stated quality bar: easy to read, easy to understand, easy to navigate, professional, and
  not recognisably AI-generated.

## Evidence on Hand

- A working deployment on BNB Smart Chain Testnet, with contract addresses and ABIs in
  `lib/bitregalo/bitregalo.json`, and every record viewable on the public explorer.
- Protocol descriptions (`app/protocols/[slug]`), a whitepaper (`app/whitepaper`), and legal pages
  (terms, privacy, KYC policy, token terms).
- No customer logos, case studies, press, usage numbers or audit reports. Demonstrations on the
  marketing pages are illustrative and must be labelled as examples.

## Product Principles

1. **Say what happens to the payment.** Every screen that involves a payment states who can move it,
   where it goes, and when.
2. **Plain words first, machinery second.** Addresses, hashes and contract terms are available but
   never the headline.
3. **One clear next step.** Each page has a primary action; setup steps show what is done and what
   is next.
4. **Nothing happens until you sign.** Reviews precede signatures; a failed step can be resumed.
5. **Proof over promise.** Claims are limited to what the contracts do and what a visitor can verify.

## Accessibility & Inclusion

- WCAG 2.2 AA contrast for text and controls in both themes; visible keyboard focus.
- Readable sizes on phones (no body text under 16px; no essential text under 13px); touch targets of
  at least 44px.
- Respects reduced-motion preferences. Works one-handed on a phone.
