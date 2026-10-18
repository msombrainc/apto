# Change: Design preview parity pass 8 (apto#125)

## Why

Pass 7 (#136) aligned Accounts list chrome; live preview inventory still drifts on subtitle, KPI sublabels, filter placeholder, facility pills, and default table columns.

## What

- Inventory page subtitle matches preview (“Every asset received…”).
- KPI cards: preview sublabels on Assets / Created today / Accounts.
- Filter: “Filter by serial or part number” + account select + facility pills (All/GA/TX/CA).
- Default visible columns: Part number, Serial, Account, Facility, Job, Created (six).
- Jobs list: Ops column header shortened to “Ops”.

## Impact

- `App.tsx`, `InventoryDashboard.tsx`, `inventoryListColumns.ts`, `jobsListColumns.ts`, `FacilityPills.tsx`
- `tests/web/apto-125-design-parity.test.ts`
