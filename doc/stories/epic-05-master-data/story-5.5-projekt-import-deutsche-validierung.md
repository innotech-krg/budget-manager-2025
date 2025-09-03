# Story 5.5: Projekt-Import mit deutscher Geschäftsvalidierung

**Epic:** 5 - Master Data Management & Administration  
**Story Points:** 21  
**Sprint:** Epic 5.2-5.3  
**Priorität:** Mittel  
**Status:** Ready for Development

## User Story

**Als** Administrator  
**möchte ich** Projekte mit vollständigen deutschen Geschäftsdaten importieren können  
**damit** bestehende Projektdaten migriert werden können

## Akzeptanzkriterien

- [ ] Ich kann Projekte via JSON/CSV mit allen deutschen Feldern importieren
- [ ] Import validiert gegen bestehende Master-Data (Kategorien, Teams, etc.)
- [ ] System generiert automatisch Projektnummern für importierte Projekte
- [ ] Import-Vorschau zeigt potenzielle Probleme vor tatsächlichem Import
- [ ] Fehlgeschlagene Imports werden mit detaillierten Fehlermeldungen dokumentiert
- [ ] Erfolgreich importierte Projekte sind sofort in System verfügbar
- [ ] Import unterstützt Update bestehender Projekte (basierend auf Projektnummer)

## Technische Tasks

### Backend
- [ ] Projekt-Import-Service mit deutscher Geschäftsvalidierung
- [ ] Master-Data-Referenz-Validierung
- [ ] Import-Vorschau-API
- [ ] Batch-Projekt-Import mit Rollback-Fähigkeit
- [ ] Integration mit Projektnummer-Generierung
- [ ] Update-Logik für bestehende Projekte

### Frontend
- [ ] Projekt-Import-Interface mit Vorschau
- [ ] Validierungsfehler-Anzeige
- [ ] Import-Progress-Tracking
- [ ] Template-Download für Projekt-Import
- [ ] Import-Historie-Anzeige

## Definition of Done

- [ ] Projekte können mit allen deutschen Geschäftsfeldern importiert werden
- [ ] Validierung gegen Master-Data funktioniert vollständig
- [ ] Projektnummer-Generierung funktioniert auch bei Import
- [ ] Import-Vorschau zeigt alle potentiellen Probleme
- [ ] Update-Funktionalität für bestehende Projekte
- [ ] Tests haben 80%+ Coverage

## Abhängigkeiten

**Blockiert von:** Story 5.4 (Import/Export-System), Epic 1 Story 1.2 (Projekt-System)  
**Blockiert:** Keine

## Notizen

- Import-Format muss alle deutschen Geschäftsfelder unterstützen
- Validierung gegen Kategorien, Teams, Kostenarten, etc.
- Projektnummer-Generierung auch bei Import-Projekten
- Update-Modus basierend auf eindeutiger Projektnummer
- Batch-Import für große Projektmengen optimiert
- Rollback bei kritischen Validierungsfehlern