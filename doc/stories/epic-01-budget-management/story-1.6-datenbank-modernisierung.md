# Story 1.6: Datenbank-Modernisierung & Internationalisierung

## 📋 **Story-Übersicht**
**ID:** 1.6  
**Titel:** Datenbank-Modernisierung & Internationalisierung  
**Epic:** Epic-01 Budget Management  
**Status:** 🔄 IN PROGRESS  
**Priorität:** Hoch  
**Geschätzter Aufwand:** 2 Tage  
**Sprint:** August 2025 - Modernisierung  

## 🎯 **Ziel**
Modernisierung der Datenbankstruktur durch einheitliche englische Feldnamen, zentrales Tag-Management und Entfernung von Mock-Daten für eine professionelle, internationale Codebasis.

## 📖 **Beschreibung**
Nach Abschluss von Epic-01 wurde eine inkonsistente Mischung aus deutschen und englischen Feldnamen in der Datenbank identifiziert. Diese Story adressiert die Modernisierung der gesamten Datenbankstruktur für bessere Wartbarkeit, internationale Skalierbarkeit und professionelle Standards.

## ✅ **Acceptance Criteria**

### **AC-1: Einheitliche englische Feldnamen**
- [ ] Alle deutschen Feldnamen werden zu englischen Äquivalenten migriert
- [ ] Tabellennamen werden auf Englisch standardisiert
- [ ] Datenintegrität bleibt während der Migration erhalten
- [ ] Backward-Kompatibilität während der Übergangsphase

### **AC-2: Zentrales Tag-Management**
- [ ] Neue Tabelle `tags` für zentrale Tag-Verwaltung
- [ ] Many-to-Many Beziehung zwischen Projekten und Tags
- [ ] Tag-Kategorisierung und Hierarchie-Support
- [ ] API-Endpunkte für Tag-Management

### **AC-3: Mock-Daten Entfernung**
- [ ] Alle Mock-Daten aus Frontend/Backend entfernt
- [ ] Direkte Supabase-Integration für alle Datenoperationen
- [ ] Test-Daten nur noch in Supabase-Datenbank
- [ ] Saubere Entwicklungsumgebung

### **AC-4: Datenbank-Optimierung**
- [ ] Performance-Indizes hinzugefügt
- [ ] Datentyp-Optimierungen (ENUMs für Status-Felder)
- [ ] Verbesserte Constraints und Validierungen
- [ ] Optimierte Foreign Key Beziehungen

## 🗺️ **Implementierungsplan**

### **Phase 1: Vorbereitung & Backup (2-3h)**
```sql
-- 1. Vollständiges Datenbank-Backup
-- 2. Feldnamen-Mapping-Tabelle erstellen
-- 3. Migration-Scripts vorbereiten
-- 4. Test-Umgebung Setup
```

### **Phase 2: Datenbank-Schema Migration (4-5h)**

#### **2.1 Feldnamen-Migration**
```sql
-- Beispiel: projects Tabelle
ALTER TABLE projects 
  ADD COLUMN description TEXT,
  ADD COLUMN planned_budget DECIMAL(12,2),
  ADD COLUMN consumed_budget DECIMAL(12,2),
  ADD COLUMN project_manager UUID,
  ADD COLUMN start_date DATE,
  ADD COLUMN end_date DATE,
  ADD COLUMN project_number VARCHAR(50),
  ADD COLUMN priority VARCHAR(20),
  ADD COLUMN cost_type VARCHAR(50),
  ADD COLUMN supplier VARCHAR(100),
  ADD COLUMN duration_weeks INTEGER,
  ADD COLUMN estimated_budget DECIMAL(12,2),
  ADD COLUMN allocated_budget DECIMAL(12,2),
  ADD COLUMN budget_consumption_percent DECIMAL(5,2),
  ADD COLUMN cost_limit DECIMAL(12,2),
  ADD COLUMN budget_year INTEGER;

-- Daten kopieren
UPDATE projects SET 
  description = beschreibung,
  planned_budget = geplantes_budget,
  consumed_budget = verbrauchtes_budget,
  project_manager = projekt_manager,
  start_date = start_datum,
  end_date = end_datum,
  project_number = projektnummer,
  priority = prioritaet,
  cost_type = kostenart,
  supplier = dienstleister,
  duration_weeks = durchlaufzeit_wochen,
  estimated_budget = veranschlagtes_budget,
  allocated_budget = zugewiesenes_budget,
  budget_consumption_percent = budget_verbrauch_prozent,
  cost_limit = kosten_obergrenze,
  budget_year = budget_jahr;
```

