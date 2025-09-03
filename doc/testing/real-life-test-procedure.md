# Real-Life Test Procedure - Budget Manager 2025

**Test-Datum:** 2025-09-01  
**Test-Typ:** End-to-End Real-Life Test mit echten Projektdaten  
**Ziel:** Vollständige System-Validierung mit 500.000€ Budget + 30+ Projekte + OCR-Integration

## 🎯 **Test-Ziele**

1. **500.000€ Jahresbudget** erstellen und verwalten
2. **30+ Projekte** aus `projektuebersicht_2025.json` anlegen
3. **Entitäten-Management** (Lieferanten, Teams, Kategorien, Tags)
4. **OCR-Rechnungsverarbeitung** mit echten PDFs aus `uploads/new-suppliers`
5. **Budget-Dynamiken** und automatische Synchronisation testen
6. **Projekt-Zuweisungen** und Budget-Auswirkungen validieren

## 📝 **Test-Ablauf (Schritt-für-Schritt)**

### **Phase 1: System-Vorbereitung**
1. **Datenbank leeren**
   ```sql
   DELETE FROM invoice_positions;
   DELETE FROM invoices;
   DELETE FROM ocr_review_sessions;
   DELETE FROM projects;
   DELETE FROM annual_budgets;
   ```

2. **Frontend starten**
   ```bash
   cd frontend && npm run dev
   ```

3. **Backend prüfen**
   - Backend läuft auf Port 3001
   - Logs zeigen "System aktiv"

### **Phase 2: Authentication & Setup**
4. **Test-User erstellen** (falls nötig)
   ```sql
   INSERT INTO auth.users (...) VALUES (...);
   INSERT INTO user_profiles (...) VALUES (...);
   ```

5. **Login durchführen**
   - URL: `http://localhost:3000`
   - User: `realtest@budgetmanager.com`
   - Pass: `RealLifeTest2025!`

### **Phase 3: Budget-Management**
6. **Jahresbudget erstellen**
   - Navigation: Budget-Verwaltung
   - Neues Budget: 500.000€ für 2025
   - Status: Aktiv
   - Beschreibung: "Real-Life Test Budget 2025"

### **Phase 4: Entitäten-Management**
7. **Stammdaten prüfen/erstellen**
   - Kategorien: IT & Digitalisierung, Marketing, etc.
   - Teams: Design, Content, Development, etc.
   - Lieferanten: DEFINE® Design & Marketing GmbH, etc.
   - Tags: High Priority, Website, Mobile, etc.

### **Phase 5: Projekt-Erstellung**
8. **Projekte aus JSON anlegen**
   - Quelle: `projektuebersicht_2025.json`
   - Erstes Projekt: "Website - MyInnoSpace"
   - Budget: 75.000€
   - Kategorie: IT & Digitalisierung
   - Priorität: Hoch
   - Zeitraum: 2025-04-01 bis 2025-12-31

9. **Weitere Projekte**
   - "Website - Kalender/Eventseite" (15.000€)
   - "Website - Mobile App" (45.000€)
   - "Produktkonfigurator" (55.000€)
   - etc. (insgesamt 30+ Projekte)

### **Phase 6: OCR-Integration**
10. **Rechnungen hochladen**
    - Quelle: `uploads/new-suppliers/`
    - Test-PDFs für verschiedene Lieferanten
    - OCR-Erkennung und Datenextraktion

11. **Projekt-Zuweisungen**
    - Rechnungspositionen zu Projekten zuweisen
    - Budget-Auswirkungen prüfen
    - Automatische Synchronisation testen

### **Phase 7: Validierung**
12. **Budget-Dynamiken prüfen**
    - Jahresbudget: 500.000€ Total
    - Allokiert: Summe aller Projektbudgets
    - Verbraucht: Summe aller Rechnungspositionen
    - Verfügbar: Total - Allokiert

13. **System-Integration testen**
    - Dashboard-Updates
    - Real-time Synchronisation
    - 3D Budget-Tracking
    - Transfer-System

## ✅ **Erfolgs-Kriterien**

### **Kritisch (Must-Have)**
- [ ] Login funktioniert
- [ ] Budget 500.000€ erstellt
- [ ] Mindestens 5 Projekte angelegt
- [ ] Budget-Synchronisation funktioniert
- [ ] OCR-Upload funktioniert

### **Wichtig (Should-Have)**
- [ ] Alle 30+ Projekte angelegt
- [ ] Alle Rechnungen verarbeitet
- [ ] Projekt-Zuweisungen korrekt
- [ ] Dashboard zeigt korrekte Daten
- [ ] Performance unter 2 Sekunden

### **Optional (Nice-to-Have)**
- [ ] Admin-Funktionen über UI
- [ ] Erweiterte Filter/Suche
- [ ] Export-Funktionen
- [ ] Mobile Responsiveness

## 🔧 **Bekannte Workarounds**

1. **Budget-Erstellung 500 Error**
   ```sql
   INSERT INTO annual_budgets (year, total_budget, ...) VALUES (2025, 500000, ...);
   ```

2. **Projekt-Erstellung 400 Error**
   ```sql
   INSERT INTO projects (name, planned_budget, ...) VALUES (...);
   ```

3. **Admin-Zugriff fehlt**
   ```sql
   UPDATE user_profiles SET role = 'SUPERADMIN' WHERE email = '...';
   ```

## 📊 **Test-Metriken**

- **Erfolgsrate:** X/Y Schritte (Z%)
- **Performance:** Durchschnittliche Ladezeit
- **Fehlerrate:** Anzahl kritischer Fehler
- **Benutzerfreundlichkeit:** Subjektive Bewertung

## 🚀 **Nach Test-Abschluss**

1. **Ergebnisse dokumentieren** in `real-life-test-results.md`
2. **Kritische Fehler** in Issue-Liste aufnehmen
3. **Performance-Metriken** sammeln
4. **Verbesserungsvorschläge** erstellen
5. **Nächste Test-Iteration** planen

---
**Letzte Aktualisierung:** 2025-09-01  
**Status:** Bereit für Wiederholung nach Fehlerbehebung




