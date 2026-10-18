# Change: Design preview parity pass 2 (apto#125)

## Why

Pass 1 (#129) closed the worst list-surface gaps; matrix rows still below 95% on detail/admin chrome and jobs KPI copy.

## What

- Hide global **Find asset** on account/job detail, admin, scan, and SLA surfaces (preview has no header lookup).
- Jobs list KPI: **Matching** vs **All jobs** when filters active (preview copy).
- Tokenize `.btn-link` / `.link-button` with `--aims-accent` (admin Edit/Deactivate no default browser blue).
- Job detail: back nav **← Jobs & SLA** aligned with page title.

## Impact

- `apps/web/src/App.tsx`, `JobsListV2.tsx`, `jobFilters.ts`, `JobDetailPage.tsx`, `styles.css`
- Contract tests `tests/web/apto-125-design-parity.test.ts`
