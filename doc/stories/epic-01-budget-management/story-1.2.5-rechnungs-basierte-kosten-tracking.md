# Story 1.2.5: Rechnungs-basierte Kosten-Tracking

**Epic:** 1 - Kern-Budget-Management-System  
**Story Points:** 8  
**Sprint:** 3 (Nach Epic 2)  
**Priorität:** Niedrig  
**Status:** Blocked (Abhängig von Epic 2)

## User Story

**Als** Projektmanager  
**möchte ich** dass reale Kosten durch zugeordnete Rechnungen automatisch berechnet werden  
**damit** ich keine manuellen Kosten-Eingaben machen muss und immer aktuelle, präzise Kosten-Daten habe

## Business Context

### Problem Statement
- Aktuell werden reale Kosten manuell geschätzt und eingegeben
- Keine Verbindung zwischen Rechnungen und Projekt-Kosten
- Fehlende Echtzeit-Kosten-Updates bei neuen Rechnungen
- Inkonsistenz zwischen geplanten und tatsächlichen Kosten

### Business Value
- **Automatische Kosten-Erfassung** eliminiert manuelle Eingaben
- **Echtzeit-Kosten-Updates** durch Rechnungs-Zuordnung
- **Präzise Kosten-Tracking** basierend auf tatsächlichen Belegen
- **Bessere Kosten-Kontrolle** durch kontinuierliches Monitoring

## Akzeptanzkriterien

### AC-1: Automatische Kosten-Berechnung aus Rechnungen
- [ ] **GEGEBEN** Rechnungen sind Projekten zugeordnet (Epic 2)
- [ ] **WENN** ich die Projekt-Kosten betrachte
- [ ] **DANN** werden reale Kosten automatisch aus zugeordneten Rechnungen berechnet
- [ ] **UND** bei neuen Rechnungs-Zuordnungen sofort aktualisiert

### AC-2: Projekt-Erstellung ohne manuelle Kosten-Eingabe
- [ ] **GEGEBEN** ich erstelle ein neues Projekt
- [ ] **WENN** ich das Projekt-Formular ausfülle
- [ ] **DANN** muss ich keine realen Kosten manuell eingeben
- [ ] **UND** diese werden automatisch durch Rechnungen befüllt

### AC-3: Kosten-Übersicht mit Rechnungs-Details
- [ ] **GEGEBEN** ein Projekt hat zugeordnete Rechnungen
- [ ] **WENN** ich die Kosten-Details öffne
- [ ] **DANN** sehe ich alle zugeordneten Rechnungen mit Beträgen
- [ ] **UND** kann einzelne Rechnungen einsehen und bearbeiten

### AC-4: Kosten-Prognose vs. Ist-Kosten
- [ ] **GEGEBEN** ich betrachte ein laufendes Projekt
- [ ] **WENN** ich die Kosten-Analyse öffne
- [ ] **DANN** sehe ich geplante vs. tatsächliche Kosten
- [ ] **UND** Abweichungen werden farblich hervorgehoben

### AC-5: Automatische Benachrichtigungen bei Kosten-Überschreitungen
- [ ] **GEGEBEN** die Ist-Kosten überschreiten die geplanten Kosten
- [ ] **WENN** eine neue Rechnung zugeordnet wird
- [ ] **DANN** erhalte ich eine Benachrichtigung über die Überschreitung
- [ ] **UND** kann entsprechende Maßnahmen einleiten

### AC-6: Historische Kosten-Entwicklung
- [ ] **GEGEBEN** ein Projekt läuft über mehrere Monate
- [ ] **WENN** ich die Kosten-Historie betrachte
- [ ] **DANN** sehe ich die Entwicklung der Kosten über die Zeit
- [ ] **UND** kann Trends und Muster erkennen

## Technische Tasks

