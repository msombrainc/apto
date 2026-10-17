# Requirements — apto#59 F11

## REQ-F11-001 Invoice preview API

`GET /api/jobs/{jobId}/invoice-preview` SHALL return `accountId`, `accountName`, `qboCustomerId`
(nullable), `lines[]` with `serviceKey`, `label`, `unitRate`, `defaultQuantity`, `quantityHint`,
and `lineTotal` for preview (default qty × rate).

## REQ-F11-002 Default quantities

Default qty rules: Audit = all assets on job; Wipe = assets with Wiped status; Shred = Shredded;
Recycle = Recycled; other fee keys default 0. Only services with a non-null fee on the account
appear.

## REQ-F11-003 Create invoice

`POST /api/jobs/{id}/invoices` body: `lines[]` (`serviceKey`, `quantity`), optional `note`.
SHALL validate quantities ≥ 0, at least one line with qty > 0, persist `ServiceInvoice` (Draft →
Queued on enqueue), enqueue `CreateInvoice` with JSON payload. SHALL return 400 when account has
no `QboCustomerId` with message offering sync.

## REQ-F11-004 List invoices

`GET /api/jobs/{id}/invoices` SHALL return invoices for the job ordered by `CreatedAtUtc` desc
with status, total, note, `qboDocNumber`, `qboInvoiceId`, sync error when failed.

## REQ-F11-005 QBO worker

`ProcessCreateInvoiceAsync` SHALL use `EntityType = ServiceInvoice`, load invoice row, call QBO
invoice create (or structured sandbox stub), update invoice + sync request on success/failure.

## REQ-F11-006 UI

Route `/jobs/:jobId/invoice`; F3 **Service invoice** navigates without stub modal. Editor shows
lines, hints, note, total, **Send to QuickBooks**, history list, link to QBO sync admin on failure.
