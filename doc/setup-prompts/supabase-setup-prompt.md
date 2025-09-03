# Supabase Setup - LLM Prompt

## Kopiere diesen Prompt in deine bevorzugte LLM (Claude, GPT-4, etc.):

---

**Ich benötige eine detaillierte, schritt-für-schritt Anleitung für das Setup von Supabase für ein Budget-Management-System. Hier sind die Details:**

**Projekt-Kontext:**
- Budget Manager 2025 - Deutsches Budget-Management-System
- Full-Stack: Node.js Backend + React Frontend
- Datenbank: PostgreSQL (über Supabase)
- Storage: PDF-Uploads für Rechnungsverarbeitung
- Authentifizierung: Supabase Auth mit RBAC
- Ziel: Skalierbare Backend-as-a-Service-Lösung

**Technische Anforderungen:**
- PostgreSQL-Datenbank mit deutschen Geschäftsdaten
- Storage-Buckets für PDF-Uploads (bis 50MB)
- Row Level Security (RLS) für Multi-Team-Zugriff
- Real-time Updates via WebSockets
- API-Endpoints für Budget-Management
- Backup und Recovery-Strategien

**Setup-Ziele:**
1. Supabase Account erstellen und konfigurieren
2. Neues Projekt "bdgt-2025" anlegen
3. PostgreSQL-Datenbank-Schema einrichten
4. Storage-Buckets für verschiedene Dateitypen konfigurieren
5. Row Level Security (RLS) für Teams implementieren
6. API-Keys für Frontend/Backend generieren
7. Datenbank-Migrationen vorbereiten
8. Monitoring und Logging einrichten

**Datenbank-Schema (Haupttabellen):**
- `annual_budgets` - Jahresbudgets mit deutschen Feldern
- `projects` - Geschäftsprojekte mit Team-Zuordnung
- `project_budget_tracking` - 3D-Budget-Tracking
- `invoices` - Rechnungen mit OCR-Daten
- `teams` - Team-Management mit RBAC
- `kategorien` - Deutsche Geschäftstaxonomien

**Besondere Anforderungen:**
- Deutsche Geschäftsstandards und Compliance
- Multi-Team-Zugriffskontrolle
- Skalierbarkeit für 1000+ Projekte
- Real-time Dashboard-Updates
- Audit-Trail für alle Änderungen
- Backup-Strategien für Geschäftsdaten

**Bitte gib mir:**
- Schritt-für-Schritt Anleitung mit Screenshots
- SQL-Schema für alle Tabellen
- RLS-Policies für Team-basierte Sicherheit
- Storage-Bucket-Konfiguration
- API-Integration mit Node.js
- Best Practices für Production-Setup
- Sicherheits-Checkliste
- Performance-Optimierungstipps

**Ich bin ein erfahrener Full-Stack-Entwickler, aber neu bei Supabase. Die Anleitung sollte sowohl für Setup als auch für die Node.js-Integration detailliert sein.**

---

## Verwendung:
1. Kopiere den obigen Prompt in deine bevorzugte LLM
2. Die LLM wird dir eine detaillierte Setup-Anleitung geben
3. Folge den Schritten systematisch
4. Bei Fragen: Verwende den gleichen Prompt mit spezifischen Problemen

## Erwartete Ausgabe:
- Vollständige Supabase-Setup-Anleitung
- SQL-Schema für alle Tabellen
- RLS-Policies für Sicherheit
- Storage-Konfiguration
- Node.js-Integration
- Best Practices und Sicherheitstipps