### Backend
- [ ] **Rechnungs-Projekt-Verknüpfung (Epic 2 Dependency)**
  ```sql
  -- Diese Tabelle wird in Epic 2 erstellt
  CREATE TABLE rechnungen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dateiname VARCHAR(255) NOT NULL,
    betrag DECIMAL(12,2) NOT NULL,
    datum DATE NOT NULL,
    dienstleister_id UUID REFERENCES dienstleister(id),
    status VARCHAR(50) DEFAULT 'VERARBEITET',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE rechnung_projekt_zuordnungen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rechnung_id UUID REFERENCES rechnungen(id) ON DELETE CASCADE,
    projekt_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    zugeordneter_betrag DECIMAL(12,2) NOT NULL,
    anteil_prozent DECIMAL(5,2), -- Für Teilzuordnungen
    zugeordnet_von VARCHAR(255),
    zugeordnet_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rechnung_id, projekt_id)
  );
  ```

- [ ] **Kosten-Aggregations-Service**
  ```javascript
  class RechnungsKostenService {
    async berechneRealeCosts(projektId) {
      const zuordnungen = await db.query(`
        SELECT SUM(zugeordneter_betrag) as gesamt_kosten
        FROM rechnung_projekt_zuordnungen rpz
        JOIN rechnungen r ON rpz.rechnung_id = r.id
        WHERE rpz.projekt_id = $1 AND r.status = 'VERARBEITET'
      `, [projektId])
      
      return zuordnungen[0]?.gesamt_kosten || 0
    }
    
    async getKostenEntwicklung(projektId) {
      return await db.query(`
        SELECT 
          DATE_TRUNC('month', rpz.zugeordnet_am) as monat,
          SUM(rpz.zugeordneter_betrag) as monatliche_kosten,
          SUM(SUM(rpz.zugeordneter_betrag)) OVER (ORDER BY DATE_TRUNC('month', rpz.zugeordnet_am)) as kumulative_kosten
        FROM rechnung_projekt_zuordnungen rpz
        WHERE rpz.projekt_id = $1
        GROUP BY DATE_TRUNC('month', rpz.zugeordnet_am)
        ORDER BY monat
      `, [projektId])
    }
  }
  ```

- [ ] **API-Endpoints**
  - `GET /api/projekte/{id}/kosten/rechnungen` - Zugeordnete Rechnungen
  - `GET /api/projekte/{id}/kosten/entwicklung` - Kosten-Historie
  - `GET /api/projekte/{id}/kosten/prognose` - Kosten-Prognose vs. Ist
  - `POST /api/projekte/{id}/kosten/benachrichtigung` - Kosten-Alerts

- [ ] **Real-time Updates**
  - WebSocket-Events bei Rechnungs-Zuordnung
  - Automatische Projekt-Kosten-Aktualisierung
  - Cache-Invalidierung für Kosten-Berechnungen

### Frontend
- [ ] **Kosten-Tracking-Komponenten**
  - `RechnungsKostenUebersicht.tsx` - Rechnungs-basierte Kosten-Anzeige
  - `KostenEntwicklungChart.tsx` - Historische Kosten-Visualisierung
  - `KostenPrognoseVergleich.tsx` - Geplant vs. Ist-Vergleich
  - `RechnungsZuordnungsList.tsx` - Liste zugeordneter Rechnungen

- [ ] **Projekt-Formular-Anpassungen**
  - Entfernung der manuellen Kosten-Eingabe-Felder
  - Automatische Kosten-Anzeige basierend auf Rechnungen
  - Kosten-Prognose-Eingabe für Planung

- [ ] **Benachrichtigungs-System**
  - `KostenAlertBanner.tsx` - Warnung bei Überschreitungen
  - `KostenTrendIndicator.tsx` - Trend-Anzeige (steigend/fallend)
  - Integration in Dashboard und Projekt-Übersicht

