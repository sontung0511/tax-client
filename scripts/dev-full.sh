#!/usr/bin/env bash
set -euo pipefail

frontend_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backend_dir="${TAX_BACKEND_DIR:-$(cd "$frontend_dir/../tax-service-backend" && pwd)}"

(cd "$backend_dir" && exec make run) &
backend_pid=$!
cleanup() { kill "$backend_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

cd "$frontend_dir"
exec npm run dev
