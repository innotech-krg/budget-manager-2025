# Story 9.3: Intelligente Budget-Logik und Soft-Delete

## 📋 **STORY DETAILS**

**Epic**: 9 - Erweiterte Projekt-Verwaltung  
**Story**: 9.3  
**Titel**: Intelligente Budget-Logik und Soft-Delete-System  
**Status**: 🔄 PENDING  
**Priorität**: HOCH  
**Aufwand**: 2 Tage  
**Entwickler**: @dev.mdc  

---

## 🎯 **USER STORY**

**Als** Projektmanager und Administrator  
**möchte ich** dass verbrauchte Budgets bei Dienstleister-Entfernung erhalten bleiben und gelöschte Entitäten weiterhin in Projekten sichtbar sind  
**damit** die Datenintegrität und Audit-Compliance gewährleistet ist.

---

## 📝 **BESCHREIBUNG**

Implementierung einer intelligenten Budget-Logik mit Soft-Delete-System für alle Entitäten:

### **Intelligente Budget-Logik**
1. **Verbrauchte Kosten bleiben**: Rechnungs-basierte Kosten sind unveränderlich
2. **Verfügbares Budget fließt zurück**: Nur nicht-verbrauchtes Budget kehrt zurück
3. **Vollständige Audit-Trails**: Alle Budget-Änderungen werden dokumentiert
4. **Historische Datenerhaltung**: Keine rückwirkenden Löschungen

### **Soft-Delete-System**
1. **Admin-Löschung**: Entitäten werden deaktiviert, nicht gelöscht
2. **Projekt-Sichtbarkeit**: Gelöschte Entitäten bleiben in Projekten sichtbar
3. **Dropdown-Filterung**: Nur aktive Entitäten in neuen Zuweisungen
4. **Referentielle Integrität**: Alle Verknüpfungen bleiben bestehen

---

## ✅ **AKZEPTANZKRITERIEN**

### **AC1: Intelligente Dienstleister-Entfernung**
- [ ] Verbrauchte Kosten bleiben vollständig erhalten
- [ ] Nur verfügbares Budget fließt zurück ins Projekt
- [ ] Audit-Trail dokumentiert alle Änderungen
- [ ] Entfernte Dienstleister bleiben historisch sichtbar

### **AC2: Soft-Delete für alle Entitäten**
- [ ] Suppliers: `is_active = false` statt physische Löschung
- [ ] Categories: `is_active = false` statt physische Löschung
- [ ] Teams: `is_active = false` statt physische Löschung
- [ ] Tags: `is_active = false` statt physische Löschung

### **AC3: Projekt-Sichtbarkeit gelöschter Entitäten**
- [ ] Gelöschte Entitäten in Projekten weiterhin angezeigt
- [ ] Visuelle Kennzeichnung (grau/durchgestrichen)
- [ ] Tooltip mit Lösch-Information
- [ ] Keine Funktionalitätsverluste in bestehenden Projekten

### **AC4: Dropdown-Filterung**
- [ ] Nur aktive Entitäten in neuen Projekt-Dropdowns
- [ ] Suchfunktion berücksichtigt nur aktive Entitäten
- [ ] Inline-Erstellung nur für aktive Entitäten
- [ ] Admin-Bereich zeigt alle Entitäten (aktiv + gelöscht)

### **AC5: Audit-Compliance**
- [ ] Vollständige Lösch-Historie
- [ ] Budget-Änderungs-Protokoll
- [ ] Benutzer-Tracking für alle Aktionen
- [ ] Zeitstempel für alle Änderungen

---

## 🛠️ **TECHNISCHE ANFORDERUNGEN**

