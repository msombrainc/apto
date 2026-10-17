# apto#52 — F4 Jobs list v2 (Mode B charter)

**Status:** Frozen for implement (2026-10-17)  
**OpenSpec:** `openspec/changes/apto-52-f4-jobs-list-v2`  
**Plan SoT:** Demo2-Plan §F4 · shell apto#49

## Layout

- **Route:** `/jobs` — primary Operations landing (existing F1 nav).
- **Header:** title “Jobs”, Refresh, New job (secondary), Export (secondary).
- **Filter bar:** Account select, Facility pills, Ops status select, SLA flag select, date
  range inputs (created / start / due), toggle “Open jobs only” (default on), Clear filters.
- **KPI strip:** matching count + on-track / at-risk / overdue (filtered set).
- **Table:** `DataTable` with configurable columns per FR-0404; SLA row tint classes unchanged.
- **Row click / Job ID link:** navigate to `/jobs/:jobId` (placeholder detail until F3).

## Columns (default visible)

Job ID, Account, Account Code, Facility, Ops Status, Days since start, SLA days remaining,
SLA flag, WIP assets, Exceptions, Finished, Progress %.

## Tokens

Reuse `DESIGN.md` / F1 shell — no new palette.

UX_CHARTER_READY
