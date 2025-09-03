# Story 9.2: Multi-Dienstleister-System

## 📋 **STORY DETAILS**

**Epic**: 9 - Erweiterte Projekt-Verwaltung  
**Story**: 9.2  
**Titel**: Multi-Dienstleister-System mit flexibler Budget-Aufteilung  
**Status**: 🔄 PENDING  
**Priorität**: HOCH  
**Aufwand**: 2 Tage  
**Entwickler**: @dev.mdc  

---

## 🎯 **USER STORY**

**Als** Projektmanager  
**möchte ich** mehrere Dienstleister pro Projekt verwalten und das Budget flexibel aufteilen können  
**damit** ich komplexe Projekte mit verschiedenen externen Partnern optimal organisieren kann.

---

## 📝 **BESCHREIBUNG**

Implementierung eines flexiblen Multi-Dienstleister-Systems mit intelligenter Budget-Verwaltung:

### **Kernfunktionen**
1. **Manuelles Externes Budget**: Unabhängig von Dienstleister-Zuweisungen
2. **Multi-Dienstleister-Liste**: Beliebig viele Dienstleister pro Projekt
3. **Flexible Budget-Aufteilung**: Nicht das gesamte Budget muss zugewiesen werden
4. **Inline-Dienstleister-Erstellung**: Neue Dienstleister direkt aus Dropdown
5. **Unzugewiesenes Budget**: Sichtbare Darstellung verfügbarer Mittel

### **Budget-Flexibilität**
```javascript
// Beispiel-Szenario
Externes Budget: 50.000€
├── Dienstleister A: 20.000€
├── Dienstleister B: 15.000€
└── Unzugewiesen: 15.000€ ✅ (Erlaubt!)
```

---

## ✅ **AKZEPTANZKRITERIEN**

### **AC1: Manuelles Externes Budget**
- [ ] Eingabefeld für Gesamt-Externes-Budget
- [ ] Budget ist unabhängig von Dienstleister-Summe einstellbar
- [ ] Validierung: Budget ≥ 0
- [ ] Währungsformatierung (EUR)

### **AC2: Multi-Dienstleister-Verwaltung**
- [ ] Liste aller zugewiesenen Dienstleister
- [ ] "Dienstleister hinzufügen" Button
- [ ] Dropdown mit allen aktiven Dienstleistern
- [ ] Dienstleister können entfernt werden
- [ ] Keine Duplikate möglich

### **AC3: Flexible Budget-Aufteilung**
- [ ] Individuelle Budget-Zuweisung pro Dienstleister
- [ ] Summe der Zuweisungen ≤ Gesamt-Externes-Budget
- [ ] Unzugewiesenes Budget wird angezeigt
- [ ] Echtzeit-Berechnung bei Änderungen

### **AC4: Dienstleister-Management**
- [ ] Dienstleister-Name und Details anzeigen
- [ ] Budget-Eingabe pro Dienstleister
- [ ] "Entfernen" Button pro Dienstleister
- [ ] Bestätigung vor Entfernung

### **AC5: Inline-Dienstleister-Erstellung**
- [ ] "Neuen Dienstleister erstellen" Option im Dropdown
- [ ] Modal für Dienstleister-Erstellung
- [ ] Automatische Auswahl nach Erstellung
- [ ] Validierung der Dienstleister-Daten

---

## 🛠️ **TECHNISCHE ANFORDERUNGEN**

### **Datenbank-Schema**
```sql
-- Projekt-Dienstleister Many-to-Many
CREATE TABLE project_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    allocated_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
    consumed_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(project_id, supplier_id),
    CHECK (allocated_budget >= 0),
    CHECK (consumed_budget >= 0),
    CHECK (consumed_budget <= allocated_budget)
);

-- Projekte erweitern
ALTER TABLE projects ADD COLUMN external_budget DECIMAL(12,2) DEFAULT 0;
```

