# Story 5.2: Team-Management mit RBAC

**Epic:** 5 - Master Data Management & Administration  
**Story Points:** 8  
**Sprint:** Epic 5.1  
**Priorität:** Hoch  
**Status:** Ready for Development

## User Story

**Als** Administrator  
**möchte ich** Teams mit spezifischen Berechtigungen konfigurieren können  
**damit** rollenbasierte Zugriffskontrolle korrekt funktioniert

## Akzeptanzkriterien

- [ ] Ich kann Teams erstellen mit Namen und Beschreibung
- [ ] Ich kann RBAC-Berechtigungen pro Team konfigurieren:
  - [ ] `can_view_all_budgets` - Team kann alle Budgets einsehen
  - [ ] `can_transfer_budgets` - Team kann Budget-Transfers initiieren
  - [ ] `can_approve_transfers` - Team kann Transfers genehmigen
- [ ] Ich kann teamspezifische Einstellungen definieren:
  - [ ] Standard-Stundensatz für interne Kostenberechnung
  - [ ] Budget-Benachrichtigungs-Schwellenwert
- [ ] Team-Berechtigungen werden bei allen relevanten Operationen geprüft
- [ ] Änderungen an Team-Berechtigungen werden auditiert

## Technische Tasks

### Backend
- [ ] Erweiterte `teams` Tabelle mit RBAC-Feldern
- [ ] RBAC-Middleware für API-Endpunkt-Schutz
- [ ] Berechtigungsprüfungs-Service
- [ ] Integration in bestehende Budget- und Transfer-APIs
- [ ] Team-CRUD-API mit Berechtigungsvalidierung

### Frontend
- [ ] Team-Admin-Interface mit Berechtigungs-Checkboxen
- [ ] RBAC-Konfigurationsformular
- [ ] Teamspezifische Einstellungen-Interface
- [ ] Berechtigungs-Übersichts-Komponente

## Definition of Done

- [ ] Teams können mit allen RBAC-Berechtigungen konfiguriert werden
- [ ] Berechtigungsprüfungen funktionieren in allen relevanten APIs
- [ ] Teamspezifische Einstellungen sind konfigurierbar
- [ ] UI zeigt Berechtigungen klar und verständlich
- [ ] Audit-Trail protokolliert Berechtigungsänderungen
- [ ] Tests haben 80%+ Coverage

## Abhängigkeiten

**Blockiert von:** Story 5.1 (Master-Data-Grundlage)  
**Blockiert:** Epic 1 Story 1.4 (Budget-Transfers), Epic 3 (Notifications)

## Notizen

- RBAC-Berechtigungen auf Team-Level, nicht Benutzer-Level
- Standard-Stundensatz für interne Kostenschätzungen
- Budget-Benachrichtigungs-Schwellenwert pro Team konfigurierbar
- Berechtigungen werden bei jeder relevanten API-Operation geprüft