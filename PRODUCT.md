# Product

<!-- impeccable:product-schema 1 -->

> Written 2 Oct 2026 from the repository, the live app copy and the owner's design brief, without a
> separate interview (the owner asked for the work to carry on). Items marked *(inferred)* were not
> confirmed in words and should be corrected here if wrong.
>
> **5 Oct 2026: the owner corrected the vision.** BitRegalo is infrastructure that platforms connect
> to, not a consumer payments app. The Vision section below is the source of truth; the whitepaper
> (`app/docs/bitregalo-whitepaper.md`) and the protocol reference in the contracts repo
> (`docs/PROTOCOL.md`) say the same thing for outside readers and for engineers.

## Platform

web

A native mobile app is planned by the owner. The web app must already work well on a phone, and its
navigation is organised so the same structure can carry over to that app.

## Vision

BitRegalo is infrastructure for decentralising the part of a system that has to be trusted: its
financial actions and its sensitive records. A platform that already takes payments, a bank, an
enterprise or a startup connects to BitRegalo so that the records it keeps and the promises it
makes are held by public contracts that nobody can edit afterwards, the platform's own developers
included.

It gives a connected platform two things:

- **Proof.** A record of what happened (an award, a sale, a payment, a redemption) written once,
  readable by anyone, changeable by no one.
- **Guaranteed commitments.** A promise about a payment (hold it until the work is done, hand it
  back, return it after the deadline) locked in a contract, so it executes exactly as agreed when it
  is triggered. A refund is a refund.

Each organisation gets its own contracts, called a workspace, and can run them in two ways: on a
**shared public network**, where anyone can read and verify the records, or on a **private
network** run by the organisation or a group it belongs to, where only members can see anything.
This matters most to banks and enterprises, which often cannot publish amounts or counterparties.
The protocol is the same in both and is not tied to one ledger. EVM is the first implementation:
BNB Smart Chain is the public reference deployment, and the same contracts run unchanged on a
private Hyperledger Besu network. Stellar and Hyperledger Fabric are planned as separate
implementations, and BitRegalo may run a network of its own when customers or volume call for it. Platforms reach BitRegalo through an SDK and an API. The web app at `/app` is the reference
implementation and BitRegalo's own public workspace. It is not the whole product.

Industries (construction, marketplaces, nonprofits, subscriptions, trade) are examples of use. They
are never the product.

### What is built and what is designed

Say only what is built as built. Everything in the second list is described as planned.

Built and running on the practice network:

- Workspaces: an organisation's own contracts (records and rules, a vault, a treasury its admin owns).
- Commitments: escrow with three fixed outcomes, and direct settlement, both through the vault.
- Records: every request, offer, award, listing, payment, sale and redemption is a permanent record
  with its parties, amounts and an optional reference. Nothing stored can be deleted.
- Tokens an organisation issues and sells for a stablecoin, and that holders redeem.
- A marketplace index for descriptions, signed by the record's owner.
- A page per workspace that gives a developer the addresses, interface files and code examples to
  read records and let users sign actions from another site.
- **Private EVM networks.** On 5 Oct 2026 the unchanged contracts and scripts were deployed to a
  private Hyperledger Besu 26.9.0 network (QBFT, one validator) and exercised end to end with
  `script/try-network.sh` in the contracts repository; the reference app was built for that network
  (`scripts/make-bundle.mjs` plus `NEXT_PUBLIC_NETWORK_*`) and read its records. It was a test on
  one node: say "tested on Hyperledger Besu", never "in production" or "used by".

Designed, not built (in the order planned for the next contract version):

- **Delivery confirmation**, the supplier's side of escrow. Today only the buyer's own wallet can
  release, so a buyer who has received the goods can decline to release and wait for the return.
  Three parts:
  - **Delivery code.** When the buyer orders, the app creates a long random secret and the contract
    stores only its fingerprint with the escrow. The buyer sends the code to the recipient as a QR
    code or link (it can be printed). On delivery the supplier scans it; presenting it releases the
    held payment to the supplier on the spot and records the handover with its time, which is the
    supplier's proof of fulfilment. The recipient needs no wallet, app or account. Presenting the
    code can only ever send the payment to the supplier. The code must be long, random and carried
    in the QR: a short typed PIN can be guessed against the stored fingerprint. The supplier must
    never see it before delivery.
  - **Buyer-approved extension of the term**, so an order can wait for a late delivery instead of
    returning.
  - **A deadline watcher**: a service that sends the return transaction when a term passes, so the
    return needs nobody to act. Until it runs, never write that a payment returns "automatically".
- **General records**: a record of any event a platform wants to prove (a subscription, a sale made
  elsewhere, an approval), written by the platform's own key.
