# Change: Filter bar layout (apto#121)

## Why
Filter rows overlapped or clipped at desktop widths; preview uses flex-wrap with aligned labels.

## What
- FilterBar CSS: flex-end alignment, meta margin-left auto, remove sticky filter max-height scroll trap.
- Regression tests in `filter-bar-layout.test.ts`.

## Impact
- `apps/web/src/styles.css`, list/admin filter surfaces.
