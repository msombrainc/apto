# apto#50 — F14 Part Number management (Mode B charter)

**Status:** Frozen for implement (2026-10-16)  
**OpenSpec:** `openspec/changes/apto-50-f14-part-numbers` (Hephaestus)  
**BA:** Hermes handoff on msombrainc/apto#50 (FR-F14-*, AC-F14-*)  
**Design SoT:** [AIMS preview](https://apto-aims-preview.vercel.app) (`apto-inventory` / `apto2026`) · `docs/ux/Apto-AIMS.fig`  
**Tokens / shell:** repo root `DESIGN.md` (apto#42) — **no new palette**  
**Visual pattern:** `ReferenceDataAdmin.tsx` + apto#46 charter (list card, filter bar, paging, modals)  
**Navigation context:** apto#49 F1 — Admin sidebar group, module map, deep links

**DESIGN_PREVIEW_REVIEWED:** 2026-10-16 — signed into preview (dark + light theme control). Preview SPA does **not** yet render `/admin/part-numbers` or `/admin/reference-data` (both fall back to Accounts). Until F14 frames ship on preview (apto#72), treat **Reference Data admin** (product) and **Accounts list** density on preview as table/filter rhythm reference; do not invent a separate “catalog console” layout.

## Product intent

Catalog admins need a **single Admin screen** to maintain the part number master: search and page a large list, see how many assets use each number, add or edit number + category, and delete safely — including **mandatory replacement** when assets are assigned. The experience must feel like Reference Data admin (same shell, panels, buttons, table, modals), using client terminology **Part Number**, **Category**, and **Assets** (not “SKU” or internal ids in copy).

## Navigation & route

| Item | Spec |
|------|------|
| Sidebar group | **Admin** (`sidebar-nav--admin`, `aria-label="Administration"`) — existing from F1 |
| Nav item | **Part Numbers** — third Admin item, below **Reference Data** and **QuickBooks Sync** |
| Active state | Same `sidebar-nav-btn` / `is-active` / dot pattern as other Admin items |
| View key | Extend `AppView`: `part-numbers` |
| Deep link | **`/admin/part-numbers`** (stable; register in `ROUTES` + React Router) |
| Module map | `part-numbers` entry → `availability: "d2"`, `path: ROUTES.partNumbers`; remove `future` / Demo 2 phase-only tag when shipped |
| Page root | `data-testid="part-numbers-page"` on outer content wrapper inside `page-content` |
| Page title (shell) | `Part numbers` |
| Subtitle | `Search, add, and maintain part numbers and categories used on assets.` |

Do **not** ship preview-only blocks (Future · AI, Integrations mock nav, preview state radiogroup).

## Screen layout

```
┌─ AppShell ─────────────────────────────────────────────────────────────┐
│ Sidebar │  Part numbers              [Refresh] [Add part number]      │
│  Ops…   │  Subtitle (muted)                                            │
│  Admin  │  ┌─ List card (.dashboard-panel) ──────────────────────────┐ │
│   · Ref │  │ [Search part number…………]   Showing 1–50 of N            │ │
│   · QBO │  │ ┌ data table ──────────────────────────────────────────┐ │ │
│   · PN  │  │ │ Part number │ Category │ Assets │ Actions            │ │ │
│         │  │ └──────────────────────────────────────────────────────┘ │ │
│         │  │ [Previous]  Page 1 of M  [Next]                           │ │
│         │  └──────────────────────────────────────────────────────────┘ │
└─────────┴──────────────────────────────────────────────────────────────┘
```

- **Max content width:** inherit `.aims-main` (~1200px).
- **Vertical rhythm:** one `.dashboard-panel` list card (no type-selector card — unlike Reference Data).
- **Header actions:** move into page body top (match Reference Data): `.dashboard-actions` with **Refresh** (`aims-btn--secondary` + refresh icon) and **Add part number** (`aims-btn--primary` + plus icon). Disabled while loading.
- **No KPI stat row.**

## List behaviors

| Behavior | Rule |
|----------|------|
| Search | Debounce **300ms**; maps to `q`; **part number substring only** (case-insensitive) — not category name (BA OQ-501 default). Placeholder: `Search part number`. `data-testid="pn-admin-search"`. Changing search resets **page 1**. |
| Paging | Server-driven; default `pageSize` **50**; footer **Previous** / **Next** + `Page N of M`; meta `Showing {from}–{to} of {total}` in `.filter-bar__meta` with `aria-live="polite"`. |
| Sort | Sortable headers: **Part number** (`number`, default asc), **Category** (`categoryName`), **Assets** (`assetCount`). Click toggles asc/desc; use `.th-sort` + `aria-sort` like Reference Data. Tie-break on equal `assetCount`: secondary sort by `number` asc (server). |
| Loading | `DataTable` loading row + `role="status"`. |
| Empty | `EmptyState` — title `No part numbers`, body `Add a part number or adjust search.` |
| Errors | `AlertBanner` above stack; failed save keeps modal open with inline field error. |
| Refresh | Reloads current query params without full app reload (AC-F14-10). |

### Columns

| Column | id | Display | Notes |
|--------|-----|---------|--------|
| Part number | `number` | Plain text; optional `<code class="code-pill">` if it aids scan (match Reference Data **Code** styling — pick one and stay consistent) | Sortable |
| Category | `categoryName` | Name or em dash `—` when null | Sortable |
| Assets | `assetCount` | Right-aligned numeral; **`0` shown as `0`** | Sortable; header label **Assets** (BA FR-F14-02) |
| Actions | `actions` | Edit · Delete | Non-row-click table (actions column, like Reference Data) |

**Inactive category on row:** If API returns a category name for a PN tied to an inactive category, still display the name in the table; add/edit picker shows **active categories only** (AC-F14-09).

### Row actions

| Action | UX |
|--------|-----|
| **Edit** | Opens add/edit modal prefilled. `data-testid="pn-admin-edit-{id}"` optional per row. |
| **Delete** | Always visible as text button **Delete** (`btn-link--danger`). Opens **delete modal** (see below). |

Do **not** hide Delete when assets > 0 — deletion is allowed with replacement (unlike Reference Data hard-delete when in use).

## Add / Edit modal

Reuse `Modal` + form grid (`.grid`, 2 columns on ≥768px).

| Field | Control | Validation (UI) |
|-------|---------|-----------------|
| Part number | Required text input, `maxLength={100}`, trim on submit | Empty after trim → inline error; 409 duplicate → field-level message from API |
| Category | `<select>`: first option **None** (null `categoryId`), then active categories from `listCategories` (same as F13) | Unknown/inactive id blocked by picker |

**Modal title:** `Add part number` / `Edit part number`  
**Primary:** Save (`aims-btn--primary`, `data-testid="pn-admin-form-save"`)  
**Secondary:** Cancel (`aims-btn--ghost`)

On success: close modal, refresh list, polite live region e.g. `Saved part number {number}`.

## Delete modal

Use `Modal` (not `window.confirm` alone — confirm copy inside modal).

### When Assets = 0

- Title: `Delete part number?`
- Body: `Delete **{number}**? This cannot be undone.`
- Actions: **Cancel** (ghost) · **Delete** (danger primary or danger secondary — match existing delete confirm pattern in Reference Data)
- On success: close, refresh list

### When Assets > 0 (FR-44)

- Title: `Delete part number and reassign assets?`
- Body (required):
  - `**{number}** is used by **{assetCount}** asset(s). Choose a replacement part number. All affected assets will be updated and logged.`
- Field: **Replacement part number** — searchable control:
  - Typeahead or combobox fed by `GET /api/part-numbers?q=` (paged search OK); **exclude current row id**
  - Show selected replacement as `number` (+ optional category muted)
  - `data-testid="pn-admin-delete-replacement"`
- **Delete** disabled until a valid replacement is selected (different id)
- API 400 (missing replacement, self-replacement) → inline error on replacement field + keep modal open

`data-testid="pn-admin-delete-confirm"` on confirm Delete button.

## Tokens & components (implement map)

| Concern | Use |
|---------|-----|
| Shell | `AppShell` + extend `ADMIN_NAV` and `App.tsx` route |
| Page component | `PartNumbersAdmin.tsx` colocated with `ReferenceDataAdmin.tsx` |
| Table | `DataTable` |
| Panels | `.dashboard-panel`, `.dashboard-stack` |
| Filters | `.filter-bar`, `.filter-bar__search`, `.filter-bar__meta` |
| Buttons | `AimsButton`, `btn-link`, `btn-link--danger` |
| Forms | Existing `label`, `input`, `select` tokens |
| Modal | `Modal` |
| Icons | `IconRefresh`, `IconPlus` |
| API client | Extend `apps/web/src/api.ts` for list/create/update/delete with paging query params |

**Accent:** `--aims-accent` for focus rings and active nav only — destructive delete uses danger link + modal confirm, not accent fill.

## Accessibility

- Search input: visible `<label>` or `aria-label="Search part numbers"`.
- Sortable headers: `<button type="button">` in `<th>` with `aria-sort`.
- Delete modal: focus trap + Escape; announce asset count in body text (not icon-only).
- Replacement picker: combobox/listbox pattern with accessible name `Replacement part number`.
- Live region on list load: `aria-live="polite"` on filter meta (same as Reference Data).

## data-testid contract (factory / E2E)

| id | Element |
|----|---------|
| `part-numbers-page` | Page wrapper |
| `pn-admin-search` | Search input |
| `pn-admin-paging-next` | Next page |
| `pn-admin-paging-prev` | Previous page |
| `pn-admin-form-save` | Save in add/edit modal |
| `pn-admin-delete-replacement` | Replacement picker in delete modal |
| `pn-admin-delete-confirm` | Confirm delete in delete modal |

## Screen checklist (Hephaestus)

- [ ] Admin → Part Numbers in sidebar; module map **(D2)** link works
- [ ] `/admin/part-numbers` deep link + refresh
- [ ] Search (debounced), sort on three columns, paging footer wired to API
- [ ] Add / edit modal: number + category (None + active categories)
- [ ] Delete with 0 assets: simple confirm
- [ ] Delete with assets: replacement required, count shown, confirm disabled until valid replacement
- [ ] 409 duplicate and 400 validation surface in UI
- [ ] Light + dark via existing `data-theme`
- [ ] All `data-testid` hooks above

## Out of scope (this ticket)

- Weight, manufacturer, extended attributes, AI validation (FR-43 full), duplicate manufacturer (FR-46)
- Part number **change log** UI (FR-45) — server writes asset logs on bulk reassignment only
- Part Number Translation (Phase 4), Manufacturers (Phase 3)
- Role-based hiding of actions (Demo 2)
- Preview-only nav blocks

## Implement notes

- Mirror **Reference Data list card** structure (single panel) rather than Accounts KPI layout.
- Replacement search can reuse the same list endpoint the table uses; cap picker results (e.g. 20) with `q` as user types.
- Keep **Part Number** capitalization in all user-visible strings (Demo2-Plan terminology).
- After F14 ships, add preview frame at `/admin/part-numbers` for Mode A polish parity (apto#72).

## BA traceability (UX-facing)

| BA ID | UX surface |
|-------|------------|
| FR-F14-UI-01 | Layout, search, sort, paging footer |
| FR-F14-UI-02 | Edit/Delete row actions, delete modal branches |
| FR-F14-UI-03 | Add/edit modal fields |
| FR-F14-UI-04 | AlertBanner + inline errors |
| FR-F14-UI-05 | Sidebar + module map + route |
| FR-F14-UI-06 | Tokens + Reference Data density |
| AC-F14-01 … AC-F14-10 | Covered by behaviors above |

UX_CHARTER_READY
