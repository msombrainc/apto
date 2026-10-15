# Discovery — apto#47 F12 QuickBooks sync queue

## Problem / outcome

Operators need to see whether QuickBooks is connected, what sync work is pending or failed, and a
one-click retry — without blocking account saves. Outcome: all outbound QBO traffic is queued,
processed by a background worker, and observable in Admin → QuickBooks Sync.

## Actors

- **Warehouse / ops user** — creates or edits accounts; expects saves to succeed immediately while
  QBO sync runs asynchronously.
- **Admin / finance user** — monitors the sync queue, retries failures, opens QBO to verify customers.
- **System** — background worker, OAuth token refresh (existing `QboOAuthService`).

## Current state (Demo 1 / apto#23)

- `QboConnection` + OAuth endpoints exist.
- `POST /api/accounts` calls `IQboCustomerSyncService.SyncAccountCustomerAsync` synchronously;
  `Account.QboSyncStatus`, `QboCustomerId`, `QboSyncError` updated inline.
- No `QboSyncRequest` table, no queue UI, no retry API.

## Future state (F12)

- Account create/update **enqueues** `CreateCustomer` / `UpdateCustomer` rows; API returns before QBO
  completes.
- Hosted service polls every ≤10 seconds, sends oldest Pending request, updates row + linked Account
  fields on success/failure.
- Admin screen lists requests with filters; user retries Failed rows (resets attempt budget per
  BR-1204).
- F11 will enqueue `CreateInvoice` using the same pipeline (contract defined, not implemented here).

## Constraints

- QBO Online Sandbox only; same OAuth app and token refresh as Demo 1.
- Demo volume: plan cites 500 requests/minute — worker may process 1 request per poll tick.
- English UI; USD; desktop + tablet.
- STG SQLite must match SQL Server schema via `SqliteStgSchemaPatcher`.

## Unknowns (resolved in assumptions)

- Exact backoff seconds between automatic retries → ASSUMPTION-471.
- Whether `POST /api/accounts/{id}/qbo-sync` from F2 is a separate manual “sync now” enqueue →
  ASSUMPTION-472.
- Deep link URL pattern for QBO sandbox customer → ASSUMPTION-473.

## Draft in / out of scope

**In:** table, worker, three QBO admin APIs, refactor customer sync to queue, admin UI, tests with
mocked QBO HTTP.

**Out:** invoice queue producer (F11), optional balance panel, qbXML/Web Connector, new OAuth app.
