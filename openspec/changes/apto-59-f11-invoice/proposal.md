# Change: F11 Service invoice to QuickBooks

**Tracker:** msombrainc/apto#59 (SLICE-014, parent apto#43)  
**Change id:** `apto-59-f11-invoice`  
**Plan SoT:** `docs/planning/Demo2-Plan.md` §F11; FR-68, FR-75

## Problem

F3 **Service invoice** is a stub (`f3-action-invoice`). Demo 2 requires operators to preview
billable lines from the account fee schedule, adjust quantities, send to QuickBooks via the F12
queue, and see invoice history on the job.

## Desired outcome

1. **Preview** — `GET /api/jobs/{id}/invoice-preview` returns lines (service, qty, rate, amount,
   quantity hint) from account fees + job asset counts by status group.
2. **Send** — `POST /api/jobs/{id}/invoices` persists `ServiceInvoice`, enqueues `CreateInvoice`
   on `QboSyncRequest` (`EntityType = ServiceInvoice`).
3. **History** — `GET /api/jobs/{id}/invoices` lists invoices for the job.
4. **UI** — `/jobs/{jobId}/invoice` editor + send; F3 navigates here; status + QBO doc number when sent.
5. **Worker** — `ProcessCreateInvoiceAsync` processes queued invoice payloads (sandbox HTTP).

## Dependencies

- F2 account fees in settings JSON (apto#51).
- F3 job detail + assets (apto#53).
- F12 QBO queue (apto#47).

## Out of scope

Sales invoices to buyers, consignment remittance, edit-after-send, optional QBO balance panel.

## UX

`ux-charter-first` — `docs/ux/apto-59-f11-invoice-charter.md`.
