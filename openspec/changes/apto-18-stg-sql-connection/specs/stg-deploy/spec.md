# STG deploy — SQL connection

## ADDED Requirements

### Requirement: STG loads database connection from deploy env file

The STG systemd unit SHALL load optional environment from `/home/deploy/.config/apto/stg.env` when present.

#### Scenario: Connection string applied on deploy

- **WHEN** CI deploy runs with `APTO_STG_CONNECTION_STRING` set
- **THEN** `stg.env` on the droplet contains `ConnectionStrings__Default=<secret>`
- **AND** `apto.service` restarts with EF migrations and `/api/accounts` enabled

#### Scenario: SQLite demo when secret unset

- **WHEN** `APTO_STG_CONNECTION_STRING` is unset
- **THEN** deploy writes `stg.env` with a SQLite file path under `/home/deploy/opt/apto-data/`
- **AND** `/api/accounts` works against that demo database (no SQL Server on the droplet)
