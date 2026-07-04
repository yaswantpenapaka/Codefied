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

IMDS_TOKEN=$(curl -sf -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60" 2>/dev/null || true)
if [ -n "$IMDS_TOKEN" ]; then
  PUBLIC_IP=$(curl -sf -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "unknown")
else
  PUBLIC_IP=$(curl -sf --max-time 2 http://169.254.169.254/latest/meta-data/public-ipv4 || echo "unknown")
fi
echo "Public IP: $PUBLIC_IP"

if curl -sf --max-time 3 "http://127.0.0.1:4000/api/health" >/dev/null 2>&1; then
  echo "PM2 backend: OK (localhost:4000)"
  BACKEND_OK=1
else
  echo "PM2 backend: NOT REACHABLE (localhost:4000)"
  BACKEND_OK=0
  WARN=1
fi

if curl -sf --max-time 3 "http://127.0.0.1/api/health" >/dev/null 2>&1; then
  echo "Nginx proxy: OK (localhost:80)"
elif [ "$BACKEND_OK" -eq 1 ]; then
  echo "Nginx proxy: backend up but :80 not responding"
  WARN=1
else
  echo "Nginx proxy: NOT REACHABLE (localhost:80)"
  WARN=1
fi

if [ "$PUBLIC_IP" != "unknown" ] && curl -sf --max-time 5 "http://${PUBLIC_IP}/api/health" >/dev/null 2>&1; then
  echo "External health: OK (http://${PUBLIC_IP}/api/health)"
else
  echo "External health: check security group allows TCP 80"
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

PM2_STATE=$(pm2 describe codefied-api 2>/dev/null | awk '/status/{print $4}' | head -1 || true)
if [ "$BACKEND_OK" -eq 1 ]; then
  echo "PM2 codefied-api: healthy (health endpoint responding)"
elif [ "$PM2_STATE" = "online" ]; then
  echo "PM2 codefied-api: online but health check failed — run: pm2 logs codefied-api"
  WARN=1
elif pm2 pid codefied-api >/dev/null 2>&1; then
  echo "PM2 codefied-api: process exists but unhealthy — run: pm2 logs codefied-api"
  WARN=1
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