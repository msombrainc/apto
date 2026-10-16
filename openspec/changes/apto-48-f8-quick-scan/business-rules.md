# Business rules — F8 warehouse scan

## BR-1401 Lookup uniqueness

`GET /api/assets/lookup` SHALL return exactly one asset when `code` matches one `AptoId` or one
serial. Zero matches → HTTP 404. More than one asset with the same serial → HTTP 409 with
`ambiguousCount` in the body. Apto ID is unique by constraint.

## BR-1402 No mutation on lookup failure

When lookup returns 404 or 409, the scan workflow SHALL NOT call `PUT /api/assets/{id}` and SHALL
record a failure line in the session log with the API error reason.

## BR-1403 Change history on field updates

Each applied change to `grade`, `status`, or `location` SHALL append an `AssetChangeLog` row with
`fieldName` `grade`, `status`, or `location`, old and new display values, and `ChangedBy` from
`X-Apto-User` header (default `demo`).

## BR-1404 Location facility scope

`Location` on an asset SHALL reference an active `ReferenceItem` where `Type = location` and
`ParentId` equals the facility `ReferenceItem` id matching the asset job `FacilityCode` (BR-1302
from apto#46). Invalid or cross-facility location → HTTP 400.

## BR-1405 Reference validation

`Grade` and `Status` SHALL be validated against active `ReferenceItem` rows where `Type = grade`
and `Type = asset-status` respectively. Unknown or inactive codes → HTTP 400.

## BR-1406 Preset fixed vs ask

For each preset attribute (grade, status, location), the preset SHALL specify either a fixed value
applied on every scan or mode `ask` requiring operator input before apply for that scan only.

## BR-1407 Session log immutability

Session log entries are append-only in the UI for the current session; clearing the log does not
delete server change history.

## BR-1408 Create optional fields

`POST /api/jobs/{jobId}/assets` MAY accept optional `grade`, `status`, `locationId` when creating
an asset; same validation as PUT (BR-1404, BR-1405).
