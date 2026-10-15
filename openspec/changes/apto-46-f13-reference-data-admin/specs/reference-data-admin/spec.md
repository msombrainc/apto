# reference-data-admin — delta (apto#46)

## ADDED Requirements

### REQ-1301 ReferenceItem persistence

The system SHALL persist reference list entries in `ReferenceItem` with type-specific code
uniqueness, optional parent facility for locations, sort order, active flag, and optional
group/certificateGroup for asset statuses.

#### Scenario: Seed facilities after migration

- **WHEN** the database is migrated for apto#46
- **THEN** active facility codes GA, TX, and CA exist with Demo 2 seed locations and statuses

### REQ-1302 STG SQLite parity

The STG SQLite schema patcher SHALL create and seed `ReferenceItems` when the table is absent so
STG deploys match SQL Server schema.

#### Scenario: STG boot after deploy

- **WHEN** the API starts against an older SQLite file without ReferenceItems
- **THEN** the patcher adds the table and seed data without manual SQL

### REQ-1303 Reference REST API

The API SHALL expose `GET/POST /api/reference/{type}` and `PUT/DELETE /api/reference/{type}/{id}`
for types `facility`, `location`, `job-status`, `asset-status`, `grade`, and `damage` with
paging, search, and deactivate-on-delete-when-in-use semantics.

#### Scenario: Create and list location

- **WHEN** a client posts a location under facility GA
- **THEN** a subsequent filtered GET returns that location for the facility parent id

### REQ-1304 Categories REST API

The API SHALL expose `GET/POST/PUT /api/categories` on the existing Categories table with
part-number usage counts.

#### Scenario: List categories with counts

- **WHEN** a client GETs /api/categories
- **THEN** each category includes partNumberCount

### REQ-1305 Reference Data admin UI

The web app SHALL provide Admin → Reference Data with a generic list/edit flow per list type,
search, paging, activate/deactivate, and type-specific fields (facility parent, asset status
group).

#### Scenario: Admin searches facilities

- **WHEN** the user selects Facilities and searches for TX
- **THEN** the list shows the TX facility row

### REQ-1306 Facility validation source

Job create/update and `GET /api/jobs/facilities` SHALL use active facility reference items
instead of hardcoded allowed codes.

#### Scenario: Jobs facilities endpoint

- **WHEN** a client GETs /api/jobs/facilities
- **THEN** the response lists active facility codes from ReferenceItem
