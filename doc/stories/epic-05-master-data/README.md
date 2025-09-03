# Epic 5: Master Data Management & Administration - Stories

**Epic-Priorität:** Mittel (aber kritisch für Epic 2)  
**Geschätzte Dauer:** 3-4 Wochen  
**Gesamt Story Points:** 76

## Story-Übersicht

| Story | Titel | Story Points | Sprint | Status | Abhängigkeiten |
|-------|-------|--------------|--------|--------|----------------|
| 5.1 | [Deutsche Geschäftstaxonomie-Verwaltung](story-5.1-deutsche-geschaeftstaxonomie-verwaltung.md) | 13 | Epic 5.1 | Ready | Epic 1 |
| 5.2 | [Team-Management mit RBAC](story-5.2-team-management-rbac.md) | 8 | Epic 5.1 | Ready | Story 5.1 |
| 5.3 | [Dienstleister-Management mit OCR](story-5.3-dienstleister-management-ocr.md) | 13 | Epic 5.1-5.2 | Ready | Story 5.1 |
| 5.4 | [Import/Export-System](story-5.4-import-export-system.md) | 13 | Epic 5.2 | Ready | Story 5.1, 5.2, 5.3 |
| 5.5 | [Projekt-Import mit Validierung](story-5.5-projekt-import-deutsche-validierung.md) | 21 | Epic 5.2-5.3 | Ready | Story 5.4, Epic 1 |
| 5.6 | [Master-Data-Admin-Dashboard](story-5.6-master-data-admin-dashboard.md) | 8 | Epic 5.3 | Ready | Alle anderen |

## Sprint-Planung

### Sprint Epic 5.1 (Wochen 1-2)
- **Story 5.1:** Deutsche Geschäftstaxonomie-Verwaltung (13 SP)
- **Story 5.2:** Team-Management mit RBAC (8 SP)
- **Story 5.3:** Dienstleister-Management (Start, 6 SP)
- **Gesamt:** 27 Story Points

### Sprint Epic 5.2 (Wochen 2-3)
- **Story 5.3:** Dienstleister-Management (Abschluss, 7 SP)
- **Story 5.4:** Import/Export-System (13 SP)
- **Story 5.5:** Projekt-Import (Start, 10 SP)
- **Gesamt:** 30 Story Points

### Sprint Epic 5.3 (Wochen 3-4)
- **Story 5.5:** Projekt-Import (Abschluss, 11 SP)
- **Story 5.6:** Master-Data-Admin-Dashboard (8 SP)
- **Gesamt:** 19 Story Points

## Kritische Abhängigkeiten für andere Epics

### Epic 2 (OCR Integration) - BLOCKIERT BIS:
- ✅ Story 5.1: Taxonomien müssen existieren
- ✅ Story 5.3: Dienstleister-Daten für OCR-Pattern-Learning

### Epic 1 (Budget Management) - PROFITIERT VON:
- ✅ Story 5.2: RBAC für Budget-Transfer-Genehmigungen
- ✅ Story 5.5: Projekt-Import für Datenmigration

## Technische Abhängigkeiten

### Database Schema
- Master-Data-Tabellen (Story 5.1, 5.2, 5.3)
- Foreign Key-Referenzen zu Epic 1 Tabellen
- Audit-Trail-Integration

### API Layer
- CRUD-APIs für alle Master-Data-Entitäten
- RBAC-Middleware für Berechtigungsprüfungen
- Import/Export-APIs mit Batch-Processing

### Frontend Components
- Admin-Interfaces für alle Taxonomien
- Import/Export-Workflows
- Dashboard-Komponenten mit Statistiken

## Business Value

**Sofortiger Nutzen:**
- Konsistente deutsche Geschäftsdaten
- Rollenbasierte Zugriffskontrolle
- Datenmigration und Backup-Fähigkeiten

**Langfristiger Nutzen:**
- Grundlage für OCR-Optimierung (Epic 2)
- Skalierbare Master-Data-Verwaltung
- Audit-konforme Datenhistorie

## Risiken & Mitigation

**Risiko:** Master-Data-Komplexität unterschätzt
**Mitigation:** Iterative Entwicklung mit Stakeholder-Feedback

**Risiko:** RBAC-Integration zu komplex
**Mitigation:** Einfaches Team-basiertes RBAC, nicht Benutzer-basiert

**Risiko:** Import/Export-Performance
**Mitigation:** Batch-Processing und Progress-Tracking

## Akzeptanzkriterien Epic-Level

Nach Abschluss aller Stories:
- ✅ Alle deutschen Geschäftstaxonomien zentral verwaltbar
- ✅ RBAC-System funktional für Team-Berechtigungen
- ✅ Dienstleister-Daten bereit für OCR-Integration
- ✅ Import/Export für Datenmigration verfügbar
- ✅ Admin-Dashboard für effiziente Verwaltung