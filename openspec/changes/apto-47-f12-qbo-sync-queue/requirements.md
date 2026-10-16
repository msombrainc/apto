# Requirements — apto-47-f12-qbo-sync-queue (apto#47)

**Change id:** `apto-47-f12-qbo-sync-queue`  
**Refs:** ASSUMPTION-471 … ASSUMPTION-476 · BR-1201 … BR-1210 · Demo2-Plan F12, FR-17, NFR-7

## Functional — data model

### FR-1201
The system SHALL add table `QboSyncRequest` with columns: `Id` (GUID PK), `Operation` (string max
32), `EntityType` (string max 32), `EntityId` (GUID), `PayloadJson` (nvarchar max), `Status`
(string max 16), `Attempts` (int, default 0), `LastError` (nullable string max 2000), `QboId`
(nullable string max 64), `CreatedAtUtc`, `UpdatedAtUtc`, `SentAtUtc` (nullable).

### FR-1202
`Status` SHALL be one of: `Pending`, `Processing`, `Sent`, `Failed` (BR-1202, BR-1203).

### FR-1203
An EF Core migration SHALL create `QboSyncRequests` with index on `(Status, CreatedAtUtc)` for
worker dequeue.

### FR-1204
`SqliteStgSchemaPatcher` SHALL create `QboSyncRequests` with the same columns when missing on STG
SQLite boot (mirror FR-1201).

## Functional — enqueue and account refactor

### FR-1205
`POST /api/accounts` SHALL insert a `QboSyncRequest` with `Operation = CreateCustomer`,
`EntityType = Account`, `EntityId` = new account id, and payload containing `DisplayName` and
billing fields required by Demo2-Plan §8; SHALL NOT call QBO HTTP inline (BR-1201, BR-1208).

### FR-1206
`PUT /api/accounts/{id}` when name or billing address fields change SHALL enqueue
`UpdateCustomer` with read-modify payload per §8 (sparse update) without blocking the PUT
response (BR-1208).

### FR-1207
`POST /api/accounts/{id}/qbo-sync` SHALL enqueue `CreateCustomer` or `UpdateCustomer` per
ASSUMPTION-472 and return HTTP 202 with `{ requestId }`.

### FR-1208
The public account DTO SHALL continue to expose `qboCustomerId`, `qboSyncStatus`, `qboSyncError`;
after enqueue, `qboSyncStatus` MAY be `pending` until worker completion (BR-1207).

## Functional — queue worker

### FR-1209
A hosted background service SHALL poll every **10** seconds (ASSUMPTION-471) and dequeue the
oldest `Pending` row when no row is `Processing`.

### FR-1210
On dequeue, the worker SHALL set `Status = Processing`, increment `Attempts`, invoke the
appropriate QBO API using `QboOAuthService.EnsureAccessTokenAsync`, and on HTTP 2xx set
`Status = Sent`, `QboId`, `SentAtUtc`, and apply BR-1207 to linked Account.

### FR-1211
On failure, the worker SHALL set `LastError` to a human-readable message including Intuit error
code when present (e.g. **6240** for duplicate DisplayName per BR-1209).

### FR-1212
When `Attempts` ≥ **5** and the send still fails, `Status` SHALL be `Failed` (BR-1203). When
`Attempts` < 5, the worker SHALL return the row to `Pending` only after backoff in ASSUMPTION-471
elapses.

### FR-1213
When no valid QBO connection exists, the worker SHALL NOT call QBO; `Pending` rows SHALL remain
with `LastError` set to `QuickBooks not connected` on the first processing attempt.

## Functional — queue API

### FR-1214
`GET /api/qbo/status` SHALL return HTTP 200 with JSON `{ connected, companyName, realmId }`
where `connected` is true when a non-expired `QboConnection` exists with realm id.

### FR-1215
When `connected` is false, the response SHALL include `{ connectUrl }` pointing to the existing
OAuth authorize route so the UI can start connect.

### FR-1216
`GET /api/qbo/requests` SHALL return HTTP 200 with `{ items, page, pageSize, total }`; each item
includes `id`, `operation`, `entityType`, `entityId`, `entityLabel`, `status`, `attempts`,
`lastError`, `qboId`, `createdAtUtc`, `sentAtUtc` (ASSUMPTION-474).

### FR-1217
`GET /api/qbo/requests` SHALL accept optional query `status` and `type` filters (ASSUMPTION-474).

### FR-1218
`POST /api/qbo/requests/{id}/retry` SHALL return HTTP 204 when the row was `Failed` and is reset
to `Pending` with `Attempts = 0` (BR-1204); HTTP 400 when status is not `Failed`; HTTP 404 when
id missing.

## Functional — admin UI

### FR-1219
The app SHALL expose Admin → QuickBooks Sync (`data-testid="qbo-sync-page"`).

### FR-1220
The page SHALL show connection banner with `data-testid="qbo-sync-connection"` displaying
`connected` state and company name from FR-1214, or a Connect action when disconnected.

### FR-1221
The page SHALL list sync requests in a table `data-testid="qbo-sync-table"` with columns:
Type (operation), AIMS record (entity label + link), Status, Attempts, Last error, QBO ID, Created,
Sent.

### FR-1222
The user SHALL filter by status (`data-testid="qbo-sync-filter-status"`) and type
(`data-testid="qbo-sync-filter-type"`) matching FR-1217.

### FR-1223
For rows with `status = Failed`, the user SHALL click Retry (`data-testid="qbo-sync-retry-{id}"`)
which calls FR-1218 and refreshes the list.

### FR-1224
When `qboId` is present, the user SHALL open QuickBooks via link
`data-testid="qbo-sync-open-qbo-{id}"` using ASSUMPTION-473 URL.

### FR-1225
AIMS record link SHALL navigate to `/accounts/{entityId}` when `entityType = Account`
(`data-testid="qbo-sync-open-aims-{id}"`).

## Functional — future invoice contract (F11 hook)

### FR-1226
The enqueue API used by future F11 SHALL accept `Operation = CreateInvoice` with the same table
and worker dispatch; apto#47 SHALL include unit or integration tests proving an invoice payload
row can be enqueued and rejected with `LastError` when account lacks `QboCustomerId` (BR-1210).

## Non-functional

### NFR-1201
Account create/update API p95 latency SHALL remain ≤ **2** seconds with QBO configured, measured
without live QBO (mocked HTTP), excluding worker completion (NFR-7 reliability via async queue).

### NFR-1202
Queue list API SHALL respond within ≤ **500** ms for pageSize 50 on seeded data in CI integration
tests.

### NFR-1203
All new QBO integration tests SHALL use mocked HTTP; no live sandbox calls in `gate:mr`.
