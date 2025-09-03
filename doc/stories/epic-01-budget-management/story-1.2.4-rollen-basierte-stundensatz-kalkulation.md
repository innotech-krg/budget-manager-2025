# Story 1.2.4: Rollen-basierte Stundensatz-Kalkulation

**Epic:** 1 - Kern-Budget-Management-System  
**Story Points:** 13  
**Sprint:** 2-3  
**Priorität:** Mittel  
**Status:** Ready for Development

## User Story

**Als** Projektmanager  
**möchte ich** interne Kosten automatisch basierend auf Rollen und Stundensätzen berechnen lassen  
**damit** ich realistische Projekt-Kosten erhalte und keine manuellen Berechnungen durchführen muss

## Business Context

### Problem Statement
- Aktuell werden interne Kosten manuell geschätzt oder pauschal eingegeben
- Keine standardisierten Stundensätze für verschiedene Rollen
- Fehlende Transparenz bei der Kosten-Kalkulation
- Inkonsistente Preisgestaltung zwischen Projekten

### Business Value
- **Automatische Kosten-Berechnung** reduziert manuellen Aufwand
- **Standardisierte Stundensätze** sorgen für konsistente Kalkulation
- **Transparente Kosten-Aufschlüsselung** verbessert Projekt-Planung
- **Realistische Budget-Planung** durch rollenspezifische Sätze

## Akzeptanzkriterien

### AC-1: Rollen-Stammdaten-Verwaltung
- [ ] **GEGEBEN** ich bin Administrator
- [ ] **WENN** ich die Rollen-Verwaltung öffne
- [ ] **DANN** kann ich Rollen erstellen, bearbeiten und Stundensätze festlegen
- [ ] **UND** Rollen nach Kategorien (Development, Design, etc.) organisieren

### AC-2: Automatische Kosten-Berechnung
- [ ] **GEGEBEN** ich weise einem Team Rollen mit Stunden zu
- [ ] **WENN** ich die Projekt-Kosten betrachte
- [ ] **DANN** werden interne Kosten automatisch berechnet (Stunden × Stundensatz)
- [ ] **UND** in Echtzeit bei Änderungen aktualisiert

### AC-3: Stundensatz-Überschreibung
- [ ] **GEGEBEN** ich bearbeite eine Rollen-Zuordnung im Projekt
- [ ] **WENN** ich einen projektspezifischen Stundensatz eingebe
- [ ] **DANN** wird dieser statt des Standard-Stundensatzes verwendet
- [ ] **UND** die Abweichung wird visuell hervorgehoben

### AC-4: Kosten-Aufschlüsselung nach Rollen
- [ ] **GEGEBEN** ich betrachte die Projekt-Kosten
- [ ] **WENN** ich die Detail-Ansicht öffne
- [ ] **DANN** sehe ich eine Aufschlüsselung nach Rollen und Teams
- [ ] **UND** kann zwischen verschiedenen Ansichten wechseln (Team/Rolle/Kategorie)

### AC-5: Stundensatz-Historisierung
- [ ] **GEGEBEN** Stundensätze ändern sich über die Zeit
- [ ] **WENN** ich einen Stundensatz aktualisiere
- [ ] **DANN** bleiben bestehende Projekte bei ihren ursprünglichen Sätzen
- [ ] **UND** neue Projekte verwenden die aktuellen Sätze

### AC-6: Kosten-Vergleich und Budgetierung
- [ ] **GEGEBEN** ich plane ein Projekt
- [ ] **WENN** ich verschiedene Team-Zusammenstellungen teste
- [ ] **DANN** sehe ich sofort die Kosten-Auswirkungen
- [ ] **UND** kann Szenarien vergleichen

## Technische Tasks

