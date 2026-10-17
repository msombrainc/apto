# Assumptions — apto#51

## ASSUMPTION-511 Account.Settings JSON schema

`Account.Settings` SHALL be stored as JSON (SQL Server `nvarchar(max)` / SQLite TEXT) with this
canonical shape (camelCase in API):

```json
{
  "aptoPercentage": 0,
  "fees": {
    "audit": null,
    "wipe": null,
    "shred": null,
    "recycle": null,
    "bulk": null,
    "bulkRecycle": null,
    "storage": null,
    "teardown": null,
    "repair": null,
    "osInstall": null,
    "redeploy": null
  },
  "rules": {
    "requireProcessingApproval": false,
    "requireRecycleApproval": false,
    "requireSalesApproval": false,
    "redeployOnly": false,
    "redeployBypass": false,
    "shredAllDrives": false,
    "recycleOnly": false,
    "requireShredPictures": false,
    "requireDamagePictures": false
  },
  "services": {
    "osInstallImaging": false,
    "memoryInstall": false,
    "partsReplacement": false
  },
  "billingAddress": {
    "line1": "",
    "line2": null,
    "city": "",
    "state": "",
    "postalCode": "",
    "country": "US"
  }
}
```

Null or omitted fee keys mean **service not billed** (blank in UI). API returns the full object on
read; `PUT` accepts the full `settings` object and replaces stored JSON atomically.

## ASSUMPTION-512 Status defaults

Migration SHALL set `Account.Status = 'Active'` for all existing rows. New accounts default to
`Active` unless the create request specifies `Inactive`.

## ASSUMPTION-513 Changed-by identity

`AccountChangeLog.ChangedBy` SHALL be the fixed demo username `demo` (same as asset change log
until real auth exists).

## ASSUMPTION-514 QBO last sync time

`GET /api/accounts/{id}` SHALL expose `qboLastSyncAtUtc` as the `SentAtUtc` of the most recent
`QboSyncRequest` for that account with `Status = Sent` and operation `CreateCustomer` or
`UpdateCustomer`; null when none.

## ASSUMPTION-515 Routing

Account detail SHALL live at `/accounts/:accountId` with `data-testid="f2-account-detail-page"`.
Search list name link navigates to that route.

## ASSUMPTION-516 Create defaults

`POST /api/accounts` SHALL default SLA days to **30 / 30 / 60** (Input / Settlement / Sales) when
the client omits them or sends zero placeholders per existing create form behavior; `settings` MAY
default to ASSUMPTION-511 with `aptoPercentage: 0`.

## ASSUMPTION-517 Change log filters

`GET /api/accounts/{id}/changes` accepts optional `field` (exact `FieldName`) and `from` / `to` UTC
ISO date-time bounds on `ChangedAtUtc`. Default sort: `ChangedAtUtc` descending.

## ASSUMPTION-518 Jobs on detail page

Account detail loads jobs via `GET /api/jobs?accountId={id}` (existing endpoint). No new jobs
sub-resource is required for F2.
