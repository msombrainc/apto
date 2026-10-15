# qbo-sync-queue — delta (apto#47)

## ADDED Requirements

### REQ-1201 QboSyncRequest persistence

The system SHALL persist outbound QuickBooks work items in `QboSyncRequest` with operation, entity
link, JSON payload, status lifecycle, attempt count, last error, and QBO entity id on success.

#### Scenario: Migration creates queue table

- **WHEN** the database is migrated for apto#47
- **THEN** table `QboSyncRequests` exists with status index for dequeue

### REQ-1202 STG SQLite parity

The STG SQLite schema patcher SHALL add `QboSyncRequests` when absent so queue behavior matches
SQL Server on STG deploys.

#### Scenario: STG boot on older SQLite

- **WHEN** the API starts against SQLite without QboSyncRequests
- **THEN** the patcher creates the table without manual SQL

### REQ-1203 Account flows enqueue only

Account create and update SHALL enqueue customer sync operations and SHALL NOT perform synchronous
QBO HTTP in the request pipeline.

#### Scenario: Create account returns before QBO

- **WHEN** a client creates an account with QBO configured
- **THEN** the HTTP response is 201 with pending sync status and a Pending queue row exists

### REQ-1204 Queue worker

A background worker SHALL dequeue Pending requests oldest-first at a 10-second poll interval, send
at most 5 automatic attempts with exponential backoff, and update linked Account fields on
terminal success or failure.

#### Scenario: Oldest pending sent first

- **WHEN** two Pending customer creates exist with different CreatedAtUtc
- **THEN** the older row is Sent before the newer row leaves Pending

### REQ-1205 Queue REST API

The API SHALL expose connection status, paginated request list with filters, and manual retry for
Failed rows.

#### Scenario: Retry failed request

- **WHEN** a client POSTs retry for a Failed request id
- **THEN** the row returns to Pending with attempts reset to 0

### REQ-1206 QuickBooks Sync admin UI

The web app SHALL provide Admin → QuickBooks Sync showing connection state, filterable request
history, retry for failures, and links to AIMS account and QBO sandbox customer when ids exist.

#### Scenario: Operator retries failure

- **WHEN** the user opens QuickBooks Sync and clicks Retry on a Failed row
- **THEN** the row shows Pending after refresh

### REQ-1207 CreateInvoice hook

The queue SHALL accept CreateInvoice operations for F11; processing SHALL fail with a clear error
when the account has no QboCustomerId (no invoice UI in apto#47).

#### Scenario: Invoice without synced customer

- **WHEN** a CreateInvoice request is processed for an account without QboCustomerId
- **THEN** the request ends Failed with a customer-not-synced error

### REQ-1208 Non-functional gate

Account write endpoints SHALL meet 2-second p95 with mocked QBO; queue list SHALL meet 500 ms on
50-row pages in CI; tests SHALL not call live QBO sandbox.

#### Scenario: CI uses mocks only

- **WHEN** gate integration tests run
- **THEN** no outbound network calls hit intuit.com hosts