### Backend
- [ ] **Erweiterte Rollen-Stammdaten**
  ```sql
  -- Rollen-Stammdaten erweitern
  ALTER TABLE rollen_stammdaten ADD COLUMN IF NOT EXISTS 
    kategorie_id INTEGER REFERENCES rollen_kategorien(id);
  ALTER TABLE rollen_stammdaten ADD COLUMN IF NOT EXISTS 
    min_stundensatz DECIMAL(8,2);
  ALTER TABLE rollen_stammdaten ADD COLUMN IF NOT EXISTS 
    max_stundensatz DECIMAL(8,2);
  ALTER TABLE rollen_stammdaten ADD COLUMN IF NOT EXISTS 
    ist_aktiv BOOLEAN DEFAULT TRUE;
  
  -- Stundensatz-Historie
  CREATE TABLE stundensatz_historie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rolle_id INTEGER REFERENCES rollen_stammdaten(id),
    stundensatz DECIMAL(8,2) NOT NULL,
    gueltig_ab DATE NOT NULL,
    gueltig_bis DATE,
    grund VARCHAR(255),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [ ] **Kosten-Berechnungs-Service**
  ```javascript
  class KostenBerechnungsService {
    async berechneInterneCosts(projektId) {
      const teams = await this.getProjektTeams(projektId)
      let gesamtKosten = 0
      
      for (const team of teams) {
        for (const rolle of team.rollen) {
          const stundensatz = rolle.projekt_stundensatz || rolle.standard_stundensatz
          const kosten = rolle.geplante_stunden * stundensatz
          gesamtKosten += kosten
        }
      }
      
      return gesamtKosten
    }
  }
  ```

- [ ] **API-Endpoints**
  - `GET /api/rollen` - Alle aktiven Rollen mit aktuellen Stundensätzen
  - `POST /api/rollen` - Neue Rolle erstellen
  - `PUT /api/rollen/{id}` - Rolle und Stundensatz aktualisieren
  - `GET /api/rollen/{id}/historie` - Stundensatz-Historie

- [ ] **🆕 Team-spezifische Rollen-APIs (Enhancement)**
  - `GET /api/teams/{teamId}/rollen` - Verfügbare Rollen für ein Team
  - `POST /api/teams/{teamId}/rollen` - Rolle zu Team hinzufügen
  - `GET /api/rollen/templates/{teamType}` - Rollen-Templates pro Team-Typ
  - `PUT /api/teams/{teamId}/rollen/{rolleId}` - Team-spezifische Rollen-Konfiguration
  - `POST /api/projekte/{id}/kosten/berechnen` - Kosten neu berechnen

### Frontend
- [ ] **Rollen-Verwaltung (Admin)**
  - `RollenManagement.tsx` - Admin-Seite für Rollen-Verwaltung
  - `RollenForm.tsx` - Rolle erstellen/bearbeiten
  - `StundensatzEditor.tsx` - Stundensatz mit Validierung
  - `RollenKategorieManager.tsx` - Kategorien verwalten

- [ ] **Projekt-Kosten-Komponenten**
  - `AutomatischeKostenBerechnung.tsx` - Live-Kosten-Anzeige
  - `KostenAufschluesselung.tsx` - Detaillierte Kosten-Breakdown
  - `StundensatzOverride.tsx` - Projektspezifische Stundensätze
  - `KostenVergleich.tsx` - Szenario-Vergleich

- [ ] **Integration in bestehende Komponenten**
  - `TeamRoleEditor.tsx` erweitern um Stundensatz-Anzeige
  - `ProjectForm.tsx` um Live-Kosten-Berechnung
  - `ProjectCard.tsx` um berechnete Kosten-Anzeige

### Database Schema
```sql
-- Rollen-Kategorien
CREATE TABLE rollen_kategorien (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  beschreibung TEXT,
  farbe VARCHAR(7) DEFAULT '#6B7280',
  sortierung INTEGER DEFAULT 0
);

