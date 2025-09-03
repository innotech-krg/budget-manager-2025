# Story 2.5: Manuelle Rechnungsposition-Erstellung

## ✅ **USER-ENTSCHEIDUNGEN**
- **Zugang:** Button in Projekt-Detail-Seite (nicht separate Seite)
- **Markierung:** Manuelle Positionen sollen visuell unterscheidbar und getaggt werden
- **Integration:** Vollständige Parität zu OCR-Positionen mit speziellem Audit-Trail

## 📋 **Story Beschreibung**
Als Budget-Manager möchte ich Rechnungspositionen manuell erstellen und Projekten zuordnen können, um auch nicht-digitale Rechnungen oder spezielle Kostenpositionen korrekt im Budget-System zu erfassen.

## 🎯 **Akzeptanzkriterien**

### **Als Budget-Manager kann ich:**
- [ ] Neue Rechnungspositionen manuell erstellen ohne OCR-Upload
- [ ] Alle erforderlichen Felder (Beschreibung, Betrag, Datum, etc.) eingeben
- [ ] Positionen direkt einem Projekt zuordnen
- [ ] Manuelle Positionen klar von automatisch erkannten unterscheiden
- [ ] Belege/Dokumente zu manuellen Positionen hochladen (optional)

### **Das System soll:**
- [ ] Manuelle Positionen eindeutig als solche markieren
- [ ] Dieselben Validierungsregeln wie für automatische Positionen anwenden
- [ ] Budget-Berechnungen korrekt aktualisieren
- [ ] Audit-Trail für manuelle Eingaben führen
- [ ] Export-Funktionen für manuelle und automatische Positionen bereitstellen

## 🔧 **Technische Anforderungen**

### **Erweiterte Datenstruktur:**
```typescript
interface ManualInvoicePosition extends InvoicePosition {
  assignmentType: 'MANUAL'
  manualEntry: {
    createdBy: string
    reason: string
    sourceDocument?: string // Optional: Pfad zu hochgeladenem Beleg
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
    verifiedBy?: string
    verifiedAt?: Date
    notes?: string
  }
  validationOverrides?: {
    budgetOverride: boolean // Erlaubt Budget-Überschreitung
    dateOverride: boolean // Erlaubt Datum außerhalb Projektlaufzeit
    amountOverride: boolean // Erlaubt ungewöhnlich hohe Beträge
  }
}

interface ManualEntryTemplate {
  id: string
  name: string
  description: string
  defaultCategory: string
  defaultCostCenter: string
  requiredFields: string[]
  validationRules: ValidationRule[]
  usageCount: number
  lastUsed: Date
}
```

### **Validierung & Geschäftslogik:**
- **Standard-Validierung:** Alle normalen Geschäftsregeln anwenden
- **Override-Mechanismen:** Begründete Ausnahmen ermöglichen
- **Approval-Workflow:** Manuelle Positionen können Genehmigung erfordern
- **Duplicate-Detection:** Warnung vor möglichen Duplikaten

### **Integration mit bestehendem System:**
- **Budget-Impact:** Identische Budget-Berechnung wie automatische Positionen
- **Reporting:** Manuelle Positionen in allen Reports enthalten
- **Export:** Klare Kennzeichnung in Exporten
- **Search & Filter:** Durchsuchbar und filterbar wie automatische Positionen

## 🎨 **UI/UX Anforderungen**

### **Erstellungs-Interface:**
- **Formular-basiert:** Strukturiertes Eingabeformular für alle Felder
- **Smart Defaults:** Intelligente Vorschläge basierend auf Projekt/Historie
- **Template-System:** Wiederverwendbare Vorlagen für häufige Positionen
- **Validation Feedback:** Live-Validierung mit hilfreichen Fehlermeldungen

### **Beleg-Upload (Optional):**
- **Drag & Drop:** Einfacher Upload von Belegen/Fotos
- **Preview:** Vorschau der hochgeladenen Dokumente
- **Multiple Files:** Mehrere Belege pro Position möglich
- **File Management:** Organisierte Verwaltung der Belege

### **Unterscheidung in Listen:**
- **Visual Indicators:** Klare Icons/Badges für manuelle Positionen
- **Color Coding:** Farbliche Unterscheidung in Listen und Tabellen
- **Tooltips:** Zusätzliche Informationen bei Hover
- **Filter Options:** Separate Filter für manuelle/automatische Positionen

### **Approval-Workflow (falls aktiviert):**
- **Status-Anzeige:** Aktueller Genehmigungsstatus sichtbar
- **Approval-Interface:** Einfache Genehmigung/Ablehnung für Approver
- **Notification-System:** Benachrichtigungen bei Status-Änderungen
- **Batch-Approval:** Multiple Positionen gleichzeitig genehmigen

