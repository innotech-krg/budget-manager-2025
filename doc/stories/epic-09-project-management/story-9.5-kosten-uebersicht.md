# Story 9.5: Kosten-Übersicht mit Budget-Auswirkungen

## 📋 **STORY DETAILS**

**Epic**: 9 - Erweiterte Projekt-Verwaltung  
**Story**: 9.5  
**Titel**: Kosten-Übersicht mit Budget-Auswirkungen  
**Status**: 🔄 PENDING  
**Priorität**: MITTEL  
**Aufwand**: 1 Tag  
**Entwickler**: @dev.mdc  

---

## 🎯 **USER STORY**

**Als** Projektmanager  
**möchte ich** eine übersichtliche Darstellung aller Kosten und deren Auswirkungen auf das Jahresbudget  
**damit** ich fundierte Budget-Entscheidungen treffen kann.

---

## 📝 **BESCHREIBUNG**

Implementierung einer umfassenden Kosten-Übersicht als vierte Sektion im Projekt-Formular:

### **Übersichts-Komponenten**
1. **Externes Budget-Summary**: Gesamt, Zugewiesen, Unzugewiesen
2. **Internes Budget-Summary**: Kalkulierte Team-Kosten
3. **Jahresbudget-Auswirkung**: Nur externe Kosten beeinflussen Jahresbudget
4. **Historische Daten**: Entfernte Dienstleister und Budget-Änderungen
5. **Validierungs-Status**: Vollständigkeit und Konsistenz-Prüfung

### **Kernfunktionen**
- **Real-time Berechnungen**: Automatische Updates bei Änderungen
- **Visuelle Budget-Darstellung**: Charts und Progress-Bars
- **Historische Transparenz**: Audit-Trail-Integration
- **Validierungs-Feedback**: Echtzeit-Konsistenz-Prüfung
- **Export-Funktionen**: Budget-Übersicht als PDF/Excel

---

## ✅ **AKZEPTANZKRITERIEN**

### **AC1: Externes Budget-Summary**
- [ ] Gesamt-Externes-Budget prominent angezeigt
- [ ] Zugewiesenes Budget (Summe aller Dienstleister)
- [ ] Unzugewiesenes Budget (Differenz)
- [ ] Verbrauchtes Budget (aus Rechnungen)
- [ ] Verfügbares Budget (Gesamt - Verbraucht)

### **AC2: Internes Budget-Summary**
- [ ] Kalkulierte Team-Kosten basierend auf Rollen und Stundensätzen
- [ ] Aufschlüsselung nach Teams und Rollen
- [ ] Geschätzte Projektdauer-Berücksichtigung
- [ ] Hinweis: "Keine Jahresbudget-Auswirkung"

### **AC3: Jahresbudget-Auswirkung**
- [ ] Aktuelles verfügbares Jahresbudget anzeigen
- [ ] Auswirkung des Projekts auf Jahresbudget (nur extern)
- [ ] Verbleibendes Jahresbudget nach Projekt-Allokation
- [ ] Warnung bei Jahresbudget-Überschreitung

### **AC4: Historische Budget-Darstellung**
- [ ] Aktive Dienstleister mit aktuellen Budgets
- [ ] Entfernte Dienstleister (grau/durchgestrichen)
- [ ] Budget-Änderungs-Historie
- [ ] Audit-Trail-Integration

### **AC5: Validierungs-Status**
- [ ] Vollständigkeits-Check aller Sektionen
- [ ] Budget-Konsistenz-Validierung
- [ ] Pflichtfeld-Validierung
- [ ] Visuelles Feedback (Ampel-System)

---

## 🛠️ **TECHNISCHE ANFORDERUNGEN**

