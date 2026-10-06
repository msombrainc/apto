#!/usr/bin/env bash
# Upload bootstrap script to deploy@droplet:/tmp (root must run it once).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${DO_DEPLOY_HOST:-64.225.115.88}"
USER="${DO_DEPLOY_USER:-deploy}"
WORKSPACE_PANTHEON="${WORKSPACE_PANTHEON:-$ROOT/../../pantheon}"
KEY_FILE="${DO_SSH_KEY_FILE:-$WORKSPACE_PANTHEON/.secrets/do_deploy_ed25519}"
KH_FILE="${DO_KNOWN_HOSTS_FILE:-$WORKSPACE_PANTHEON/.secrets/known_hosts}"

SSHC="ssh -i $KEY_FILE -o BatchMode=yes -o IdentitiesOnly=yes -o UserKnownHostsFile=$KH_FILE"
SCP="scp -i $KEY_FILE -o BatchMode=yes -o IdentitiesOnly=yes -o UserKnownHostsFile=$KH_FILE"

$SCP "$ROOT/deploy/droplet/bootstrap-root.sh" "${USER}@${HOST}:/tmp/apto-bootstrap-root.sh"
$SSHC "${USER}@${HOST}" "chmod 755 /tmp/apto-bootstrap-root.sh"
echo "Uploaded /tmp/apto-bootstrap-root.sh on ${HOST}."
echo "DigitalOcean → Droplet → Access → Launch Droplet Console (root), then:"
echo "  bash /tmp/apto-bootstrap-root.sh"
