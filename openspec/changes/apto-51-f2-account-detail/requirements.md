# Requirements — apto-51-f2-account-detail (apto#51)

**Change id:** `apto-51-f2-account-detail`  
**Refs:** ASSUMPTION-511 … ASSUMPTION-518 · BR-0201 … BR-0210 · Demo2-Plan F2 · FR-9, FR-10, FR-11, FR-12, FR-16, FR-17

## Functional — data model

### FR-0201
The system SHALL add `Account.Status` (string max 16, required, default `Active`) and
`Account.Settings` (JSON text, required, default per ASSUMPTION-511).

### FR-0202
The system SHALL add table `AccountChangeLog` with columns matching `AssetChangeLog` shape:
`Id`, `AccountId` (FK), `FieldName`, `OldValue`, `NewValue`, `ChangedBy`, `ChangedAtUtc`.

### FR-0203
An EF Core migration SHALL create `AccountChangeLog` and new `Account` columns; index on
`AccountChangeLog.AccountId`.

### FR-0204
`SqliteStgSchemaPatcher` SHALL add the same columns and `AccountChangeLogs` table when missing on
STG SQLite boot.

## Functional — account read API

### FR-0205
`GET /api/accounts/{id}` SHALL return HTTP 200 with account scalars, `status`, `settings`, QBO
fields (`qboCustomerId`, `qboSyncStatus`, `qboSyncError`, `qboLastSyncAtUtc` per ASSUMPTION-514),
and `createdAtUtc`; or HTTP 404 when id is unknown.

### FR-0206
`GET /api/accounts/{id}/changes` SHALL return paginated change log entries for the account with
optional filters per ASSUMPTION-517; HTTP 404 when account id is unknown.

## Functional — account list API

### FR-0207
`GET /api/accounts` SHALL accept optional `status` per BR-0210 and return `status`, `settings`
(at minimum `aptoPercentage` and SLA-related display fields), and existing QBO summary fields for
each row.

### FR-0208
List ordering SHALL remain alphabetical by `Name` unless a future slice adds sort params.

## Functional — account write API

### FR-0209
`PUT /api/accounts/{id}` SHALL accept `name`, `code`, `status`, SLA day fields, and full `settings`
object; validate per BR-0201–BR-0204; write BR-0207 change log; apply BR-0208 QBO enqueue; return
HTTP 200 with updated account body.

### FR-0210
`POST /api/accounts` SHALL accept optional `status` and `settings`; apply BR-0201 and SLA defaults
per ASSUMPTION-516; continue to enqueue customer create via F12 (not inline QBO).

### FR-0211
`POST /api/accounts/{id}/qbo-sync` SHALL remain the manual “Sync now” action (ASSUMPTION-472 from
F12), returning HTTP 202 with queue request id when QBO is configured.

## Functional — account detail UI

### FR-0212
The app SHALL provide account detail/edit at `/accounts/:accountId`
(`data-testid="f2-account-detail-page"`) opened from the accounts search name link (FR-9, FR-10).

### FR-0213
The detail form SHALL allow edit of: Name, Code, Status (Active/Inactive), Input / Settlement /
Sales SLA days (bound to API SLA fields), Apto % (`settings.aptoPercentage`), fee schedule grid,
account rules toggles, service offering toggles, and billing address fields (FR-11, FR-12).

### FR-0214
The detail page SHALL show change history with field and date filters (`data-testid="f2-account-changelog"`)
backed by FR-0206 (FR-16).

### FR-0215
The detail page SHALL list the account's jobs with SLA flag and link to job detail (FR-0218 via
ASSUMPTION-518).

### FR-0216
The detail page SHALL render a QuickBooks panel (`data-testid="f2-account-qbo-panel"`): sync status,
customer id, last sync time, error when failed, **Sync now** (FR-0211), and **Open in QuickBooks**
link per ASSUMPTION-473 (FR-17).

### FR-0217
Save SHALL call `PUT`, show field-level validation errors from API, and SHALL NOT block on QBO
completion (success toast when AIMS save succeeds).

## Functional — accounts search UI

### FR-0218
Accounts search SHALL add status filter (Active / Inactive / Both), columns for Status, Apto %,
Input / Settlement / Sales SLA day counts, and link account name to detail (FR-9, FR-10).

### FR-0219
UI SHALL rename SLA segment labels from Receiving / Processing / Shipping to **Input / Settlement /
Sales** everywhere accounts are shown (Demo2-Plan §4 terminology).

## Non-functional

### NFR-0201
Account `PUT` response time SHALL be under 2 seconds in integration tests without live QBO HTTP
(enqueue only).

### NFR-0202
Change log and settings persistence SHALL satisfy NFR-6 auditability for account edits (viewable
in-app).

## Explicitly out of scope (Demo 2 F2)

### OOS-0201
Enforcing account rules during asset or job processing.

### OOS-0202
Custom required fields (FR-13), report configuration (FR-14), price-deduction tables (FR-15).

### OOS-0203
Optional QBO balance and invoice list on the panel (Demo2-Plan §8 “if time allows”).
