# Change: Design preview parity pass 9 (apto#125)

## Why

Pass 8 (#137) aligned inventory SoT; live preview Jobs & SLA and Accounts subtitles/KPI chrome still drift from the Vercel SoT.

## What

- Accounts list subtitle matches preview (“Every customer Apto collects…”).
- Jobs & SLA subtitle, KPI sublabels, search placeholder, and facility pills on the primary filter row (preview layout).
- Jobs table **Ops status** column header matches preview wording.

## Impact

- `App.tsx`, `JobsListV2.tsx`, `jobsListColumns.ts`
- Contract tests `tests/web/apto-125-design-parity.test.ts`
