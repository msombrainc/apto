# Change: STG SQLite schema evolution (apto#31)

## Why

STG demo SQLite databases created before apto#25 Jobs work use `EnsureCreated()`, which does not add new tables. Startup runs `DemoJobSeeder` against a missing `Jobs` table and the API never binds :3012. Older files may also lack QBO account columns, breaking `/api/accounts`.

## What

- Idempotent SQLite patch after `EnsureCreated()` for Jobs, QBO columns, and `QboConnections`
- Regression test: legacy SQLite file (Accounts only) starts and serves `/api/accounts`

## Ticket

Related: #31
