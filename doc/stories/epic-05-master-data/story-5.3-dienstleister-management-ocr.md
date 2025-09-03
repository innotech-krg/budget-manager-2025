# Story 5.3: Dienstleister-Management mit OCR-Integration

**Epic:** 5 - Master Data Management & Administration  
**Story Points:** 13  
**Sprint:** Epic 5.1-5.2  
**Priorität:** Hoch  
**Status:** Ready for Development

## User Story

**Als** Administrator  
**möchte ich** Dienstleister/Lieferanten mit OCR-spezifischen Metadaten verwalten  
**damit** die Rechnungsverarbeitung optimiert wird

## Akzeptanzkriterien

- [ ] Ich kann Dienstleister mit Geschäftsdaten erfassen:
  - [ ] Name, USt-ID, Kontakt-E-Mail
  - [ ] Zahlungsbedingungen, bevorzugte Währung
  - [ ] Durchschnittliche Verarbeitungszeit
- [ ] Ich kann OCR-spezifische Einstellungen konfigurieren:
  - [ ] Verknüpfung zu Supplier-Patterns
  - [ ] Dokumentstruktur-Hinweise
  - [ ] Spezielle Verarbeitungsregeln
- [ ] System schlägt automatisch Dienstleister bei OCR-Erkennung vor
- [ ] Dienstleister-Statistiken zeigen OCR-Performance
- [ ] Inaktive Dienstleister werden nicht in OCR-Vorschlägen verwendet

## Technische Tasks

### Backend
- [ ] Erweiterte `dienstleister` Tabelle mit OCR-Metadaten
- [ ] Integration mit Supplier-Pattern-System (Vorbereitung für Epic 2)
- [ ] OCR-Performance-Tracking pro Dienstleister
- [ ] API für OCR-System-Integration
- [ ] Dienstleister-Statistik-APIs

### Frontend
- [ ] Dienstleister-Admin-Interface
- [ ] OCR-spezifische Einstellungs-Formulare
- [ ] Supplier-Pattern-Verknüpfungs-Interface
- [ ] Dienstleister-Performance-Dashboard
- [ ] OCR-Statistik-Visualisierung

## Definition of Done

- [ ] Dienstleister können mit allen Geschäfts- und OCR-Metadaten verwaltet werden
- [ ] Integration mit Supplier-Pattern-System vorbereitet
- [ ] OCR-Performance wird pro Dienstleister getrackt
- [ ] Statistiken sind visualisiert und aussagekräftig
- [ ] Inaktive Dienstleister werden korrekt ausgeschlossen
- [ ] Tests haben 80%+ Coverage

## Abhängigkeiten

**Blockiert von:** Story 5.1 (Master-Data-Grundlage)  
**Blockiert:** Epic 2 (OCR-Integration benötigt Dienstleister-Daten)

## Notizen

- Vorbereitung für Epic 2 OCR-Integration
- Supplier-Patterns werden in Epic 2 vollständig implementiert
- Performance-Tracking für OCR-Optimierung wichtig
- USt-ID für deutsche Geschäftsanforderungen
- Durchschnittliche Verarbeitungszeit für Projektplanung