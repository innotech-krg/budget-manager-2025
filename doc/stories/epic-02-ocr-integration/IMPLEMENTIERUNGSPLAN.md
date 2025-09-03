# 🚀 Epic 2: Implementierungsplan für offene Stories

**Stand:** 30. August 2025  
**Epic Status:** 67% abgeschlossen (6 von 9 Stories)  
**Verbleibende Arbeit:** ~12-15 Entwicklungstage

## 📊 **Aktuelle Situation**

### **✅ ABGESCHLOSSEN (6 Stories)**
- ✅ **Story 2.7** - OCR KI-Refactoring (Ersetzt Story 2.1)
- ✅ **Story 2.8** - KI-basierte Projekt-Zuordnung  
- ✅ **Story 2.9** - OCR-Ergebnis-Überprüfung und Freigabe
- ✅ **Story 2.2** - Lieferanten-Pattern-Learning (KI-basiert)
- ✅ **Story 2.6** - Budget-Integration und Automatisierung
- ✅ **Story 2.1** - Dual OCR Engine (durch 2.7 ersetzt)

### **🔄 TEILWEISE ABGESCHLOSSEN (1 Story)**
- 🔄 **Story 2.3** - Adaptive Rechnungsverarbeitung (Grundlagen vorhanden)

### **❌ OFFEN (5 Stories)**
- ❌ **Story 2.4** - Projekt-Rechnungsposition-Management
- ❌ **Story 2.5** - Manuelle Rechnungsposition-Erstellung  
- ❌ **Story 2.10** - Original-Rechnungen Speicherung (NEU)
- ❌ **Story 2.11** - Vollständiger Testplan (NEU)
- 🔄 **Story 2.3** - Adaptive Rechnungsverarbeitung (Vervollständigung)

---

## 🎯 **Implementierungsreihenfolge & Zeitschätzung**

### **🏆 PRIORITÄT 1: Story 2.4 - Projekt-Rechnungsposition-Management**
**⏱️ Geschätzte Zeit:** 3-4 Tage  
**🎯 Ziel:** Projekt-Detail-Seite mit Rechnungspositions-Tabelle erweitern

#### **Was zu implementieren ist:**
```typescript
// 1. Backend API erweitern
GET /api/projects/:id/invoice-positions
- Alle zugeordneten Rechnungspositionen laden
- Mit Original-Rechnung verknüpfen
- Budget-Vor/Nach-Vergleich berechnen

// 2. Frontend Komponente erstellen
<InvoicePositionsTable>
- Tabelle mit allen Positionen
- Verweis auf Original-PDF
- Budget-Impact-Anzeige
- Filter- und Sortierfunktionen
```

#### **Konkrete Aufgaben:**
- [ ] **Tag 1:** Backend API `/api/projects/:id/invoice-positions` implementieren
- [ ] **Tag 2:** Frontend `InvoicePositionsTable` Komponente erstellen
- [ ] **Tag 3:** Integration in Projekt-Detail-Seite + Styling
- [ ] **Tag 4:** Testing und Bug-Fixes

---

### **🏆 PRIORITÄT 2: Story 2.10 - Original-Rechnungen Speicherung**
**⏱️ Geschätzte Zeit:** 4-5 Tage  
**🎯 Ziel:** Sichere Speicherung und Verwaltung von Original-PDFs

#### **Was zu implementieren ist:**
```sql
-- 1. Datenbank-Schema erweitern
CREATE TABLE invoice_documents (
  id UUID PRIMARY KEY,
  ocr_processing_id UUID REFERENCES ocr_processing(id),
  file_path TEXT NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  -- ... weitere Felder
);

-- 2. Backend Service
class DocumentStorageService {
  async storeDocument(file, metadata)
  async retrieveDocument(documentId)
  async generateDownloadUrl(documentId)
}
```

#### **Konkrete Aufgaben:**
- [ ] **Tag 1:** Datenbank-Schema erweitern und Migration erstellen
- [ ] **Tag 2:** DocumentStorageService implementieren
- [ ] **Tag 3:** OCR-Upload-Prozess um Dokumentspeicherung erweitern
- [ ] **Tag 4:** Download-Links in UI integrieren
- [ ] **Tag 5:** Admin-Bereich für Dokument-Verwaltung

---

### **🏆 PRIORITÄT 3: Story 2.5 - Manuelle Rechnungsposition-Erstellung**
**⏱️ Geschätzte Zeit:** 3-4 Tage  
**🎯 Ziel:** UI für manuelle Eingabe von Rechnungspositionen

#### **Was zu implementieren ist:**
```typescript
// 1. Backend API
POST /api/invoice-positions/manual
- Manuelle Position erstellen
- Projekt zuordnen
- Budget aktualisieren

// 2. Frontend Komponente
<ManualInvoicePositionForm>
- Formular für alle Rechnungsdaten
- Projekt-Auswahl
- Budget-Impact-Vorschau
- Validation
```

#### **Konkrete Aufgaben:**
- [ ] **Tag 1:** Backend API für manuelle Positionen implementieren
- [ ] **Tag 2:** Frontend Formular-Komponente erstellen
- [ ] **Tag 3:** Integration in bestehende UI + Validation
- [ ] **Tag 4:** Testing und UX-Optimierung

---

### **🏆 PRIORITÄT 4: Story 2.3 - Adaptive Rechnungsverarbeitung (Vervollständigung)**
**⏱️ Geschätzte Zeit:** 2-3 Tage  
**🎯 Ziel:** Kontinuierliches Learning aus User-Korrekturen

