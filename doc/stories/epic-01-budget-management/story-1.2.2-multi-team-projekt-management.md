# Story 1.2.2: Multi-Team-Projekt-Management

**Epic:** 1 - Kern-Budget-Management-System  
**Story Points:** 13  
**Sprint:** 2  
**Priorität:** Hoch  
**Status:** ✅ IMPLEMENTED (2025-08-29)

## User Story

**Als** Projektmanager  
**möchte ich** mehrere Teams mit individuellen Stunden einem Projekt zuordnen  
**damit** ich die Ressourcenverteilung genau tracken und verschiedene Fachbereiche koordinieren kann

## Business Context

### Problem Statement
- Aktuell kann nur ein Team pro Projekt zugeordnet werden
- Keine Erfassung von Stunden pro Team und Rolle
- Fehlende Ressourcen-Transparenz bei Multi-Team-Projekten
- Keine differenzierte Kosten-Berechnung nach Teams

### Business Value
- **Realistische Ressourcen-Planung** durch Multi-Team-Zuordnung
- **Genauere Kosten-Kalkulation** pro Team und Rolle
- **Bessere Projekt-Koordination** zwischen Fachbereichen
- **Transparente Stunden-Verteilung** für Reporting und Abrechnung

## Akzeptanzkriterien

### AC-1: Dynamische Team-Liste im Projekt ✅ IMPLEMENTED
- [x] **GEGEBEN** ich erstelle ein neues Projekt
- [x] **WENN** ich Teams zuordnen möchte
- [x] **DANN** kann ich mehrere Teams mit "+" Button hinzufügen
- [x] **UND** jedes Team mit "-" Button wieder entfernen

### AC-2: Team-Rollen und Stunden-Erfassung
- [ ] **GEGEBEN** ich habe ein Team zum Projekt hinzugefügt
- [ ] **WENN** ich die Team-Details bearbeite
- [ ] **DANN** kann ich verschiedene Rollen (Designer, Developer, etc.) zuordnen
- [ ] **UND** für jede Rolle geplante Stunden eingeben

### AC-3: Haupt-Team (Lead-Team) Definition ✅ IMPLEMENTED
- [x] **GEGEBEN** ich habe mehrere Teams zugeordnet
- [x] **WENN** ich ein Haupt-Team definieren möchte
- [x] **DANN** kann ich eines als "Lead-Team" markieren
- [x] **UND** dieses wird in der Projekt-Übersicht hervorgehoben

### AC-4: Team-Stunden-Übersicht
- [ ] **GEGEBEN** ich betrachte ein Projekt mit mehreren Teams
- [ ] **WENN** ich die Team-Übersicht öffne
- [ ] **DANN** sehe ich alle Teams mit ihren Rollen und Stunden
- [ ] **UND** eine Gesamt-Stunden-Summe pro Team und insgesamt

### AC-5: Team-basierte Kosten-Berechnung
- [ ] **GEGEBEN** Teams haben unterschiedliche Stundensätze
- [ ] **WENN** ich die Projekt-Kosten betrachte
- [ ] **DANN** werden interne Kosten pro Team berechnet
- [ ] **UND** in der Kosten-Übersicht aufgeschlüsselt dargestellt

### AC-6: Mindest-Team-Validierung
- [ ] **GEGEBEN** ich erstelle ein Projekt
- [ ] **WENN** ich versuche ohne Teams zu speichern
- [ ] **DANN** erhalte ich eine Fehlermeldung
- [ ] **UND** muss mindestens ein Team zuordnen

## Technische Tasks

### Backend
- [ ] **Team-Projekt-Verknüpfungs-Tabelle**
  ```sql
  CREATE TABLE projekt_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projekt_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    team_name VARCHAR(100) NOT NULL,
    ist_lead_team BOOLEAN DEFAULT FALSE,
    beschreibung TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(projekt_id, team_name)
  );
  ```

