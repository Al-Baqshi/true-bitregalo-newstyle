# Summary

BitRegalo is infrastructure for decentralising the part of a system that has to be trusted: its financial actions and its sensitive records.

A platform that already takes payments, a bank, an enterprise or a startup connects to BitRegalo so that the records it keeps and the promises it makes are held by contracts on a ledger, where nobody can edit them afterwards. That includes BitRegalo, and it includes the organisation's own developers.

It gives a connected organisation two things:

- **Proof.** A record of what happened, written once.
- **Guaranteed commitments.** A promise about a payment, locked in a contract, that executes exactly as agreed when it is triggered. A refund is a refund.

Each organisation gets its own set of contracts, called a workspace. It can run them in two ways:

- **On a shared public network**, where anyone can read and verify the records.
- **On a private network**, run by the organisation or by a group it belongs to, where only the members can see anything.

The protocol is the same in both. Its first implementation is for EVM networks. It runs today on a public test network, and it has been deployed unchanged to a private Hyperledger Besu network. Implementations for other ledgers, such as Stellar and Hyperledger Fabric, are planned.

This paper describes the system as it stands on 6 October 2026. It has not been independently audited, it is not on a main network, no organisation runs it in production, and BitRegalo has not issued a token. Where something is planned and not built, the paper says so.

# The problem

Every system that handles payments asks the people who depend on it to trust two things.

**Its records.** Who bought what, who was awarded a contract, what was paid and when. These are rows in a database the operator controls. The operator can change them, and so can any developer or administrator with access. An audit can catch some changes after the fact. It cannot make them impossible.

**Its promises.** A refund policy, a payment held until delivery, a deposit that comes back. Each is enforced by the party that gains when it is broken. The customer, the supplier and the partner on the other side can only hope the system does what it said.

The usual answers are regulation, insurance and reputation. They help, and they are slow and expensive, and they still end in trusting someone. A startup has none of them. A bank has all of them and still cannot prove to a counterparty, a regulator or its own board that a record was never touched.

The same problem exists inside an organisation. A finance team trusts the engineers who run the ledger. A group of companies that settle with each other trusts whichever of them hosts the system. Decentralising that one part, the records and the commitments, removes the need for that trust without replacing the rest of the system.

# What BitRegalo is

BitRegalo is a protocol and the software around it. An organisation keeps its own product, its own customers and its own interface. It connects BitRegalo for the part that must not depend on trusting whoever runs the system.

**Records.** When something happens that matters, such as a request, an answer to it, an award, a payment, a sale or a redemption, it is written to the organisation's contracts with its parties, its amounts, the time, and a reference to whatever document sits behind it. A record is written once. No function exists to edit or delete it.

**Commitments.** A payment can be held by a contract with its outcomes fixed in advance. The buyer can only send it forward to the supplier. The supplier can only hand it back to the buyer. After the deadline it can only return to the buyer. No administrator, no developer and no BitRegalo key can send it anywhere else or stop it from leaving.

**Workspaces.** Each organisation launches its own contracts: its records and rules, a vault that holds commitments, and a treasury its admin owns. It sets which tokens it accepts and how payments settle. Everything done inside is recorded under that workspace.

## What it is not

- **Not a payment service or a custodian.** BitRegalo never holds anyone's tokens. A payment moves from one wallet to another through a contract, and no BitRegalo server is in its path.
- **Not a token.** BitRegalo has no token of its own. It has not issued one and sells none, anywhere. It earns fees for the use of its infrastructure.
- **Not one network.** The protocol is defined by its rules. A network is where an organisation chooses to run it.
- **Not one app or one industry.** The web app is a reference implementation. Construction, marketplaces, banking, nonprofits and subscriptions are examples of use.

# Two ways to run it

## On a shared public network

Anyone can read the records and check them, with no permission from anyone. This suits a marketplace whose buyers and suppliers are strangers, a nonprofit whose donors want to see where a grant went, and any organisation whose proof has to convince outsiders.

Everything written there is public: wallet addresses, amounts and times. A description can stay private by storing only its fingerprint.

BitRegalo runs one public workspace on such a network, open to anyone, called the BitRegalo network. Today it is on a test network.

