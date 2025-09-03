# Epic-Aufschlüsselung - Budget Manager 2025

## Epic 1: Kern-Budget-Management-System
**Priorität:** Kritisch | **Geschätzte Dauer:** 5-7 Wochen
**Scope:** Jahresbudget-Erstellung, umfassendes Projektmanagement mit detaillierten deutschen Geschäftsfeldern, dreidimensionales Budget-Tracking, Dashboard

**Schlüssel-Features:**
- Jahresbudget-Setup mit konfigurierbarer Reserve-Allokation (Standard 10%)
- **Umfassendes Projektmanagement:**
  - Auto-generierte eindeutige Projektnummern (Nr.)
  - Vollständiges Projektmetadaten-Schema:
    - Kategorie, Start-/Enddatum, Team, Projektname, Kurzbeschreibung
    - Priorität, Durchlaufzeit (Wochen) - auto-berechnet aus Daten
    - Kostenart, Dienstleister, Impact-Level
    - **Detailliertes Kosten-Tracking:**
      - Reale Kosten, Externe Kosten (Summe)
      - Interne Stunden (Design), Interne Stunden (Content), etc.
      - Impact für den Unternehmenserfolg (Textfeld)
      - Anmerkung (Notizen/Kommentare)
      - Flexible Tag-Felder für zusätzliche Kategorisierung
- Dreidimensionales Budget-Tracking (Veranschlagt/Zugewiesen/Verbraucht)
- **Budget-Transfer-System:**
  - **EXPLIZITE REGEL: Keine automatischen Transfers** - alle Transfers erfordern manuelle Genehmigung
  - Freiwillige Budget-Transfers zwischen Projekten mit Genehmigungsworkflow
  - Budget-Überschreitungs-Erlaubnis (mit Warnungen) solange Gesamt-Jahresbudget nicht überschritten
  - Vollständiger Audit-Trail für alle Budget-Bewegungen
- Projekt-Bearbeitungsfunktionen für alle Felder nach Erstellung
- Echtzeit-Dashboard mit Budget-Übersicht und Projektportfolio-Status

**Abhängigkeiten:** Supabase Datenbankschema-Design, detaillierte deutsche Geschäftsanforderungen, Kern-Authentifizierung
**Erfolgskriterien:** Benutzer können Projekte mit vollständigen deutschen Geschäftsmetadaten erstellen, komplexe Budget-Beziehungen verwalten, interne Stunden nach Teams tracken

## Epic 2: Rechnungsverarbeitung & OCR-Integration
**Priorität:** Hoch | **Geschätzte Dauer:** 5-7 Wochen  
**Scope:** PDF-Upload, OCR-Verarbeitung, KI-unterstützte Projektzuordnung, **Lieferanten-Kostenfilterung**

**Schlüssel-Features:**
- PDF-Rechnungs-Upload und -Speicherung (Supabase Storage)
- OCR-Verarbeitung mit Google Cloud Vision API Integration
- **Erweiterte KI-Features:**
  - KI-gestützte Positionsvorschlags-Engine
  - **Lieferantenspezifische Lernmuster mit Management-Interface**
  - Pattern-Reset-Funktionen bei Bedarf
  - Benutzer-Feedback-Loop für Pattern-Verbesserung
- Granulare Projekt/Team-Zuordnungs-Interface mit **Lead-Zuordnungsfunktion**
- **Einzelne Rechnungspositionen können verschiedenen Teams zugeordnet werden** (nicht nur Lead-Team)
- **Kostenfilterung nach Lieferant/Dienstleister** für Analyse und Reporting
- Manuelle Korrektur- und Genehmigungsworkflows
- **OBLIGATORISCH: Alle KI-Vorschläge erfordern manuelle Bestätigung** - keine automatische Annahme

**Abhängigkeiten:** Epic 1 vollständig (detaillierte Projektstruktur), externe OCR API Setup, Lieferanten-Stammdaten
**Erfolgskriterien:** Verarbeitung von Rechnungen mit 85%+ Genauigkeit, granulare Team-Zuordnung, zuverlässiges Lieferanten-Pattern-Learning

## Epic 3: Benachrichtigungs- & Warnsystem
**Priorität:** Mittel | **Geschätzte Dauer:** 3-4 Wochen
**Scope:** Automatisierte Budget-Warnungen, E-Mail-Benachrichtigungen, Webex-Integration, **erweiterte Workflow-Benachrichtigungen**

**Schlüssel-Features:**
- Konfigurierbare Budget-Schwellenwert-Warnungen (Standard: 80% WARNUNG, 90% KRITISCH, 100% KRITISCH)
- Echtzeit-visuelle Indikatoren und Dashboard-Alerts
- **Erweitertes Benachrichtigungssystem:**
  - **Benachrichtigungs- und Genehmigungsworkflows**
  - Automatisierte E-Mail-Benachrichtigungen für Budget-Schwellenwerte
  - **Supervisor-Genehmigungsworkflow für Budget-Anpassungen**
  - Webex-Benachrichtigungen für teamspezifische Budget-Ereignisse
