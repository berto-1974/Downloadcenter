require('dotenv').config();
const express = require('express');
const path = require('path');

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
require('./database/init').getDb();

app.listen(PORT, () => {
  console.log(`Download Center läuft auf http://localhost:${PORT}`);
  console.log(`Admin-Bereich: http://localhost:${PORT}/admin.html`);
});