### **API-Endpoints**
```javascript
// Projekt-Dienstleister verwalten
GET    /api/projects/:id/suppliers
POST   /api/projects/:id/suppliers
PUT    /api/projects/:id/suppliers/:supplierId
DELETE /api/projects/:id/suppliers/:supplierId

// Aktive Dienstleister für Dropdown
GET    /api/suppliers?active=true

// Inline-Erstellung
POST   /api/suppliers (erweitert für Inline-Creation)
```

### **Frontend-Komponenten**
```typescript
// Haupt-Komponente
MultiSupplierManager.tsx
├── SupplierBudgetRow.tsx
├── AddSupplierDropdown.tsx
├── BudgetAllocationSummary.tsx
└── InlineSupplierCreator.tsx

// State Management
interface ProjectSupplier {
  id: string;
  supplier_id: string;
  supplier_name: string;
  allocated_budget: number;
  consumed_budget: number;
  is_active: boolean;
}

interface ExternalBudgetState {
  total_budget: number;
  suppliers: ProjectSupplier[];
  unallocated_budget: number;
}
```

---

## 🎨 **UI/UX DESIGN**

### **Multi-Dienstleister-Interface**
```
┌─ EXTERN (Externe Dienstleister) ──────────────┐
│                                               │
│ Gesamt Externes Budget: [50.000,00 €]        │
│                                               │
│ ┌─ Zugewiesene Dienstleister ───────────────┐ │
│ │                                           │ │
│ │ ┌─ Dienstleister A ──────────────────────┐ │ │
│ │ │ Budget: [20.000,00 €] [Entfernen]     │ │ │
│ │ └───────────────────────────────────────┘ │ │
│ │                                           │ │
│ │ ┌─ Dienstleister B ──────────────────────┐ │ │
│ │ │ Budget: [15.000,00 €] [Entfernen]     │ │ │
│ │ └───────────────────────────────────────┘ │ │
│ │                                           │ │
│ │ [+ Dienstleister hinzufügen ▼]           │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ ┌─ Budget-Übersicht ─────────────────────────┐ │
│ │ Zugewiesen:    35.000,00 €                │ │
│ │ Unzugewiesen:  15.000,00 €                │ │
│ │ Gesamt:        50.000,00 €                │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

### **Dienstleister-Dropdown**
```
┌─ Dienstleister auswählen ──────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │ 🔍 Suchen...                           │ │
│ └─────────────────────────────────────────┘ │
│                                           │
│ ○ Acme Corp GmbH                          │
│ ○ TechSolutions AG                        │
│ ○ Digital Partners Ltd                    │
│ ────────────────────────────────────────── │
│ ○ + Neuen Dienstleister erstellen        │
└───────────────────────────────────────────┘
```

---

## 💰 **BUDGET-LOGIK**

### **Berechnungen**
```javascript
// Budget-Berechnungen
const calculateBudgetSummary = (externalBudget, suppliers) => {
  const allocatedBudget = suppliers.reduce((sum, s) => sum + s.allocated_budget, 0);
  const consumedBudget = suppliers.reduce((sum, s) => sum + s.consumed_budget, 0);
  const unallocatedBudget = externalBudget - allocatedBudget;
  
  return {
    total: externalBudget,
    allocated: allocatedBudget,
    consumed: consumedBudget,
    unallocated: unallocatedBudget,
    available: externalBudget - consumedBudget
  };
};

