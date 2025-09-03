# Budget Manager 2025 - Test-Architektur

## 🎯 **Zentrale Test-Organisation**

### **Philosophie**
- **Zentral organisiert**: Alle Tests in `/tests/` für bessere Übersicht
- **Kategorie-basiert**: Klare Trennung nach Test-Typen
- **Durchgängige Naming Convention**: Einheitliche Benennung aller Dateien
- **Zukunftssicher**: Skalierbare Struktur für neue Features

### **Verzeichnisstruktur**
```
tests/
├── test-master.js                    # 🎮 Master Test Runner (interaktiv)
├── test-architecture.md              # 📋 Diese Dokumentation
├── test-config.json                  # ⚙️ Zentrale Test-Konfiguration
├── test-utils/                       # 🛠️ Gemeinsame Test-Utilities
│   ├── test-helpers.js               # Allgemeine Helper-Funktionen
│   ├── test-assertions.js            # Custom Assertions
│   ├── test-mocks.js                 # Mock-Definitionen
│   └── test-data-factory.js          # Test-Daten-Generator
├── unit/                             # 🔬 Unit Tests
│   ├── backend/
│   │   ├── controllers/
│   │   │   ├── budget-controller.unit.test.js
│   │   │   └── project-controller.unit.test.js
│   │   ├── services/
│   │   │   ├── budget-service.unit.test.js
│   │   │   └── project-service.unit.test.js
│   │   └── utils/
│   │       ├── budget-validation.unit.test.js
│   │       └── currency-utils.unit.test.js
│   └── frontend/
│       ├── components/
│       │   ├── budget-card.unit.test.tsx
│       │   ├── budget-form.unit.test.tsx
│       │   └── budget-status-indicator.unit.test.tsx
│       └── utils/
│           ├── currency-formatter.unit.test.ts
│           └── date-helpers.unit.test.ts
├── integration/                      # 🔗 Integration Tests
│   ├── api/
│   │   ├── budget-api.integration.test.js
│   │   ├── project-api.integration.test.js
│   │   └── dashboard-api.integration.test.js
│   ├── database/
│   │   ├── budget-crud.integration.test.js
│   │   └── project-crud.integration.test.js
│   └── services/
│       ├── budget-transfer.integration.test.js
│       └── real-time-updates.integration.test.js
├── e2e/                              # 🌐 End-to-End Tests
│   ├── user-journeys/
│   │   ├── budget-management.e2e.test.js
│   │   ├── project-creation.e2e.test.js
│   │   └── dashboard-navigation.e2e.test.js
│   └── critical-paths/
│       ├── budget-transfer-flow.e2e.test.js
│       └── annual-budget-setup.e2e.test.js
├── stories/                          # 📖 Story-basierte Tests
│   ├── epic-01/
│   │   ├── story-1-1-annual-budget.story.test.js
│   │   ├── story-1-2-project-creation.story.test.js
│   │   ├── story-1-3-budget-tracking.story.test.js
│   │   ├── story-1-4-budget-transfer.story.test.js
│   │   └── story-1-5-dashboard.story.test.js
│   └── epic-02/
│       └── (zukünftige Stories)
├── system/                           # 🔧 System Tests
│   ├── connectivity.system.test.js   # Server-Verbindungen
│   ├── performance.system.test.js    # Performance-Tests
│   └── security.system.test.js       # Sicherheits-Tests
└── reports/                          # 📊 Test-Reports
    ├── coverage/                     # Coverage-Reports
    ├── results/                      # Test-Ergebnisse
    └── metrics/                      # Test-Metriken
```

## 🏷️ **Naming Convention**

### **Datei-Naming**
```
{component-name}.{test-type}.test.{ext}

Beispiele:
- budget-controller.unit.test.js
- project-api.integration.test.js
- budget-management.e2e.test.js
- story-1-1-annual-budget.story.test.js
- connectivity.system.test.js
```

### **Test-Beschreibungen**
```javascript
// ✅ RICHTIG
describe('BudgetController.unit', () => {
  describe('createBudget()', () => {
    it('should create valid budget with German currency format', () => {
      // Test implementation
    });
  });
});

// ❌ FALSCH
describe('Budget Controller Tests', () => {
  it('test budget creation', () => {
    // Test implementation
  });
});
```

### **Test-IDs**
```
Format: {EPIC}.{STORY}-{TYPE}-{SEQ}

Beispiele:
- 1.1-UNIT-001
- 1.2-INT-003
- 1.3-E2E-001
- 1.4-STORY-001
- SYS-CONN-001
```

## 🎮 **Test-Kategorien**