- [ ] **Team-Rollen-Stunden-Tabelle**
  ```sql
  CREATE TABLE projekt_team_rollen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projekt_team_id UUID NOT NULL REFERENCES projekt_teams(id) ON DELETE CASCADE,
    rolle_name VARCHAR(100) NOT NULL,
    geplante_stunden INTEGER NOT NULL DEFAULT 0,
    tatsaechliche_stunden INTEGER DEFAULT 0,
    stundensatz DECIMAL(8,2),
    notizen TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [ ] **API-Endpoints erweitern**
  - `POST /api/projects/{id}/teams` - Team zu Projekt hinzufügen
  - `PUT /api/projects/{id}/teams/{teamId}` - Team-Details aktualisieren
  - `DELETE /api/projects/{id}/teams/{teamId}` - Team entfernen
  - `GET /api/projects/{id}/teams` - Alle Teams eines Projekts
  - `POST /api/projects/{id}/teams/{teamId}/rollen` - Rolle hinzufügen

- [ ] **Projekt-Controller erweitern**
  - Team-Validierung bei Projekt-Erstellung
  - Kosten-Berechnung mit Team-Aufschlüsselung
  - Lead-Team-Logik implementieren

### Frontend
- [ ] **Multi-Team-Komponenten**
  - `ProjectTeamManager.tsx` - Haupt-Komponente für Team-Verwaltung
  - `TeamCard.tsx` - Einzelnes Team mit Rollen
  - `TeamRoleEditor.tsx` - Rollen und Stunden bearbeiten
  - `TeamSelector.tsx` - Team-Auswahl-Dropdown

- [x] **🆕 Erweiterte Team-Auswahl (Enhancement)** ✅ IMPLEMENTED
  - Dropdown-Auswahl aus vorhandenen Teams bei "Team hinzufügen"
  - Integration mit bestehender Teams-Datenbank über `/api/teams`
  - Möglichkeit neue Teams direkt zu erstellen
  - Team-Kategorien und -Beschreibungen anzeigen
  - Validierung gegen bereits zugewiesene Teams
  - Button-basierte UX statt direkter Dropdown-Integration

- [x] **🆕 Team-spezifische Rollen-Zuordnung (Enhancement)** ✅ IMPLEMENTED
  - Rollen werden Teams zugewiesen über `team_rollen` Tabelle
  - Team-spezifische Rollen-Bibliothek mit Foreign Key zu `rollen_stammdaten`
  - Rollen-Templates pro Team-Typ verfügbar
  - Backend-API `/api/team-rollen` für Rollen-Management
  - Unique Constraint für Team-Rollen-Kombinationen

- [ ] **Projekt-Formular-Integration**
  - Integration in `ProjectForm.tsx`
  - Dynamische Team-Liste mit Add/Remove
  - Validierung für Mindest-Team-Anforderung

- [ ] **Team-Übersicht-Komponenten**
  - `ProjectTeamOverview.tsx` - Team-Übersicht im Projekt-Detail
  - `TeamCostBreakdown.tsx` - Kosten-Aufschlüsselung nach Teams
  - `TeamHoursChart.tsx` - Stunden-Visualisierung

### Database Schema Updates
```sql
-- Bestehende Projekt-Tabelle anpassen
ALTER TABLE projects DROP COLUMN IF EXISTS team;
ALTER TABLE projects ADD COLUMN lead_team_id UUID REFERENCES projekt_teams(id);

-- Rollen-Stammdaten
CREATE TABLE rollen_stammdaten (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  kategorie VARCHAR(50) NOT NULL,
  standard_stundensatz DECIMAL(8,2),
  beschreibung TEXT,
  farbe VARCHAR(7) DEFAULT '#6B7280'
);

INSERT INTO rollen_stammdaten (name, kategorie, standard_stundensatz, beschreibung, farbe) VALUES
('Senior Developer', 'Development', 85.00, 'Erfahrener Softwareentwickler', '#3B82F6'),
('Junior Developer', 'Development', 55.00, 'Nachwuchs-Entwickler', '#60A5FA'),
('UI/UX Designer', 'Design', 75.00, 'User Interface und Experience Design', '#8B5CF6'),
('Grafik Designer', 'Design', 65.00, 'Grafische Gestaltung und Layout', '#A78BFA'),
('Content Manager', 'Content', 50.00, 'Inhalte-Erstellung und -Pflege', '#10B981'),
('SEO Specialist', 'Marketing', 60.00, 'Suchmaschinenoptimierung', '#EF4444'),
('Project Manager', 'Management', 80.00, 'Projektleitung und Koordination', '#F59E0B'),
('Quality Assurance', 'Testing', 55.00, 'Qualitätssicherung und Testing', '#6366F1'),
('DevOps Engineer', 'Operations', 90.00, 'Deployment und Infrastruktur', '#1F2937'),
('Business Analyst', 'Analysis', 70.00, 'Geschäftsanalyse und Requirements', '#059669');

