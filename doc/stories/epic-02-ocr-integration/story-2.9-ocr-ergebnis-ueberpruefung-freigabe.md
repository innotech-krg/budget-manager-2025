# Story 2.9: OCR-Ergebnis-Überprüfung und finale Freigabe

## 📋 **Story Beschreibung**
Als Budget-Manager möchte ich nach der OCR-Verarbeitung alle extrahierten Daten in einer übersichtlichen Oberfläche überprüfen, korrigieren und final freigeben können, bevor die Rechnungspositionen den Projektbudgets zugeordnet und in der Datenbank gespeichert werden.

## 🎯 **Akzeptanzkriterien**

### **Als Budget-Manager kann ich:**
- [ ] Alle extrahierten Rechnungsdaten in einer strukturierten Übersicht einsehen
- [ ] Empfänger-Daten (Firma) anzeigen und bei Bedarf korrigieren
- [ ] Lieferanten-Daten bestätigen oder aus Dropdown auswählen/neu anlegen
- [ ] Jede Rechnungsposition einzeln überprüfen und korrigieren
- [ ] Projekt-Zuordnungen für jede Position bestätigen oder ändern
- [ ] Alle Rechnungsdaten (Nummer, Datum, Summen) validieren
- [ ] Eine finale Freigabe erteilen, die alle Daten in die Datenbank übernimmt

### **Das System soll:**
- [ ] Alle OCR-extrahierten Daten strukturiert anzeigen
- [ ] KI-Konfidenz-Scores für jeden Wert anzeigen
- [ ] Automatische Projekt-Zuordnungsvorschläge machen
- [ ] Lieferanten-Dropdown mit Suchfunktion bereitstellen
- [ ] Budget-Impact in Echtzeit berechnen und anzeigen
- [ ] Erst nach finaler Freigabe Projektbudgets aktualisieren
- [ ] Vollständigen Audit-Trail für alle Änderungen führen

## 🔧 **Technische Anforderungen**

### **OCR-Überprüfungs-Interface:**
```typescript
interface OCRReviewSession {
  id: string
  ocrProcessingId: string
  extractedData: ExtractedInvoiceData
  reviewStatus: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'
  corrections: ReviewCorrection[]
  projectAssignments: PositionProjectAssignment[]
  supplierConfirmation: SupplierConfirmation
  finalApproval: FinalApproval
  createdAt: Date
  reviewedAt?: Date
  approvedAt?: Date
}

interface ExtractedInvoiceData {
  recipient: CompanyData
  supplier: SupplierData
  invoice: InvoiceMetadata
  positions: InvoicePosition[]
  totals: InvoiceTotals
  confidence: ConfidenceScores
}

interface ReviewCorrection {
  fieldPath: string // z.B. "supplier.name" oder "positions[0].description"
  originalValue: any
  correctedValue: any
  correctionReason: string
  confidence: number
  reviewedBy: string
  reviewedAt: Date
}

interface PositionProjectAssignment {
  positionId: string
  suggestedProjectId?: string
  confirmedProjectId?: string
  confidence: number
  assignmentMethod: 'AI_SUGGESTION' | 'MANUAL_SELECTION' | 'HISTORICAL_MATCH'
  budgetImpact: number
  confirmed: boolean
}

interface SupplierConfirmation {
  extractedSupplier: SupplierData
  confirmedSupplierId?: string
  isNewSupplier: boolean
  requiresApproval: boolean
  confidence: number
  confirmed: boolean
}

interface FinalApproval {
  approved: boolean
  approvedBy: string
  approvedAt: Date
  totalBudgetImpact: number
  affectedProjects: string[]
  comments?: string
}
```

### **Validierungs-Engine:**
- **Daten-Konsistenz:** Summen-Validierung, Datum-Plausibilität
- **Budget-Prüfung:** Überschreitungs-Warnungen, Verfügbarkeits-Check
- **Duplikats-Erkennung:** Prüfung auf bereits vorhandene Rechnungen
- **Pflichtfeld-Validierung:** Alle erforderlichen Felder ausgefüllt

### **Freigabe-Workflow:**
- **Stufe 1:** Daten-Überprüfung und Korrektur
- **Stufe 2:** Lieferanten-Bestätigung
- **Stufe 3:** Projekt-Zuordnungen bestätigen
- **Stufe 4:** Budget-Impact reviewen
- **Stufe 5:** Finale Freigabe erteilen

## 🎨 **UI/UX Anforderungen**

### **Haupt-Überprüfungs-Dashboard:**
- **4-Spalten-Layout:** 
  1. Original-PDF (mit Highlighting)
  2. Extrahierte Daten (editierbar)
  3. Projekt-Zuordnungen
  4. Budget-Impact-Übersicht
