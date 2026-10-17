# apto#53 — F3 Job detail and edit (Mode B charter)

**Status:** Frozen for implement (2026-10-17)  
**OpenSpec:** `openspec/changes/apto-53-f3-job-detail` (FR-0301–FR-0317, BR-0301–BR-0308)  
**Plan SoT:** `docs/planning/Demo2-Plan.md` §F3  
**Design SoT:** [AIMS preview](https://apto-aims-preview.vercel.app) (`apto-inventory` / `apto2026`) · `docs/ux/Apto-AIMS.fig`  
**Tokens / shell:** repo root `DESIGN.md` (apto#42) — **no new palette**  
**Navigation context:** apto#49 F1 — Jobs & SLA sidebar; list baseline apto#52 F4  
**Legacy reference:** `JobsDashboard.tsx` split “Assets on job” panel (Demo 1) — **do not** keep list+detail on one route after F3; migrate behaviors to `/jobs/:jobId`.

**DESIGN_PREVIEW_REVIEWED:** 2026-10-17 — Preview **Jobs & SLA** row opens job drawer (`Job J-*`, account title, SLA strip, metadata grid, Assets + Add asset). Product ships **full page** at `ROUTES.jobDetail` (same visual rhythm as preview drawer + F2 account detail header pattern).

| Screenshot | Path |
|------------|------|
| Job detail surfaces (dark) | `docs/ux/screenshots/apto-53-f3-job-detail-dark.png` |
| Job detail surfaces (light) | `docs/ux/screenshots/apto-53-f3-job-detail-light.png` |

## Product intent

Operators need a **single job hub** after picking a row from F4, an account Jobs tab (F2), or inventory context: edit pickup metadata, read SLA and progress at a glance, manage the asset table, add one asset inline (Demo 1), and reach import / bulk / certificate / invoice flows without losing `jobId` context.

## Navigation & routes

| Item | Spec |
|------|------|
| Sidebar | **Jobs & SLA** (F1) — list stays on `/jobs` (F4) |
| Detail route | **`/jobs/:jobId`** — `jobPath(jobId)`; replace `JobDetailPlaceholder` |
| Page root | `data-testid="f3-job-detail-page"` inside `page-content` |
| Back link | **← Jobs** above title → `/jobs` (optional `location.state` to restore F4 filters — not required Demo 2) |
| Account link | Account name + code in header → `ROUTES.accountDetail(accountId)` |
| Asset row link | Each row → `ROUTES.inventoryAsset(assetId)` |
| Not found | Unknown id → `data-testid="f3-job-not-found"` panel (no throw) |

Do **not** ship preview-only blocks (Future · AI, Integrations mock nav, preview state radiogroup).

## Page layout

```
┌─ AppShell ─────────────────────────────────────────────────────────────────────┐
│ Sidebar │  ← Jobs                                                              │
│         │  Job {shortId} (muted)     [SLA pill]                                │
│         │  [Avatar] Account name (h1)   Code pill   Facility pill              │
│         │  Muted: Created {date} · {slaTotalDays}-day SLA · {daysRemaining}    │
│         │  [Import] [Bulk unserialized] [Certificate] [Service invoice]  (row) │
│         ├─ Progress KPI strip (.kpi-row, data-testid=f3-job-progress) ───────────┤
│         │  Total assets | WIP | Finished | Exceptions | Progress %             │
│         ├─ Edit job (.dashboard-panel, data-testid=f3-job-edit-form) ──────────┤
│         │  Account (searchable) · Facility · Ops status · Start · Due [Save]     │
│         ├─ Assets (.dashboard-panel) ──────────────────────────────────────────┤
│         │  [Add asset inline — data-testid=f3-add-asset-form]                    │
│         │  DataTable data-testid=f3-job-assets-table                             │
│         └────────────────────────────────────────────────────────────────────────┘
```

- **Max width:** `.aims-main` (~1200px), stacked panels like F2 account detail.
- **Load:** `GET /api/jobs/{id}` on mount; show skeleton or `aria-busy` on main until settled.
- **Save (edit form):** `PUT /api/jobs/{id}`; disable Save while in flight; success `role="status"` **Job saved**; 400 → inline field errors.

## Header (read-only summary)

Mirror preview drawer header + F4 SLA semantics:

| Element | Source / display |
|---------|------------------|
| Job id | Display `Job {id}` or truncated public id (match F4 Job ID column format) |
| Account | `AccountAvatar` + **link** to account detail; subtitle `Code {accountCode}` |
| Facility | Pill: `{facilityCode}` + optional expanded name when API provides it |
| Created | `createdAtUtc` formatted locale date (read-only) |
| SLA pill | `sla-pill--{slaStatus}` — on-track / at-risk / overdue (same classes as F4) |
| SLA line | **{daysRemaining}** copy (e.g. `3d overdue`, `Due today`, `12d left`) + optional muted `% of {slaTotalDays}-day SLA used` when preview-style helper exists |

`data-testid="f3-job-header"` on the header block (optional; page root testid is mandatory).

## Progress KPIs (`f3-job-progress`)

Horizontal **StatCard** row (4–5 cards), counts from job GET (FR-0301 / BR-0306–BR-0307):

| Card | Value |
|------|--------|
| **Total assets** | `wip + finished + exception` (or explicit `assetCount`) |
| **WIP** | `wipAssetCount` |
| **Finished** | `finishedAssetCount` |
| **Exceptions** | `exceptionAssetCount` |
| **Progress** | `{progressPercent}%` with optional thin progress bar (accent) |

When total is 0, progress shows **0%** and cards show **0** (no divide-by-zero). Use same number formatting as F4 list columns.

## Edit form (`f3-job-edit-form`)

Panel title **Job details** or **Edit job**. Two-column `.grid` on wide viewports; stack on narrow.

| Field | Control | Notes |
|-------|---------|--------|
| Account | Searchable select/combobox over accounts (name + code) | `accountId` |
| Facility | `<select>` active facilities (`GET /api/jobs/facilities` or reference data) | `facilityCode` |
| Ops status | `<select>` active `job-status` items sorted by `SortOrder` (BR-0301) | `opsStatus` |
| Start date | Date input (UTC date part) | `startDateUtc` |
| Due date | Date input; empty on save → API SLA default (BR-0303) | `dueDateUtc` |

**Actions:** Primary **Save** (`f3-job-save` optional); secondary **Revert** reloads last GET (recommended, matches F2).

**Validation (UI):** Due before start → block submit + message aligned with API `dueDateUtc cannot be before startDateUtc.` Invalid facility/ops → show API `error` string.

## Asset table (`f3-job-assets-table`)

`DataTable` inside `.dashboard-panel`; section title **Assets** with live count badge (preview pattern).

| Column | Notes |
|--------|--------|
| Apto ID | Monospace or emphasis; row link to inventory asset |
| Serial | `—` when empty |
| Part number | |
| Category | From FR-0308; `—` when null |
| Grade | |
| Status | Status pill if available |
| Location | `locationName` or equivalent |

**Empty state:** Icon + **No assets on this job yet** / *Add the first device as it's received.* (preview copy) — `EmptyState` component.

**Row interaction:** Entire row or Apto ID cell is `<Link>`; keyboard focusable.

## Add asset inline (`f3-add-asset-form`)

Demo 1 path only on this page (F6/F7 are separate entry points).

| Field | Required |
|-------|----------|
| Part number | Search existing + optional create-new (reuse JobsDashboard patterns) |
| Serial | Optional |

Primary **Add asset** → `POST /api/jobs/{jobId}/assets`; refresh table + progress KPIs on success.

### Confirmation (FR-0315 / BR-0305)

When ops status is **In Transit** or **Ops Complete** (code or name match), show modal before POST:

- Title: **Add asset to this job?**
- Body: Explain job is in transit or ops-complete; confirm intent.
- **Cancel** (default focus) / **Add anyway** (destructive or primary per `DESIGN.md`).

Other statuses (including **Ops Complete with Exceptions**) → no dialog.

## Forward action buttons (stubs — FR-0316 / FR-0317)

Toolbar under header (secondary buttons or button group); all keyboard-focusable with visible labels:

| Action | Label (user-facing) | `data-testid` | Behavior until slice ships |
|--------|---------------------|---------------|----------------------------|
| F6 | **Import from spreadsheet** | `f3-action-import` | Navigate to placeholder route or modal: *Spreadsheet import (F6) — coming soon*; preserve `jobId` in query `?jobId=` |
| F7 | **Bulk unserialized** | `f3-action-bulk` | Placeholder; `jobId` in query/state |
| F10 | **Generate certificate** | `f3-action-certificate` | Placeholder; no certificate API calls |
| F11 | **Create service invoice** | `f3-action-invoice` | Placeholder; no invoice API calls |

Stubs MUST NOT call unfinished F10/F11 APIs.

## SLA & theming

- Reuse F4 row tint / pill tokens (`sla-pill--*`, `days-left--overdue`).
- Light + dark via `data-theme` — screenshots above are baseline.

## `data-testid` summary

| Hook | Surface |
|------|---------|
| `f3-job-detail-page` | Page root |
| `f3-job-not-found` | 404 state |
| `f3-job-progress` | KPI strip |
| `f3-job-edit-form` | Edit panel |
| `f3-job-assets-table` | Asset table wrapper |
| `f3-add-asset-form` | Inline add form |
| `f3-action-import` | F6 stub |
| `f3-action-bulk` | F7 stub |
| `f3-action-certificate` | F10 stub |
| `f3-action-invoice` | F11 stub |

## Screen checklist (Hephaestus)

- [ ] `/jobs/:jobId` deep link + refresh; placeholder removed
- [ ] Header + account link + SLA summary from GET
- [ ] Progress KPIs match API buckets
- [ ] Edit form PUT + validation messages
- [ ] Asset table columns + inventory links
- [ ] Add asset + In Transit / Ops Complete confirm
- [ ] Four forward-action stubs with `jobId` context
- [ ] Not-found state for bad id
- [ ] Light + dark; preview-reviewed spacing

## Out of scope (this ticket)

- Job change history, auto ops transitions, client-reference fields (Demo2-Plan §F3)
- F6 wizard, F7 bulk loop, F10 print, F11 invoice product logic
- Moving job **create** off F4 list (create may stay on list)
- Preview drawer on list page (F3 is dedicated route)

## BA traceability (UX-facing)

| Requirement | UX surface |
|---------------|------------|
| FR-0309–FR-0310 | Route, page testid, header |
| FR-0311 | Edit form + Save |
| FR-0312 | Progress panel |
| FR-0313 | Asset table + links |
| FR-0314–FR-0315 | Add asset + confirm |
| FR-0316–FR-0317 | Action stubs |
| NFR-0302 | Not-found panel |

UX_CHARTER_READY
