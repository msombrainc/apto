#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
npm test
dotnet test Apto.sln --configuration Release --no-restore 2>/dev/null || dotnet test Apto.sln --configuration Release
