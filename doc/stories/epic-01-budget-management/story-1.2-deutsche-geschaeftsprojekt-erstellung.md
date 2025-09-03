# Story 1.2: Deutsche Geschäftsprojekt-Erstellung

**Epic:** 1 - Kern-Budget-Management-System  
**Story Points:** 13  
**Sprint:** 1-2  
**Priorität:** Höchste  
**Status:** Ready for Development

## User Story

**Als** Projektmanager  
**möchte ich** Projekte mit vollständigen deutschen Geschäftsmetadaten erstellen  
**damit** ich alle relevanten Projektinformationen strukturiert erfassen kann

## Akzeptanzkriterien

- [ ] Ich kann Projekte mit allen deutschen Pflichtfeldern erstellen:
  - [ ] Kategorie, Start-/Enddatum, Team, Projektname, Kurzbeschreibung
  - [ ] Priorität, Kostenart, Dienstleister (optional), Impact-Level
- [ ] Das System generiert automatisch eindeutige Projektnummern (WD-2025-001)
- [ ] Durchlaufzeit wird automatisch aus Datumsspanne berechnet
- [ ] Ich kann interne Stunden nach Teams erfassen (Design/Content/Dev)
- [ ] Ich kann flexible Tags für zusätzliche Kategorisierung hinzufügen
- [ ] Projekt-Validierung verhindert ungültige Daten (Ende nach Start, etc.)
- [ ] Ich kann Projekt-Details in einem Modal/Overlay anzeigen lassen
- [ ] Die Details-Ansicht zeigt alle Projektinformationen übersichtlich an

## Technische Tasks

### Backend
- [ ] PostgreSQL-Schema für deutsche Geschäftsfelder
- [ ] Master-Data-Tabellen (Kategorien, Teams, Kostenarten, etc.)
- [ ] Automatische Projektnummer-Generierung (Trigger)
- [ ] Durchlaufzeit-Berechnung (Backend-Service)
- [ ] Projekt-CRUD-API mit deutscher Validierung

### Frontend
- [ ] React-Formular mit deutschen Geschäftsfeldern
- [ ] Dropdown-Komponenten für Master-Data-Auswahl
- [ ] Automatische Durchlaufzeit-Anzeige
- [ ] Tag-Input-Komponente
- [ ] Deutsche Validierungsmeldungen
- [ ] Projekt-Details-Modal mit vollständiger Informationsanzeige

## Definition of Done

- [ ] Alle deutschen Geschäftsfelder erfassbar
- [ ] Automatische Projektnummer-Generierung funktioniert
- [ ] Validierung entspricht deutschen Geschäftsregeln
- [ ] UI ist vollständig auf Deutsch
- [ ] Master-Data-Integration funktional
- [ ] Tests haben 80%+ Coverage

## Abhängigkeiten

**Blockiert von:** Story 1.1 (Jahresbudget muss existieren)  
**Blockiert:** Story 1.3, 1.4, 1.5

## Notizen

- Projektnummer-Format: WD-YYYY-NNN (z.B. WD-2025-001)
- Durchlaufzeit in Wochen, automatisch berechnet
- Dienstleister ist optional, andere Felder sind Pflicht
- Tags sind freitext, aber mit Vorschlägen aus bestehenden Tags