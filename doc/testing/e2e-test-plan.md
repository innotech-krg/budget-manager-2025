# Budget Manager 2025 - End-to-End Testplan
## Vollständiger System-Test vom 1. September 2025

### 🎯 **TESTZIELE**

1. **Vollständige Workflow-Validierung**: Von Budget-Erstellung bis Rechnungsverarbeitung
2. **Datenbank-Integrität**: Alle Operationen über echte Datenbank, keine Mock-Daten
3. **System-Stabilität**: Keine Fehler, alle Features funktional
4. **Performance-Validierung**: Akzeptable Ladezeiten und Responsivität

### 📋 **TEST-VORBEREITUNG**

#### **Datenbank-Cleanup:**
```sql
-- Budget-Tabellen leeren für sauberen Test
DELETE FROM budget_transfers WHERE id IS NOT NULL;
DELETE FROM project_budgets WHERE id IS NOT NULL;
DELETE FROM budgets WHERE id IS NOT NULL;
DELETE FROM projects WHERE id IS NOT NULL;

-- Test-Rechnungen entfernen
DELETE FROM invoice_positions WHERE id IS NOT NULL;
DELETE FROM invoices WHERE filename LIKE 'test_%';
```

#### **Test-Daten vorbereiten:**
- ✅ Lieferanten: 5 österreichische Unternehmen vorhanden
- ✅ Teams: Mindestens 2 Teams mit verschiedenen Rollen
- ✅ Kategorien: Projekt-Kategorien verfügbar
- ✅ System-Prompts: Universelle und lieferantenspezifische Prompts

### 🚀 **TEST-SZENARIEN**

## **SZENARIO 1: BUDGET-MANAGEMENT WORKFLOW**

### **1.1 Budget-Erstellung**
- [ ] **Schritt 1**: Neues Budget "Test Projekt 2025" erstellen
  - Budget-Name: "Test Projekt 2025"
  - Gesamtbudget: €50.000
  - Kategorie: "Software-Entwicklung"
  - Zeitraum: Q1 2025
- [ ] **Erwartung**: Budget wird in Datenbank gespeichert
- [ ] **Validierung**: Budget erscheint im Dashboard mit korrekten Werten

### **1.2 Budget-Kategorien zuweisen**
- [ ] **Schritt 2**: Budget-Kategorien definieren
  - Personal: €30.000 (60%)
  - Infrastruktur: €15.000 (30%)
  - Marketing: €5.000 (10%)
- [ ] **Erwartung**: 3D-Budget-Tracking zeigt korrekte Verteilung
- [ ] **Validierung**: Ampel-System zeigt grün (🟢) für alle Kategorien

### **1.3 Budget-Dashboard Monitoring**
- [ ] **Schritt 3**: Dashboard-Metriken prüfen
- [ ] **Erwartung**: Real-time Updates über WebSocket
- [ ] **Validierung**: Alle Werte korrekt, keine Mock-Daten

## **SZENARIO 2: PROJEKT-MANAGEMENT WORKFLOW**

### **2.1 Projekt-Erstellung**
- [ ] **Schritt 4**: Neues Projekt erstellen
  - Projekt-Name: "Budget Manager Enhancement"
  - Budget-Zuordnung: "Test Projekt 2025"
  - Team-Zuordnung: "Development Team"
  - Geplantes Budget: €25.000
- [ ] **Erwartung**: Projekt wird mit Budget verknüpft
- [ ] **Validierung**: Budget-Dashboard zeigt Zuordnung (€25.000 zugewiesen)

### **2.2 Team-Zuordnung**
- [ ] **Schritt 5**: Teams und Rollen zuweisen
  - Senior Frontend Dev: 2 Personen
  - Junior Backend Dev: 1 Person
  - Projekt Manager: 1 Person
- [ ] **Erwartung**: Team-Kosten werden automatisch berechnet
- [ ] **Validierung**: Stundensätze aus `rollen_stammdaten` korrekt angewendet

### **2.3 Budget-Anpassung**
- [ ] **Schritt 6**: Budget-Monitoring prüfen
- [ ] **Erwartung**: Verfügbares Budget reduziert sich um €25.000
- [ ] **Validierung**: 3D-Tracking zeigt "Zugewiesen: €25.000"

## **SZENARIO 3: OCR & RECHNUNGSVERARBEITUNG**

### **3.1 Lieferanten-Management**
- [ ] **Schritt 7**: Neuen Lieferanten anlegen
  - Name: "Test Software GmbH"
  - UID: "ATU99999999"
  - Adresse: "Teststraße 1, 1010 Wien"
- [ ] **Erwartung**: Lieferant wird in Datenbank gespeichert
- [ ] **Validierung**: Lieferant erscheint in Dropdown-Listen

### **3.2 Lieferantenspezifischen Prompt erstellen**
- [ ] **Schritt 8**: KI-Management → System-Prompts
  - Kategorie: "SUPPLIER_PROCESSING"
  - Lieferant: "Test Software GmbH"
  - Prompt: Spezifische Software-Lizenz-Erkennung
- [ ] **Erwartung**: Prompt wird mit supplier_id verknüpft
- [ ] **Validierung**: Prompt erscheint in Liste mit Lieferanten-Zuordnung

