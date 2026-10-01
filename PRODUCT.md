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
  paid, post a request, sell something) and need to see where the money is at every moment.
- **Workspace admins**: the person who launches an organisation's workspace, sets its rules and fees,
  and runs its shop, treasury and tokens.
- **Suppliers and buyers invited into someone else's workspace**: they answer requests, take listings,
  pay links and redeem what they bought.
- **The platform operator** (BitRegalo itself): watches platform earnings, gas sponsorship and
  contract versions.
- **Evaluators** *(inferred)*: finance, legal and technical people deciding whether to trust the
  protocol. They read the landing page, the protocol pages and the whitepaper.

## Product Purpose

BitRegalo turns a promise about money into a rule a public contract enforces. An organisation
launches its own workspace (its own contracts and its own treasury) and uses it to sell, take
payments, post requests, list offers and hold money in escrow until work is delivered. Success is a
first-time visitor understanding what it does within seconds, and a first-time user completing a
payment, a request or an escrow without needing to understand blockchains.

## Positioning

- **Non-custodial escrow with fixed outcomes.** The issuer can only release, the receiver can only
  hand back, and an expired escrow returns to the issuer automatically. Nobody else, including
  BitRegalo and the workspace admin, can move the money.
- **Each organisation runs its own contract.** A workspace is a pair of contracts (records + vault)
  plus a treasury owned by its admin, not an account on someone else's ledger.
- **Everything is a public record.** Requests, offers, awards and payments are written to a public
  blockchain; a "hidden title" stores only a fingerprint of the wording.

## Operating Context

- Used through a browser wallet (MetaMask, Brave Wallet, Rabby, Trust and others found via EIP-6963).
  Every action is a transaction the user signs; nothing happens until they sign.
- Currently runs on **BNB Smart Chain Testnet**, presented as a *practice network*: money there has
  no value, and a faucet gives 1,000 tUSD of practice money per day. Mainnet follows an audit.
- Three ways to settle a request or listing: **just record it** (no money moves), **pay straight
  away** (direct), or **hold it safely** (escrow).
- Fees: a **platform fee** (a percentage taken from what the supplier receives, fixed per workspace)
  and a **service fee** (a flat amount per payment, paid by the buyer).
- Named use cases on the site: construction (head contractor and subcontractors), nonprofits and
  donations, freelance work and milestones, cross-border trade, grants and allocations.

## Capabilities and Constraints

Confirmed functionality in the app today:

- Workspaces: launch wizard, overview, settings (accepted tokens, settlement modes).
- Shop: sell utilities (tokens such as vouchers, credits, memberships) for a stablecoin; buyers redeem.
- Payments: pay someone, payment links and QR codes ("Get paid"), receipts.
- Requests (RFP): post, receive offers, award, settle. Listings (fixed-price offers a buyer takes).
- Escrows: release, hand back, automatic return at the deadline.
- Projects (grouping), Tokens (create, accept as payment), Treasury (workspace-owned funds).
- Platform page for the operator: earnings by token, gas sponsorship, contract versions, ownership.
- Older workspaces (version 0) lack shop, payments and treasury and show an "older contract" notice.

Product vocabulary (use these words, with these meanings): Workspace, Request, Offer, Listing,
Escrow, Hidden title, Project, Token, Treasury, Utility sale, Redeem, Payment link, Platform fee,
Service fee, Testnet / practice network.

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
- Voice: plain, direct, calm. Explains what happens to the money in everyday words. No hype, no
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

1. **Say what happens to the money.** Every screen that involves a payment states who can move it,
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
