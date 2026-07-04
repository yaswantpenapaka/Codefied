#!/bin/bash
# Quick health check — run before/after deploy. Catches mistakes from the old micro instance.
set -euo pipefail

echo "=== Codefied EC2 preflight ==="

MEM_MB=$(free -m | awk '/^Mem:/ {print $2}')
SWAP_MB=$(free -m | awk '/^Swap:/ {print $2}')
AVAIL_MB=$(free -m | awk '/^Mem:/ {print $7}')
LOAD=$(uptime | awk -F'load average:' '{print $2}')

echo "Memory total:  ${MEM_MB} MB"
echo "Memory avail:  ${AVAIL_MB} MB"
echo "Swap total:    ${SWAP_MB} MB"
echo "Load average: ${LOAD}"

WARN=0

if [ "$MEM_MB" -lt 1500 ]; then
  echo "WARNING: Less than 1.5 GB RAM — this looks like t2.micro/t3.micro, not t3.small."
  echo "         Old instance had 912 MB and froze without swap. Upgrade to t3.small."
  WARN=1
fi

if [ "$SWAP_MB" -lt 512 ]; then
  echo "WARNING: No swap configured — OOM freezes are likely under load."
  echo "         Run: sudo bash scripts/ec2-optimize.sh"
  WARN=1
fi

PUBLIC_IP=$(curl -sf --max-time 2 http://169.254.169.254/latest/meta-data/public-ipv4 || echo "unknown")
echo "Public IP: $PUBLIC_IP"

if curl -sf --max-time 3 "http://127.0.0.1:4000/api/health" >/dev/null 2>&1; then
  echo "PM2 backend: OK (localhost:4000)"
elif curl -sf --max-time 3 "http://127.0.0.1/api/health" >/dev/null 2>&1; then
  echo "Nginx + backend: OK (localhost:80)"
else
  echo "Backend health: NOT REACHABLE locally"
  WARN=1
fi

if systemctl is-active nginx >/dev/null 2>&1; then
  echo "Nginx: running"
else
  echo "Nginx: not running"
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q codefied-redis; then
  echo "Redis container: running"
else
  echo "Redis container: not running"
fi

if pm2 pid codefied-api >/dev/null 2>&1; then
  echo "PM2 codefied-api: running"
else
  echo "PM2 codefied-api: not running"
  WARN=1
fi

echo "========================================"
if [ "$WARN" -eq 0 ]; then
  echo "Preflight PASSED"
else
  echo "Preflight found issues — fix before going live"
  exit 1
fi