INSERT INTO rollen_kategorien (name, beschreibung, farbe, sortierung) VALUES
('Development', 'Software-Entwicklung und Programmierung', '#3B82F6', 1),
('Design', 'UI/UX und Grafik-Design', '#8B5CF6', 2),
('Content', 'Inhalte-Erstellung und -Management', '#10B981', 3),
('Marketing', 'Marketing und Vertrieb', '#EF4444', 4),
('Management', 'Projekt- und Team-Management', '#F59E0B', 5),
('Testing', 'Qualitätssicherung und Testing', '#6366F1', 6),
('Operations', 'DevOps und Infrastruktur', '#1F2937', 7),
('Analysis', 'Business-Analyse und Beratung', '#059669', 8);

-- Projekt-Team-Rollen erweitern
ALTER TABLE projekt_team_rollen ADD COLUMN IF NOT EXISTS 
  rolle_id INTEGER REFERENCES rollen_stammdaten(id);
ALTER TABLE projekt_team_rollen ADD COLUMN IF NOT EXISTS 
  projekt_stundensatz DECIMAL(8,2); -- Überschreibt Standard-Satz
ALTER TABLE projekt_team_rollen ADD COLUMN IF NOT EXISTS 
  stundensatz_grund VARCHAR(255); -- Grund für Abweichung

-- Kosten-Cache für Performance
CREATE TABLE projekt_kosten_cache (
  projekt_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  interne_kosten_gesamt DECIMAL(12,2) NOT NULL DEFAULT 0,
  externe_kosten_gesamt DECIMAL(12,2) NOT NULL DEFAULT 0,
  gesamtstunden INTEGER NOT NULL DEFAULT 0,
  letzte_berechnung TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kosten_cache_berechnung (letzte_berechnung)
);

-- Trigger für automatische Kosten-Aktualisierung
CREATE OR REPLACE FUNCTION update_projekt_kosten()
RETURNS TRIGGER AS $$
BEGIN
  -- Kosten neu berechnen bei Änderungen an Team-Rollen
  INSERT INTO projekt_kosten_cache (projekt_id, interne_kosten_gesamt, gesamtstunden)
  SELECT 
    pt.projekt_id,
    COALESCE(SUM(ptr.geplante_stunden * COALESCE(ptr.projekt_stundensatz, rs.standard_stundensatz)), 0),
    COALESCE(SUM(ptr.geplante_stunden), 0)
  FROM projekt_teams pt
  JOIN projekt_team_rollen ptr ON pt.id = ptr.projekt_team_id
  LEFT JOIN rollen_stammdaten rs ON ptr.rolle_id = rs.id
  WHERE pt.projekt_id = COALESCE(NEW.projekt_id, OLD.projekt_id)
  GROUP BY pt.projekt_id
  ON CONFLICT (projekt_id) DO UPDATE SET
    interne_kosten_gesamt = EXCLUDED.interne_kosten_gesamt,
    gesamtstunden = EXCLUDED.gesamtstunden,
    letzte_berechnung = CURRENT_TIMESTAMP;
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_projekt_kosten
  AFTER INSERT OR UPDATE OR DELETE ON projekt_team_rollen
  FOR EACH ROW EXECUTE FUNCTION update_projekt_kosten();
