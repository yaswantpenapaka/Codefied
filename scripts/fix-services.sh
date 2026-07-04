#!/bin/bash
# Repair nginx, redis, and PM2 after a partial setup.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/codefied}"
cd "$APP_DIR"

echo "==> 1. Redis"
docker compose up -d redis
sleep 2
docker ps --filter name=codefied-redis

echo "==> 2. Sync .env into backend (PM2 cwd)"
cp -f .env backend/.env

echo "==> 3. Restart PM2 with repo-root env"
cd backend
npm install --omit=dev --no-audit --no-fund 2>/dev/null || true
pm2 delete codefied-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
sleep 3

echo "==> PM2 status"
pm2 status
echo "==> Last logs"
pm2 logs codefied-api --lines 20 --nostream || true

echo "==> 4. Test backend on :4000"
if curl -sf http://127.0.0.1:4000/api/health; then
  echo ""
  echo "Backend OK on :4000"
else
  echo "ERROR: Backend still down — check: pm2 logs codefied-api"
  echo "Common fixes: MONGO_URI in .env, JWT secrets, REDIS_HOST=127.0.0.1"
  exit 1
fi

echo "==> 5. Nginx"
cd "$APP_DIR"
sudo cp deploy/nginx/codefied.conf /etc/nginx/conf.d/codefied.conf
sudo rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "==> 6. Test nginx on :80"
curl -sf http://127.0.0.1/api/health && echo "" && echo "Nginx OK on :80"

PUBLIC_IP=$(curl -sf -H "X-aws-ec2-metadata-token: $(curl -sf -X PUT 'http://169.254.169.254/latest/api/token' -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')" http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "54.166.43.53")
echo ""
echo "Done. Test externally: curl http://${PUBLIC_IP}/api/health"
bash "$APP_DIR/scripts/preflight-ec2.sh"