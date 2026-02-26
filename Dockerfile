# ---- Build Stage: Abhängigkeiten installieren ----
FROM node:20-alpine AS builder

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

RUN mkdir -p uploads database

# Sicherheit: nicht-root User
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001

CMD ["node", "server.js"]
