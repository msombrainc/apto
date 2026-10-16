# Requirements — apto-48-f8-quick-scan (apto#48)

**Change id:** `apto-48-f8-quick-scan`  
**Refs:** ASSUMPTION-481 … ASSUMPTION-486 · BR-1401 … BR-1408 · Demo2-Plan F8, FR-38, FR-39

## Functional — data model

### FR-1401
The system SHALL add columns to `Asset`: `AptoId` (string max 16, unique, required after
backfill), `Grade` (nullable string max 32), `Status` (nullable string max 64), `LocationId`
(nullable GUID FK to `ReferenceItem.Id`).

### FR-1402
An EF Core migration SHALL create unique index on `Asset.AptoId` and non-unique index on
`Asset.SerialNumber` for lookup performance.

### FR-1403
`SqliteStgSchemaPatcher` SHALL add the same columns and indexes when missing on STG SQLite boot.

### FR-1404
Migration SHALL backfill `AptoId` for existing rows per ASSUMPTION-481 before enforcing NOT NULL
on new writes.

### FR-1405
`POST /api/jobs/{jobId}/assets` SHALL assign the next `AptoId` sequence value on create and MAY
accept optional `grade`, `status`, `locationId` (BR-1408).

## Functional — lookup API

### FR-1406
`GET /api/assets/lookup` SHALL require query `code` (ASSUMPTION-485); empty code returns HTTP 400.

### FR-1407
When exactly one asset matches `code` by `AptoId` or serial, the API SHALL return HTTP 200 with
JSON including `id`, `aptoId`, `serialNumber`, `jobId`, `facilityCode`, `grade`, `status`,
`locationId`, `locationName`, `partNumber`.

### FR-1408
When no asset matches, the API SHALL return HTTP 404 with `{ error }` describing not found
(BR-1401).

### FR-1409
When more than one asset shares the same serial (case-insensitive), the API SHALL return HTTP 409
with `{ error, ambiguousCount }` (BR-1401).

## Functional — update API

### FR-1410
`PUT /api/assets/{id}` SHALL accept optional `grade`, `status`, `locationId` in the request body
in addition to existing serial and part number fields.

### FR-1411
Updates to grade, status, and location SHALL validate against BR-1404 and BR-1405 and append
change log rows per BR-1403.

### FR-1412
`GET /api/assets/{id}` and list responses used by inventory SHALL include `aptoId`, `grade`,
`status`, `locationId`, and `locationName` when present.

## Functional — scan UI (Operations)

### FR-1413
The app SHALL expose Operations → Scan (`data-testid="f8-scan-page"`) reachable from the module
map (Demo2-Plan §F8).

### FR-1414
The page SHALL provide preset picker (`data-testid="f8-scan-preset-select"`) and preset builder
(`data-testid="f8-scan-preset-editor"`) supporting grade, status, and location with fixed value
or ask-per-scan per BR-1406; presets persist per ASSUMPTION-482.

### FR-1415
The user SHALL mark a preset as global (`data-testid="f8-scan-preset-global"`) per
ASSUMPTION-484 (FR-39 Demo 2 behavior).

### FR-1416
The scan input (`data-testid="f8-scan-code-input"`) SHALL accept keyboard or scanner input;
submitting a code SHALL call FR-1406 then apply preset fields via FR-1410 when lookup succeeds
(BR-1402).

### FR-1417
Each scan SHALL show result banner `data-testid="f8-scan-result-success"` or
`data-testid="f8-scan-result-failure"` within **1 second** of submit on seeded integration
data (Demo2-Plan §F8 target).

### FR-1418
Success and failure SHALL provide distinct visual states and audio per ASSUMPTION-483.

### FR-1419
The page SHALL show session log table `data-testid="f8-scan-session-log"` with columns: time,
code, aptoId, fields changed, result.

### FR-1420
The user SHALL undo the last successful scan via `data-testid="f8-scan-undo"` using
ASSUMPTION-486.

## Functional — global search contract (F1 hook)

### FR-1421
The lookup response shape in FR-1407 SHALL remain stable for F1 global search consumers; breaking
changes require a new OpenSpec change.

## Non-functional

### NFR-1401
`GET /api/assets/lookup` p95 latency SHALL be ≤ **300** ms for exact hit on 10k seeded assets in
CI integration tests.

### NFR-1402
Scan apply path (lookup + PUT) p95 SHALL be ≤ **1000** ms on seeded data in CI integration tests
(Demo2-Plan §F8).

### NFR-1403
New integration tests SHALL use in-memory or SQLite test DB; no production data dependencies.
