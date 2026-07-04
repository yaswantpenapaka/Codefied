#!/bin/bash
# Run once on EC2 as root/sudo to reduce OOM freezes on t2.micro/t3.micro instances.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with: sudo bash scripts/ec2-optimize.sh"
  exit 1
fi

echo "==> Adding 1GB swap if missing..."
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 1G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=1024
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
fi

echo "==> Tuning swappiness for small instances..."
sysctl -w vm.swappiness=10
grep -q '^vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf

echo "==> Enabling Docker on boot..."
systemctl enable docker

echo "==> Done. Reboot recommended: sudo reboot"