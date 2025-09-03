# Story 2.10: Original-Rechnungen Speicherung & Verwaltung

## 📋 **Story Beschreibung**
Als System-Administrator möchte ich, dass alle Original-Rechnungen (PDF-Dateien) sicher und nachverfolgbar in der Datenbank gespeichert werden, damit eine vollständige Audit-Trail und Compliance mit deutschen Geschäftsvorschriften gewährleistet ist.

## ✅ **USER-ENTSCHEIDUNGEN**
- **PDF-Speicherung:** Supabase Storage (bereits Dokumenten-DB vorhanden)
- **Aufbewahrungszeit:** 10 Jahre automatisch (deutsche Geschäftsvorschrift)
- **Archivierung:** Automatisch nach Ablauf der Aufbewahrungsfrist

## 🎯 **Akzeptanzkriterien**

### **Als System soll ich:**
- [ ] Alle hochgeladenen PDF-Rechnungen permanent speichern
- [ ] Eindeutige Referenzen zwischen OCR-Daten und Original-PDF erstellen
- [ ] Metadaten zu jeder gespeicherten Rechnung erfassen
- [ ] Versionierung bei Re-Upload derselben Rechnung implementieren
- [ ] Sichere Zugriffskontrolle auf Original-Dokumente gewährleisten
- [ ] Backup- und Archivierungsstrategien implementieren

### **Als Budget-Manager kann ich:**
- [ ] Jederzeit das Original-PDF zu einer verarbeiteten Rechnung einsehen
- [ ] Download-Links zu Original-Rechnungen in der UI finden
- [ ] Metadaten wie Upload-Datum, Dateigröße, Prüfsumme einsehen
- [ ] Bei Bedarf eine neue Version einer Rechnung hochladen

## 🔧 **Technische Anforderungen**

### **Datenbank-Schema Erweiterung:**
```sql
-- Original-Rechnungen Speicherung
CREATE TABLE IF NOT EXISTS invoice_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ocr_processing_id UUID REFERENCES ocr_processing(id),
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_hash VARCHAR(64) NOT NULL, -- SHA-256 für Duplikatserkennung
  version INTEGER DEFAULT 1,
  storage_location VARCHAR(50) DEFAULT 'local', -- 'local', 'supabase', 's3'
  
  -- Metadaten
  upload_date TIMESTAMP DEFAULT NOW(),
  uploaded_by VARCHAR(100),
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP,
  
  -- Archivierung
  archived BOOLEAN DEFAULT false,
  archive_date TIMESTAMP,
  retention_until DATE, -- Aufbewahrungspflicht bis
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(file_hash, version), -- Verhindert exakte Duplikate
  CHECK (file_size > 0),
  CHECK (version > 0)
);

-- Zugriffs-Log für Compliance
CREATE TABLE IF NOT EXISTS document_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES invoice_documents(id),
  accessed_by VARCHAR(100) NOT NULL,
  access_type VARCHAR(20) NOT NULL, -- 'VIEW', 'DOWNLOAD', 'DELETE'
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP DEFAULT NOW()
);

-- Indizes für Performance
CREATE INDEX idx_invoice_documents_ocr_processing ON invoice_documents(ocr_processing_id);
CREATE INDEX idx_invoice_documents_hash ON invoice_documents(file_hash);
CREATE INDEX idx_invoice_documents_upload_date ON invoice_documents(upload_date);
CREATE INDEX idx_document_access_log_document ON document_access_log(document_id);
```

### **Speicher-Strategien:**
```typescript
interface DocumentStorageConfig {
  storageType: 'local' | 'supabase' | 's3'
  basePath: string
  maxFileSize: number // in bytes
  allowedMimeTypes: string[]
  retentionPolicy: {
    defaultRetentionYears: number
    archiveAfterMonths: number
    deleteAfterYears: number
  }
}

interface DocumentMetadata {
  originalName: string
  storedName: string
  filePath: string
  fileSize: number
  mimeType: string
  hash: string
  version: number
  uploadedBy: string
  uploadDate: Date
}
```

### **Backend-Services:**
```typescript
class DocumentStorageService {
  async storeDocument(file: Buffer, metadata: DocumentMetadata): Promise<string>
  async retrieveDocument(documentId: string): Promise<Buffer>
  async getDocumentMetadata(documentId: string): Promise<DocumentMetadata>
  async deleteDocument(documentId: string, reason: string): Promise<void>
  async archiveDocument(documentId: string): Promise<void>
  async generateDownloadUrl(documentId: string, expiresIn?: number): Promise<string>
  async checkDuplicate(hash: string): Promise<InvoiceDocument[]>
  async logAccess(documentId: string, userId: string, accessType: string): Promise<void>
}
```

## 🎨 **UI/UX Anforderungen**

### **Dokument-Verwaltung in OCR-Review:**
```
📄 ORIGINAL-RECHNUNG
┌─────────────────────────────────────┐
│ 📎 R2502-1269_Rechnung_DEFINE.pdf  │
│ 📊 108,4 KB • Hochgeladen: 30.08.25│
│ 🔒 SHA-256: a1b2c3d4...            │
│                                     │
│ [👁️ Anzeigen] [⬇️ Download] [🔄 Neu]│
│                                     │
│ ✅ Original sicher gespeichert      │
└─────────────────────────────────────┘
```

