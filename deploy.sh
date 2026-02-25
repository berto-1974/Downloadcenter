#!/bin/bash
# =============================================================
# Deploy-Script für Download Center
# Ausführen auf dem Linux-Server als root oder mit sudo
# Voraussetzung: Node.js >= 18 muss installiert sein
# =============================================================

set -e

APP_DIR="/var/www/downloadcenter"
APACHE_CONF="/etc/apache2/sites-available/downloadcenter.conf"

echo "=== 1. Node.js Version prüfen ==="
node -v || { echo "FEHLER: Node.js ist nicht installiert!"; exit 1; }

echo "=== 2. PM2 global installieren (falls nicht vorhanden) ==="
npm install -g pm2 2>/dev/null || true

echo "=== 3. App-Verzeichnis erstellen ==="
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/uploads"
mkdir -p "$APP_DIR/database"

echo "=== 4. Dateien kopieren ==="
# Dieses Script geht davon aus, dass du die Dateien bereits
# per scp/rsync in /tmp/downloadcenter abgelegt hast.
# Befehl auf deinem lokalen PC (Beispiel):
#   scp -r . benutzer@server:/tmp/downloadcenter
cp -r /tmp/downloadcenter/server.js            "$APP_DIR/"
cp -r /tmp/downloadcenter/package.json         "$APP_DIR/"
cp -r /tmp/downloadcenter/ecosystem.config.js  "$APP_DIR/"
cp -r /tmp/downloadcenter/database/            "$APP_DIR/"
cp -r /tmp/downloadcenter/middleware/          "$APP_DIR/"
cp -r /tmp/downloadcenter/routes/             "$APP_DIR/"
cp -r /tmp/downloadcenter/public/             "$APP_DIR/"

# .env NICHT überschreiben falls bereits vorhanden (enthält Passwörter)
if [ ! -f "$APP_DIR/.env" ]; then
  cp /tmp/downloadcenter/.env "$APP_DIR/.env"
  echo "HINWEIS: .env wurde kopiert. Bitte Passwörter anpassen!"
else
  echo "INFO: .env existiert bereits, wird nicht überschrieben."
fi

echo "=== 5. npm install (ohne devDependencies) ==="
cd "$APP_DIR"
npm install --omit=dev

echo "=== 6. Berechtigungen setzen ==="
chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"
chmod 600 "$APP_DIR/.env"

echo "=== 7. Apache Module aktivieren ==="
a2enmod proxy
a2enmod proxy_http
a2enmod headers
a2enmod rewrite

echo "=== 8. Apache Virtual Host einrichten ==="
cat > "$APACHE_CONF" << 'APACHECONF'
<VirtualHost *:80>
    # DOMAIN HIER EINTRAGEN:
    ServerName deine-domain.de
    ServerAlias www.deine-domain.de

    # Alle Anfragen an Node.js weiterleiten
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3001/
    ProxyPassReverse / http://127.0.0.1:3001/

    # Sicherheits-Header
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options SAMEORIGIN

    ErrorLog ${APACHE_LOG_DIR}/downloadcenter_error.log
    CustomLog ${APACHE_LOG_DIR}/downloadcenter_access.log combined
</VirtualHost>
APACHECONF

a2ensite downloadcenter.conf
apache2ctl configtest && systemctl reload apache2

echo "=== 9. App mit PM2 starten ==="
cd "$APP_DIR"
pm2 delete downloadcenter 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

echo ""
echo "======================================"
echo "  Deployment abgeschlossen!"
echo "  App läuft auf Port 3001"
echo "  Apache leitet weiter von Port 80"
echo "======================================"
echo ""
echo "Nützliche Befehle:"
echo "  pm2 status               - App-Status anzeigen"
echo "  pm2 logs downloadcenter  - Logs anzeigen"
echo "  pm2 restart downloadcenter - App neu starten"
