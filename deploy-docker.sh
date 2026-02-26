#!/bin/bash
# =============================================================
# Ersteinrichtung für Download Center via Docker
# Nur EINMAL ausführen. Danach läuft alles über docker compose.
#
# Voraussetzungen:
#   - Docker und Docker Compose sind installiert
#   - GitHub Personal Access Token mit "Contents: Read" Berechtigung
#     erstellen unter: https://github.com/settings/tokens
# =============================================================

set -e

INSTALL_DIR="/volume1/docker/Downloadcenter"
GITHUB_RAW="https://raw.githubusercontent.com/berto-1974/Downloadcenter/main"

read -rsp "GitHub Personal Access Token eingeben: " GH_TOKEN
echo ""

echo "=== 1. Installationsverzeichnis anlegen ==="
mkdir -p "$INSTALL_DIR/uploads"
mkdir -p "$INSTALL_DIR/database"
cd "$INSTALL_DIR"

echo "=== 2. Dockerfile und docker-compose.yml herunterladen ==="
curl -fsSL -H "Authorization: token ${GH_TOKEN}" \
  "${GITHUB_RAW}/Dockerfile" -o Dockerfile

curl -fsSL -H "Authorization: token ${GH_TOKEN}" \
  "${GITHUB_RAW}/docker-compose.yml" -o docker-compose.yml

echo "=== 3. .env einrichten ==="
if [ ! -f ".env" ]; then
  curl -fsSL -H "Authorization: token ${GH_TOKEN}" \
    "${GITHUB_RAW}/.env.example" -o .env

  # GH_TOKEN direkt in die .env eintragen
  echo "" >> .env
  echo "GH_TOKEN=${GH_TOKEN}" >> .env

  echo ""
  echo "  WICHTIG: Bitte jetzt ADMIN_PASSWORD und JWT_SECRET anpassen:"
  echo "    nano ${INSTALL_DIR}/.env"
  echo ""
  echo "  Danach den Container starten mit:"
  echo "    cd ${INSTALL_DIR} && docker compose up -d --build"
  echo ""
  exit 0
fi

echo "=== 4. Container bauen und starten ==="
GH_TOKEN="${GH_TOKEN}" docker compose up -d --build

echo ""
echo "======================================"
echo "  Installation abgeschlossen!"
echo "  Erreichbar auf Port 3001"
echo "  Daten: ${INSTALL_DIR}"
echo "======================================"
echo ""
echo "Update-Befehl (nach neuem GitHub-Push):"
echo "  cd ${INSTALL_DIR} && docker compose up -d --build --no-cache"
