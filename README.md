# Download Center

Eine passwortgeschützte Dateiablage- und Download-Webanwendung auf Basis von Node.js und Express. Dateien werden in Gruppen organisiert, jede Gruppe ist mit einem eigenen Passwort gesichert. Über ein Admin-Dashboard können Gruppen und Dateien verwaltet werden.

## Features

- **Gruppen-basierter Zugriff** — Dateien werden in passwortgeschützten Gruppen organisiert
- **Öffentlicher Download-Bereich** — Nutzer geben ihr Gruppenpasswort ein und laden Dateien herunter
- **Admin-Dashboard** — Gruppen erstellen, Dateien hochladen und alles verwalten
- **Bild-Vorschau** — Bilder werden inline angezeigt (Lazy Loading)
- **Drag & Drop Upload** — bis zu 500 MB pro Datei
- **Dark-/Light-Mode** — Theme-Umschalter mit lokalem Speicher
- **Docker-ready** — Docker Compose für einfaches Deployment
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
ADMIN_PASSWORD=sicheres-passwort-hier
JWT_SECRET=langer-zufaelliger-string-hier
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
# .env anpassen (ADMIN_PASSWORD, JWT_SECRET)

docker compose up -d
```

Die Daten (Uploads + Datenbank) werden in Docker-Volumes persistiert.

## Konfiguration

| Variable | Beschreibung | Standard |
|---|---|---|
| `ADMIN_PASSWORD` | Passwort für den Admin-Login | — |
| `JWT_SECRET` | Geheimer Schlüssel für JWT-Token | — |
| `PORT` | Port des HTTP-Servers | `3001` |
| `GH_TOKEN` | GitHub-Token (nur für Docker-Builds aus privaten Repos) | — |

## Projektstruktur

```
Downloadcenter/
├── server.js              # Einstiegspunkt der Anwendung
├── lib/db.js              # Datenbankverbindung & Schema
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
| `GET` | `/api/admin/groups` | Alle Gruppen auflisten |
| `POST` | `/api/admin/upload` | Neue Gruppe + Dateien hochladen |
| `DELETE` | `/api/admin/groups/:id` | Gruppe löschen |
| `DELETE` | `/api/admin/files/:id` | Einzelne Datei löschen |

## Lizenz

MIT — siehe [LICENSE](LICENSE)
