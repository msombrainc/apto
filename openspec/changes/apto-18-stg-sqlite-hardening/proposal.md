# Change: STG SQLite deploy hardening (apto#18)

## Why

Follow-on to merged STG SQLite fallback (#22): isolate droplet env writes in a script (Themis isolation), unit-test `DatabaseProvider`, and assert Production SQLite skips EF migrations.

## What

- `write-stg-sqlite-env.sh` invoked from deploy-stg workflow
- Tests: `DatabaseProviderTests`, SQLite migration skip in `MigrationStartupTests`

## Ticket

Related: #18
