# Apto STG — shared DigitalOcean droplet

Same host pattern as Pantheon / Kudos / Lab RM.

| Item | Value |
|------|--------|
| Host | `64.225.115.88` |
| STG URL | `http://apto.64.225.115.88.nip.io` |
| App path | `/opt/apto` |
| Port | **3012** |
| systemd | `apto.service` |
| Env | `/etc/apto.env` |
| Deploy user | `deploy` |
| SSH key | `pantheon/.secrets/do_deploy_ed25519` (workspace) |

GitHub Actions secrets (copy from **pantheon** or **hackaton**):

- `DO_DEPLOY_HOST` = `64.225.115.88`
- `DO_DEPLOY_USER` = `deploy`
- `DO_SSH_KEY` = private key (raw PEM or base64)
- `DO_KNOWN_HOSTS` = host key line(s)

`CURSOR_API_KEY` is already required for Themis (`review (Themis)` / `isolation (Themis)`).

## One-time (root on droplet)

Upload bootstrap from your machine:

```bash
bash scripts/push-droplet-bootstrap.sh
```

DigitalOcean → Droplet → **Access** → **Launch Droplet Console** as **root**:

```bash
bash /tmp/apto-bootstrap-root.sh
```

## Deploy

**CI:** `.github/workflows/deploy-stg.yml` on push to `main` (after secrets + bootstrap).

Argus / QA use `/api/health` `buildId` (same contract as hackaton).

## Factory after live

- `dev-agent/projects/apto/project.yaml` → `stg.base_url`
- `qa-agent/projects/apto/project.yaml` → `base_url` / `stack.stg_url`
- `qa-agent/projects/apto/.secrets/server.env` → `STG_URL=http://apto.64.225.115.88.nip.io` (drop `STG_SKIP` when health is green)

QuickBooks sandbox credentials stay in **local** `.secrets/qbo_sandbox.env` (engines + app) — never in GitHub Actions unless a dedicated secret is added later.
