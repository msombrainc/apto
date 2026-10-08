#!/usr/bin/env bash
# Print ~/.config/apto/stg.env lines for CI (secrets via env vars only).
set -euo pipefail

DATA_DIR="${APTO_DATA_DIR:-/home/deploy/opt/apto-data}"

if [[ -n "${APTO_STG_CONNECTION_STRING:-}" ]]; then
  printf '%s\n' "ConnectionStrings__Default=${APTO_STG_CONNECTION_STRING}"
else
  printf '%s\n' "ConnectionStrings__Default=Data Source=${DATA_DIR}/apto.db"
fi

if [[ -n "${APTO_STG_QBO_CLIENT_ID:-}" ]]; then
  : "${APTO_STG_QBO_CLIENT_SECRET:?APTO_STG_QBO_CLIENT_SECRET required when CLIENT_ID set}"
  redirect="${APTO_STG_QBO_REDIRECT_URI:-http://64.225.115.88:3012/api/qbo/oauth/callback}"
  printf '%s\n' "QuickBooks__ClientId=${APTO_STG_QBO_CLIENT_ID}"
  printf '%s\n' "QuickBooks__ClientSecret=${APTO_STG_QBO_CLIENT_SECRET}"
  printf '%s\n' "QuickBooks__RedirectUri=${redirect}"
  if [[ -n "${APTO_STG_QBO_REALM_ID:-}" ]]; then
    printf '%s\n' "QuickBooks__BootstrapRealmId=${APTO_STG_QBO_REALM_ID}"
  fi
  if [[ -n "${APTO_STG_QBO_REFRESH_TOKEN:-}" ]]; then
    printf '%s\n' "QuickBooks__BootstrapRefreshToken=${APTO_STG_QBO_REFRESH_TOKEN}"
  fi
fi
