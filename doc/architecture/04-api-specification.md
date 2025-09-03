# API-Spezifikation - Budget Manager 2025

Die API folgt RESTful-Prinzipien mit deutschen geschäftsspezifischen Endpunkten:

## Kern-Endpunkte

### Authentifizierung
- `POST /auth/login` - Benutzer-Authentifizierung mit JWT-Tokens
- `POST /auth/refresh` - Token-Erneuerung
- `POST /auth/logout` - Benutzer-Abmeldung
- `GET /auth/me` - Aktuelle Benutzerinformationen

### Jahresbudgets
- `GET /budgets` - Liste der Jahresbudgets mit Filterung
  - Query-Parameter: `year`, `status`, `createdBy`
- `POST /budgets` - Neues Jahresbudget erstellen
- `GET /budgets/{id}` - Spezifisches Budget abrufen
- `PUT /budgets/{id}` - Budget aktualisieren
- `DELETE /budgets/{id}` - Budget löschen (nur DRAFT-Status)

### Deutsche Geschäftsprojekte
- `GET /projects` - Projekte mit deutschen Geschäftsfiltern auflisten
  - Query-Parameter: `kategorie`, `team`, `priorität`, `status`, `startDatum`, `endDatum`
- `POST /projects` - Projekt mit deutschen Geschäftsfeldern erstellen (erweitert für Multi-Dienstleister)
- `GET /projects/{id}` - Detaillierte Projektansicht
- `PUT /projects/{id}` - Projekt mit Validierung aktualisieren
- `DELETE /projects/{id}` - Projekt löschen (mit Abhängigkeitsprüfung)
- `GET /projects/{id}/budget-history` - Budget-Änderungshistorie
- `GET /projects/{id}/internal-hours` - Interne Stunden nach Teams

#### Multi-Dienstleister-Management
- `GET /projects/{id}/suppliers` - Alle Projekt-Dienstleister (aktiv + entfernt)
- `POST /projects/{id}/suppliers` - Dienstleister zu Projekt hinzufügen
- `PUT /projects/{id}/suppliers/{supplierId}` - Dienstleister-Budget aktualisieren
- `DELETE /projects/{id}/suppliers/{supplierId}` - Dienstleister entfernen (intelligente Budget-Logik)

#### Budget-Übersicht und Validierung
- `GET /projects/{id}/budget-summary` - Vollständige Budget-Übersicht (extern/intern/Jahresbudget-Auswirkung)
- `GET /projects/{id}/validation-status` - Projekt-Validierungs-Status
- `GET /projects/{id}/audit-log` - Vollständiger Audit-Trail

### Budget-Transfers
- `POST /projects/{id}/budget-transfers` - Budget-Transfer anfordern
- `GET /budget-transfers` - Alle Transfers mit Status-Filter
- `GET /budget-transfers/{id}` - Transfer-Details
- `POST /budget-transfers/{id}/approve` - Transfer genehmigen
- `POST /budget-transfers/{id}/reject` - Transfer ablehnen
- `GET /budget-transfers/pending` - Ausstehende Genehmigungen

### Rechnungsverarbeitung
- `POST /invoices/upload` - Rechnung für OCR-Verarbeitung hochladen
- `GET /invoices` - Rechnungen mit Status-Filter auflisten
- `GET /invoices/{id}` - OCR-Ergebnisse und KI-Vorschläge abrufen
- `POST /invoices/{id}/process` - OCR-Verarbeitung manuell starten
- `POST /invoices/{id}/line-items/{itemId}/assign` - Zu Projekt/Team zuordnen
- `PUT /invoices/{id}/line-items/{itemId}` - Positionsdetails aktualisieren
- `POST /invoices/{id}/validate` - Manuelle Validierung abschließen

### Dashboard
- `GET /dashboard/summary` - Echtzeit-Dashboard-Daten
  - Jahresbudget-Übersicht
  - Projekt-Portfolio-Status
  - Aktuelle Warnungen
  - Burn-Rate-Metriken
- `GET /dashboard/warnings` - Aktuelle Budget-Warnungen
- `GET /dashboard/recent-activity` - Letzte Aktivitäten
- `GET /dashboard/team-summary/{teamId}` - Teamspezifische Übersicht

