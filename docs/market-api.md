# BitRegalo marketplace index: API contract (v1)

The interface of the marketplace index: the service that keeps the descriptions of requests and listings. It is the shared contract between the Go service (bitregalo-platform, command `cmd/market`) and the web app (true-bitregalo-newstyle), and both sides implement exactly this. A connected platform can use it too: reading is public, and writing needs the signature of the wallet that owns the record.

## Why it exists
A request ("I need this") and a listing ("I offer this") are records on chain, and a record stores only a 32-byte label or a fingerprint. (In the contracts a request is an RFP and a listing is an offer.) A marketplace by country needs a title, a description, a category, a country and a city. That metadata lives here, off-chain, and is **signed by the wallet that owns the on-chain record**, so nobody can attach text to someone else's request or listing. Payments and state stay on-chain; this index never holds tokens and never decides anything. A description can be replaced by its owner; the record on chain cannot.

## Terms
- `chainId`: number. BNB Smart Chain Testnet (BSC Testnet), the practice network BitRegalo runs on today, is `97`.
- `workspace`: the number of a workspace (an organisation's own contracts) in the registry. In the contracts this is the tenant id in the mother registry: `mother.tenants(id)` returns `{instance, vault, admin, version}`. The public BitRegalo network is also a workspace (its id is configured in the app).
- `kind`: `"request"` (someone asks for something and suppliers answer; in the contracts an RFP: `instance.getRfp(id)`, owner field `requester`) or `"listing"` (a supplier's fixed-price offer that a buyer takes; in the contracts an offer: `instance.getOffer(id)`, owner field `supplier`).
- `recordId`: the on-chain id (uint, starts at 1).
- `country`: ISO 3166-1 alpha-2, upper case (`NZ`, `AU`, `US`…). Required.
- `city`: free text, optional, ≤ 80 characters.
- `category`: one of `construction`, `trades`, `professional-services`, `goods`, `transport`, `events`, `education`, `health`, `nonprofit`, `digital`, `other`.
- `title`: 3–120 characters. `description`: 0–2000 characters. Plain text (no HTML); the server trims whitespace and rejects control characters other than `\n`.

## Signing (EIP-191 `personal_sign`)
The poster signs this exact UTF-8 string (lines joined with `\n`, no trailing newline):

```
BitRegalo marketplace entry
Chain: {chainId}
Workspace: {workspace}
Kind: {kind}
Record: {recordId}
Title: {title}
Category: {category}
Country: {country}
City: {city}
Description SHA-256: 0x{lowercase hex sha256 of the description's UTF-8 bytes}
Issued at: {issuedAt}
```

- `{city}` is the empty string when there is none (the line is then `City: `).
- `issuedAt` is an RFC 3339 UTC timestamp with seconds, e.g. `2026-10-03T01:23:45Z`. The server rejects it if it is more than 10 minutes from server time (either direction).
- The server recovers the address from the signature (65-byte hex, `v` 27/28 or 0/1 accepted) and requires it to equal `poster` (case-insensitive) **and** the on-chain owner of the record.

## Endpoints
All JSON. All responses carry CORS headers for the allowed origins (env `ALLOWED_ORIGINS`, comma-separated; default: `http://localhost:3000,http://localhost:3111,https://app-production-6676.up.railway.app,https://bitregalo.com,https://www.bitregalo.com,https://app.bitregalo.com`). Errors: `{ "error": "<code>", "message": "<plain sentence>" }` with a 4xx/5xx status.

### `GET /healthz`
`200 {"ok":true}`.

### `PUT /v1/entries/{chainId}/{workspace}/{kind}/{recordId}`
Body:
```json
{ "title": "Scaffolding for 12 weeks", "description": "…", "category": "construction",
  "country": "NZ", "city": "Auckland", "poster": "0xabc…", "issuedAt": "2026-10-03T01:23:45Z",
  "signature": "0x…" }
```
Checks, in order: field validation (400 `invalid`), timestamp window (400 `stale`), signature recovers `poster` (401 `bad_signature`), chain id supported (400 `unsupported_chain`), workspace exists in the mother (404 `no_workspace`), record exists (404 `no_record`), on-chain owner equals `poster` (403 `not_owner`). Then upsert (an owner may update their own entry; `createdAt` is kept, `updatedAt` changes). Returns `200` with the Entry.
The server also stores, read from chain at write time: `settlement` (0 none, 1 direct, 2 escrow), `token` (address or zero), `amount` (string, base units; listings only, `"0"` for requests), `deadline` (unix seconds; requests only, else 0), `state` (the record's state number at write time).

### `GET /v1/entries/{chainId}/{workspace}/{kind}/{recordId}`
`200` Entry, or `404 not_found`.

### `GET /v1/entries`
Query: `chainId` (required), `workspace` (optional; omit for all workspaces), `kind` (optional), `country` (optional), `category` (optional), `q` (optional, case-insensitive match on title and description), `poster` (optional address), `limit` (1–100, default 30), `cursor` (opaque, from `next`).
Newest first (by `createdAt`, then id). Returns `200 { "entries": Entry[], "next": "<cursor>" | null }`.

### `GET /v1/countries?chainId=97[&workspace=N][&kind=…]`
`200 { "countries": [ { "code": "NZ", "requests": 4, "listings": 2 } ] }`, sorted by total desc.

### Entry shape
```json
{ "chainId": 97, "workspace": 1, "kind": "request", "recordId": 12,
  "title": "…", "description": "…", "category": "construction", "country": "NZ", "city": "Auckland",
  "poster": "0xabc…", "settlement": 2, "token": "0x…", "amount": "0", "deadline": 1790000000, "state": 1,
  "createdAt": "2026-10-03T01:23:50Z", "updatedAt": "2026-10-03T01:23:50Z" }
```
Addresses are returned checksummed.

## Limits
Body ≤ 16 KB. Simple per-IP rate limit on writes (e.g. 30/minute). Reads are public.

## Maintainers
The Go service and the web app both depend on this file. Change it only through the lead, and change both sides together.