-- Indizes für Performance
CREATE INDEX idx_projekt_teams_projekt_id ON projekt_teams(projekt_id);
CREATE INDEX idx_projekt_teams_lead ON projekt_teams(ist_lead_team);
CREATE INDEX idx_projekt_team_rollen_team_id ON projekt_team_rollen(projekt_team_id);
CREATE INDEX idx_projekt_team_rollen_rolle ON projekt_team_rollen(rolle_name);
```

## UI/UX Spezifikationen

### Multi-Team-Manager im Projekt-Formular
```
┌─────────────────────────────────────────────────────────────┐
│ 👥 Team-Zuordnung                                           │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎨 Design Team                           [Lead] [🗑️]    │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ UI/UX Designer      [120h] [75,00€/h] = 9.000,00€ │ │ │
│ │ │ Grafik Designer     [ 80h] [65,00€/h] = 5.200,00€ │ │ │
│ │ │                                    [+ Rolle hinzufügen]│ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ Gesamt: 200h | 14.200,00€                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💻 Development Team                            [🗑️]     │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Senior Developer    [160h] [85,00€/h] = 13.600,00€ │ │ │
│ │ │ Junior Developer    [120h] [55,00€/h] = 6.600,00€  │ │ │
│ │ │ DevOps Engineer     [ 40h] [90,00€/h] = 3.600,00€  │ │ │
│ │ │                                    [+ Rolle hinzufügen]│ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ Gesamt: 320h | 23.800,00€                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                                          [+ Team hinzufügen]│
│                                                             │
│ 📊 Projekt-Gesamt: 520h | 38.000,00€                      │
└─────────────────────────────────────────────────────────────┘
```

### Team-Auswahl-Dropdown
```
┌─────────────────────────────────────────────────────────────┐
│ Team hinzufügen                                             │
├─────────────────────────────────────────────────────────────┤
│ [Team auswählen...                                ▼]       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎨 Design                                               │ │
│ │ 💻 Development                                          │ │
│ │ 📢 Marketing                                            │ │
│ │ 📊 Content                                              │ │
│ │ 🔧 Operations                                           │ │
│ │ 📋 Management                                           │ │
│ │ ─────────────────────────────────────────────────────── │ │
│ │ ➕ Neues Team erstellen                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Rollen-Editor
```
┌─────────────────────────────────────────────────────────────┐
│ Rolle hinzufügen - Design Team                              │
├─────────────────────────────────────────────────────────────┤
│ Rolle *: [UI/UX Designer                          ▼]       │
│ Geplante Stunden *: [120]                                  │
│ Stundensatz: [75,00] € (Standard: 75,00€)                 │
│ Notizen: [_________________________________________]        │
│                                                             │
│                              [Abbrechen] [Hinzufügen]      │
└─────────────────────────────────────────────────────────────┘
```

### Team-Übersicht im Projekt-Detail
```
┌─────────────────────────────────────────────────────────────┐
│ 👥 Team-Übersicht                                           │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎨 Design Team (Lead)                    200h | 14.200€ │ │
│ │ ├─ UI/UX Designer        120h (75€/h) =  9.000€        │ │
│ │ └─ Grafik Designer        80h (65€/h) =  5.200€        │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💻 Development Team                      320h | 23.800€ │ │
│ │ ├─ Senior Developer      160h (85€/h) = 13.600€        │ │
│ │ ├─ Junior Developer      120h (55€/h) =  6.600€        │ │
│ │ └─ DevOps Engineer        40h (90€/h) =  3.600€        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📊 Gesamt: 520 Stunden | 38.000,00€                       │
└─────────────────────────────────────────────────────────────┘
```

## Validierungsregeln

### Business Rules
1. **Mindest-Team**: Jedes Projekt muss mindestens ein Team haben
2. **Ein Lead-Team**: Nur ein Team kann als Lead-Team markiert werden
3. **Eindeutige Teams**: Ein Team kann nur einmal pro Projekt zugeordnet werden
4. **Positive Stunden**: Geplante Stunden müssen > 0 sein
5. **Rollen-Eindeutigkeit**: Eine Rolle kann nur einmal pro Team vorkommen

### Technische Validierung
```javascript
// Frontend-Validierung
const teamValidation = {
  teams: {
    validate: (teams) => {
      if (!teams || teams.length === 0) {
        return 'Mindestens ein Team ist erforderlich'
      }
      
      const leadTeams = teams.filter(t => t.ist_lead_team)
      if (leadTeams.length > 1) {
        return 'Nur ein Lead-Team erlaubt'
      }
      
      return true
    }
  }
}

const rolleValidation = {
  geplante_stunden: {
    required: 'Geplante Stunden sind erforderlich',
    min: { value: 1, message: 'Mindestens 1 Stunde erforderlich' },
    max: { value: 2000, message: 'Maximal 2000 Stunden erlaubt' },
    valueAsNumber: true
  },
  stundensatz: {
    min: { value: 0.01, message: 'Stundensatz muss positiv sein' },
    valueAsNumber: true
  }
}

// Backend-Validierung
const validateProjektTeams = (teams) => {
  const errors = []
  
  if (!teams || teams.length === 0) {
    errors.push('Mindestens ein Team ist erforderlich')
  }
  
  const leadTeams = teams.filter(t => t.ist_lead_team)
  if (leadTeams.length > 1) {
    errors.push('Nur ein Lead-Team erlaubt')
  }
  
  const teamNames = teams.map(t => t.team_name)
  const uniqueNames = new Set(teamNames)
  if (teamNames.length !== uniqueNames.size) {
    errors.push('Team-Namen müssen eindeutig sein')
  }
  
  return errors
}
```