## On a private network

A bank, an enterprise or a group of companies often cannot publish amounts or counterparties, and may be required to know every participant. It runs the same contracts on a permissioned network: one where the members are known, only they can read or write, and the organisation or the group decides who validates.

On 5 October 2026 the whole protocol was deployed, unchanged, to a private Hyperledger Besu network using QBFT consensus, with the same scripts used for the public test network. A workspace was launched, a record was written with no token involved, and a payment was held and released. The reference app was built against that network and read its records. This was a test on a single node. No organisation runs a private deployment yet.

**What "nobody can edit" means on a private network.** The guarantee is as strong as the set of parties that validate the network. If one organisation runs every validator, it can rewrite its own history, and the network proves nothing to anyone else. A private deployment earns its guarantee in two ways:

- **Validators held by independent parties.** The organisation, its auditor, its bank, its partners. No one of them can change a record alone.
- **Anchoring.** A fingerprint of the private network's state is published to a public network at intervals, so a later rewrite can be detected by anyone holding that fingerprint. Anchoring is planned, not built.

**What settles a payment on a private network.** A commitment needs a token on the same network: a bank's tokenised deposit, a stablecoin issued there, or the organisation's own unit of account. An organisation that only needs proof uses records alone, with no token at all.

## Choosing

| | Shared public network | Private network |
| --- | --- | --- |
| Who can read | Anyone | Members only |
| Who validates | The public network's validators | The organisation or its group |
| Who can take part | Anyone with a wallet | Whoever the members admit |
| Tokens | Those issued on that network | Those the members issue there |
| The proof convinces | Anyone | The members, and outsiders through anchoring |
| State today | Running on a test network | Tested on Hyperledger Besu; none in production |

An organisation can use both: a private network for what must stay confidential, and a public one for what has to be shown.

# How it is used

There are three ways to use BitRegalo.

**Connect a platform.** An existing product reads BitRegalo's records and has its users sign BitRegalo actions from inside its own site, app or back office. This is the use the protocol is built for.

**Run a workspace.** An organisation launches its own contracts, on a shared network or its own, and works in them through the web app, through its own systems, or both.

**Use the BitRegalo network.** BitRegalo's own public workspace, open to anyone. It is the place to try every part of the protocol, and it serves people who have no organisation behind them.

## Examples

These are illustrations, not customers.

- **A marketplace** holds each order's payment in a commitment. The supplier is paid when the buyer confirms, and the buyer's way back is guaranteed by the contract and not by the marketplace's support desk.
- **A gift sent across borders.** Someone orders flowers from a florist in another country for a friend who lives there. The payment is held. The buyer sends the friend a delivery code, the florist scans it at the door, and the payment is released on the spot. The friend needs no wallet, app or account. The delivery code is planned, not built.
- **An enterprise running tenders** records each request, every answer and the award. A supplier who lost can verify that the record was not rearranged afterwards.
- **A bank and its corporate clients** run a private network. Each instruction and each settlement between them is a record none of them can alter alone, and a payment promised against delivery is held by a contract and not by the bank's back office.
- **A group of companies** that trade with each other record what each owes the others on a network they validate together, so the monthly reconciliation starts from one record instead of several.
- **A platform selling credits, vouchers or memberships** issues them as tokens, sells them for a stablecoin into its own treasury, and has a record of every sale and every redemption.
- **A head contractor** holds each progress payment until the stage is certified, so a subcontractor can see the payment exists before starting work.

# The protocol

The protocol is defined by its parts and its rules, not by a network. Any implementation, on any ledger, has to keep the same rules.

## Parts

| Part | What it is |
| --- | --- |
| Workspace | One organisation's own contracts and settings: accepted tokens, fees, and which ways of settling are switched on. |
| Record | A fact written once: who, what, how much, when, an optional reference, and an optional project it belongs to. |
| Commitment | A payment held by the vault with three fixed outcomes: released, handed back, returned. |
| Request and listing | "I need this" and "I offer this". Each one states how it settles when it is accepted. |
| Token | A voucher, credit or membership an organisation issues, sells and takes back when it is redeemed. |
| Treasury | The organisation's own account on the ledger, owned by its admin, where its sales and redemptions arrive. |
| Project | A name that groups related records. |

