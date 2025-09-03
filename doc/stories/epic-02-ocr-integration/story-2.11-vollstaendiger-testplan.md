# Story 2.11: Vollständiger Testplan Epic 2

## 📋 **Story Beschreibung**
Als Entwickler möchte ich einen umfassenden Testplan für Epic 2 (OCR-Integration), damit alle implementierten Features gründlich getestet und die Qualität sichergestellt wird.

## 🎯 **Testabdeckung Ziele**
- **Unit Tests:** >95% Code Coverage
- **Integration Tests:** Alle API-Endpoints und Datenbank-Operationen
- **End-to-End Tests:** Vollständige User-Workflows
- **Performance Tests:** OCR-Verarbeitung und Dokument-Upload
- **Security Tests:** Zugriffskontrolle und Datenvalidierung

## 🧪 **1. UNIT TESTS**

### **Backend Services (95% Coverage)**

#### **1.1 DocumentStorageService Tests**
```javascript
// tests/services/documentStorageService.test.js
describe('DocumentStorageService', () => {
  test('storeDocument - erfolgreicher Upload');
  test('storeDocument - Duplikatserkennung');
  test('storeDocument - Versionierung bei Änderung');
  test('retrieveDocument - erfolgreicher Download');
  test('generateDownloadUrl - sichere URL');
  test('checkDuplicate - Hash-Vergleich');
});
```

#### **1.2 OCR Service Tests**
```javascript
// tests/services/ocrService.test.js
describe('OCRService', () => {
  test('processDocument - PDF Verarbeitung');
  test('processDocument - Bild Verarbeitung');
  test('processDocument - Fehlerbehandlung');
});
```

### **Frontend Components (90% Coverage)**

#### **1.3 DocumentViewer Tests**
```typescript
// tests/components/DocumentViewer.test.tsx
describe('DocumentViewer', () => {
  test('lädt Dokumente für OCR-Processing-ID');
  test('lädt Dokumente für Invoice-ID');
  test('Upload-Funktionalität');
  test('Download-Funktionalität');
});
```

## 🔗 **2. INTEGRATION TESTS**

### **2.1 API Endpoint Tests**

#### **2.1.1 Document Routes Tests**
```javascript
// tests/integration/documentRoutes.test.js
describe('Document API Routes', () => {
  test('POST /api/documents/upload');
  test('GET /api/documents/:id/download');
  test('GET /api/documents/:id/metadata');
  test('GET /api/documents/by-invoice/:invoiceId');
  test('POST /api/documents/check-duplicate');
});
```

#### **2.1.2 OCR Integration Tests**
```javascript
// tests/integration/ocrIntegration.test.js
describe('OCR Integration', () => {
  test('OCR Upload speichert Dokument automatisch');
  test('OCR Review zeigt Original-Dokument');
});
```

## 🎭 **3. END-TO-END TESTS**

### **3.1 Vollständiger OCR-Workflow**
```javascript
// tests/e2e/ocrWorkflow.test.js
describe('Vollständiger OCR-Workflow', () => {
  test('PDF Upload → OCR → Review → Freigabe → Projekt-Zuordnung', async () => {
    // 1. PDF-Datei hochladen
    await page.goto('/ocr');
    await page.setInputFiles('input[type="file"]', 'test-invoice.pdf');
    await page.click('button:has-text("Hochladen")');
    
    // 2. OCR-Verarbeitung abwarten
    await page.waitForSelector('.ocr-results');
    
    // 3. Original-Dokument prüfen
    await expect(page.locator('.document-viewer')).toBeVisible();
    
    // 4. Lieferant bestätigen
    await page.selectOption('select[name="supplier"]', 'existing-supplier');
    
    // 5. Positionen Projekten zuordnen
    await page.selectOption('.position-project-select', 'project-1');
    
    // 6. Rechnung freigeben
    await page.click('button:has-text("RECHNUNG FREIGEBEN")');
    
    // 7. Erfolg prüfen
    await expect(page.locator('text=erfolgreich freigegeben')).toBeVisible();
  });
});
```

### **3.2 Manuelle Position Workflow**
```javascript
// tests/e2e/manualPosition.test.js
describe('Manuelle Position Workflow', () => {
  test('Projekt → Manuelle Position → Budget-Update');
});
```

### **3.3 Dokument-Verwaltung Workflow**
```javascript
// tests/e2e/documentManagement.test.js
describe('Dokument-Verwaltung Workflow', () => {
  test('Upload → Metadaten → Download → Versionierung');
});
```

## ⚡ **4. PERFORMANCE TESTS**

### **4.1 OCR Performance Tests**
- PDF-Verarbeitung unter 30 Sekunden (5MB)
- Parallel OCR-Verarbeitung (5 PDFs gleichzeitig)

### **4.2 Document Storage Performance**
- 50MB Upload unter 60 Sekunden
- Download-Performance unter 5 Sekunden

## 🔒 **5. SECURITY TESTS**

