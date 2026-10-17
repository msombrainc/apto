# apto#51 — F2 Account detail and edit (Mode B charter)

**Status:** Frozen for implement (2026-10-17)  
**OpenSpec:** `openspec/changes/apto-51-f2-account-detail` (Hephaestus)  
**BA:** Hermes on msombrainc/apto#51 (FR-0201–FR-0219, BR-0201–BR-0210)  
**Plan SoT:** `docs/planning/Demo2-Plan.md` §F2  
**Design SoT:** [AIMS preview](https://apto-aims-preview.vercel.app) (`apto-inventory` / `apto2026`) · `docs/ux/Apto-AIMS.fig`  
**Tokens / shell:** repo root `DESIGN.md` (apto#42) — **no new palette**  
**Navigation context:** apto#49 F1 — Accounts & Sales sidebar, module map, React Router  
**List baseline (pre-F2):** `AccountsDashboard.tsx` + STG `/accounts` (see screenshots)

**DESIGN_PREVIEW_REVIEWED:** 2026-10-17 — Preview SPA sign-in returned **“Couldn’t reach the server”** (preview API unreachable). Captured **light + dark** Accounts **search** rhythm from STG (`demo` / `demo`) as list-density reference until preview ships F2 frames (apto#72). Detail layout below is charter-specified; align tabs/panels to existing `.dashboard-panel`, `FilterBar`, `DataTable`, and QBO admin patterns (apto#47).

| Screenshot | Path |
|------------|------|
| Accounts search (dark) | `docs/ux/screenshots/apto-51-accounts-search-dark.png` |
| Accounts search (light) | `docs/ux/screenshots/apto-51-accounts-search-light.png` |

## Product intent

Account managers need **one screen** to view and edit everything about a customer: identity, SLAs, consignment %, per-service fees, operational rules and service offerings (storage-only in Demo 2), billing address for QuickBooks, audit history, related jobs, and QBO sync status — without blocking saves on QuickBooks. The Accounts **search** list must support status filtering, richer columns, correct **Input / Settlement / Sales** SLA terminology, and deep links into detail.

## Navigation & routes

| Item | Spec |
|------|------|
| Sidebar group | **Accounts & Sales** (existing F1) |
| Nav item | **Accounts** — default landing |
| List route | **`/accounts`** — `data-testid` unchanged on list wrapper; extend list behaviors below |
| Detail route | **`/accounts/:accountId`** — register in `ROUTES` + React Router (add `accountDetail` + `accountPath(id)` helper like `inventoryAssetPath`) |
| Page root (detail) | `data-testid="f2-account-detail-page"` on outer content inside `page-content` |
| Page title (detail) | Account **name** (live from loaded record); subtitle muted: `Code {code} · {status}` |
| Back link | Text button **← Accounts** above title → `/accounts` (preserve list query params in `location.state` optional; not required for Demo 2) |
| Module map | `accounts` entry unchanged path; detail is child of accounts module (deep link works on refresh) |
| Jobs link target | `/jobs/:jobId` when F3 route exists; until then link to `/jobs` with `state.highlightJobId` or disabled with tooltip **Job detail (Demo 2)** — prefer real route if F3 merged in same release |

Do **not** ship preview-only blocks (Future · AI, Integrations mock nav, preview state radiogroup).

## Accounts search (list) — updates

Extend `AccountsDashboard` in place; keep KPI row (Accounts count + Average SLA) and **Refresh** / **New account** actions.

### Filters

| Control | Spec |
|---------|------|
| Text search | Existing `Filter by name or code` → `q` param (unchanged) |
| Status | New `<select>` in `FilterBar`: **Active** (default), **Inactive**, **Both** → `GET /api/accounts?status=` per BR-0210. `data-testid="f2-accounts-filter-status"` |
| Meta | `{n} account(s)` in `.filter-bar__meta` with `aria-live="polite"` |

### Columns

| Column | Notes |
|--------|--------|
| **Account** | Avatar + **link** to `/accounts/{id}` (`<Link>` or router link on name only). `data-testid="f2-accounts-row-link-{id}"` optional |
| **Code** | `CodePill` (unchanged) |
| **Status** | Pill: Active (success family) / Inactive (muted) |
| **Apto %** | Right-aligned; `—` when null/0 display as `0%` or `0` per BA — use **`{n}%`** integer display |
| **Input SLA** | Days count (replaces first segment label in table; no bar required in list if cramped — **numeric days** column preferred for scan) |
| **Settlement SLA** | Days count |
| **Sales SLA** | Days count |
| **SLA** (optional) | If keeping `SlaSegmentBar`, **legend** under table or column header tooltips must say **Input / Settlement / Sales** — not Receiving / Processing / Shipping |

**Rename everywhere on Accounts surfaces:** KPI sublabel **Average SLA** → `Input + settlement + sales`; segment bar labels **Input**, **Settlement**, **Sales** (FR-0219). New-account modal field labels match.

### Create modal

Extend create form with optional **Status** (default Active) and **Apto %** (default 0); SLA defaults **30 / 30 / 60** with new labels. Fees/rules/services default empty/false per ASSUMPTION-511.

## Account detail — layout

```
┌─ AppShell ───────────────────────────────────────────────────────────────────┐
│ Sidebar │  ← Accounts                                                             │
│         │  [Avatar] Account name (h1)     Code pill   Status [▼]   [Save] [Revert]│
│         │  Muted: Customer profile · fees · billing · QuickBooks                  │
│         ├─ Profile strip (.dashboard-panel, compact 2-col grid) ───────────────────┤
│         │  Name · Code · Status · Input/Settlement/Sales SLA · Apto %             │
│         ├─ Tab bar (.tab-bar) ─────────────────────────────────────────────────────┤
│         │  Fees | Rules | Services | Billing | History | Jobs | QuickBooks          │
│         ├─ Tab panel (.dashboard-panel) ───────────────────────────────────────────┤
│         │  (active tab content)                                                     │
│         └──────────────────────────────────────────────────────────────────────────┘
```

- **Max width:** `.aims-main` (~1200px).
- **Save model:** Single **Save** persists all dirty fields (full `PUT` body including `settings`). **Revert** reloads from last successful GET. Disable Save while saving; `aria-busy` on form.
- **Validation:** API 400 → field-level errors; 409 code duplicate → inline on Code.
- **Success:** Toast or `role="status"` polite: **Account saved** (QBO queue message optional muted: *QuickBooks update queued* when name/billing changed).

### Profile strip (always visible above tabs)

Editable fields (also summarized in header):

| Field | Control | Validation (UI) |
|-------|---------|-----------------|
| Name | Text, required | Trim; maps QBO enqueue |
| Code | Text, required | Unique 409 |
| Status | Select Active / Inactive | BR-0205 |
| Input SLA days | Number ≥ 0 | Label **Input SLA (days)** |
| Settlement SLA days | Number ≥ 0 | **Settlement SLA (days)** |
| Sales SLA days | Number ≥ 0 | **Sales SLA (days)** |
| Apto % | Number 0–100 | Suffix `%`; `settings.aptoPercentage` |

`data-testid="f2-account-profile-form"` on strip wrapper.

## Tabs

Use horizontal tab buttons (`.tab-bar` / `role="tablist"`); one panel `role="tabpanel"` per tab. Default tab on open: **Fees** if all fees empty else **Fees**; implement may default **Billing** — prefer **Fees** for demo flow.

### Tab: Fees

Grid table inside panel — **Service** | **Rate (USD per unit)**.

| Row label (UI) | `settings.fees` key |
|----------------|---------------------|
| Audit | `audit` |
| Wipe | `wipe` |
| Shred | `shred` |
| Recycle | `recycle` |
| Bulk | `bulk` |
| Bulk recycle | `bulkRecycle` |
| Storage | `storage` |
| Teardown | `teardown` |
| Repair | `repair` |
| OS install | `osInstall` |
| Redeploy | `redeploy` |

- Input: optional number, blank = not billed (null). Step `0.01`, min 0. Placeholder **Not billed** when empty.
- `data-testid="f2-account-fees-grid"`

### Tab: Rules

Two-column toggle list (native checkbox or switch styled per DESIGN.md).

| Label | `settings.rules` key |
|-------|----------------------|
| Require processing approval | `requireProcessingApproval` |
| Require recycle approval | `requireRecycleApproval` |
| Require sales approval | `requireSalesApproval` |
| Redeploy only | `redeployOnly` |
| Redeploy bypass | `redeployBypass` |
| Shred all drives | `shredAllDrives` |
| Recycle only | `recycleOnly` |
| Require shred pictures | `requireShredPictures` |
| Require damage pictures | `requireDamagePictures` |

Helper text (muted): *Rules are stored for this account; processing enforcement is not in Demo 2.*

`data-testid="f2-account-rules"`

### Tab: Services

| Label | `settings.services` key |
|-------|-------------------------|
| OS install / imaging | `osInstallImaging` |
| Memory install | `memoryInstall` |
| Parts replacement | `partsReplacement` |

`data-testid="f2-account-services"`

### Tab: Billing

Address form — `settings.billingAddress`:

| Field | Control |
|-------|---------|
| Line 1 | Required for QBO enqueue when any billing save |
| Line 2 | Optional |
| City, State, Postal code, Country | Text; country default US |

Note: *Sent to QuickBooks on save when name or billing address changes.*

`data-testid="f2-account-billing"`

### Tab: History

`data-testid="f2-account-changelog"` on panel.

| Behavior | Rule |
|----------|------|
| Table columns | When · Field · Old value · New value · Changed by |
| Filters | Field (select populated from distinct fields or free text), **From** / **To** date (UTC day) → query params per ASSUMPTION-517 |
| Paging | Server page size 25; Previous/Next |
| Empty | `EmptyState` — *No changes recorded yet* |

Refetch on successful Save.

### Tab: Jobs

`DataTable` via `GET /api/jobs?accountId={id}` (ASSUMPTION-518).

| Column | Content |
|--------|---------|
| Job | Id or title link → job detail route |
| Ops status | Pill |
| SLA | Flag pill (on track / at risk / overdue — reuse jobs list family) |
| Due | Date |

Empty: *No jobs for this account.*

`data-testid="f2-account-jobs-table"`

### Tab: QuickBooks

Panel `data-testid="f2-account-qbo-panel"` — reuse visual language from apto#47 connection/queue (pills, monospace ids).

| Row | Content |
|-----|---------|
| Sync status | Pill from `qboSyncStatus` |
| Customer ID | `qboCustomerId` or — |
| Last sync | `qboLastSyncAtUtc` formatted or — |
| Error | `qboSyncError` in `AlertBanner` when failed |
| Actions | **Sync now** (secondary) → POST qbo-sync, toast *Sync queued*; **Open in QuickBooks** external link per ASSUMPTION-473 when id present |

If account not synced: inline message *Customer not in QuickBooks yet* + **Sync now** enqueues create.

## Tokens & components

| Concern | Use |
|---------|-----|
| Shell | `AppShell` + new route in `App.tsx` |
| Page | `AccountDetailPage.tsx` (new) colocated with `AccountsDashboard.tsx` |
| List | Extend `AccountsDashboard.tsx` |
| Table | `DataTable`, `FilterBar`, `SlaSegmentBar` (detail optional) |
| Panels | `.dashboard-panel`, `.dashboard-stack`, `.dashboard-actions` |
| Buttons | `AimsButton`, `CodePill`, `AccountAvatar` |
| Status | Reuse job/account pills from inventory/jobs |
| QBO | Mirror `QboSyncAdmin` pills/links |
| API | Extend `api.ts` — getAccount, putAccount, getAccountChanges, postAccountQboSync |

**Accent:** `--aims-accent` for focus and active tab indicator only.

## Accessibility

- Tab list: roving `tabindex`, arrow keys, `aria-selected`.
- Save/Revert: keyboard reachable; announce save result via live region.
- Fee grid: each rate input has visible `<label>` or `aria-label="{Service} rate USD"`.
- History filters: labeled date inputs; table headers scope `col`.
- QBO **Open in QuickBooks**: `rel="noopener"`, indicates external link.

## data-testid contract

| id | Element |
|----|---------|
| `f2-account-detail-page` | Detail page wrapper |
| `f2-account-profile-form` | Profile strip |
| `f2-accounts-filter-status` | List status filter |
| `f2-account-fees-grid` | Fees tab panel |
| `f2-account-rules` | Rules tab panel |
| `f2-account-services` | Services tab panel |
| `f2-account-billing` | Billing tab panel |
| `f2-account-changelog` | History tab panel |
| `f2-account-jobs-table` | Jobs tab panel |
| `f2-account-qbo-panel` | QuickBooks tab panel |
| `f2-account-save` | Primary Save (header) |

## Screen checklist (Hephaestus)

- [ ] `/accounts` status filter + new columns + name links to detail
- [ ] SLA labels Input / Settlement / Sales on list, KPI, create modal, detail
- [ ] `/accounts/:id` deep link + refresh
- [ ] All seven tabs + profile strip; single Save PUT
- [ ] Change history filters + paging
- [ ] Jobs table with SLA flag + link
- [ ] QBO panel sync now + open in QBO
- [ ] Light + dark via `data-theme`
- [ ] All `data-testid` hooks above

## Out of scope (this ticket)

- Enforcing rules in processing (OOS-0201)
- FR-13–15 custom fields, reports, price deductions
- QBO balance / invoice list on panel (OOS-0203)
- Role-based field hiding
- Preview F2 frames until apto#72

## BA traceability (UX-facing)

| Requirement | UX surface |
|---------------|------------|
| FR-0212 | Detail route + testid |
| FR-0213 | Profile + tabs (fees, rules, services, billing) |
| FR-0214 | History tab |
| FR-0215 | Jobs tab |
| FR-0216 | QuickBooks tab |
| FR-0217 | Save UX + non-blocking QBO |
| FR-0218–FR-0219 | List filter, columns, links, SLA rename |

UX_CHARTER_READY
