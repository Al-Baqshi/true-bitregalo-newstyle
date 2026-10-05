# BitRegalo super admin API (v1)

A read-only API for the platform owner's super admin page. It adds what the chain cannot show: sign-in accounts (baqshi-auth), identity verification statistics (kyc.baqshi.com), and counts of the requests and listings described in the marketplace index. It is served by the marketplace service (bitregalo-platform `cmd/market`, https://market-production-671e.up.railway.app) under `/v1/admin/`. Everything on-chain is read by the web page directly; this API never returns contract data the page can read itself.

## Who may call it
Only the wallet that owns the BitRegalo registry, the contract that launches workspaces (in the contracts: the mother, `mother.owner()` on chain 97). Every request carries three headers:

- `X-Admin-Address`: the wallet address.
- `X-Admin-Issued-At`: RFC 3339 UTC to the second, e.g. `2026-10-04T01:23:45Z`; accepted within 10 minutes of server time.
- `X-Admin-Signature`: EIP-191 `personal_sign` of this exact text (lines joined with `\n`):

```
BitRegalo super admin
Chain: 97
Address: {address, checksummed or lower case, exactly as sent in X-Admin-Address}
Issued at: {issuedAt}
```

The server recovers the signer, requires it to equal `X-Admin-Address` (case-insensitive) and the current `owner()` of the mother (read on chain, cached for at most 60 s). Failures: `401 bad_signature`, `401 stale`, `403 not_owner`. The page signs once and reuses the headers until they are about to expire. CORS: the same allowed origins as the rest of the service; preflight must allow these three headers.

## `GET /v1/admin/overview`
```json
{
  "generatedAt": "2026-10-04T01:23:50Z",
  "auth": {
    "configured": true,
    "realm": "bitregalo",
    "users": 42,
    "newLast7Days": 5,
    "newLast30Days": 17,
    "withWallet": 30,
    "recent": [ { "createdAt": "…", "wallet": "0x…" | null, "method": "wallet" | "passkey" | "email" | "other" } ]
  },
  "kyc": {
    "configured": true,
    "baseUrl": "https://kyc.baqshi.com",
    "clients": [ { "name": "BitRegalo", "approved": 3, "rejected": 1, "manual_review": 0, "pending": 2 } ],
    "pendingAccessRequests": 0
  },
  "market": {
    "entries": 12,
    "requests": 8,
    "listings": 4,
    "byCountry": [ { "code": "NZ", "requests": 4, "listings": 2 } ],
    "byWorkspace": [ { "workspace": 1, "entries": 10 } ],
    "newLast7Days": 3
  }
}
```
When a source is not configured or not reachable, its object is `{ "configured": false, "reason": "<plain sentence>" }` (or `"reachable": false` with a reason) and the rest still returns `200`. `recent` holds at most 20 items and never includes e-mail addresses, names or any other personal data beyond the wallet address and dates.

## Maintainers

### Configuration (Railway service `market`)
- `ADMIN_AUTH_URL` (e.g. the bitregalo auth service URL), `ADMIN_AUTH_ROOT_KEY` (an `sk_` root key of the console application), `ADMIN_AUTH_REALM` (default `bitregalo`).
- `ADMIN_KYC_URL` (default `https://kyc.baqshi.com`), `ADMIN_KYC_KEY` (the KYC service's `BAQSHI_ADMIN_KEY`).
Secrets are never logged or returned.
