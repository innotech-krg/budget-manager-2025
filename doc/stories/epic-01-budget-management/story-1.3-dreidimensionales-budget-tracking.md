# Story 1.3: Dreidimensionales Budget-Tracking

**Epic:** 1 - Kern-Budget-Management-System  
**Story Points:** 13  
**Sprint:** 2  
**Priorität:** Höchste  
**Status:** Ready for Development

## User Story

**Als** Projektmanager  
**möchte ich** für jedes Projekt drei Budget-Dimensionen verfolgen können  
**damit** ich klare Sicht auf Planung, Zuweisung und Verbrauch habe

## Akzeptanzkriterien

- [ ] Jedes Projekt hat drei Budget-Dimensionen:
  - [ ] **Veranschlagtes Budget** (geplant)
  - [ ] **Zugewiesenes Budget** (aus Jahresbudget zugewiesen)
  - [ ] **Verbrauchtes Budget** (tatsächlich ausgegeben)
- [ ] Das System berechnet automatisch Budget-Status:
  - [ ] HEALTHY (< 80% verbraucht)
  - [ ] WARNING (80-90% verbraucht)  
  - [ ] CRITICAL (90-100% verbraucht)
  - [ ] EXCEEDED (> 100% verbraucht)
- [ ] Visuelle Indikatoren zeigen Budget-Status (Ampel-System)
- [ ] Budget-Überschreitungen sind erlaubt, solange Jahresbudget nicht überschritten

## Technische Tasks

### Backend
- [ ] `project_budget_tracking` Tabelle mit berechneten Feldern
- [ ] Budget-Status-Update-Trigger (PostgreSQL)
- [ ] Budget-Berechnungs-Engine (Service-Layer)
- [ ] API-Endpunkte für Budget-Updates
- [ ] WebSocket-Events für Real-time Updates

### Frontend
- [ ] React-Komponenten für Budget-Visualisierung
- [ ] Progress-Bars mit deutschen Beschriftungen
- [ ] Ampel-System-Komponente (Grün/Gelb/Rot)
- [ ] WebSocket-Client für Real-time Updates
- [ ] Budget-Übersichts-Dashboard

## Definition of Done

- [ ] Alle drei Budget-Dimensionen funktional
- [ ] Automatische Status-Berechnung korrekt
- [ ] Visuelle Indikatoren intuitiv und klar
- [ ] Performance optimiert für große Projektanzahlen
- [ ] Real-time Updates funktionieren
- [ ] Tests haben 80%+ Coverage

## Abhängigkeiten

**Blockiert von:** Story 1.1 (Jahresbudget), Story 1.2 (Projekte)  
**Blockiert:** Story 1.4 (Budget-Transfers), Story 1.5 (Dashboard)

## Notizen

- Schwellenwerte: 80% Warning, 90% Critical, 100% Exceeded
- Status wird automatisch bei jeder Budget-Änderung neu berechnet
- WebSocket-Updates für alle aktiven Dashboard-Benutzer
- Performance-Optimierung durch PostgreSQL Materialized Views