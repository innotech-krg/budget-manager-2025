# =================================
# BUDGET MANAGER 2025 - BACKEND DOCKERFILE
# Multi-Stage Build für optimale Performance
# =================================

# =================================
# STAGE 1: Base Image
# =================================
FROM node:18-alpine AS base

# System-Dependencies installieren
RUN apk add --no-cache \
    imagemagick \
    imagemagick-dev \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package-Dateien kopieren
COPY package*.json ./

# =================================
# STAGE 2: Development
# =================================
FROM base AS development

# Development-Dependencies installieren
RUN npm ci --include=dev

# Source-Code kopieren
COPY . .

# Uploads und Temp-Verzeichnisse erstellen
RUN mkdir -p uploads/ocr uploads/suppliers temp/pdf-conversion logs

# Development-Server starten
EXPOSE 3001
CMD ["npm", "run", "dev"]

# =================================
# STAGE 3: Build
# =================================
FROM base AS build

# Nur Production-Dependencies installieren
RUN npm ci --only=production && npm cache clean --force

# Source-Code kopieren
COPY . .

# Build-Artefakte erstellen (falls nötig)
RUN npm run build 2>/dev/null || echo "No build script found"

# =================================
# STAGE 4: Production
# =================================
FROM node:18-alpine AS production

# System-Dependencies für Production
RUN apk add --no-cache \
    imagemagick \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Non-root User erstellen
RUN addgroup -g 1001 -S nodejs && \
    adduser -S budget-manager -u 1001

# Arbeitsverzeichnis setzen
WORKDIR /app

# Dependencies von Build-Stage kopieren
COPY --from=build --chown=budget-manager:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=budget-manager:nodejs /app/package*.json ./

# Source-Code kopieren
COPY --chown=budget-manager:nodejs . .

# Verzeichnisse erstellen und Berechtigungen setzen
RUN mkdir -p uploads/ocr uploads/suppliers temp/pdf-conversion logs && \
    chown -R budget-manager:nodejs uploads temp logs

# User wechseln
USER budget-manager

# Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Port freigeben
EXPOSE 3001

# Production-Server mit dumb-init starten
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
