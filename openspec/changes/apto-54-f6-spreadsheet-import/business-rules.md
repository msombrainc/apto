# Business rules — F6 spreadsheet import

## BR-0601 Row cap

Reject files with more than **500** data rows (excluding header).

## BR-0602 Part number

Every importable row MUST have a non-empty part number after mapping.

## BR-0603 Serial uniqueness

When serial is present: unique among all rows in the file; MUST NOT match an existing asset
code returned by `GET /api/assets/lookup?code=`.

## BR-0604 Reference values

When grade is present, it MUST match an active `grade` reference code (case-insensitive).
When category is present, it MUST match an active category **name** from `/api/categories`.

## BR-0605 Unknown part numbers

If part number is not found via part-number search:

- **Skip:** row marked skipped in preview; not imported.
- **Create:** create part number (optional category id) then create asset with that part.

## BR-0606 API surface

No new backend endpoints in Demo 2; reuse `POST /api/jobs/{jobId}/assets`, `POST /api/part-numbers`,
`GET /api/assets/lookup`, reference and category list APIs.
