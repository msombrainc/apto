#!/usr/bin/env bash
# Push feature branch and open GitHub PR (msombrainc token via GH_TOKEN).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TICKET="${1:-}"
if [[ -z "$TICKET" ]]; then
  echo "Usage: mr_push.sh <issue#> [title...]" >&2
  exit 2
fi

BRANCH="$(git branch --show-current)"
if [[ "$BRANCH" == "main" ]]; then
  echo "Refusing to push from main" >&2
  exit 1
fi

git push -u origin HEAD

TITLE="${*:2}"
if [[ -z "$TITLE" ]]; then
  TITLE="$(git log -1 --pretty=%s)"
fi

for gh_env in "$ROOT/.secrets/github.env" "$ROOT/../.secrets/github.env"; do
  if [[ -z "${GH_TOKEN:-}" && -f "$gh_env" ]]; then
    # shellcheck disable=SC1090
    source "$gh_env"
    export GH_TOKEN="${GITHUB_TOKEN:-$GH_TOKEN}"
    break
  fi
done

gh pr create --repo msombrainc/apto \
  --title "$TITLE" \
  --body "$(cat <<EOF
## Summary
Related: #${TICKET}

## Test plan
- [ ] \`npm run gate:mr\`
EOF
)"
echo "MR_PUSH_OK pr created for #${TICKET}"