## 🧪 **Testkriterien**

### **Funktionale Tests:**
- [ ] Manuelle Position-Erstellung mit allen Feldern
- [ ] Validierung funktioniert korrekt
- [ ] Budget-Integration arbeitet identisch zu automatischen Positionen
- [ ] Template-System spart Zeit und reduziert Fehler
- [ ] Beleg-Upload und -Verwaltung funktioniert

### **Integration Tests:**
- [ ] Manuelle Positionen erscheinen korrekt in Projekt-Listen
- [ ] Export-Funktionen enthalten manuelle Positionen
- [ ] Reporting berücksichtigt alle Position-Typen
- [ ] Search & Filter funktioniert für alle Positionen

### **User Experience Tests:**
- [ ] Erstellungs-Prozess ist intuitiv und effizient
- [ ] Unterscheidung zwischen manuell/automatisch ist klar
- [ ] Template-System wird von Usern angenommen
- [ ] Approval-Workflow (falls aktiviert) ist benutzerfreundlich

## 📊 **Datenbank Schema Erweiterungen**

```sql
-- Erweiterte invoice_positions Tabelle
ALTER TABLE invoice_positions 
ADD COLUMN manual_entry_data JSONB,
ADD COLUMN verification_status VARCHAR(20) DEFAULT 'VERIFIED',
ADD COLUMN verified_by VARCHAR(100),
ADD COLUMN verified_at TIMESTAMP,
ADD COLUMN source_documents TEXT[], -- Array von Dateipfaden
ADD COLUMN validation_overrides JSONB,
ADD COLUMN entry_notes TEXT;

-- Templates für manuelle Eingaben
CREATE TABLE manual_entry_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL, -- Standardwerte und Konfiguration
  category VARCHAR(100),
  cost_center VARCHAR(50),
  required_fields TEXT[] NOT NULL,
  validation_rules JSONB,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Approval-Workflow (optional)
CREATE TABLE position_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES invoice_positions(id),
  approver_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'PENDING', 'APPROVED', 'REJECTED'
  decision_reason TEXT,
  decided_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Beleg-Dateien
CREATE TABLE position_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES invoice_positions(id),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  uploaded_by VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Template-Nutzungsstatistiken
CREATE TABLE template_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES manual_entry_templates(id),
  used_by VARCHAR(100) NOT NULL,
  project_id UUID REFERENCES projects(id),
  position_id UUID REFERENCES invoice_positions(id),
  used_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 **Implementierungsplan**

### **Phase 1: Basis-Funktionalität**
1. Erweiterte Datenmodelle für manuelle Positionen
2. Erstellungs-Formular mit Validierung
3. Integration in bestehende Position-Listen
4. Budget-Impact-Berechnung

### **Phase 2: Template-System**
1. Template-Erstellung und -Verwaltung
2. Smart Defaults basierend auf Templates
3. Template-Nutzungsstatistiken
4. Template-Sharing zwischen Usern

### **Phase 3: Beleg-Management**
1. File-Upload-System für Belege
2. Document-Viewer für verschiedene Dateitypen
3. File-Management und -Organisation
4. Integration in Position-Detail-View

### **Phase 4: Advanced Features**
1. Approval-Workflow (optional)
2. Bulk-Creation für ähnliche Positionen
3. Import-Funktionen (CSV, Excel)
4. Advanced Analytics für manuelle vs. automatische Positionen

## 📈 **Definition of Done**
- [ ] Manuelle Position-Erstellung ist vollständig funktional
- [ ] Template-System reduziert Eingabezeit messbar
- [ ] Beleg-Upload und -Verwaltung funktioniert
- [ ] Manuelle Positionen sind klar von automatischen unterscheidbar
- [ ] Budget-Integration arbeitet identisch zu automatischen Positionen
- [ ] Validation und Geschäftslogik sind konsistent
- [ ] Approval-Workflow (falls aktiviert) ist implementiert
- [ ] Alle Tests bestehen (Unit, Integration, UX)

## 🎯 **Besondere Anforderungen**
- **Vollständige Parität:** Manuelle Positionen müssen alle Eigenschaften automatischer Positionen haben
- **Audit-Compliance:** Vollständige Nachverfolgbarkeit manueller Eingaben
- **User Efficiency:** Template-System muss Eingabezeit signifikant reduzieren
- **Data Quality:** Validierung muss Datenqualität sicherstellen trotz manueller Eingabe

## 💡 **Best Practices**
- **Template-Bibliothek:** Aufbau einer umfassenden Template-Sammlung
- **Validation Rules:** Strenge aber flexible Validierungsregeln
- **User Training:** Schulung für effiziente manuelle Eingabe
- **Quality Assurance:** Regelmäßige Überprüfung manueller Positionen
