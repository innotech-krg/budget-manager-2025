# 📐 **Epic 01 Wireframes - Budget Management UI/UX**

**@ux-expert.mdc** | **Fokus:** Epic 01 Budget-Management  
**Status:** Wireframes und UI-Mockups komplett

---

## 🎯 **STORY 1.1: JAHRESBUDGET-VERWALTUNG WIREFRAMES**

### **Dashboard-Hauptansicht:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Budget Manager 2025                    [Benachrichtigungen] [⚙] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Jahresbudget    │  │ Aktive Projekte │  │ Budget-Warnungen│ │
│  │ 2025            │  │                 │  │                 │ │
│  │ €1.250.000,00   │  │     47          │  │      3          │ │
│  │ ████████░░ 75%  │  │   ████████      │  │   🟡 2  🔴 1   │ │
│  │ Zugewiesen      │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 3D Budget-Tracking Übersicht                               │ │
│  │                                                             │ │
│  │ Veranschlagt    ████████████████████████████████ 100%      │ │
│  │ Zugewiesen      ████████████████████░░░░░░░░░░░░  75%      │ │
│  │ Verbraucht      ██████████████░░░░░░░░░░░░░░░░░░░░  45%      │ │
│  │                                                             │ │
│  │ [Projekt hinzufügen] [Budget transferieren] [Bericht]      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Budget-Erstellungs-Dialog:**
```
┌─────────────────────────────────────────────────────────────┐
│ Neues Jahresbudget erstellen                         [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Schritt 1 von 4: Grunddaten                                │
│ ●○○○                                                        │
│                                                             │
│ Jahr: [2025        ▼]                                      │
│                                                             │
│ Gesamtbudget (EUR):                                         │
│ [€ 1.250.000,00              ]                             │
│                                                             │
│ Reserve-Allokation:                                         │
│ [═══●═══════] 10%                                           │
│ (€ 125.000,00)                                              │
│                                                             │
│ Beschreibung:                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Jahresbudget 2025 für alle Geschäftsbereiche           │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                               [Abbrechen] [Weiter →]       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏢 **STORY 1.2: DEUTSCHE GESCHÄFTSPROJEKT-ERSTELLUNG**

### **Projekt-Erstellungs-Wizard:**
```
┌─────────────────────────────────────────────────────────────┐
│ Neues Geschäftsprojekt erstellen                     [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Schritt 2 von 3: Deutsche Geschäftsfelder                  │
│ ●●○                                                         │
│                                                             │
│ Kostenstelle:                                               │
│ [4711 - IT-Entwicklung                            ▼]       │
│                                                             │
│ Profit Center:                                              │
│ [PC001 - Produktentwicklung                       ▼]       │
│                                                             │
│ Geschäftsbereich:                                           │
│ [Innovation & Technologie                         ▼]       │
│                                                             │
│ Team-Zuordnung:                                             │
│ [Frontend-Team (5 Mitarbeiter)                    ▼]       │
│                                                             │
│ Priorität:                                                  │
│ ○ Niedrig  ●● Mittel  ○ Hoch  ○ Kritisch                  │
│                                                             │
│ Geplante Laufzeit:                                          │
│ Von: [15.01.2025] Bis: [31.12.2025]                       │
│                                                             │
│                        [← Zurück] [Abbrechen] [Weiter →]   │
└─────────────────────────────────────────────────────────────┘
```

### **Budget-Zuordnungs-Interface:**
```
┌─────────────────────────────────────────────────────────────┐
│ Budget-Zuordnung: "Mobile App Entwicklung"                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Verfügbares Budget: €687.500,00                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Drag & Drop Budget-Kategorien                           │ │
│ │                                                         │ │
│ │ [Personal]     [Externe Dienstl.] [Hardware/Software]  │ │
│ │ €150.000       €80.000            €45.000              │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Projekt-Budget                                      │ │ │
│ │ │ Ziehe Kategorien hierher                            │ │ │
│ │ │                                                     │ │ │
│ │ │ [Personal: €150.000]                                │ │ │
│ │ │ [Externe Dienstl.: €80.000]                         │ │ │
│ │ │                                                     │ │ │
│ │ │ Gesamt: €230.000,00                                 │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                               [Abbrechen] [Budget zuweisen] │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 **STORY 1.3: 3D BUDGET-TRACKING DASHBOARD**

### **3D Budget-Visualisierung:**
```
┌─────────────────────────────────────────────────────────────┐
│ 3D Budget-Tracking Dashboard                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Gesamt-Budget-Status                                    │ │
│ │                                                         │ │
│ │ Veranschlagt │████████████████████████████████│ 100%    │ │
│ │ €1.250.000   │                                │          │ │
│ │                                                         │ │
│ │ Zugewiesen   │██████████████████████░░░░░░░░░│  75%    │ │
│ │ €937.500     │                                │          │ │
│ │                                                         │ │
│ │ Verbraucht   │██████████████░░░░░░░░░░░░░░░░░│  45%    │ │
│ │ €562.500     │                                │          │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Projekt-Budget-Matrix                                   │ │
│ │                                                         │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │ │
│ │ │Mobile App   │ │Website      │ │API Gateway  │        │ │
│ │ │🟢 Gesund    │ │🟡 Warnung   │ │🔴 Kritisch  │        │ │
│ │ │V: €230.000  │ │V: €180.000  │ │V: €120.000  │        │ │
│ │ │Z: €230.000  │ │Z: €180.000  │ │Z: €120.000  │        │ │
│ │ │R: €103.500  │ │R: €167.400  │ │R: €126.800  │        │ │
│ │ │45%          │ │93%          │ │106%         │        │ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘        │ │
│ │                                                         │ │
│ │ [Filter] [Sortieren] [Export] [Neues Projekt]          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **Projekt-Detail-Ansicht:**
```
┌─────────────────────────────────────────────────────────────┐
│ Projekt: Mobile App Entwicklung                      [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Veranschlagt    │ │ Zugewiesen      │ │ Verbraucht      │ │
│ │ €230.000,00     │ │ €230.000,00     │ │ €103.500,00     │ │
│ │ 100%            │ │ 100%            │ │ 45%             │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                                             │
│ Budget-Verlauf (letzte 6 Monate):                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ €250k│                                                  │ │
│ │      │ ●──●                                             │ │
│ │ €200k│      ●──●──●                                     │ │
│ │      │           ●──●──●                                │ │
│ │ €150k│                  ●                               │ │
│ │      │                                                  │ │
│ │ €100k│                                                  │ │
│ │      │                                                  │ │
│ │   €0 └──────────────────────────────────────────────────│ │
│ │      Jul Aug Sep Okt Nov Dez                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Aktuelle Ausgaben:                                         │
│ • Personal: €78.500 (76% von €103.000)                     │
│ • Externe Dienstl.: €25.000 (31% von €80.000)              │
│ • Software-Lizenzen: €0 (0% von €47.000)                   │
│                                                             │
│ [Budget transferieren] [Ausgabe hinzufügen] [Bericht]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 💸 **STORY 1.4: BUDGET-TRANSFER-SYSTEM**

### **Budget-Transfer-Interface:**
```
┌─────────────────────────────────────────────────────────────┐
│ Budget-Transfer zwischen Projekten                    [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Von Projekt:                                                │
│ [Website Redesign                                  ▼]       │
│ Verfügbares Budget: €12.600,00                             │
│                                                             │
│ Zu Projekt:                                                 │
│ [API Gateway                                       ▼]       │
│ Benötigtes Budget: €6.800,00 (106% Überschreitung)        │
│                                                             │
│ Transfer-Betrag:                                            │
│ [€ 6.800,00              ]                                 │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Transfer-Vorschau                                       │ │
│ │                                                         │ │
│ │ Website Redesign:  €180.000 → €173.200 (-€6.800)      │ │
│ │ API Gateway:       €120.000 → €126.800 (+€6.800)      │ │
│ │                                                         │ │
│ │ ✅ Transfer möglich                                      │ │
│ │ ✅ Keine Budget-Überschreitung                          │ │
│ │ ✅ Genehmigung nicht erforderlich (<€10.000)            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Begründung:                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Zusätzliche API-Endpoints für Mobile App benötigt      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                               [Abbrechen] [Transfer ausführen] │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 **STORY 1.5: ECHTZEIT-BUDGET-DASHBOARD**

### **Live-Dashboard-Ansicht:**
```
┌─────────────────────────────────────────────────────────────┐
│ Echtzeit-Budget-Dashboard                 🔴 LIVE   [⟳]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Budget-Burn-Rate (Letzte 30 Tage)                      │ │
│ │                                                         │ │
│ │ €50k│                                              ●    │ │
│ │     │                                         ●──●      │ │
│ │ €40k│                                    ●──●           │ │
│ │     │                               ●──●                │ │
│ │ €30k│                          ●──●                     │ │
│ │     │                     ●──●                          │ │
│ │ €20k│                ●──●                               │ │
│ │     │           ●──●                                    │ │
│ │ €10k│      ●──●                                         │ │
│ │     │ ●──●                                              │ │
│ │  €0 └─────────────────────────────────────────────────  │ │
│ │     1   5   10  15  20  25  30  Tage                   │ │
│ │                                                         │ │
│ │ Trend: ↗ +15% (Überdurchschnittlich)                   │ │
│ │ Prognose: Budget-Erschöpfung in 8.2 Monaten           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│ │ Aktive      │ │ Warnungen   │ │ Transfers   │           │ │
│ │ Projekte    │ │             │ │ (heute)     │           │ │
│ │     47      │ │      3      │ │      2      │           │ │
│ │ ↗ +2 heute │ │ ↗ +1 heute │ │ €13.400     │           │ │
│ └─────────────┘ └─────────────┘ └─────────────┘           │ │
│                                                             │
│ Live-Aktivitäten:                                          │
│ • 14:23 - Budget-Transfer: €6.800 (Website → API)         │
│ • 14:18 - Neue Ausgabe: €2.500 (Mobile App - Lizenzen)    │
│ • 14:12 - Projekt erstellt: "Cloud Migration" (€85.000)   │
│ • 14:05 - Warnung: API Gateway 106% Budget-Auslastung     │
│                                                             │
│ [Alle Aktivitäten] [Export] [Benachrichtigungen]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 **RESPONSIVE MOBILE WIREFRAMES**

### **Mobile Dashboard (375px):**
```
┌─────────────────────────┐
│ Budget Manager    [☰]   │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │ Jahresbudget 2025   │ │
│ │ €1.250.000,00       │ │
│ │ ████████░░ 75%      │ │
│ │ Zugewiesen          │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Budget-Warnungen    │ │
│ │ 🟡 2    🔴 1        │ │
│ │ [Alle anzeigen]     │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Aktive Projekte     │ │
│ │                     │ │
│ │ • Mobile App   🟢   │ │
│ │ • Website      🟡   │ │
│ │ • API Gateway  🔴   │ │
│ │                     │ │
│ │ [Alle anzeigen]     │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Quick Actions       │ │
│ │ [+] [💸] [📊] [⚙]  │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

---

## 🎨 **UI-KOMPONENTEN SPEZIFIKATIONEN**

### **Farbkodierung (Ampelsystem):**
- 🟢 **Grün (Gesund):** 0-80% Budget-Auslastung
- 🟡 **Gelb (Warnung):** 81-95% Budget-Auslastung  
- 🔴 **Rot (Kritisch):** 96%+ Budget-Auslastung

### **Deutsche UI-Elemente:**
- **Buttons:** "Erstellen", "Speichern", "Abbrechen", "Weiter"
- **Labels:** "Veranschlagt", "Zugewiesen", "Verbraucht"
- **Status:** "Aktiv", "Pausiert", "Abgeschlossen"
- **Währung:** Immer "€" mit deutscher Formatierung

### **Accessibility (WCAG AA):**
- **Tastatur-Navigation:** Tab-Index für alle interaktiven Elemente
- **Screen-Reader:** Alt-Texte für alle Charts und Grafiken
- **Kontrast:** Mindestens 4.5:1 für Text-Hintergrund-Kombinationen
- **Focus-Indikatoren:** Deutliche Fokus-Rahmen

---

## ✅ **WIREFRAMES KOMPLETT**

**@ux-expert.mdc hat alle Wireframes für Epic 01 Budget-Management erstellt!**

**Alle 5 Stories haben detaillierte UI/UX-Spezifikationen:**

1. ✅ **Story 1.1:** Jahresbudget-Verwaltung Dashboard + Dialog
2. ✅ **Story 1.2:** Deutsche Geschäftsprojekt-Erstellung Wizard
3. ✅ **Story 1.3:** 3D Budget-Tracking Visualisierung + Details
4. ✅ **Story 1.4:** Budget-Transfer-Interface + Vorschau
5. ✅ **Story 1.5:** Echtzeit-Dashboard + Live-Aktivitäten

**Plus responsive Mobile-Wireframes und Accessibility-Spezifikationen!**

**@dev.mdc kann jetzt mit präzisen Wireframes die UI-Implementation starten!** 🚀