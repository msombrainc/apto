# Change: Design preview parity pass 4 (apto#125)

## Why

Pass 3 (#132) improved filter/toolbar density and KPI interactions; QA RETURN — matrix still below 95% on accounts SLA visualization, account detail chrome, KPI copy, and theme control labeling.

## What

- Accounts table: SLA column shows segmented bar only (no duplicate text line under bar).
- Account detail: preview-aligned header row (status pill + SLA bar, trimmed subtitle).
- Accounts KPI: average SLA sublabel `days`; active KPI sublabel only when search/filter narrows rows.
- Shell + login: labeled **Dark** / **Light** theme segment (preview footer parity).

## Impact

- `SlaSegmentBar.tsx`, `AccountsDashboard.tsx`, `AccountDetailPage.tsx`, `AppShell.tsx`, `LoginPage.tsx`, `styles.css`
- Contract tests `tests/web/apto-125-design-parity.test.ts`