### **Frontend-Komponenten**
```typescript
// Haupt-Komponente
ProjectSectionÜbersicht.tsx
├── ExternalBudgetSummary.tsx
├── InternalBudgetSummary.tsx
├── YearlyBudgetImpact.tsx
├── HistoricalBudgetView.tsx
├── ValidationStatus.tsx
└── BudgetExportOptions.tsx

// Chart-Komponenten
BudgetAllocationChart.tsx
BudgetProgressBar.tsx
YearlyBudgetGauge.tsx

// Typen
interface BudgetSummary {
  external: {
    total: number;
    allocated: number;
    consumed: number;
    unallocated: number;
    available: number;
  };
  internal: {
    estimated_costs: number;
    team_breakdown: TeamCostBreakdown[];
    total_hours: number;
    average_hourly_rate: number;
  };
  yearly_impact: {
    current_available: number;
    project_allocation: number;
    remaining_after_project: number;
    utilization_percentage: number;
  };
  validation: {
    is_complete: boolean;
    is_consistent: boolean;
    warnings: ValidationWarning[];
    errors: ValidationError[];
  };
}

interface TeamCostBreakdown {
  team_id: string;
  team_name: string;
  roles: RoleCostBreakdown[];
  total_cost: number;
  estimated_hours: number;
}

interface RoleCostBreakdown {
  role_id: string;
  role_name: string;
  hourly_rate: number;
  estimated_hours: number;
  total_cost: number;
}
```

### **Berechnungs-Engine**
```javascript
// Budget-Berechnungen
const calculateBudgetSummary = (projectData) => {
  // Externes Budget
  const externalSummary = {
    total: projectData.external_budget,
    allocated: projectData.suppliers.reduce((sum, s) => sum + s.allocated_budget, 0),
    consumed: projectData.suppliers.reduce((sum, s) => sum + s.consumed_budget, 0),
    unallocated: 0,
    available: 0
  };
  
  externalSummary.unallocated = externalSummary.total - externalSummary.allocated;
  externalSummary.available = externalSummary.total - externalSummary.consumed;
  
  // Internes Budget
  const internalSummary = calculateInternalCosts(projectData.teams, projectData.estimated_duration);
  
  // Jahresbudget-Auswirkung
  const yearlyImpact = {
    current_available: await getAvailableYearlyBudget(),
    project_allocation: externalSummary.total,
    remaining_after_project: 0,
    utilization_percentage: 0
  };
  
  yearlyImpact.remaining_after_project = yearlyImpact.current_available - yearlyImpact.project_allocation;
  yearlyImpact.utilization_percentage = (yearlyImpact.project_allocation / yearlyImpact.current_available) * 100;
  
  // Validierung
  const validation = validateProjectBudget(projectData);
  
  return {
    external: externalSummary,
    internal: internalSummary,
    yearly_impact: yearlyImpact,
    validation: validation
  };
};

// Interne Kosten-Berechnung
const calculateInternalCosts = (teams, estimatedDuration) => {
  const teamBreakdown = teams.map(team => {
    const roleBreakdown = team.roles.map(role => ({
      role_id: role.id,
      role_name: role.name,
      hourly_rate: role.standard_stundensatz,
      estimated_hours: estimatedDuration * role.weekly_hours || 40,
      total_cost: (estimatedDuration * (role.weekly_hours || 40)) * role.standard_stundensatz
    }));
    
    return {
      team_id: team.id,
      team_name: team.name,
      roles: roleBreakdown,
      total_cost: roleBreakdown.reduce((sum, r) => sum + r.total_cost, 0),
      estimated_hours: roleBreakdown.reduce((sum, r) => sum + r.estimated_hours, 0)
    };
  });
  
  return {
    estimated_costs: teamBreakdown.reduce((sum, t) => sum + t.total_cost, 0),
    team_breakdown: teamBreakdown,
    total_hours: teamBreakdown.reduce((sum, t) => sum + t.estimated_hours, 0),
    average_hourly_rate: calculateAverageHourlyRate(teamBreakdown)
  };
};

// Validierung
const validateProjectBudget = (projectData) => {
  const warnings = [];
  const errors = [];
  
  // Budget-Konsistenz prüfen
  const totalAllocated = projectData.suppliers.reduce((sum, s) => sum + s.allocated_budget, 0);
  if (totalAllocated > projectData.external_budget) {
    errors.push({
      type: 'BUDGET_OVERALLOCATION',
      message: `Budget um ${totalAllocated - projectData.external_budget}€ überschritten`,
      severity: 'error'
    });
  }
  
  // Jahresbudget-Überschreitung prüfen
  const availableYearlyBudget = await getAvailableYearlyBudget();
  if (projectData.external_budget > availableYearlyBudget) {
    errors.push({
      type: 'YEARLY_BUDGET_EXCEEDED',
      message: `Jahresbudget um ${projectData.external_budget - availableYearlyBudget}€ überschritten`,
      severity: 'error'
    });
  }
  
  // Warnungen für hohe Budget-Nutzung
  const utilizationPercentage = (projectData.external_budget / availableYearlyBudget) * 100;
  if (utilizationPercentage > 80) {
    warnings.push({
      type: 'HIGH_BUDGET_UTILIZATION',
      message: `Hohe Jahresbudget-Nutzung: ${utilizationPercentage.toFixed(1)}%`,
      severity: 'warning'
    });
  }
  
  return {
    is_complete: validateCompleteness(projectData),
    is_consistent: errors.length === 0,
    warnings: warnings,
    errors: errors
  };
};
```

