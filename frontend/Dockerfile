# =================================
# BUDGET MANAGER 2025 - FRONTEND DOCKERFILE
# Multi-Stage Build für optimale Performance
# =================================

# =================================
# STAGE 1: Base Image
# =================================
FROM node:18-alpine AS base

# System-Dependencies installieren
RUN apk add --no-cache curl bash && rm -rf /var/cache/apk/*

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package-Dateien kopieren
COPY package*.json ./

# =================================
# STAGE 2: Development
# =================================
FROM base AS development

# Development-Dependencies installieren
RUN npm ci

# Source-Code kopieren
COPY . .

# Development-Server starten
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# =================================
# STAGE 3: Build
# =================================
FROM base AS build

# Dependencies installieren
RUN npm ci

# Source-Code kopieren
COPY . .

# Build-Argumente für Production
ARG VITE_API_BASE_URL=http://localhost:3001/api
ARG VITE_WS_URL=ws://localhost:3001
ARG VITE_APP_ENVIRONMENT=production

# Environment-Variablen setzen
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_APP_ENVIRONMENT=$VITE_APP_ENVIRONMENT

# Production-Build erstellen
RUN npm run build

# =================================
# STAGE 4: Production mit NGINX
# =================================
FROM nginx:alpine AS production

# NGINX-Konfiguration kopieren
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf

# Non-root User erstellen
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user

# Berechtigungen setzen
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d

# User wechseln
USER nginx-user

# Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Port freigeben
EXPOSE 3000

# NGINX starten
CMD ["nginx", "-g", "daemon off;"]
