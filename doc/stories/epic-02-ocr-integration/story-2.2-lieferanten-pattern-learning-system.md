# Story 2.2: Lieferanten-spezifisches Pattern Learning System

## 📋 **Story Beschreibung**
Als Budget-Manager möchte ich ein intelligentes Lieferanten-Pattern-Learning-System, das beim ersten Upload eines neuen Lieferanten mit mir zusammen die Rechnungsstruktur erlernt und diese Patterns für zukünftige Rechnungen desselben Lieferanten automatisch anwendet.

## 🎯 **Akzeptanzkriterien**

### **Als Budget-Manager kann ich:**
- [ ] Beim ersten Upload eines unbekannten Lieferanten ein interaktives Training starten
- [ ] Rechnungsfelder (Rechnungsnummer, Datum, Betrag, Positionen) manuell markieren
- [ ] Pattern-Templates für verschiedene Lieferanten verwalten
- [ ] Automatische Erkennung bei wiederholten Uploads desselben Lieferanten
- [ ] Pattern-Qualität bewerten und nachtrainieren

### **Das System soll:**
- [ ] Lieferanten automatisch anhand von Logo/Name/Adresse erkennen
- [ ] Gelernte Patterns persistent speichern
- [ ] Pattern-Konfidenz bewerten und verbessern
- [ ] Ähnliche Lieferanten-Patterns vorschlagen
- [ ] Pattern-Versionierung für Verbesserungen

## 🔧 **Technische Anforderungen**

### **Lieferanten-Erkennung:**
```typescript
interface SupplierDetection {
  id: string
  name: string
  identifiers: {
    logo?: string // Base64 oder Hash
    companyName: string[]
    address: string[]
    taxId?: string
    phoneNumber?: string
  }
  confidence: number
}

interface SupplierPattern {
  id: string
  supplierId: string
  version: number
  fields: {
    invoiceNumber: FieldPattern
    invoiceDate: FieldPattern
    totalAmount: FieldPattern
    lineItems: LineItemPattern[]
    taxAmount?: FieldPattern
  }
  accuracy: number
  trainingSamples: number
  lastUpdated: Date
}

interface FieldPattern {
  label: string
  position: BoundingBox
  regex?: string
  format: 'text' | 'number' | 'date' | 'currency'
  required: boolean
  confidence: number
}
```

### **Training-Workflow:**
1. **OCR-Verarbeitung:** Vollständiger Text-Extraktion
2. **Lieferanten-Erkennung:** Automatische Identifikation
3. **Pattern-Matching:** Vorhandene Patterns anwenden
4. **User-Training:** Bei neuen/unbekannten Lieferanten
5. **Pattern-Speicherung:** Gelerntes Pattern persistieren
6. **Kontinuierliches Learning:** Pattern-Verbesserung

### **Machine Learning Komponenten:**
- **Text-Klassifikation:** Feld-Typ-Erkennung
- **Layout-Analyse:** Position-basierte Pattern-Erkennung
- **Ähnlichkeits-Matching:** Lieferanten-Gruppierung
- **Konfidenz-Scoring:** Pattern-Qualitätsbewertung

## 🎨 **UI/UX Anforderungen**

### **Training-Interface:**
- **Interaktive Rechnungsansicht:** Klickbare Bereiche für Feld-Markierung
- **Feld-Zuordnung:** Drag & Drop für Feld-Mapping
- **Pattern-Vorschau:** Live-Vorschau der erkannten Struktur
- **Validierung:** Sofortige Feedback bei Fehlern

### **Lieferanten-Management:**
- **Lieferanten-Liste:** Übersicht aller trainierten Lieferanten
- **Pattern-Details:** Detailansicht der gelernten Strukturen
- **Training-Historie:** Verlauf der Trainings-Sessions
- **Pattern-Performance:** Genauigkeits-Statistiken

### **Auto-Processing-Feedback:**
- **Erkennungs-Konfidenz:** Visuelle Konfidenz-Indikatoren
- **Korrektur-Interface:** Schnelle Korrektur bei Fehlern
- **Pattern-Update:** Option zur Pattern-Verbesserung
- **Feedback-Loop:** User-Feedback für kontinuierliches Learning

