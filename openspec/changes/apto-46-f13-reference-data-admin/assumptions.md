# Assumptions — apto#46

## ASSUMPTION-461 In-use detection (slice scope)

For apto#46, `inUseCount` for facilities SHALL count jobs with matching `FacilityCode`. For
locations, grades, asset statuses, and job statuses, `inUseCount` MAY return 0 until Asset/Job
columns from Demo 2 migration land; UI still shows the field. Categories `inUseCount` SHALL
count related `PartNumbers`.

## ASSUMPTION-462 Reference type route keys

API `{type}` path segment SHALL use lowercase kebab values:
`facility`, `location`, `job-status`, `asset-status`, `grade`, `damage`.

## ASSUMPTION-463 Facilities endpoint compatibility

`GET /api/jobs/facilities` SHALL remain during Demo 2 and return active facility **codes** in
`SortOrder` order, backed by `ReferenceItem` (not `SlaStatusCalculator.AllowedFacilities`).

## ASSUMPTION-464 Paging defaults

Reference list endpoints default `pageSize` = 50, maximum `pageSize` = 200 (aligned with
inventory browse cap in Demo 2 plan §4).

## ASSUMPTION-465 Admin auth

Only authenticated demo users (existing cookie/session) MAY call mutating reference endpoints;
no role matrix in Demo 2.
