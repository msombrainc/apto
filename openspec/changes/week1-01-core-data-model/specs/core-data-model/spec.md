# core-data-model

## ADDED Requirements

### Requirement: Account persistence

The system SHALL persist customer accounts with unique business codes and three SLA timer day-count fields.

#### Scenario: Account with SLA timers

- **WHEN** an account is saved with name, code, and three non-negative SLA day fields
- **THEN** the account row is retrievable by unique code

### Requirement: Job persistence

The system SHALL persist jobs linked to exactly one account with optional facility, status, and date fields.

#### Scenario: Job under account

- **WHEN** a job is saved with a valid account foreign key
- **THEN** the job can be loaded with its parent account

### Requirement: Asset persistence

The system SHALL persist assets linked to a job with optional serial number and part number reference.

#### Scenario: Asset on job

- **WHEN** an asset is saved for a job
- **THEN** the asset can be loaded with its job and optional part number

### Requirement: Part number and category stubs

The system SHALL persist categories and part numbers with unique names/numbers for Week-1 lookup stubs.

#### Scenario: Part number category link

- **WHEN** a part number references a category
- **THEN** the part number loads with its category

### Requirement: Schema migration

The system SHALL ship EF Core migrations and apply pending migrations on API startup outside the Testing environment.

#### Scenario: Docker compose startup

- **WHEN** the API starts with a SQL Server connection string
- **THEN** pending migrations are applied before serving traffic
