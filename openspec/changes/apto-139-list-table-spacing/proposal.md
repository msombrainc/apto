# Change: List table toolbar spacing (apto#139)

## Why
Operator STG crops show filter/toolbar rows colliding with table headers and cramped pagination.

## What
- Fix `.dashboard-panel:has(.data-table-wrap)` toolbar margins (filter-bar bottom margin was zero).
- Add separator + gap before `.data-table-wrap`; rhythm for pills/advanced filters.
- Unify paging/footer flex layout (inventory, reference, account detail).
- F8 scan label column gap.

## Impact
- `apps/web/src/styles.css`, regression tests `tests/web/apto-139-list-table-spacing.test.ts`.
