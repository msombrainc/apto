# Business rules — F7 bulk unserialized

## BR-0701 Quantity

Quantity MUST be an integer from **1** to **500** inclusive.

## BR-0702 Part number

Operator MUST select an existing part number or the seeded **UNIDENTIFIED** preset.
Free-text new part numbers are out of scope for this slice (use single add or F6).

## BR-0703 Optional attributes

When grade, status, or location are set, values MUST pass the same validation as
`POST /api/jobs/{jobId}/assets` (active reference codes; location under job facility).

## BR-0704 API surface

No new REST endpoints; loop existing create. Seed `UNIDENTIFIED` part number idempotently at startup.

## BR-0705 Serial

Bulk creates MUST NOT send `serialNumber` (unserialized assets only).
