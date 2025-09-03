# Story 2.3: Adaptive Rechnungsverarbeitung mit User-Training

## 📋 **Story Beschreibung**
Als Budget-Manager möchte ich eine adaptive Rechnungsverarbeitung, die aus meinen Korrekturen lernt und sich kontinuierlich verbessert, um die Genauigkeit der automatischen Rechnungserkennung zu maximieren.

## 🎯 **Akzeptanzkriterien**

### **Als Budget-Manager kann ich:**
- [ ] OCR-Ergebnisse in einer benutzerfreundlichen Oberfläche korrigieren
- [ ] Falsch erkannte Felder einfach korrigieren und neu zuordnen
- [ ] Neue Rechnungsfelder definieren, die das System nicht erkannt hat
- [ ] Feedback zur Erkennungsqualität geben (Daumen hoch/runter)
- [ ] Training-Fortschritt und Verbesserungen verfolgen

### **Das System soll:**
- [ ] Aus jeder Korrektur lernen und Pattern aktualisieren
- [ ] Ähnliche Korrekturen automatisch auf zukünftige Rechnungen anwenden
- [ ] Konfidenz-Scores basierend auf Training-Historie anpassen
- [ ] Vorschläge für wahrscheinliche Korrekturen machen
- [ ] Training-Qualität messen und reporten

## 🔧 **Technische Anforderungen**

### **Korrektur-Interface:**
```typescript
interface CorrectionSession {
  id: string
  ocrProcessingId: string
  supplierId: string
  originalData: ExtractedData
  corrections: FieldCorrection[]
  userFeedback: UserFeedback
  trainingImpact: TrainingImpact
  sessionDuration: number
  completedAt: Date
}

interface FieldCorrection {
  fieldName: string
  originalValue: string
  correctedValue: string
  originalPosition: BoundingBox
  correctedPosition?: BoundingBox
  correctionType: 'VALUE' | 'POSITION' | 'FIELD_TYPE' | 'NEW_FIELD'
  confidence: number
  userConfidence: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface UserFeedback {
  overallQuality: 1 | 2 | 3 | 4 | 5
  mostProblematicFields: string[]
  suggestions: string
  timeToCorrect: number
}
```

### **Learning-Algorithmus:**
- **Pattern-Update:** Korrekturen in bestehende Patterns integrieren
- **Gewichtung:** Häufige Korrekturen höher gewichten
- **Konfidenz-Anpassung:** Erfolgsrate in Konfidenz-Berechnung einbeziehen
- **Negative Learning:** Falsche Patterns reduzieren/entfernen

### **Adaptive Features:**
- **Smart Suggestions:** Wahrscheinliche Korrekturen vorschlagen
- **Auto-Completion:** Ähnliche Werte aus Historie vorschlagen
- **Validation Rules:** Dynamische Validierungsregeln basierend auf Patterns
- **Anomaly Detection:** Ungewöhnliche Werte zur Überprüfung markieren

## 🎨 **UI/UX Anforderungen**

### **Korrektur-Interface:**
- **Split-View:** Original-Rechnung neben extrahierten Daten
- **Inline-Editing:** Direkte Bearbeitung der erkannten Werte
- **Visual Feedback:** Konfidenz-Indikatoren für jeden Wert
- **Drag & Drop:** Feld-Zuordnung durch Ziehen auf Rechnungsbereiche

### **Training-Dashboard:**
- **Fortschritts-Tracking:** Verbesserung der Erkennungsrate über Zeit
- **Lieferanten-Übersicht:** Training-Status pro Lieferant
- **Problem-Bereiche:** Häufigste Korrektur-Typen identifizieren
- **Erfolgs-Metriken:** Zeitersparnis und Genauigkeits-Verbesserungen

### **Smart-Assistance:**
- **Korrektur-Vorschläge:** Intelligente Vorschläge basierend auf Patterns
- **Ähnlichkeits-Matching:** "Ähnliche Rechnungen" anzeigen
- **Bulk-Corrections:** Mehrere ähnliche Korrekturen auf einmal
- **Learning-Feedback:** "Das System hat aus Ihrer Korrektur gelernt"

## 🧪 **Testkriterien**

### **Funktionale Tests:**
- [ ] Korrektur-Interface für alle Feld-Typen
- [ ] Pattern-Update nach Korrekturen
- [ ] Adaptive Verbesserung der Erkennungsrate
- [ ] Smart-Suggestions funktionieren korrekt
- [ ] Training-Metriken werden korrekt berechnet

