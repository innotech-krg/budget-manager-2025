# Funktionale Anforderungen - Budget Manager 2025

## Funktionale Anforderungen

**FR1:** Das System soll die **Erstellung und Verwaltung von Jahresbudgets** unterstützen mit:
- **UI-Wizard:** 4-Schritt Budget-Erstellungs-Dialog (Jahr, Betrag, Reserve, Bestätigung)
- **Deutsche EUR-Formatierung:** €1.250.000,00 mit Tausendertrennzeichen
- **Reserve-Slider:** Visuelle 5-20% Reservenzuteilung (Standard 10%)
- **Budget-Kachel:** Dashboard-Integration mit Status-Ampelsystem

**FR2:** Das System soll **Deutsche Geschäftsprojekt-Erstellung** ermöglichen mit:
- **3-Schritt-Wizard:** Grunddaten, Deutsche Geschäftsfelder, Budget-Zuordnung
- **Deutsche Geschäftsfelder:** Kostenstelle, Profit Center, Geschäftsbereich
- **Drag & Drop Budget-Zuteilung:** Visuelle Budget-Kategorien-Zuordnung
- **Team-Integration:** Automatische Team-Zuordnung mit Benutzer-Mapping
- **Projekt-Karten:** Dashboard-Integration mit Budget-Status-Anzeige

**FR3:** Das System soll dreidimensionales Budget-Tracking pro Projekt unterstützen: Veranschlagtes Budget (geplant), Zugewiesenes Budget (zugewiesen) und Verbrauchtes Budget (verbraucht)

**FR4:** Das System soll Projekten erlauben, ihr zugewiesenes Budget mit visuellen Warnungen zu überschreiten, vorausgesetzt das gesamte Jahresbudget wird nicht überschritten

**FR5:** Das System soll freiwillige Budget-Transfers zwischen Projekten mit Audit-Trail und Genehmigungsworkflow ermöglichen

**FR6:** Das System soll automatisierte Budget-Warnungen bei konfigurierbaren Schwellenwerten bereitstellen (Standard: 80% WARNUNG, 90% KRITISCH, 100% KRITISCH)

**FR7:** Das System soll **PDF-Rechnungs-Uploads** verarbeiten mit:
- **Drag & Drop Upload-Interface:** Supabase Storage Integration
- **OCR-Processing-UI:** Side-by-Side Dokument-Vorschau und Ergebnis-Panel
- **Progress-Tracking:** Visuelle OCR-Verarbeitungs-Fortschrittsanzeige
- **Hybrid OCR:** Google Cloud Vision (primär) + AWS Textract (Fallback)
- **Ergebnis-Validierung:** Manuelle Override-Kontrollen für alle OCR-Vorschläge

**FR8:** Das System soll KI-gestützte Vorschläge für Projektzuordnung von Rechnungsposten bereitstellen, mit obligatorischer menschlicher Validierung für alle Vorschläge

**FR9:** Das System soll granulare Zuordnung einzelner Rechnungspositionen zu verschiedenen Projekten und Teams unterstützen

**FR10:** Das System soll lieferantenspezifische Lernmuster für OCR-Verarbeitung mit Musterverwaltung und Reset-Funktionen implementieren

**FR11:** Das System soll zentralisierte Administration globaler Taxonomien bereitstellen (Kategorien, Teams, Prioritäten, Kostenarten, Lieferanten, Impact-Level, Tags)

**FR12:** Das System soll Projekt- und Budget-Datenimport via JSON- und CSV-Formate mit Validierung und Fehlerberichterstattung unterstützen

**FR13:** Das System soll ein **Echtzeit-Dashboard** bereitstellen mit:
- **Dashboard-Kacheln:** Anpassbare Budget-Übersicht, Projektportfolio-Status, Warnungen
- **3D Budget-Visualisierung:** Veranschlagt/Zugewiesen/Verbraucht in Echtzeit
- **Burn-Rate-Charts:** Interaktive Chart.js-Visualisierungen
- **Live-Aktivitäten-Feed:** WebSocket-basierte Echtzeit-Updates
- **Responsive Design:** Desktop (3-4 Spalten), Tablet (2 Spalten), Mobile (1 Spalte)

**FR14:** Das System soll vordefinierte Berichte (monatlich, vierteljährlich, jährlich) generieren und benutzerdefinierte Berichterstellung mit PDF/Excel/CSV-Export unterstützen

**FR15:** Das System soll Multi-Währungs-Operationen mit EUR als Standardwährung unterstützen

**FR16:** Das System soll E-Mail- und Webex-Benachrichtigungen für kritische Budget-Ereignisse und Warnungen senden

**FR17:** Das System soll Drill-Down-Funktionalität von Dashboard-Zusammenfassungen zu detaillierten Projekt- und Ausgabendaten bereitstellen

**FR18:** Das System soll umfassende Audit-Trails für alle Budget-Änderungen, Transfers und Genehmigungen pflegen