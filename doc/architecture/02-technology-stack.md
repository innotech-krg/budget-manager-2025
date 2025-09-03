# Technologie-Stack - Budget Manager 2025

## Technologie-Stack

| Kategorie | Technologie | Version | Zweck | Begründung |
|----------|------------|---------|---------|-----------|
| **Backend Framework** | Node.js + Express.js | Node 18+ / Express 4.18+ | API-Server, Geschäftslogik, OCR-Verarbeitung | Starkes OCR-Library-Ökosystem, exzellente JSON-Handhabung, reife Dateiverarbeitungs-Funktionen, TypeScript-Kompatibilität |
| **Frontend Framework** | React.js | 18.2+ | Dashboard-UI, Echtzeit-Updates | Komponenten-Wiederverwendbarkeit für Dashboard-Widgets, exzellentes Charting-Library-Ökosystem, reife WebSocket-Integration |
| **Sprache** | TypeScript | 5.0+ | Typsicherheit über Full Stack | Verhindert Berechnungsfehler in Finanzsoftware, geteilte Typen zwischen Frontend/Backend, bessere Entwicklererfahrung |
| **Datenbank (Primär)** | PostgreSQL | 15+ | Finanztransaktionen, deutsche Geschäftsdaten | ACID-Compliance für Finanztransaktionen, komplexe Query-Unterstützung für 3D-Budget-Tracking, JSON-Unterstützung für flexible Projektmetadaten |
| **Datenbank (Cache)** | Redis | 7.0+ | Session-Management, Echtzeit-Caching | Sub-3-Sekunden Dashboard-Response-Anforderung, WebSocket-Session-Management, OCR-Ergebnis-Caching |
| **Dateispeicher** | Supabase Storage | Latest | Rechnungs-PDF-Speicherung, Pattern-Daten | Integriert mit Supabase-Ökosystem, kosteneffektiv für MVP, automatische Bildoptimierung, CDN-Funktionen |
| **Authentifizierung** | Supabase Auth | Latest | Benutzerverwaltung, JWT-Tokens | Integriertes Auth-System, sichere Token-Verwaltung, eingebaute RBAC-Grundlage, glatter Migrations-Pfad |
| **Echtzeit** | WebSocket (ws) | 8.13+ | Live-Dashboard-Updates, Benachrichtigungen | Echtzeit-Budget-Updates über Teams, kollaborative Bearbeitungs-Unterstützung, sofortige Warnungs-Bereitstellung |
| **OCR Primär** | Google Cloud Vision API | v1 | Deutsche Rechnungs-Textextraktion | Deutsche Sprachoptimierung, strukturierte Datenextraktion, hohe Genauigkeit für Geschäftsdokumente |
| **OCR Fallback** | AWS Textract | Latest | Backup-OCR-Verarbeitung | Hybride Zuverlässigkeits-Ansatz, verschiedene Stärken ergänzen Google Vision, Kostenoptimierung |
| **KI/ML** | TensorFlow.js | 4.0+ | Lieferanten-Pattern-Learning | Browser-kompatible Modellausführung, inkrementelles Lernen aus Benutzerkorrekturen, Offline-Fähigkeit |
| **Hintergrund-Jobs** | Bull Queue + Redis | 4.10+ | OCR-Verarbeitung, E-Mail-Versendung | Async-Rechnungsverarbeitung, verhindert UI-Blockierung, zuverlässige Job-Retry-Mechanismen |
| **API-Architektur** | REST + WebSocket | - | Client-Server-Kommunikation | REST für CRUD-Operationen, WebSocket für Echtzeit-Features, einfach und gut verstanden |
| **Containerisierung** | Docker + Docker Compose | Latest | Entwicklungskonsistenz | Identische Umgebung über lokal/Produktion, einfacher Skalierungs-Übergang, Service-Isolation |
| **E-Mail-Service** | Nodemailer + SMTP | 6.9+ | Budget-Warnungs-Benachrichtigungen | Lokales SMTP für MVP, produktionstaugliche E-Mail-Bereitstellung, Template-Unterstützung |
| **Team-Benachrichtigungen** | Webex REST API | v1 | Teambasierte Budget-Alerts | Direkte Integration wie in PRD-Anforderungen spezifiziert, Multi-Team-Benachrichtigungs-Unterstützung |
| **Formular-Handhabung** | React Hook Form | 7.45+ | Rechnungsverarbeitungs-Formulare, Projekterstellung | Performante Formular-Validierung, TypeScript-Integration, komplexe Formular-Workflows |
| **State Management** | Zustand | 4.4+ | Dashboard-State, Echtzeit-Updates | Leichtgewichtig, TypeScript-nativ, exzellente WebSocket-Integration, einfache Lernkurve |
| **Styling** | Tailwind CSS | 3.3+ | Responsive deutsche Geschäfts-UI | Utility-first für schnelle Entwicklung, exzellentes responsives Design, konsistentes Design-System |
| **Charts/Visualisierung** | Chart.js + React-Chartjs-2 | 4.4+ / 5.2+ | Budget-Dashboard, Burn-Rate-Analyse | Deutsche Geschäfts-Chart-Anforderungen, Echtzeit-Daten-Updates, umfangreiche Anpassung |
| **Testing (Frontend)** | Jest + React Testing Library | 29+ / 13+ | Komponenten- und Integrationstests | Finanzsoftware erfordert hohe Testabdeckung, benutzerverhalten-fokussiertes Testen |
| **Testing (Backend)** | Jest + Supertest | 29+ / 6.3+ | API- und Geschäftslogik-Tests | OCR-Pipeline-Testing, Finanzberechnungs-Validierung, Integrationstests |
| **Code-Qualität** | ESLint + Prettier + Husky | Latest | Code-Standards, Pre-Commit-Hooks | Wartbare Finanzsoftware-Codebase, konsistente Code-Formatierung, automatisierte Qualitätsprüfungen |
| **Build-Tools** | Vite | 4.4+ | Frontend-Build und Entwicklung | Schneller Entwicklungsserver, optimierte Produktions-Builds, exzellente TypeScript-Unterstützung |
| **Prozess-Management** | PM2 | 5.3+ | Lokales Produktions-Deployment | Prozess-Monitoring für lokales MVP, Auto-Restart-Funktionen, Log-Management |
| **Monitoring (Lokal)** | Winston + Morgan | 3.10+ / 1.10+ | Anwendungs-Logging | Strukturiertes Logging für Debugging, Request/Response-Tracking, Fehler-Aggregation |