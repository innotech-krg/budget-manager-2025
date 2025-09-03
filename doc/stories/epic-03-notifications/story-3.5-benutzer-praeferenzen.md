# Story 3.5: Benutzer-Benachrichtigungspräferenzen

**Epic:** 3 - Benachrichtigungs- & Warnsystem  
**Story Points:** 8  
**Sprint:** Epic 3.2  
**Priorität:** Mittel  
**Status:** Ready for Development

## User Story

**Als** Benutzer  
**möchte ich** meine Benachrichtigungseinstellungen personalisieren können  
**damit** ich nur relevante Benachrichtigungen in gewünschten Kanälen erhalte

## Akzeptanzkriterien

- [ ] Ich kann E-Mail-Benachrichtigungen aktivieren/deaktivieren
- [ ] Ich kann Webex-Benachrichtigungen konfigurieren
- [ ] Ich kann Benachrichtigungstypen einzeln steuern (Budget-Warnungen, Genehmigungen, etc.)
- [ ] Ich kann Benachrichtigungs-Häufigkeit konfigurieren (sofort, täglich, wöchentlich)
- [ ] Team-spezifische Benachrichtigungseinstellungen
- [ ] Quiet-Hours-Konfiguration für Benachrichtigungen
- [ ] Präferenzen werden sofort wirksam

## Technische Tasks

### Backend
- [ ] Benutzer-Präferenz-Datenmodell
- [ ] Präferenz-CRUD-APIs
- [ ] Integration mit E-Mail- und Webex-Services
- [ ] Benachrichtigungstyp-Kategorisierung
- [ ] Quiet-Hours-Implementierung
- [ ] Real-time Präferenz-Updates

### Database
- [ ] `user_notification_preferences` Tabelle
- [ ] Benachrichtigungstyp-Kategorien
- [ ] Quiet-Hours-Konfiguration
- [ ] Team-spezifische Präferenzen

### Frontend
- [ ] Präferenz-Management-UI im User-Profile
- [ ] Benachrichtigungstyp-Checkboxes
- [ ] Häufigkeits-Konfiguration
- [ ] Quiet-Hours-Time-Picker
- [ ] Präferenz-Vorschau und -Test

## Definition of Done

- [ ] Benutzer können alle Benachrichtigungstypen konfigurieren
- [ ] Häufigkeits-Einstellungen funktionieren korrekt
- [ ] Quiet-Hours werden respektiert
- [ ] Team-spezifische Einstellungen funktional
- [ ] Präferenz-Änderungen sind sofort wirksam
- [ ] Tests haben 80%+ Coverage

## Abhängigkeiten

**Blockiert von:** Story 3.2 (E-Mail-System), Story 3.3 (Webex-System)  
**Blockiert:** Keine

## Notizen

- Granulare Kontrolle über Benachrichtigungstypen
- Quiet-Hours für Work-Life-Balance
- Team-spezifische Präferenzen für verschiedene Projekte
- Real-time Updates ohne Page-Refresh
- Präferenz-Test-Funktionalität für Benutzer-Validierung