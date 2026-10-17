# Business rules — job detail and edit (F3)

### BR-0301
**Ops status ordering:** Job detail Ops Status dropdown SHALL list active `job-status` reference
items sorted by `SortOrder` ascending, matching Demo2 seed order: Pickup Scheduled, In Transit,
Received, WIP, WIP Input Complete, Ops Complete with Exceptions, Ops Complete, Completed,
Canceled.

### BR-0302
**Ops status validation:** On `POST /api/jobs` and `PUT /api/jobs/{id}`, `opsStatus` MUST match an
active `job-status` reference `Code` or `Name` (case-insensitive). Empty/null ops status is
allowed unless a future slice makes it required.

### BR-0303
**Due date default:** When the client omits `dueDateUtc` on create or update, due date SHALL be
`startDateUtc` date plus the account's combined SLA days (Input + Settlement + Sales per existing
account SLA fields), same as current job create behaviour.

### BR-0304
**Due vs start:** `dueDateUtc` date SHALL NOT be before `startDateUtc` date; API returns
`dueDateUtc cannot be before startDateUtc.`

### BR-0305
**Asset-add confirmation (FR-34):** Treat ops status as restricted when normalized display name or
code matches **In Transit** (`IN-TRANSIT`) or **Ops Complete** (`OPS-COMPLETE`). Other statuses
(including Ops Complete with Exceptions) do not require the confirmation dialog for inline add.

### BR-0306
**Progress percent:** When total assets for the job is 0, `progressPercent` is 0. Otherwise
`round(finishedAssetCount / totalAssets * 100)` (aligned with F4 BR-0402 and
`JobAssetCountAggregator`).

### BR-0307
**Asset buckets:** Classify each asset status via reference data `asset-status` `Group`
(WIP | Finished | Exception). Unknown/null status counts toward WIP (F13 BR-1305).

### BR-0308
**Account change on job:** Changing `accountId` on update SHALL re-resolve SLA defaults from the
new account on the next save when due date is omitted; explicit due date on the request is kept
unless the client clears it.
