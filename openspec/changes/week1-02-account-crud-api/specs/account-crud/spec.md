# Account CRUD (Week1-02)

## Requirements

### Requirement: Account create API
The API SHALL accept account creation with name, code, and SLA day fields and SHALL reject duplicate codes.

#### Scenario: Create account
- **WHEN** client POSTs valid account JSON
- **THEN** response is 201 with persisted account id

#### Scenario: Duplicate code
- **WHEN** client POSTs a code that already exists
- **THEN** response is 409

### Requirement: Account list and search
The API SHALL list accounts ordered by name and SHALL filter by optional search query on name or code.

#### Scenario: Search by code fragment
- **WHEN** client GETs `/api/accounts?q=acme`
- **THEN** matching accounts are returned

### Requirement: Account update
The API SHALL update an existing account by id or return 404.

### Requirement: React account shell
The web app SHALL provide demo login, account create form, and searchable list backed by the API.
