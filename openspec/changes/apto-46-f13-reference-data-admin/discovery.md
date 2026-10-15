# Discovery — apto#46 F13 Reference data admin

## Problem statement

Warehouse and operations staff need stable, ordered lists (facilities, locations, statuses,
grades, categories) that managers can maintain without code changes. Demo 2 downstream
features assume these lists exist and drive job progress grouping, certificates, and invoice
quantity defaults.

## Actors

| Actor | Goal |
|-------|------|
| Admin user (demo login) | Maintain reference lists; deactivate entries no longer used |
| Operations user | Select facility/location/status/grade from lists on jobs and assets (later slices) |
| Implementer | One generic API + UI pattern for all list types |

## Current state (Demo 1)

- Facilities: fixed `GA`, `TX`, `CA` in `SlaStatusCalculator.AllowedFacilities`.
- Job Ops Status: unconstrained string on create/update.
- Categories: DB table, no HTTP or UI.
- No locations, asset statuses, grades, or damages in persistence.

## Future state (this change)

- All F13 list types stored in `ReferenceItem` (categories also exposed via `/api/categories`
  on existing table).
- Admin screen(s) under Admin → Reference Data with search, sort, paging, activate/deactivate.
- Seed data matches Demo 2 script expectations (GA/TX/CA locations, F3 ops statuses, asset
  status groups, grades U–D).

## Success metrics

- 100% of F13 list types reachable via API with seed data present after migration.
- Admin user can add a location under a facility and see it in `GET /api/reference/location`
  within the same session (no deploy).
- `GET /api/jobs/facilities` returns the same three seeded facility **codes** as today for
  backward compatibility until UI migrates.

## Open questions (resolved in requirements)

| # | Question | Resolution |
|---|----------|------------|
| D1 | Include Damages list? | Yes — Demo2-Plan §F13 lists Damages; CRUD same as other reference types |
| D2 | Physical delete? | No — deactivate; block delete when referenced (ASSUMPTION-461) |
| D3 | Categories dual model? | Keep `Categories` table; sync name with reference UX via category endpoints |
