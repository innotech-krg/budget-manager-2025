# Story 2.8: KI-basierte automatische Projekt-Zuordnung

## 📋 **Story Übersicht**
- **Epic**: 02 - OCR & Rechnungsverarbeitung  
- **Story**: 2.8 - KI-basierte Projekt-Zuordnung
- **Priorität**: Hoch
- **Status**: Geplant
- **Geschätzter Aufwand**: 4-6 Tage

## 🎯 **Ziel**
Entwicklung eines KI-Systems, das automatisch Rechnungspositionen den passenden Projekten zuordnet. Das System analysiert Beschreibungen, Kategorien und historische Daten, um intelligente Zuordnungsvorschläge zu machen, die der User bestätigen oder anpassen kann.

## 📝 **Beschreibung**
Nach der OCR-Verarbeitung soll die KI automatisch erkennen, zu welchem Projekt eine Rechnungsposition gehört. Basierend auf Projektbeschreibungen, historischen Zuordnungen und Rechnungsinhalten macht das System Vorschläge, die dem User zur Bestätigung vorgelegt werden.

## ✅ **Akzeptanzkriterien**

### **KI-Analyse-Anforderungen**
- [ ] **Position-Analyse**: KI analysiert jede Rechnungsposition einzeln
- [ ] **Projekt-Matching**: Abgleich mit verfügbaren Projekten in der Datenbank
- [ ] **Konfidenz-Bewertung**: Bewertung der Zuordnungswahrscheinlichkeit (0-100%)
- [ ] **Multiple Vorschläge**: Top 3 Projekt-Vorschläge pro Position
- [ ] **Begründung**: KI erklärt warum sie ein Projekt vorschlägt

### **Matching-Algorithmus**
- [ ] **Textähnlichkeit**: Vergleich Positionsbeschreibung mit Projektname/beschreibung
- [ ] **Kategorie-Matching**: Zuordnung basierend auf Projekt-Kategorien
- [ ] **Historische Daten**: Lernen aus vergangenen Zuordnungen
- [ ] **Lieferanten-Kontext**: Berücksichtigung des Rechnungsstellers
- [ ] **Betragsmuster**: Analyse typischer Beträge pro Projekt

### **User-Interface**
- [ ] **Zuordnungs-Dashboard**: Übersicht aller Positionen mit Vorschlägen
- [ ] **Drag & Drop**: Einfache Zuordnung per Drag & Drop
- [ ] **Bestätigung-Workflow**: Batch-Bestätigung mehrerer Zuordnungen
- [ ] **Manuelle Korrektur**: Möglichkeit zur manuellen Anpassung
- [ ] **Lern-Feedback**: System lernt aus User-Korrekturen

### **Integration**
- [ ] **OCR-Pipeline**: Nahtlose Integration in OCR-Verarbeitungsprozess
- [ ] **Budget-Update**: Automatische Budget-Aktualisierung nach Zuordnung
- [ ] **Audit-Trail**: Vollständige Nachverfolgung aller Zuordnungen
- [ ] **Benachrichtigungen**: Info über neue Zuordnungsvorschläge

## 🔧 **Technische Umsetzung**

### **KI-Service Erweiterung**
```javascript
// Neue Services:
- projectMatchingService.js
- positionAnalysisService.js
- learningFeedbackService.js

// KI-Prompts für:
- Projekt-Analyse
- Position-Kategorisierung
- Ähnlichkeits-Bewertung
```

### **Datenbank-Schema**
```sql
-- Neue Tabellen:
CREATE TABLE position_project_suggestions (
  id UUID PRIMARY KEY,
  invoice_position_id UUID,
  suggested_project_id UUID,
  confidence_score NUMERIC(5,2),
  reasoning TEXT,
  status VARCHAR(20) -- pending, approved, rejected
);

CREATE TABLE project_assignment_history (
  id UUID PRIMARY KEY,
  position_id UUID,
  project_id UUID,
  assigned_by UUID,
  assignment_method VARCHAR(20), -- ai_suggestion, manual, drag_drop
  confidence_score NUMERIC(5,2),
  created_at TIMESTAMP
);

CREATE TABLE learning_feedback (
  id UUID PRIMARY KEY,
  original_suggestion_id UUID,
  corrected_project_id UUID,
  feedback_type VARCHAR(20), -- correction, confirmation
  user_id UUID,
  created_at TIMESTAMP
);
```

### **Frontend-Komponenten**
```typescript
// Neue Komponenten:
- ProjectAssignmentDashboard
- PositionCard (mit Projekt-Vorschlägen)
- ProjectSuggestionList
- DragDropProjectAssignment
- ConfidenceIndicator
```

## 🎯 **KI-Prompting-Strategie**

### **Projekt-Analyse-Prompt**
```
Analysiere diese Rechnungsposition und ordne sie dem passendsten Projekt zu:

POSITION: {position_description}
BETRAG: {amount} EUR
LIEFERANT: {supplier}

VERFÜGBARE PROJEKTE:
{project_list_with_descriptions}

HISTORISCHE ZUORDNUNGEN:
{similar_past_assignments}

Bewerte für jedes Projekt:
1. Relevanz (0-100%)
2. Begründung
3. Konfidenz

Gib die Top 3 Vorschläge zurück.
```

### **Lern-Algorithmus**
- **Positive Verstärkung**: Bei bestätigten Vorschlägen
- **Negative Anpassung**: Bei korrigierten Zuordnungen  
- **Pattern-Erkennung**: Aus historischen Daten
- **Kontinuierliches Lernen**: Verbesserung über Zeit

## 📊 **Erfolgsmessung**
- **Zuordnungsgenauigkeit**: >80% korrekte Erstvorschläge
- **User-Akzeptanz**: >70% der Vorschläge werden bestätigt
- **Zeitersparnis**: 60% weniger manuelle Zuordnungszeit
- **Lernfortschritt**: Steigende Genauigkeit über Zeit

## 🔗 **Abhängigkeiten**
- **Story 2.7**: OCR KI-Refactoring (Basis für Positionsdaten)
- **Epic 1**: Projekt-Management (Projektdaten verfügbar)
- **KI-APIs**: OpenAI/Claude für Analyse-Funktionen

## 📋 **Implementierungs-Phasen**

### **Phase 1: Basis-Matching**
- Einfache Textähnlichkeit
- Grundlegende UI-Komponenten
- Manuelle Bestätigung

### **Phase 2: Intelligente Analyse**
- KI-basierte Projekt-Analyse
- Konfidenz-Bewertung
- Historische Daten-Integration

### **Phase 3: Lern-System**
- Feedback-Integration
- Kontinuierliches Lernen
- Optimierte Vorschläge

## 🚨 **Risiken**
- **Falsche Zuordnungen**: Können zu Budget-Fehlern führen
- **KI-Kosten**: Zusätzliche API-Aufrufe für jede Position
- **Komplexität**: Viele Projekte können Matching erschweren

## 📝 **Notizen**
- Integration mit bestehender Budget-Logik erforderlich
- User-Training für optimale Nutzung des Systems
- Möglichkeit für Batch-Verarbeitung großer Rechnungen

