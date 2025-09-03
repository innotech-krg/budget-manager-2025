# Story 9.1: Semantische UI-Struktur

## 📋 **STORY DETAILS**

**Epic**: 9 - Erweiterte Projekt-Verwaltung  
**Story**: 9.1  
**Titel**: Semantische UI-Struktur (Allgemein/Extern/Intern/Übersicht)  
**Status**: ✅ ABGESCHLOSSEN  
**Priorität**: HOCH  
**Aufwand**: 2 Tage  
**Entwickler**: @dev.mdc  

---

## 🎯 **USER STORY**

**Als** Projektmanager  
**möchte ich** eine klar strukturierte Projekt-Erstellungsmaske mit semantischen Bereichen  
**damit** ich effizient alle Projekt-Aspekte organisiert erfassen kann.

---

## 📝 **BESCHREIBUNG**

Komplette Überarbeitung der Projekt-Erstellungsmaske mit vier semantischen Sektionen:

### **1. ALLGEMEIN** (Allgemeine Projekt-Eigenschaften)
- Projektname, Beschreibung, Status
- Kategorien (DB-geladen + Inline-Erstellung)
- Tags (DB-geladen + Inline-Erstellung)
- Projekt-Zeitraum

### **2. EXTERN** (Externe Dienstleister)
- Manuelles Gesamt-Externes-Budget
- Multi-Dienstleister-Liste (optional)
- Flexible Budget-Aufteilung pro Dienstleister
- Inline-Dienstleister-Erstellung

### **3. INTERN** (Interne Leistungen)
- Team-Zuweisungen (DB-geladen + Inline-Erstellung)
- Team-Lead Auswahl (reine Information)
- Interne Kosten-Kalkulation (kein Jahresbudget-Einfluss)

### **4. ÜBERSICHT** (Kosten & Budget-Auswirkungen)
- Externes Budget: Gesamt vs. Zugewiesen
- Internes Budget: Kalkulierte Kosten
- Jahresbudget-Auswirkung: Nur externe Kosten
- Verfügbares Projektbudget

---

## ✅ **AKZEPTANZKRITERIEN**

### **AC1: Semantische Sektionen** ✅
- [x] Vier klar getrennte Bereiche: Allgemein/Extern/Intern/Übersicht
- [x] Visuelle Trennung durch Cards/Panels
- [x] Logische Reihenfolge der Eingabefelder
- [x] Responsive Design für alle Bildschirmgrößen

### **AC2: Allgemein-Sektion** ✅
- [x] Projektname (Pflichtfeld)
- [x] Beschreibung (Optional)
- [x] Kategorie-Dropdown (DB-geladen)
- [x] Tags-Multi-Select (DB-geladen)
- [x] Start-/End-Datum
- [x] Status-Auswahl

### **AC3: Extern-Sektion** ✅
- [x] Manuelles Externes-Budget-Eingabefeld
- [x] Multi-Dienstleister-Liste (leer startend)
- [x] "Dienstleister hinzufügen" Button
- [x] Budget-Aufteilungs-Anzeige
- [x] Unzugewiesenes Budget anzeigen

### **AC4: Intern-Sektion** ✅
- [x] Team-Multi-Select (DB-geladen)
- [x] Team-Lead-Dropdown (aus gewählten Teams)
- [x] Interne Kosten-Kalkulation
- [x] Hinweis: "Keine Jahresbudget-Auswirkung"

### **AC5: Übersicht-Sektion** ✅
- [x] Budget-Zusammenfassung
- [x] Jahresbudget-Auswirkung
- [x] Kosten-Aufschlüsselung
- [x] Validierungs-Status

---

## 🛠️ **TECHNISCHE ANFORDERUNGEN**

### **Frontend-Komponenten**
```typescript
// Haupt-Komponente
ProjectForm.tsx (Überarbeitet)
├── ProjectSectionAllgemein.tsx
├── ProjectSectionExtern.tsx
├── ProjectSectionIntern.tsx
└── ProjectSectionÜbersicht.tsx

// Neue Komponenten
InlineEntityCreator.tsx
BudgetSummaryCard.tsx
SectionHeader.tsx
```

