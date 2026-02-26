# ---- Build Stage: Repo klonen + Abhängigkeiten installieren ----
FROM node:20-alpine AS builder

ARG GH_TOKEN
RUN apk add --no-cache git

WORKDIR /app

# Privates GitHub-Repo klonen (Token nur im Build-Stage, nicht im finalen Image)
RUN git clone "https://oauth2:${GH_TOKEN}@github.com/berto-1974/Downloadcenter.git" . \
    && rm -rf .git

RUN npm install --omit=dev

# ---- Runtime Stage: Nur benötigte Dateien ins finale Image ----
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/database/ ./database/
COPY --from=builder /app/middleware/ ./middleware/
COPY --from=builder /app/routes/ ./routes/
COPY --from=builder /app/public/ ./public/

# Einhängepunkte für externe Volumes
RUN mkdir -p uploads database

# Sicherheit: App läuft als nicht-root User
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001

CMD ["node", "server.js"]
