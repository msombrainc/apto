# Business rules — F11

## BR-F11-001 Fee schedule source

Billable unit rates come from `Account.Settings.fees` (same keys as account edit UI).

## BR-F11-002 One-way send

After status leaves Draft/Queued for Sent, Demo 2 does not allow edit; new send creates another invoice row.

## BR-F11-003 QBO prerequisite

Send is blocked until `Account.QboCustomerId` is set; UI offers navigation to account QBO sync (F2).

## BR-F11-004 Queue contract

Enqueue uses existing `IQboSyncEnqueueService` with `Operation = CreateInvoice`,
`EntityType = ServiceInvoice`, `EntityId = serviceInvoiceId`.
