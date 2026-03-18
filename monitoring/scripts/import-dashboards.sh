#!/bin/bash

# UPACI Grafana Dashboard Import Script
# Imports dashboard JSON files via Grafana HTTP API
# Usage: ./import-dashboards.sh [grafana-url] [admin-user] [admin-password]

set -e

# Configuration
GRAFANA_URL="${1:-http://localhost:3000}"
ADMIN_USER="${2:-admin}"
ADMIN_PASSWORD="${3:-admin}"
DASHBOARD_DIR="$(dirname "$0")/../grafana/dashboards"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================"
echo "UPACI Dashboard Import Script"
echo "============================================"
echo ""
echo "Grafana URL: ${GRAFANA_URL}"
echo "Dashboard Directory: ${DASHBOARD_DIR}"
echo ""

# Check if Grafana is reachable
echo "Checking Grafana connectivity..."
if ! curl -s -o /dev/null -w "%{http_code}" "${GRAFANA_URL}/api/health" | grep -q "200"; then
    echo -e "${RED}ERROR: Cannot connect to Grafana at ${GRAFANA_URL}${NC}"
    echo "Ensure Grafana is running: docker-compose ps"
    exit 1
fi
echo -e "${GREEN}✓ Grafana is reachable${NC}"
echo ""

# Verify credentials
echo "Verifying admin credentials..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -u "${ADMIN_USER}:${ADMIN_PASSWORD}" "${GRAFANA_URL}/api/org")
if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}ERROR: Invalid credentials (HTTP ${HTTP_CODE})${NC}"
    echo "Check ADMIN_USER and ADMIN_PASSWORD"
    exit 1
fi
echo -e "${GREEN}✓ Credentials verified${NC}"
echo ""

# Check if dashboard directory exists
if [ ! -d "$DASHBOARD_DIR" ]; then
    echo -e "${RED}ERROR: Dashboard directory not found: ${DASHBOARD_DIR}${NC}"
    exit 1
fi

# Count dashboard files
DASHBOARD_COUNT=$(find "$DASHBOARD_DIR" -name "*.json" | wc -l)
if [ "$DASHBOARD_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}WARNING: No dashboard JSON files found in ${DASHBOARD_DIR}${NC}"
    exit 0
fi

echo "Found ${DASHBOARD_COUNT} dashboard(s) to import"
echo ""

# Import each dashboard
IMPORT_SUCCESS=0
IMPORT_FAILED=0

for DASHBOARD_FILE in "$DASHBOARD_DIR"/*.json; do
    DASHBOARD_NAME=$(basename "$DASHBOARD_FILE" .json | sed 's/upaci-//' | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
    echo "Importing: ${DASHBOARD_NAME}"
    
    # Read dashboard JSON
    DASHBOARD_JSON=$(cat "$DASHBOARD_FILE")
    
    # Get folder ID (create if doesn't exist)
    FOLDER_TITLE="UPACI Monitoring"
    FOLDER_RESPONSE=$(curl -s -X GET "${GRAFANA_URL}/api/folders" \
        -H "Content-Type: application/json" \
        -u "${ADMIN_USER}:${ADMIN_PASSWORD}")
    
    FOLDER_UID=$(echo "$FOLDER_RESPONSE" | grep -o '"uid":"[^"]*","title":"'"$FOLDER_TITLE"'"' | grep -o '"uid":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$FOLDER_UID" ]; then
        echo "  Creating folder: ${FOLDER_TITLE}"
        FOLDER_CREATE=$(curl -s -X POST "${GRAFANA_URL}/api/folders" \
            -H "Content-Type: application/json" \
            -u "${ADMIN_USER}:${ADMIN_PASSWORD}" \
            -d "{\"title\": \"${FOLDER_TITLE}\"}")
        FOLDER_UID=$(echo "$FOLDER_CREATE" | grep -o '"uid":"[^"]*"' | head -1 | cut -d'"' -f4)
    fi
    
    # Prepare import payload
    IMPORT_PAYLOAD=$(jq -n \
        --argjson dashboard "$DASHBOARD_JSON" \
        --arg folderUid "$FOLDER_UID" \
        '{
            dashboard: $dashboard,
            folderUid: $folderUid,
            overwrite: true
        }')
    
    # Import dashboard
    IMPORT_RESPONSE=$(curl -s -X POST "${GRAFANA_URL}/api/dashboards/db" \
        -H "Content-Type: application/json" \
        -u "${ADMIN_USER}:${ADMIN_PASSWORD}" \
        -d "$IMPORT_PAYLOAD")
    
    # Check import result
    if echo "$IMPORT_RESPONSE" | grep -q '"status":"success"'; then
        DASHBOARD_UID=$(echo "$IMPORT_RESPONSE" | grep -o '"uid":"[^"]*"' | head -1 | cut -d'"' -f4)
        DASHBOARD_URL="${GRAFANA_URL}/d/${DASHBOARD_UID}"
        echo -e "  ${GREEN}✓ Imported successfully${NC}"
        echo "  URL: ${DASHBOARD_URL}"
        ((IMPORT_SUCCESS++))
    else
        ERROR_MSG=$(echo "$IMPORT_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        echo -e "  ${RED}✗ Import failed: ${ERROR_MSG}${NC}"
        ((IMPORT_FAILED++))
    fi
    echo ""
done

# Summary
echo "============================================"
echo "Import Summary"
echo "============================================"
echo -e "Total: ${DASHBOARD_COUNT}"
echo -e "${GREEN}Success: ${IMPORT_SUCCESS}${NC}"
if [ "$IMPORT_FAILED" -gt 0 ]; then
    echo -e "${RED}Failed: ${IMPORT_FAILED}${NC}"
fi
echo ""

# Set dashboard permissions (Admin-only editing)
if [ "$IMPORT_SUCCESS" -gt 0 ]; then
    echo "Setting dashboard permissions (Admin-only editing)..."
    
    # Get all dashboards in UPACI Monitoring folder
    DASHBOARDS_IN_FOLDER=$(curl -s -X GET "${GRAFANA_URL}/api/search?folderUids=${FOLDER_UID}&type=dash-db" \
        -H "Content-Type: application/json" \
        -u "${ADMIN_USER}:${ADMIN_PASSWORD}")
    
    # Extract dashboard UIDs
    DASHBOARD_UIDS=$(echo "$DASHBOARDS_IN_FOLDER" | grep -o '"uid":"[^"]*"' | cut -d'"' -f4)
    
    for DASH_UID in $DASHBOARD_UIDS; do
        # Set permissions: Viewer=View, Admin=Edit
        PERM_PAYLOAD='{
            "items": [
                {
                    "role": "Viewer",
                    "permission": 1
                },
                {
                    "role": "Admin",
                    "permission": 2
                }
            ]
        }'
        
        curl -s -X POST "${GRAFANA_URL}/api/dashboards/uid/${DASH_UID}/permissions" \
            -H "Content-Type: application/json" \
            -u "${ADMIN_USER}:${ADMIN_PASSWORD}" \
            -d "$PERM_PAYLOAD" > /dev/null
        
        echo "  Set permissions for dashboard: ${DASH_UID}"
    done
    
    echo -e "${GREEN}✓ Permissions configured${NC}"
    echo ""
fi

# Final status
if [ "$IMPORT_FAILED" -eq 0 ]; then
    echo -e "${GREEN}All dashboards imported successfully!${NC}"
    echo ""
    echo "Access Grafana at: ${GRAFANA_URL}"
    exit 0
else
    echo -e "${YELLOW}Some dashboards failed to import. Check errors above.${NC}"
    exit 1
fi
