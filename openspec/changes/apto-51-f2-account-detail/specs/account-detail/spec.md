# account-detail — delta (apto#51)

## ADDED Requirements

### REQ-0201 Account status and settings persistence

The system SHALL store per-account `Status` and structured `Settings` JSON on `Account` per
ASSUMPTION-511 and BR-0205.

#### Scenario: Migration adds columns

- **WHEN** the database is migrated for apto#51
- **THEN** `Accounts` has `Status` and `Settings` columns with Active defaults for existing rows

### REQ-0202 AccountChangeLog persistence

The system SHALL record account field changes in `AccountChangeLog` with the same audit fields as
`AssetChangeLog`.

#### Scenario: Log row on name change

- **WHEN** a client updates an account name via PUT
- **THEN** an `AccountChangeLog` row exists with `FieldName` Name and non-null `NewValue`

### REQ-0203 Account detail API

The API SHALL expose single-account read and change-history list endpoints.

#### Scenario: Not found

- **WHEN** a client GETs `/api/accounts/{unknown-guid}`
- **THEN** the response status is 404

#### Scenario: Changes pagination

- **WHEN** a client GETs `/api/accounts/{id}/changes?pageSize=25`
- **THEN** the response includes items array and respects ASSUMPTION-517 filters when provided

### REQ-0204 Account list and write extensions

List and write endpoints SHALL include status, settings summary, and validation per BR-0201–BR-0210.

#### Scenario: Status filter on list

- **WHEN** a client GETs `/api/accounts?status=Inactive`
- **THEN** only inactive accounts are returned

#### Scenario: Invalid apto percentage

- **WHEN** a client PUTs `settings.aptoPercentage` 150
- **THEN** the response status is 400 with a field-specific error

### REQ-0205 QuickBooks integration on save

Account PUT SHALL enqueue customer sync only for name or billing address changes and SHALL NOT
perform synchronous QBO HTTP (BR-0208, NFR-0201).

#### Scenario: Name change enqueues update

- **WHEN** a client changes only the account display name
- **THEN** a Pending `UpdateCustomer` queue row is created and the PUT returns 200 before send

### REQ-0206 Account detail user interface

The web app SHALL provide account detail/edit with fee schedule, rules, services, billing address,
change history, jobs list, and QuickBooks panel per FR-0212–FR-0217.

#### Scenario: Detail route

- **WHEN** the user opens `/accounts/{id}` from the accounts list
- **THEN** the detail page is shown with `data-testid="f2-account-detail-page"`

### REQ-0207 Accounts search enhancements

The accounts list SHALL support status filtering, extended columns, and SLA terminology per
FR-0218–FR-0219.

#### Scenario: Status filter in UI

- **WHEN** the user selects Inactive on the accounts status filter
- **THEN** the client requests `GET /api/accounts?status=Inactive` and updates the table

## MODIFIED Requirements

### REQ-0208 Account update QBO trigger (from week1 / F12 behavior)

Account PUT SHALL enqueue QuickBooks customer update when **name or billing address** changes, not
when only account code or SLA fields change.

#### Scenario: Code-only change

- **WHEN** a client changes only `code` on PUT
- **THEN** no new QboSyncRequest is created for that save
