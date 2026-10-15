# Requirements — apto-46-f13-reference-data-admin (apto#46)

**Change id:** `apto-46-f13-reference-data-admin`  
**Refs:** ASSUMPTION-461 … ASSUMPTION-465 · BR-1301 … BR-1308 · Demo2-Plan F13

## Functional — data model

### FR-1301
The system SHALL add table `ReferenceItem` with columns: `Id` (GUID PK), `Type` (string, max
64), `Code` (string, max 32), `Name` (string, max 128), `ParentId` (nullable GUID FK to
`ReferenceItem.Id`), `Group` (nullable string, max 32), `CertificateGroup` (nullable string,
max 32), `SortOrder` (int, default 0), `IsActive` (bool, default true), `CreatedAtUtc`,
`UpdatedAtUtc`.

### FR-1302
An EF Core migration SHALL create `ReferenceItem` and indexes on `(Type, Code)` and
`(Type, ParentId, Code)` for location uniqueness (BR-1302, BR-1303).

### FR-1303
`SqliteStgSchemaPatcher` SHALL create `ReferenceItems` with the same columns when missing on
STG SQLite boot (mirror FR-1301).

### FR-1304
Migration seed SHALL insert Demo 2 baseline data: facilities `GA`, `TX`, `CA`; at least 2
locations per facility (including Receiving, Audit Bench, Wipe Room, Shred Cage, Recycle Bay,
Sellable Stock across the three sites); job-status values in F3 order (Pickup Scheduled through
Canceled); asset-status rows with groups WIP/Finished/Exception and certificate groups where
listed in Demo2-Plan §F13; grades `U`, `A`, `B`, `C`, `D`; at least 1 damage code row.

## Functional — reference API

### FR-1305
`GET /api/reference/{type}` SHALL return HTTP 200 with JSON `{ items, page, pageSize, total }`
where each item includes `id`, `type`, `code`, `name`, `parentId`, `group`, `certificateGroup`,
`sortOrder`, `isActive`, and `inUseCount` (ASSUMPTION-461).

### FR-1306
`GET /api/reference/{type}` SHALL accept query `q` (search code/name), `page` (default 1),
`pageSize` (default 50, max 200 per ASSUMPTION-464), `includeInactive` (default false per
BR-1304), and for `type=location` required `facilityId` (parent facility id).

### FR-1307
`POST /api/reference/{type}` SHALL create a row and return HTTP 201 with the created item;
validation errors return HTTP 400 with field-specific `error` text.

### FR-1308
`PUT /api/reference/{type}/{id}` SHALL update mutable fields and return HTTP 200, or HTTP 404
when id missing.

### FR-1309
`DELETE /api/reference/{type}/{id}` SHALL return HTTP 204 when `inUseCount` is 0; when
`inUseCount` ≥ 1 SHALL set `IsActive = false` and return HTTP 200 with the deactivated item
(BR-1308).

### FR-1310
Unknown `{type}` SHALL return HTTP 400 with `error` describing allowed type keys (ASSUMPTION-462).

### FR-1311
`JobValidation` and `GET /api/jobs/facilities` SHALL validate and list facility codes from
active `ReferenceItem` rows where `Type = facility` (ASSUMPTION-463), removing use of
`SlaStatusCalculator.AllowedFacilities` for validation.

## Functional — categories API

### FR-1312
`GET /api/categories` SHALL return HTTP 200 with `{ items: [{ id, name, partNumberCount, isActive }] }`
with paging and search consistent with FR-1306 (pageSize default 50).

### FR-1313
`POST /api/categories` SHALL create a category with unique `Name` (case-insensitive) and return
HTTP 201.

### FR-1314
`PUT /api/categories/{id}` SHALL rename a category and return HTTP 200; duplicate name returns
HTTP 409.

## Functional — admin UI

### FR-1315
The app SHALL expose Admin → Reference Data with a type selector for: Facilities, Locations,
Job (Ops) Statuses, Asset Statuses, Grades, Damages, Categories (`data-testid="ref-admin-type-select"`).

### FR-1316
The list view SHALL support search (`data-testid="ref-admin-search"`), column sort, and paging
controls showing total count (BR-1306).

### FR-1317
The user SHALL add and edit entries via a type-specific form: all types require `code`, `name`,
`sortOrder`; locations require facility selection; asset statuses require `group` and optional
`certificateGroup` (BR-1305).

### FR-1318
The user SHALL deactivate and reactivate entries (`data-testid="ref-admin-toggle-active"`); the
UI SHALL display `inUseCount` and block hard delete when count ≥ 1 (BR-1308).

### FR-1319
For Categories, the list SHALL show `partNumberCount` per row (BR-1307).

## Non-functional

### NFR-1301
Reference and category list endpoints SHALL respond within 500 ms p95 on STG with 500 seeded rows
per type (measured in API integration tests).

### NFR-1302
All new endpoints SHALL require the same authentication as existing `/api/jobs` routes.

## Testing

### FR-1320
`Apto.Api.Tests` SHALL include tests for reference CRUD, location parent validation, duplicate
code rejection, and delete-while-in-use deactivation.

### FR-1321
`npm run gate:mr` SHALL pass after implementation.
