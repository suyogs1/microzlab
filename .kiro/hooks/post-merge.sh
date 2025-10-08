#!/usr/bin/env bash
set -euo pipefail
echo "[hooks/post-merge] Syncing deps…"
if [ -f package-lock.json ]; then
  npm ci
elif [ -f requirements.txt ]; then
  pip install -r requirements.txt
fi
echo "[hooks/post-merge] Done."
