const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// SQLite-Datei liegt im gemounteten Volume-Verzeichnis
const DB_PATH = path.join(__dirname, '..', 'database', 'db.sqlite');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS upload_groups (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS files (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id      INTEGER NOT NULL,
      stored_name   TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      mimetype      TEXT NOT NULL,
      size          INTEGER NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES upload_groups(id) ON DELETE CASCADE
    );
  `);
}

// Sicherstellen, dass der database-Ordner existiert
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

module.exports = { getDb };