### **Datenbank-Schema Erweiterungen**
```sql
-- Soft Delete für alle Entitäten
ALTER TABLE suppliers ADD COLUMN deleted_at TIMESTAMPTZ NULL;
ALTER TABLE suppliers ADD COLUMN deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE categories ADD COLUMN deleted_at TIMESTAMPTZ NULL;
ALTER TABLE categories ADD COLUMN deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE teams ADD COLUMN deleted_at TIMESTAMPTZ NULL;
ALTER TABLE teams ADD COLUMN deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE tags ADD COLUMN deleted_at TIMESTAMPTZ NULL;
ALTER TABLE tags ADD COLUMN deleted_by UUID REFERENCES auth.users(id);

-- Audit-Trail für Budget-Änderungen
CREATE TABLE budget_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    supplier_id UUID REFERENCES suppliers(id),
    action VARCHAR(50) NOT NULL, -- 'SUPPLIER_ADDED', 'SUPPLIER_REMOVED', 'BUDGET_CHANGED'
    old_budget DECIMAL(12,2),
    new_budget DECIMAL(12,2),
    consumed_budget DECIMAL(12,2),
    available_budget DECIMAL(12,2),
    reason TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project-Suppliers Audit-Erweiterung
ALTER TABLE project_suppliers ADD COLUMN removed_at TIMESTAMPTZ NULL;
ALTER TABLE project_suppliers ADD COLUMN available_at_removal DECIMAL(12,2) NULL;
ALTER TABLE project_suppliers ADD COLUMN removal_reason TEXT NULL;
ALTER TABLE project_suppliers ADD COLUMN removed_by UUID REFERENCES auth.users(id);
```

### **API-Endpoints Erweiterungen**
```javascript
// Intelligente Dienstleister-Entfernung
DELETE /api/projects/:id/suppliers/:supplierId
// → Soft Delete + Budget-Rückfluss + Audit-Log

// Soft Delete für Entitäten
DELETE /api/admin/suppliers/:id
DELETE /api/admin/categories/:id
DELETE /api/admin/teams/:id
DELETE /api/admin/tags/:id
// → is_active = false + deleted_at + deleted_by

// Gefilterte Entitäten-Abfrage
GET /api/suppliers?active=true          // Nur aktive für Dropdowns
GET /api/suppliers?include_deleted=true // Alle für Admin-Bereich
GET /api/projects/:id/suppliers?include_deleted=true // Alle für Projekt-Anzeige

// Audit-Trail
GET /api/projects/:id/audit-log
GET /api/admin/audit-log?entity_type=supplier&entity_id=:id
```

### **Frontend-Komponenten**
```typescript
// Erweiterte Komponenten
DeletedEntityIndicator.tsx
AuditTrailViewer.tsx
BudgetChangeHistory.tsx
SoftDeleteConfirmation.tsx

// Erweiterte States
interface EntityWithSoftDelete {
  id: string;
  name: string;
  is_active: boolean;
  deleted_at?: Date;
  deleted_by?: string;
}

interface BudgetAuditEntry {
  id: string;
  action: string;
  old_budget: number;
  new_budget: number;
  consumed_budget: number;
  available_budget: number;
  reason: string;
  created_by: string;
  created_at: Date;
}
```

---

## 💰 **INTELLIGENTE BUDGET-LOGIK**

### **Dienstleister-Entfernung Algorithmus**
```javascript
const removeSupplierIntelligently = async (projectId, supplierId, reason) => {
  // 1. Aktuelle Allocation abrufen
  const allocation = await getProjectSupplierAllocation(projectId, supplierId);
  
  // 2. Budget-Berechnungen
  const consumedBudget = allocation.consumed_budget; // BLEIBT BESTEHEN
  const availableBudget = allocation.allocated_budget - consumedBudget; // FLIESS ZURÜCK
  
  // 3. Audit-Log BEFORE Änderung
  await createBudgetAuditLog({
    project_id: projectId,
    supplier_id: supplierId,
    action: 'SUPPLIER_REMOVED',
    old_budget: allocation.allocated_budget,
    new_budget: 0,
    consumed_budget: consumedBudget,
    available_budget: availableBudget,
    reason: reason,
    created_by: currentUser.id
  });
  
  // 4. Transaktionale Updates
  await db.transaction(async (trx) => {
    // 4a. Projekt-Budget erhöhen (nur verfügbares Budget)
    await trx('projects')
      .where('id', projectId)
      .increment('external_budget', availableBudget);
    
    // 4b. Supplier-Zuordnung soft delete
    await trx('project_suppliers')
      .where({ project_id: projectId, supplier_id: supplierId })
      .update({
        is_active: false,
        removed_at: new Date(),
        available_at_removal: availableBudget,
        removal_reason: reason,
        removed_by: currentUser.id
      });
  });
  
  // 5. Real-time Updates
  await broadcastBudgetUpdate(projectId, {
    type: 'SUPPLIER_REMOVED',
    supplier_id: supplierId,
    budget_returned: availableBudget,
    consumed_preserved: consumedBudget
  });
  
  return {
    success: true,
    budget_returned: availableBudget,
    consumed_preserved: consumedBudget,
    audit_id: auditLog.id
  };
};
```

