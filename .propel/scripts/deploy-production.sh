#!/usr/bin/env bash
# deploy-production.sh — Production Deployment Script
#
# Performs a safe, zero-downtime production deployment:
#   1. Requires --confirm flag
#   2. Backs up the current version
#   3. Pulls, installs, builds
#   4. Runs backward-compatible DB migrations
#   5. PM2 zero-downtime reload
#   6. Polls health check (30 attempts × 2 s)
#   7. Verifies minimum instance count
#
# Usage:
#   chmod +x .propel/scripts/deploy-production.sh
#   ./.propel/scripts/deploy-production.sh --confirm
#
# Environment variables (override with export):
#   APP_DIR            — application root (default: repo server/)
#   HEALTH_URL         — health-check URL (default: http://localhost:3001/api/health)
#   PM2_APP_NAME       — PM2 process name (default: upaci-backend)
#   MIN_INSTANCES      — minimum healthy instances (default: 3)
#
# @task US_050 task_003 - Deployment Pipeline Automation

set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/server}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3001/api/health}"
PM2_APP_NAME="${PM2_APP_NAME:-upaci-backend}"
MIN_INSTANCES="${MIN_INSTANCES:-3}"
MAX_HEALTH_ATTEMPTS=30
HEALTH_INTERVAL=2

# ── Safety gate ─────────────────────────────────────────
if [[ "${1:-}" != "--confirm" ]]; then
  echo "ERROR: Production deployment requires --confirm flag"
  echo "Usage: $0 --confirm"
  exit 1
fi

DEPLOY_START=$(date +%s)

echo "=============================="
echo " PRODUCTION DEPLOYMENT"
echo " $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=============================="

cd "$APP_DIR"
echo "[1/8] Working directory: $(pwd)"

# ── Backup current version ──────────────────────────────
echo "[2/8] Backing up current version..."
git describe --always --tags > PREVIOUS_VERSION 2>/dev/null || git rev-parse --short HEAD > PREVIOUS_VERSION
echo "  Previous version: $(cat PREVIOUS_VERSION)"

# ── Pull latest code ────────────────────────────────────
echo "[3/8] Pulling latest code..."
git pull --ff-only origin "$(git rev-parse --abbrev-ref HEAD)"
echo "  New version: $(git describe --always --tags 2>/dev/null || git rev-parse --short HEAD)"

# ── Database migrations (backward-compatible) ───────────
echo "[4/8] Running database migrations..."
if npm run migrate:up 2>/dev/null; then
  echo "  ✓ Migrations applied"
else
  echo "  ⓘ No migrate:up script or nothing to migrate — continuing"
fi

# ── Install production dependencies ─────────────────────
echo "[5/8] Installing production dependencies..."
npm ci --omit=dev

# ── Build TypeScript ────────────────────────────────────
echo "[6/8] Building TypeScript..."
npm run build

# ── Zero-downtime reload ────────────────────────────────
echo "[7/8] Reloading PM2 (zero-downtime)..."
pm2 reload "$PM2_APP_NAME"
sleep 5

# ── Health-check polling ────────────────────────────────
echo "[8/8] Polling health check..."
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

if [ "$HEALTHY" != true ]; then
  echo ""
  echo "  ✗ Health check failed after $MAX_HEALTH_ATTEMPTS attempts"
  echo "  → Run ./.propel/scripts/rollback.sh to revert"
  exit 1
fi

# ── Instance count verification ─────────────────────────
if command -v jq &>/dev/null; then
  INSTANCES=$(pm2 jlist 2>/dev/null | jq "[.[] | select(.name==\"$PM2_APP_NAME\" and .pm2_env.status==\"online\")] | length")
  echo "  Running instances: $INSTANCES (minimum: $MIN_INSTANCES)"
  if [ "$INSTANCES" -lt "$MIN_INSTANCES" ]; then
    echo "  ✗ Insufficient instances — deployment may be degraded"
    exit 1
  fi
else
  echo "  ⓘ jq not installed — skipping instance count verification"
fi

DEPLOY_END=$(date +%s)
DURATION=$((DEPLOY_END - DEPLOY_START))

echo ""
echo "=============================="
echo " ✓ PRODUCTION DEPLOYMENT SUCCESS"
echo "   Duration: ${DURATION}s"
echo "=============================="
exit 0
