# Story 5.1: Deutsche Geschäftstaxonomie-Verwaltung

**Epic:** 5 - Master Data Management & Administration  
**Story Points:** 13  
**Sprint:** Epic 5.1  
**Priorität:** Kritisch  
**Status:** Ready for Development

## User Story

**Als** Administrator  
**möchte ich** alle deutschen Geschäftstaxonomien zentral verwalten können  
**damit** konsistente Datenqualität und Kategorisierung gewährleistet ist

## Akzeptanzkriterien

- [ ] Ich kann Kategorien erstellen, bearbeiten und deaktivieren
- [ ] Ich kann Teams mit RBAC-Berechtigungen verwalten
- [ ] Ich kann Kostenarten für Projektklassifikation definieren
- [ ] Ich kann Prioritäten und Impact-Levels konfigurieren
- [ ] Ich kann Dienstleister/Lieferanten mit Metadaten verwalten
- [ ] Alle Taxonomien haben Sortierungsreihenfolge
- [ ] Deaktivierte Einträge sind nicht mehr in Dropdown-Listen sichtbar
- [ ] Änderungen werden im Audit-Trail protokolliert

## Technische Tasks

### Backend
- [ ] Master-Data-Tabellen (kategorien, teams, kostenarten, prioritaeten, impact_levels)
- [ ] CRUD-APIs für alle Taxonomie-Entitäten
- [ ] Sortierung und Aktivierungs-Status-Management
- [ ] Audit-Trail-Integration für Änderungsverfolgung
- [ ] API-Endpunkte für Dropdown-Listen (nur aktive Einträge)

### Frontend
- [ ] Admin-Interface mit deutscher Lokalisierung
- [ ] Master-Data-Verwaltungskomponenten
- [ ] Sortierung per Drag & Drop
- [ ] Aktivierung/Deaktivierung-Toggle
- [ ] Audit-Trail-Anzeige

## Definition of Done

- [ ] Alle deutschen Geschäftstaxonomien verwaltbar
- [ ] CRUD-Operationen funktionieren für alle Entitäten
- [ ] Sortierung und Status-Management implementiert
- [ ] Audit-Trail protokolliert alle Änderungen
- [ ] UI vollständig auf Deutsch
- [ ] Tests haben 80%+ Coverage

## Abhängigkeiten

**Blockiert von:** Epic 1 (Basis-System muss existieren)  
**Blockiert:** Story 5.2, 5.3, Epic 2 (OCR-Integration)

## Notizen

- Taxonomien: Kategorien, Teams, Kostenarten, Prioritäten, Impact-Levels, Dienstleister
- Deaktivierte Einträge bleiben in DB, werden aber nicht in Dropdowns angezeigt
- Sortierungsreihenfolge wichtig für UX in Formularen
- Audit-Trail für Compliance-Anforderungen