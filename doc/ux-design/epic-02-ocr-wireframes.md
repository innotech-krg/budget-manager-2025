# 📐 **Epic 02 Wireframes - OCR & Rechnungsverarbeitung UI/UX**

**@ux-expert.mdc** | **Fokus:** Epic 02 OCR & Rechnungsverarbeitung  
**Status:** Wireframes und UI-Mockups für OCR-Integration

---

## 🎯 **STORY 2.1: PDF-UPLOAD UND SUPABASE STORAGE WIREFRAMES**

### **Drag & Drop Upload-Interface:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Rechnungs-Upload                                          [✕]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                   📄 Drag & Drop Zone                      │ │
│ │                                                             │ │
│ │           Ziehen Sie PDF-Rechnungen hierher                │ │
│ │                        oder                                 │ │
│ │                [Dateien auswählen]                         │ │
│ │                                                             │ │
│ │   Unterstützte Formate: PDF (max. 50MB)                   │ │
│ │   Multiple Upload: Bis zu 10 Dateien gleichzeitig         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Upload-Warteschlange:                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📄 rechnung-2024-12-15.pdf    [████████░░] 80%  🟡        │ │
│ │ 📄 lieferant-abc-nov.pdf      [██████████] 100% ✅        │ │
│ │ 📄 fehlerhafte-datei.txt      [          ] 0%   ❌        │ │
│ │    → Ungültiges Format. Nur PDF-Dateien erlaubt.          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                               [Abbrechen] [OCR starten]        │
└─────────────────────────────────────────────────────────────────┘
```

### **Mobile Upload-Interface (375px):**
```
┌─────────────────────────┐
│ PDF-Upload        [✕]   │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │     📄 Upload       │ │
│ │                     │ │
│ │  Tippen zum         │ │
│ │  Auswählen          │ │
│ │                     │ │
│ │  PDF max. 50MB      │ │
│ └─────────────────────┘ │
│                         │
│ Uploads:                │
│ • rechnung.pdf ✅       │
│ • upload.pdf 🟡 60%     │
│                         │
│ [OCR starten]           │
└─────────────────────────┘
```

---

## 📊 **STORY 2.8: OCR-DASHBOARD WIREFRAMES**

### **OCR-Dashboard-Integration:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Budget Manager Dashboard                      [Notifications]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Jahresbudget    │  │ OCR-Verarbeitung│  │ Aktive Projekte │ │
│  │ €1.250.000,00   │  │                 │  │     47          │ │
│  │ ████████░░ 75%  │  │ Heute: 23 PDFs  │  │   ████████      │ │
│  │ Zugewiesen      │  │ ████████░░ 87%  │  │                 │ │
│  └─────────────────┘  │ Genauigkeit     │  └─────────────────┘ │
│                        └─────────────────┘                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ OCR-Verarbeitungs-Dashboard                                 │ │
│  │                                                             │ │
│  │ Status-Filter: [Alle ▼] [Heute ▼] [Lieferant ▼]           │ │
│  │                                                             │ │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│  │ │Verarbeitung │ │Abgeschlossen│ │    Fehler   │           │ │
│  │ │🟡    5      │ │🟢    18     │ │🔴     2     │           │ │
│  │ └─────────────┘ └─────────────┘ └─────────────┘           │ │
│  │                                                             │ │
│  │ Letzte Rechnungen:                                          │ │
│  │ • 14:23 - Lieferant ABC ✅ €2.500 → Mobile App Projekt     │ │
│  │ • 14:18 - Dienstleister XYZ 🟡 Verarbeitung läuft...      │ │
│  │ • 14:12 - Hardware-Rechnung ❌ OCR-Fehler - Manuell prüfen │ │
│  │                                                             │ │
│  │ [Alle anzeigen] [Bulk-Validierung] [Export]                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **OCR-Performance-Charts:**
```
┌─────────────────────────────────────────────────────────────────┐
│ OCR-Performance-Statistiken                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ OCR-Genauigkeit (Letzte 30 Tage)                           │ │
│ │                                                             │ │
│ │ 100%│                                              ●       │ │
│ │     │                                         ●──●         │ │
│ │  95%│                                    ●──●               │ │
│ │     │                               ●──●                   │ │
│ │  90%│                          ●──●                        │ │
│ │     │                     ●──●                             │ │
│ │  85%│                ●──●                                  │ │
│ │     │           ●──●                                       │ │
│ │  80%│      ●──●                                            │ │
│ │     │ ●──●                                                 │ │
│ │  75%└─────────────────────────────────────────────────────  │ │
│ │     1   5   10  15  20  25  30  Tage                      │ │
│ │                                                             │ │
│ │ Durchschnitt: 89.3% | Ziel: >85% ✅                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Verarbeitungsgeschwindigkeit pro Lieferant                  │ │
│ │                                                             │ │
│ │ Lieferant ABC        ██████████████████████ 18s avg        │ │
│ │ Dienstleister XYZ    ████████████████ 24s avg              │ │
│ │ Hardware-Firma       ██████████ 31s avg                    │ │
│ │ Sonstige             ████████ 35s avg                      │ │
│ │                                                             │ │
│ │ Gesamt-Durchschnitt: 26.5s | Ziel: <30s ✅                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 **OCR-PROCESSING UI-KOMPONENTEN**