#### **Was zu implementieren ist:**
```typescript
// 1. Learning-Service erweitern
class AdaptiveLearningService {
  async learnFromCorrections(corrections)
  async updateAIPrompts(supplierPatterns)
  async generateImprovedPrompts()
}

// 2. Feedback-Loop implementieren
- User-Korrekturen sammeln
- Pattern-Analyse durchführen
- KI-Prompts anpassen
```

#### **Konkrete Aufgaben:**
- [ ] **Tag 1:** Learning-Service für User-Korrekturen implementieren
- [ ] **Tag 2:** KI-Prompt-Anpassung basierend auf Feedback
- [ ] **Tag 3:** Testing und Optimierung

---

### **🏆 PRIORITÄT 5: Story 2.11 - Vollständiger Testplan**
**⏱️ Geschätzte Zeit:** 5-6 Tage  
**🎯 Ziel:** >95% Test-Abdeckung für Epic 2

#### **Was zu implementieren ist:**
```typescript
// 1. Unit Tests
- OCR-Services (100% Coverage)
- AI-Services (100% Coverage)
- Controllers (100% Coverage)

// 2. Integration Tests
- API-Endpoints (100% Coverage)
- Database-Integration
- OCR-Workflow End-to-End

// 3. E2E Tests
- Critical User Journeys
- Error Scenarios
- Performance Tests
```

#### **Konkrete Aufgaben:**
- [ ] **Tag 1-2:** Unit Tests für alle Services implementieren
- [ ] **Tag 3:** Integration Tests für APIs
- [ ] **Tag 4:** E2E Tests für kritische Workflows
- [ ] **Tag 5:** Performance und Security Tests
- [ ] **Tag 6:** CI/CD Integration und Dokumentation

---

## 🤔 **Offene Fragen an Sie**

### **1. Original-Rechnungen Speicherung (Story 2.10):**
- **Wo sollen die PDF-Dateien gespeichert werden?**
  - Option A: Lokales Dateisystem (`uploads/documents/`)
  - Option B: Supabase Storage (Cloud)
  - Option C: Hybrid (lokal für MVP, später Cloud)

- **Wie lange sollen Rechnungen aufbewahrt werden?**
  - Deutsche Geschäftsvorschrift: 10 Jahre
  - Automatische Archivierung nach X Monaten?

### **2. Manuelle Rechnungsposition-Erstellung (Story 2.5):**
- **Wo soll die manuelle Eingabe zugänglich sein?**
  - Option A: Separate Seite "Manuelle Rechnung erstellen"
  - Option B: Button in Projekt-Detail-Seite
  - Option C: Beides

- **Sollen manuelle Positionen anders markiert werden?**
  - Visuell unterscheidbar von OCR-Positionen?
  - Separater Audit-Trail?

### **3. Testing-Strategie (Story 2.11):**
- **Haben Sie echte Test-Rechnungen für uns?**
  - Verschiedene Lieferanten
  - Verschiedene Layouts
  - Österreichische vs. deutsche Rechnungen

- **Welche Browser sollen für E2E Tests unterstützt werden?**
  - Chrome, Firefox, Safari?
  - Mobile Browser?

### **4. Budget-Verarbeitung Testing:**
- **Sollen wir das Budget-Processing jetzt testen?**
  - Sie erwähnten: "Was dann noch zu testen ist ist ob der betrag wirklich vom Projekt budget richtig verarbeitet wird"
  - Soll ich das sofort machen oder als Teil von Story 2.11?

---

## 📅 **Zeitplan-Vorschlag**

### **Woche 1 (5 Arbeitstage):**
- **Tag 1-4:** Story 2.4 - Projekt-Rechnungsposition-Management
- **Tag 5:** Budget-Processing Testing (falls gewünscht)

### **Woche 2 (5 Arbeitstage):**
- **Tag 1-5:** Story 2.10 - Original-Rechnungen Speicherung

### **Woche 3 (4 Arbeitstage):**
- **Tag 1-3:** Story 2.5 - Manuelle Rechnungsposition-Erstellung
- **Tag 4:** Story 2.3 - Adaptive Rechnungsverarbeitung (Start)

### **Woche 4 (3 Arbeitstage):**
- **Tag 1-2:** Story 2.3 - Adaptive Rechnungsverarbeitung (Abschluss)
- **Tag 3:** Story 2.11 - Testplan (Start)

### **Woche 5+ (Nach Bedarf):**
- Story 2.11 - Vollständiger Testplan (Fortsetzung)

---

## 🎯 **Nächste Schritte**

### **Sofort:**
1. **Ihre Antworten auf die offenen Fragen**
2. **Bestätigung der Prioritäten-Reihenfolge**
3. **Entscheidung: Budget-Testing jetzt oder später?**

### **Dann:**
1. **Story 2.4 implementieren** (Projekt-Rechnungsposition-Management)
2. **Parallel: Story 2.10 planen** (basierend auf Ihren Antworten)

---

## 💡 **Empfehlung**

Ich empfehle, **Story 2.4** sofort zu beginnen, da:
- ✅ Keine offenen Fragen
- ✅ Baut auf bestehender Infrastruktur auf  
- ✅ Hoher Business Value
- ✅ Relativ schnell umsetzbar

**Soll ich mit Story 2.4 anfangen, während Sie die anderen Fragen beantworten?**
