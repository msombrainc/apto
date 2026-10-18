# Change: Design preview parity pass 5 (apto#125)

## Why

Pass 4 (#133) merged SLA bar-only + theme labels; Argus QA RETURN — accounts table still rendered `.sla-summary` for unset SLA rows in bar-only mode. Admin QBO links still used default anchor styling vs tokenized `btn-link`.

## What

- `SlaSegmentBar`: bar-only unset SLA uses `sla-empty` em dash (no `.sla-summary` in table cells).
- Shared `jobSlaPill.ts` for jobs list SLA status pill class + label formatting.
- QBO sync admin: internal + external actions use `btn-link` / React Router `Link`.

## Impact

- `SlaSegmentBar.tsx`, `jobSlaPill.ts`, `JobsListV2.tsx`, `QboSyncAdmin.tsx`, `styles.css`
- Contract tests `tests/web/apto-125-design-parity.test.ts`
