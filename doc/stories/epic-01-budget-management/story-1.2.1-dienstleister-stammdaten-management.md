# Story 1.2.1: Dienstleister-Stammdaten-Management

**Epic:** 1 - Kern-Budget-Management-System  
**Story Points:** 8  
**Sprint:** 1  
**Priorität:** Hoch  
**Status:** Ready for Development

## User Story

**Als** Projektmanager  
**möchte ich** Dienstleister in einer Stammdaten-Tabelle verwalten  
**damit** ich sie für OCR-Pattern-Learning nutzen und konsistent zuordnen kann

## Business Context

### Problem Statement
- Aktuell werden Dienstleister als Freitext eingegeben (inkonsistent)
- Keine Wiederverwendung von Dienstleister-Daten
- Fehlende Vorbereitung für OCR-Pattern-Learning (Epic 2)
- Keine zentrale Verwaltung von Lieferanten-Informationen

### Business Value
- **Konsistente Datenqualität** durch Stammdaten-Verwaltung
- **Vorbereitung für OCR-Integration** (Epic 2) durch Pattern-Verknüpfung
- **Effiziente Projekt-Erstellung** durch Dropdown-Auswahl
- **Zentrale Lieferanten-Verwaltung** für bessere Übersicht

## Akzeptanzkriterien

### AC-1: Dienstleister-Stammdaten-Tabelle
- [ ] **GEGEBEN** ich bin Administrator
- [ ] **WENN** ich die Dienstleister-Verwaltung öffne
- [ ] **DANN** sehe ich eine Liste aller Dienstleister
- [ ] **UND** kann neue Dienstleister anlegen, bearbeiten und deaktivieren

### AC-2: Dienstleister-Dropdown im Projekt-Formular
- [ ] **GEGEBEN** ich erstelle ein neues Projekt
- [ ] **WENN** ich das Dienstleister-Feld öffne
- [ ] **DANN** sehe ich eine Dropdown-Liste mit allen aktiven Dienstleistern
- [ ] **UND** kann "Neuen Dienstleister anlegen" auswählen

### AC-3: Inline-Dienstleister-Erstellung
- [ ] **GEGEBEN** ich wähle "Neuen Dienstleister anlegen"
- [ ] **WENN** ich die Dienstleister-Daten eingebe und speichere
- [ ] **DANN** wird der Dienstleister sofort erstellt und im Projekt ausgewählt
- [ ] **UND** steht für zukünftige Projekte zur Verfügung

### AC-4: Dienstleister-Kategorisierung
- [ ] **GEGEBEN** ich lege einen Dienstleister an
- [ ] **WENN** ich die Kategorie auswähle
- [ ] **DANN** kann ich zwischen verschiedenen Dienstleister-Typen wählen
- [ ] **UND** diese Kategorisierung wird für Filterung und Reporting genutzt

### AC-5: OCR-Pattern-Vorbereitung
- [ ] **GEGEBEN** ich verwalte Dienstleister-Stammdaten
- [ ] **WENN** ich Dienstleister-Details eingebe
- [ ] **DANN** kann ich OCR-Erkennungs-Pattern hinterlegen
- [ ] **UND** diese werden für spätere Rechnungserkennung (Epic 2) genutzt

### AC-6: Dienstleister-Suche und Filterung
- [ ] **GEGEBEN** ich bin in der Dienstleister-Verwaltung
- [ ] **WENN** ich nach Dienstleistern suche
- [ ] **DANN** kann ich nach Name, Kategorie und Status filtern
- [ ] **UND** erhalte relevante Suchergebnisse in Echtzeit

## Technische Tasks