### Deutsche Geschäftsberichte
- `GET /reports/monatsabschluss` - Deutsche Monatsberichte
  - Query-Parameter: `year`, `month`, `team`, `kategorie`
- `GET /reports/quartalsberichte` - Quartalsberichte
- `GET /reports/jahresuebersicht` - Jahresübersicht
- `POST /reports/custom` - Benutzerdefinierte Berichte erstellen
- `GET /reports/{id}/export` - Bericht exportieren (PDF/Excel/CSV)

### Stammdaten-Verwaltung (Erweitert für Projekt-Management)

#### Lieferanten/Suppliers (Multi-Dienstleister-System)
- `GET /api/suppliers` - Liste aller Lieferanten
  - Query-Parameter: `active=true` (nur aktive), `include_deleted=true` (alle)
- `POST /api/suppliers` - Neuen Lieferanten erstellen (Inline-Creation unterstützt)
- `PUT /api/suppliers/{id}` - Lieferanten aktualisieren
- `DELETE /api/suppliers/{id}` - Lieferanten löschen (soft delete)

#### Tags (Inline-Creation)
- `GET /api/tags` - Liste aller Tags
  - Query-Parameter: `active=true` (nur aktive), `include_deleted=true` (alle)
- `POST /api/tags` - Neuen Tag erstellen (Inline-Creation unterstützt)
- `PUT /api/tags/{id}` - Tag aktualisieren
- `DELETE /api/tags/{id}` - Tag löschen (soft delete)

#### Teams mit Rollen-Zuordnung (Inline-Creation)
- `GET /api/teams` - Liste aller Teams
  - Query-Parameter: `active=true` (nur aktive), `include_deleted=true` (alle)
- `POST /api/teams` - Neues Team erstellen (mit Rollen-Auswahl, Inline-Creation unterstützt)
- `PUT /api/teams/{id}` - Team aktualisieren
- `DELETE /api/teams/{id}` - Team löschen (soft delete)

#### Rollen (Master Data)
- `GET /api/rollen-stammdaten` - Liste aller Master-Rollen
- `POST /api/rollen-stammdaten` - Neue Master-Rolle erstellen
- `PUT /api/rollen-stammdaten/{id}` - Master-Rolle aktualisieren
- `DELETE /api/rollen-stammdaten/{id}` - Master-Rolle löschen

#### Team-Rollen-Zuordnung
- `GET /api/team-rollen` - Liste aller Team-Rollen-Zuordnungen
- `POST /api/team-rollen` - Team-Rolle zuordnen
- `DELETE /api/team-rollen/{teamId}/{rolleId}` - Team-Rolle entfernen

#### Kategorien (Inline-Creation)
- `GET /api/categories` - Liste aller Projektkategorien
  - Query-Parameter: `active=true` (nur aktive), `include_deleted=true` (alle)
- `POST /api/categories` - Neue Kategorie erstellen (Inline-Creation unterstützt)
- `PUT /api/categories/{id}` - Kategorie aktualisieren
- `DELETE /api/categories/{id}` - Kategorie löschen (soft delete)

#### Audit-Trail für Entitäten
- `GET /api/admin/audit-log` - Vollständiger Audit-Trail
  - Query-Parameter: `entity_type`, `entity_id`, `action`, `date_from`, `date_to`
- `GET /api/admin/audit-log/{entity_type}/{entity_id}` - Audit-Trail für spezifische Entität

### Import/Export
- `POST /import/projects` - JSON/CSV-Projekt-Import
  - Multipart-Form mit Datei und Validierungsoptionen
- `GET /import/projects/{importId}/status` - Import-Status prüfen
- `GET /import/templates/projects` - Import-Template herunterladen
- `POST /export/projects` - Projekt-Daten exportieren
- `POST /export/master-data` - Stammdaten exportieren

### OCR & KI-Services
- `GET /ocr/providers/status` - OCR-Service-Verfügbarkeit
- `POST /ocr/patterns/reset/{supplierId}` - Lieferanten-Pattern zurücksetzen
- `GET /ocr/patterns/{supplierId}` - Pattern-Details abrufen
- `POST /ai/retrain` - KI-Modell mit Benutzer-Feedback neu trainieren
- `GET /ai/suggestions/{invoiceId}` - KI-Vorschläge für Rechnung

