#!/usr/bin/env bash
# rollback.sh — Production Rollback Script
#
# Reverts to the version recorded in PREVIOUS_VERSION, rebuilds,
# and performs a zero-downtime PM2 reload with health verification.
#
# Usage:
#   chmod +x .propel/scripts/rollback.sh
#   ./.propel/scripts/rollback.sh
#
# Environment variables (override with export):
#   APP_DIR        — application root (default: repo server/)
#   HEALTH_URL     — health-check URL (default: http://localhost:3001/api/health)
#   PM2_APP_NAME   — PM2 process name (default: upaci-backend)
#
# @task US_050 task_003 - Deployment Pipeline Automation

set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/server}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3001/api/health}"
PM2_APP_NAME="${PM2_APP_NAME:-upaci-backend}"
MAX_HEALTH_ATTEMPTS=15
HEALTH_INTERVAL=2

echo "=============================="
echo " PRODUCTION ROLLBACK"
echo " $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=============================="

cd "$APP_DIR"

# ── Read previous version ───────────────────────────────
if [[ ! -f PREVIOUS_VERSION ]]; then
  echo "ERROR: PREVIOUS_VERSION file not found in $(pwd)"
  echo "Cannot determine rollback target."
  exit 1
fi

PREVIOUS=$(cat PREVIOUS_VERSION)
echo "[1/5] Rolling back to: $PREVIOUS"

# ── Checkout previous version ───────────────────────────
echo "[2/5] Checking out previous version..."
git checkout "$PREVIOUS"

# ── Install & build ─────────────────────────────────────
echo "[3/5] Installing dependencies..."
npm ci --omit=dev

echo "[4/5] Building TypeScript..."
npm run build

# ── Zero-downtime reload ────────────────────────────────
echo "[5/5] Reloading PM2 (zero-downtime)..."
pm2 reload "$PM2_APP_NAME"
sleep 5

# ── Health-check verification ───────────────────────────
echo "Verifying health check..."
HEALTHY=false
for i in $(seq 1 $MAX_HEALTH_ATTEMPTS); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    HEALTHY=true
    echo "  ✓ Health check passed (attempt $i/$MAX_HEALTH_ATTEMPTS)"
    break
  fi
  echo "  … Health check returned $HTTP_CODE, retrying in ${HEALTH_INTERVAL}s ($i/$MAX_HEALTH_ATTEMPTS)"
  sleep "$HEALTH_INTERVAL"
done

if [ "$HEALTHY" = true ]; then
  echo ""
  echo "=============================="
  echo " ✓ ROLLBACK SUCCESS"
  echo "   Reverted to: $PREVIOUS"
  echo "=============================="
  exit 0
else
  echo ""
  echo "=============================="
  echo " ✗ ROLLBACK FAILED"
  echo "   Health check did not return 200"
  echo "   Manual intervention required"
  echo "=============================="
  exit 1
fi
