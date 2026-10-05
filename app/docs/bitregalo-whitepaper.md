# Summary

BitRegalo is infrastructure for decentralising the part of a system that has to be trusted: its financial actions and its sensitive records.

A platform that already takes payments, a bank, an enterprise or a startup connects to BitRegalo so that the records it keeps and the promises it makes are held by public contracts. Nobody can edit them afterwards. That includes BitRegalo, and it includes the platform's own developers.

It gives a connected platform two things:

- **Proof.** A record of what happened, written once and readable by anyone.
- **Guaranteed commitments.** A promise about a payment, locked in a contract, that executes exactly as agreed when it is triggered. A refund is a refund.

Each organisation gets its own set of contracts, called a workspace. The protocol is not tied to one network. The first implementation runs on EVM networks, and the same design is meant to carry to private chains and to other networks.

This paper describes the system as it stands on 5 October 2026. It runs on a public test network. It has not been independently audited, it is not on a main network, and BitRegalo has not issued a token. Where something is planned and not built, the paper says so.

# The problem

Every platform that handles payments asks its users to trust two things.

**Its records.** Who bought what, who was awarded a contract, what was paid and when. These are rows in a database the operator controls. The operator can change them, and so can any developer or administrator with access. An audit can catch some changes after the fact. It cannot make them impossible.

**Its promises.** A refund policy, a payment held until delivery, a deposit that comes back. Each is enforced by the party that gains when it is broken. The customer, the supplier and the partner on the other side can only hope the platform does what it said.

The usual answers are regulation, insurance and reputation. They help, and they are slow and expensive, and they still end in trusting someone. A startup has none of them. A large platform has all of them and still cannot prove to a counterparty that a record was never touched.

Public blockchains solved this for simple transfers. BitRegalo applies the same property to the records and commitments of ordinary commerce, in a form a platform can connect to without rebuilding its product.

# What BitRegalo is

BitRegalo is a protocol and the software around it. A platform keeps its own product, its own customers and its own interface. It connects BitRegalo for the part that must not depend on trusting the platform.

**Records.** When something happens that matters, such as a request, an answer to it, an award, a payment, a sale or a redemption, it is written to the organisation's contracts with its parties, its amounts, the time, and a reference to whatever document sits behind it. A record is written once. No function exists to edit or delete it.

**Commitments.** A payment can be held by a contract with its outcomes fixed in advance. The buyer can only send it forward to the supplier. The supplier can only hand it back to the buyer. After the deadline it can only return to the buyer. No administrator, no developer and no BitRegalo key can send it anywhere else or stop it from leaving.

**Workspaces.** Each organisation launches its own contracts: its records and rules, a vault that holds commitments, and a treasury its admin owns. It sets which tokens it accepts and how payments settle. Everything done inside is recorded under that workspace.

## What it is not

- **Not a payment service or a custodian.** BitRegalo never holds anyone's tokens. A payment moves from one wallet to another through a contract, and no BitRegalo server is in its path.
- **Not a token.** BitRegalo has not issued a token and is not offering one. It earns fees in the tokens its users already pay with.
- **Not one app or one industry.** The web app is a reference implementation. Construction, marketplaces, nonprofits and subscriptions are examples of use.

# How it is used

There are three ways to use BitRegalo.

**Connect a platform.** An existing product reads BitRegalo's records and has its users sign BitRegalo actions from inside its own site, app or back office. This is the use the protocol is built for.

**Run a workspace.** An organisation launches its own contracts and works in them through the web app, through its own platform, or both.

**Use the BitRegalo network.** BitRegalo runs one public workspace that anyone can use. It is the place to try every part of the protocol, and it serves people who have no organisation behind them.

## Examples

These are illustrations, not customers.

- **A marketplace** holds each order's payment in a commitment. The supplier is paid when the buyer confirms, and the buyer's way back is guaranteed by the contract and not by the marketplace's support desk.
- **An enterprise running tenders** records each request, every answer and the award. A supplier who lost can verify that the record was not rearranged afterwards.
- **A platform selling credits, vouchers or memberships** issues them as tokens, sells them for a stablecoin into its own treasury, and has a public record of every sale and every redemption.
- **A head contractor** holds each progress payment until the stage is certified, so a subcontractor can see the payment exists before starting work.