### Database Schema Updates
```sql
-- Projekt-Tabelle anpassen (reale_kosten wird berechnet)
ALTER TABLE projects DROP COLUMN IF EXISTS reale_kosten;
ALTER TABLE projects ADD COLUMN geplante_kosten DECIMAL(12,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN kosten_obergrenze DECIMAL(12,2);

-- Kosten-Tracking-Tabelle
CREATE TABLE projekt_kosten_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  geplante_kosten DECIMAL(12,2) NOT NULL DEFAULT 0,
  reale_kosten DECIMAL(12,2) NOT NULL DEFAULT 0,
  interne_kosten DECIMAL(12,2) NOT NULL DEFAULT 0,
  externe_kosten DECIMAL(12,2) NOT NULL DEFAULT 0,
  abweichung_prozent DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN geplante_kosten > 0 THEN ((reale_kosten - geplante_kosten) / geplante_kosten * 100)
      ELSE 0 
    END
  ) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(projekt_id, datum)
);

-- View für aktuelle Projekt-Kosten
CREATE OR REPLACE VIEW projekt_kosten_aktuell AS
SELECT 
  p.id as projekt_id,
  p.projektname,
  p.geplante_kosten,
  COALESCE(SUM(rpz.zugeordneter_betrag), 0) as reale_kosten,
  COALESCE(pkc.interne_kosten_gesamt, 0) as interne_kosten,
  COALESCE(SUM(rpz.zugeordneter_betrag), 0) as externe_kosten,
  p.geplante_kosten + COALESCE(pkc.interne_kosten_gesamt, 0) as gesamte_geplante_kosten,
  COALESCE(SUM(rpz.zugeordneter_betrag), 0) + COALESCE(pkc.interne_kosten_gesamt, 0) as gesamte_ist_kosten
FROM projects p
LEFT JOIN rechnung_projekt_zuordnungen rpz ON p.id = rpz.projekt_id
LEFT JOIN projekt_kosten_cache pkc ON p.id = pkc.projekt_id
GROUP BY p.id, p.projektname, p.geplante_kosten, pkc.interne_kosten_gesamt;

-- Trigger für tägliche Kosten-Snapshots
CREATE OR REPLACE FUNCTION create_daily_cost_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO projekt_kosten_tracking (
    projekt_id, datum, geplante_kosten, reale_kosten, interne_kosten, externe_kosten
  )
  SELECT 
    projekt_id, CURRENT_DATE, geplante_kosten, reale_kosten, interne_kosten, externe_kosten
  FROM projekt_kosten_aktuell
  WHERE projekt_id = NEW.projekt_id
  ON CONFLICT (projekt_id, datum) DO UPDATE SET
    reale_kosten = EXCLUDED.reale_kosten,
    externe_kosten = EXCLUDED.externe_kosten,
    created_at = CURRENT_TIMESTAMP;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_daily_cost_snapshot
  AFTER INSERT OR UPDATE ON rechnung_projekt_zuordnungen
  FOR EACH ROW EXECUTE FUNCTION create_daily_cost_snapshot();
```

## UI/UX Spezifikationen

### Projekt-Formular ohne manuelle Kosten-Eingabe
```
┌─────────────────────────────────────────────────────────────┐
│ 💰 Projekt-Kosten                                          │
├─────────────────────────────────────────────────────────────┤
│ Geplante externe Kosten: [50000,00] €                     │
│ Kosten-Obergrenze (opt.): [75000,00] €                    │
│                                                             │
│ ℹ️ Reale Kosten werden automatisch durch zugeordnete       │
│    Rechnungen berechnet (Epic 2: OCR-Integration)          │
│                                                             │
│ 📊 Interne Kosten: 38.200,00€ (automatisch berechnet)    │
│ 🎯 Gesamt geplant: 88.200,00€                             │
└─────────────────────────────────────────────────────────────┘
```

### Rechnungs-basierte Kosten-Übersicht
```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Zugeordnete Rechnungen                                  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📄 Rechnung_2025_001.pdf        15.750,00€  [Details] │ │
│ │ Design Agentur GmbH | 15.01.2025 | 100% zugeordnet    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📄 Hosting_Rechnung_Jan.pdf      2.500,00€   [Details] │ │
│ │ Cloud Provider Ltd | 31.01.2025 | 50% zugeordnet      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💰 Gesamt aus Rechnungen: 18.250,00€                      │
│ 📊 Interne Kosten:        38.200,00€                      │
│ ═══════════════════════════════════════════════════════════ │
│ 🎯 Projekt-Gesamtkosten:  56.450,00€                      │
└─────────────────────────────────────────────────────────────┘
```