- **Progress-Indicator:** Fortschritt durch Überprüfungs-Schritte
- **Konfidenz-Ampel:** Rot/Gelb/Grün für jeden extrahierten Wert
- **Quick-Actions:** Häufige Korrekturen mit einem Klick

### **Empfänger-Sektion:**
```
📋 EMPFÄNGER (Rechnungsempfänger)
┌─────────────────────────────────────┐
│ Firma: [Innotech GmbH        ] ✅  │
│ Adresse: [Musterstraße 123   ] ✅  │
│ PLZ/Ort: [1010 Wien          ] ✅  │
│ UID: [ATU12345678             ] ✅  │
└─────────────────────────────────────┘
```

### **Lieferanten-Sektion:**
```
🏢 LIEFERANT (Rechnungssteller)
┌─────────────────────────────────────┐
│ Name: [DEFINE® GmbH           ] ⚠️  │
│ [📝 Bestätigen] [🔍 Suchen] [➕ Neu] │
│                                     │
│ Dropdown: [DEFINE® - Design & Mar...] │
│          [DEFINE® GmbH              ] │
│          [+ Neuen Lieferant anlegen ] │
│                                     │
│ Status: ⚠️ Bestätigung erforderlich   │
└─────────────────────────────────────┘
```

### **Rechnungspositionen-Sektion:**
```
📄 RECHNUNGSPOSITIONEN
┌─────────────────────────────────────────────────────────────┐
│ Pos 1: Recherche und Abstimmung        107,00 € ✅         │
│ └─ Projekt: [🎯 Website Relaunch  ▼] [✅ Bestätigen]      │
│                                                             │
│ Pos 2: Diverse Programmierungen        579,50 € ✅         │
│ └─ Projekt: [🎯 Backend API       ▼] [✅ Bestätigen]      │
│                                                             │
│ Pos 3: TYPO3 und Content Support       347,75 € ⚠️         │
│ └─ Projekt: [❓ Bitte wählen...   ▼] [⚠️ Zuordnung fehlt] │
└─────────────────────────────────────────────────────────────┘
```

### **Budget-Impact-Sektion:**
```
💰 BUDGET-AUSWIRKUNG
┌─────────────────────────────────────┐
│ Gesamtsumme: 1.034,25 €             │
│                                     │
│ 🎯 Website Relaunch:   -107,00 €   │
│    Budget: 5.000 € → 4.893 € (98%) │
│                                     │
│ 🎯 Backend API:        -579,50 €   │
│    Budget: 8.000 € → 7.420 € (93%) │
│                                     │
│ ❓ Nicht zugeordnet:   347,75 €    │
│                                     │
│ [🔍 Budget-Details anzeigen]        │
└─────────────────────────────────────┘
```

### **Finale Freigabe-Sektion:**
```
✅ FINALE FREIGABE
┌─────────────────────────────────────┐
│ ✅ Empfänger bestätigt              │
│ ✅ Lieferant bestätigt              │
│ ⚠️ 1 Position ohne Projekt-Zuordnung │
│ ✅ Budget-Impact geprüft            │
│                                     │
│ [❌ Noch nicht bereit zur Freigabe] │
│                                     │
│ Kommentar (optional):               │
│ [________________________]         │
│                                     │
│ [🚀 RECHNUNG FREIGEBEN UND BUCHEN] │
└─────────────────────────────────────┘
```

## 🧪 **Testkriterien**

### **Funktionale Tests:**
- [ ] Alle extrahierten Daten werden korrekt angezeigt
- [ ] Korrekturen werden in Echtzeit gespeichert
- [ ] Lieferanten-Dropdown funktioniert mit Suche
- [ ] Projekt-Zuordnungen werden korrekt vorgeschlagen
- [ ] Budget-Impact wird korrekt berechnet
- [ ] Finale Freigabe funktioniert nur bei vollständigen Daten

### **Validierungs-Tests:**
- [ ] Summen-Validierung erkennt Inkonsistenzen
- [ ] Budget-Überschreitungs-Warnungen funktionieren
- [ ] Duplikats-Erkennung verhindert doppelte Buchungen
- [ ] Pflichtfeld-Validierung blockiert unvollständige Freigaben

### **Integration Tests:**
- [ ] OCR-Daten werden korrekt übernommen
- [ ] Projekt-Budget-Updates erfolgen erst nach Freigabe
- [ ] Audit-Trail wird vollständig geführt
- [ ] WebSocket-Updates funktionieren in Echtzeit

## 📊 **Datenbank Schema**