---

## 🎨 **UI/UX DESIGN**

### **Übersichts-Sektion Layout**
```
┌─ 4. ÜBERSICHT (Kosten & Budget-Auswirkungen) ─┐
│                                               │
│ ┌─ Externes Budget ─────────────────────────┐  │
│ │ Gesamt:        50.000,00 € ████████████  │  │
│ │ Zugewiesen:    35.000,00 € ████████░░░░  │  │
│ │ Verbraucht:     8.000,00 € ██░░░░░░░░░░  │  │
│ │ Verfügbar:     42.000,00 € ██████████░░  │  │
│ │ Unzugewiesen:  15.000,00 € ███░░░░░░░░░  │  │
│ └───────────────────────────────────────────┘  │
│                                               │
│ ┌─ Internes Budget ─────────────────────────┐  │
│ │ Geschätzte Kosten: 45.000,00 €           │  │
│ │ ⚠️ Keine Jahresbudget-Auswirkung          │  │
│ │                                           │  │
│ │ Team-Aufschlüsselung:                     │  │
│ │ • Development Team:    30.000€ (400h)    │  │
│ │ • QA Team:            15.000€ (200h)    │  │
│ └───────────────────────────────────────────┘  │
│                                               │
│ ┌─ Jahresbudget-Auswirkung ─────────────────┐  │
│ │ Verfügbares Jahresbudget: 500.000,00 €   │  │
│ │ Projekt-Allokation:        50.000,00 €   │  │
│ │ Verbleibendes Budget:     450.000,00 €   │  │
│ │ Nutzung: 10% ██░░░░░░░░░░░░░░░░░░░░░░░░   │  │
│ └───────────────────────────────────────────┘  │
│                                               │
│ ┌─ Validierungs-Status ─────────────────────┐  │
│ │ ✅ Projekt vollständig                     │  │
│ │ ✅ Budget konsistent                       │  │
│ │ ⚠️  Hohe Jahresbudget-Nutzung (10%)       │  │
│ └───────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

### **Budget-Charts**
```
┌─ Budget-Verteilung ───────────────────────────┐
│                                               │
│     Externes Budget (50.000€)                │
│                                               │
│     ┌─────────────────────────────────────┐   │
│     │ Dienstleister A    │ 20.000€ │ 40% │   │
│     │ Dienstleister B    │ 15.000€ │ 30% │   │
│     │ Unzugewiesen       │ 15.000€ │ 30% │   │
│     └─────────────────────────────────────┘   │
│                                               │
│     [Pie Chart Visualization]                 │
│                                               │
└───────────────────────────────────────────────┘
```

### **Historische Budget-Ansicht**
```
┌─ Budget-Historie ─────────────────────────────┐
│                                               │
│ Aktive Dienstleister:                         │
│ ┌─ Acme Corp GmbH ─────────────────────────┐  │
│ │ Zugewiesen: 20.000€ | Verbraucht: 8.000€ │  │
│ │ Status: ✅ Aktiv                          │  │
│ └───────────────────────────────────────────┘  │
│                                               │
│ Entfernte Dienstleister:                      │
│ ┌─ TechSolutions AG (Entfernt) ────────────┐  │
│ │ Zugewiesen: 15.000€ | Verbraucht: 15.000€│  │
│ │ Entfernt: 01.09.2025 | Grund: Vertragsende│  │
│ │ Budget zurückgeflossen: 0€                │  │
│ └───────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

---

## 📊 **REAL-TIME UPDATES**