### Kosten-Prognose vs. Ist-Vergleich
```
┌─────────────────────────────────────────────────────────────┐
│ 📈 Kosten-Analyse: Website Relaunch 2025                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Geplant    ████████████████████████████████ 88.200,00€    │
│ Ist-Kosten ██████████████████████████       56.450,00€    │
│ Prognose   ████████████████████████████████████ 95.000€   │
│                                                             │
│ 🟢 Aktuell: -31.750,00€ (-36%) unter Budget              │
│ ⚠️ Prognose: +6.800,00€ (+8%) über Budget                 │
│                                                             │
│ 📊 Fortschritt: 65% | Verbrauch: 64% | Trend: 🔺 Steigend │
│                                                             │
│ Letzte Aktualisierung: 15.02.2025 14:30                   │
└─────────────────────────────────────────────────────────────┘
```

### Kosten-Entwicklung-Chart
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Kosten-Entwicklung über Zeit                            │
├─────────────────────────────────────────────────────────────┤
│ 100k€ ┤                                                    │
│  90k€ ┤                                      ╭─ Prognose   │
│  80k€ ┤                                 ╭────╯             │
│  70k€ ┤                            ╭────╯                  │
│  60k€ ┤                       ╭────╯                       │
│  50k€ ┤                  ╭────╯                            │
│  40k€ ┤             ╭────╯                                 │
│  30k€ ┤        ╭────╯                                      │
│  20k€ ┤   ╭────╯                                           │
│  10k€ ┤╭──╯                                                │
│   0€  └┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─  │
│       Jan Feb Mär Apr Mai Jun Jul Aug Sep Okt Nov Dez     │
│                                                             │
│ ── Ist-Kosten  ┅┅ Geplante Kosten  ╌╌ Prognose           │
└─────────────────────────────────────────────────────────────┘
```

## Validierungsregeln

### Business Rules
1. **Automatische Berechnung**: Reale Kosten werden nur aus Rechnungen berechnet
2. **Keine manuelle Eingabe**: Reale Kosten können nicht manuell überschrieben werden
3. **Rechnungs-Validierung**: Nur verarbeitete Rechnungen fließen in Kosten-Berechnung ein
4. **Kosten-Obergrenze**: Optional definierbare Kosten-Limits mit Warnungen
5. **Historische Integrität**: Kosten-Snapshots werden täglich erstellt und nicht verändert

### Technische Validierung
```javascript
// Frontend-Validierung
const kostenValidation = {
  geplante_kosten: {
    required: 'Geplante Kosten sind erforderlich',
    min: { value: 0, message: 'Kosten dürfen nicht negativ sein' },
    valueAsNumber: true
  },
  kosten_obergrenze: {
    min: { value: 0, message: 'Obergrenze darf nicht negativ sein' },
    valueAsNumber: true,
    validate: (value, formValues) => {
      if (value && value < formValues.geplante_kosten) {
        return 'Obergrenze muss höher als geplante Kosten sein'
      }
      return true
    }
  }
}

// Backend-Validierung
const validateKostenZuordnung = (zuordnung) => {
  const errors = []
  
  if (zuordnung.zugeordneter_betrag <= 0) {
    errors.push('Zugeordneter Betrag muss positiv sein')
  }
  
  if (zuordnung.anteil_prozent && (zuordnung.anteil_prozent < 0 || zuordnung.anteil_prozent > 100)) {
    errors.push('Anteil muss zwischen 0% und 100% liegen')
  }
  
  return errors
}

