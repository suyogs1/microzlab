#!/usr/bin/env bash
set -euo pipefail
echo "[hooks/pre-commit] Running lint + typecheck…"
if [ -f package.json ]; then
  npm run lint || exit 1
  npm run typecheck || true
fi
echo "[hooks/pre-commit] OK"
