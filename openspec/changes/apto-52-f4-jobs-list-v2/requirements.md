# Requirements — apto-52-f4-jobs-list-v2 (apto#52)

**Refs:** BR-0401 … BR-0406 · Demo2-Plan F4 · FR-21..23

### FR-0401
`GET /api/jobs` SHALL include per row: `accountCode`, `daysSinceStart`, `wipAssetCount`,
`exceptionAssetCount`, `finishedAssetCount`, `progressPercent` (0–100 integer).

### FR-0402
Jobs list UI SHALL default to **open jobs only** (exclude ops status Completed, Canceled,
In Transit — case-insensitive match on display or code).

### FR-0403
Jobs list UI SHALL support filters: account, facility, ops status, SLA flag (`on-track` |
`at-risk` | `overdue`), created/start/due date ranges.

### FR-0404
Jobs list UI SHALL allow showing/hiding and reordering columns; persist choice in
`localStorage` key `apto.jobsList.columns.v1`.

### FR-0405
Jobs list UI SHALL sort by any visible column and export the **current filtered view** to a
downloadable spreadsheet file (CSV acceptable for Demo 2).

### FR-0406
Row action SHALL navigate to `ROUTES.jobDetail(jobId)` (register route; placeholder page OK
until F3).

### NFR-0401
`npm run gate:mr` SHALL pass with API tests for enriched list payload and web unit tests for
filters/sort/export helpers.
