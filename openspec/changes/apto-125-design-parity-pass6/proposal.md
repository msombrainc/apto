# Change: Design preview parity pass 6 (apto#125)

## Why

Pass 5 (#134) fixed SLA bar-only + QBO btn-link; parent matrix still below 95%. Charter priority: Inventory KPI copy, admin filter-bar chrome, login light CTA.

## What

- Inventory primary KPI label **Matching** when any filter/search active (preview parity with Jobs).
- Reference Data + Part Numbers admin list cards use shared `FilterBar` (search + meta row).
- Login sign-in control: stable `data-testid` + explicit light-theme cream CTA on panel.

## Impact

- `inventoryFilters.ts`, `InventoryDashboard.tsx`, `ReferenceDataAdmin.tsx`, `PartNumbersAdmin.tsx`, `LoginPage.tsx`, `styles.css`
- Contract tests `tests/web/apto-125-design-parity.test.ts`
