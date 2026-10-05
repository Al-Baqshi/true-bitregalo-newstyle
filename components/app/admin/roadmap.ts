/*
 * The production plan shown at the bottom of the super admin page (/app/admin).
 * Edit freely: change a `status`, add an item, reword a note. The page only reads this file.
 *
 * Status words: "Done", "In progress", "Next", "Waiting for you" (something only the owner
 * can do, such as signing or a decision). A `live` item is also checked against the chain,
 * and shows "Done" on its own once the chain says it is done.
 */
export type Status = "Done" | "In progress" | "Next" | "Waiting for you"

export type RoadmapItem = {
  title: string
  status: Status
  note?: string
  live?: "public-network" | "launch-fee-tusd"
}
export type Phase = { n: number; title: string; status: Status; items: RoadmapItem[] }

/*
 * Phases 1 and 2 are what is built and running on the practice network. Phases 3 to 10 are
 * the "Designed, not built" list in PRODUCT.md, in the same order. Keep the two in step.
 */
export const PHASES: Phase[] = [
  {
    n: 1,
    title: "Contracts, version 2",
    status: "Done",
    items: [
      { title: "Workspace treasury", status: "Done" },
      { title: "Shop: selling utility tokens", status: "Done" },
      { title: "Redeem", status: "Done" },
      { title: "Pay and payment links", status: "Done" },
      { title: "Hardening after three security reviews", status: "Done", note: "Limits on what a payer is charged, exits that cannot be blocked, sales approved by the treasury's owner, two-step handovers. On the practice network since 6 October 2026. Not audited by an independent firm" },
    ],
  },
  {
    n: 2,
    title: "Reference app",
    status: "Done",
    items: [
      { title: "Step-by-step wizards", status: "Done" },
      { title: "Shop", status: "Done" },
      { title: "Payments", status: "Done" },
      { title: "The BitRegalo network and organisation workspaces", status: "Done" },
      { title: "Marketplace by country", status: "Done" },
      { title: "Practice-token faucet", status: "Done" },
      { title: "Connect a platform page for every workspace", status: "Done", note: "Addresses, interface files, code examples" },
      { title: "Protocol pages", status: "Done" },
      { title: "Light and dark redesign", status: "Done" },
    ],
  },
  {
    n: 3,
    title: "Delivery confirmation",
    status: "Done",
    items: [
      { title: "Delivery code", status: "Done", note: "Protocol version 3 on the practice network. The recipient confirms delivery with a QR code and no wallet; presenting it releases the payment to the supplier and records the handover" },
      { title: "Buyer-approved extension of the term", status: "Done", note: "An order can wait for a late delivery instead of returning" },
      { title: "Deadline watcher", status: "Done", note: "The keeper service returns held payments a few minutes after their deadline and presents delivery codes for people without a wallet" },
    ],
  },
  {
    n: 4,
    title: "General records",
    status: "Next",
    items: [
      { title: "A record of any event a platform wants to prove", status: "Next", note: "A subscription, a sale made elsewhere, an approval. Designed, not built" },
      { title: "Written by the platform's own key", status: "Next", note: "Designed, not built" },
    ],
  },
  {
    n: 5,
    title: "Keys that act for a workspace",
    status: "Next",
    items: [
      { title: "A key a workspace authorises for its own server", status: "Next", note: "Designed, not built" },
      { title: "Commitments a platform triggers without a person at a wallet", status: "Next", note: "Designed, not built" },
    ],
  },
  {
    n: 6,
    title: "More kinds of commitment",
    status: "Next",
    items: [
      { title: "Refund window", status: "Next", note: "For goods and services with no handover to scan: the supplier is paid after a set time unless the buyer takes the payment back first. Designed, not built" },
    ],
  },
  {
    n: 7,
    title: "Indexer, webhooks and SDK",
    status: "In progress",
    items: [
      { title: "Marketplace index", status: "Done", note: "Live" },
      { title: "Super admin API", status: "In progress" },
      { title: "General indexer", status: "Next", note: "Not started" },
      { title: "Server-side API with keys", status: "Next", note: "Not started" },
      { title: "Webhooks", status: "Next", note: "Not started" },
      { title: "Published SDK", status: "Next", note: "Not started" },
    ],
  },
  {
    n: 8,
    title: "Networks: public and private",
    status: "In progress",
    items: [
      { title: "Private EVM network", status: "Done", note: "Deployed unchanged to a Hyperledger Besu network (QBFT) and exercised end to end. A test on one node; none in production" },
      { title: "The app built for any network", status: "Done", note: "One script builds its configuration for a network" },
      { title: "One installation that serves several networks", status: "Next", note: "The app and each service serve one network today" },
      { title: "Anchoring for private networks", status: "Next", note: "A fingerprint of a private network's state published to a public one, so a rewrite can be detected. Designed, not built" },
      { title: "Stellar implementation", status: "Next", note: "The protocol written again as Soroban contracts. Not started" },
      { title: "Hyperledger Fabric implementation", status: "Next", note: "The protocol written again as chaincode. Not started" },
    ],
  },
  {
    n: 9,
    title: "Audit and main network",
    status: "Next",
    items: [
      { title: "Independent security audit", status: "Next", note: "Not started" },
      { title: "Main network", status: "Next", note: "Follows the audit" },
    ],
  },
  {
    n: 10,
    title: "Sign-in without a wallet",
    status: "In progress",
    items: [
      { title: "Paymaster and gas sponsor", status: "Done", note: "Deployed; the app does not use them yet" },
      { title: "Embedded wallet", status: "Next", note: "Not started" },
      { title: "Sponsored network fees in the app", status: "Next", note: "Not started" },
    ],
  },
]

export const OPEN_ITEMS: RoadmapItem[] = [
  {
    title: "Public network on the current contracts",
    status: "Waiting for you",
    note: "Needs your signature: create it from Platform and earnings.",
    live: "public-network",
  },
  {
    title: "Launch fee in tUSD on the practice network",
    status: "Waiting for you",
    note: "One signature on Platform and earnings, so anyone can pay it from the faucet.",
    live: "launch-fee-tusd",
  },
  { title: "KYC bridge to kyc.baqshi.com", status: "Next", note: "Planned." },
  { title: "Hosted checkout", status: "Waiting for you", note: "Was on the earlier plan. It is not in the current list of designed work: decide whether it stays." },
  { title: "Crowdfunding contract", status: "Waiting for you", note: "Proposed. Needs legal advice before any work starts." },
]
