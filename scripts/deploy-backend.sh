#!/bin/bash
# Pull latest backend code and restart PM2 (does NOT rebuild Docker backend).
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/codefied}"
cd "$APP_DIR"

echo "==> Stop Docker backend if it is stealing port 4000"
docker rm -f codefied-backend 2>/dev/null || true

echo "==> Pull latest code"
git pull origin main

echo "==> Sync env for PM2"
cp -f .env backend/.env

echo "==> Install backend deps (if package.json changed)"
cd backend
npm install --omit=dev --no-audit --no-fund

echo "==> Restart PM2"
pm2 restart codefied-api || pm2 start ecosystem.config.cjs
pm2 save
sleep 2

echo "==> Health check (must show compileOncePerSubmission: true)"
curl -sf http://127.0.0.1:4000/api/health | python3 -m json.tool 2>/dev/null || curl -sf http://127.0.0.1:4000/api/health
echo ""
echo "Done. If compileOncePerSubmission is missing/false, PM2 is still on old code."