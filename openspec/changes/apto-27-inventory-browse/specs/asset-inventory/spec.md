# Asset inventory browse (apto#27)

## Requirements

### Requirement: Cross-job inventory API
The API SHALL list assets across jobs with optional `q`, `accountId`, `facilityCode`, and `jobId` filters and SHALL return account name and facility for each row.

#### Scenario: List all assets
- **WHEN** client GETs `/api/assets` without filters
- **THEN** response is 200 with up to 200 assets ordered newest first

#### Scenario: Filter by serial fragment
- **WHEN** client GETs `/api/assets?q=SN-42`
- **THEN** only assets whose serial or part number contains the fragment are returned

### Requirement: Inventory React view
The web app SHALL provide an Inventory screen with search, account and facility filters, a results table, and change log when a row is selected.