```

## UI/UX Spezifikationen

### Rollen-Verwaltung (Admin)
```
┌─────────────────────────────────────────────────────────────┐
│ 🎭 Rollen-Verwaltung                            [+ Neue Rolle]│
├─────────────────────────────────────────────────────────────┤
│ Kategorie: [Alle ▼] Status: [Aktiv ▼] Suche: [_________]   │
├─────────────────────────────────────────────────────────────┤
│ 💻 Development                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Senior Developer        85,00€/h  [50-120€] [Bearbeiten]│ │
│ │ Junior Developer        55,00€/h  [30-80€]  [Bearbeiten]│ │
│ │ DevOps Engineer         90,00€/h  [60-130€] [Bearbeiten]│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🎨 Design                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ UI/UX Designer          75,00€/h  [45-100€] [Bearbeiten]│ │
│ │ Grafik Designer         65,00€/h  [40-90€]  [Bearbeiten]│ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Automatische Kosten-Berechnung im Projekt
```
┌─────────────────────────────────────────────────────────────┐
│ 💰 Kosten-Berechnung (Live)                                │
├─────────────────────────────────────────────────────────────┤
│ 🎨 Design Team                                              │
│ ├─ UI/UX Designer    120h × 75,00€ = 9.000,00€            │
│ ├─ Grafik Designer    80h × 65,00€ = 5.200,00€            │
│ └─ Subtotal: 200h                  = 14.200,00€            │
│                                                             │
│ 💻 Development Team                                         │
│ ├─ Senior Developer  160h × 85,00€ = 13.600,00€           │
│ ├─ Junior Developer  120h × 55,00€ = 6.600,00€            │
│ ├─ DevOps Engineer    40h × 95,00€ = 3.800,00€ ⚠️ +5€     │
│ └─ Subtotal: 320h                  = 24.000,00€            │
│                                                             │
│ ═══════════════════════════════════════════════════════════ │
│ 📊 Gesamt-Interne-Kosten: 520h    = 38.200,00€            │
│ 💶 Externe Kosten:                = 15.000,00€            │
│ 🎯 Projekt-Gesamtkosten:          = 53.200,00€            │
└─────────────────────────────────────────────────────────────┘
```

### Stundensatz-Override-Dialog
```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️ Stundensatz anpassen - DevOps Engineer                  │
├─────────────────────────────────────────────────────────────┤
│ Standard-Stundensatz: 90,00€                               │
│ Empfohlener Bereich:  60,00€ - 130,00€                    │
│                                                             │
│ Projekt-Stundensatz *: [95,00] €                          │
│ Grund für Abweichung:                                      │
│ [Spezialist für Cloud-Migration erforderlich_____________] │
│                                                             │
│ ⚠️ Abweichung: +5,00€ (+5.6%)                             │
│                                                             │
│                              [Abbrechen] [Übernehmen]      │
└─────────────────────────────────────────────────────────────┘
```

### Kosten-Aufschlüsselung-Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Kosten-Aufschlüsselung                                  │
├─────────────────────────────────────────────────────────────┤
│ Ansicht: [Nach Rollen ▼] [Nach Teams] [Nach Kategorien]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Senior Developer     ████████████████████ 35.6% 13.600€   │
│ UI/UX Designer       ██████████████████   23.6%  9.000€   │
│ Junior Developer     █████████████████    17.3%  6.600€   │
│ Grafik Designer      ██████████████       13.6%  5.200€   │
│ DevOps Engineer      ██████████           10.0%  3.800€   │
│                                                             │
│ ═══════════════════════════════════════════════════════════ │
│ Gesamt: 38.200,00€ | Durchschnitt: 73,46€/h               │
└─────────────────────────────────────────────────────────────┘
```

## Validierungsregeln

### Business Rules
1. **Stundensatz-Bereiche**: Stundensätze müssen in definierten Min/Max-Bereichen liegen
2. **Positive Werte**: Alle Stundensätze und Stunden müssen positiv sein
3. **Historisierung**: Stundensatz-Änderungen werden historisiert
4. **Aktive Rollen**: Nur aktive Rollen können neuen Projekten zugeordnet werden
5. **Konsistenz**: Berechnete Kosten müssen mit Summe der Einzelpositionen übereinstimmen

### Technische Validierung
```javascript
// Frontend-Validierung
const stundensatzValidation = {
  standard_stundensatz: {
    required: 'Stundensatz ist erforderlich',
    min: { value: 0.01, message: 'Stundensatz muss positiv sein' },
    max: { value: 500, message: 'Stundensatz zu hoch (max. 500€)' },
    valueAsNumber: true
  },
  min_stundensatz: {
    min: { value: 0.01, message: 'Minimum muss positiv sein' },
    valueAsNumber: true,
    validate: (value, formValues) => {
      if (value >= formValues.max_stundensatz) {
        return 'Minimum muss kleiner als Maximum sein'
      }
      return true
    }
  }
}

