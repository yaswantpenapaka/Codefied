#!/bin/bash
# Codefied production setup — Amazon Linux 2023, t3.small
# Elastic IP: attach before running. Avoid old micro mistakes: no swap + Docker backend = OOM.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/yaswantpenapaka/Codefied.git}"
APP_DIR="${APP_DIR:-/home/ec2-user/codefied}"

require_env() {
  local key="$1"
  if ! grep -q "^${key}=" .env || grep -q "^${key}=.*change-me" .env || grep -q "^${key}=.*<" .env; then
    echo "ERROR: Set a real value for ${key} in $APP_DIR/.env"
    exit 1
  fi
}

echo "==> Preflight: memory & swap (old instance had 912MB RAM, 0 swap — do not repeat)"
MEM_MB=$(free -m | awk '/^Mem:/ {print $2}')
if [ "$MEM_MB" -lt 1500 ]; then
  echo "WARNING: Detected ${MEM_MB}MB RAM. t3.small should be ~1900MB."
  echo "If this is t2.micro, upgrade to t3.small before continuing."
  read -r -p "Continue anyway? [y/N] " ans
  [[ "${ans:-N}" =~ ^[Yy]$ ]] || exit 1
fi

echo "==> Swap first (before installing packages)"
if ! swapon --show | grep -q '/swapfile'; then
  sudo fallocate -l 1G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=1024 status=progress
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi
sudo sysctl -w vm.swappiness=10
grep -q '^vm.swappiness' /etc/sysctl.conf 2>/dev/null || echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf

echo "==> System packages"
sudo dnf update -y
sudo dnf install -y git nginx gcc gcc-c++ python3 java-21-amazon-corretto-devel docker

echo "==> Node.js 20 + PM2"
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
sudo npm install -g pm2

echo "==> Docker (Redis only — NOT full backend container)"
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker "$USER" || true

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
  echo "STOP: Edit $APP_DIR/.env then re-run this script."
  echo "Required:"
  echo "  MONGO_URI=mongodb+srv://..."
  echo "  JWT_ACCESS_SECRET=<long random>"
  echo "  JWT_REFRESH_SECRET=<long random>"
  echo "  FRONTEND_URL=https://codefied-nine.vercel.app"
  echo "  COOKIE_SECURE=true"
  echo "  REDIS_HOST=127.0.0.1"
  echo "  GOOGLE_GEMINI_API_KEY=<optional>"
  exit 1
fi

require_env MONGO_URI
require_env JWT_ACCESS_SECRET
require_env JWT_REFRESH_SECRET
require_env FRONTEND_URL

# Ensure Redis points at localhost for PM2 (not docker service name)
if ! grep -q '^REDIS_HOST=' .env; then
  echo 'REDIS_HOST=127.0.0.1' >> .env
fi
if ! grep -q '^COOKIE_SECURE=' .env; then
  echo 'COOKIE_SECURE=true' >> .env
fi

echo "==> Redis container (localhost:6379 only)"
docker compose up -d redis

echo "==> Backend dependencies"
cp -f .env backend/.env
cd backend
if [ -f package-lock.json ]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi

echo "==> PM2 process (no Docker backend — saves ~300MB RAM)"
pm2 delete codefied-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u "$USER" --hp "$HOME" | bash || true

echo "==> Nginx reverse proxy :80 -> :4000"
sudo cp "$APP_DIR/deploy/nginx/codefied.conf" /etc/nginx/conf.d/codefied.conf
sudo rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

sleep 2
PUBLIC_IP=$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 || echo "54.166.43.53")

echo ""
echo "========================================"
echo "  Codefied setup complete"
echo "========================================"
echo "Elastic IP:  $PUBLIC_IP"
echo "Health:        curl http://$PUBLIC_IP/api/health"
echo ""
echo "Security group (required):"
echo "  - TCP 22  from YOUR IP only"
echo "  - TCP 80  from 0.0.0.0/0"
echo "  - Do NOT open 4000 publicly"
echo ""
echo "Vercel (already set in repo):"
echo '  destination: http://54.166.43.53/api/:path*'
echo ""
echo "Vercel env vars:"
echo "  FRONTEND_URL=https://codefied-nine.vercel.app"
echo "  VERCEL_TOOLBAR=0"
echo ""
echo "Optional: cd backend && npm run seed:problems"
echo "Verify:   bash scripts/preflight-ec2.sh"
echo "========================================"

bash "$APP_DIR/scripts/preflight-ec2.sh" || true