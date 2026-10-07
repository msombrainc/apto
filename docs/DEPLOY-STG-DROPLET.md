# Apto STG — shared DigitalOcean droplet

Same host pattern as Pantheon / Kudos / Lab RM.

| Item | Value |
|------|--------|
| Host | `64.225.115.88` |
| **STG URL (factory / Argus)** | `http://64.225.115.88:3012` |
| App path | `/home/deploy/opt/apto` |
| Port | **3012** (public) |
| systemd | `systemctl --user` → `apto.service` |
| Deploy user | `deploy` |
| SSH key | `pantheon/.secrets/do_deploy_ed25519` (workspace) |

GitHub Actions secrets: `DO_DEPLOY_HOST`, `DO_DEPLOY_USER`, `DO_SSH_KEY`, `DO_KNOWN_HOSTS` (copy from pantheon/hackaton).

**Account API / EF on STG:** set `APTO_STG_CONNECTION_STRING` (SQL Server 2022+ reachable from the droplet). CI writes `~/.config/apto/stg.env` on each deploy; `apto.service` loads it. Without this secret, only `/api/health` works.

The shared droplet has **~512MB RAM** — do not run MSSQL in Docker there; use **managed / external SQL Server** (Azure SQL, RDS, or a dedicated DB VM).

## Bootstrap (no root)

**CI** runs `deploy/droplet/bootstrap-deploy.sh` over SSH if `~/opt/apto` is missing.

Manual:

```bash
bash scripts/bootstrap-stg-droplet.sh
```

## Optional: nip.io on port 80

Requires **root** once (`deploy/droplet/bootstrap-root.sh` via DO Console). Then you may use `http://apto.64.225.115.88.nip.io` and proxy to `:3012`. Factory defaults to **`:3012`** so deploy works without root.

## Deploy

`.github/workflows/deploy-stg.yml` on push to `main` or `workflow_dispatch`.

Health gate: `GET /api/health` JSON `buildId` = `github.sha`.

## Factory

- `dev-agent` / `qa-agent` `projects/apto` → `stg_url` / `STG_URL` = `http://64.225.115.88:3012`
