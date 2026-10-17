# Change: F3 Job detail and edit

**Tracker:** msombrainc/apto#53 (SLICE-008, parent apto#43)  
**Change id:** `apto-53-f3-job-detail`  
**Plan SoT:** `docs/planning/Demo2-Plan.md` §F3; FR-25, FR-27, FR-34

## Problem

Operators can create jobs and land on `/jobs/:jobId` from the jobs list (F4), account detail (F2),
or inventory (F9), but the route still renders `JobDetailPlaceholder`. Job create/edit and inline
asset intake live only on the legacy jobs dashboard split view. Demo 2 needs a dedicated job
hub: edit core fields, progress and SLA summary, asset table, and clear entry points to import,
bulk create, certificates, and invoicing slices.

## Desired outcome

1. **Job detail/edit UI** — replace `JobDetailPlaceholder` with a full page at
   `ROUTES.jobDetail(jobId)` (`data-testid="f3-job-detail-page"`): load job by id, editable
   Account (searchable), Facility, Ops Status, start date, due date; save via `PUT /api/jobs/{id}`.
2. **Progress summary** — show total assets, WIP / Finished / Exception counts, progress %, SLA
   days remaining, and SLA flag from the job GET payload (same aggregation as F4 list).
3. **Asset list** — table backed by `GET /api/jobs/{jobId}/assets` with columns per Demo2-Plan
   (Apto ID, serial, part number, category, grade, status, location); row links to asset detail.
4. **Add assets (Demo 1 path)** — inline form on the job page using existing
   `POST /api/jobs/{jobId}/assets` (part number + optional serial).
5. **Forward actions (stubs)** — visible actions for F6 spreadsheet import, F7 bulk unserialized,
   F10 certificate, F11 service invoice; each passes `jobId` context and may use placeholder UI
   until those slices ship (no F6/F7/F10/F11 product logic in this change).

## Dependencies

- **F13 (apto#46)** — facility codes and asset-status groups for validation and progress buckets.
- **F4 (apto#52)** — jobs list links to this route.
- **F2 (apto#51)** — account jobs table links to this route.
- **F8 (apto#48)** — `AptoId` and enriched asset fields on create/list.

## Out of scope

- Job change history (FR-26), automatic Ops Status transitions (FR-28), client-reference fields,
  Client Services Status (Demo2-Plan §F3).
- F6 import wizard, F7 bulk loop, F10 print template, F11 invoice APIs (separate slices; stubs only).
- Moving job **create** off the jobs list modal (create may remain on list; this slice focuses on
  detail/edit for an existing job).

## UX

`ux-charter-first` on apto#53 — Athena may add a charter under `docs/ux/`; Hermes defines
capabilities, validation copy, `data-testid` hooks, and field inventory per Demo2-Plan §F3.
