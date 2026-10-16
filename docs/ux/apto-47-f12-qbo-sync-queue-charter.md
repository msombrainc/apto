# apto#47 — F12 QuickBooks Sync admin (Mode B charter)

**Status:** Frozen for implement (2026-10-15)  
**OpenSpec:** `openspec/changes/apto-47-f12-qbo-sync-queue`  
**Design SoT:** `docs/ux/Apto-AIMS.fig` · [AIMS preview](https://apto-aims-preview.vercel.app) (password `apto2026`)  
**Tokens / shell:** repo root `DESIGN.md` (apto#42) — **no new palette**; extend Admin layout only.

## Product intent

Finance and ops admins need a **single place** to see whether QuickBooks Online is connected, what customer sync work is in flight or failed, and to **retry** without re-saving accounts. The screen should feel like the rest of AIMS Admin (Reference Data): same shell, filter bar, data table, status pills, and secondary/primary actions — not a separate “integration console” visual language.

Operators who just saved an account should see **pending** queue rows appear without blocking; admins use this page to clear **Failed** rows (e.g. duplicate name / QBO 6240) after fixing data in AIMS or QBO.

## Navigation & route

| Item | Spec |
|------|------|
| Sidebar group | **Admin** (existing `sidebar-nav--admin`, `aria-label="Administration"`) |
| Nav item | **QuickBooks Sync** — second Admin item below Reference Data |
| Active state | Same `sidebar-nav-btn` / `is-active` / dot pattern as Reference Data |
| View key | Extend `AppView`: `qbo-sync` (deep link `/admin/qbo-sync` when routing lands in apto#47) |
| Page root | `data-testid="qbo-sync-page"` on outer page content wrapper (inside `page-content`) |
| Page title | `QuickBooks sync` |
| Subtitle | `Connection status, outbound queue, and retries for QuickBooks Online (sandbox).` |

Do **not** ship preview-only blocks (Future · AI, Integrations mock nav, preview state radiogroup).

## Screen layout

```
┌─ AppShell ─────────────────────────────────────────────────────────────┐
│ Sidebar │  QuickBooks sync                          [Refresh]          │
│  Ops…   │  Subtitle (muted)                                              │
│  Admin  │  ┌─ Connection banner (.dashboard-panel) ───────────────────┐ │
│   · Ref │  │ [status]  Company: {name} · Realm {realmId}              │ │
│   · QBO │  │ OR: Not connected — [Connect to QuickBooks] (primary)    │ │
│         │  └──────────────────────────────────────────────────────────┘ │
│         │  ┌─ Queue card (.dashboard-panel) ───────────────────────────┐ │
│         │  │ Status [▼]  Type [▼]     Showing 1–50 of N                │ │
│         │  │ ┌ data table ──────────────────────────────────────────┐ │ │
│         │  │ │ Type │ AIMS record │ Status │ … │ Actions            │ │ │
│         │  │ └──────────────────────────────────────────────────────┘ │ │
│         │  │ [Previous]  Page 1 of M  [Next]                         │ │
│         │  └──────────────────────────────────────────────────────────┘ │
└─────────┴──────────────────────────────────────────────────────────────┘
```

- **Max content width:** inherit `.aims-main` (~1200px).
- **Vertical rhythm:** `.dashboard-stack` gap `1rem` between connection panel and queue panel.
- **Header actions:** `.dashboard-actions` — **Refresh** only (`aims-btn--secondary` + refresh icon). No “Add” on this screen.
- **No KPI stat row.**

## Connection banner

Panel uses `.dashboard-panel` with `data-testid="qbo-sync-connection"`.

| API `connected` | UI |
|-----------------|-----|
| `true` | **Connected** pill (reuse active/success tint — same family as `.status-pill--active` / on-track green). Line: `Company: {companyName}`; optional muted `Realm {realmId}`. No Connect button. |
| `false` | **Not connected** pill (muted / warning border — not red error). One line: `QuickBooks is not connected. Customer sync will queue until you connect.` Primary button **Connect to QuickBooks** navigates to `connectUrl` from `GET /api/qbo/status` (full redirect, new tab optional — prefer same-tab navigation for OAuth return). |

While status is loading: skeleton or `role="status"` “Loading connection…” in the panel; disable Connect until `connectUrl` is known.

On OAuth return (existing Demo 1 flow): user lands back in app; **Refresh** or auto-refetch on mount updates banner to Connected.

## Queue filters

Native `<select>` elements in `.filter-bar` (same styling as Reference Data).

| Control | `data-testid` | Options | API |
|---------|---------------|---------|-----|
| Status | `qbo-sync-filter-status` | **All** (default), Pending, Processing, Sent, Failed | `status` query param; omit when All |
| Type | `qbo-sync-filter-type` | **All** (default), Create customer, Update customer, Create invoice | `type` maps to `CreateCustomer`, `UpdateCustomer`, `CreateInvoice` |

**Default filter behavior:** Status = **All** (no `status` query param). **All** includes short-lived **Processing** rows when the worker holds a lock (ASSUMPTION-476). Admins triage failures by choosing **Failed** in the status filter.

Changing either filter resets to **page 1** and refetches.

## Queue table

`DataTable` inside queue panel with `data-testid="qbo-sync-table"` on the `<table>` or table wrapper used elsewhere.

| Column | Content | Notes |
|--------|---------|-------|
| **Type** | Human label for `operation` | Create customer / Update customer / Create invoice (invoice rows may be empty in apto#47; column still present) |
| **AIMS record** | `entityLabel` + link | Link when `entityType = Account`: `/accounts/{entityId}` or in-SPA navigation to Accounts with highlight — `data-testid="qbo-sync-open-aims-{id}"` on the link. Other entity types: plain text until F11. |
| **Status** | Pill | Pending (muted blue-gray), Processing (accent outline pulse optional), Sent (success), Failed (error tint — same family as SLA overdue but smaller pill) |
| **Attempts** | `{attempts}` / 5 | Right-aligned; show max **5** as static denominator for failed/pending clarity |
| **Last error** | Truncated `lastError` | Max 2 lines with `title` tooltip for full text; `—` when empty |
| **QBO ID** | `qboId` or `—` | Monospace; when present, **Open in QuickBooks** link `data-testid="qbo-sync-open-qbo-{id}"` → ASSUMPTION-473 sandbox URL |
| **Created** | `createdAtUtc` | Locale short date + time (UTC label in tooltip optional) |
| **Sent** | `sentAtUtc` or `—` | Same formatting |
| **Actions** | Retry | Only when `status === Failed`: button **Retry** `data-testid="qbo-sync-retry-{id}"` (`aims-btn--secondary` small). Calls `POST /api/qbo/requests/{id}/retry`, then refetch list; disable + `aria-busy` while in flight. |

**Paging:** server-driven `page` / `pageSize` (default 50); footer Previous/Next + `Page N of M`; meta `Showing {from}–{to} of {total}` in `.filter-bar__meta`.

**Loading / empty / errors:** same patterns as Reference Data — `DataTable` loading row, `EmptyState` title `No sync requests`, body `Account saves will enqueue work here.`, `AlertBanner` above stack on API failure.

**Auto-refresh (optional, recommended):** poll list every **15s** while page mounted and tab visible; manual Refresh always available. If Hephaestus skips poll, manual Refresh + post-retry refetch is sufficient for acceptance.

## Status pill semantics

| Status | Pill class suggestion | Label |
|--------|----------------------|-------|
| Pending | `.status-pill--pending` (new: muted border + `--aims-text`) | Pending |
| Processing | `.status-pill--processing` (new: `--aims-accent` border) | Processing |
| Sent | `.status-pill--active` (reuse apto#46 active green family) | Sent |
| Failed | `.status-pill--failed` (new: reuse `--sla-pill-overdue-*` tints) | Failed |

Keep pill **size** aligned with Reference Data Active/Inactive pills.

## Tokens & components (implement map)

| Concern | Use |
|---------|-----|
| Shell | `AppShell` + second Admin nav item |
| Table | `DataTable` |
| Panels | `.dashboard-panel`, `.dashboard-stack` |
| Filters | `.filter-bar` |
| Buttons | `AimsButton` — Connect (primary), Refresh (secondary), Retry (secondary, compact) |
| Links | Default link style; external QBO opens in **new tab** with `rel="noopener noreferrer"` |
| Banner | `AlertBanner` only for page-level errors — not for disconnected state (use connection panel) |

**Accent:** `--aims-accent` for Connect CTA and Processing pill border only.

## Accessibility

- Connection panel: `aria-live="polite"` when connection state transitions connected ↔ disconnected.
- Filters: visible `<label>` for Status and Type.
- Retry buttons: accessible name `Retry sync for {entityLabel}`.
- External QBO link: visible text “Open in QuickBooks” (not icon-only).
- Table: column headers `<th scope="col">`; status pills include visually hidden status text if color-only.

## data-testid contract (factory / BA)

| id | Element |
|----|---------|
| `qbo-sync-page` | Page root |
| `qbo-sync-connection` | Connection banner panel |
| `qbo-sync-table` | Queue table |
| `qbo-sync-filter-status` | Status filter |
| `qbo-sync-filter-type` | Type filter |
| `qbo-sync-retry-{id}` | Per-row retry (Failed only) |
| `qbo-sync-open-qbo-{id}` | QBO deep link when `qboId` set |
| `qbo-sync-open-aims-{id}` | AIMS account link when `entityType = Account` |

Recommended (not blocking): `qbo-sync-refresh`, `qbo-sync-connect` for E2E stability.

## Cross-surface consistency (Accounts)

Account list/detail may continue to show `qboSyncStatus` / `qboCustomerId` from account DTO (BR-1207). After apto#47, saves can return `qboSyncStatus: pending` — use the **same** Pending/Sent/Failed vocabulary as queue pills where account UI surfaces sync state (no new colors).

## Screen checklist (Hephaestus)

- [ ] Admin → QuickBooks Sync in sidebar; title + subtitle
- [ ] Connection banner wired to `GET /api/qbo/status`; Connect uses `connectUrl`
- [ ] Filters wired to `GET /api/qbo/requests` query params; paging footer
- [ ] Table columns per charter; pills for status; attempts show /5
- [ ] Retry on Failed only; list refresh within 15s per acceptance
- [ ] AIMS + QBO links with required `data-testid`s
- [ ] Light + dark themes via existing `data-theme` variables
- [ ] Page `data-testid="qbo-sync-page"`

## Out of scope (this ticket)

- F11 invoice UI, Service Invoice routes, balance/invoice side panel (Demo2 optional).
- Production QBO URL, Web Connector, role-based admin gates.
- Inline QBO sync on account save (replaced by queue — no blocking spinner on account form).
- New Figma frames required — visual reference: **Reference Data** list density + **Accounts** link styling in preview / `.fig`.

## Implement notes

- Single page component `QboSyncAdmin.tsx` (or similar) colocated with `ReferenceDataAdmin.tsx`.
- Extend `App.tsx` view switch + `initialView()` path `/admin/qbo-sync` mirror reference-data pattern.
- API client: `getQboStatus`, `listQboRequests`, `retryQboRequest`.
- Do not call QBO from the browser except via `connectUrl` OAuth.
