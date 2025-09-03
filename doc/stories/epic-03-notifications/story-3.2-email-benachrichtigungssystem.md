# Story 3.2: E-Mail-Benachrichtigungssystem

**Epic:** 3 - Benachrichtigungs- & Warnsystem  
**Story Points:** 13  
**Sprint:** Epic 3.1  
**Priorität:** Hoch  
**Status:** Ready for Development

## User Story

**Als** Benutzer  
**möchte ich** E-Mail-Benachrichtigungen bei kritischen Budget-Ereignissen erhalten  
**damit** ich zeitnah auf Budget-Probleme reagieren kann

## Akzeptanzkriterien

- [ ] System sendet E-Mails bei Budget-Schwellenwert-Überschreitungen
- [ ] Deutsche E-Mail-Templates für verschiedene Warning-Levels
- [ ] Personalisierte E-Mails mit Projekt- und Budget-Details
- [ ] Team-spezifische Benachrichtigungen basierend auf Projekt-Zuordnung
- [ ] E-Mail-Zustellungs-Bestätigung und Retry-Mechanismus
- [ ] Benutzer können E-Mail-Präferenzen konfigurieren
- [ ] Batch-E-Mails für mehrere Warnungen vermeiden Spam

## Technische Tasks

### Backend
- [ ] E-Mail-Service mit Nodemailer + SMTP-Integration
- [ ] Deutsche E-Mail-Templates für Budget-Warnungen
- [ ] Personalisierungs-Engine für E-Mail-Inhalte
- [ ] Team-basierte E-Mail-Routing-Logic
- [ ] E-Mail-Delivery-Tracking und Retry-System
- [ ] Benutzer-Präferenz-Management für E-Mail-Benachrichtigungen

### Templates
- [ ] HTML/Text E-Mail-Templates auf Deutsch
- [ ] Template-Personalisierung (Projektname, Budget-Details, etc.)
- [ ] Warning-Level-spezifische Templates
- [ ] Team-spezifische E-Mail-Anpassungen

### Frontend
- [ ] E-Mail-Präferenz-Konfiguration im User-Profile
- [ ] E-Mail-Template-Vorschau für Administratoren
- [ ] E-Mail-Delivery-Status-Anzeige

## Definition of Done

- [ ] E-Mail-Versendung funktioniert zuverlässig
- [ ] Deutsche Templates sind professionell und informativ
- [ ] Personalisierung funktioniert korrekt
- [ ] Team-basiertes Routing funktional
- [ ] Delivery-Tracking und Retry-Mechanismus implementiert
- [ ] Tests haben 80%+ Coverage

## Abhängigkeiten

**Blockiert von:** Story 3.1 (Budget-Monitoring), Epic 5 Story 5.2 (Team-Management)  
**Blockiert:** Story 3.4 (Workflow-Benachrichtigungen nutzen E-Mail-System)

## Notizen

- SMTP für MVP, später Upgrade zu Supabase Edge Functions + Resend
- Deutsche E-Mail-Templates mit professionellem Corporate Design
- Team-basierte Routing-Logic für relevante Benachrichtigungen
- Retry-Mechanismus für failed E-Mail-Delivery
- Spam-Schutz durch intelligente Batching