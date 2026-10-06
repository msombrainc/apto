#!/usr/bin/env bash
# Poll GitHub PR checks until gate passes (Themis added when FOUND-1a enables full CI).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PR="${1:-}"
POLL="${2:-30}"
if [[ -z "$PR" || ! "$PR" =~ ^[0-9]+$ ]]; then
  echo "Usage: wait_pr_pipeline.sh <PR_NUMBER> [POLL_SEC]" >&2
  exit 2
fi

REPO="${GITHUB_REPOSITORY:-msombrainc/deca-scheduling}"
REQUIRED=("gate")
echo "Waiting on PR #$PR in $REPO (required: ${REQUIRED[*]}; poll ${POLL}s)..."

while true; do
  JSON="$(gh pr checks "$PR" -R "$REPO" --json name,bucket,state 2>/dev/null || echo '[]')"
  FAIL=0
  PENDING=0
  for name in "${REQUIRED[@]}"; do
    bucket="$(echo "$JSON" | NAME="$name" python3 -c '
import json,os,sys
want=os.environ["NAME"]
for x in json.load(sys.stdin):
  if x.get("name")==want:
    print((x.get("bucket") or x.get("state") or "").lower())
    break
')"
    if [[ -z "$bucket" ]]; then
      PENDING=1
      continue
    fi
    if echo "$bucket" | grep -qE 'fail|failure|cancel|timed'; then
      FAIL=1
    elif echo "$bucket" | grep -qE 'pass|success|skip'; then
      :
    else
      PENDING=1
    fi
  done
  if [[ "$FAIL" -eq 1 ]]; then
    echo "PR_PIPELINE_FAILED {\"pr\":${PR},\"repo\":\"${REPO}\"}"
    exit 1
  fi
  if [[ "$PENDING" -eq 0 ]]; then
    echo "PR_PIPELINE_GREEN {\"pr\":${PR},\"repo\":\"${REPO}\"}"
    exit 0
  fi
  sleep "$POLL"
done