# The protocol

The protocol is defined by its parts and its rules, not by a network. Any implementation, on any network, has to keep the same rules.

## Parts

| Part | What it is |
| --- | --- |
| Workspace | One organisation's own contracts and settings: accepted tokens, fees, and which ways of settling are switched on. |
| Record | A fact written once: who, what, how much, when, an optional reference, and an optional project it belongs to. |
| Commitment | A payment held by the vault with three fixed outcomes: released, handed back, returned. |
| Request and listing | "I need this" and "I offer this". Each one states how it settles when it is accepted. |
| Token | A voucher, credit or membership an organisation issues, sells and takes back when it is redeemed. |
| Treasury | The organisation's own account on chain, owned by its admin, where its sales and redemptions arrive. |
| Project | A name that groups related records. |

A request or a listing settles in one of three ways. It can be **recorded only**, where nothing is paid and the choice itself is the record. It can be **paid directly**, where the payment passes through the vault to the supplier in one transaction. Or it can be **held**, where the payment becomes a commitment.

## Rules that always hold

1. **Nothing written is edited or deleted.** A record only moves forward: an open request becomes awarded or cancelled, a held payment becomes released, handed back or returned.
2. **A held payment has two destinations.** It goes to the supplier or back to the buyer. There is no third.
3. **Each side can only give.** Only the buyer can release. Only the supplier can hand back. After the deadline anyone can trigger the return to the buyer. Neither side can move a held payment toward itself.
4. **The exits cannot be closed.** A workspace or the platform can pause new activity. Nobody can pause a release, a hand-back or a return.
5. **Fees are fixed in advance.** A workspace keeps the fee percentage it launched with. The code caps that percentage at 5%.
6. **Existing workspaces are never changed.** A new version of the protocol is a new set of contracts. An organisation moves to it by choice.

## Privacy

Everything written to a public network is public: wallet addresses, amounts and times. A description does not have to be. A record can carry only the fingerprint of its text, which keeps the wording private and still lets its owner prove later what it said. Organisations with stricter needs are the reason private networks are on the plan.

# The first implementation

The protocol's first implementation is a set of Solidity contracts for EVM networks. It is deployed on BNB Smart Chain Testnet, and the source of every contract is published and verified against what is deployed.

| Contract | Role |
| --- | --- |
| Mother | One per network. Launches workspaces, holds the fee settings and the list of versions. Cannot move tokens out of any workspace. |
| Workspace contract | One per organisation. The records and rules: requests, offers, awards, listings, payments, sales, redemptions, projects. |
| Vault | One per organisation. Holds commitments and passes direct payments through. |
| Workspace treasury | One per organisation, owned by its admin. BitRegalo has no function on it. |
| Token factory and token | Create the vouchers, credits and memberships an organisation issues. |
| Platform fee treasury | Receives BitRegalo's fees. |
| Paymaster | Lets BitRegalo pay network fees for people who sign in without a wallet. Deployed; the app does not use it yet. |

## Who can do what

| Who | Can | Cannot |
| --- | --- | --- |
| BitRegalo | Set the fee for workspaces launched from now on. Register a new version. Pause new launches and new payments. Withdraw its own fees. | Move a held payment. Touch a workspace treasury. Change an existing workspace. Stop a release, a hand-back or a return. |
| Workspace admin | Choose accepted tokens. Switch ways of settling on or off. Pause new activity. Open sales. Withdraw from the workspace treasury. | Move a held payment. Stop a release, a hand-back or a return. Edit or delete a record. |
| Buyer | Release a held payment to the supplier. | Take it back before the deadline. |
| Supplier | Hand a held payment back to the buyer. | Release it to themselves. |
| Anyone | Trigger the return to the buyer after the deadline. | Anything else. |

## Versions

Two versions are registered. Version 0 has requests, listings, escrow, projects and tokens, and runs the public workspace. Version 1 adds payments with a reference and a receipt, sales of tokens, redemption and the workspace treasury.

The contracts pass 110 automated tests, including tests that run random sequences of actions against the vault and check that its rules still hold. They have not been independently audited.

# Services around the contracts