### **3.3 Rechnung hochladen und verarbeiten**
- [ ] **Schritt 9**: Test-Rechnung hochladen
  - Datei: PDF mit Software-Lizenz-Rechnung
  - Lieferant: "Test Software GmbH"
- [ ] **Erwartung**: Zweistufiger OCR-Prozess
  1. Lieferanten-Erkennung (SUPPLIER_RECOGNITION)
  2. Spezifische Verarbeitung (SUPPLIER_PROCESSING)
- [ ] **Validierung**: OCR-Daten korrekt extrahiert und in `invoices` gespeichert

### **3.4 Rechnungsposition-Zuordnung**
- [ ] **Schritt 10**: Rechnungspositionen Projekt zuordnen
  - Position: "Software-Lizenz 2025"
  - Betrag: €2.500
  - Projekt: "Budget Manager Enhancement"
- [ ] **Erwartung**: Position wird Projekt zugeordnet
- [ ] **Validierung**: Budget-Verbrauch wird automatisch aktualisiert

## **SZENARIO 4: BUDGET-TRANSFER WORKFLOW**

### **4.1 Budget-Transfer beantragen**
- [ ] **Schritt 11**: Transfer zwischen Budget-Kategorien
  - Von: "Marketing" (€5.000)
  - Nach: "Personal" (€3.000)
  - Grund: "Zusätzliche Entwickler-Ressourcen"
- [ ] **Erwartung**: Transfer-Antrag wird erstellt (Status: PENDING)
- [ ] **Validierung**: E-Mail-Benachrichtigung an SuperAdmin

### **4.2 Transfer genehmigen**
- [ ] **Schritt 12**: Als SuperAdmin Transfer genehmigen
- [ ] **Erwartung**: Status ändert sich zu APPROVED
- [ ] **Validierung**: Budget-Verteilung wird automatisch angepasst

### **4.3 Audit-Trail prüfen**
- [ ] **Schritt 13**: Transfer-Historie überprüfen
- [ ] **Erwartung**: Vollständiger Audit-Trail in Datenbank
- [ ] **Validierung**: Alle Änderungen nachvollziehbar dokumentiert

## **SZENARIO 5: SYSTEM-INTEGRATION & MONITORING**

### **5.1 Real-time Dashboard**
- [ ] **Schritt 14**: Dashboard-Updates prüfen
- [ ] **Erwartung**: WebSocket-Updates in Echtzeit
- [ ] **Validierung**: Alle Änderungen sofort sichtbar

### **5.2 KI-Management Dashboard**
- [ ] **Schritt 15**: OCR-Qualitäts-Metriken prüfen
- [ ] **Erwartung**: Echte Daten aus verarbeiteten Rechnungen
- [ ] **Validierung**: Keine Mock-Daten, korrekte Confidence-Scores

### **5.3 System-Logs & Monitoring**
- [ ] **Schritt 16**: Logs & Monitoring überprüfen
- [ ] **Erwartung**: Strukturierte Logs für alle Operationen
- [ ] **Validierung**: Keine Fehler, Performance-Metriken im grünen Bereich

## **SZENARIO 6: DATENBANK-INTEGRITÄT**

### **6.1 Referentielle Integrität**
- [ ] **Schritt 17**: Datenbank-Konsistenz prüfen
- [ ] **Erwartung**: Alle Foreign Keys korrekt verknüpft
- [ ] **Validierung**: Keine verwaisten Datensätze

### **6.2 Transaktions-Sicherheit**
- [ ] **Schritt 18**: Concurrent Operations testen
- [ ] **Erwartung**: ACID-Eigenschaften gewährleistet
- [ ] **Validierung**: Keine Race Conditions oder Datenkorruption

---

## 📊 **ERFOLGS-KRITERIEN**

### **Funktionale Kriterien:**
- [ ] Alle 18 Test-Schritte erfolgreich abgeschlossen
- [ ] Keine Fehler in Browser-Konsole
- [ ] Alle Daten korrekt in Datenbank gespeichert
- [ ] Real-time Updates funktionieren

### **Performance-Kriterien:**
- [ ] Seitenladezeiten < 3 Sekunden
- [ ] API-Response-Zeiten < 1 Sekunde
- [ ] OCR-Verarbeitung < 30 Sekunden
- [ ] WebSocket-Updates < 100ms Latenz

### **Qualitäts-Kriterien:**
- [ ] Keine Mock-Daten verwendet
- [ ] Vollständige Datenbank-Integration
- [ ] Konsistente UX über alle Features
- [ ] Responsive Design auf verschiedenen Bildschirmgrößen

---

## 📝 **TEST-PROTOKOLL**

### **Test-Durchführung:**
- **Datum**: 1. September 2025
- **Tester**: AI Assistant
- **Browser**: Chrome 139.0.0.0
- **Umgebung**: Development (localhost:3000)

### **Ergebnisse werden dokumentiert in:**
- `doc/testing/e2e-test-results.md`
- Screenshots in `doc/testing/screenshots/`
- Performance-Metriken in `doc/testing/performance-report.md`

---

*Testplan erstellt am: 1. September 2025*
*Version: 1.0*
*Nächste Überprüfung: Nach jedem Major Release*





