# Technische Annahmen - Budget Manager 2025

## Kern-Technologie-Stack

**Backend-Framework:** Node.js mit Express.js für schnelle Entwicklung und JavaScript-Ökosystem-Konsistenz
- **Begründung:** Starke OCR-Library-Unterstützung, exzellente JSON-Handhabung, reifes Ökosystem für Dateiverarbeitung

**Datenbank:** PostgreSQL mit Redis-Caching-Layer  
- **Begründung:** ACID-Compliance für Finanztransaktionen, komplexe Query-Unterstützung für dreidimensionales Budget-Tracking, JSON-Unterstützung für flexible Projektmetadaten

**Frontend:** React.js mit TypeScript für Typsicherheit in Finanzberechnungen
- **Begründung:** Komponenten-Wiederverwendbarkeit für Dashboard-Widgets, exzellentes Charting-Library-Ökosystem, TypeScript verhindert Berechnungsfehler

**Dateispeicher:** **Supabase Storage für Rechnungs-PDF-Speicherung**
- **Begründung:** Integriert mit Supabase-Ökosystem, kosteneffektiv für MVP, automatische Bildoptimierung, einfache API-Integration

## KI und OCR-Services

**Primäres OCR:** Google Cloud Vision API mit AWS Textract Fallback
- **Begründung:** Deutsche Sprachoptimierung, strukturierte Datenextraktion, hybrider Ansatz für Zuverlässigkeit

**Dokument-Preprocessing:** Sharp.js für Bildoptimierung und PDF.js für Textextraktion
- **Begründung:** Verbesserung der OCR-Genauigkeit durch Bildverbesserung, Handhabung gemischter Dokumenttypen

**Pattern Learning:** Benutzerdefinierte Machine Learning Pipeline mit TensorFlow.js für lieferantenspezifische Mustererkennung
- **Begründung:** Browser-kompatible Modellausführung, inkrementelles Lernen aus Benutzerkorrekturen

## Infrastruktur und Deployment

**Cloud-Plattform:** **MVP läuft auf lokalem PC mit Docker-Containerisierung, Skalierungspfad zu Supabase-Cloud-Infrastruktur**
- **Begründung:** Null Cloud-Kosten für MVP-Entwicklung und -Testing, einfacher Übergang zu Supabase-Hosting bei Skalierungsanforderungen

**Container-Strategie:** Docker für Entwicklungskonsistenz und zukünftige Deployment-Portabilität
- **Begründung:** Konsistente Umgebung über lokale Entwicklung und zukünftiges Cloud-Deployment

**Monitoring:** Anwendungslogging mit Winston.js lokal, Upgrade zu umfassendem Monitoring bei Cloud-Skalierung
- **Begründung:** Kosteneffektives Monitoring für MVP, etablierter Upgrade-Pfad für Produktions-Monitoring

## Integration und Kommunikation

**E-Mail-Service:** Lokales SMTP-Relay für Entwicklung, Supabase Edge Functions mit Resend für Produktion
- **Begründung:** Keine externen Service-Kosten während MVP, sauberer Übergang zu produktionstauglichem E-Mail-Service

**Webex-Integration:** Webex REST API für Team-Benachrichtigungen  
- **Begründung:** Direkte Integration wie in Anforderungen spezifiziert

**API-Architektur:** RESTful APIs mit potenziellem GraphQL für komplexe Dashboard-Queries
- **Begründung:** REST für CRUD-Operationen, GraphQL-Bedarf basierend auf tatsächlicher Dashboard-Query-Komplexität bewerten

## Sicherheit und Compliance

**Authentifizierung:** Supabase Auth mit JWT-Tokens
- **Begründung:** Integriertes Authentifizierungssystem, sichere Token-Verwaltung, eingebaute Benutzerverwaltung

**Verschlüsselung:** Supabase eingebaute Verschlüsselung für Daten im Ruhezustand, TLS 1.3 für Daten in Übertragung
- **Begründung:** Finanz-grade Sicherheitsstandards in Supabase-Plattform enthalten

**Zugriffskontrolle:** Supabase Row Level Security (RLS) mit benutzerdefinierter RBAC-Implementierung
- **Begründung:** Datenbank-Level-Sicherheit für Multi-Team-Umgebung mit feinkörnigen Berechtigungen

## Entwicklung und Qualität

**Versionskontrolle:** Git mit GitHub für Repository-Management und Basic CI/CD
- **Begründung:** Kosteneffektiv für MVP, integriert gut mit lokalem Entwicklungsworkflow

**Test-Strategie:** Jest für Unit-Testing, Playwright für End-to-End-Testing, automatisiertes Rechnungsverarbeitungs-Testing
- **Begründung:** Hohe Testabdeckung erforderlich für Finanzberechnungen und OCR-Genauigkeit

**Code-Qualität:** ESLint, Prettier für Entwicklungsstandards
- **Begründung:** Wartbare Codebase-Grundlage für Finanzsoftware

## Performance und Skalierbarkeit

**Caching-Strategie:** Redis für lokales Caching, Supabase Realtime für Dashboard-Updates
- **Begründung:** Lokales Redis für Entwicklungsperformance, Supabase Realtime für Live-Dashboard-Updates

**Hintergrundverarbeitung:** Node.js Worker Threads für OCR-Verarbeitung (lokales MVP), Upgrade zu Cloud Functions bei Skalierung
- **Begründung:** Handhabung der Rechnungsverarbeitung ohne externe Service-Abhängigkeiten im MVP

**Datenbank-Optimierung:** Supabase PostgreSQL mit eingebautem Connection Pooling und Indexierung
- **Begründung:** Verwaltete Datenbankperformance ohne Infrastruktur-Management-Overhead

## Skalierungsstrategie

**MVP zu Produktion Pfad:**
1. **Lokales MVP:** Alle Services containerisiert und lokal für Entwicklung/Testing laufend
2. **Supabase Migration:** Datenbank-, Auth-, Storage- und Edge Functions-Migration
3. **Cloud-Skalierung:** Horizontale Skalierung mit Supabase-Infrastruktur bei wachsender Nutzung