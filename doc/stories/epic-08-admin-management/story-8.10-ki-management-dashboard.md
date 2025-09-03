# Story 8.10: KI-Management Dashboard

## Übersicht
**Als** SuperAdmin  
**möchte ich** ein umfassendes KI-Management Dashboard  
**damit** ich die KI-Performance überwachen, OCR-Qualität verbessern und Kosten kontrollieren kann.

## Akzeptanzkriterien

### AC1: Navigation & Layout
- [ ] KI-Management als separater Admin-Tab
- [ ] Konsistente Tab-Navigation (6 Hauptbereiche)
- [ ] Responsive Design für Desktop/Tablet
- [ ] Einheitliches Design mit System-Management

### AC2: KI-Provider Management (Migration)
- [ ] KI-Provider von System-Management nach KI-Management migriert
- [ ] Live-Status Monitoring (Response Time, Success Rate)
- [ ] Kosten-Tracking pro Provider
- [ ] Rate-Limit Monitoring mit Warnungen

### AC3: System-Prompts Management (Migration)
- [ ] System-Prompts von System-Management nach KI-Management migriert
- [ ] Prompt-Testing Interface für neue Prompts
- [ ] A/B-Testing verschiedener Prompts
- [ ] Prompt-Versionierung mit Rollback-Funktion

### AC4: OCR-Qualitäts-Dashboard
- [ ] Accuracy-Statistiken pro Lieferant (basierend auf 7 echten Rechnungen)
- [ ] Confidence-Level Verteilung
- [ ] Fehlerrate-Analyse mit Trends
- [ ] Manuelle vs. Automatische Erkennungen Ratio

### AC5: Pattern-Learning Management
- [ ] Lieferanten-Erkennungs-Performance Dashboard
- [ ] Falsch-Erkennungen Korrektur-Interface
- [ ] Supplier-spezifische Optimierungen
- [ ] Pattern-Learning Erfolgsmetriken

### AC6: Pipeline-Status Management
- [ ] Rechnungs-Verarbeitungs-Queue Status
- [ ] Fehlerhafte Rechnungen Management
- [ ] Batch-Processing Kontrolle
- [ ] Pipeline-Performance Monitoring

## Technische Anforderungen

### Backend APIs
```
/api/admin/ai/providers          - KI-Provider Management
/api/admin/ai/prompts           - System-Prompts Management  
/api/admin/ai/ocr-quality       - OCR-Qualitäts-Metriken
/api/admin/ai/pattern-learning  - Pattern-Learning Daten
/api/admin/ai/pipeline-status   - Pipeline-Status
/api/admin/ai/cost-tracking     - KI-Kosten-Tracking
```

### Frontend Komponenten
```
components/admin/ai/
├── AIManagement.tsx           - Haupt-Container
├── AIProviderTab.tsx          - Provider Management
├── SystemPromptsTab.tsx       - Prompt Management
├── OCRQualityDashboard.tsx    - OCR-Qualität
├── PatternLearningTab.tsx     - Pattern-Learning
├── PipelineStatusTab.tsx      - Pipeline-Status
└── shared/
    ├── MetricCard.tsx         - Wiederverwendbare Metrik-Karten
    ├── QualityChart.tsx       - OCR-Qualitäts-Charts
    └── StatusIndicator.tsx    - Status-Anzeigen
```

## UX-Design Spezifikationen