### **Automatische Berechnungen**
```javascript
// React Hook für Real-time Budget-Berechnungen
const useBudgetSummary = (projectData) => {
  const [summary, setSummary] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Debounced Berechnung bei Änderungen
  const debouncedCalculation = useMemo(
    () => debounce(async (data) => {
      setIsCalculating(true);
      try {
        const newSummary = await calculateBudgetSummary(data);
        setSummary(newSummary);
      } catch (error) {
        console.error('Budget calculation failed:', error);
      } finally {
        setIsCalculating(false);
      }
    }, 300),
    []
  );
  
  // Trigger bei Datenänderungen
  useEffect(() => {
    if (projectData) {
      debouncedCalculation(projectData);
    }
  }, [
    projectData.external_budget,
    projectData.suppliers,
    projectData.teams,
    projectData.estimated_duration
  ]);
  
  return { summary, isCalculating };
};

// WebSocket Integration für Jahresbudget-Updates
const useYearlyBudgetUpdates = () => {
  const [yearlyBudget, setYearlyBudget] = useState(null);
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'YEARLY_BUDGET_UPDATE') {
        setYearlyBudget(data.budget);
      }
    };
    
    return () => ws.close();
  }, []);
  
  return yearlyBudget;
};
```

---

## 🧪 **TESTING**

### **Unit Tests**
```javascript
describe('Budget Summary Calculations', () => {
  test('calculates external budget summary correctly');
  test('calculates internal budget breakdown');
  test('calculates yearly budget impact');
  test('validates budget consistency');
  test('handles edge cases (zero budgets, no teams)');
});

describe('Real-time Updates', () => {
  test('recalculates on external budget change');
  test('recalculates on supplier addition/removal');
  test('recalculates on team changes');
  test('debounces rapid changes');
});
```

### **Integration Tests**
```javascript
describe('Budget Overview Integration', () => {
  test('displays complete budget summary');
  test('shows validation warnings and errors');
  test('updates in real-time with form changes');
  test('integrates with yearly budget API');
});
```

### **Browser Tests (MCP)**
```javascript
// E2E Test-Szenario: Kosten-Übersicht
1. Projekt-Formular mit allen Sektionen ausfüllen
2. Übersichts-Sektion öffnen
3. Externes Budget-Summary prüfen ✅
4. Internes Budget-Summary prüfen ✅
5. Jahresbudget-Auswirkung prüfen ✅
6. Validierungs-Status prüfen ✅

// E2E Test-Szenario: Real-time Updates
1. Externes Budget ändern → Übersicht aktualisiert ✅
2. Dienstleister hinzufügen → Budget-Aufteilung aktualisiert ✅
3. Team hinzufügen → Interne Kosten aktualisiert ✅
4. Validierungs-Fehler erzeugen → Status aktualisiert ✅
```

---

## 📊 **DEFINITION OF DONE**

- [ ] Alle Akzeptanzkriterien erfüllt
- [ ] Real-time Budget-Berechnungen implementiert
- [ ] Visuelle Budget-Darstellung (Charts, Progress-Bars)
- [ ] Historische Budget-Ansicht
- [ ] Validierungs-System vollständig
- [ ] Unit Tests geschrieben (>90% Coverage)
- [ ] Integration Tests bestanden
- [ ] Browser-Tests erfolgreich
- [ ] Performance-Tests bestanden (<100ms Berechnungen)
- [ ] Accessibility-Tests bestanden
- [ ] Code Review abgeschlossen
- [ ] Dokumentation aktualisiert

---

## 🔗 **ABHÄNGIGKEITEN**

### **Voraussetzungen**
- Story 9.1: Semantische UI-Struktur
- Story 9.2: Multi-Dienstleister-System
- Story 9.3: Intelligente Budget-Logik
- Jahresbudget-API funktional
- Team-Rollen-System mit Stundensätzen

### **Nachfolgende Stories**
- Keine (Abschluss von Epic 9)

---

## 📝 **IMPLEMENTIERUNGS-NOTIZEN**

### **Performance-Optimierungen**
- Memoization für teure Budget-Berechnungen
- Debounced Updates für bessere UX
- Lazy Loading für Chart-Komponenten
- WebWorker für komplexe Berechnungen

### **Accessibility-Anforderungen**
- Screen-Reader-freundliche Chart-Beschreibungen
- Keyboard-Navigation für alle Interaktionen
- Hoher Kontrast für Budget-Status-Anzeigen
- ARIA-Labels für alle visuellen Elemente

### **Internationalisierung**
- Währungsformatierung (EUR)
- Dezimaltrennzeichen (Komma)
- Tausendertrennzeichen (Punkt)
- Responsive Zahlen-Darstellung