### Benachrichtigungen
- `GET /notifications` - Benutzer-Benachrichtigungen
- `POST /notifications/{id}/mark-read` - Als gelesen markieren
- `PUT /notifications/preferences` - Benachrichtigungseinstellungen
- `POST /notifications/test-webex` - Webex-Integration testen

## WebSocket-Events

### Budget-bezogene Events
- `budget-warning` - Echtzeit-Budget-Schwellenwert-Alerts
  ```json
  {
    "type": "budget-warning",
    "projectId": "uuid",
    "warningLevel": "WARNING|CRITICAL",
    "currentUsage": 85.5,
    "threshold": 80,
    "message": "Projekt XYZ hat 85% des zugewiesenen Budgets erreicht"
  }
  ```

- `project-budget-update` - Live-Budget-Änderungen
  ```json
  {
    "type": "project-budget-update", 
    "projectId": "uuid",
    "budgetTracking": {
      "veranschlagtBudget": 10000,
      "zugewiesenBudget": 8000,
      "verbrauchtBudget": 6800,
      "budgetStatus": "WARNING"
    }
  }
  ```

### Verarbeitungs-Events
- `invoice-processed` - OCR-Abschluss-Benachrichtigungen
  ```json
  {
    "type": "invoice-processed",
    "invoiceId": "uuid",
    "status": "COMPLETED|FAILED",
    "ocrConfidence": 92.5,
    "aiSuggestionsCount": 3
  }
  ```

### Team-Events
- `team-notification` - Multi-Team-Alerts
  ```json
  {
    "type": "team-notification",
    "teamId": "uuid",
    "message": "Budget-Transfer von Projekt A zu Projekt B genehmigt",
    "priority": "HIGH|MEDIUM|LOW",
    "actionRequired": true
  }
  ```

## API-Response-Formate

### Erfolgreiche Antworten
```json
{
  "success": true,
  "data": {
    // Antwortdaten
  },
  "meta": {
    "timestamp": "2025-01-28T10:30:00Z",
    "requestId": "uuid"
  }
}
```

### Fehler-Antworten
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Projektstartdatum kann nicht in der Vergangenheit liegen",
    "details": {
      "field": "startDatum",
      "value": "2024-01-15",
      "constraint": "future_date"
    }
  },
  "meta": {
    "timestamp": "2025-01-28T10:30:00Z",
    "requestId": "uuid"
  }
}
```

### Paginierte Antworten
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 150,
    "totalPages": 6,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Authentifizierung & Autorisierung

### JWT-Token-Struktur
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "PROJECT_MANAGER|TEAM_LEAD|ADMIN",
  "teams": ["design", "content", "dev"],
  "permissions": [
    "budget:read",
    "budget:write", 
    "project:create",
    "transfer:approve"
  ],
  "exp": 1643723400,
  "iat": 1643637000
}
```

### RBAC-Berechtigungen
- `budget:read` - Budget-Daten lesen
- `budget:write` - Budget-Änderungen vornehmen
- `budget:transfer` - Budget-Transfers initiieren
- `budget:approve` - Transfers genehmigen
- `project:create` - Neue Projekte erstellen
- `project:edit` - Projektdaten bearbeiten
- `project:delete` - Projekte löschen
- `invoice:process` - Rechnungen verarbeiten
- `master-data:admin` - Stammdaten verwalten
- `reports:generate` - Berichte erstellen

## Rate Limiting & Caching

### Rate Limits
- Allgemeine API-Aufrufe: 1000 Anfragen/Stunde pro Benutzer
- OCR-Verarbeitung: 50 Uploads/Stunde pro Benutzer
- Export-Generierung: 10 Berichte/Stunde pro Benutzer
- WebSocket-Verbindungen: 5 gleichzeitige Verbindungen pro Benutzer

### Caching-Strategie
- Dashboard-Daten: 30 Sekunden Cache
- Stammdaten: 5 Minuten Cache
- Berichte: 15 Minuten Cache
- OCR-Ergebnisse: Permanent bis zur Validierung