### Backend
- [ ] **Dienstleister-Datenmodell**
  ```sql
  CREATE TABLE dienstleister (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    kurzbeschreibung TEXT,
    kategorie VARCHAR(100) NOT NULL,
    kontakt_email VARCHAR(255),
    kontakt_telefon VARCHAR(50),
    adresse TEXT,
    website VARCHAR(255),
    steuernummer VARCHAR(50),
    ustid VARCHAR(50),
    ocr_pattern JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'AKTIV',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [ ] **API-Endpoints**
  - `GET /api/dienstleister` - Alle Dienstleister abrufen
  - `POST /api/dienstleister` - Neuen Dienstleister erstellen
  - `PUT /api/dienstleister/{id}` - Dienstleister aktualisieren
  - `DELETE /api/dienstleister/{id}` - Dienstleister deaktivieren
  - `GET /api/dienstleister/kategorien` - Verfügbare Kategorien

- [ ] **Validierung und Business Logic**
  - Eindeutigkeit des Dienstleister-Namens
  - E-Mail-Format-Validierung
  - Status-Übergangs-Validierung
  - OCR-Pattern-JSON-Validierung

### Frontend
- [ ] **Dienstleister-Verwaltung-Seite**
  - `DienstleisterManagement.tsx` - Hauptseite für Admin
  - `DienstleisterList.tsx` - Liste mit Suche/Filter
  - `DienstleisterCard.tsx` - Einzelner Dienstleister
  - `DienstleisterForm.tsx` - Erstellen/Bearbeiten

- [ ] **Projekt-Formular-Integration**
  - `DienstleisterDropdown.tsx` - Dropdown mit Suche
  - `DienstleisterQuickCreate.tsx` - Inline-Erstellung
  - Integration in `ProjectForm.tsx`

- [ ] **OCR-Pattern-Management**
  - `OCRPatternEditor.tsx` - JSON-Editor für Pattern
  - Pattern-Vorschau und Validierung
  - Pattern-Test-Interface

### Database Schema
```sql
-- Dienstleister-Kategorien
CREATE TABLE dienstleister_kategorien (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  beschreibung TEXT,
  farbe VARCHAR(7) DEFAULT '#6B7280'
);

INSERT INTO dienstleister_kategorien (name, beschreibung, farbe) VALUES
('IT & Software', 'Softwareentwicklung, IT-Services', '#3B82F6'),
('Marketing & Werbung', 'Werbeagenturen, Marketing-Services', '#EF4444'),
('Design & Kreativ', 'Grafikdesign, UX/UI, Kreativagenturen', '#8B5CF6'),
('Beratung', 'Unternehmensberatung, Fachberatung', '#10B981'),
('Handwerk & Bau', 'Bauunternehmen, Handwerker', '#F59E0B'),
('Logistik & Transport', 'Spedition, Kurierdienste', '#6366F1'),
('Recht & Steuer', 'Anwaltskanzleien, Steuerberater', '#1F2937'),
('Sonstiges', 'Andere Dienstleistungen', '#6B7280');

-- Projekt-Dienstleister-Verknüpfung aktualisieren
ALTER TABLE projects DROP COLUMN IF EXISTS dienstleister;
ALTER TABLE projects ADD COLUMN dienstleister_id UUID REFERENCES dienstleister(id);

-- Indizes für Performance
CREATE INDEX idx_dienstleister_name ON dienstleister(name);
CREATE INDEX idx_dienstleister_kategorie ON dienstleister(kategorie);
CREATE INDEX idx_dienstleister_status ON dienstleister(status);
CREATE INDEX idx_projects_dienstleister ON projects(dienstleister_id);
```

## UI/UX Spezifikationen

### Dienstleister-Verwaltung (Admin)
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 Dienstleister-Verwaltung                    [+ Neu]     │
├─────────────────────────────────────────────────────────────┤
│ Suche: [________________] Kategorie: [Alle ▼] Status: [▼]  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎨 Design Agentur GmbH                    [Bearbeiten] │ │
│ │ Kategorie: Design & Kreativ               [Deaktivieren]│ │
│ │ E-Mail: info@design-agentur.de                         │ │
│ │ Status: 🟢 Aktiv | 15 Projekte                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💻 IT Solutions Ltd                       [Bearbeiten] │ │
│ │ Kategorie: IT & Software                  [Deaktivieren]│ │
│ │ E-Mail: contact@itsolutions.com                        │ │
│ │ Status: 🟢 Aktiv | 8 Projekte                          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Dienstleister-Dropdown im Projekt-Formular
```
┌─────────────────────────────────────────────────────────────┐
│ Dienstleister (optional)                                    │
├─────────────────────────────────────────────────────────────┤
│ [Design Agentur GmbH                              ▼]       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔍 Suchen...                                            │ │
│ │ ─────────────────────────────────────────────────────── │ │
│ │ 🎨 Design Agentur GmbH (Design & Kreativ)              │ │
│ │ 💻 IT Solutions Ltd (IT & Software)                    │ │
│ │ 📢 Marketing Pro (Marketing & Werbung)                 │ │
│ │ ─────────────────────────────────────────────────────── │ │
│ │ ➕ Neuen Dienstleister anlegen                          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Inline-Dienstleister-Erstellung
```
┌─────────────────────────────────────────────────────────────┐
│ ➕ Neuen Dienstleister anlegen                              │
├─────────────────────────────────────────────────────────────┤
│ Name *: [_________________________________]                │
│ Kategorie *: [IT & Software                    ▼]          │
│ E-Mail: [_________________________________]                │
│ Telefon: [_________________________________]               │
│ Website: [_________________________________]               │
│                                                             │
│                              [Abbrechen] [Erstellen]       │
└─────────────────────────────────────────────────────────────┘
```

