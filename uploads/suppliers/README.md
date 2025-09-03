# 📁 Lieferanten-Rechnungen für OCR-Training

## 🎯 **Zweck**
Dieser Ordner dient zur **automatischen Lieferanten-Erkennung** und **Pattern-Learning** für deutsche Geschäftsrechnungen.

## 📂 **Ordner-Struktur**

### `new-suppliers/`
**Hier legen Sie Rechnungen von NEUEN Lieferanten ab:**
- Das System erkennt automatisch den Lieferanten aus der Rechnung
- Legt den Lieferanten in der Datenbank an (falls noch nicht vorhanden)
- Startet das Pattern-Learning für diesen Lieferanten

### `training-data/`
**Hier werden automatisch Trainings-Daten gespeichert:**
- Vom System erkannte Lieferanten-Patterns
- Korrigierte OCR-Ergebnisse
- Optimierte Erkennungsregeln

## 📄 **Unterstützte Dateiformate**
- **PDF**: Geschäftsrechnungen (empfohlen)
- **JPG/JPEG**: Gescannte Rechnungen
- **PNG**: Screenshots oder digitale Rechnungen

## 🔄 **Workflow**

1. **Rechnung hochladen** → `new-suppliers/`
2. **OCR-Verarbeitung** → Tesseract.js (optimiert für Deutsch)
3. **Lieferanten-Erkennung** → Automatische Extraktion von:
   - Firmenname
   - Adresse
   - Steuernummer/USt-IdNr
   - Logo-Merkmale
4. **Lieferant anlegen** → Falls neu in Datenbank
5. **Pattern-Learning** → Speichert Erkennungsregeln für zukünftige Rechnungen

## 📊 **Deutsche Geschäftsdaten-Erkennung**

Das System erkennt automatisch:
- **Rechnungsnummer**: R-2024-001, RG123, etc.
- **Beträge**: 1.234,56 €, EUR 1234.56
- **Daten**: 15.12.2024, 15.12.24
- **Steuernummern**: DE123456789, 123/456/789
- **Firmeninformationen**: Name, Adresse, Kontakt

## ⚠️ **Datenschutz-Hinweise**

- **Nur Geschäftsrechnungen** verwenden (keine privaten Dokumente)
- **Anonymisierung** empfohlen für Testzwecke
- **Echte Geschäftsdaten** nur in produktiver Umgebung
- **Backup** wichtiger Originaldokumente vor Upload

## 🚀 **Erste Schritte**

1. Legen Sie 3-5 Rechnungen eines Lieferanten in `new-suppliers/` ab
2. Starten Sie das OCR-System über die Web-Oberfläche
3. Das System lernt automatisch die Lieferanten-Patterns
4. Zukünftige Rechnungen dieses Lieferanten werden automatisch erkannt

## 📈 **Optimierung**

- **Mehr Rechnungen** = Bessere Erkennung
- **Verschiedene Formate** des gleichen Lieferanten helfen beim Learning
- **Korrekturen** über die Web-Oberfläche verbessern die Genauigkeit

---

**Epic 2: OCR & Intelligente Rechnungsverarbeitung**  
*Budget Manager 2025 - Deutsche Geschäfts-Compliance*

