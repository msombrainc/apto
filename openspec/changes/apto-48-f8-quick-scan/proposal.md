# Change: F8 warehouse scan workflow

**Tracker:** msombrainc/apto#48 (SLICE-003, parent apto#43)  
**Change id:** `apto-48-f8-quick-scan`  
**Plan SoT:** `docs/planning/Demo2-Plan.md` §F8, §7–§8; FR-38, FR-39 (Demo 2 scope)

## Problem

Warehouse operators update grade, status, and location on many assets per shift. Today they open
each asset in Jobs or Inventory, edit one field at a time, and cannot scan Apto IDs or serials at
line speed. Demo 2 also needs a single **lookup** endpoint for global search (F1) and duplicate-serial
checks (F7 import).

## Desired outcome

1. **Asset model extension** — `AptoId` (unique human-readable), `Grade`, `Status`, `Location` on
   `Asset`; migration + STG SQLite patch; backfill `AptoId` for existing rows.
2. **Lookup API** — `GET /api/assets/lookup?code=` exact match on Apto ID or serial; `404` not
   found, `409` ambiguous; indexed for sub-second response.
3. **Update API** — `PUT /api/assets/{id}` accepts grade, status, location; validates against
   apto#46 reference data; location constrained to the asset job facility; change history entries
   for each field.
4. **Operations UI** — F8 scan page: preset builder/picker (browser storage), scan loop with
   success/failure feedback, session log, undo last successful scan; keyboard/scanner-first flow.

## Dependencies

- **SLICE-001 (apto#46)** — `ReferenceItem` seeds for grades, asset statuses, and locations per
  facility; validation rules consume active reference rows.

## Out of scope (this slice)

- F9 Browse Inventory v2 (paging, paste-list, export) — separate ticket; lookup contract is shared.
- Cart/pallet IDs, add/remove damages, image capture during scan (Demo2-Plan §F8).
- Server-side preset persistence or role middleware (Demo 2 SPA login gate only; ASSUMPTION-485).
- Part-number change during scan (preset attribute limited to grade/status/location in Demo 2).

## UX / design

- `ux-charter-first` on apto#48 — Athena Mode B before implement; Hermes specifies capabilities,
  preset fields, feedback states, session log columns, and `data-testid` hooks (Figma Operations
  module), not pixel layout.
