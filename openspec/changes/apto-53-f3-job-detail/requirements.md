# Requirements — apto-53-f3-job-detail (apto#53)

**Refs:** BR-0301 … BR-0308 · Demo2-Plan F3 · FR-25, FR-27, FR-34

## Functional — job read API

### FR-0301
`GET /api/jobs/{id}` SHALL return HTTP 200 with the existing `JobResponse` shape including
`accountName`, `accountCode`, `facilityCode`, `opsStatus`, `startDateUtc`, `dueDateUtc`,
`slaTotalDays`, `daysRemaining`, `slaStatus`, `daysSinceStart`, `wipAssetCount`,
`exceptionAssetCount`, `finishedAssetCount`, and `progressPercent`; or HTTP 404 when the id is
unknown.

### FR-0302
`GET /api/jobs/{id}` SHALL expose `assetCount` as the sum of WIP, Exception, and Finished counts
(either as an explicit JSON field or documented as derived client-side from FR-0301 fields).

## Functional — job write API

### FR-0303
`PUT /api/jobs/{id}` SHALL accept `JobWriteRequest` (`accountId`, `facilityCode`, `opsStatus`,
`startDateUtc`, `dueDateUtc`) and return HTTP 200 with updated `JobResponse` or HTTP 404 when the
job id is unknown.

### FR-0304
`POST /api/jobs` and `PUT /api/jobs/{id}` SHALL validate `facilityCode` against active reference
data type `facility` (existing behaviour) and SHALL validate `opsStatus` against active reference
data type `job-status` (BR-0302); invalid values return HTTP 400 with a single `error` message.

### FR-0305
When `dueDateUtc` is omitted on write, the API SHALL default due date from the bound account SLA
rules (existing `SlaStatusCalculator.DefaultDueDateUtc` behaviour per BR-0303).

### FR-0306
When `dueDateUtc` is provided, validation SHALL reject due date before start date (BR-0304).

## Functional — job assets API (list enrichment)

### FR-0307
`GET /api/jobs/{jobId}/assets` SHALL return HTTP 404 when `jobId` is unknown (existing).

### FR-0308
Each asset row in the job assets list SHALL include `category` (display name from the asset's part
number category, or null when unset) in addition to `aptoId`, `serialNumber`, `partNumber`,
`grade`, `status`, and `locationName` (or equivalent location display).

## Functional — job detail UI

### FR-0309
The app SHALL render job detail at `/jobs/:jobId` with `data-testid="f3-job-detail-page"`, replacing
`JobDetailPlaceholder`, for any valid job id from F4 list, F2 account jobs, or deep link.

### FR-0310
The detail page SHALL load the job via `GET /api/jobs/{id}` and show a read-only header with job
id, account name/code (link to `ROUTES.accountDetail`), facility, created date, and SLA summary
(`slaStatus`, `daysRemaining`, `slaTotalDays`).

### FR-0311
The detail page SHALL provide an edit form (`data-testid="f3-job-edit-form"`) for Account
(searchable select by name/code), Facility (active facilities from `GET /api/jobs/facilities` or
reference data), Ops Status (active `job-status` reference items in Demo2 seed order per BR-0301),
start date, and due date; Save SHALL call `PUT /api/jobs/{id}` and refresh local state on success.

### FR-0312
The detail page SHALL show a progress panel (`data-testid="f3-job-progress"`) with total asset
count, WIP / Finished / Exception counts, and `progressPercent` from FR-0301.

### FR-0313
The detail page SHALL list job assets (`data-testid="f3-job-assets-table"`) from FR-0308; each row
SHALL link to `ROUTES.inventoryAsset(assetId)`.

### FR-0314
The detail page SHALL provide inline add-asset (`data-testid="f3-add-asset-form"`) using
`POST /api/jobs/{jobId}/assets` (part number + optional serial) and refresh the asset table on
success.

### FR-0315
Before submitting FR-0314 when the job's ops status is **In Transit** or **Ops Complete** (match
by display name or reference code per BR-0305), the UI SHALL show a confirmation dialog (FR-34).

## Functional — forward action stubs

### FR-0316
The detail page SHALL show action entry points (`data-testid` suffixes: `f3-action-import` F6,
`f3-action-bulk` F7, `f3-action-certificate` F10, `f3-action-invoice` F11) that preserve `jobId`
context (query param or in-app state). Until F6/F7/F10/F11 ship, each MAY navigate to a
placeholder panel or disabled modal stating the target slice; stubs MUST NOT call unfinished
invoice or certificate APIs.

### FR-0317
Stub actions SHALL be keyboard-focusable and labeled per Demo2-Plan §F3 user capabilities (import
from spreadsheet, bulk unserialized, generate certificate, create service invoice).

## Non-functional

### NFR-0301
`npm run gate:mr` SHALL pass with API tests for ops-status validation on job write and web unit
tests for progress display helpers and FR-0315 confirm gating.

### NFR-0302
Unknown job id on the job detail route SHALL show a not-found state (`data-testid="f3-job-not-found"`)
without throwing an unhandled error.