// Backend-Validierung
const validateStundensatz = (rolle, neuerSatz) => {
  const errors = []
  
  if (neuerSatz <= 0) {
    errors.push('Stundensatz muss positiv sein')
  }
  
  if (rolle.min_stundensatz && neuerSatz < rolle.min_stundensatz) {
    errors.push(`Stundensatz unter Minimum (${rolle.min_stundensatz}€)`)
  }
  
  if (rolle.max_stundensatz && neuerSatz > rolle.max_stundensatz) {
    errors.push(`Stundensatz über Maximum (${rolle.max_stundensatz}€)`)
  }
  
  return errors
}

// Kosten-Berechnung-Validierung
const validateKostenBerechnung = (berechnet, erwartet) => {
  const toleranz = 0.01 // 1 Cent Toleranz für Rundungsfehler
  return Math.abs(berechnet - erwartet) <= toleranz
}
```

## Testing Strategy

### Unit Tests
- [ ] Kosten-Berechnungs-Algorithmus
- [ ] Stundensatz-Validierung
- [ ] Historisierungs-Logik
- [ ] Cache-Invalidierung

### Integration Tests
- [ ] Rollen-API-Endpoints
- [ ] Automatische Kosten-Aktualisierung
- [ ] Stundensatz-Override-Funktionalität
- [ ] Database-Trigger für Kosten-Cache

### E2E Tests
- [ ] Vollständiger Rollen-Verwaltungs-Workflow
- [ ] Projekt-Erstellung mit automatischer Kosten-Berechnung
- [ ] Stundensatz-Änderung und Auswirkungen
- [ ] Kosten-Aufschlüsselung und Reporting

## Performance Requirements

### Response Times
- Kosten-Berechnung: < 200ms
- Rollen-Liste laden: < 150ms
- Stundensatz-Update: < 300ms
- Kosten-Aufschlüsselung: < 400ms

### Scalability
- Unterstützung für 100+ Rollen
- Effiziente Berechnung auch bei 50+ Teams pro Projekt
- Optimierte Cache-Performance

## Definition of Done

### Funktional
- [ ] Alle Akzeptanzkriterien erfüllt
- [ ] Automatische Kosten-Berechnung funktioniert
- [ ] Stundensatz-Verwaltung implementiert
- [ ] Kosten-Aufschlüsselung verfügbar

### Technisch
- [ ] Unit Tests: 90%+ Coverage
- [ ] Integration Tests bestehen
- [ ] E2E Tests bestehen
- [ ] Performance-Requirements erfüllt
- [ ] Database-Trigger funktionieren korrekt

### Qualität
- [ ] Responsive Design (Mobile/Desktop)
- [ ] Accessibility (WCAG AA)
- [ ] Deutsche UI-Labels und Währungsformatierung
- [ ] Error Handling und Validierung

## Dependencies

### Interne Dependencies
- **Story 1.2.2**: Multi-Team-Projekt-Management (Rollen-Zuordnung)
- **Rollen-Stammdaten**: Erweiterte Rollen-Tabelle
- **Admin-Berechtigungen**: Für Rollen-Verwaltung

### Externe Dependencies
- **PostgreSQL**: Für Trigger und Berechnungen
- **React Hook Form**: Für komplexe Validierung
- **Chart.js**: Für Kosten-Visualisierung

## Rollout Plan

### Phase 1: Backend & Database (2 Tage)
- Erweiterte Rollen-Tabellen
- Kosten-Berechnungs-Service
- Database-Trigger für Cache

### Phase 2: Admin-Interface (1.5 Tage)
- Rollen-Verwaltung
- Stundensatz-Editor
- Kategorien-Management

### Phase 3: Projekt-Integration (2 Tage)
- Automatische Kosten-Berechnung
- Stundensatz-Override
- Live-Kosten-Anzeige

### Phase 4: Reporting & Polish (1 Tag)
- Kosten-Aufschlüsselung
- Visualisierungen
- Performance-Optimierung

**Geschätzte Gesamtdauer: 6.5 Tage**

---

