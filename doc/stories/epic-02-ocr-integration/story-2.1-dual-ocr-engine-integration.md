# Story 2.1: Dual OCR Engine Integration

## 📋 **Story Beschreibung**
Als Budget-Manager möchte ich eine zweistufige OCR-Engine-Integration, die mit Tesseract.js beginnt und bei Bedarf auf Cloud Vision AI eskaliert, um eine optimale Balance zwischen Performance und Genauigkeit zu erreichen.

## 🎯 **Akzeptanzkriterien**

### **Als Budget-Manager kann ich:**
- [ ] PDF- und Bilddateien (PNG, JPG, PDF) hochladen
- [ ] Automatische OCR-Verarbeitung mit Tesseract.js als primäre Engine
- [ ] Automatische Eskalation zu Cloud Vision AI bei niedriger Konfidenz (<80%)
- [ ] Konfidenz-Bewertung für jeden erkannten Text-Block anzeigen
- [ ] Rohdaten der OCR-Ergebnisse einsehen und korrigieren

### **Das System soll:**
- [ ] Tesseract.js für schnelle, lokale Verarbeitung nutzen
- [ ] Cloud Vision AI für komplexe/unleserliche Dokumente verwenden
- [ ] Konfidenz-Scores für beide Engines vergleichen
- [ ] Beste Ergebnisse automatisch auswählen
- [ ] Verarbeitungszeit und Kosten optimieren

## 🔧 **Technische Anforderungen**

### **OCR Engine Setup:**
```typescript
interface OCREngine {
  name: 'tesseract' | 'cloud-vision'
  process(file: File): Promise<OCRResult>
  confidence: number
  cost: number
  processingTime: number
}

interface OCRResult {
  text: string
  confidence: number
  boundingBoxes: BoundingBox[]
  engine: OCREngine['name']
  metadata: OCRMetadata
}
```

### **Eskalations-Logik:**
- **Tesseract.js Konfidenz >80%:** Ergebnis verwenden
- **Tesseract.js Konfidenz <80%:** Cloud Vision AI versuchen
- **Beide Engines verfügbar:** Besseres Ergebnis wählen
- **Fehler-Handling:** Graceful Fallback und User-Feedback

### **Performance-Ziele:**
- **Tesseract.js:** <10s für Standard-Rechnung
- **Cloud Vision AI:** <15s für komplexe Dokumente
- **Dateigröße:** Bis 10MB unterstützen
- **Batch-Verarbeitung:** Bis 5 Dateien parallel

## 🎨 **UI/UX Anforderungen**

### **Upload-Interface:**
- Drag & Drop Zone mit Fortschrittsanzeige
- Unterstützte Formate klar kommunizieren
- Live-Preview der hochgeladenen Datei
- OCR-Engine-Status und Konfidenz anzeigen

### **Ergebnis-Anzeige:**
- Originaltext vs. erkannter Text Vergleich
- Konfidenz-Heatmap für Text-Bereiche
- Engine-Auswahl und Kosten-Information
- Korrektur-Möglichkeiten für erkannten Text

## 🧪 **Testkriterien**

### **Funktionale Tests:**
- [ ] Upload verschiedener Dateiformate
- [ ] OCR-Verarbeitung mit beiden Engines
- [ ] Konfidenz-basierte Engine-Auswahl
- [ ] Fehler-Handling bei unlesbaren Dateien
- [ ] Performance-Tests mit großen Dateien

### **Integration Tests:**
- [ ] Tesseract.js Setup und Konfiguration
- [ ] Cloud Vision AI API Integration
- [ ] Datei-Upload und -Verarbeitung
- [ ] Ergebnis-Speicherung in Datenbank
- [ ] Frontend-Backend-Kommunikation

## 📊 **Datenbank Schema**

```sql
-- OCR Verarbeitungshistorie
CREATE TABLE ocr_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  tesseract_confidence DECIMAL(5,2),
  tesseract_text TEXT,
  cloud_vision_confidence DECIMAL(5,2),
  cloud_vision_text TEXT,
  selected_engine VARCHAR(20) NOT NULL,
  final_confidence DECIMAL(5,2) NOT NULL,
  processing_time_ms INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- OCR Rohdaten
CREATE TABLE ocr_raw_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processing_id UUID REFERENCES ocr_processing(id),
  engine VARCHAR(20) NOT NULL,
  raw_response JSONB NOT NULL,
  bounding_boxes JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 **Implementierungsplan**

### **Phase 1: Tesseract.js Integration**
1. Tesseract.js Setup und Konfiguration
2. File Upload Handler implementieren
3. Basis OCR-Verarbeitung
4. Konfidenz-Bewertung

### **Phase 2: Cloud Vision AI Integration**
1. Google Cloud Vision API Setup
2. API-Wrapper und Authentifizierung
3. Eskalations-Logik implementieren
4. Kosten-Tracking

### **Phase 3: UI/UX Implementation**
1. Upload-Interface mit Drag & Drop
2. Ergebnis-Anzeige mit Konfidenz-Visualization
3. Korrektur-Interface
4. Performance-Optimierungen

### **Phase 4: Testing & Optimization**
1. Umfassende Tests mit verschiedenen Dokumenttypen
2. Performance-Optimierung
3. Error-Handling verbessern
4. User-Feedback Integration

## 📈 **Definition of Done**
- [ ] Beide OCR-Engines erfolgreich integriert
- [ ] Automatische Engine-Auswahl funktioniert
- [ ] UI zeigt Konfidenz und Engine-Information
- [ ] Alle Tests bestehen (Unit, Integration, E2E)
- [ ] Performance-Ziele erreicht
- [ ] Dokumentation vollständig
- [ ] Code Review abgeschlossen