## Testing Strategy

### Unit Tests
- [ ] Team-CRUD-Operationen
- [ ] Rollen-Stunden-Berechnung
- [ ] Lead-Team-Logik
- [ ] Validierungsregeln

### Integration Tests
- [ ] Projekt-Team-API-Endpoints
- [ ] Team-Kosten-Berechnung
- [ ] Multi-Team-Projekt-Erstellung
- [ ] Team-Löschung und Cascade-Verhalten

### E2E Tests
- [ ] Vollständiger Multi-Team-Projekt-Workflow
- [ ] Team hinzufügen/entfernen
- [ ] Rollen-Management
- [ ] Lead-Team-Zuordnung

## Performance Requirements

### Response Times
- Team-Liste laden: < 200ms
- Team hinzufügen: < 500ms
- Kosten-Berechnung: < 300ms
- Team-Übersicht: < 400ms

### Scalability
- Unterstützung für 10+ Teams pro Projekt
- 20+ Rollen pro Team
- Effiziente Aggregation auch bei vielen Teams

## Definition of Done

### Funktional
- [ ] Alle Akzeptanzkriterien erfüllt
- [ ] Multi-Team-Zuordnung funktioniert
- [ ] Rollen-Stunden-Management implementiert
- [ ] Lead-Team-Funktionalität vorhanden

### Technisch
- [ ] Unit Tests: 90%+ Coverage
- [ ] Integration Tests bestehen
- [ ] E2E Tests bestehen
- [ ] Performance-Requirements erfüllt
- [ ] Code Review abgeschlossen

### Qualität
- [ ] Responsive Design (Mobile/Desktop)
- [ ] Accessibility (WCAG AA)
- [ ] Deutsche UI-Labels
- [ ] Error Handling implementiert

## Dependencies

### Interne Dependencies
- **Rollen-Stammdaten**: Vordefinierte Rollen und Stundensätze
- **Projekt-Formular**: Integration in bestehende Komponente
- **Kosten-Berechnung**: Erweiterte Kalkulationslogik

### Externe Dependencies
- **PostgreSQL**: Für Relationen und Constraints
- **React Hook Form**: Für komplexe Formular-Validierung
- **Chart.js**: Für Stunden-Visualisierung (optional)

## Rollout Plan

### Phase 1: Backend & Database (2 Tage)
- Datenbank-Schema erstellen
- API-Endpoints implementieren
- Team-Validierung und Tests

### Phase 2: Frontend-Komponenten (2.5 Tage)
- Multi-Team-Manager-Komponenten
- Rollen-Editor
- Projekt-Formular-Integration

### Phase 3: Kosten-Integration (1 Tag)
- Team-basierte Kosten-Berechnung
- Kosten-Aufschlüsselung-UI
- Performance-Optimierung

### Phase 4: Testing & Polish (1 Tag)
- E2E Tests
- UI/UX Verbesserungen
- Bug Fixes

**Geschätzte Gesamtdauer: 6.5 Tage**

## ✅ Implementierungs-Status (2025-08-29)

### Erfolgreich implementiert:
- **Multi-Team Management**: Mehrere Teams pro Projekt mit Lead-Team Auswahl
- **Team-Auswahl UX**: Button-basierte Team-Hinzufügung mit Dropdown-Auswahl
- **Team-Rollen Schema**: Neue `team_rollen` Tabelle mit Foreign Keys
- **Backend APIs**: `/api/teams` und `/api/team-rollen` Endpunkte
- **Frontend Integration**: `TeamSelector.tsx` Komponente in `ProjectForm.tsx`
- **Datenbank-Constraints**: RLS-Policies und Unique Constraints implementiert

### Technische Implementierung:
```sql
-- Implementierte Tabellen
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  can_view_all_budgets BOOLEAN DEFAULT FALSE,
  can_transfer_budgets BOOLEAN DEFAULT FALSE
);

CREATE TABLE team_rollen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  rolle_id INTEGER NOT NULL REFERENCES rollen_stammdaten(id) ON DELETE CASCADE,
  standard_stundensatz DECIMAL(10,2),
  ist_aktiv BOOLEAN DEFAULT true,
  UNIQUE(team_id, rolle_id)
);
```

### Frontend-Komponenten:
- `TeamSelector.tsx`: Team-Auswahl mit Dropdown und "Neues Team erstellen"
- `ProjectForm.tsx`: Integration mit Button-basierter Team-Hinzufügung
- Lead-Team Auswahl über Radio-Buttons
- Visuelle Kennzeichnung des Lead-Teams mit "👑 Lead" Badge

### Nächste Schritte:
- Rollen-Editor für Team-spezifische Rollen-Zuordnung
- Stunden-Erfassung pro Rolle und Team
- Team-basierte Kosten-Berechnung und -Aufschlüsselung

---

