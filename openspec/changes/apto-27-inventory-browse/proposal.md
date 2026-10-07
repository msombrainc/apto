# Change: Inventory browse (apto#27)

## Why
Week1 demo step 5 requires cross-job asset discovery (FR-47) after asset intake (#26).

## What
- `GET /api/assets` with search and account/facility/job filters
- React Inventory nav with filterable table and asset detail change log

## Impact
- `asset-inventory` capability spec delta
- `AssetEndpoints`, web `App.tsx`, API tests
