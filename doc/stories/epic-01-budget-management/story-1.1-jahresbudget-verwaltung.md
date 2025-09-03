# Story 1.1: Jahresbudget-Verwaltung

**Epic:** 1 - Kern-Budget-Management-System  
**Story Points:** 8  
**Sprint:** 1  
**Priorität:** Höchste  
**Status:** Ready for Development

## User Story

**Als** Finanzverantwortlicher  
**möchte ich** Jahresbudgets erstellen und verwalten können  
**damit** ich eine klare Budgetgrundlage für alle Projekte habe

## Akzeptanzkriterien

### **Funktionale Kriterien:**
- [ ] Ich kann ein neues Jahresbudget mit Gesamtsumme erstellen
- [ ] Ich kann die Reserve-Allokation konfigurieren (Standard: 10%)
- [ ] Das System berechnet automatisch verfügbares Budget (Total - Reserve)
- [ ] Ich kann bestehende Budgets bearbeiten (nur im DRAFT-Status)
- [ ] Ich kann Budgets zwischen DRAFT/ACTIVE/CLOSED-Status wechseln
- [ ] Das System zeigt Budget-Übersicht mit aktueller Allokation/Verbrauch
- [ ] **Deutsche Geschäftslogik:** Pro Jahr ist nur ein aktives Budget erlaubt
- [ ] **Intelligente Status-Bestimmung:** Vergangene Jahre sind CLOSED, zukünftige DRAFT, aktuelles Jahr kann ACTIVE sein
- [ ] **Visuelle Unterscheidung:** Aktuelles aktives Budget ist prominent hervorgehoben
- [ ] **Archiv-Funktion:** Vergangene Budgets sind gedämpft dargestellt und weniger prominent

### **🎨 UX-Akzeptanzkriterien:**
- [ ] **Budget-Erstellung in <3 Minuten:** Deutsche Benutzer können Jahresbudget ohne Schulung erstellen
- [ ] **4-Schritt-Wizard:** Jahr → Betrag → Reserve → Bestätigung mit klarer Fortschrittsanzeige
- [ ] **Deutsche EUR-Formatierung:** €1.250.000,00 mit Tausendertrennzeichen in allen Eingaben
- [ ] **Reserve-Slider:** Visueller 5-20% Slider mit Echtzeit-Berechnung (€-Betrag)
- [ ] **Dashboard-Integration:** Budget-Kachel mit Ampelsystem-Status (🟢 🟡 🔴)
- [ ] **Responsive Design:** Funktioniert auf Desktop (3-4 Spalten), Tablet (2 Spalten), Mobile (1 Spalte)
- [ ] **Accessibility WCAG AA:** Vollständige Tastatur-Navigation und Screen-Reader-Support

### **📱 UI-Mockup-Referenzen:**
- **[Budget-Erstellungs-Dialog](../../ux-design/epic-01-wireframes.md#budget-erstellungs-dialog)**
- **[Dashboard-Kachel Design](../../ux-design/epic-01-wireframes.md#dashboard-hauptansicht)**
- **[Mobile-responsive Ansicht](../../ux-design/epic-01-wireframes.md#mobile-dashboard-375px)**

## Technische Tasks

### Backend
- [ ] PostgreSQL-Tabelle `annual_budgets` implementieren
- [ ] Express.js API-Endpunkte für Budget-CRUD
- [ ] Validierung für Budget-Regeln (positive Werte, Reserve-Limits)
- [ ] **Geschäftslogik-Validierung:** Verhindert mehrere aktive Budgets pro Jahr
- [ ] **Status-Automatisierung:** Intelligente Status-Bestimmung basierend auf Jahr
- [ ] Unit-Tests für Budget-Berechnungslogik

### 🎨 **Frontend (UX-Integration)**
- [ ] **BudgetCreationWizard** - 4-Schritt React-Komponente mit Fortschrittsanzeige
- [ ] **BudgetCard** - Dashboard-Kachel mit 3D-Tracking (Veranschlagt/Zugewiesen/Verbraucht)
- [ ] **Visuelle Kategorisierung:** Aktuell (grün hervorgehoben), Geplant (blau), Archiv (grau gedämpft)
- [ ] **Intelligente Sortierung:** Aktuelles aktives Budget zuerst, dann nach Kategorie
- [ ] **CurrencyInput** - Deutsche EUR-Formatierung (€1.250.000,00) mit Validierung
- [ ] **ReserveSlider** - Visueller 5-20% Slider mit Echtzeit-€-Berechnung
- [ ] **StatusIndicator** - Ampelsystem-Integration (🟢 🟡 🔴)
- [ ] **Responsive Layout** - Desktop/Tablet/Mobile-Breakpoints mit Tailwind CSS
- [ ] **Form-Validierung** - Deutsche Fehlermeldungen mit React Hook Form
- [ ] **Accessibility** - WCAG AA Compliance mit aria-labels und Tastatur-Navigation

## Definition of Done

### **Funktionale Definition of Done:**
- [ ] Budget-CRUD funktioniert vollständig
- [ ] UI zeigt deutsche Währungsformatierung (EUR)
- [ ] Validierung verhindert inkonsistente Daten
- [ ] Tests haben 80%+ Coverage
- [ ] Code Review abgeschlossen
- [ ] QA-Tests bestanden

### **🎨 UX Definition of Done:**
- [ ] **Benutzerfreundlichkeit:** Deutsche Benutzer können Jahresbudget in <3 Minuten erstellen
- [ ] **Design-System-Compliance:** Alle Komponenten verwenden Design-Token-System
- [ ] **Responsive Testing:** Funktioniert auf Desktop (1200px+), Tablet (768px), Mobile (375px)
- [ ] **Accessibility Testing:** 100% axe-core Compliance, Screen-Reader-Tests bestanden
- [ ] **Deutsche UI-Standards:** EUR-Formatierung, Ampelsystem, deutsche Terminologie
- [ ] **Performance:** Dashboard-Load <3s, Formular-Responsivität <200ms
- [ ] **Visual QA:** UI entspricht exakt den Wireframe-Spezifikationen
- [ ] **User Acceptance:** Stakeholder-Freigabe für UX-Design

## Abhängigkeiten

**Blockiert von:** Keine  
**Blockiert:** Story 1.2, 1.3, 1.4, 1.5

## Notizen

- Reserve-Allokation soll konfigurierbar sein, aber Standard 10%
- Nur ein aktives Budget pro Jahr erlaubt
- Budget-Status-Übergänge müssen validiert werden