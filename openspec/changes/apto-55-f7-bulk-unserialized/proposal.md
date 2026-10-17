# Change: F7 Bulk unserialized asset creation

**Tracker:** msombrainc/apto#55 (SLICE-010, parent apto#43)  
**Change id:** `apto-55-f7-bulk-unserialized`  
**Plan SoT:** `docs/planning/Demo2-Plan.md` §F7; FR-30

## Problem

Job detail (F3) exposes a stub for bulk unserialized creation. Operators need to add many
assets without serials (same part number) from the job context.

## Desired outcome

1. **Route** — `/jobs/:jobId/import/bulk` (`data-testid="f7-bulk-import-page"`), linked from F3
   **Bulk unserialized** (`f3-action-bulk`).
2. **Form** — part number search or preset **UNIDENTIFIED**; quantity 1–500; optional grade, status,
   location (validated against reference data for the job facility).
3. **Create** — sequential `POST /api/jobs/{jobId}/assets` without serial; show progress.
4. **Results** — list new Apto IDs; export to CSV; return to job detail.

## Dependencies

- **F3 (apto#53)** — job hub entry.
- **F8** — create accepts grade, status, location; Apto ID allocation.
- **BE** — seed `UNIDENTIFIED` part number when missing.

## Out of scope

Server-side bulk endpoint, ASN flows, spreadsheet import (F6).