```sql
-- OCR-Überprüfungs-Sessions
CREATE TABLE ocr_review_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ocr_processing_id UUID REFERENCES ocr_processing(id),
  review_status VARCHAR(20) DEFAULT 'PENDING',
  extracted_data JSONB NOT NULL,
  corrections JSONB DEFAULT '[]',
  project_assignments JSONB DEFAULT '[]',
  supplier_confirmation JSONB,
  final_approval JSONB,
  total_budget_impact DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  approved_at TIMESTAMP,
  reviewed_by VARCHAR(100),
  approved_by VARCHAR(100)
);

-- Review-Korrekturen (detailliert)
CREATE TABLE review_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_session_id UUID REFERENCES ocr_review_sessions(id),
  field_path VARCHAR(200) NOT NULL,
  original_value TEXT,
  corrected_value TEXT,
  correction_reason VARCHAR(500),
  confidence DECIMAL(5,2),
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP DEFAULT NOW()
);

-- Position-Projekt-Zuordnungen
CREATE TABLE position_project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_session_id UUID REFERENCES ocr_review_sessions(id),
  position_index INTEGER NOT NULL,
  position_description TEXT,
  suggested_project_id UUID REFERENCES projects(id),
  confirmed_project_id UUID REFERENCES projects(id),
  assignment_confidence DECIMAL(5,2),
  assignment_method VARCHAR(30),
  budget_impact DECIMAL(12,2),
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP,
  confirmed_by VARCHAR(100)
);

-- Lieferanten-Bestätigungen
CREATE TABLE supplier_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_session_id UUID REFERENCES ocr_review_sessions(id),
  extracted_supplier_data JSONB,
  confirmed_supplier_id UUID REFERENCES suppliers(id),
  is_new_supplier BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  confidence DECIMAL(5,2),
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP,
  confirmed_by VARCHAR(100)
);

-- Finale Freigaben
CREATE TABLE final_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_session_id UUID REFERENCES ocr_review_sessions(id),
  approved BOOLEAN DEFAULT false,
  total_budget_impact DECIMAL(12,2),
  affected_projects UUID[],
  approval_comments TEXT,
  approved_by VARCHAR(100),
  approved_at TIMESTAMP DEFAULT NOW(),
  budget_updated_at TIMESTAMP
);
```

## 🚀 **Implementierungsplan**

### **Phase 1: Basis-Überprüfungs-Interface**
1. OCR-Daten-Anzeige-Komponente
2. Basis-Korrektur-Funktionalität
3. Einfache Validierung
4. Speichern von Änderungen

### **Phase 2: Erweiterte Features**
1. Lieferanten-Dropdown mit Suche
2. Projekt-Zuordnungs-Interface
3. Budget-Impact-Berechnung
4. Konfidenz-Indikatoren

### **Phase 3: Freigabe-Workflow**
1. Mehrstufiger Freigabe-Prozess
2. Validierungs-Engine
3. Finale Freigabe-Funktionalität
4. Budget-Update-Integration

### **Phase 4: Optimierung & Polish**
1. Performance-Optimierung
2. UX-Verbesserungen
3. Erweiterte Validierungen
4. Audit-Trail-Vervollständigung

## 📈 **Definition of Done**
- [ ] Vollständiges OCR-Überprüfungs-Interface implementiert
- [ ] Alle Korrektur-Funktionen arbeiten korrekt
- [ ] Lieferanten-Bestätigung mit Dropdown funktioniert
- [ ] Projekt-Zuordnungen mit KI-Vorschlägen implementiert
- [ ] Budget-Impact wird korrekt berechnet und angezeigt
- [ ] Finale Freigabe funktioniert und aktualisiert Budgets
- [ ] Vollständiger Audit-Trail implementiert
- [ ] Alle Tests bestehen (Unit, Integration, E2E)
- [ ] Performance-Ziele erreicht (<2s Ladezeit)

## 🎯 **Erfolgskriterien**
- **User Efficiency:** 80% weniger Zeit für Rechnungsverarbeitung
- **Datenqualität:** >95% korrekte Daten nach Überprüfung
- **User Experience:** Intuitive Bedienung ohne Schulung
- **System Reliability:** 100% korrekte Budget-Updates nach Freigabe

## 🔗 **Abhängigkeiten**
- **Story 2.7**: OCR KI-Refactoring (Datenextraktion)
- **Story 2.8**: KI-basierte Projekt-Zuordnung (Vorschläge)
- **Epic 1**: Budget-Management (Budget-Update-Funktionen)
- **Epic 8**: Admin-Management (Lieferanten-Verwaltung)

## ⚠️ **Besondere Anforderungen**
- **Daten-Integrität:** Keine Budget-Updates ohne finale Freigabe
- **User Experience:** Intuitive, selbsterklärende Oberfläche
- **Performance:** Schnelle Anzeige auch bei großen Rechnungen
- **Audit-Compliance:** Vollständige Nachverfolgbarkeit aller Änderungen
