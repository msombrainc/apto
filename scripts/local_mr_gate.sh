#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
npm test
if [ -f apps/web/package.json ]; then
  (cd apps/web && npm install --no-audit --no-fund && npm run build)
fi
dotnet test Apto.sln --configuration Release --no-restore 2>/dev/null || dotnet test Apto.sln --configuration Release
