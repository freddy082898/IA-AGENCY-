#!/usr/bin/env bash
# Installation d'IA-AGENCY sur un VPS Ubuntu 24.04 (à lancer en root, une seule fois).
# Usage : curl -fsSL <raw-url>/deploy/install-vps.sh | bash   — ou —   bash install-vps.sh
set -euo pipefail

UTILISATEUR="agence"
DEPOT="https://github.com/freddy082898/IA-AGENCY.git"

echo "==> Mise à jour du système et paquets de base"
apt-get update -y && apt-get upgrade -y
apt-get install -y git curl unzip tmux ufw fail2ban php-cli php-mysql mariadb-client ca-certificates

echo "==> Pare-feu : seul SSH est ouvert"
ufw allow OpenSSH && ufw --force enable
systemctl enable --now fail2ban

echo "==> Node.js 22"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "==> WP-CLI"
curl -fsSL -o /usr/local/bin/wp https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x /usr/local/bin/wp

echo "==> Utilisateur dédié '$UTILISATEUR' (l'agence ne tourne jamais en root)"
id "$UTILISATEUR" &>/dev/null || adduser --disabled-password --gecos "" "$UTILISATEUR"

sudo -iu "$UTILISATEUR" bash <<EOF
set -euo pipefail
echo "==> Bun (requis par le plugin Telegram officiel)"
curl -fsSL https://bun.sh/install | bash

echo "==> Claude Code"
curl -fsSL https://claude.ai/install.sh | bash

echo "==> Clé SSH pour accéder aux hébergeurs clients"
[ -f ~/.ssh/id_ed25519 ] || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 -C "ia-agency"

echo "==> Récupération du dépôt"
[ -d ~/IA-AGENCY ] || git clone "$DEPOT" ~/IA-AGENCY
cd ~/IA-AGENCY/mcp/validation-telegram && npm ci --omit=dev
npx -y playwright install chromium
EOF

echo "==> Dépendances système de Chromium (tests Playwright)"
sudo -iu "$UTILISATEUR" bash -c "cd ~/IA-AGENCY && npx -y playwright install-deps chromium" || \
  npx -y playwright install-deps chromium

cp "/home/$UTILISATEUR/IA-AGENCY/deploy/ia-agency.service" /etc/systemd/system/ia-agency.service
systemctl daemon-reload

cat <<MSG

✅ Installation terminée. Étapes suivantes (voir deploy/VPS.md) :
  1. su - $UTILISATEUR
  2. cat ~/.ssh/id_ed25519.pub   → à ajouter chez chaque hébergeur client
  3. cd ~/IA-AGENCY && cp .env.example .env && nano .env
  4. claude                       → connexion à ton compte Claude + installation du plugin Telegram
  5. exit ; puis en root : systemctl enable --now ia-agency
MSG
