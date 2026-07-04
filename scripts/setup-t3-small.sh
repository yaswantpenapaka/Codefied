#!/bin/bash
# Codefied production setup — Amazon Linux 2023, t3.small
# Run on a fresh EC2 instance after attaching Elastic IP.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/yaswantpenapaka/Codefied.git}"
APP_DIR="${APP_DIR:-/home/ec2-user/codefied}"

echo "==> System packages"
sudo dnf update -y
sudo dnf install -y git nginx gcc gcc-c++ python3 java-21-amazon-corretto-devel docker

echo "==> Node.js 20 + PM2"
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
sudo npm install -g pm2

echo "==> Docker + Redis (internal only)"
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user

echo "==> Swap (helps under memory spikes)"
if ! swapon --show | grep -q '/swapfile'; then
  sudo fallocate -l 1G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi
sudo sysctl -w vm.swappiness=10

echo "==> Clone / update app"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"
git pull

echo "==> Environment file"
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "IMPORTANT: Edit $APP_DIR/.env with MONGO_URI, JWT secrets, FRONTEND_URL, COOKIE_SECURE=true"
  echo "Then re-run: bash scripts/setup-t3-small.sh"
  exit 1
fi

echo "==> Redis container"
docker compose up -d redis

echo "==> Backend dependencies"
cd backend
npm ci --omit=dev

echo "==> PM2 process"
pm2 delete codefied-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user | bash || true

echo "==> Nginx reverse proxy"
sudo cp "$APP_DIR/deploy/nginx/codefied.conf" /etc/nginx/conf.d/codefied.conf
sudo rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo ""
echo "========================================"
echo "  Codefied t3.small setup complete"
echo "========================================"
echo "1. Security group: TCP 22 (your IP), TCP 80 (0.0.0.0/0)"
echo "2. Close port 4000 publicly — nginx proxies on :80"
echo "3. Test: curl http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/health"
echo "4. Update frontend/vercel.json rewrite to:"
echo '   "destination": "http://YOUR_ELASTIC_IP/api/:path*"'
echo "5. Vercel env: FRONTEND_URL=https://codefied-nine.vercel.app, COOKIE_SECURE=true"
echo "6. Seed problems (optional): cd backend && npm run seed:problems"
echo "========================================"