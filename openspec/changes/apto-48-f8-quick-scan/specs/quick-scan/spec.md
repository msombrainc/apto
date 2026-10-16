# quick-scan — delta (apto#48)

## ADDED Requirements

### REQ-1401 Asset identity and attributes

The system SHALL store human-readable `AptoId` and optional grade, status, and location on each
asset with migration, backfill, and STG SQLite parity.

#### Scenario: New asset receives AptoId

- **WHEN** a client creates an asset on a job
- **THEN** the response includes a unique `aptoId` assigned from the sequence

### REQ-1402 STG SQLite parity

The STG SQLite schema patcher SHALL add asset columns and indexes when absent.

#### Scenario: STG boot on older SQLite

- **WHEN** the API starts against SQLite without new asset columns
- **THEN** the patcher adds columns and indexes without manual SQL

### REQ-1403 Asset lookup by code

The API SHALL expose exact lookup by Apto ID or serial with 404 and 409 outcomes for not found and
ambiguous serial.

#### Scenario: Single match by serial

- **WHEN** a client GETs lookup with a serial that matches one asset
- **THEN** the response is 200 with asset summary fields

### REQ-1404 Asset attribute updates

PUT asset SHALL accept grade, status, and location with reference and facility validation and change
history.

#### Scenario: Valid location for facility

- **WHEN** a client PUTs a location id parented to the job facility
- **THEN** the response is 200 and change log records the location change

### REQ-1405 Operations scan UI

The web app SHALL provide a scanner-first scan page with presets, apply loop, session log, and undo.

#### Scenario: Successful scan updates asset

- **WHEN** the operator scans a valid code with a fixed-grade preset
- **THEN** the UI shows success within 1 second and the asset grade updates

### REQ-1406 Undo last scan

The scan UI SHALL revert the last successful apply using stored previous values.

#### Scenario: Undo after grade change

- **WHEN** the operator clicks undo after a successful grade change
- **THEN** the asset grade returns to the value before that scan

### REQ-1407 Performance

Lookup and scan apply paths SHALL meet documented p95 latency on seeded CI data.

#### Scenario: Lookup within budget

- **WHEN** integration tests run lookup against 10k seeded assets
- **THEN** p95 latency is at most 300 ms