- E-Mail-Benachrichtigungssystem mit SMTP-Integration
- Benachrichtigungspräferenzen und -verwaltung nach Benutzer/Team

**Abhängigkeiten:** Epic 1 vollständig (Budget-Tracking), Epic 5 (Benutzerrollen für Genehmigungsworkflows)
**Erfolgskriterien:** Benutzer erhalten angemessene Warnungen, Genehmigungsworkflows funktionieren ordnungsgemäß, Webex-Integration funktioniert zuverlässig

## Epic 4: Erweiterte Dashboard & Reporting
**Priorität:** Mittel | **Geschätzte Dauer:** 4-5 Wochen
**Scope:** Erweitertes Dashboard mit Drill-Down, Burn-Rate-Analyse, **deutsche Geschäfts-Reporting-Standards**

**Schlüssel-Features:**
- Interaktives Dashboard mit Drill-Down-Funktionalität
- **Deutsches Geschäfts-Reporting:**
  - Burn-Rate-Analyse und Forecasting-Charts
  - Vordefinierte deutsche Report-Templates (Monatsabschluss, Quartalsberichte, Jahresübersicht)
  - Custom Report Builder mit deutschen Geschäftsfiltern
- **Erweiterte Analyse-Ansichten:**
  - Kostenanalyse nach Lieferant/Dienstleister
  - Interne Stunden-Tracking und Reporting nach Teams
  - Projekt-Impact-Analyse und ROI-Berechnungen
- PDF, Excel, CSV Export-Funktionen mit deutscher Formatierung
- Performance-Optimierung für große Datensätze und komplexe deutsche Geschäftsabfragen

**Abhängigkeiten:** Epic 1 & 2 vollständig (umfassende Datenbasis), deutsche Geschäftslogik-Implementierung
**Erfolgskriterien:** Dashboard lädt <3 Sekunden, deutsche Berichte generieren akkurat, interne Stunden-Tracking funktioniert ordnungsgemäß

## Epic 5: Stammdaten-Management & Administration
**Priorität:** Mittel | **Geschätzte Dauer:** 3-4 Wochen
**Scope:** Administrative Interfaces für **vollständige deutsche Geschäftstaxonomie**, Benutzerverwaltung, **umfassender Import/Export**

**Schlüssel-Features:**
- **Vollständige Globale Taxonomie-Verwaltung:**
  - Kategorien, Teams, Prioritäten, Kostenarten, Dienstleister, Impact-Levels, Tags
  - **Admin-kontrollierte Erstellung und Bearbeitung** aller Taxonomie-Werte
  - Verwendet für Filterung, Analyse und Business Intelligence
- Rollenbasierte Zugriffskontrolle (RBAC) Administration
- Benutzerverwaltung und Berechtigungszuweisung
- **Erweiterter Import/Export:**
  - **JSON und CSV Projekt-Import** mit Validierung und Fehlerberichterstattung
  - Stammdaten Import/Export-Funktionen
  - Template-Generierung für ordnungsgemäßes Import-Format
- System-Konfiguration und Einstellungsverwaltung
- Audit-Trail und Änderungs-Tracking für alle administrativen Aktionen

**Abhängigkeiten:** Kern-System-Funktionalität (Epic 1), Authentifizierungssystem, deutsche Geschäftsanforderungen
**Erfolgskriterien:** Alle deutschen Geschäftstaxonomien verwaltbar, Projekt-Import funktioniert zuverlässig, ordnungsgemäße Zugriffskontrollen durchgesetzt

## Epic 6: KI-Insights & Erweiterte Analytik
**Priorität:** Niedrig | **Geschätzte Dauer:** 4-6 Wochen
**Scope:** **Deutsche Business Intelligence**, Budget-Forecasting, Anomalieerkennung, **Lieferantenanalyse**

**Schlüssel-Features:**
- **KI-gestützte Deutsche Geschäftsanalyse:**
  - Budget-Forecasting basierend auf historischen deutschen Geschäftsmustern
  - **Ausgabenanomalien-Identifikation** und Reporting
  - Predictive Analytics für Projekt-Budget-Überschreitungen
  - **Lieferanten-Kostenanalyse** und Optimierungsvorschläge
- **Historische Datenanalyse:**
  - **Analyse historischer Daten für nächstes Geschäftsjahr Budget-Vorschläge**
  - Mustererkennung in deutschen Geschäftszyklen
  - Saisonale Analyse für deutschen Geschäftskalender
- Vertrauensbewertung für KI-Vorhersagen mit deutschem Geschäftskontext
- Erweiterte Visualisierung deutscher Geschäftseinblicke

**Abhängigkeiten:** 6+ Monate historische deutsche Geschäftsdaten, Epic 2 vollständig (Lieferantenmuster), Machine Learning Modell-Training
**Erfolgskriterien:** KI bietet bedeutungsvolle deutsche Geschäftseinblicke, **historische Analyse generiert nützliche Budget-Vorschläge**, Lieferantenoptimierung funktioniert effektiv