BitRegalo runs two small services. Neither holds tokens and neither is in a payment's path.

**The marketplace index** stores the descriptions of requests and listings: a title, a description, a category, a country. The contracts keep only a fingerprint. The index accepts a description only when it is signed by the wallet that owns the record on chain.

**The gas sponsor** decides whether BitRegalo pays the network fee for an action, so a person can use the protocol without first buying the network's own coin. It is built and deployed. The web app does not use it yet.

The web app reads the network directly and sends each signed transaction straight to it. If every BitRegalo server were switched off, every record would still be readable and every held payment could still be released, handed back or returned.

# Networks

The protocol's rules do not depend on a particular network, and organisations will not all want the same one. The plan runs in this order.

1. **Public EVM networks.** Today one test network. Main networks follow an independent audit.
2. **Private EVM networks.** A bank or an enterprise that cannot publish amounts on a public network runs the same contracts on a network it controls or shares. Nothing in the contracts has to change.
3. **Other networks.** A network that does not run EVM contracts needs the protocol written again in its own language, to the same rules.
4. **A BitRegalo network.** A network run for this protocol makes sense when connected organisations ask for one, or when volume makes fees on shared networks a real cost. It is not a starting point.

One deployment exists today. The web app and the services each assume a single network, and supporting several at once is planned work.

# For developers

**Today.** Every workspace has a page that gives its contract addresses, its interface files and typed code examples. Anything can be read without a key. Actions are transactions a user signs in their own wallet from the developer's own site. Payment links need no code. The marketplace index has a public interface for reading, and for writing with a wallet signature.

**Planned, in this order.**

1. **General records.** A record of any event a platform wants to prove, such as a subscription, a sale made elsewhere or an approval, written by the platform's own key.
2. **Keys that act for a workspace.** A workspace authorises a key that its own server uses, so a platform can write records and trigger its side of a commitment without a person at a wallet.
3. **More kinds of commitment.** For example a refund window: the supplier is paid after a set time unless the buyer takes the payment back first.
4. **An indexer, webhooks and a published SDK**, so a platform is told when something happens and can call the protocol in a few lines.
5. **Signing in without a wallet**, with network fees paid by the sponsor.

# Business model

BitRegalo earns when the protocol is used.

- **A platform fee**: a percentage of each payment that reaches a supplier or a treasury. It is fixed for each workspace when it is launched.
- **A service fee**: a flat amount on each payment, set for each accepted token in a workspace.
- **A launch fee** when an organisation creates a workspace, and a fee when it creates a token.

Fees are paid in the token the payment itself uses. There is no BitRegalo token.

# Status

| Part | State on 5 October 2026 |
| --- | --- |
| Records, escrow, requests, listings, projects, tokens | Live on the test network, version 0 |
| Payments with receipts, token sales, redemption, workspace treasury | Version 1 is deployed and registered. No workspace has been launched on it yet |
| Marketplace index | Live |
| Gas sponsor and signing in without a wallet | Built, not in use |
| General records, keys for servers, refund window | Designed, not built |
| Indexer, webhooks, SDK | Not built |
| Second network | Not built |
| Independent audit, main network | Not done |

# Risks and limits

- **It has not been audited.** Until it has, nothing of real value should pass through it.
- **It is public by design.** On a public network, amounts and addresses are visible to anyone.
- **Keys are final.** BitRegalo cannot recover a lost wallet or reverse a signed action.
- **Escrow today leans toward the buyer.** If the buyer does not release and the supplier does not hand back, the payment returns to the buyer after the deadline. A supplier who has already delivered depends on the buyer releasing. The refund-window commitment is the planned answer.
- **A return needs a trigger.** After the deadline someone has to send the transaction that returns a held payment. It does not happen by itself.
- **Descriptions are separate from records.** A description in the marketplace index can be replaced by its owner. The record on chain cannot.
- **Law differs by country.** An organisation that uses BitRegalo remains responsible for its own obligations. This paper is not legal or financial advice.

# Company

BitRegalo is developed by BitRegalo® Limited, New Zealand. This paper was written by Al Baqshi Mohammed. It replaces version 4 and every earlier version, including their descriptions of tokens and features that were not built.

Questions and corrections are welcome through the contact page at bitregalo.com.
