# ---- Build Stage: Abhängigkeiten installieren ----
FROM node:20-alpine AS builder

# Build-Tools für native Module (better-sqlite3 benötigt python3, make, g++)
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# ---- Runtime Stage ----
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY server.js ./
COPY package.json ./
COPY database/ ./database/
COPY middleware/ ./middleware/
COPY routes/ ./routes/
COPY public/ ./public/

# Einhängepunkte für externe Volumes anlegen
RUN mkdir -p uploads database

EXPOSE 3001

CMD ["node", "server.js"]