### Farbschema
- **Erfolg**: Grün (#10B981) für gute Performance
- **Warnung**: Gelb (#F59E0B) für Aufmerksamkeit
- **Fehler**: Rot (#EF4444) für kritische Issues
- **Info**: Blau (#3B82F6) für neutrale Informationen

### Metriken-Visualisierung
- **Donut-Charts** für Accuracy-Verteilungen
- **Line-Charts** für Trends über Zeit
- **Bar-Charts** für Lieferanten-Vergleiche
- **Progress-Bars** für Pipeline-Status

### Interaktive Elemente
- **Hover-Tooltips** für detaillierte Informationen
- **Click-to-Drill-Down** für tiefere Analysen
- **Real-time Updates** für Live-Metriken
- **Export-Funktionen** für Reports

## Datenquellen

### Echte Daten (bereits vorhanden)
- **7 OCR-verarbeitete Rechnungen** in `invoices` Tabelle
- **API-Usage Tracking** in `api_keys` Tabelle
- **System-Logs** für Performance-Metriken
- **AI-Provider Konfiguration** in `ai_providers` Tabelle

### Neue Datenstrukturen
```sql
-- OCR-Qualitäts-Metriken
CREATE TABLE ocr_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  supplier_name TEXT,
  confidence_score DECIMAL(5,4),
  accuracy_score DECIMAL(5,4),
  manual_corrections INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  ai_provider TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pattern-Learning Daten
CREATE TABLE supplier_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name TEXT NOT NULL,
  pattern_data JSONB,
  success_rate DECIMAL(5,4),
  last_updated TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);
```

## Definition of Done

### **UI-Funktionalität (Aktuell ~80% → Ziel 100%)**
- [x] KI-Provider Tab: Anzeige funktioniert ✅
- [x] KI-Provider Tab: CRUD-Funktionen (Hinzufügen, Bearbeiten, Löschen) ✅ **WOCHE 1 TAG 1**
- [ ] KI-Provider Tab: Testen-Funktion (Verbindungstest)
- [ ] KI-Provider Tab: Live-Monitoring (Response Time, Success Rate, Kosten)
- [x] System-Prompts Tab: Anzeigen & Löschen funktioniert ✅
- [x] System-Prompts Tab: Prompt-Testing mit vollständiger UI ✅ **WOCHE 1 TAG 2**
- [ ] System-Prompts Tab: Erstellen, Bearbeiten, A/B-Tests
- [x] OCR-Qualität Tab: Basis-Dashboard mit echten Daten ✅
- [ ] OCR-Qualität Tab: Trend-Charts, Fehler-Analyse, Export-Funktion
- [ ] Pattern-Learning Tab: Komplett implementieren (aktuell leer)
- [x] Pipeline-Status Tab: Status-Anzeige funktioniert
- [ ] Pipeline-Status Tab: Pipeline-Kontrolle (Start/Stop/Batch)

### **Backend-APIs (Aktuell ~85% → Ziel 100%)**
- [x] `/api/admin/ai/ocr-quality` - Basis-Metriken ✅
- [x] `/api/admin/ai/pipeline-status` - Status-Anzeige ✅
- [x] `/api/admin/providers` - Vollständige CRUD (7 Endpoints) ✅ **WOCHE 1 TAG 1**
- [x] `/api/admin/system/prompts/:id/test` - Prompt-Testing API ✅ **WOCHE 1 TAG 2**
- [ ] `/api/admin/ai/prompts` - Erweiterte CRUD (POST/PUT)
- [ ] `/api/admin/ai/pattern-learning` - Komplett neu
- [ ] `/api/admin/ai/pipeline` - Management-Funktionen
- [ ] Real-Time WebSocket-Integration

### **Datenstrukturen (Aktuell ~100% → Ziel 100%)**
- [x] `ocr_quality_metrics` Tabelle für detailliertes Tracking ✅ **WOCHE 1 TAG 1**
- [x] `supplier_patterns` Tabelle für Pattern-Learning ✅ **WOCHE 1 TAG 1**
- [x] `pipeline_jobs` Tabelle für Job-Management ✅ **WOCHE 1 TAG 1**
- [x] `ai_provider_metrics` Tabelle für Live-Monitoring ✅ **WOCHE 1 TAG 1**

### **Performance & UX**
- [x] Responsive Design auf Desktop/Tablet getestet
- [x] Performance: Ladezeiten < 3 Sekunden (aktuelle Tabs)
- [ ] Real-Time Updates < 1 Sekunde Latenz
- [ ] Browser-Tests in Chrome, Firefox, Safari (alle Funktionen)
- [x] Dokumentation für @dev.mdc erstellt

## Abhängigkeiten
- Story 8.6-8.8 (System-Management) muss abgeschlossen sein
- OCR-System mit echten Daten muss funktionieren
- API-Usage Tracking muss implementiert sein

## Schätzung & Priorisierung

### **Aufwand-Schätzung (Realistisch)**
**Gesamtaufwand**: 12-15 Tage (3-4 Wochen)  
**Komplexität**: Sehr Hoch (70% neue Features)  
**Risiko**: Mittel-Hoch (Real-Time Integration, Datenqualität)

### **Priorisierung nach Business Value**
1. **🔥 Kritisch (Woche 1)**: Provider-CRUD, Prompt-Testing
2. **⚡ Hoch (Woche 2)**: OCR-Dashboard Erweiterungen, Pattern-Learning Basis
3. **📊 Mittel (Woche 3)**: Pipeline-Management, Real-Time Updates
4. **✨ Nice-to-Have (Woche 4)**: A/B-Testing, Export-Funktionen

### **Implementierungs-Strategie**
- **Iterativ**: Jede Woche ein funktionsfähiges Inkrement
- **Parallel**: Backend & Frontend parallel entwickeln
- **Test-Driven**: Jede Funktion sofort im Browser testen
- **User-Feedback**: Nach jeder Woche Feedback von @po.mdc

### **Team-Aufgaben**
- **@dev.mdc**: Backend-APIs, Datenbank-Schema, Real-Time Services
- **@po.mdc**: UI/UX-Feedback, Acceptance-Testing, Business-Logic-Validierung
- **Beide**: Integration-Testing, Performance-Optimierung