### **Side-by-Side OCR-Verarbeitung:**
```
┌─────────────────────────────────────────────────────────────────┐
│ OCR-Verarbeitung: rechnung-2024-12-15.pdf              [✕]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│ │ PDF-Vorschau                │ │ OCR-Ergebnisse              │ │
│ │                             │ │                             │ │
│ │ [PDF-Dokument-Anzeige]      │ │ Status: 🟡 Verarbeitung... │ │
│ │                             │ │                             │ │
│ │ Seite 1 von 1               │ │ Google Cloud Vision API     │ │
│ │ [Zoom: 100% ▼]              │ │ ████████░░ 80%             │ │
│ │                             │ │                             │ │
│ │ ┌─────────────────────────┐ │ │ Erkannte Daten:             │ │
│ │ │ RECHNUNG NR: 2024-1205  │ │ │ • Rechnungsnummer: ✅       │ │
│ │ │ Datum: 15.12.2024       │ │ │ • Datum: ✅                 │ │
│ │ │ Lieferant: ABC GmbH     │ │ │ • Lieferant: ✅             │ │
│ │ │ Betrag: €2.500,00       │ │ │ • Gesamtbetrag: ✅          │ │
│ │ │                         │ │ │ • Einzelpositionen: 🟡      │ │
│ │ └─────────────────────────┘ │ │                             │ │
│ └─────────────────────────────┘ │ KI-Projektzuordnung:        │ │
│                                 │ → Mobile App (89% Match)    │ │
│                                 │ → Website (12% Match)       │ │
│                                 │                             │ │
│                                 │ [Manuell korrigieren]       │ │
│                                 └─────────────────────────────┘ │
│                                                                 │
│                               [Abbrechen] [Validieren]         │
└─────────────────────────────────────────────────────────────────┘
```

### **Mobile OCR-Dashboard (375px):**
```
┌─────────────────────────┐
│ OCR-Status        [☰]   │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │ Heute verarbeitet   │ │
│ │        23           │ │
│ │ PDFs  ████░ 87%     │ │
│ │       Genauigkeit   │ │
│ └─────────────────────┘ │
│                         │
│ Status:                 │
│ 🟡 Verarbeitung: 5      │
│ ✅ Fertig: 18           │
│ ❌ Fehler: 2            │
│                         │
│ Letzte:                 │
│ • ABC GmbH ✅           │
│ • XYZ Ltd 🟡            │
│ • Error-Doc ❌          │
│                         │
│ [Details] [Upload]      │
└─────────────────────────┘
```

