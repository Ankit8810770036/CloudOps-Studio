#!/usr/bin/env bash
# ==============================================================================
# Nagios Health Check & Alert Prober
# ==============================================================================

TARGET_IP="${1:-127.0.0.1}"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}   STEP 4: NAGIOS HEALTH PROBING & SERVICE MONITORING           ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo -e "${YELLOW}>> Target Node: ${TARGET_IP}${NC}"

# Check HTTP
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://${TARGET_IP}/healthz" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" == "200" ]; then
    echo -e "${GREEN}[OK] HTTP Service: Status 200 OK (Web Application Responding)${NC}"
else
    echo -e "${RED}[CRITICAL] HTTP Service: Status ${HTTP_STATUS} (Service Down or Unreachable)${NC}"
fi

# Check SSH
if nc -z -w 3 "$TARGET_IP" 22 2>/dev/null; then
    echo -e "${GREEN}[OK] SSH Service: Port 22 Open (Remote Administration Active)${NC}"
else
    echo -e "${YELLOW}[WARNING] SSH Service: Port 22 Timed Out or Firewalled${NC}"
fi

echo -e "${GREEN}✔ Nagios telemetry cycle completed.${NC}"

