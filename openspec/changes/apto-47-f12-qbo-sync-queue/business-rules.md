# Business rules — F12 QuickBooks sync queue

## BR-1201 Single outbound path

After apto#47, application code outside the queue worker SHALL NOT invoke QBO HTTP APIs directly
for customer or invoice operations. Enqueue + worker dispatch only.

## BR-1202 FIFO pending order

The worker SHALL process `Pending` requests in ascending `CreatedAtUtc` order (oldest first).

## BR-1203 Attempt budget

Each request SHALL receive at most **5** automatic send attempts. When `Attempts` reaches 5 and the
last send fails, `Status` SHALL remain `Failed` until a user retry (BR-1204).

## BR-1204 Manual retry

`POST /api/qbo/requests/{id}/retry` SHALL be allowed only when `Status = Failed`. It SHALL set
`Status = Pending`, `Attempts = 0`, and enqueue the row for the next worker cycle.

## BR-1205 Operation types (Demo 2)

`Operation` SHALL be one of: `CreateCustomer`, `UpdateCustomer`, `CreateInvoice`. Filter label
`type` on list API maps to this field (ASSUMPTION-474).

## BR-1206 Entity link

`EntityType` SHALL be `Account` or `ServiceInvoice` (invoice type reserved for F11; no rows
required in apto#47). `EntityId` SHALL be the AIMS GUID primary key. List UI links to the in-app
record route for that entity.

## BR-1207 Account mirror fields

When a `CreateCustomer` or `UpdateCustomer` request for an `Account` reaches terminal success,
the worker SHALL set `Account.QboCustomerId`, `Account.QboSyncStatus = synced`, and clear
`Account.QboSyncError`. On terminal failure, `Account.QboSyncStatus = failed` and
`Account.QboSyncError` SHALL equal the request `LastError`.

## BR-1208 Non-blocking saves

`POST /api/accounts` and `PUT /api/accounts/{id}` SHALL return HTTP 2xx without waiting for QBO
response; they MAY return `qboSyncStatus = pending` when a queue row was created.

## BR-1209 Duplicate customer (QBO 6240)

When QBO returns duplicate name (error code **6240**), `LastError` SHALL include text that the
DisplayName already exists in QuickBooks and the row SHALL end `Failed` after attempt budget
unless user retries after fixing the account name.

## BR-1210 Prerequisite customer for invoice

`CreateInvoice` processing (F11) SHALL fail with a clear `LastError` when the job account has no
`QboCustomerId` — specified here so F11 shares the same error vocabulary; apto#47 MAY ship the
guard without creating invoice rows.
