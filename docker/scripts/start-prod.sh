#!/bin/bash

# =================================
# BUDGET MANAGER 2025 - PRODUCTION STARTUP
# =================================

set -e

echo "🚀 Starting Budget Manager 2025 - Production Environment"

# Prüfe ob .env.production existiert
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found!"
    echo "📋 Please create .env.production with production configuration"
    exit 1
fi

# Source production environment variables
source .env.production

# Prüfe kritische Environment-Variablen
REQUIRED_VARS=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY" 
    "SUPABASE_SERVICE_ROLE_KEY"
    "JWT_SECRET"
    "REDIS_PASSWORD"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing required environment variable: $var"
        exit 1
    fi
done

# SSL-Zertifikate prüfen (optional)
if [ -f "docker/nginx/ssl/cert.pem" ] && [ -f "docker/nginx/ssl/key.pem" ]; then
    echo "✅ SSL certificates found"
else
    echo "⚠️  SSL certificates not found - running HTTP only"
fi

# Docker-Compose für Production starten
echo "🐳 Starting Docker containers..."
docker-compose -f docker-compose.prod.yml up --build -d

# Warte auf Services
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health Checks
echo "🔍 Checking service health..."

# NGINX Health Check
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ NGINX is healthy"
else
    echo "❌ NGINX health check failed"
fi

# Backend Health Check (via NGINX)
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi

# Redis Health Check
if docker exec budget-manager-redis-prod redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
fi

echo ""
echo "🎉 Budget Manager 2025 Production Environment is running!"
echo ""
echo "📊 Services:"
echo "   Application:     http://localhost"
echo "   API:             http://localhost/api"
echo "   Monitoring:      http://localhost:9090 (Prometheus)"
echo "   Dashboards:      http://localhost:3001 (Grafana)"
echo ""
echo "📋 Useful commands:"
echo "   View logs:       docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services:   docker-compose -f docker-compose.prod.yml down"
echo "   Scale backend:   docker-compose -f docker-compose.prod.yml up --scale backend=3 -d"
echo ""
