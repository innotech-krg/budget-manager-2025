#!/bin/bash

# =================================
# BUDGET MANAGER 2025 - DEVELOPMENT STARTUP
# =================================

set -e

echo "🚀 Starting Budget Manager 2025 - Development Environment"

# Prüfe ob .env existiert
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📋 Please copy env-templates/backend.env.example to .env and configure it"
    exit 1
fi

# Source environment variables
source .env

# Prüfe kritische Environment-Variablen
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Missing required Supabase configuration!"
    echo "📋 Please configure SUPABASE_URL and SUPABASE_ANON_KEY in .env"
    exit 1
fi

# Docker-Compose für Development starten
echo "🐳 Starting Docker containers..."
docker-compose -f docker-compose.dev.yml up --build -d

# Warte auf Services
echo "⏳ Waiting for services to be ready..."
sleep 10

# Health Checks
echo "🔍 Checking service health..."

# Backend Health Check
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi

# Frontend Health Check
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
fi

# Redis Health Check
if docker exec budget-manager-redis-dev redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
fi

echo ""
echo "🎉 Budget Manager 2025 Development Environment is running!"
echo ""
echo "📊 Services:"
echo "   Frontend:        http://localhost:3000"
echo "   Backend API:     http://localhost:3001"
echo "   Redis GUI:       http://localhost:8081"
echo "   Mailhog:         http://localhost:8025"
echo ""
echo "📋 Useful commands:"
echo "   View logs:       docker-compose -f docker-compose.dev.yml logs -f"
echo "   Stop services:   docker-compose -f docker-compose.dev.yml down"
echo "   Restart:         docker-compose -f docker-compose.dev.yml restart"
echo ""
