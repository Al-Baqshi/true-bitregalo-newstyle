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

export const PHASES: Phase[] = [
  {
    n: 1,
    title: "Contracts, version 1",
    status: "Done",
    items: [
      { title: "Workspace treasury", status: "Done" },
      { title: "Shop: selling utility tokens", status: "Done" },
      { title: "Redeem", status: "Done" },
      { title: "Pay and payment links", status: "Done" },
    ],
  },
  {
    n: 2,
    title: "App",
    status: "Done",
    items: [
      { title: "Step-by-step wizards", status: "Done" },
      { title: "Shop", status: "Done" },
      { title: "Payments", status: "Done" },
      { title: "The BitRegalo network and organisation workspaces", status: "Done" },
      { title: "Marketplace by country", status: "Done" },
      { title: "Light and dark redesign", status: "Done" },
    ],
  },
  {
    n: 3,
    title: "Embedded wallet and sponsored gas in the app",
    status: "In progress",
    items: [
      { title: "Practice-token faucet", status: "Done" },
      { title: "Embedded wallet", status: "Next", note: "Not started" },
      { title: "Sponsored gas", status: "Next", note: "Not started" },
    ],
  },
  {
    n: 4,
    title: "Indexer, API, SDK and hosted checkout",
    status: "In progress",
    items: [
      { title: "Marketplace index", status: "Done", note: "Live" },
      { title: "Super admin API", status: "In progress" },
      { title: "General indexer", status: "Next", note: "Not started" },
      { title: "Webhooks", status: "Next", note: "Not started" },
      { title: "SDK", status: "Next", note: "Not started" },
      { title: "Hosted checkout", status: "Next", note: "Not started" },
    ],
  },
  {
    n: 5,
    title: "Documentation site",
    status: "In progress",
    items: [
      { title: "Protocol pages", status: "Done" },
      { title: "Developer docs (Connect pages)", status: "In progress" },
    ],
  },
  {
    n: 6,
    title: "Audit and mainnet",
    status: "Next",
    items: [
      { title: "Security audit", status: "Next", note: "Not started" },
      { title: "Mainnet", status: "Next", note: "Not started" },
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
  { title: "Crowdfunding contract", status: "Waiting for you", note: "Proposed. Needs legal advice before any work starts." },
]
