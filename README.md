# Download Center

Eine passwortgeschützte Dateiablage- und Download-Webanwendung auf Basis von Node.js und Express. Dateien werden in Gruppen organisiert, jede Gruppe ist mit einem eigenen Passwort gesichert. Über ein Admin-Dashboard können Gruppen und Dateien verwaltet werden.

## Features

- **Gruppen-basierter Zugriff** — Dateien werden in passwortgeschützten Gruppen organisiert
- **Öffentlicher Download-Bereich** — Nutzer geben ihr Gruppenpasswort ein und laden Dateien herunter
- **Admin-Dashboard** — Gruppen erstellen, Dateien hochladen, nachträglich Dateien hinzufügen und alles verwalten
- **Passwort-Verwaltung** — Admin-Passwort direkt im Admin-Bereich änderbar, wird verschlüsselt in der Datenbank gespeichert
- **Datei-Verschlüsselung** — optionale AES-256-GCM-Verschlüsselung pro Gruppe beim Upload
- **Bild-Vorschau** — Bilder werden inline angezeigt (Lazy Loading), Dateityp-Labels für alle anderen Formate
- **Drag & Drop Upload** — bis zu 500 MB pro Datei
- **Dark-/Light-Mode** — Theme-Umschalter mit lokalem Speicher
- **Docker-ready** — Docker Compose mit Named Volumes für einfaches Deployment
- **Lightweight** — SQLite als Datenbank, kein externer Datenbankserver nötig

## Tech Stack

| Bereich | Technologie |
|---|---|
| Backend | Node.js, Express 4 |
| Datenbank | SQLite (better-sqlite3) |
| Authentifizierung | JWT + bcrypt |
| Datei-Upload | Multer |
| Frontend | Bootstrap 5, Vanilla JS |
| Deployment | Docker / Docker Compose / PM2 |

## Voraussetzungen

- **Node.js** >= 18
- **npm** >= 9
- (Optional) **Docker** & **Docker Compose** für Container-Deployment

## Installation

### 1. Repository klonen

```bash
git clone https://github.com/berto-1974/Downloadcenter.git
cd Downloadcenter
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Dann `.env` anpassen:

```env
# Standard-Passwort ist "Admin" — direkt nach dem ersten Login in der Admin-UI ändern
ADMIN_PASSWORD=Admin

# Beide Schlüssel durch eigene, lange Zufallsstrings ersetzen
JWT_SECRET=Bitte_JWT_SECRET_ändern
ENCRYPTION_KEY=Bitte_ENCRYPTION_KEY_ändern

PORT=3001
```

### 4. Starten

**Entwicklung** (mit Watch-Modus):
```bash
npm run dev
```

**Produktion:**
```bash
npm start
```

Die Anwendung ist anschließend unter `http://localhost:3001` erreichbar.

## Deployment mit Docker

```bash
cp .env.example .env
# .env anpassen (ADMIN_PASSWORD, JWT_SECRET, ENCRYPTION_KEY)

docker compose up -d
```

Die Daten (Uploads + Datenbank) werden in **Named Volumes** (`dlc_uploads`, `dlc_database`) persistiert, die Docker intern verwaltet.

Wer eigene Host-Pfade bevorzugt (z. B. auf einem NAS), ersetzt die Volume-Sektion in der `docker-compose.yml`:

```yaml
# Eigene Pfade statt Named Volumes:
volumes:
  - /dein/pfad/uploads:/app/uploads
  - /dein/pfad/database:/app/database
# Den volumes:-Block am Ende der Datei dann entfernen.
```

## Konfiguration

| Variable | Beschreibung | Standard |
|---|---|---|
| `ADMIN_PASSWORD` | Passwort für den Admin-Login — kann nach dem ersten Login in der Admin-UI geändert werden | `Admin` |
| `JWT_SECRET` | Geheimer Schlüssel zum Signieren von Admin-JWT-Tokens — **muss** gesetzt werden | `Bitte_JWT_SECRET_ändern` |
| `ENCRYPTION_KEY` | Schlüssel für die AES-256-GCM-Datei­verschlüsselung (min. 32 Zeichen) — **muss** gesetzt werden | `Bitte_ENCRYPTION_KEY_ändern` |
| `PORT` | Port des HTTP-Servers | `3001` |

> **Wichtig:** `JWT_SECRET` und `ENCRYPTION_KEY` müssen vor dem produktiven Betrieb durch eigene, lange Zufallsstrings ersetzt werden. Solange die Platzhalterwerte aktiv sind, ist die Installation nicht sicher. Das Admin-Passwort kann jederzeit über den Admin-Bereich geändert werden — der neue Hash wird in der Datenbank gespeichert.

## Projektstruktur

```
Downloadcenter/
├── server.js              # Einstiegspunkt der Anwendung
├── lib/db.js              # Datenbankverbindung & Schema
├── lib/crypto.js          # AES-256-GCM Verschlüsselung/Entschlüsselung
├── middleware/auth.js     # JWT-Middleware
├── routes/
│   ├── admin.js           # Admin-API-Endpunkte
│   └── public.js          # Öffentliche API-Endpunkte
├── public/
│   ├── index.html         # Öffentlicher Download-Bereich
│   ├── admin.html         # Admin-Dashboard
│   ├── css/styles.css
│   └── js/
│       ├── main.js        # UI-Logik (öffentlich)
│       ├── admin.js       # UI-Logik (Admin)
│       └── theme.js       # Dark/Light-Mode
├── .env.example           # Vorlage für Umgebungsvariablen
├── Dockerfile
└── docker-compose.yml
```

## API-Übersicht

**Öffentlich:**
| Methode | Pfad | Beschreibung |
|---|---|---|
| `POST` | `/api/files` | Dateien einer Gruppe abrufen (Passwort erforderlich) |
| `GET` | `/api/download/:id` | Datei herunterladen |
| `GET` | `/api/preview/:id` | Bildvorschau |
| `DELETE` | `/api/files/:id` | Datei löschen (Passwort erforderlich) |

**Admin (JWT erforderlich):**
| Methode | Pfad | Beschreibung |
|---|---|---|
| `POST` | `/api/admin/login` | Einloggen → JWT |
| `POST` | `/api/admin/change-password` | Admin-Passwort ändern |
| `GET` | `/api/admin/groups` | Alle Gruppen auflisten |
| `POST` | `/api/admin/upload` | Neue Gruppe + Dateien hochladen |
| `POST` | `/api/admin/groups/:id/files` | Dateien zu bestehender Gruppe hinzufügen |
| `DELETE` | `/api/admin/groups/:id` | Gruppe löschen |
| `DELETE` | `/api/admin/files/:id` | Einzelne Datei löschen |

## Lizenz

MIT — siehe [LICENSE](LICENSE)
