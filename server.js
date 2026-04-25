require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');

// JWT_SECRET: Pflicht für Admin-Sessions — auto-generieren wenn nicht gesetzt
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('[WARNUNG] JWT_SECRET nicht gesetzt — zufälliger Schlüssel wird verwendet.');
  console.warn('          Admin-Sessions werden bei jedem Neustart ungültig.');
  console.warn('          Bitte JWT_SECRET in der .env-Datei setzen.');
}

const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 3000;

// Body-Parser für JSON und URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statische Dateien aus dem public-Ordner bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// API-Routen
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

// Datenbank beim Start initialisieren
require('./lib/db').getDb();

app.listen(PORT, () => {
  console.log(`Download Center läuft auf http://localhost:${PORT}`);
  console.log(`Admin-Bereich: http://localhost:${PORT}/admin.html`);
});
