# Discovery — apto#51 F2 Account detail and edit

## Problem / outcome

Demo 1 lets users search accounts and create them inline, but there is **no detail or edit screen**.
Account SLA fields use internal API names (`SlaReceivingDays`, etc.) while operators speak Input /
Settlement / Sales SLA. Fee schedules, rules, service offerings, billing address, and change history
exist in the PRD but are not modeled or shown. QuickBooks sync status is only visible indirectly.

**Outcome:** operators open any account from search, view and edit the full Demo 2 account profile,
see jobs and QBO status, and audit changes — while **account rules are stored only** (not enforced in
processing until a later phase).

## Actors

- **Client services / ops manager** — maintains account profile, fees, and billing address before jobs run.
- **Finance** — confirms QBO customer sync and opens the customer in QuickBooks Sandbox.
- **Warehouse user** — opens account from search to jump to related jobs (read-only on account fields).

## Current state (post Demo 1 / partial F12)

| Area | Today |
|------|--------|
| `Account` entity | `Name`, `Code`, three SLA ints, QBO ids/status/error, `CreatedAtUtc`; no `Status`, no `Settings` JSON |
| API | `GET /api/accounts?q=`, `POST`, `PUT /{id}`, `POST /{id}/qbo-sync` (enqueue manual sync) |
| `PUT` | Updates name, code, SLAs; enqueues QBO update on **name or code** change only |
| UI | `AccountsDashboard` — search table (name, code, SLA bar), create modal; rows are **not** links |
| Change log | `AssetChangeLog` pattern exists; **no** `AccountChangeLog` |
| Jobs | `GET /api/jobs?accountId=` can list jobs for an account |

## Future state (F2)

- **Data:** `Account.Status` (`Active` / `Inactive`); `Account.Settings` JSON (apto %, fees, rules,
  services, billing address); `AccountChangeLog` table mirroring asset change log shape.
- **API:** `GET /api/accounts/{id}`, `GET /api/accounts/{id}/changes` (filterable); extended list +
  write DTOs; `PUT` writes change log and enqueues QBO **customer update** when name or billing
  address changes (never blocks on QBO — F12 queue).
- **UI:** Account detail/edit route (deep link), search enhancements (status filter, Apto %, SLA
  columns, link to detail), change-history panel, jobs sub-list with SLA flag, QuickBooks panel
  (sync now uses existing endpoint), SLA **labels** renamed to Input / Settlement / Sales.

## Constraints

- Demo2-Plan §F2: rules and service flags are **captured and displayed**, not enforced in asset/job
  processing (FR-13–15, custom fields, price deductions out of scope).
- Single demo user; no role-based field hiding.
- English, USD, US address formats; fee rates USD with two decimals.
- EF migration + `SqliteStgSchemaPatcher` parity (same pattern as F8/F12/F13).
- Depends on **F12 queue** (apto#47) for async QBO customer create/update — account save must not
  call QBO inline.

## Unknowns (resolved in assumptions)

- Canonical JSON shape for `Settings` → ASSUMPTION-511.
- Default `Status` for existing rows at migration → ASSUMPTION-512.
- Whether `PUT` includes full settings object or partial patch → ASSUMPTION-513.
- Last successful QBO sync timestamp on account vs queue row → ASSUMPTION-514.
- Account detail route path → ASSUMPTION-515.

## Draft in / out of scope

**In:** model + APIs + account detail/edit UI + search list update + change log + QBO panel +
label rename + tests.

**Out:** enforcing account rules in workflows; custom required fields; report configuration;
price-deduction tables; image-capture requirement flags beyond boolean storage in settings if not in
Demo2 F2 list (Demo2 lists rules/services only, not separate image flags in F2 **Not in Demo 2** —
image flags from FR-11 are **not** in Demo2 F2 scope).