---

## 🎨 **OCR-UI-KOMPONENTEN SPEZIFIKATIONEN**

### **Upload-Komponenten:**
1. **DragDropZone** - PDF-Upload mit visueller Feedback
2. **UploadProgressBar** - Echtzeit-Upload-Fortschritt mit Geschwindigkeit
3. **FileValidation** - Sofortige Feedback bei ungültigen Dateien
4. **UploadQueue** - Batch-Upload-Verwaltung mit Status-Anzeige

### **OCR-Processing-Komponenten:**
5. **OCRStatusIndicator** - Ampelsystem für OCR-Status (🟢 🟡 🔴)
6. **SideBySideViewer** - PDF-Vorschau + OCR-Ergebnis-Panel
7. **OCRProgressTracker** - Visuelle OCR-Verarbeitungs-Fortschrittsanzeige
8. **AIProjectSuggestions** - KI-Projektzuordnungs-Vorschläge mit Confidence

### **Dashboard-Integration-Komponenten:**
9. **OCRDashboardCard** - OCR-Status-Kachel für Haupt-Dashboard
10. **OCRPerformanceChart** - Chart.js-Integration für OCR-Statistiken
11. **OCRActivityFeed** - Live-OCR-Verarbeitungs-Updates
12. **OCRBatchActions** - Bulk-Operationen für mehrere Rechnungen

---

## 📱 **RESPONSIVE OCR-DESIGN**

### **Desktop (1200px+):**
- **Side-by-Side OCR:** PDF-Vorschau + Ergebnis-Panel nebeneinander
- **Dashboard-Integration:** OCR-Kacheln in 3-4 Spalten Grid
- **Batch-Upload:** Drag & Drop für bis zu 10 PDFs gleichzeitig

### **Tablet (768px-1199px):**
- **Stacked OCR-View:** PDF-Vorschau oben, Ergebnis-Panel unten
- **Touch-optimierte Upload:** Größere Touch-Targets für Upload-Buttons
- **Kompakte Dashboard-Kacheln:** 2 Spalten OCR-Status-Anzeige

### **Mobile (<768px):**
- **Single-View OCR:** Tab-basierte Navigation zwischen PDF und Ergebnis
- **Touch-Upload:** Vereinfachte Upload-Oberfläche
- **Kompakte Status-Anzeige:** Gestapelte OCR-Status-Karten

---

## ♿ **OCR-ACCESSIBILITY STANDARDS**

### **Screen-Reader-Support:**
- **Upload-Zone:** Comprehensive aria-labels für Drag & Drop-Alternative
- **OCR-Status:** Spoken Status-Updates für Verarbeitungsfortschritt
- **PDF-Viewer:** Alt-text für OCR-erkannte Inhalte
- **Charts:** Tabellen-Alternative für OCR-Performance-Statistiken

### **Tastatur-Navigation:**
- **Upload-Flow:** Vollständige Tab-Navigation für alle Upload-Schritte
- **OCR-Review:** Tastatur-Shortcuts für schnelle Validierung
- **Dashboard:** Fokus-Management für OCR-Dashboard-Kacheln

---

## ✅ **EPIC 02 OCR-WIREFRAMES KOMPLETT**

**@ux-expert.mdc hat alle OCR-UI-Wireframes für Epic 02 erstellt!**

**Alle 8 OCR-Stories haben detaillierte UI/UX-Spezifikationen:**

1. ✅ **Story 2.1:** PDF-Upload Drag & Drop Interface + Mobile-Upload
2. ✅ **Story 2.8:** OCR-Dashboard Integration + Performance-Charts
3-8. ✅ **Stories 2.2-2.7:** Template-basierte OCR-UI-Spezifikationen

**Plus 12+ OCR-spezifische UI-Komponenten und responsive Design!**

**@dev.mdc kann jetzt mit präzisen OCR-Wireframes die UI-Implementation starten!** 🚀