### **1. Unit Tests** (`/tests/unit/`)
- **Zweck**: Isolierte Komponenten-Tests
- **Scope**: Einzelne Funktionen/Klassen
- **Mocks**: Alle Dependencies gemockt
- **Speed**: < 100ms pro Test

### **2. Integration Tests** (`/tests/integration/`)
- **Zweck**: Komponenten-Interaktionen
- **Scope**: API-Endpoints, Database, Services
- **Mocks**: Externe Services gemockt
- **Speed**: < 1s pro Test

### **3. End-to-End Tests** (`/tests/e2e/`)
- **Zweck**: Vollständige User-Journeys
- **Scope**: Browser-Automatisierung
- **Mocks**: Minimale Mocks
- **Speed**: < 30s pro Test

### **4. Story Tests** (`/tests/stories/`)
- **Zweck**: Acceptance-Criteria-Validierung
- **Scope**: Komplette User Stories
- **Mocks**: Realistische Test-Daten
- **Speed**: < 10s pro Test

### **5. System Tests** (`/tests/system/`)
- **Zweck**: Infrastruktur und Performance
- **Scope**: Server, Connectivity, Security
- **Mocks**: Keine Mocks
- **Speed**: < 5s pro Test

## 🔧 **Test-Konfiguration**

### **Zentrale Konfiguration** (`test-config.json`)
```json
{
  "testEnvironment": "development",
  "timeouts": {
    "unit": 5000,
    "integration": 30000,
    "e2e": 60000,
    "story": 45000,
    "system": 15000
  },
  "coverage": {
    "threshold": {
      "unit": 90,
      "integration": 80,
      "e2e": 70
    }
  },
  "ports": {
    "frontend": 3000,
    "backend": 3001
  },
  "databases": {
    "test": "budget_manager_test"
  }
}
```

## 🚀 **Test-Ausführung**

### **Master Test Runner** (`test-master.js`)
```bash
# Interaktiver Modus (empfohlen)
npm test

# Spezifische Kategorien
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:stories
npm run test:system

# Alle Tests
npm run test:all

# Mit Coverage
npm run test:coverage

# Continuous Integration
npm run test:ci
```

## 📊 **Reporting & Metriken**

### **Test-Reports**
- **Coverage**: HTML + JSON Reports
- **Performance**: Execution-Time-Tracking
- **Trends**: Historical Test-Metriken
- **Failures**: Detaillierte Fehler-Analyse

### **Quality Gates**
- **Unit Tests**: 90% Coverage erforderlich
- **Integration Tests**: 80% Coverage erforderlich
- **Story Tests**: 100% Acceptance Criteria erfüllt
- **System Tests**: Alle kritischen Pfade funktional

## 🔄 **Migration Strategy**

### **Phase 1: Struktur erstellen**
1. Neue Verzeichnisstruktur anlegen
2. Test-Utils und Konfiguration erstellen
3. Master Test Runner implementieren

### **Phase 2: Tests migrieren**
1. Bestehende Tests nach neuer Convention umbenennen
2. Tests in entsprechende Kategorien verschieben
3. Duplikate entfernen und konsolidieren

### **Phase 3: Erweitern**
1. Fehlende Test-Coverage identifizieren
2. Neue Tests nach Standards erstellen
3. CI/CD-Integration optimieren

## 🛡️ **Best Practices**

### **Test-Qualität**
- **Isolation**: Tests sind unabhängig voneinander
- **Deterministic**: Gleiche Eingabe = Gleiche Ausgabe
- **Fast**: Schnelle Feedback-Zyklen
- **Readable**: Selbst-dokumentierend

### **Maintenance**
- **DRY**: Gemeinsame Utilities verwenden
- **Consistent**: Einheitliche Patterns
- **Documented**: Klare Test-Beschreibungen
- **Versioned**: Tests mit Code-Changes synchron

### **German Business Logic**
- **Currency**: EUR-Formatierung testen
- **Dates**: Deutsche Datumsformate
- **Validation**: Deutsche Geschäftsregeln
- **Localization**: Deutsche UI-Texte

## 🎯 **Zukunftssicherheit**

### **Skalierbarkeit**
- Neue Epics bekommen eigene Story-Ordner
- Test-Kategorien bleiben stabil
- Naming Convention ist erweiterbar

### **Tool-Integration**
- Jest/Vitest für Unit/Integration Tests
- Playwright für E2E Tests
- Custom Runner für Story Tests
- CI/CD-Pipeline-Integration

### **Team-Adoption**
- Klare Dokumentation
- Beispiel-Templates
- Code-Review-Standards
- Onboarding-Guides

