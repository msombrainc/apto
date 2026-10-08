# Change: STG QuickBooks sandbox OAuth + bootstrap tokens (apto#40)

## Why

STG must run the Week-1 QBO integration against Intuit sandbox without manual OAuth on every deploy. Operators store sandbox app credentials and a long-lived refresh token in GitHub Actions secrets; deploy renders `stg.env` on the droplet and the API seeds `QboConnections` once at startup.

## What

- `deploy/droplet/render-stg-env.sh` — emits `QuickBooks__*` and optional `QuickBooks__Bootstrap*` from `APTO_STG_QBO_*` secrets (shared with `write-stg-sqlite-env.sh`)
- `QboConnectionBootstrap` — inserts singleton `QboConnections` row when bootstrap realm + refresh are configured and table is empty
- Deploy workflow copies rendered `stg.env` to the droplet before API restart

### Required GitHub secrets (when QBO enabled on STG)

| Secret | Maps to |
|--------|---------|
| `APTO_STG_QBO_CLIENT_ID` | `QuickBooks__ClientId` |
| `APTO_STG_QBO_CLIENT_SECRET` | `QuickBooks__ClientSecret` |
| `APTO_STG_QBO_REDIRECT_URI` | `QuickBooks__RedirectUri` (required when client id set) |
| `APTO_STG_QBO_REALM_ID` | `QuickBooks__BootstrapRealmId` |
| `APTO_STG_QBO_REFRESH_TOKEN` | `QuickBooks__BootstrapRefreshToken` |

## Limitations (STG sandbox only)

- Bootstrap runs **only when `QboConnections` is empty**. Rotating realm or refresh in secrets after first deploy does **not** update the row until STG DB row is cleared manually.
- Bootstrap refresh token is stored in droplet `stg.env` and SQLite — acceptable for sandbox STG, **not** a production pattern.

## Ticket

Related: #40
