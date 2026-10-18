# Change: Design preview parity pass 3 (apto#125)

## Why

Pass 2 (#131) closed header lookup and KPI copy gaps; QA RETURN — matrix rows still below 95% on filter/toolbar density, jobs KPI interaction, and accounts SLA KPI formatting.

## What

- Jobs: SLA KPI cards toggle list filter (preview filter cards); Columns/Export move behind **More filters**.
- Inventory: secondary actions (columns, export, saved searches) behind **More tools**; shorter filter count line.
- Accounts: average SLA KPI shows whole days + preview-aligned sublabel.
- Shared: compact list table density + open-row chevron styling on accounts.

## Impact

- `JobsListV2.tsx`, `InventoryDashboard.tsx`, `AccountsDashboard.tsx`, `StatCard.tsx`, `styles.css`
- Contract tests `tests/web/apto-125-design-parity.test.ts`
