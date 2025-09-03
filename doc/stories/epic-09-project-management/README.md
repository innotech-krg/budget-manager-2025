# Epic 9: Erweiterte Projekt-Verwaltung

## 🎯 **EPIC-ÜBERBLICK**

**Status**: ✅ ABGESCHLOSSEN (mit Erweiterungen)  
**Priorität**: HOCH  
**Entwickler**: @dev.mdc  
**Tatsächliche Dauer**: 8 Tage (erweitert um Projekt-Detailansicht)  

### **VISION**
Vollständige Überarbeitung der Projekt-Verwaltung mit semantischer UI-Struktur, flexiblem Multi-Dienstleister-System, intelligenter Budget-Logik und Soft-Delete-Funktionalität für alle Entitäten.

---

## 📋 **STORIES ÜBERSICHT**

| Story | Titel | Status | Priorität | Aufwand |
|-------|-------|--------|-----------|---------|
| 9.1 | Semantische UI-Struktur (Allgemein/Extern/Intern) | ✅ Abgeschlossen | Hoch | 2 Tage |
| 9.2 | Multi-Dienstleister-System mit flexibler Budget-Aufteilung | ✅ Abgeschlossen | Hoch | 2 Tage |
| 9.3 | Intelligente Budget-Logik und Soft-Delete | ✅ Abgeschlossen | Hoch | 2 Tage |
| 9.4 | Inline-Entity-Creation für alle Entitäten | ✅ Abgeschlossen | Mittel | 1 Tag |
| 9.5 | Kosten-Übersicht mit Budget-Auswirkungen | ✅ Abgeschlossen | Mittel | 1 Tag |
| 9.6 | **BONUS**: Projekt-Detailansicht mit dynamischen Stunden | ✅ Abgeschlossen | Hoch | 2 Tage |

**Gesamt**: 6 Stories (5 geplant + 1 Bonus), 10 Tage Entwicklungszeit

---

## 🎯 **HAUPTZIELE**

### **1. Benutzerfreundlichkeit**
- Semantische Gruppierung: Allgemein → Extern → Intern → Übersicht
- Inline-Erstellung aller Entitäten direkt aus Dropdowns
- Klare visuelle Trennung zwischen externen und internen Kosten

### **2. Flexible Budget-Verwaltung**
- Manuell einstellbares externes Budget (unabhängig von Dienstleister-Summe)
- Intelligente Budget-Rückflüsse bei Dienstleister-Entfernung
- Erhaltung verbrauchter Kosten für Audit-Compliance

### **3. Datenintegrität**
- Soft-Delete für alle Entitäten (Suppliers, Categories, Teams, Tags)
- Historische Daten bleiben vollständig erhalten
- Vollständige Audit-Trails für alle Budget-Änderungen

---

## 🏗️ **TECHNISCHE ARCHITEKTUR**

### **Frontend-Komponenten**
```
ProjectForm.tsx (Überarbeitet)
├── AllgemeinSection.tsx (Neue Sektion)
├── ExternSection.tsx (Multi-Dienstleister)
├── InternSection.tsx (Team-Management)
└── ÜbersichtSection.tsx (Budget-Summary)

Neue Komponenten:
├── MultiSupplierManager.tsx
├── InlineEntityCreator.tsx
├── BudgetAllocationChart.tsx
└── SupplierBudgetRow.tsx
```

### **Backend-Erweiterungen**
```
Neue Tabellen:
├── project_suppliers (Many-to-Many mit Audit-Trail)
├── Soft-Delete-Felder für alle Entitäten

Neue API-Endpoints:
├── GET/POST /api/projects/:id/suppliers
├── DELETE /api/projects/:id/suppliers/:supplierId
├── GET /api/entities?active=true (für Dropdowns)
└── GET /api/entities?include_deleted=true (für Projekte)
```

---

## 💰 **BUDGET-LOGIK**

### **Intelligente Dienstleister-Entfernung**
```javascript
// Beispiel: Dienstleister mit 30.000€ Budget, 12.000€ verbraucht
Vor Entfernung:
- Allocated: 30.000€
- Consumed: 12.000€ (durch Rechnungen)
- Available: 18.000€

Nach Entfernung:
- Consumed: 12.000€ → BLEIBT BESTEHEN ✅
- Available: 18.000€ → FLIESS ZURÜCK INS PROJEKT ✅
- Audit-Trail: Vollständig dokumentiert ✅
```

### **Soft-Delete-Verhalten**
```javascript
Admin-Löschung:
- Entität: is_active = false
- Projekte: Weiterhin sichtbar (grau/durchgestrichen)
- Dropdowns: Nicht mehr auswählbar
- Budget-Historie: Vollständig erhalten
```

---

## 🧪 **TESTING-STRATEGIE**

### **Browser-Tests (MCP)**
1. **Projekt mit Multi-Dienstleister erstellen**
2. **Budget flexibel aufteilen (nicht vollständig zuweisen)**
3. **Dienstleister entfernen → Budget-Rückfluss testen**
4. **Inline-Entity-Creation für alle Entitäten**
5. **Admin-Löschung vs. Projekt-Sichtbarkeit**

### **Akzeptanzkriterien**
- [x] Semantische UI-Struktur funktional ✅
- [x] Multi-Dienstleister mit flexibler Budget-Aufteilung ✅
- [x] Intelligente Budget-Rückflüsse ✅
- [x] Soft-Delete für alle Entitäten ✅
- [x] Inline-Entity-Creation ✅
- [x] Vollständige Audit-Trails ✅
- [x] **BONUS**: Projekt-Detailansicht mit dynamischen Stunden ✅
- [x] **BONUS**: Budget-Synchronisation zwischen Projekten und Jahresbudget ✅

---

## 📊 **ERFOLGS-METRIKEN**

- **UI/UX**: < 3 Klicks für Projekt-Erstellung
- **Performance**: < 300ms Ladezeiten
- **Datenintegrität**: 100% Audit-Trail-Abdeckung
- **Benutzerfreundlichkeit**: Alle Entitäten inline erstellbar

---

## 🚀 **NÄCHSTE SCHRITTE**

1. **@dev.mdc**: Story 9.1 - UI-Struktur implementieren
2. **Testing**: Browser-Tests nach jeder Story
3. **Documentation**: API-Dokumentation aktualisieren
4. **Deployment**: Schrittweise Rollout mit Fallback

---

## 📝 **ANMERKUNGEN**

- **Keine Breaking Changes**: Bestehende Projekte bleiben funktional
- **Backward Compatibility**: Alte API-Endpoints weiterhin unterstützt
- **Migration**: Automatische Datenbank-Migration für neue Felder
- **Rollback**: Vollständiger Rollback-Plan verfügbar
