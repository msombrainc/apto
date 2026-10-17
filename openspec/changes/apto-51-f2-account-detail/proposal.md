# Change: F2 Account detail and edit

**Tracker:** msombrainc/apto#51 (SLICE-006, parent apto#43)  
**Change id:** `apto-51-f2-account-detail`  
**Plan SoT:** `docs/planning/Demo2-Plan.md` §F2, §6–§7, §8; `Requirements-Extraction.md` FR-9–12, 16–17

## Problem

Accounts are created and listed in Demo 1, but operators cannot open a record, edit fees/rules/
billing address, audit changes, or manage QBO sync from one screen. Search lacks status and SLA
columns required for client demos. Internal SLA naming does not match client terminology.

## Desired outcome

1. **Extend `Account`** with `Status` and `Settings` JSON; add **`AccountChangeLog`** (asset log
   parity).
2. **APIs** — `GET /api/accounts/{id}`, `GET /api/accounts/{id}/changes`; extend list + `PUT`/
   `POST` DTOs; QBO enqueue on name/billing address change only; manual sync unchanged.
3. **Account detail/edit UI** — full profile, fee schedule, rules/services (storage only), billing
   address, change history, jobs list, QuickBooks panel.
4. **Accounts search UI** — status filter, new columns, deep link to detail; SLA label rename.

## Dependencies

- **F12 (apto#47)** — QBO customer create/update via queue (no inline HTTP on save).
- **F1 (apto#49)** — routing shell; account detail route must register in module map / router.
- **F3 (future)** — job detail links from account jobs table (stub or minimal job route acceptable
  if F3 not merged; link target specified in implement tasks).

## Out of scope (this slice)

- Rule enforcement in processing workflows (OOS-0201).
- FR-13–15 custom fields, reports, price deductions.
- Optional QBO balance panel (OOS-0203).
- Roles and permission gates (Demo 2 single user).

## UX / design

- `ux-charter-first` on apto#51 — Athena specifies layout and visual design; Hermes defines
  **capabilities**, validation messages, `data-testid` hooks, and field inventory per Demo2-Plan §F2.