### **5.1 Zugriffskontrolle Tests**
- Unautorisierter Zugriff auf Dokumente
- Zugriff auf fremde Dokumente
- SQL Injection Schutz

### **5.2 File Upload Security**
- Malicious File Types blockiert
- Oversized Files blockiert
- File Content Validation

## 📊 **6. TEST EXECUTION PLAN**

### **6.1 Automatisierte Tests (CI/CD)**
```yaml
# .github/workflows/epic2-tests.yml
name: Epic 2 Test Suite
on: [push, pull_request]
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run unit tests
        run: npm run test:unit
```

### **6.2 Manuelle Test-Checkliste**

#### **📋 OCR-Workflow Tests**
- [ ] PDF-Upload funktioniert (verschiedene Größen)
- [ ] Bild-Upload funktioniert (JPG, PNG)
- [ ] AI-Analyse extrahiert korrekte Daten
- [ ] Original-Dokument wird angezeigt
- [ ] Download-Link funktioniert
- [ ] Duplikatserkennung funktioniert
- [ ] Versionierung bei Re-Upload
- [ ] Lieferant-Bestätigung funktioniert
- [ ] Projekt-Zuordnung funktioniert
- [ ] Rechnung wird korrekt gebucht

#### **📋 Dokument-Verwaltung Tests**
- [ ] Dokumente werden in korrektem Bucket gespeichert
- [ ] Metadaten werden vollständig erfasst
- [ ] Zugriffs-Logging funktioniert
- [ ] 10-jährige Aufbewahrung konfiguriert
- [ ] Hash-basierte Duplikatserkennung
- [ ] Sichere Download-URLs
- [ ] Archivierung funktioniert

#### **📋 Integration Tests**
- [ ] OCR → Dokument-Speicherung
- [ ] Dokument → Projekt-Zuordnung
- [ ] Projekt-Detail → Dokument-Anzeige
- [ ] Manuelle Position → Dokument-Upload
- [ ] Budget-Update nach Zuordnung

#### **📋 Performance Tests**
- [ ] OCR-Verarbeitung < 30s (5MB PDF)
- [ ] Upload < 60s (50MB Datei)
- [ ] Download < 5s (normale Dateien)
- [ ] UI bleibt responsiv während Upload
- [ ] Parallel-Verarbeitung funktioniert

#### **📋 Security Tests**
- [ ] Unautorisierter Zugriff blockiert
- [ ] Malicious Files blockiert
- [ ] File Size Limits enforced
- [ ] SQL Injection Schutz
- [ ] XSS Schutz in UI

## 📈 **7. TEST METRICS & REPORTING**

### **7.1 Coverage Ziele**
- **Backend Services:** >95% Line Coverage
- **API Routes:** 100% Endpoint Coverage
- **Frontend Components:** >90% Component Coverage
- **Database Operations:** 100% Query Coverage

### **7.2 Performance Benchmarks**
- **OCR Processing:** < 30 Sekunden (5MB PDF)
- **Document Upload:** < 60 Sekunden (50MB)
- **Document Download:** < 5 Sekunden
- **UI Response Time:** < 2 Sekunden

## ✅ **8. ACCEPTANCE CRITERIA**

### **Funktionale Akzeptanz:**
- [ ] Alle Unit Tests bestehen (>95% Coverage)
- [ ] Alle Integration Tests bestehen
- [ ] Alle E2E Tests bestehen
- [ ] Performance-Benchmarks erreicht
- [ ] Security Tests bestehen

### **Qualitäts-Akzeptanz:**
- [ ] Keine kritischen Bugs
- [ ] Keine Security-Vulnerabilities
- [ ] Code Review abgeschlossen
- [ ] Dokumentation vollständig

### **User-Akzeptanz:**
- [ ] OCR-Workflow funktioniert end-to-end
- [ ] Dokument-Verwaltung ist intuitiv
- [ ] Performance ist akzeptabel
- [ ] Deutsche Geschäfts-Compliance erfüllt

## 🚀 **9. TEST EXECUTION**

### **Phase 1: Unit & Integration Tests (1 Tag)**
1. Backend Services testen
2. API Endpoints testen
3. Frontend Components testen
4. Datenbank Operations testen

### **Phase 2: E2E Tests (1 Tag)**
1. OCR-Workflow testen
2. Dokument-Verwaltung testen
3. Projekt-Integration testen
4. Cross-Browser Tests

### **Phase 3: Performance & Security (0.5 Tage)**
1. Load Tests durchführen
2. Security Scans ausführen
3. Penetration Tests
4. Performance Optimierung

### **Phase 4: User Acceptance (0.5 Tage)**
1. Manuelle Test-Checkliste abarbeiten
2. User Feedback sammeln
3. Bug Fixes implementieren
4. Final Sign-off

## 📝 **NOTIZEN**
- Tests verwenden echte Supabase-Testdatenbank
- Test-Daten werden nach jedem Lauf bereinigt
- Performance-Tests laufen auf produktionsähnlicher Infrastruktur
- Security-Tests verwenden OWASP-Standards
- Alle Tests sind in CI/CD Pipeline integriert