### **Soft-Delete Implementierung**
```javascript
const softDeleteEntity = async (entityType, entityId, reason) => {
  const table = getTableName(entityType); // 'suppliers', 'categories', etc.
  
  // 1. Prüfung auf bestehende Referenzen
  const references = await checkEntityReferences(entityType, entityId);
  
  // 2. Soft Delete ausführen
  await db(table)
    .where('id', entityId)
    .update({
      is_active: false,
      deleted_at: new Date(),
      deleted_by: currentUser.id
    });
  
  // 3. Audit-Log erstellen
  await createEntityAuditLog({
    entity_type: entityType,
    entity_id: entityId,
    action: 'SOFT_DELETE',
    reason: reason,
    references_count: references.length,
    created_by: currentUser.id
  });
  
  // 4. Cache invalidieren
  await invalidateEntityCache(entityType);
  
  return {
    success: true,
    references_preserved: references.length,
    can_be_restored: true
  };
};
```

---

## 🎨 **UI/UX DESIGN**

### **Gelöschte Entitäten in Projekten**
```
┌─ Zugewiesene Dienstleister ───────────────────┐
│                                               │
│ ┌─ Acme Corp GmbH ─────────────────────────┐  │
│ │ Budget: 20.000€ | Verbraucht: 8.000€    │  │
│ │ [Bearbeiten] [Entfernen]                 │  │
│ └─────────────────────────────────────────────┘  │
│                                               │
│ ┌─ TechSolutions AG (Gelöscht) ────────────┐  │
│ │ Budget: 15.000€ | Verbraucht: 15.000€   │  │
│ │ ⚠️ Dienstleister wurde am 01.09.2025     │  │
│ │    von Admin gelöscht                    │  │
│ │ [Details anzeigen]                       │  │
│ └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

### **Budget-Entfernung Bestätigung**
```
┌─ Dienstleister entfernen ─────────────────────┐
│                                               │
│ Möchten Sie "Acme Corp GmbH" wirklich         │
│ aus diesem Projekt entfernen?                 │
│                                               │
│ ┌─ Budget-Auswirkung ─────────────────────────┐ │
│ │ Zugewiesenes Budget:    20.000,00 €        │ │
│ │ Bereits verbraucht:      8.000,00 €        │ │
│ │ Verfügbares Budget:     12.000,00 €        │ │
│ │                                            │ │
│ │ ✅ Verbrauchte Kosten bleiben erhalten     │ │
│ │ ✅ 12.000€ fließen zurück ins Projekt      │ │
│ └────────────────────────────────────────────┘ │
│                                               │
│ Grund (optional):                             │
│ [Dienstleister-Wechsel                      ] │
│                                               │
│ [Abbrechen] [Entfernen bestätigen]            │
└───────────────────────────────────────────────┘
```

### **Admin-Bereich Soft-Delete**
```
┌─ Dienstleister-Verwaltung ────────────────────┐
│                                               │
│ Filter: [Alle ▼] [Aktiv] [Gelöscht]          │
│                                               │
│ ┌─ Acme Corp GmbH ─────────────────────────┐  │
│ │ Status: ✅ Aktiv                         │  │
│ │ Projekte: 3 | Letzte Nutzung: Heute     │  │
│ │ [Bearbeiten] [Löschen]                   │  │
│ └─────────────────────────────────────────────┘  │
│                                               │
│ ┌─ TechSolutions AG ───────────────────────┐  │
│ │ Status: ❌ Gelöscht (01.09.2025)         │  │
│ │ Projekte: 2 | Grund: Vertragsende       │  │
│ │ [Details] [Wiederherstellen]             │  │
│ └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

