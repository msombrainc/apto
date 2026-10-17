# part-numbers-admin — delta (apto#50)

## ADDED Requirements

### REQ-1401 Paged part number catalog API

The API SHALL list part numbers with `q`, paging, sort (`number`, `categoryName`, `assetCount`),
and per-row `assetCount`.

#### Scenario: Paged list

- **WHEN** a client GETs `/api/part-numbers?page=1&pageSize=50`
- **THEN** the response includes `items`, `page`, `pageSize`, and `total`

### REQ-1402 Admin CRUD

The API SHALL support admin create/update via `categoryId`, 409 on duplicate create, and DELETE
with mandatory `replacementId` when assets reference the part number.

Admin POST omits JSON property `categoryName`; legacy search/create POST includes `categoryName`
and may return 200 with an existing row on duplicate. Clients MUST NOT send both shapes on one request.
Unpaged GET (query `q` only) remains supported for legacy callers (array response, default cap).

#### Scenario: Reassign on delete

- **WHEN** DELETE is called with a valid replacement and assets assigned
- **THEN** assets reference the replacement and each receives a `partNumber` change log entry

### REQ-1403 Part Numbers admin UI

The web app SHALL expose Admin → Part Numbers with search, sort, paging, add/edit modal, and
delete flows per the UX charter.

#### Scenario: Deep link

- **WHEN** the operator opens `/admin/part-numbers`
- **THEN** the part numbers admin page renders inside the AIMS shell
