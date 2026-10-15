# Change: F13 Reference data admin

**Tracker:** msombrainc/apto#46 (SLICE-001, parent apto#43)  
**Change id:** `apto-46-f13-reference-data-admin`  
**Plan SoT:** `docs/planning/Demo2-Plan.md` §F13, §6, §7

## Problem

Demo 1 hardcodes facility codes (`GA`, `TX`, `CA`) via `GET /api/jobs/facilities` and
`SlaStatusCalculator.AllowedFacilities`. Job Ops Status is free text. The `Categories` table
exists with no API or screen. Demo 2 requires every dropdown (facility, location, job/asset
status, grade, category, damages) to read **admin-managed reference data** so later slices
(F3–F11) do not ship hardcoded lists.

## Desired outcome

1. **`ReferenceItem`** persistence (EF migration + STG SQLite patch) with seed data per Demo 2.
2. **Generic reference REST API** (`/api/reference/{type}`) plus **category** endpoints on the
   existing `Categories` table.
3. **Admin UI** — one configurable list/edit experience for each reference list under Admin →
   Reference Data (Figma / AIMS shell; visual detail deferred to `ux-charter-first`).
4. **Remove Demo 1 facility hardcoding** — `GET /api/jobs/facilities` served from reference
   data or removed with clients migrated to reference API.

## Dependencies

- None (SLICE-001 bootstrap).

## Out of scope (Demo 2 plan §F13)

- Damage-to-category applicability and grade restrictions (FR-81a detail).
- Category sellable criteria (FR-63).
- Carts (FR-42).
- Enforcing reference data on asset/job writes beyond facility validation in this slice (full
  validation lands with F3/F8 consumers; APIs must be ready).

## UX / design

- `ux-charter-first` on apto#46 — Athena Mode B before implement; Hermes specifies **capabilities**
  and **data-testid hooks**, not pixel layout.