---

## 🧪 **TESTING**

### **Unit Tests**
```javascript
describe('Intelligent Budget Logic', () => {
  test('preserves consumed budget on supplier removal');
  test('returns only available budget to project');
  test('creates complete audit trail');
  test('handles concurrent budget operations');
});

describe('Soft Delete System', () => {
  test('soft deletes entity without breaking references');
  test('filters active entities in dropdowns');
  test('shows deleted entities in projects');
  test('allows entity restoration');
});
```

### **Integration Tests**
```javascript
describe('Budget Intelligence Integration', () => {
  test('end-to-end supplier removal with budget return');
  test('audit trail completeness');
  test('real-time budget updates');
  test('transaction rollback on errors');
});

describe('Soft Delete Integration', () => {
  test('entity deletion across all related tables');
  test('dropdown filtering after deletion');
  test('project display of deleted entities');
  test('admin restoration workflow');
});
```

### **Browser Tests (MCP)**
```javascript
// E2E Test-Szenario: Intelligente Budget-Logik
1. Projekt mit Dienstleister A (30.000€) erstellen
2. Rechnung über 12.000€ zuweisen → consumed_budget = 12.000€
3. Dienstleister A entfernen
4. Prüfen: Verfügbares Budget +18.000€ ✅
5. Prüfen: Verbrauchtes Budget bleibt 12.000€ ✅
6. Audit-Log prüfen: Vollständige Dokumentation ✅

// E2E Test-Szenario: Soft Delete
1. Admin-Bereich → Dienstleister löschen
2. Bestehende Projekte: Dienstleister sichtbar (grau) ✅
3. Neue Projekte: Dienstleister nicht in Dropdown ✅
4. Admin-Bereich: Dienstleister wiederherstellen
5. Neue Projekte: Dienstleister wieder verfügbar ✅
```

---

## 📊 **DEFINITION OF DONE**

- [ ] Alle Akzeptanzkriterien erfüllt
- [ ] Intelligente Budget-Logik implementiert
- [ ] Soft-Delete-System für alle Entitäten
- [ ] Audit-Trail vollständig funktional
- [ ] Datenbank-Migrationen erstellt
- [ ] API-Endpoints erweitert
- [ ] Frontend-Komponenten implementiert
- [ ] Unit Tests geschrieben (>95% Coverage)
- [ ] Integration Tests bestanden
- [ ] Browser-Tests erfolgreich
- [ ] Performance-Tests bestanden
- [ ] Security-Review abgeschlossen
- [ ] Code Review abgeschlossen
- [ ] Dokumentation aktualisiert

---

## 🔗 **ABHÄNGIGKEITEN**

### **Voraussetzungen**
- Story 9.1: Semantische UI-Struktur
- Story 9.2: Multi-Dienstleister-System
- Audit-System-Grundlagen
- Transaktionale Datenbank-Operationen

### **Nachfolgende Stories**
- Story 9.4: Inline-Entity-Creation
- Story 9.5: Kosten-Übersicht

---

## 📝 **IMPLEMENTIERUNGS-NOTIZEN**

### **Kritische Sicherheitsaspekte**
- Alle Budget-Operationen in Transaktionen
- Rollback-Mechanismus bei Fehlern
- Berechtigungsprüfung für alle Lösch-Operationen
- Audit-Logs vor Datenänderungen erstellen

### **Performance-Überlegungen**
- Indizierung für `is_active` Felder
- Effiziente Abfragen für gefilterte Entitäten
- Caching-Strategien für aktive Entitäten
- Batch-Updates für große Datenmengen

### **Datenintegrität**
- Foreign Key Constraints bleiben bestehen
- Check Constraints für Budget-Validierung
- Trigger für automatische Audit-Log-Erstellung
- Backup-Strategien für kritische Operationen



