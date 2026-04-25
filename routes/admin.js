const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../lib/db');
const { requireAdmin } = require('../middleware/auth');
const { encryptFile } = require('../lib/crypto');

// Sicherstellen, dass der Uploads-Ordner existiert
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer-Konfiguration: Dateien mit UUID-Namen speichern
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB pro Datei
});

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(401).json({ error: 'Falsches Passwort' });

    const db = getDb();
    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password_hash');

    const valid = setting
      ? await bcrypt.compare(password, setting.value)
      : password === process.env.ADMIN_PASSWORD;

    if (!valid) return res.status(401).json({ error: 'Falsches Passwort' });

    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } catch (err) {
    console.error('Login-Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// POST /api/admin/change-password
router.post('/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Neues Passwort muss mindestens 4 Zeichen haben' });
    }

    const db = getDb();
    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password_hash');

    const valid = setting
      ? await bcrypt.compare(currentPassword, setting.value)
      : currentPassword === process.env.ADMIN_PASSWORD;

    if (!valid) return res.status(401).json({ error: 'Aktuelles Passwort falsch' });

    const hash = await bcrypt.hash(newPassword, 12);
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('admin_password_hash', hash);

    res.json({ message: 'Passwort erfolgreich geändert' });
  } catch (err) {
    console.error('Passwort-Änderung-Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// GET /api/admin/groups — Alle Gruppen mit Dateianzahl anzeigen
router.get('/groups', requireAdmin, (req, res) => {
  const db = getDb();
  const groups = db.prepare(`
    SELECT g.id, g.name, g.created_at,
           COUNT(f.id) AS file_count,
           MAX(COALESCE(f.encrypted, 0)) AS has_encrypted
    FROM upload_groups g
    LEFT JOIN files f ON f.group_id = g.id
    GROUP BY g.id
    ORDER BY g.created_at DESC
  `).all();
  res.json(groups);
});

// GET /api/admin/groups/:id/files — Dateien einer Gruppe anzeigen
router.get('/groups/:id/files', requireAdmin, (req, res) => {
  const db = getDb();
  const group = db.prepare('SELECT * FROM upload_groups WHERE id = ?').get(req.params.id);
  if (!group) return res.status(404).json({ error: 'Gruppe nicht gefunden' });

  const files = db.prepare('SELECT * FROM files WHERE group_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ group: { id: group.id, name: group.name, created_at: group.created_at }, files });
});

// POST /api/admin/upload — Neue Gruppe erstellen und Dateien hochladen
router.post('/upload', requireAdmin, upload.array('files'), async (req, res) => {
  const { groupName, groupPassword, encrypt } = req.body;
  const shouldEncrypt = encrypt === 'true';

  if (!groupName || !groupPassword) {
    if (req.files) req.files.forEach(f => fs.unlinkSync(f.path));
    return res.status(400).json({ error: 'Gruppenname und Passwort sind erforderlich' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Mindestens eine Datei ist erforderlich' });
  }

  try {
    const passwordHash = await bcrypt.hash(groupPassword, 12);

    // Dateien ggf. verschlüsseln (vor der DB-Transaktion)
    const fileData = [];
    for (const file of req.files) {
      let iv = null;
      if (shouldEncrypt) {
        const result = await encryptFile(path.join(UPLOADS_DIR, file.filename));
        iv = `${result.iv}:${result.authTag}`;
      }
      fileData.push({ file, iv });
    }

    const db = getDb();
    const insertGroup = db.prepare(
      'INSERT INTO upload_groups (name, password_hash) VALUES (?, ?)'
    );
    const insertFile = db.prepare(
      'INSERT INTO files (group_id, stored_name, original_name, mimetype, size, encrypted, iv) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const transaction = db.transaction(() => {
      const result = insertGroup.run(groupName, passwordHash);
      const groupId = result.lastInsertRowid;

      for (const { file, iv } of fileData) {
        insertFile.run(groupId, file.filename, file.originalname, file.mimetype, file.size, shouldEncrypt ? 1 : 0, iv);
      }

      return groupId;
    });

    const groupId = transaction();
    res.status(201).json({ message: 'Upload erfolgreich', groupId });
  } catch (err) {
    req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// POST /api/admin/groups/:id/files — Dateien zu bestehender Gruppe hinzufügen
router.post('/groups/:id/files', requireAdmin, upload.array('files'), async (req, res) => {
  const db = getDb();
  const group = db.prepare('SELECT * FROM upload_groups WHERE id = ?').get(req.params.id);

  if (!group) {
    if (req.files) req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
    return res.status(404).json({ error: 'Gruppe nicht gefunden' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Mindestens eine Datei ist erforderlich' });
  }

  const shouldEncrypt = req.body.encrypt === 'true';

  try {
    const fileData = [];
    for (const file of req.files) {
      let iv = null;
      if (shouldEncrypt) {
        const result = await encryptFile(path.join(UPLOADS_DIR, file.filename));
        iv = `${result.iv}:${result.authTag}`;
      }
      fileData.push({ file, iv });
    }

    const insertFile = db.prepare(
      'INSERT INTO files (group_id, stored_name, original_name, mimetype, size, encrypted, iv) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    db.transaction(() => {
      for (const { file, iv } of fileData) {
        insertFile.run(group.id, file.filename, file.originalname, file.mimetype, file.size, shouldEncrypt ? 1 : 0, iv);
      }
    })();

    res.status(201).json({ message: `${req.files.length} Datei(en) hinzugefügt`, count: req.files.length });
  } catch (err) {
    req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// DELETE /api/admin/groups/:id — Gruppe und alle zugehörigen Dateien löschen
router.delete('/groups/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const group = db.prepare('SELECT * FROM upload_groups WHERE id = ?').get(req.params.id);
  if (!group) return res.status(404).json({ error: 'Gruppe nicht gefunden' });

  const files = db.prepare('SELECT * FROM files WHERE group_id = ?').all(req.params.id);

  // Dateien aus dem Dateisystem löschen
  for (const file of files) {
    const filePath = path.join(UPLOADS_DIR, file.stored_name);
    try { fs.unlinkSync(filePath); } catch {}
  }

  db.prepare('DELETE FROM upload_groups WHERE id = ?').run(req.params.id);
  res.json({ message: 'Gruppe gelöscht' });
});

// DELETE /api/admin/files/:id — Einzelne Datei löschen
router.delete('/files/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: 'Datei nicht gefunden' });

  const filePath = path.join(UPLOADS_DIR, file.stored_name);
  try { fs.unlinkSync(filePath); } catch {}

  db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
  res.json({ message: 'Datei gelöscht' });
});

module.exports = router;
