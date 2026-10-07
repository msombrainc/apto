#!/usr/bin/env bash
# Run on the droplet as deploy user (via SSH). Writes SQLite demo stg.env.
set -euo pipefail

DATA_DIR="${APTO_DATA_DIR:-$HOME/opt/apto-data}"
mkdir -p "$DATA_DIR" "$HOME/.config/apto"
ENV_FILE="$HOME/.config/apto/stg.env"
printf '%s\n' "ConnectionStrings__Default=Data Source=${DATA_DIR}/apto.db" > "$ENV_FILE"
chmod 600 "$ENV_FILE"
echo "Wrote SQLite STG env: ${ENV_FILE}"
