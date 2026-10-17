# Change: F6 Asset import from spreadsheet

**Tracker:** msombrainc/apto#54 (SLICE-009, parent apto#43)  
**Change id:** `apto-54-f6-spreadsheet-import`  
**Plan SoT:** `docs/planning/Demo2-Plan.md` §F6; FR-31

## Problem

Job detail (F3) exposes a stub for spreadsheet import. Operators receive client asset lists as
`.csv` or `.xlsx` and need to bulk-create job assets without manual one-by-one entry.

## Desired outcome

1. **Route** — `/jobs/:jobId/import/spreadsheet` (`data-testid="f6-spreadsheet-import-page"`), linked
   from F3 **Import spreadsheet** with `jobId` preserved.
2. **Upload & parse** — client-side read of `.csv` and `.xlsx` (≤500 rows).
3. **Column mapping** — map file columns to Serial Number, Part Number, Category (optional), Grade (optional).
4. **Preview validation** — per-row status before save (part required; serial uniqueness in file + AIMS lookup;
   grade/category codes vs reference data).
5. **Unknown part numbers** — operator chooses create missing part numbers or skip those rows.
6. **Import** — sequential `POST /api/jobs/{jobId}/assets` (and `POST /api/part-numbers` when creating parts)
   with progress UI; summary counts + download failed rows as CSV.
7. **Return** — link back to job detail with refreshed assets.

## Dependencies

- **F3 (apto#53)** — job hub entry point and `jobId` context.
- **F8** — asset lookup for duplicate serial detection.
- **F13 / F14** — reference grades and part categories.

## Out of scope

- ASN storage (FR-18–FR-20), server-side bulk endpoint, production-scale performance tuning.
