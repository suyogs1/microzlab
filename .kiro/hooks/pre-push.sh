#!/usr/bin/env bash
set -euo pipefail
echo "[hooks/pre-push] Running tests…"
if [ -f package.json ]; then
  npm test -- --silent || exit 1
fi
echo "[hooks/pre-push] OK"