- **Platform-triggered commitments**: a key a workspace authorises to act for it from a server, and
  commitment types such as a refund window.
- **A server-side API with keys, webhooks and an indexer**, and a published **SDK**.
- **For private networks**: anchoring (publishing a fingerprint of a private network's state to a
  public one, so a rewrite can be detected) and one installation that serves several networks.
  Always say what the guarantee rests on: a private network is only as honest as its validators,
  so they must be held by independent parties.
- **Other ledgers**: implementations for Stellar (Soroban) and Hyperledger Fabric (chaincode), to
  the same rules. Not started.
- An independent audit, mainnet, and signing in without a wallet.

## Users

- **Platforms that connect**: product owners and developers at payment platforms, marketplaces,
  enterprises, banks and startups. They keep their own product and connect BitRegalo for the records
  and commitments that must not depend on trusting them. They read the whitepaper, the protocol
  reference and the "Connect a platform" page first. This is the customer BitRegalo is built for.
- **Workspace admins**: the person who launches an organisation's workspace, sets its rules and fees,
  and runs its shop, treasury and tokens.
- **Buyers and suppliers inside a workspace or on the network**: they pay, get paid, answer requests,
  take listings and redeem what they bought. Many have never used a blockchain and need to see where
  their payment is at every moment.
- **The platform operator** (BitRegalo itself): watches platform earnings, gas sponsorship and
  contract versions.
- **Evaluators**: investors and finance, legal and technical people deciding whether to trust the
  protocol. They read the landing page, the whitepaper and the protocol pages, and they check claims
  against the chain.

## Product Purpose

BitRegalo turns a record or a promise about a payment into something a public contract keeps, so it
no longer depends on trusting whoever runs the system. The building blocks, all on the same
contracts:

- **Records**: who asked, who answered, who was chosen, what was paid, sold or redeemed, and when.
  Written once. Nothing can be edited or deleted afterwards.
- **Escrow**: a payment held until the work is done. The buyer can only release it, the supplier can
  only hand it back, and after the deadline it can only return to the buyer.
- **Requests** and **listings**: "I need this" and "I offer this", settled by escrow, by direct
  payment, or just recorded.
- **Workspaces**: an organisation's own copy of the infrastructure, with its own contracts, rules,
  fees, accepted currencies, tokens, shop and treasury.

There are three ways to use it, in this order of importance:

1. **Connect a platform.** An existing product reads BitRegalo's records and has its users sign
   BitRegalo actions from inside its own site, app or back office. Today this is done with the public
   interface files and code examples; an SDK and a server-side API are planned.
2. **Run a workspace.** An organisation launches its own contracts and uses them through the web app
   or its own platform. Everything done inside it is recorded under it.
3. **Use the BitRegalo network.** BitRegalo's own public workspace, open to anyone, and the place to
   try every part of the protocol: pay someone, hold a payment in escrow, ask for things and offer
   them in a marketplace browsed by country.

Success is an evaluator understanding in a minute what BitRegalo makes impossible to fake, and a
developer connecting a first record or a first held payment in an afternoon.

## Positioning

- **Records nobody can edit, including BitRegalo and the platform that wrote them.** The proof does
  not depend on trusting the system that produced it.
- **Commitments with fixed outcomes.** Nobody, including BitRegalo and the workspace admin, can move
  a held payment anywhere but to the supplier or back to the buyer.
- **Each organisation runs its own contracts.** A workspace is a set of contracts (records and rules,
  a vault, a treasury its admin owns), not an account on someone else's ledger.
- **Infrastructure, not a payment service.** BitRegalo never holds anyone's tokens and no BitRegalo
  server is in a payment's path.
- **Public or private.** The same contracts run on a shared public network or on an organisation's
  own private network. EVM first (tested on Hyperledger Besu); Stellar and Hyperledger Fabric are
  planned.

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
Redeem, Payment link, Platform fee, Service fee, Practice network, Delivery code (planned),
Recipient (the person the goods are delivered to, who may be neither buyer nor supplier). The
contract's own terms (issuer, receiver, cancel, RFP, RTS, tenant, instance) appear only in
technical reference. Never call the recipient "the receiver": in the contracts that word means the
supplier.

Constraints:

- **Legal framing is part of the product.** BitRegalo® Limited (New Zealand) presents itself as a
  technology company providing decentralised infrastructure for records and payment commitments, not
  a financial institution or payment service. There is no BitRegalo token and no offering. Copy must
  not add claims that contradict the legal notice, the terms, or the KYC policy.
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
- Protocol descriptions (`app/protocols/[slug]`), the whitepaper (`app/whitepaper`, version 5 of
  5 Oct 2026), and legal pages (terms, privacy, identity checks).
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
