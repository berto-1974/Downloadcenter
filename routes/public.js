const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../lib/db');
const { decryptStream } = require('../lib/crypto');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// POST /api/files — Passwort prüfen und Dateien der Gruppe zurückgeben
router.post('/files', async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Passwort erforderlich' });
  }

  const db = getDb();
  const groups = db.prepare('SELECT * FROM upload_groups').all();

  let matchedGroup = null;
  for (const group of groups) {
    const match = await bcrypt.compare(password, group.password_hash);
    if (match) {
      matchedGroup = group;
      break;
    }
  }

  if (!matchedGroup) {
    return res.status(401).json({ error: 'Falsches Passwort' });
  }

  const files = db.prepare(
    'SELECT id, original_name, mimetype, size, created_at FROM files WHERE group_id = ? ORDER BY created_at DESC'
  ).all(matchedGroup.id);

  res.json({
    group: { id: matchedGroup.id, name: matchedGroup.name },
    files
  });
});

// GET /api/download/:fileId — Datei herunterladen
router.get('/download/:fileId', (req, res) => {
  const db = getDb();
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.fileId);

  if (!file) return res.status(404).json({ error: 'Datei nicht gefunden' });

  const filePath = path.join(UPLOADS_DIR, file.stored_name);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Datei nicht auf dem Server gefunden' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
  res.setHeader('Content-Type', file.mimetype);

  if (file.encrypted && file.iv) {
    const [ivHex, authTagHex] = file.iv.split(':');
    const stream = decryptStream(filePath, ivHex, authTagHex);
    stream.on('error', () => res.status(500).end());
    stream.pipe(res);
  } else {
    res.sendFile(filePath);
  }
});

// GET /api/preview/:fileId — Bildvorschau (nur für Bilder)
router.get('/preview/:fileId', (req, res) => {
  const db = getDb();
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.fileId);

  if (!file) return res.status(404).json({ error: 'Datei nicht gefunden' });

  if (!file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Keine Bilddatei' });
  }

  const filePath = path.join(UPLOADS_DIR, file.stored_name);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Datei nicht auf dem Server gefunden' });
  }

  res.setHeader('Content-Type', file.mimetype);

  if (file.encrypted && file.iv) {
    const [ivHex, authTagHex] = file.iv.split(':');
    const stream = decryptStream(filePath, ivHex, authTagHex);
    stream.on('error', () => res.status(500).end());
    stream.pipe(res);
  } else {
    res.sendFile(filePath);
  }
});

// DELETE /api/files/:fileId — Datei löschen (öffentlich, mit Passwort-Bestätigung)
router.delete('/files/:fileId', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Passwort erforderlich' });
    }

    const db = getDb();
    const file = db.prepare(`
      SELECT f.*, g.password_hash
      FROM files f
      JOIN upload_groups g ON g.id = f.group_id
      WHERE f.id = ?
    `).get(req.params.fileId);

    if (!file) return res.status(404).json({ error: 'Datei nicht gefunden' });

    const match = await bcrypt.compare(password, file.password_hash);
    if (!match) return res.status(401).json({ error: 'Falsches Passwort' });

    const filePath = path.join(UPLOADS_DIR, file.stored_name);
    try { fs.unlinkSync(filePath); } catch {}

    db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
    res.json({ message: 'Datei gelöscht' });
  } catch (err) {
    console.error('Datei-Lösch-Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

module.exports = router;