A request or a listing settles in one of three ways. It can be **recorded only**, where nothing is paid and the choice itself is the record. It can be **paid directly**, where the payment passes through the vault to the supplier in one transaction. Or it can be **held**, where the payment becomes a commitment.

## Rules that always hold

1. **Nothing written is edited or deleted.** A record only moves forward: an open request becomes awarded or cancelled, a held payment becomes released, handed back or returned.
2. **A held payment has two destinations.** It goes to the supplier or back to the buyer. There is no third.
3. **Each side can only give.** Only the buyer can release. Only the supplier can hand back. After the deadline anyone can trigger the return to the buyer. Neither side can move a held payment toward itself.
4. **The exits cannot be closed.** A workspace or the platform can pause new activity. Nobody can pause a release, a hand-back or a return.
5. **Fees are fixed in advance.** A workspace keeps the fee percentage it launched with. The code caps that percentage at 5%.
6. **Existing workspaces are never changed.** A new version of the protocol is a new set of contracts. An organisation moves to it by choice.

These rules are enforced by the contracts. On a private network they also depend on the network itself being honest, as described above.

## Privacy

On a public network everything written is public, and a record can carry only the fingerprint of its text to keep the wording private. On a private network only members can read anything, and what one member may hide from another depends on the privacy features of the ledger chosen.

# Ledgers

| Ledger | How BitRegalo runs there | State |
| --- | --- | --- |
| Public EVM networks | The Solidity contracts in this implementation | Running on BNB Smart Chain Testnet. Main networks follow an audit |
| Private EVM networks, such as Hyperledger Besu | The same contracts, unchanged | Deployed and exercised on a Besu test network on 5 October 2026. None in production |
| Stellar | The protocol written again as Soroban contracts, to the same rules | Planned |
| Hyperledger Fabric | The protocol written again as chaincode, to the same rules | Planned |
| A BitRegalo network | A network run for this protocol | Considered when connected organisations ask for one, or when fees on shared networks become a real cost |

Any network that runs EVM contracts can run today's code. A ledger that does not, needs its own implementation, and that implementation has to pass the same checks: the rules above, tested the same way.

The web app and each BitRegalo service serve one network per installation today. One installation that spans several networks is planned work.

# The first implementation

| Contract | Role |
| --- | --- |
| Mother | One per network. Launches workspaces, holds the fee settings and the list of versions. Cannot move tokens out of any workspace. |
| Workspace contract | One per organisation. The records and rules: requests, offers, awards, listings, payments, sales, redemptions, projects. |
| Vault | One per organisation. Holds commitments and passes direct payments through. |
| Workspace treasury | One per organisation, owned by its admin. The platform has no function on it. |
| Token factory and token | Create the vouchers, credits and memberships an organisation issues. |
| Platform fee treasury | Receives the platform's fees. |
| Paymaster | Lets the platform pay network fees for people who sign in without a wallet. Deployed; the app does not use it yet. |

On a shared network BitRegalo owns the mother and the platform fee treasury. On a private network whoever deploys them owns them, which is normally the organisation or its group.

## Who can do what

| Who | Can | Cannot |
| --- | --- | --- |
| The owner of the mother | Set the fee for workspaces launched from now on. Register a new version. Pause new launches and new payments. Withdraw the platform's fees. | Move a held payment. Touch a workspace treasury. Change an existing workspace. Stop a release, a hand-back or a return. |
| Workspace admin | Choose accepted tokens. Switch ways of settling on or off. Pause new activity. Open sales. Withdraw from the workspace treasury. | Move a held payment. Stop a release, a hand-back or a return. Edit or delete a record. |
| Buyer | Release a held payment to the supplier. | Take it back before the deadline. |
| Supplier | Hand a held payment back to the buyer. | Release it to themselves. |
| Anyone | Trigger the return to the buyer after the deadline. | Anything else. |

## Version 2 of the contracts

Version 2 is a hardening release. It adds no feature. It changes how safely the existing ones run:

- **A payer is never charged more than they agreed.** Every call that takes tokens from a person names the most that person agreed to pay, and fails if the charge would be higher.
- **The treasury's owner decides what is sold.** The workspace admin opens a sale. Nothing can be bought until the owner of the workspace treasury approves that sale and an amount for it. Opening a sale does not let holders redeem the token: the admin decides that separately, and only for a token created for that workspace.
- **Fees wait in the vault.** The vault keeps the platform's fees as payments happen, and anyone can send them on to the platform fee treasury. A release, a hand-back or a return never depends on that transfer.
- **A refused payout is credited.** If a token will not deliver a payout, the held payment still reaches its outcome, and the amount is credited to the same wallet to collect later.
- **Roles change hands in two steps.** A workspace's admin, a token's owner and the owners of the platform's contracts offer the role, and the other wallet accepts it. The owners of the platform's contracts cannot give ownership up.
- **An offer carries a last moment.** An offer on a request can be chosen only until the time its supplier set. A listing can carry one too.
- **Who may create a token.** A workspace's own token is created by its admin. A project's token is created by the admin or by the project's owner. Whoever creates a token owns it.
- **Gas sponsorship has limits.** The contract that pays network fees for people pays only for accounts that cannot be changed and for workspaces its owner lists, within a limit per action and a budget per hour, and it can be paused at once.

Version 2 is a new set of contracts with its own mother. Workspaces on earlier versions are not changed. The reference web app is written for version 2.

## Evidence

- The source of every contract on the public test network is published and verified against what is deployed.
- 192 automated tests pass, including tests that run random sequences of actions against the vault and check that its rules still hold.
- Three security reviews were made in October 2026, the last in the manner of a paid audit by reviewers given only the code. Every finding was fixed, and each fix has a test. The findings are published with the code. All three reviews were made with an AI assistant, not by an independent firm.
- One script deploys the whole protocol to a fresh network and runs it end to end. It is how the private Besu deployment was checked, and anyone can run it against their own network.
- The contracts have not been audited by an independent firm.

# Services around the contracts

BitRegalo runs two small services. Neither holds tokens and neither is in a payment's path.

**The marketplace index** stores the descriptions of public requests and listings: a title, a description, a category, a country. It accepts a description only when it is signed by the wallet that owns the record.

**The gas sponsor** decides whether the platform pays the network fee for an action, so a person can use the protocol without first buying the network's own coin. It is built and deployed. The web app does not use it yet.

The web app reads the network directly and sends each signed transaction straight to it. If every BitRegalo server were switched off, every record would still be readable and every held payment could still be released, handed back or returned. On a private network an organisation runs the app and whichever services it wants inside its own walls.

# For developers

**Today.** Every workspace has a page that gives its contract addresses, its interface files and typed code examples. Anything can be read without a key. Actions are transactions a user signs in their own wallet from the developer's own site. Payment links need no code. To run on another network, one script deploys the contracts and one builds the app's configuration for it.

**Delivery confirmation (protocol version 3, on the practice network since 6 October 2026).** When the buyer takes a listing or awards an offer into a held payment, the buyer's browser creates a long random delivery code and the contract stores only its fingerprint. The buyer gives the code to the person receiving the goods as a QR code or a link; the supplier never sees it before delivery. At the handover the supplier scans it: presenting the code releases the payment to the supplier on the spot and writes a permanent record of the handover with its time. The code can only ever send that payment to its supplier. The buyer can give a held payment more time, so an order can wait for a late delivery, and BitRegalo's keeper service returns held payments a few minutes after their deadline and presents codes for people who have no wallet. The version 2 public workspace stays as it was; version 3 is a new public workspace on the same network.

**Planned, in this order.**

1. **General records.** A record of any event an organisation wants to prove, such as a subscription, a sale made elsewhere or an approval, written by the organisation's own key.
2. **Keys that act for a workspace.** A workspace authorises a key that its own server uses, so a system can write records and trigger its side of a commitment without a person at a wallet.
3. **More kinds of commitment.** For example a refund window: the supplier is paid after a set time unless the buyer takes the payment back first.
4. **An indexer, webhooks and a published SDK**, so a system is told when something happens and can call the protocol in a few lines.
5. **Anchoring for private networks**, and one installation that serves several networks.
6. **Implementations for Stellar and Hyperledger Fabric.**
8. **Signing in without a wallet**, with network fees paid by the sponsor.