#### **2.2 Tabellennamen-Migration**
```sql
-- Tabellennamen standardisieren
ALTER TABLE dienstleister RENAME TO suppliers;
ALTER TABLE kategorien RENAME TO categories;
ALTER TABLE rollen_stammdaten RENAME TO roles;
ALTER TABLE projekt_team_rollen RENAME TO project_team_roles;
ALTER TABLE team_rollen RENAME TO team_roles;
```

#### **2.3 Zentrales Tag-System**
```sql
-- Tags Tabelle erstellen
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7), -- Hex color code
  category VARCHAR(30),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project-Tags Many-to-Many
CREATE TABLE project_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, tag_id)
);

-- Indizes für Performance
CREATE INDEX idx_project_tags_project_id ON project_tags(project_id);
CREATE INDEX idx_project_tags_tag_id ON project_tags(tag_id);
CREATE INDEX idx_tags_category ON tags(category);
CREATE INDEX idx_tags_active ON tags(is_active);
```

### **Phase 3: Backend-Anpassung (3-4h)**
- API-Endpunkte auf englische Feldnamen umstellen
- Database-Queries anpassen
- Validation-Schemas aktualisieren
- Tag-Management APIs implementieren

### **Phase 4: Frontend-Anpassung (3-4h)**
- TypeScript-Interfaces aktualisieren
- Form-Komponenten anpassen
- API-Service-Layer aktualisieren
- Tag-Management UI implementieren

### **Phase 5: Optimierungen & Cleanup (2-3h)**
- Performance-Indizes hinzufügen
- ENUMs für Status-Felder erstellen
- Deutsche Spalten nach Validierung löschen
- Mock-Daten entfernen

## 📊 **Feldnamen-Mapping**

### **Projects Tabelle**
| Deutsch | Englisch | Typ |
|---------|----------|-----|
| beschreibung | description | TEXT |
| geplantes_budget | planned_budget | DECIMAL(12,2) |
| verbrauchtes_budget | consumed_budget | DECIMAL(12,2) |
| projekt_manager | project_manager | UUID |
| start_datum | start_date | DATE |
| end_datum | end_date | DATE |
| projektnummer | project_number | VARCHAR(50) |
| prioritaet | priority | project_priority_enum |
| kostenart | cost_type | VARCHAR(50) |
| dienstleister | supplier | VARCHAR(100) |
| durchlaufzeit_wochen | duration_weeks | INTEGER |
| veranschlagtes_budget | estimated_budget | DECIMAL(12,2) |
| zugewiesenes_budget | allocated_budget | DECIMAL(12,2) |
| budget_verbrauch_prozent | budget_consumption_percent | DECIMAL(5,2) |
| kosten_obergrenze | cost_limit | DECIMAL(12,2) |
| budget_jahr | budget_year | INTEGER |

### **Annual_Budgets Tabelle**
| Deutsch | Englisch | Typ |
|---------|----------|-----|
| jahr | year | INTEGER |
| gesamtbudget | total_budget | DECIMAL(12,2) |
| verbrauchtes_budget | consumed_budget | DECIMAL(12,2) |
| genehmigt_von | approved_by | UUID |
| genehmigt_am | approved_at | TIMESTAMP |
| reserve_allokation | reserve_allocation | DECIMAL(12,2) |
| verfuegbares_budget | available_budget | DECIMAL(12,2) |
| beschreibung | description | TEXT |