// Validierungen
const validateBudgetAllocation = (externalBudget, suppliers) => {
  const totalAllocated = suppliers.reduce((sum, s) => sum + s.allocated_budget, 0);
  
  return {
    isValid: totalAllocated <= externalBudget,
    overallocation: Math.max(0, totalAllocated - externalBudget),
    message: totalAllocated > externalBudget 
      ? `Budget um ${totalAllocated - externalBudget}€ überschritten`
      : 'Budget-Aufteilung ist gültig'
  };
};
```

### **Dienstleister-Entfernung**
```javascript
const removeSupplierFromProject = async (projectId, supplierId) => {
  // 1. Aktuelles Budget abrufen
  const allocation = await getSupplierAllocation(projectId, supplierId);
  
  // 2. Verfügbares Budget berechnen
  const availableBudget = allocation.allocated_budget - allocation.consumed_budget;
  
  // 3. Budget zurück ins Projekt
  await updateProject(projectId, {
    external_budget: project.external_budget + availableBudget
  });
  
  // 4. Supplier-Zuordnung deaktivieren (Soft Delete)
  await updateProjectSupplier(projectId, supplierId, {
    is_active: false,
    removed_at: new Date(),
    available_at_removal: availableBudget
  });
  
  // 5. Audit-Log erstellen
  await createAuditLog({
    action: 'SUPPLIER_REMOVED',
    project_id: projectId,
    supplier_id: supplierId,
    budget_returned: availableBudget,
    consumed_budget_preserved: allocation.consumed_budget
  });
};
```

---

## 🧪 **TESTING**

### **Unit Tests**
```javascript
describe('MultiSupplierManager', () => {
  test('calculates budget summary correctly');
  test('validates budget allocation limits');
  test('handles supplier addition');
  test('handles supplier removal');
  test('updates unallocated budget in real-time');
});

describe('Budget Calculations', () => {
  test('prevents overallocation');
  test('calculates unallocated budget');
  test('preserves consumed budget on removal');
});
```

### **Integration Tests**
```javascript
describe('Multi-Supplier API Integration', () => {
  test('creates project with multiple suppliers');
  test('updates supplier budget allocation');
  test('removes supplier and returns budget');
  test('handles concurrent budget updates');
});
```

### **Browser Tests (MCP)**
```javascript
// E2E Test-Szenario
1. Projekt öffnen/erstellen
2. Externes Budget auf 50.000€ setzen
3. Dienstleister A hinzufügen → 20.000€ zuweisen
4. Dienstleister B hinzufügen → 15.000€ zuweisen
5. Unzugewiesenes Budget prüfen: 15.000€ ✅
6. Dienstleister A entfernen
7. Verfügbares Budget prüfen: 35.000€ ✅
8. Neuen Dienstleister inline erstellen
9. Budget-Übersicht validieren
```

---

## 📊 **DEFINITION OF DONE**

- [ ] Alle Akzeptanzkriterien erfüllt
- [ ] Datenbank-Schema implementiert und migriert
- [ ] API-Endpoints vollständig funktional
- [ ] Frontend-Komponenten implementiert
- [ ] Unit Tests geschrieben (>90% Coverage)
- [ ] Integration Tests bestanden
- [ ] Browser-Tests erfolgreich
- [ ] Performance-Tests bestanden (<300ms)
- [ ] Code Review abgeschlossen
- [ ] Dokumentation aktualisiert

---

## 🔗 **ABHÄNGIGKEITEN**

### **Voraussetzungen**
- Story 9.1: Semantische UI-Struktur
- Supplier-CRUD-APIs funktional
- Datenbank-Migrations-System

### **Nachfolgende Stories**
- Story 9.3: Intelligente Budget-Logik
- Story 9.4: Inline-Entity-Creation
- Story 9.5: Kosten-Übersicht

---

## 📝 **IMPLEMENTIERUNGS-NOTIZEN**

### **Technische Hinweise**
- Verwendung von React Query für optimistische Updates
- Debounced Budget-Eingaben für bessere Performance
- Transaktionale Datenbank-Updates für Konsistenz
- Rollback-Mechanismus bei fehlgeschlagenen Updates

### **Sicherheitsaspekte**
- Validierung aller Budget-Eingaben server-seitig
- Schutz vor Race Conditions bei gleichzeitigen Updates
- Audit-Logs für alle Budget-Änderungen
- Berechtigungsprüfung für Dienstleister-Verwaltung

### **Performance-Optimierungen**
- Lazy Loading für große Dienstleister-Listen
- Virtualisierung bei vielen Projekt-Dienstleistern
- Caching von Dienstleister-Daten
- Optimistische UI-Updates mit Rollback



