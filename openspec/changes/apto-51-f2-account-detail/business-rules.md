# Business rules — F2 account detail

## BR-0201 Account code uniqueness

`Code` SHALL remain unique among accounts (case-sensitive storage, trim on write). Duplicate code on
create or update returns HTTP **409** with `{ error }` naming the field.

## BR-0202 SLA day validation

`SlaReceivingDays`, `SlaProcessingDays`, and `SlaShippingDays` SHALL be integers **≥ 0** (whole
numbers). API property names stay as Demo 1; UI labels are Input / Settlement / Sales SLA.

## BR-0203 Apto percentage

`settings.aptoPercentage` SHALL be a number from **0 through 100** inclusive (integer or one decimal
allowed in UI; stored as number).

## BR-0204 Fee rates

Each fee in `settings.fees` SHALL be either **null** (not billed) or a number **≥ 0** with at most
**two** decimal places when serialized.

## BR-0205 Account status

`Status` SHALL be `Active` or `Inactive` only. Inactive accounts remain visible when status filter is
Both or Inactive; default search filter is **Active** only (ASSUMPTION-512).

## BR-0206 Rules and services storage only

Boolean account rules and service offerings SHALL be persisted and shown on the edit screen. The
system SHALL **not** block or alter asset/job processing based on these flags in Demo 2 (Demo2-Plan
§F2 **Not in Demo 2**).

## BR-0207 Change log on update

When `PUT /api/accounts/{id}` changes any persisted scalar or settings leaf value, the API SHALL
append one `AccountChangeLog` row per changed field with `OldValue` and `NewValue` as strings
(JSON-stringify for nested settings keys using dot paths, e.g. `settings.fees.audit`).

## BR-0208 QuickBooks enqueue on save

After a successful `PUT`, the API SHALL enqueue a QBO `UpdateCustomer` (or `CreateCustomer` when
`QboCustomerId` is null) **only** when `Name` or `settings.billingAddress` changed compared to the
pre-update snapshot. The HTTP response SHALL NOT wait for QBO completion (F12 queue).

## BR-0209 Billing address for QBO

When billing address is enqueued, payload SHALL include line1, city, state, postalCode, country for
sparse customer update per Demo2-Plan §8.

## BR-0210 List search status filter

`GET /api/accounts` SHALL accept optional `status` query: `Active`, `Inactive`, or `Both` (default
`Active`). Existing `q` search on name/code continues to apply in combination.
