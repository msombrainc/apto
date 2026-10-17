# Change: F9 Browse Inventory v2 (apto#56)

## Why
Demo 2 requires paged cross-job inventory browse with extended filters, bulk code paste, export, and saved searches (Demo2-Plan §F9).

## What
- Extend `GET /api/assets` with paging, filters, `codes` lookup, and `categoryName` on rows.
- Upgrade Inventory UI: filters, paste panel, column chooser, CSV export, local saved searches, job links.

## Impact
- `src/Apto.Api/Assets/*`
- `apps/web` inventory module
- Related: #56
