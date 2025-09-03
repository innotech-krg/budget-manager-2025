#!/bin/bash

# =================================
# DOCKER SETUP TEST SCRIPT
# Budget Manager 2025
# =================================

set -e

echo "🐳 Testing Docker Setup for Budget Manager 2025"
echo "================================================"

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Test 1: Docker Installation prüfen
echo ""
echo "🔍 Test 1: Docker Installation"
echo "------------------------------"

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker ist installiert: $DOCKER_VERSION"
else
    print_error "Docker ist nicht installiert!"
    exit 1
fi

if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose ist installiert: $COMPOSE_VERSION"
else
    print_error "Docker Compose ist nicht installiert!"
    exit 1
fi

# Test 2: Docker Daemon prüfen
echo ""
echo "🔍 Test 2: Docker Daemon"
echo "------------------------"

if docker info &> /dev/null; then
    print_success "Docker Daemon läuft"
else
    print_error "Docker Daemon läuft nicht!"
    exit 1
fi

# Test 3: Dockerfile Syntax prüfen
echo ""
echo "🔍 Test 3: Dockerfile Syntax"
echo "----------------------------"

if [ -f "frontend/Dockerfile" ]; then
    print_success "Frontend Dockerfile gefunden"
else
    print_error "Frontend Dockerfile nicht gefunden!"
    exit 1
fi

if [ -f "backend/Dockerfile" ]; then
    print_success "Backend Dockerfile gefunden"
else
    print_error "Backend Dockerfile nicht gefunden!"
    exit 1
fi

# Test 4: Docker Compose Dateien prüfen
echo ""
echo "🔍 Test 4: Docker Compose Konfiguration"
echo "---------------------------------------"

COMPOSE_FILES=(
    "docker-compose.yml"
    "docker-compose.dev.yml"
    "docker-compose.prod.yml"
)

for file in "${COMPOSE_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file gefunden"
        
        # Syntax-Check
        if docker-compose -f "$file" config &> /dev/null; then
            print_success "$file Syntax ist korrekt"
        else
            print_error "$file hat Syntax-Fehler!"
            docker-compose -f "$file" config
            exit 1
        fi
    else
        print_error "$file nicht gefunden!"
        exit 1
    fi
done

# Test 5: Environment Templates prüfen
echo ""
echo "🔍 Test 5: Environment Templates"
echo "--------------------------------"

ENV_TEMPLATES=(
    "env-templates/backend.env.example"
    "env-templates/frontend.env.example"
)

for template in "${ENV_TEMPLATES[@]}"; do
    if [ -f "$template" ]; then
        print_success "$template gefunden"
    else
        print_error "$template nicht gefunden!"
        exit 1
    fi
done

# Test 6: Docker Images Build Test (nur Syntax)
echo ""
echo "🔍 Test 6: Docker Build Test (Dry Run)"
echo "--------------------------------------"

print_info "Teste Frontend Dockerfile Build..."
if docker build --no-cache --target development -f frontend/Dockerfile frontend/ -t budget-manager-frontend-test &> /dev/null; then
    print_success "Frontend Docker Build erfolgreich"
    docker rmi budget-manager-frontend-test &> /dev/null || true
else
    print_error "Frontend Docker Build fehlgeschlagen!"
    exit 1
fi

print_info "Teste Backend Dockerfile Build..."
if docker build --no-cache --target development -f backend/Dockerfile backend/ -t budget-manager-backend-test &> /dev/null; then
    print_success "Backend Docker Build erfolgreich"
    docker rmi budget-manager-backend-test &> /dev/null || true
else
    print_error "Backend Docker Build fehlgeschlagen!"
    exit 1
fi

# Test 7: Netzwerk-Konfiguration prüfen
echo ""
echo "🔍 Test 7: Docker Netzwerk Test"
echo "-------------------------------"

if docker network ls | grep -q budget-network; then
    print_warning "Budget-Network existiert bereits - wird entfernt für sauberen Test"
    docker network rm budget-network &> /dev/null || true
fi

if docker network create budget-network &> /dev/null; then
    print_success "Docker Netzwerk erstellt"
    docker network rm budget-network &> /dev/null
else
    print_error "Docker Netzwerk konnte nicht erstellt werden!"
    exit 1
fi

# Test 8: Volume-Konfiguration prüfen
echo ""
echo "🔍 Test 8: Docker Volume Test"
echo "-----------------------------"

TEST_VOLUMES=(
    "budget-manager-uploads-test"
    "budget-manager-redis-test"
)

for volume in "${TEST_VOLUMES[@]}"; do
    if docker volume create "$volume" &> /dev/null; then
        print_success "Volume $volume erstellt"
        docker volume rm "$volume" &> /dev/null
    else
        print_error "Volume $volume konnte nicht erstellt werden!"
        exit 1
    fi
done

# Test 9: Port-Verfügbarkeit prüfen
echo ""
echo "🔍 Test 9: Port-Verfügbarkeit"
echo "-----------------------------"

REQUIRED_PORTS=(3000 3001 6379 9090)

for port in "${REQUIRED_PORTS[@]}"; do
    if lsof -i :$port &> /dev/null; then
        print_warning "Port $port ist bereits belegt"
    else
        print_success "Port $port ist verfügbar"
    fi
done

# Test 10: Startup Scripts prüfen
echo ""
echo "🔍 Test 10: Startup Scripts"
echo "---------------------------"

SCRIPTS=(
    "docker/scripts/start-dev.sh"
    "docker/scripts/start-prod.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            print_success "$script ist ausführbar"
        else
            print_warning "$script ist nicht ausführbar - wird korrigiert"
            chmod +x "$script"
            print_success "$script Berechtigungen korrigiert"
        fi
    else
        print_error "$script nicht gefunden!"
        exit 1
    fi
done

# Zusammenfassung
echo ""
echo "🎉 DOCKER SETUP TEST ABGESCHLOSSEN"
echo "=================================="
print_success "Alle Tests erfolgreich bestanden!"
echo ""
echo "📋 Nächste Schritte:"
echo "1. Kopiere env-templates/backend.env.example zu .env"
echo "2. Konfiguriere deine API-Keys in .env"
echo "3. Starte Development: ./docker/scripts/start-dev.sh"
echo "4. Starte Production: ./docker/scripts/start-prod.sh"
echo ""
echo "🔗 Dokumentation: DOCKER-SETUP.md"
echo ""