// Kosten-Konsistenz-Check
const validateKostenKonsistenz = async (projektId) => {
  const berechneteKosten = await RechnungsKostenService.berechneRealeCosts(projektId)
  const cacheKosten = await getCachedKosten(projektId)
  
  const toleranz = 0.01
  return Math.abs(berechneteKosten - cacheKosten.externe_kosten) <= toleranz
}
```

## Testing Strategy

### Unit Tests
- [ ] Kosten-Berechnungs-Algorithmus aus Rechnungen
- [ ] Kosten-Entwicklung-Berechnung
- [ ] Prognose-Algorithmus
- [ ] Benachrichtigungs-Logik

### Integration Tests
- [ ] Rechnungs-Zuordnung und Kosten-Update
- [ ] WebSocket-Events bei Kosten-Änderungen
- [ ] Database-Trigger für Kosten-Snapshots
- [ ] Cache-Konsistenz-Checks

### E2E Tests
- [ ] Projekt-Erstellung ohne manuelle Kosten-Eingabe
- [ ] Rechnungs-Zuordnung und automatische Kosten-Aktualisierung
- [ ] Kosten-Überschreitung-Benachrichtigungen
- [ ] Kosten-Entwicklung-Visualisierung

## Performance Requirements

### Response Times
- Kosten-Berechnung aus Rechnungen: < 300ms
- Kosten-Entwicklung-Chart: < 500ms
- Real-time Kosten-Updates: < 200ms
- Kosten-Prognose-Berechnung: < 400ms

### Scalability
- Unterstützung für 1000+ Rechnungen pro Projekt
- Effiziente Aggregation auch bei großen Datenmengen
- Optimierte Kosten-Historie-Abfragen

## Definition of Done

### Funktional
- [ ] Alle Akzeptanzkriterien erfüllt
- [ ] Automatische Kosten-Berechnung aus Rechnungen
- [ ] Kosten-Prognose und -Vergleich implementiert
- [ ] Benachrichtigungs-System funktioniert

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

### Kritische Dependencies
- **Epic 2**: OCR-Integration & Rechnungsverarbeitung (BLOCKING)
- **Rechnungs-Tabellen**: Müssen in Epic 2 erstellt werden
- **Rechnungs-Projekt-Zuordnung**: Kern-Funktionalität aus Epic 2

### Interne Dependencies
- **Story 1.2.4**: Rollen-basierte Stundensatz-Kalkulation (für interne Kosten)
- **WebSocket-Infrastructure**: Für Real-time Updates
- **Benachrichtigungs-System**: Für Kosten-Alerts

### Externe Dependencies
- **PostgreSQL**: Für komplexe Aggregations-Queries
- **Chart.js**: Für Kosten-Entwicklung-Visualisierung
- **Socket.IO**: Für Real-time Kosten-Updates

## Rollout Plan

### Phase 1: Vorbereitung (Nach Epic 2 - 1 Tag)
- Database Schema Updates
- Kosten-Berechnungs-Service
- API-Endpoints

### Phase 2: Frontend-Anpassungen (1.5 Tage)
- Projekt-Formular ohne manuelle Kosten-Eingabe
- Rechnungs-basierte Kosten-Anzeige
- Kosten-Prognose-Komponenten

### Phase 3: Visualisierung & Reporting (1 Tag)
- Kosten-Entwicklung-Charts
- Kosten-Vergleich-Dashboard
- Benachrichtigungs-Integration

### Phase 4: Testing & Optimierung (0.5 Tage)
- E2E Tests
- Performance-Optimierung
- Bug Fixes

**Geschätzte Gesamtdauer: 4 Tage (Nach Epic 2)**

---

## ⚠️ **WICHTIGER HINWEIS: EPIC 2 DEPENDENCY**

Diese Story ist **BLOCKED** bis Epic 2 (OCR-Integration & Rechnungsverarbeitung) vollständig implementiert ist, da sie auf folgenden Epic 2 Features basiert:

- Rechnungs-Upload und -Verarbeitung
- Rechnungs-Projekt-Zuordnung
- OCR-basierte Rechnungs-Erkennung
- Dienstleister-Pattern-Matching

**Empfehlung**: Diese Story in Sprint 3 einplanen, nachdem Epic 2 abgeschlossen ist.

---

