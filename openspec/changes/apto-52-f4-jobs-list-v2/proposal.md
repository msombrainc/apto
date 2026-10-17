# Change: F4 Jobs list v2

**Tracker:** msombrainc/apto#52 (SLICE-007, parent apto#43)  
**Change id:** `apto-52-f4-jobs-list-v2`  
**Plan SoT:** `docs/planning/Demo2-Plan.md` §F4; FR-21..23

## Problem

Demo 1 jobs view is a split dashboard with limited filters and columns. Demo 2 requires a
production-style jobs grid: rich filters, configurable columns, Excel export, SLA flags, and
navigation to job detail (stub until F3).

## Desired outcome

1. **Jobs list UI** — filter by account, facility, ops status, SLA flag, date ranges; default
   open jobs only; column chooser (localStorage); sort; CSV/Excel export; row link to job route.
2. **List API enrichment** — include `accountCode`, asset count buckets (WIP / Exception / Finished),
   `progressPercent`, `daysSinceStart` on each job row (aggregated server-side).

## Out of scope

- F3 job detail page (apto#53) — link targets `/jobs/:jobId` with placeholder until merged.
- F5 SLA dashboard slice.
- Server-side column reorder (client-only).

## UX

`ux-charter-first` on apto#52 — charter in `docs/ux/apto-52-f4-jobs-list-charter.md`.
