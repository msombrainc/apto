# apto#125 — Screen parity charter (Mode B)

**Status:** Frozen for implement (`UX_CHARTER_READY`)  
**Date:** 2026-10-17  
**Athena run:** `ux-agent/projects/apto/runs/2026-10-17-charter-apto-125/`  
**SoT:** https://apto-aims-preview.vercel.app (preview login: see `DESIGN.md` / factory `design_preview` — not duplicated here)  
**STG compare:** http://64.225.115.88:3012 (`demo` / `demo`)

## DESIGN_PREVIEW_REVIEWED

| Field | Value |
|-------|--------|
| Reviewed at (UTC) | 2026-10-17T19:51Z – 2026-10-17T20:00Z |
| Tool | Playwright MCP (`user-playwright`) live browser session |
| Preview login | Success → Accounts shell |
| Themes | Light + dark per screen via theme control / `data-theme` |
| Viewport | 1440×900 (desktop composition; tablet/mobile follow-up in Mode A) |

**Evidence root:**  
`ux-agent/projects/apto/runs/2026-10-17-charter-apto-125/screenshots/`

```
preview/{light,dark}/01-login.png … 10-future-inventory.png
stg/{light,dark}/01-login.png … 15-sla-dashboard.png
```

## Product framing

- **Users:** Apto ops + admin operators on AIMS.
- **Job:** Bring STG visual/layout parity to the authenticated design preview for every primary screen (≥95 match, min of light/dark).
- **Success:** Matrix rows ≥95 or operator-signed deferral with score + child ticket.
- **Reject:** Inventing layout from CSS/screenshots alone; treating preview Future·AI / Preview state radios as product chrome (DESIGN.md out of scope).

## Preview surface inventory (live)

| Preview nav | Present? | Notes |
|-------------|----------|--------|
| Login | Yes | Split hero + form |
| Accounts list + row detail | Yes | Detail opens over list (drawer/panel) |
| Jobs & SLA list | Yes | KPI filter cards + compact table |
| Job detail | No drill-in in this session | Rows stay on list |
| Inventory | Yes | Compact KPIs + 6-col table |
| Warehouse scan | **Absent** | Not in Operations nav |
| Reference Data / QBO Sync / Part Numbers | **Absent** | No Admin nav in preview |
| Integrations | Yes (Future) | Prototype integrations matrix — not product Admin QBO queue |
| Future·AI Accounts/Jobs/Inventory | Yes | Preview-only; do not ship |
| Separate SLA dashboard | **Absent** | Jobs & SLA is the SLA surface |

## STG surface inventory (live)

| STG route | Present? | Notes |
|-----------|----------|--------|
| `/` login | Yes | |
| `/accounts` | Yes | |
| Account row open | Yes | Drawer/detail chrome |
| `/jobs` | Yes | Title **Jobs** (not “Jobs & SLA”) |
| `/jobs/:id` | Yes | Job detail |
| `/inventory` | Yes | Title **Inventory browse** |
| `/operations/scan` | Yes | Warehouse scan |
| `/admin/reference-data` | Yes | |
| `/admin/qbo-sync` | Yes | Queue UI (not Integrations matrix) |
| `/admin/part-numbers` | Yes | |
| `/operations/sla-dashboard` | Collapses to Jobs | Module map / deep link lands on Jobs list in this session |

## Parity matrix (STG vs preview SoT)

Score = visual/layout match 0–100. **Pass = min(light, dark) ≥ 95.**  
Preview-only chrome ignored when scoring STG. Where preview has **no route**, score is against the closest SoT + feature charter; marked `PREVIEW_ABSENT`.

