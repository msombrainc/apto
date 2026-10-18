# Change: Design preview parity pass 7 (apto#125)

## Why

Pass 6 (#135) cleared automatable contracts; live STG vs preview still drifts on Accounts list chrome (page title, KPI labels, table columns, SLA header, search placeholder).

## What

- Accounts list page title **Customer accounts** (preview SoT).
- Primary KPI label **Accounts** with sublabel **Active customers** when showing active records.
- Accounts table: drop **Status** column on list (status remains in More filters); SLA header matches preview wording.
- Average SLA KPI footnote **Receiving + processing + shipping**.
- Filter search placeholder **Filter by name or code**.

## Impact

- `App.tsx`, `AccountsDashboard.tsx`, `accountsKpiLabels.ts`, `StatCard.tsx`
- Contract tests `tests/web/apto-125-design-parity.test.ts`
