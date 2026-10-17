# Business rules — jobs list v2

### BR-0401
**Open jobs default:** Ops status matching `completed`, `canceled`, or `in transit` (any case)
is excluded when `openOnly` filter is true (default).

### BR-0402
**Progress percent:** When total assets for a job is 0, `progressPercent` is 0. Otherwise
`round(finishedAssetCount / totalAssets * 100)`.

### BR-0403
**Asset buckets:** Classify each asset status via reference data `asset-status` group
(WIP | Finished | Exception). Unknown/null status counts toward WIP.

### BR-0404
**Days since start:** Whole days from `startDateUtc` (UTC date) to today UTC; null start → 0.
