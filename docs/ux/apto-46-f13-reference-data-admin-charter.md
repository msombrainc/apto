# apto#46 — F13 Reference Data admin (Mode B charter)

**Status:** Frozen for implement (2026-10-15)  
**OpenSpec:** `openspec/changes/apto-46-f13-reference-data-admin`  
**Design SoT:** `docs/ux/Apto-AIMS.fig` · [AIMS preview](https://apto-aims-preview.vercel.app) (password `apto2026`)  
**Tokens / shell:** repo root `DESIGN.md` (apto#42) — **no new palette**; extend layout only.

## Product intent

Give demo admins **one configurable list + edit experience** for every dropdown list Demo 2 depends on (facilities through categories). Operators should recognize the same AIMS shell as Accounts/Jobs/Inventory: sidebar, page title, filter bar, data table, primary actions top-right, modal forms.

## Navigation & route

| Item | Spec |
|------|------|
| Sidebar group | **Admin** (new section below Operations nav, label `Admin`, `aria-label="Administration"`) |
| Nav item | **Reference Data** — only Admin item in this slice |
| Active state | Same `sidebar-nav-btn` / `is-active` / dot pattern as Operations |
| View key | Extend app view or route: `reference-data` (deep link `/admin/reference-data` when routing lands in apto#46) |
| Page title | `Reference data` |
| Subtitle | `Maintain facilities, locations, statuses, grades, damages, and categories used across AIMS.` |

Do **not** ship preview-only blocks (Future · AI, Integrations, preview state radiogroup, mock nav counts).

## Screen layout (single page, type-driven)

```
┌─ AppShell ─────────────────────────────────────────────────────────────┐
│ Sidebar │  Reference data                    [Refresh] [Add entry]   │
│  Ops…   │  Subtitle (muted)                                              │
│  Admin  │  ┌─ Type card (.dashboard-panel) ─────────────────────────┐ │
│   · Ref │  │ List type [select ▼]  [Facility ▼] (locations only)     │ │
│         │  │ ☐ Show inactive (admin)                                   │ │
│         │  └──────────────────────────────────────────────────────────┘ │
│         │  ┌─ List card (.dashboard-panel) ────────────────────────────┐ │
│         │  │ [Search……………………]     Showing 1–50 of 127                  │ │
│         │  │ ┌ data table ──────────────────────────────────────────┐ │ │
│         │  │ │ Code │ Name │ …type cols… │ In use │ Status │ Actions │ │ │
│         │  │ └──────────────────────────────────────────────────────┘ │ │
│         │  │ [Previous]  Page 1 of 3  [Next]                         │ │
│         │  └──────────────────────────────────────────────────────────┘ │
└─────────┴──────────────────────────────────────────────────────────────┘
```

- **Max content width:** inherit `.aims-main` (~1200px).
- **Vertical rhythm:** `.dashboard-stack` gap `1rem` between type card and list card.
- **Header actions:** `.dashboard-actions` — **Refresh** (`aims-btn--secondary` + refresh icon), **Add entry** (`aims-btn--primary` + plus icon). Disabled while loading.
- **No KPI stat row** on this screen (unlike Accounts).

## List type selector

Native `<select>` styled with existing `input`/`select` tokens.

| UI label | API `type` or mode | Notes |
|----------|-------------------|--------|
| Facilities | `facility` | |
| Locations | `location` | Requires **Facility** filter (active facilities only) |
| Job (Ops) statuses | `job-status` | |
| Asset statuses | `asset-status` | Extra columns: Group, Certificate group |
| Grades | `grade` | |
| Damages | `damage` | |
| Categories | `categories` | Uses `/api/categories` (not `/api/reference/{type}`) |

`data-testid="ref-admin-type-select"` on the type `<select>`.

## Shared list behaviors

| Behavior | Rule |
|----------|------|
| Search | Debounce 300ms; maps to `q`; `data-testid="ref-admin-search"` on search input; placeholder `Search code or name` |
| Paging | Server-driven `page` / `pageSize` (default 50); footer **Previous** / **Next** + `Page N of M`; meta `Showing {from}–{to} of {total}` in `.filter-bar__meta` |
| Sort | Clickable column headers for **Code**, **Name**, **Sort order** (default API order: `sortOrder` asc, then `name` asc per BR-1306) |
| Include inactive | Checkbox `Show inactive` → `includeInactive=true`; `data-testid="ref-admin-include-inactive"` |
| Loading | `DataTable` loading row + `role="status"` |
| Empty | `EmptyState` — title `No entries`, body `Add an entry or adjust search.` |
| Errors | `AlertBanner` above stack; failed save keeps modal open with inline field errors |

### Columns (common)

| Column | All reference types | Categories only |
|--------|---------------------|-----------------|
| Code | ✓ (column id `code`) | — (use **Name** as primary) |
| Name | ✓ | ✓ |
| Sort order | ✓ | — (unless API adds later; hide for categories) |
| In use | ✓ `inUseCount` — right-aligned numeral; `0` shown as `0` | **Part numbers** (`partNumberCount`) |
| Status | Pill: **Active** (green-tint like on-track) / **Inactive** (muted border pill) | Same |
| Actions | Row actions (see below) | Same |

**Locations:** add **Facility** column (parent facility code or name).

**Asset statuses:** add **Group** (`WIP` | `Finished` | `Exception`), **Certificate** (optional text or `—`).

### Row actions

| Action | When | UX |
|--------|------|-----|
| Edit | Always | Opens modal; `data-testid="ref-admin-edit-{id}"` optional per row |
| Deactivate / Reactivate | Toggle by `isActive` | `data-testid="ref-admin-toggle-active"` on the toggle control (button or switch) |
| Delete | `inUseCount === 0` only | Text button **Delete**; confirm dialog `Delete {code}? This cannot be undone.` |
| Delete blocked | `inUseCount ≥ 1` | Hide delete OR disabled with tooltip `In use by {n} record(s). Deactivate instead.` |

Deactivate when in use must **not** hard-delete (BR-1308, FR-1309).

## Add / Edit modal

Reuse `Modal` + form grid (`.grid`, 2 columns on ≥768px).

**Modal title:** `Add {type label}` / `Edit {code}`  
**Primary:** Save (`aims-btn--primary`)  
**Secondary:** Cancel (`aims-btn--ghost`)

### Fields by type

| Field | facility, job-status, grade, damage | location | asset-status | category |
|-------|--------------------------------------|----------|--------------|----------|
| Code | Required, max 32, monospace in table | Required | Required | — |
| Name | Required, max 128 | Required | Required | Required (rename) |
| Sort order | Required number ≥ 0 | Required | Required | Hidden |
| Facility | — | Required `<select>` of active facilities | — | — |
| Group | — | — | Required select: WIP, Finished, Exception | — |
| Certificate group | — | — | Optional select: Recycled, Wiped, Shredded, or empty | — |

Validation errors: show API `error` under field + `AlertBanner` for generic failures.

`data-testid="ref-admin-form-save"` on Save (optional, for E2E).

## Tokens & components (implement map)

| Concern | Use |
|---------|-----|
| Shell | `AppShell` + extend nav for Admin |
| Table | `DataTable` (non-row-click for this screen — actions column instead of chevron) |
| Panels | `.dashboard-panel`, `.dashboard-stack` |
| Filters | `.filter-bar`, `.filter-bar__search`, `.filter-bar__meta` |
| Buttons | `AimsButton` variants |
| Status pills | New classes `.status-pill--active` / `.status-pill--inactive` — mirror `.sla-pill` sizing; active uses `--sla-pill-on-track-*`, inactive uses `--aims-text-muted` + border |
| Forms | Existing `label`, `input`, `select` tokens from `styles.css` |
| Modal | `Modal` |
| Icons | Existing aims icons: refresh, plus, alert as needed |

**Accent:** `--aims-accent` for active nav dot and focus rings only — not for destructive actions (use default button + confirm for delete).

## Accessibility

- Type select: `<label>` visible “List type”.
- Location facility filter: labeled “Facility”; required before list fetch.
- Sortable headers: `<button type="button">` in `<th>` with `aria-sort`.
- Toggle active: `aria-pressed` on button or switch with accessible name `Activate {code}` / `Deactivate {code}`.
- Modal: existing focus trap + Escape (already in `Modal`).
- Live region: announce “Loaded N entries” on refresh completion (`aria-live="polite"` on filter meta).

## data-testid contract (factory / BA)

| id | Element |
|----|---------|
| `ref-admin-type-select` | List type dropdown |
| `ref-admin-search` | Search input |
| `ref-admin-include-inactive` | Show inactive checkbox |
| `ref-admin-facility-filter` | Facility dropdown (locations only) |
| `ref-admin-toggle-active` | Deactivate/reactivate control (per row or shared pattern) |
| `ref-admin-paging-next` | Next page (recommended for E2E) |
| `ref-admin-paging-prev` | Previous page |

## Screen checklist (Hephaestus)

- [ ] Admin → Reference Data in sidebar; page title + subtitle
- [ ] Type selector switches columns, API base, and location facility filter
- [ ] Search, paging, sort, include-inactive wired to API query params
- [ ] List shows `inUseCount` / `partNumberCount` and Active/Inactive pills
- [ ] Add/Edit modal with type-specific fields (incl. asset group + certificate)
- [ ] Deactivate/reactivate + delete-only-when-zero with confirm
- [ ] Categories path uses category endpoints with same visual shell
- [ ] Light + dark themes via existing `data-theme` variables
- [ ] All `data-testid` hooks above on stable elements

## Out of scope (this ticket)

- Part Numbers admin (F14), module map drawer (F1), role matrix, damage–category rules (FR-81a), prototype banners.
- New Figma frames required — align with **Accounts list** density in preview / `.fig` when Reference Data frames are added later; until then treat Accounts table + `dashboard-panel` as visual reference.

## Implement notes

- Prefer **one** React page component configured by type metadata (columns + form fields + API adapter) per BA “generic list/edit”.
- Keep facility codes uppercase in display; validation stays server-side.
- After seed deploy, list should show GA/TX/CA for Facilities without extra styling.
