# Story 1.4: Budget-Transfer-System

**Epic:** 1 - Kern-Budget-Management-System  
**Story Points:** 21  
**Sprint:** 2-3  
**Priorität:** Hoch  
**Status:** Ready for Development

## User Story

**Als** Projektmanager  
**möchte ich** Budget zwischen Projekten transferieren können  
**damit** ich flexibel auf Projektänderungen reagieren kann

## Akzeptanzkriterien

- [ ] Ich kann Budget-Transfer zwischen Projekten beantragen
- [ ] **EXPLIZITE REGEL:** Alle Transfers erfordern manuelle Genehmigung
- [ ] Transfer-Antrag enthält: Von-Projekt, Zu-Projekt, Betrag, Begründung
- [ ] Genehmigungs-Workflow mit E-Mail-Benachrichtigungen
- [ ] Vollständiger Audit-Trail für alle Budget-Bewegungen
- [ ] Transfer-Historie ist einsehbar und filterbar
- [ ] Transfers können vor Genehmigung storniert werden

## Technische Tasks

### Backend
- [ ] `budget_transfers` Tabelle mit Workflow-Status
- [ ] Transfer-Antrags-API (CREATE, READ, UPDATE, DELETE)
- [ ] Genehmigungslogik mit RBAC-Prüfung
- [ ] E-Mail-Benachrichtigungs-Service (Nodemailer)
- [ ] Audit-Trail-Implementierung
- [ ] Transfer-Status-Update-API

### Frontend
- [ ] Transfer-Antrags-Formular
- [ ] Genehmigungsworkflow-Interface
- [ ] Transfer-Historie-Dashboard
- [ ] E-Mail-Template-Komponenten
- [ ] Status-Tracking-Komponente

## Definition of Done

- [ ] Transfer-Workflow funktioniert Ende-zu-Ende
- [ ] Genehmigungsberechtigungen korrekt implementiert
- [ ] Alle Budget-Bewegungen sind nachvollziehbar
- [ ] E-Mail-Benachrichtigungen werden versendet
- [ ] Audit-Trail ist vollständig und unveränderlich
- [ ] Tests haben 80%+ Coverage

## Abhängigkeiten

**Blockiert von:** Story 1.1, 1.2, 1.3 (Budget-Tracking muss funktionieren)  
**Blockiert:** Keine

## Notizen

- **KEINE automatischen Transfers** - immer manuelle Genehmigung
- Transfer-Status: PENDING → APPROVED/REJECTED/CANCELLED
- E-Mail-Benachrichtigungen an Antragsteller und Genehmiger
- Audit-Trail mit Unveränderlichkeits-Schutz (PostgreSQL Trigger)
- Genehmigungsberechtigungen über RBAC-System