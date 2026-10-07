# Change: STG SQL connection + Account API on droplet

**Ticket:** apto#18  
**Status:** In progress

## Why

STG needs `/api/accounts` and the web shell on the shared DO host without running MSSQL on the 512MB droplet.

## What

- GitHub Actions secret `APTO_STG_CONNECTION_STRING` wired into `deploy-stg.yml` (SQL Server when set).
- When unset, CI writes SQLite `stg.env` so Account API + EF work on STG for demos.
- API selects SQL Server vs SQLite from the connection string; `apto.service` loads `stg.env`.

## Out of scope

Provisioning the SQL Server instance (operator secret); React UI changes; new API endpoints.
