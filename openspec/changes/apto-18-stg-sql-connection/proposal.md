# Change: STG SQL connection + Account API on droplet

**Ticket:** apto#18  
**Status:** In progress

## Why

STG currently serves `/api/health` only because the droplet has no `ConnectionStrings__Default`. Operators need `/api/accounts` and the web shell against real SQL on the shared DO host.

## What

- GitHub Actions secret `APTO_STG_CONNECTION_STRING` wired into `deploy-stg.yml`.
- CI writes `~/.config/apto/stg.env` on the droplet; `apto.service` loads it via `EnvironmentFile`.
- Document external/managed SQL requirement (no MSSQL on the 512MB droplet).

## Out of scope

Provisioning the SQL Server instance (operator secret); React UI changes; new API endpoints.