### **State Management**
```typescript
interface ProjectFormState {
  // Allgemein
  general: {
    name: string;
    description: string;
    category_id: string;
    tag_ids: string[];
    start_date: Date;
    end_date: Date;
    status: string;
  };
  
  // Extern
  external: {
    total_budget: number;
    suppliers: ProjectSupplier[];
    unallocated_budget: number;
  };
  
  // Intern
  internal: {
    team_ids: string[];
    team_lead_id: string;
    estimated_costs: number;
  };
}
```

### **API-Integration**
```javascript
// Daten laden
GET /api/categories?active=true
GET /api/suppliers?active=true
GET /api/teams?active=true
GET /api/tags?active=true

// Projekt speichern
POST /api/projects (erweiterte Datenstruktur)
```

---

## 🎨 **UI/UX DESIGN**

### **Layout-Struktur**
```
┌─ PROJEKT ERSTELLEN ────────────────────────────┐
│                                                │
│ ┌─ 1. ALLGEMEIN ─────────────────────────────┐ │
│ │ Projektname, Kategorie, Tags, Zeitraum     │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌─ 2. EXTERN ────────────────────────────────┐ │
│ │ Externes Budget, Dienstleister-Liste       │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌─ 3. INTERN ────────────────────────────────┐ │
│ │ Teams, Team-Lead, Interne Kosten           │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ┌─ 4. ÜBERSICHT ─────────────────────────────┐ │
│ │ Budget-Summary, Jahresbudget-Auswirkung    │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ [Abbrechen] [Speichern]                        │
└────────────────────────────────────────────────┘
```

### **Visuelle Gestaltung**
- **Sektions-Header**: Große, klare Überschriften mit Icons
- **Card-Design**: Jede Sektion in eigener Card
- **Fortschritts-Indikator**: Zeigt Vollständigkeit der Eingaben
- **Validierungs-Feedback**: Echtzeit-Validierung mit visuellen Hinweisen

---

## 🧪 **TESTING**

### **Unit Tests**
```javascript
// Komponenten-Tests
ProjectSectionAllgemein.test.tsx
ProjectSectionExtern.test.tsx
ProjectSectionIntern.test.tsx
ProjectSectionÜbersicht.test.tsx

// State Management Tests
projectFormReducer.test.ts
```

### **Integration Tests**
```javascript
// Form-Validierung
describe('ProjectForm Validation', () => {
  test('validates required fields');
  test('validates budget calculations');
  test('validates date ranges');
});

// API-Integration
describe('ProjectForm API Integration', () => {
  test('loads entities from database');
  test('saves project with all sections');
  test('handles API errors gracefully');
});
```

### **Browser Tests (MCP)**
```javascript
// E2E Tests
1. Projekt-Formular öffnen
2. Alle vier Sektionen sichtbar
3. Daten in jeder Sektion eingeben
4. Übersicht-Sektion zeigt korrekte Berechnungen
5. Projekt erfolgreich speichern
```

---

## 📊 **DEFINITION OF DONE**

- [ ] Alle Akzeptanzkriterien erfüllt
- [ ] Unit Tests geschrieben und bestanden (>90% Coverage)
- [ ] Integration Tests bestanden
- [ ] Browser-Tests erfolgreich
- [ ] Code Review abgeschlossen
- [ ] Dokumentation aktualisiert
- [ ] Performance-Tests bestanden (<300ms)
- [ ] Accessibility-Standards erfüllt (WCAG 2.1)

---

## 🔗 **ABHÄNGIGKEITEN**

### **Voraussetzungen**
- Bestehende Entity-CRUD-APIs funktional
- Datenbank-Schema für Entitäten vorhanden
- Authentication/Authorization implementiert

### **Nachfolgende Stories**
- Story 9.2: Multi-Dienstleister-System
- Story 9.3: Intelligente Budget-Logik
- Story 9.4: Inline-Entity-Creation

---

## 📝 **IMPLEMENTIERUNGS-NOTIZEN**

### **Technische Hinweise**
- Verwendung von React Hook Form für Form-Management
- Zod für Schema-Validierung
- TailwindCSS für konsistentes Styling
- React Query für API-State-Management

### **Performance-Optimierungen**
- Lazy Loading für große Entity-Listen
- Debounced Input für Echtzeit-Berechnungen
- Memoization für teure Berechnungen
- Virtualisierung bei vielen Dienstleistern

### **Accessibility**
- ARIA-Labels für alle Form-Elemente
- Keyboard-Navigation zwischen Sektionen
- Screen-Reader-freundliche Struktur
- Fokus-Management bei Sektion-Wechsel
