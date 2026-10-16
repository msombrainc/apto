# apto#48 — F8 Warehouse scan (Mode B charter)

**Status:** Frozen for implement (2026-10-15)  
**OpenSpec:** `openspec/changes/apto-48-f8-quick-scan`  
**Design SoT:** `docs/ux/Apto-AIMS.fig` · [AIMS preview](https://apto-aims-preview.vercel.app) (password `apto2026`)  
**Tokens / shell:** repo root `DESIGN.md` (apto#42) — **no new palette**; scanner-first Operations layout only.

## Product intent

Warehouse operators apply **grade**, **status**, and **location** to many assets per shift using a
barcode wedge or keyboard. They need a **single Operations screen** that: picks a reusable preset,
scans an Apto ID or serial, sees pass/fail within one second, reviews a session log, and can undo
the last successful apply. The flow must feel like the rest of AIMS (same shell, panels, table,
buttons) — not a separate kiosk skin.

Supervisors may mark a preset **global** so every operator on the same browser profile sees it
(Demo 2: any demo login user; production RBAC deferred).

## Navigation & route

| Item | Spec |
|------|------|
| Sidebar group | **Operations** (existing `sidebar-nav`, `aria-label="Operations"`) |
| Nav item | **Warehouse scan** — fourth Operations item after Inventory |
| Active state | Same `sidebar-nav-btn` / `is-active` / dot pattern as Accounts, Jobs, Inventory |
| View key | Extend `AppView`: `scan` (deep link `/operations/scan` when routing lands in apto#48) |
| Page root | `data-testid="f8-scan-page"` on outer page content wrapper (inside `page-content`) |
| Page title | `Warehouse scan` |
| Subtitle | `Scan Apto IDs or serials to apply grade, status, and location presets with instant feedback.` |

Do **not** ship preview-only blocks (Future · AI, Integrations mock nav, preview state radiogroup).

## Screen layout (scanner-first)

```
┌─ AppShell ─────────────────────────────────────────────────────────────┐
│ Sidebar │  Warehouse scan                                              │
│  Ops…   │  Subtitle (muted)                                            │
│   · Scan│  ┌─ Preset card (.dashboard-panel) ─────────────────────────┐ │
│         │  │ Preset [▼ f8-scan-preset-select]  [Edit preset ▼]         │ │
│         │  │ ☐ Global preset (f8-scan-preset-global) — when editing    │ │
│         │  │ (f8-scan-preset-editor — expand/collapse or side panel) │ │
│         │  └──────────────────────────────────────────────────────────┘ │
│         │  ┌─ Scan card (.dashboard-panel) ───────────────────────────┐ │
│         │  │ [ Scan code…………………………… ]  (f8-scan-code-input, autofocus) │ │
│         │  │ [Undo last scan] (f8-scan-undo, secondary, disabled if ∅)│ │
│         │  │ ┌ result banner (success | failure) ─────────────────────┐ │ │
│         │  │ │ f8-scan-result-success  OR  f8-scan-result-failure     │ │ │
│         │  │ └──────────────────────────────────────────────────────┘ │ │
│         │  │ (Ask strip: grade/status/location selects when preset    │ │
│         │  │  mode = ask — visible only for current pending scan)     │ │
│         │  └──────────────────────────────────────────────────────────┘ │
│         │  ┌─ Session log (.dashboard-panel) ─────────────────────────┐ │
│         │  │ data-testid="f8-scan-session-log" (DataTable)            │ │
│         │  │ Time │ Code │ Apto ID │ Fields changed │ Result           │ │
│         │  └──────────────────────────────────────────────────────────┘ │
└─────────┴──────────────────────────────────────────────────────────────┘
```

- **Max content width:** inherit `.aims-main` (~1200px); scan card may use slightly wider input (min-height 3rem) for gun-friendly target.
- **Vertical rhythm:** `.dashboard-stack` gap `1rem` between preset, scan, and log panels.
- **Header actions:** none required in page header for Demo 2 (no Refresh KPI row). Optional **Clear log** (`aims-btn--ghost`) clears UI session only (BR-1407); not blocking for factory.
- **Focus:** on mount and after each completed scan (success or failure), return focus to `f8-scan-code-input` so wedge Enter chains scans.

## Preset picker & editor

Presets persist in `localStorage` key `apto.f8Scan.presets.v1` (ASSUMPTION-482). Shape:
`{ id, name, isGlobal, fields: { grade?, status?, locationId?, gradeMode?, statusMode?, locationMode? }, createdBy }`
where each `*Mode` is `fixed` | `ask` (BR-1406). Demo 2 applies **grade**, **status**, **location** only (not part number).

| Control | `data-testid` | Behavior |
|---------|---------------|----------|
| Preset select | `f8-scan-preset-select` | Lists user presets + global presets for this browser profile; default to last selected or first preset |
| Preset editor | `f8-scan-preset-editor` | Create/rename preset; per-field **Fixed** (dropdown from reference data) or **Ask each scan**; save updates localStorage |
| Global toggle | `f8-scan-preset-global` | Checkbox in editor; sets `isGlobal: true` on save (ASSUMPTION-484) |

Reference options for fixed fields:

| Field | Source |
|-------|--------|
| Grade | Active `ReferenceItem` where `type = grade` |
| Status | Active `ReferenceItem` where `type = asset-status` |
| Location | Active `ReferenceItem` where `type = location`, filtered by **asset job facility** after lookup (see ask flow) |

**Seed presets (recommended):** on first visit, if storage empty, create one demo preset e.g. “Audit intake” with fixed status **In Audit** and grade **ask** — optional, not blocking acceptance.

## Scan loop

1. Operator selects preset (or uses default).
2. Operator scans/types code into `f8-scan-code-input` and presses **Enter** (or explicit Submit if added — Enter is primary).
3. Client `GET /api/assets/lookup?code={trimmed}` (FR-1406, ASSUMPTION-485).
4. **404 / 409:** show `f8-scan-result-failure` with API `error` text; append failure row to session log; **no PUT** (BR-1402); play failure audio (ASSUMPTION-483).
5. **200:** if preset has `ask` fields, show ask strip with required selects (location options scoped to `facilityCode` from lookup response); operator confirms apply (Enter on last field or **Apply** button `data-testid="f8-scan-apply-ask"` recommended).
6. Client `PUT /api/assets/{id}` with resolved grade/status/locationId (FR-1410); capture **previous** values for undo (ASSUMPTION-486).
7. **200:** show `f8-scan-result-success` with summary line: `{aptoId}` · `{entityLabel}` — fields updated; append success row to session log; play success audio; enable `f8-scan-undo`.
8. Target **≤ 1 s** from submit to visible result banner on seeded CI data (FR-1417, NFR-1402).

While lookup or PUT in flight: disable code input, show `aria-busy` on scan card, optional inline “Applying…” (`role="status"`).

## Result banners

Distinct panels inside scan card (not page-level `AlertBanner` for per-scan outcomes).

| Outcome | `data-testid` | Visual |
|---------|---------------|--------|
| Success | `f8-scan-result-success` | Green tint (reuse on-track / `.status-pill--active` family); icon check; message includes `aptoId`, serial if present, and comma-separated fields changed |
| Failure | `f8-scan-result-failure` | Red/error tint (reuse SLA overdue family at lower emphasis); icon alert; message is API error or validation text |

Banners replace previous scan result (only one visible at a time). Auto-clear optional after 3s on success — **not required**; new scan replaces banner.

**Audio (ASSUMPTION-483):** Web Audio beep — success 880 Hz 80 ms, failure 220 Hz 120 ms when `AudioContext` allowed; visual-only OK when blocked.

## Session log

`DataTable` (or equivalent) with `data-testid="f8-scan-session-log"`.

| Column | Content |
|--------|---------|
| **Time** | Local short time of submit |
| **Code** | Scanned code as entered |
| **Apto ID** | From lookup or `—` on failure |
| **Fields changed** | e.g. `grade: A → B, status: — → In Audit` or `—` on failure |
| **Result** | `Success` / `Not found` / `Ambiguous (n)` / validation error shorthand |

Append-only for session (BR-1407). Clearing UI log does not delete server change history.

## Undo

| Control | `data-testid` | Behavior |
|---------|---------------|----------|
| Undo last scan | `f8-scan-undo` | Enabled only after last operation was **successful** apply; disabled after undo consumed or after failure |

Undo calls `PUT /api/assets/{id}` with grade/status/location captured **before** that apply (ASSUMPTION-486, max depth 1). On success: append log row “Undo · restored …”, disable undo until next success, refocus code input. Target restore visible within **2 s** (acceptance.feature).

## Tokens & components (implement map)

| Concern | Use |
|---------|-----|
| Shell | `AppShell` + fourth Operations nav item |
| Panels | `.dashboard-panel`, `.dashboard-stack` |
| Table | `DataTable` for session log |
| Inputs | Large text input for code; native `<select>` for preset and reference fields |
| Buttons | `AimsButton` — Undo (`aims-btn--secondary`); editor Save (`aims-btn--primary`) |
| Errors | `AlertBanner` only for **page-level** failures (e.g. cannot load reference lists) |

**Accent:** `--aims-accent` sparingly — active preset name or success border only.

## Accessibility

- Code input: `aria-label="Scan code"`; `autocomplete="off"`.
- Result banners: `role="status"` + `aria-live="polite"` on success/failure container.
- Preset select: visible label “Preset”.
- Global checkbox: associated `<label>` text “Share preset with all users on this device”.
- Session log: `<th scope="col">`; Result column not color-only (text Success/Failed).
- Undo: accessible name `Undo last successful scan`.

## data-testid contract (factory / BA)

| id | Element |
|----|---------|
| `f8-scan-page` | Page root |
| `f8-scan-preset-select` | Preset dropdown |
| `f8-scan-preset-editor` | Preset builder region |
| `f8-scan-preset-global` | Global preset checkbox |
| `f8-scan-code-input` | Scan code field |
| `f8-scan-result-success` | Success banner |
| `f8-scan-result-failure` | Failure banner |
| `f8-scan-session-log` | Session log table wrapper |
| `f8-scan-undo` | Undo last successful scan |

Recommended (not blocking): `f8-scan-apply-ask`, `f8-scan-clear-log`.

## Cross-surface consistency

- **Inventory / Jobs asset detail:** after apto#48, list and detail surfaces show `aptoId`, `grade`, `status`, `locationName` when present (FR-1412); use same reference labels as scan presets.
- **F1 global search (future):** consumes `GET /api/assets/lookup` response shape (FR-1421) — do not break field names.

## Screen checklist (Hephaestus)

- [ ] Operations → Warehouse scan in sidebar; title + subtitle
- [ ] Presets in `localStorage`; picker + editor + global flag
- [ ] Scan loop: lookup → optional ask → PUT; no PUT on 404/409
- [ ] Success/failure banners + audio within 1 s on seeded data
- [ ] Session log columns; append success and failure rows
- [ ] Undo restores previous grade/status/location once
- [ ] Light + dark themes via existing `data-theme` variables
- [ ] Page `data-testid="f8-scan-page"` and required contract ids

## Out of scope (this ticket)

- F9 inventory browse v2, cart/pallet, damages on scan, image capture (Demo2-Plan §F8).
- Server-side preset API, RBAC for global presets, mobile native RF app.
- Part-number change during scan.
- New Figma frames required — visual reference: **Inventory** table density + **Reference Data** filter/select styling.

## Implement notes

- Single page component `QuickScanPage.tsx` (or `WarehouseScanPage.tsx`) colocated under `components/aims/`.
- Extend `App.tsx` view switch + `initialView()` path `/operations/scan` mirror reference-data pattern.
- API client: `lookupAssetByCode`, extend `updateAsset` for grade/status/locationId; load reference lists via existing apto#46 helpers.
- Undo stack: in-memory React state + previous values from lookup response before PUT.