## 🧪 **Testkriterien**

### **Funktionale Tests:**
- [ ] Lieferanten-Erkennung bei verschiedenen Rechnungsformaten
- [ ] Pattern-Training mit User-Interaktion
- [ ] Automatische Anwendung gelernter Patterns
- [ ] Pattern-Versionierung und -Updates
- [ ] Ähnlichkeits-Matching zwischen Lieferanten

### **Machine Learning Tests:**
- [ ] Pattern-Genauigkeit >90% nach 3 Trainings
- [ ] Lieferanten-Erkennung >95% bei bekannten Lieferanten
- [ ] Feld-Extraktion-Genauigkeit >85% bei ersten Versuchen
- [ ] Performance-Tests mit großen Pattern-Datenbanken

## 📊 **Datenbank Schema**

```sql
-- Lieferanten-Stammdaten
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255) NOT NULL, -- Für Matching
  tax_id VARCHAR(50),
  address TEXT,
  logo_hash VARCHAR(64), -- Für Logo-Erkennung
  identifiers JSONB NOT NULL, -- Erkennungsmerkmale
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pattern-Templates pro Lieferant
CREATE TABLE supplier_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id),
  version INTEGER NOT NULL DEFAULT 1,
  pattern_data JSONB NOT NULL, -- Feld-Positionen und -Regeln
  accuracy_score DECIMAL(5,2) DEFAULT 0.0,
  training_samples INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(supplier_id, version)
);

-- Training-Sessions
CREATE TABLE pattern_training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id),
  pattern_id UUID REFERENCES supplier_patterns(id),
  ocr_processing_id UUID REFERENCES ocr_processing(id),
  user_corrections JSONB, -- User-Korrekturen
  training_data JSONB NOT NULL, -- Markierte Felder
  session_type VARCHAR(20) NOT NULL, -- 'INITIAL', 'REFINEMENT'
  accuracy_before DECIMAL(5,2),
  accuracy_after DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pattern-Performance-Tracking
CREATE TABLE pattern_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES supplier_patterns(id),
  field_name VARCHAR(100) NOT NULL,
  extraction_attempts INTEGER DEFAULT 0,
  successful_extractions INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) GENERATED ALWAYS AS 
    (CASE WHEN extraction_attempts > 0 
     THEN (successful_extractions::DECIMAL / extraction_attempts) * 100 
     ELSE 0 END) STORED,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

## 🚀 **Implementierungsplan**

### **Phase 1: Lieferanten-Erkennung**
1. Lieferanten-Identifikation-Algorithmus
2. Logo- und Text-basierte Erkennung
3. Ähnlichkeits-Matching implementieren
4. Basis-Datenstrukturen

### **Phase 2: Pattern-Learning-Engine**
1. Interaktives Training-Interface
2. Pattern-Extraktion und -Speicherung
3. ML-Modell für Feld-Klassifikation
4. Konfidenz-Scoring-System

### **Phase 3: Automatische Anwendung**
1. Pattern-Matching-Engine
2. Automatische Feld-Extraktion
3. Konfidenz-basierte Validierung
4. Feedback-Loop für Verbesserungen

### **Phase 4: Optimierung & Skalierung**
1. Performance-Optimierung für große Pattern-DBs
2. Advanced ML-Features (Transfer Learning)
3. Pattern-Clustering für ähnliche Lieferanten
4. Batch-Processing für Pattern-Updates

## 📈 **Definition of Done**
- [ ] Lieferanten-Erkennung funktioniert zuverlässig
- [ ] Interaktives Training-Interface implementiert
- [ ] Pattern-Learning und -Anwendung funktional
- [ ] Kontinuierliches Learning etabliert
- [ ] Performance-Ziele erreicht (>90% Genauigkeit)
- [ ] Umfassende Tests bestehen
- [ ] Dokumentation und Schulungsmaterial erstellt

## 🎯 **Besondere Fokus-Bereiche**
⚠️ **KRITISCH:** Viel Energie in Pattern-Learning und Lieferanten-Training investieren - dies ist der Schlüssel zum Erfolg des gesamten OCR-Systems!
