# Assumptions — apto#47

## ASSUMPTION-471 Worker poll interval and backoff

`QboSyncQueueWorker` SHALL use a fixed poll interval of **10 seconds** between dequeue attempts.
After a failed automatic attempt, the row SHALL not be eligible for resend until
`30 × 2^(Attempts-1)` seconds have elapsed since the last attempt (30s, 60s, 120s, 240s for
attempts 1–4 before the 5th try). Manual retry (BR-1204) bypasses backoff.

## ASSUMPTION-472 Manual sync endpoint

`POST /api/accounts/{id}/qbo-sync` (Demo2-Plan §7) SHALL enqueue an `UpdateCustomer` (or
`CreateCustomer` when `QboCustomerId` is null) request and return HTTP 202 with the new request
id. It is not required to block until Sent.

## ASSUMPTION-473 QBO deep link

When `QboId` is present and connection has `RealmId`, the UI “Open in QuickBooks” link SHALL use
`https://app.sandbox.qbo.intuit.com/app/customerdetail?nameId={QboId}` (sandbox). Production URL
is out of scope.

## ASSUMPTION-474 List API query params

`GET /api/qbo/requests` accepts optional `status` (`Pending`, `Processing`, `Sent`, `Failed`) and
`type` (operation enum from BR-1205). Default: no filter (all statuses). `page` default 1,
`pageSize` default 50, max 200 (aligned with apto#46 ASSUMPTION-464).

## ASSUMPTION-475 Admin auth

Mutating retry and viewing the queue follow Demo 2: SPA demo login gate only; API has no role
middleware in this slice (same as ASSUMPTION-465 on apto#46).

## ASSUMPTION-476 Processing status visibility

`Processing` is a short-lived worker state; list API MAY include it for observability. UI filter
defaults exclude `Processing` unless user selects “All”.