### **Suppliers Tabelle (ehemals dienstleister)**
| Deutsch | Englisch | Typ |
|---------|----------|-----|
| kurzbeschreibung | short_description | TEXT |
| kategorie | category | VARCHAR(50) |
| kontakt_email | contact_email | VARCHAR(100) |
| kontakt_telefon | contact_phone | VARCHAR(20) |
| adresse | address | TEXT |
| steuernummer | tax_number | VARCHAR(20) |
| ustid | vat_id | VARCHAR(20) |

## 🚀 **Neue Features**

### **Tag-Management System**
```typescript
// Tag Interface
interface Tag {
  id: string;
  name: string;
  color?: string;
  category?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Endpoints
GET /api/tags - Alle Tags abrufen
POST /api/tags - Neuen Tag erstellen
PUT /api/tags/:id - Tag aktualisieren
DELETE /api/tags/:id - Tag löschen
GET /api/tags/categories - Tag-Kategorien abrufen
GET /api/projects/:id/tags - Projekt-Tags abrufen
POST /api/projects/:id/tags - Tags zu Projekt hinzufügen
DELETE /api/projects/:id/tags/:tagId - Tag von Projekt entfernen
```

## 🎨 **UI/UX Verbesserungen**
- **Tag-Selector**: Multi-Select Dropdown mit Farb-Coding
- **Tag-Management**: Admin-Interface für Tag-Verwaltung
- **Tag-Filter**: Projekt-Filterung nach Tags
- **Tag-Kategorien**: Gruppierung von Tags nach Kategorien

## 🧪 **Testing-Strategie**
- **Unit Tests**: Alle neuen API-Endpunkte
- **Integration Tests**: Datenbank-Migration Validierung
- **E2E Tests**: Tag-Management Workflows
- **Performance Tests**: Neue Indizes und Queries

## 📈 **Performance-Optimierungen**
```sql
-- Neue Indizes für bessere Performance
CREATE INDEX idx_projects_budget_year ON projects(budget_year);
CREATE INDEX idx_projects_status_priority ON projects(status, priority);
CREATE INDEX idx_projects_start_date ON projects(start_date);
CREATE INDEX idx_annual_budgets_year_status ON annual_budgets(year, status);
CREATE INDEX idx_suppliers_category ON suppliers(category);
CREATE INDEX idx_project_teams_project_lead ON project_teams(project_id, is_lead_team);

-- ENUMs für bessere Performance und Datenintegrität
CREATE TYPE project_priority_enum AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE project_status_enum AS ENUM ('planned', 'active', 'completed', 'cancelled', 'on_hold');
CREATE TYPE budget_status_enum AS ENUM ('draft', 'active', 'closed', 'archived');
```

## ✅ **Definition of Done**
- [ ] Alle Feldnamen sind auf Englisch migriert
- [ ] Zentrales Tag-System ist implementiert und getestet
- [ ] Alle Mock-Daten sind entfernt
- [ ] Performance-Optimierungen sind implementiert
- [ ] Alle Tests bestehen (Unit, Integration, E2E)
- [ ] Dokumentation ist aktualisiert
- [ ] Code Review ist abgeschlossen
- [ ] Deployment ist erfolgreich

## 🔄 **Rollback-Plan**
- Vollständiges Datenbank-Backup vor Migration
- Schrittweise Migration mit Validierung
- Deutsche Spalten bleiben während Übergangsphase bestehen
- Automatische Rollback-Scripts bei Fehlern

## 📚 **Dokumentation Updates**
- [ ] Architecture.md - Neue Datenbankstruktur
- [ ] PRD.md - Tag-Management Features
- [ ] API-Dokumentation - Neue Endpunkte
- [ ] README.md - Setup-Anweisungen aktualisiert

## 🎯 **Business Value**
- **Internationale Skalierbarkeit**: Englische API für globale Nutzung
- **Entwickler-Produktivität**: Einheitliche Namenskonventionen
- **Wartbarkeit**: Saubere, professionelle Codebasis
- **Performance**: Optimierte Datenbankstruktur
- **Flexibilität**: Zentrales Tag-System für bessere Organisation

---

**Erstellt:** 2025-08-29  
**Letzte Aktualisierung:** 2025-08-29  
**Verantwortlich:** Development Team  
**Reviewer:** Technical Lead