## Validierungsregeln

### Business Rules
1. **Eindeutiger Name**: Dienstleister-Namen müssen eindeutig sein
2. **Aktive Dienstleister**: Nur aktive Dienstleister in Projekt-Dropdown
3. **Kategorie-Pflicht**: Jeder Dienstleister muss eine Kategorie haben
4. **Soft Delete**: Dienstleister werden deaktiviert, nicht gelöscht
5. **Projekt-Verknüpfung**: Deaktivierte Dienstleister bleiben in bestehenden Projekten sichtbar

### Technische Validierung
```javascript
// Frontend-Validierung
const dienstleisterValidation = {
  name: {
    required: 'Name ist erforderlich',
    minLength: { value: 2, message: 'Mindestens 2 Zeichen' },
    maxLength: { value: 255, message: 'Maximal 255 Zeichen' }
  },
  kategorie: {
    required: 'Kategorie ist erforderlich'
  },
  kontakt_email: {
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Ungültige E-Mail-Adresse'
    }
  },
  website: {
    pattern: {
      value: /^https?:\/\/.+/,
      message: 'Website muss mit http:// oder https:// beginnen'
    }
  }
}

// Backend-Validierung
const validateDienstleister = (data) => {
  const errors = []
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name ist erforderlich (min. 2 Zeichen)')
  }
  
  if (!data.kategorie) {
    errors.push('Kategorie ist erforderlich')
  }
  
  if (data.kontakt_email && !isValidEmail(data.kontakt_email)) {
    errors.push('Ungültige E-Mail-Adresse')
  }
  
  return errors
}
```

## Testing Strategy

### Unit Tests
- [ ] Dienstleister-CRUD-Operationen
- [ ] Validierungslogik (Name, E-Mail, etc.)
- [ ] OCR-Pattern-JSON-Handling
- [ ] Status-Übergangs-Logik

### Integration Tests
- [ ] Dienstleister-API-Endpoints
- [ ] Projekt-Dienstleister-Verknüpfung
- [ ] Dropdown-Daten-Loading
- [ ] Inline-Erstellung-Workflow

### E2E Tests
- [ ] Vollständiger Dienstleister-Verwaltungs-Workflow
- [ ] Projekt-Erstellung mit Dienstleister-Auswahl
- [ ] Inline-Dienstleister-Erstellung
- [ ] Suche und Filterung

## Performance Requirements

### Response Times
- Dienstleister-Liste laden: < 300ms
- Dienstleister-Dropdown: < 200ms
- Inline-Erstellung: < 1s
- Suche/Filter: < 150ms

### Scalability
- Unterstützung für 500+ Dienstleister
- Effiziente Suche auch bei großen Datenmengen
- Optimierte Dropdown-Performance

## Definition of Done

### Funktional
- [ ] Alle Akzeptanzkriterien erfüllt
- [ ] Dienstleister-CRUD funktioniert vollständig
- [ ] Projekt-Integration implementiert
- [ ] OCR-Pattern-Vorbereitung vorhanden

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
- **Database Schema**: Neue Tabellen und Indizes
- **Admin-Berechtigung**: Für Dienstleister-Verwaltung
- **Projekt-Formular**: Integration in bestehende Komponente

### Externe Dependencies
- **PostgreSQL**: Für Relationen und Constraints
- **React Hook Form**: Für Formular-Validierung
- **React Select**: Für erweiterte Dropdown-Funktionalität

## Rollout Plan

### Phase 1: Backend & Database (1.5 Tage)
- Datenbank-Schema erstellen
- API-Endpoints implementieren
- Validierung und Tests

### Phase 2: Admin-Interface (1.5 Tage)
- Dienstleister-Verwaltung-Seite
- CRUD-Operationen
- Suche und Filterung

### Phase 3: Projekt-Integration (1 Tag)
- Dropdown-Komponente
- Inline-Erstellung
- Projekt-Formular-Integration

### Phase 4: Testing & Polish (0.5 Tage)
- E2E Tests
- UI/UX Verbesserungen
- Bug Fixes

**Geschätzte Gesamtdauer: 4.5 Tage**

---