| Screen | Light | Dark | **Min** | Band | Top defects (STG vs SoT) | Evidence |
|--------|------:|-----:|--------:|------|--------------------------|----------|
| Login | 62 | 92 | **62** | FAIL | Light theme: STG hero panel goes light; preview keeps dark branded hero. STG still shows “Prototype · test data only”. Dark nearly aligned (cream CTA, grid hero). | `preview/*/01-login.png`, `stg/*/01-login.png` |
| Accounts list | 54 | 56 | **54** | FAIL | Table model drift: preview segmented SLA bars + Open chevron; STG numeric INPUT/SETTLEMENT/SALES + Status/Apto %. KPI copy (“Active customers” / “89 days” vs “Active customer records” / “63.9d”). Header “Find asset” + Status filter extra vs preview. | `preview/*/02-accounts.png`, `stg/*/02-accounts.png` |
| Account detail | 58 | 58 | **58** | FAIL | Preview account panel density/fields vs STG drawer/form; shell/header extras (Find asset). Align panel chrome, field rows, primary actions to preview detail. | `preview/*/03-account-detail.png`, `stg/*/03-account-detail.png` |
| Jobs & SLA list | 48 | 50 | **48** | FAIL | Title “Jobs” vs “Jobs & SLA”. KPI labels MATCHING vs All jobs. Dense date filters / Columns / Export vs preview compact filter bar. Column set (Job ID, Progress %, WIP…) vs preview Account/Facility/Ops/Deadline/Days left/Status. | `preview/*/04-jobs-sla.png`, `stg/*/04-jobs-sla.png` |
| Job detail | — | — | **N/A*** | GAP | Preview had no drill-in this pass. STG page exists. Implement visual pass vs shell tokens + `docs/ux/apto-53-f3-job-detail-charter.md` + Accounts/Jobs patterns from preview. | `stg/*/05-job-detail.png` |
| Inventory | 42 | 44 | **42** | FAIL | Title “Inventory browse” vs “Inventory”. KPI set ON PAGE / TOTAL MATCHING vs Assets / Created today / Accounts. Heavy filter+Columns chrome vs compact filter. Column set expanded (Category/Grade/Status/…). Empty/dense table chrome vs preview filled compact table. | `preview/*/06-inventory.png`, `stg/*/06-inventory.png` |
| Warehouse scan | — | — | **N/A*** | PREVIEW_ABSENT | No preview route. STG `/operations/scan` present. Match `DESIGN.md` + `docs/ux/apto-48-f8-quick-scan-charter.md`; reuse Accounts/Jobs panel + AimsButton density from preview shell. | `stg/*/11-warehouse-scan.png` |
| Reference Data | — | — | **N/A*** | PREVIEW_ABSENT | No preview Admin. Match `docs/ux/apto-46-f13-reference-data-admin-charter.md` + preview shell/table tokens. Note STG Edit/Deactivate use non-token blue. | `stg/*/12-reference-data.png` |
| QuickBooks Sync | 35 | 35 | **35** | FAIL / GAP | Preview SoT for integrations is **Integrations** matrix (Future), not Admin queue. Product route `/admin/qbo-sync` must follow `docs/ux/apto-47-f12-qbo-sync-queue-charter.md` + shell tokens; do **not** ship Future Integrations marketing table. Closest live SoT shot: `preview/*/07-integrations.png` (reference only). | `stg/*/13-qbo-sync.png`, `preview/*/07-integrations.png` |
| Part Numbers | — | — | **N/A*** | PREVIEW_ABSENT | No preview route. Match `docs/ux/apto-50-f14-part-numbers-charter.md` + shell/table tokens. | `stg/*/14-part-numbers.png` |
| SLA dashboard | — | — | **N/A*** | DEFER | Not a distinct preview screen; STG deep link resolved to Jobs. Treat Jobs & SLA list as SLA SoT unless product reintroduces a separate dashboard with preview update. | `stg/*/15-sla-dashboard.png` (= Jobs) |
| Future·AI / Preview state | — | — | — | OUT | Preview-only; must not appear in product. | `preview/*/08-10-*.png` |

\*N/A rows: no live preview route to score ≥95 against. Hephaestus still implements shell/token + named feature charter; Argus scores those against charter AC + shell baselines until preview grows Admin/scan.

### Score summary

| Metric | Value |
|--------|------:|
| Screens with live preview SoT | 5 (Login, Accounts, Account detail, Jobs & SLA, Inventory) |
| Of those, min≥95 | **0** |
| Portfolio min (scored rows) | **42** (Inventory) |
| Best scored row | Login dark 92; Login min 62 |
| PREVIEW_ABSENT / N/A implement-from-charter | Warehouse, Reference Data, Part Numbers, Job detail, SLA dashboard |
| Explicit SoT mismatch (different IA) | QBO Sync vs Integrations |

## Implement direction (Hephaestus)

1. **Do not invent a new design system.** Reuse preview tokens from `DESIGN.md` / authenticated preview CSS.
2. **Priority order (highest gap first):** Inventory → Jobs & SLA → Accounts (+ detail) → Login light hero → Admin/scan polish to feature charters.
3. **Accounts / Jobs / Inventory:** Match preview **page title, subtitle, KPI card set, filter bar density, table columns/visualizations** (SLA segmented bars on Accounts; status pills + days-left on Jobs; compact inventory columns). Product-only columns may remain only if operator defers with score.
4. **Shell:** Keep STG Admin + Warehouse scan links (product requirement). Do not port Preview state / Future·AI / Future Integrations nav.
5. **Theme toggle:** Preview uses labeled Dark|Light; STG uses icon toggle — acceptable if tokens match; prefer visual weight/placement parity with preview footer.
6. **Login light:** Restore dark branded hero in light theme (match preview), cream/dark CTA per theme, drop prototype banner on product STG (or gate to preview builds only).
7. **Child tickets OK** per screen cluster if PRs would be huge — link back to #125; parent stays open until portfolio ≥95 or signed deferrals.

## Freeze

- Routes / `data-testid`s / APIs: unchanged unless a screen ticket owns them.
- Preview Vercel SoT: read-only.
- No Mode A polish claimed complete until screenshots re-captured post-implement.

## Upstream skills used

- `ux-loop` Mode B, `ux-browser-review`, `ux-architect` (framing / IA / freeze)