### **Learning-Effectiveness Tests:**
- [ ] Erkennungsrate verbessert sich nach 5 Korrekturen um >10%
- [ ] Ähnliche Korrekturen werden automatisch angewendet
- [ ] Konfidenz-Scores reflektieren tatsächliche Genauigkeit
- [ ] Negative Learning reduziert falsche Erkennungen

### **User Experience Tests:**
- [ ] Korrektur-Zeit reduziert sich mit Training
- [ ] Interface ist intuitiv und effizient
- [ ] Feedback-Mechanismen sind hilfreich
- [ ] Training-Fortschritt ist sichtbar und motivierend

## 📊 **Datenbank Schema**

```sql
-- Korrektur-Sessions
CREATE TABLE correction_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ocr_processing_id UUID REFERENCES ocr_processing(id),
  supplier_id UUID REFERENCES suppliers(id),
  pattern_id UUID REFERENCES supplier_patterns(id),
  session_duration_seconds INTEGER,
  total_corrections INTEGER DEFAULT 0,
  user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Einzelne Feld-Korrekturen
CREATE TABLE field_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES correction_sessions(id),
  field_name VARCHAR(100) NOT NULL,
  original_value TEXT,
  corrected_value TEXT,
  original_position JSONB, -- BoundingBox
  corrected_position JSONB, -- BoundingBox falls geändert
  correction_type VARCHAR(20) NOT NULL,
  original_confidence DECIMAL(5,2),
  user_confidence VARCHAR(10),
  applied_to_pattern BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Learning-Metriken pro Pattern
CREATE TABLE pattern_learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES supplier_patterns(id),
  field_name VARCHAR(100) NOT NULL,
  total_extractions INTEGER DEFAULT 0,
  total_corrections INTEGER DEFAULT 0,
  accuracy_trend DECIMAL(5,2)[], -- Array für Trend-Tracking
  last_accuracy DECIMAL(5,2),
  improvement_rate DECIMAL(5,2),
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(pattern_id, field_name)
);

-- User-Training-Statistiken
CREATE TABLE user_training_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL, -- Falls User-System implementiert
  supplier_id UUID REFERENCES suppliers(id),
  total_training_time_seconds INTEGER DEFAULT 0,
  total_corrections INTEGER DEFAULT 0,
  average_correction_time DECIMAL(8,2),
  satisfaction_average DECIMAL(3,2),
  expertise_level VARCHAR(20) DEFAULT 'BEGINNER', -- BEGINNER, INTERMEDIATE, EXPERT
  last_training TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 **Implementierungsplan**

### **Phase 1: Korrektur-Interface**
1. Split-View Interface für Rechnung + Daten
2. Inline-Editing für alle Feld-Typen
3. Visual Confidence-Indikatoren
4. Basis-Korrektur-Tracking

### **Phase 2: Learning-Engine**
1. Pattern-Update-Algorithmus
2. Korrektur-Integration in ML-Pipeline
3. Konfidenz-Score-Anpassung
4. Negative Learning implementieren

### **Phase 3: Smart-Assistance**
1. Korrektur-Vorschläge basierend auf Historie
2. Ähnlichkeits-Matching für Rechnungen
3. Auto-Completion für häufige Werte
4. Bulk-Correction-Features

### **Phase 4: Analytics & Optimization**
1. Training-Dashboard mit Metriken
2. Performance-Tracking und Reporting
3. A/B-Testing für Learning-Algorithmen
4. Advanced ML-Features (Transfer Learning)

## 📈 **Definition of Done**
- [ ] Korrektur-Interface ist vollständig funktional
- [ ] Learning-Algorithmus verbessert Patterns automatisch
- [ ] Smart-Assistance-Features implementiert
- [ ] Training-Metriken und Dashboard verfügbar
- [ ] Performance-Ziele erreicht (>10% Verbesserung nach 5 Korrekturen)
- [ ] User Experience Tests bestanden
- [ ] Dokumentation für Training-Best-Practices erstellt

## 🎯 **Erfolgskriterien**
- **Lerngeschwindigkeit:** Erkennungsrate verbessert sich messbar nach jeder Korrektur
- **User Efficiency:** Korrektur-Zeit reduziert sich mit jedem Training
- **System Intelligence:** Smart-Suggestions sind in >70% der Fälle hilfreich
- **User Satisfaction:** Durchschnittliche Bewertung >4/5 Sterne
