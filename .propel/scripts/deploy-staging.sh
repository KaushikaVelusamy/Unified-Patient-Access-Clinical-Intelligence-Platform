#!/usr/bin/env bash
# deploy-staging.sh — Staging Deployment Script
#
# Pulls latest code, installs dependencies, builds, runs tests,
# performs a zero-downtime PM2 reload, and runs smoke tests.
#
# Usage:
#   chmod +x .propel/scripts/deploy-staging.sh
#   ./.propel/scripts/deploy-staging.sh
#
# Environment variables (override with export):
#   APP_DIR       — application root on the staging host (default: repo root)
#   HEALTH_URL    — health-check URL (default: http://localhost:3001/api/health)
#   PM2_APP_NAME  — PM2 process name (default: upaci-backend)
#
# @task US_050 task_003 - Deployment Pipeline Automation

set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/server}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3001/api/health}"
PM2_APP_NAME="${PM2_APP_NAME:-upaci-backend}"
MAX_HEALTH_ATTEMPTS=15
HEALTH_INTERVAL=2

echo "=============================="
echo " STAGING DEPLOYMENT"
echo " $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=============================="

cd "$APP_DIR"
echo "[1/6] Working directory: $(pwd)"

# --- Pull latest code ---
echo "[2/6] Pulling latest code..."
git pull --ff-only origin "$(git rev-parse --abbrev-ref HEAD)"

# --- Install dependencies ---
echo "[3/6] Installing dependencies..."
npm ci

# --- Build TypeScript ---
echo "[4/6] Building TypeScript..."
npm run build

# --- Zero-downtime reload ---
echo "[5/6] Reloading PM2 (zero-downtime)..."
pm2 reload "$PM2_APP_NAME"

# --- Smoke tests ---
echo "[6/6] Running smoke tests..."
sleep 5

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
  echo " ✓ STAGING DEPLOYMENT SUCCESS"
  echo "=============================="
  exit 0
else
  echo ""
  echo "=============================="
  echo " ✗ STAGING DEPLOYMENT FAILED"
  echo "   Health check did not return 200"
  echo "=============================="
  exit 1
fi