### **Projekt-Detail-Seite Integration:**
```
📋 ZUGEORDNETE RECHNUNGEN
┌─────────────────────────────────────────────────────────────┐
│ Rechnung R2502-1269 • DEFINE GmbH • 12.02.2025             │
│ └─ Position: Recherche (107,00 €)                          │
│ └─ 📎 Original: R2502-1269_Rechnung_DEFINE.pdf [Download]  │
│                                                             │
│ Rechnung R2503-1270 • DEFINE GmbH • 15.02.2025             │
│ └─ Position: Programmierung (579,50 €)                     │
│ └─ 📎 Original: R2503-1270_Rechnung_DEFINE.pdf [Download]  │
└─────────────────────────────────────────────────────────────┘
```

### **Admin-Bereich Dokument-Verwaltung:**
```
🗃️ DOKUMENT-ARCHIV
┌─────────────────────────────────────────────────────────────┐
│ Filter: [Alle ▼] [2025 ▼] [DEFINE ▼] [🔍 Suchen...]       │
│                                                             │
│ 📄 R2502-1269_Rechnung_DEFINE.pdf                          │
│ │  📊 108,4 KB • 30.08.2025 • 3x aufgerufen               │
│ │  🔒 Hash: a1b2c3d4... • Version: 1                      │
│ │  [👁️] [⬇️] [🗂️ Archiv] [🗑️ Löschen]                    │
│                                                             │
│ 📄 R2503-1270_Rechnung_DEFINE.pdf                          │
│ │  📊 95,2 KB • 28.08.2025 • 1x aufgerufen                │
│ │  🔒 Hash: e5f6g7h8... • Version: 1                      │
│ │  [👁️] [⬇️] [🗂️ Archiv] [🗑️ Löschen]                    │
└─────────────────────────────────────────────────────────────┘
```

## 🔒 **Sicherheits- & Compliance-Anforderungen**

### **Deutsche Geschäfts-Compliance:**
- **Aufbewahrungspflicht:** 10 Jahre für Geschäftsunterlagen
- **Unveränderbarkeit:** Original-PDFs dürfen nicht modifiziert werden
- **Zugriffskontrolle:** Nur autorisierte Benutzer können Dokumente einsehen
- **Audit-Trail:** Vollständige Protokollierung aller Zugriffe

### **Technische Sicherheit:**
- **Verschlüsselung:** Dokumente verschlüsselt speichern
- **Backup:** Regelmäßige Backups mit Wiederherstellungstest
- **Versionierung:** Alte Versionen bei Re-Upload beibehalten
- **Integritätsprüfung:** SHA-256 Hashes für Manipulationserkennung

## 📊 **Implementierungsplan**

### **Phase 1: Basis-Speicherung (1-2 Tage)**
1. Datenbank-Schema erweitern
2. DocumentStorageService implementieren
3. Lokale Speicherung in `uploads/documents/`
4. Basis-Metadaten erfassen

### **Phase 2: UI-Integration (1-2 Tage)**
1. Download-Links in OCR-Review-Interface
2. Dokument-Anzeige in Projekt-Details
3. Upload-Feedback mit Metadaten
4. Fehlerbehandlung für fehlende Dokumente

### **Phase 3: Erweiterte Features (2-3 Tage)**
1. Duplikatserkennung über Hash-Vergleich
2. Versionierung bei Re-Upload
3. Admin-Bereich für Dokument-Verwaltung
4. Zugriffs-Logging implementieren

### **Phase 4: Compliance & Archivierung (2-3 Tage)**
1. Aufbewahrungsfristen implementieren
2. Archivierungs-Workflow
3. Backup-Strategien
4. Compliance-Reports

## 🧪 **Testkriterien**

### **Funktionale Tests:**
- [ ] PDF-Upload und Speicherung funktioniert
- [ ] Metadaten werden korrekt erfasst
- [ ] Download-Links funktionieren
- [ ] Duplikatserkennung erkennt identische Dateien
- [ ] Versionierung bei Re-Upload funktioniert

### **Sicherheits-Tests:**
- [ ] Unbefugte können keine Dokumente herunterladen
- [ ] Hash-Verifikation erkennt Manipulationen
- [ ] Zugriffs-Logging funktioniert korrekt
- [ ] Verschlüsselung funktioniert (falls implementiert)

### **Performance-Tests:**
- [ ] Upload großer PDFs (>10MB) funktioniert
- [ ] Download-Performance ist akzeptabel
- [ ] Datenbank-Queries sind optimiert
- [ ] Speicherplatz-Monitoring funktioniert

## 📈 **Erfolgskriterien**
- **Compliance:** 100% der Rechnungen haben Original-PDF-Referenz
- **Verfügbarkeit:** 99.9% Uptime für Dokument-Downloads
- **Sicherheit:** Keine unbefugten Zugriffe auf Dokumente
- **Performance:** Download-Zeit <3 Sekunden für normale PDFs

## 🔗 **Abhängigkeiten**
- **Story 2.9:** OCR-Review-Interface (für UI-Integration)
- **Epic 8:** Admin-Management (für Admin-Bereich)
- **Infrastruktur:** Ausreichend Speicherplatz für PDF-Archiv

## ⚠️ **Risiken & Mitigation**
- **Speicherplatz:** Monitoring und Archivierung implementieren
- **Performance:** Lazy Loading und CDN für große Dateien
- **Compliance:** Regelmäßige Compliance-Audits
- **Backup:** Automatisierte Backup-Tests

## 📝 **Notizen**
- Diese Story ist kritisch für deutsche Geschäfts-Compliance
- Integration mit Supabase Storage für Cloud-Migration vorbereiten
- Berücksichtigung von DSGVO-Anforderungen bei personenbezogenen Daten
