#!/bin/bash

# =====================================================
# Budget Manager 2025 - E2E Test Runner
# Script für saubere E2E Test-Ausführung ohne Timeout-Probleme
# =====================================================

set -e

echo "🎭 Budget Manager 2025 - E2E Test Runner"
echo "========================================"

# Funktion zum Bereinigen von Prozessen
cleanup() {
    echo "🧹 Bereinige Prozesse..."
    
    # Stoppe alle Playwright-Prozesse
    pkill -f "playwright" 2>/dev/null || true
    
    # Stoppe HTML-Report-Server (falls läuft)
    pkill -f "9323" 2>/dev/null || true
    pkill -f "9324" 2>/dev/null || true
    
    # Warte kurz
    sleep 1
    
    echo "✅ Prozesse bereinigt"
}

# Bereinige bei Script-Ende
trap cleanup EXIT

# Bereinige zu Beginn
cleanup

# Prüfe ob Backend und Frontend laufen
echo "🔍 Prüfe Services..."

if ! curl -s http://localhost:3001/api/budgets/health > /dev/null; then
    echo "❌ Backend ist nicht erreichbar. Starte Backend zuerst:"
    echo "   npm run dev:backend"
    exit 1
fi

if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Frontend ist nicht erreichbar. Starte Frontend zuerst:"
    echo "   npm run dev:frontend"
    exit 1
fi

echo "✅ Services sind bereit"

# Führe E2E Tests aus
echo "🚀 Starte E2E Tests..."

if [ "$1" = "--story-1-1" ]; then
    echo "📋 Führe Story 1.1 Tests aus..."
    npx playwright test tests/e2e/user-journeys/story-1-1-annual-budget-management.e2e.test.js --project=chromium --timeout=30000
elif [ "$1" = "--all" ]; then
    echo "📋 Führe alle E2E Tests aus..."
    npx playwright test --timeout=30000
else
    echo "📋 Führe Story 1.1 Tests aus (Standard)..."
    npx playwright test tests/e2e/user-journeys/story-1-1-annual-budget-management.e2e.test.js --project=chromium --timeout=30000
fi

# Warte auf Test-Abschluss
echo "⏳ Warte auf Test-Abschluss..."
sleep 2

# Bereinige am Ende
cleanup

echo "✅ E2E Tests abgeschlossen!"

# Zeige Report-Pfad
if [ -d "tests/reports/playwright-report" ]; then
    echo "📊 HTML-Report verfügbar: tests/reports/playwright-report/index.html"
    echo "💡 Öffne Report mit: open tests/reports/playwright-report/index.html"
fi

echo "🎯 Test-Ergebnisse siehe oben in der Konsolen-Ausgabe"

