# ---- Build Stage: Abhängigkeiten installieren ----
FROM node:20-alpine AS builder

# Build-Tools für native Module (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# ---- Runtime Stage ----
FROM node:20-alpine

WORKDIR /app

# node_modules aus dem Build Stage übernehmen
COPY --from=builder /app/node_modules ./node_modules

# Alle App-Dateien kopieren (.dockerignore bestimmt was ausgeschlossen wird)
COPY . .

# Einhängepunkte für externe Volumes sicherstellen
RUN mkdir -p uploads database

EXPOSE 3001

CMD ["node", "server.js"]
