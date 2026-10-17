# Change: F10 Certificates (Recycling / Data Destruction)

**Tracker:** msombrainc/apto#58 (SLICE-013, parent apto#43)  
**Change id:** `apto-58-f10-certificates`  
**Plan SoT:** `docs/planning/Demo2-Plan.md` §F10; FR-73

## Problem

Job detail (F3) exposes a **Certificate** stub (`f3-action-certificate`) with no printable
compliance document. Demo 2 requires operators to generate Recycling or Data Destruction
certificates from job + asset data, preview them, and print or save as PDF — with no new
backend APIs.

## Desired outcome

1. **Entry** — F3 **Certificate** navigates to `/jobs/{jobId}/certificate` with job context.
2. **Type selection** — operator chooses **Recycling** or **Data Destruction** before preview.
3. **Preview / print** — printable certificate template: Apto issuer block, client account, job,
   facility, processing dates, covered assets table (Apto ID, serial, part number, category,
   status), totals, compliance statement, signature block; visible **SAMPLE** watermark (Demo 2).
4. **Classification** — covered assets determined from asset-status reference data
   (`certificateGroup`); excluded assets summarized with count (not listed in full on cert).

## Dependencies

- **F3 (apto#53)** — job detail hub and asset list API.
- **F13 (apto#46)** — asset-status rows with `certificateGroup` (Recycled, Wiped, Shredded).

## Out of scope

Certificate storage, numbering, bulk download, Blancco/EPS sanitization records (Phase 4).
New REST endpoints (Demo2-Plan §F10 BE: none).

## UX

`ux-charter-first` — charter `docs/ux/apto-58-f10-certificates-charter.md`. Hermes defines
classification rules and `data-testid` hooks per Demo2-Plan §F10.
