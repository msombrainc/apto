# apto#99 — Global UI pass vs design preview (Mode B charter)

**Status:** Frozen for implement (2026-10-17)  
**Tracker:** msombrainc/apto#99  
**Design SoT:** [AIMS preview](https://apto-aims-preview.vercel.app) (`apto-inventory` / `apto2026`)  
**Tokens / shell:** repo root `DESIGN.md` (apto#42) — **no new palette**; fix contrast, control chrome, and density only  
**Mandate:** apto#72 (`design_preview` wiring)

**DESIGN_PREVIEW_REVIEWED:** 2026-10-17 — Signed into preview; captured **light + dark** baselines for login, Operations nav (Accounts, Jobs & SLA, Inventory), and Integrations (admin-adjacent filter/table rhythm). Preview SPA still **does not deep-link** `/admin/*` or `/operations/scan` (falls back to Accounts); Admin / scan / extended Demo 2 surfaces on **product STG** must inherit the **global rules below** and match per-slice charters (apto#46–#60).

## Preview evidence (this ticket)

| Surface | Light | Dark |
|---------|-------|------|
| Login | [screenshot](screenshots/apto-99-login-light.png) | [screenshot](screenshots/apto-99-login-dark.png) |
| Accounts list | [screenshot](screenshots/apto-99-accounts-light.png) | [screenshot](screenshots/apto-99-accounts-dark.png) |
| Jobs & SLA list | [screenshot](screenshots/apto-99-jobs-light.png) | [screenshot](screenshots/apto-99-jobs-dark.png) |
| Inventory browse | [screenshot](screenshots/apto-99-inventory-light.png) | [screenshot](screenshots/apto-99-inventory-dark.png) |
| Integrations (filter rhythm) | [screenshot](screenshots/apto-99-integrations-light.png) | [screenshot](screenshots/apto-99-integrations-dark.png) |

Legacy apto#42 baselines remain valid for spot checks: `docs/ux/screenshots/apto-42-*`.

## Product intent

Ship **one coherent AIMS visual system** on STG: every Demo 2 screen reads at a glance in **dark and light**, uses **styled selects** (no OS-native dropdown chrome), and respects **preview control widths** (filters, forms, primary actions — not full-bleed fields). Hephaestus updates **shared CSS/components** so new slices inherit fixes; Athena Mode A re-diff vs preview before Argus.

## Global token rules (both themes)

Apply `data-theme="dark"` | `data-theme="light"` on `<html>`; persist `apto-aims-theme` in `localStorage`. Use CSS variables from `DESIGN.md` — do not hard-code one-off hex on pages.

### Contrast — text & surfaces (WCAG-oriented targets)

Minimum **4.5:1** for body text and control labels on their background; **3:1** for large headings (≥18px bold / 24px regular) and UI borders that separate interactive regions.

| Role | Dark (`data-theme="dark"`) | Light (`data-theme="light"`) | Must read clearly |
|------|----------------------------|------------------------------|-------------------|
| Page background `--aims-bg` | `#10151c` | `#f4f6f9` | No “washed” panels on bg |
| Surface `--aims-surface` | `#161d27` | `#ffffff` | Cards/panels vs bg |
| Primary text `--aims-text` on surface | `#f1efeb` on `#161d27` | `#0f172a` on `#ffffff` | Table body, form values |
| Muted `--aims-text-muted` on surface | `#94a3b8` on `#161d27` | `#64748b` on `#ffffff` | Subtitles, th, helper copy |
| Border `--aims-border` | `#29323f` | `#d8dee8` | Inputs, tables, panel edges |
| Accent `--aims-accent` | `#e85d2b` | `#e85d2b` | Links, focus ring, SLA accent |
| Sidebar text on `--aims-sidebar-bg` | `#e2e8f0` on `#121820` | `#f8fafc` on `#0f172a` | Nav labels, theme toggle |
| CTA `--aims-cta-*` | cream on dark panel | navy on white panel | Login + primary buttons |

**Forbidden on STG:** placeholder/muted text that matches border color; table row text below muted contrast; `opacity` hacks instead of token fixes; light-theme ghost buttons with white borders on white panels.

### Select / dropdown styling (mandatory)

Preview reference (Jobs filter): `select.select.filter-bar__select` — `appearance: none`, **8px** radius, themed `--aims-input-bg` / `--aims-border` / `--aims-text`, **~180px** default width in filter bars (wider only when label requires).

| Rule | Spec |
|------|------|
| Native chrome | **Forbidden** — no default macOS/Windows select arrow box without custom chevron |
| Base class | All product `<select>` use shared class **`.aims-select`** (create in `styles.css` if missing) |
| Filter bars | Wrap in `.filter-bar__select` label; width `min(100%, 12rem)`–`14rem` unless charter specifies full row |
| Chevron | `background-image` SVG or pseudo-element; `padding-right` ≥ 2rem |
| Focus | Same as inputs: `outline: 2px solid var(--aims-accent)` |
| Disabled | Muted text + reduced contrast border; still readable |
| Inventory grid | `.inventory-account-select select` — same `.aims-select` rules, not bare `select {}` only |

Migrate **every** raw `<select>` (Reference Data type picker, QBO filters, F8 preset, job/account forms, F15 prototypes, etc.) to `.aims-select`.

### Input & button widths / density

| Context | Max width / behavior |
|---------|----------------------|
| Main column | `.aims-main` **max-width 1200px** (already in CSS) — content centered in shell |
| Login form fields | **~100%** of right panel, panel **max ~28–32rem** (preview split hero) |
| Filter search | **Grow** in flex row; cap **~24rem** on wide viewports (Accounts/Jobs search) |
| Filter `<select>` | **12–14rem** default; stack on narrow |
| Form fields (detail/edit) | **Two-column grid** on wide; single column **max ~28rem** per field group — not `width: 100%` of entire main on short labels |
| Primary actions in header | **Auto width** + horizontal `.dashboard-actions` cluster (Refresh, New …) — not full-width unless mobile |
| `.btn-primary` in dashboards | **Not** `width: 100%` except login CTA and single-action mobile stacks |
| Modals | `.modal-dialog` **min(28rem, 100%)** — fields fill modal, not viewport |
| QBO / narrow admin panels | `.qbo-account-panel` **max-width 32rem** pattern for stacked forms |

**Forbidden:** full-bleed `<input>`/`<select>` on admin filter rows when preview shows compact filters; oversized primary buttons spanning the content column.

### Shared components (touch once, inherit everywhere)

Update centrally where possible: `styles.css` (`input`, `select`, `button`, `.btn-primary`, `.filter-bar__*`), `FilterBar`, `DataTable` headers/cells, `AimsButton` variants, SLA pills, `AlertBanner`, `EmptyState`, sidebar + theme toggle. Slice-specific charters (F1–F15) stay authoritative for **layout**; this ticket owns **tokens + control chrome**.

## Page-by-page checklist (Demo 2 — light + dark each)

Mark each row after STG matches preview + charter. Hephaestus may demux PRs by nav area; checklist stays on this ticket until all `[ ]` are `[x]` and Argus PASS.

### Unauthenticated & shell

| Surface | Route / key | Slice charter | Preview baseline | STG pass |
|---------|-------------|---------------|------------------|----------|
| Login split hero + panel | `/login` | apto#42 | apto-99-login-{light,dark} | [ ] |
| App shell + Operations nav | F1 | apto#49 | apto-99-accounts-{light,dark} (sidebar) | [ ] |
| Theme toggle Dark \| Light | shell | apto#42 | all apto-99-* pairs | [ ] |
| Module map / deep links | F1 | apto#49 | — | [ ] |

### Operations

| Surface | Route / key | Slice charter | Preview baseline | STG pass |
|---------|-------------|---------------|------------------|----------|
| Accounts list + filters | `/accounts` | apto#42 / F2 list | apto-99-accounts-* | [ ] |
| Account detail + tabs | `/accounts/:id` | apto#51 | F2 + Accounts density | [ ] |
| Jobs list + SLA columns | `/jobs` | apto#52 | apto-99-jobs-* | [ ] |
| Job detail + assets | `/jobs/:jobId` | apto#53 | apto-53-* + jobs list | [ ] |
| SLA dashboard | `/sla` or module | apto#52 / F4 | jobs KPI rhythm | [ ] |
| Inventory browse + filters | `/inventory` | apto#56 | apto-99-inventory-* | [ ] |
| Asset detail | `/inventory/:assetId` | apto#56 | inventory table | [ ] |
| Warehouse quick scan | `/operations/scan` | apto#48 | product STG + F8 charter (preview TBD apto#72) | [ ] |

### Admin

| Surface | Route / key | Slice charter | Preview baseline | STG pass |
|---------|-------------|---------------|------------------|----------|
| Reference data admin | `/admin/reference-data` | apto#46 | Integrations filter/table rhythm + apto-99-integrations-* | [ ] |
| QuickBooks sync queue | `/admin/qbo-sync` | apto#47 | same | [ ] |
| Part numbers | `/admin/part-numbers` | apto#50 | same | [ ] |

### Documents & data motion

| Surface | Route / key | Slice charter | STG pass |
|---------|-------------|---------------|----------|
| Spreadsheet import | per F6 | apto#54 | [ ] |
| Bulk unserialized | per F7 | apto#55 | [ ] |
| Job certificates | per F10 | apto#58 | [ ] |
| Service invoices | per F11 | apto#59 | [ ] |

### Prototypes / F15 (if on STG)

| Surface | Charter | STG pass |
|---------|---------|----------|
| Production dashboard | apto#60 | [ ] |
| Order fulfillment | apto#60 | [ ] |
| Asset images | apto#60 | [ ] |

## Implement notes (Hephaestus)

1. **Order:** global CSS (selects, btn-primary width, contrast fixes) → Operations dashboards → Admin → remaining routes.
2. **Verify:** toggle theme on each page; spot-check Jobs filter select vs preview (180px, no native chrome).
3. **Do not** ship preview-only UI (Future · AI, preview state radiogroup, mock nav counts).
4. **STG auth** remains `demo` / `demo`; preview credentials stay prototype-only.
5. **Mode A:** Athena side-by-side screenshots STG vs `docs/ux/screenshots/apto-99-*` before handoff to Argus.

## Acceptance (apto#99)

- [ ] All checklist rows STG `[x]` in light **and** dark
- [ ] No bare OS `<select>` appearance on in-scope screens
- [ ] Control widths match preview density (filters, forms, header actions)
- [ ] Shared tokens — no one-off page colors breaking contrast table
- [ ] Argus STG PASS on validate-testing

## Out of scope

- New Demo 2 features (functional gaps stay on slice tickets)
- Preview deep-link parity (apto#72)
- Figma `.fig` as primary SoT

UX_CHARTER_READY
