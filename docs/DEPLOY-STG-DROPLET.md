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

**Account API / EF on STG (demo):** if `APTO_STG_CONNECTION_STRING` is **unset**, CI renders `deploy/droplet/render-stg-env.sh` (SQLite under `/home/deploy/opt/apto-data/apto.db`) and `scp`s `~/.config/apto/stg.env`. Optional QBO: `APTO_STG_QBO_*` GitHub secrets. For production-like STG, set `APTO_STG_CONNECTION_STRING` to SQL Server instead.

Local dev / CI tests still use **SQL Server** via `docker compose` or test factories.

## Bootstrap (no root)

**CI** runs `deploy/droplet/bootstrap-deploy.sh` over SSH if `~/opt/apto` is missing.

Manual:

```bash
bash scripts/bootstrap-stg-droplet.sh
```

## Optional: nip.io on port 80

Requires **root** once (`deploy/droplet/bootstrap-root.sh` via DO Console). Then you may use `http://apto.64.225.115.88.nip.io` and proxy to `:3012`. Factory defaults to **`:3012`** so deploy works without root.

## Deploy

`.github/workflows/deploy-stg.yml` on push to `main` or `workflow_dispatch`. The job runs `npm ci` + `npm run build` in `apps/web`, copies `dist/` into `src/Apto.Api/wwwroot`, then `dotnet publish` so Kestrel serves the React shell at `/` on the same port as `/api/*`.

Health gate: `GET /api/health` JSON `buildId` = `github.sha`.

## Factory

- `dev-agent` / `qa-agent` `projects/apto` → `stg_url` / `STG_URL` = `http://64.225.115.88:3012`