# Business model

BitRegalo is paid for the use of its infrastructure: fees on shared networks and licences on private ones. It does not sell tokens, memberships or any other instrument to fund itself.

**On a shared network**, fees are built into the contracts and paid in the token a payment already uses:

- **A platform fee**: a percentage of each payment that reaches a supplier or a treasury, fixed for each workspace when it is launched.
- **A service fee**: a flat amount on each payment, set for each accepted token in a workspace.
- **A launch fee** when an organisation creates a workspace, and a fee when it creates a token.

**On a private network**, the organisation that deploys the contracts holds the fee settings, so the terms are a licence and support agreement with BitRegalo and not a fee per payment. The contract source is published and marked with the Business Source Licence. Its terms for commercial use are being finalised.

There is no BitRegalo token. If BitRegalo ever issues one, it will be issued through its own platform and announced on bitregalo.com first. Anything offered elsewhere in BitRegalo's name is not from BitRegalo.

# Status

| Part | State on 6 October 2026 |
| --- | --- |
| Records, escrow, requests, listings, projects, tokens | Live on the public test network, version 0 |
| Payments with receipts, token sales, redemption, workspace treasury | Version 1 is deployed and registered there. No workspace has been launched on it yet |
| Version 2 of the contracts (hardening, no new feature) | On the public test network since 6 October 2026, as a new system with its own mother. The reference web app runs on it. Also exercised on a private Hyperledger Besu test network |
| Private EVM network | Deployed and exercised on a Hyperledger Besu test network. None in production |
| Marketplace index | Live |
| Gas sponsor and signing in without a wallet | Built, not in use |
| Delivery code, term extension, keeper (deadline watcher and delivery relay) | Protocol version 3, on the public test network since 6 October 2026, as a new public workspace on the same mother. Reviewed by one AI-assisted review; not audited by an independent firm |
| General records, keys for servers, refund window | Designed, not built |
| Indexer, webhooks, SDK | Not built |
| Anchoring; several networks in one installation | Not built |
| Stellar and Hyperledger Fabric implementations | Not started |
| Independent audit, main network | Not done |

# Risks and limits

- **It has not been audited.** Until it has, nothing of real value should pass through it.
- **A public network is public.** Amounts and addresses are visible to anyone.
- **A private network is only as honest as its validators.** One party that controls all of them can rewrite the record. Independent validators and anchoring are what prevent it, and anchoring is not built.
- **Keys are final.** BitRegalo cannot recover a lost wallet or reverse a signed action.
- **Escrow leans toward the buyer unless the supplier uses the delivery code.** On the practice network a held payment can carry a delivery code: the supplier hands over only when the code is presented, and presenting it releases the payment. Without a code, only the buyer's own wallet can release, and a buyer who has received the goods can decline to release and wait for the deadline. A recipient who takes the goods and refuses to show the code leaves the supplier in that position, and a code presented at the last moment can arrive after the deadline. A recipient who takes the goods and refuses to show the code is still a risk the supplier carries.
- **A return needs a trigger.** After the deadline someone has to send the transaction that returns a held payment. It does not happen by itself. BitRegalo's keeper service sends it a few minutes after the deadline on the practice network; if the keeper is down, the payment waits until anyone sends the same call.
- **Descriptions are separate from records.** A description in the marketplace index can be replaced by its owner. The record on the ledger cannot.
- **Other ledgers mean other code.** An implementation for Stellar or Fabric is new software that needs its own testing and its own audit.
- **Law differs by country.** An organisation that uses BitRegalo remains responsible for its own obligations. This paper is not legal or financial advice.

# Company

BitRegalo is developed by BitRegalo® Limited, New Zealand. This paper was written by Al Baqshi Mohammed. It replaces every earlier version, including their descriptions of tokens and features that were not built.

Questions and corrections are welcome through the contact page at bitregalo.com.
