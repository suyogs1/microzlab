#!/usr/bin/env bash
set -euo pipefail
echo "[hooks/ci-setup] Installing system deps if needed…"
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -y && sudo apt-get install -y build-essential python3-venv
fi
echo "[hooks/ci-setup] Done."
