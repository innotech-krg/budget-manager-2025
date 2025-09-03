# Epic 1: Abhängigkeiten-Diagramm

**Letzte Aktualisierung:** 2025-01-15  
**Status:** 66% Completed (68/103 Story Points)

## 🔗 **Vollständiges Abhängigkeiten-Diagramm**

```mermaid
graph TD
    %% Kern-Stories (Abgeschlossen)
    A["1.1<br/>Jahresbudget-Verwaltung<br/>✅ DONE<br/>8 SP"]
    B["1.2<br/>Deutsche Geschäftsprojekt-Erstellung<br/>✅ DONE<br/>13 SP"]
    C["1.3<br/>Dreidimensionales Budget-Tracking<br/>✅ DONE<br/>13 SP"]
    D["1.4<br/>Budget-Transfer-System<br/>✅ DONE<br/>21 SP"]
    E["1.5<br/>Echtzeit-Budget-Dashboard<br/>✅ DONE<br/>13 SP"]
    
    %% Erweiterte Stories (Neu)
    F["1.2.1<br/>Dienstleister-Stammdaten<br/>📋 READY<br/>8 SP"]
    G["1.2.2<br/>Multi-Team-Management<br/>📋 READY<br/>13 SP"]
    H["1.2.3<br/>Intelligente Budget-Zuordnung<br/>🔴 CRITICAL<br/>8 SP"]
    I["1.2.4<br/>Rollen-Stundensatz-Kalkulation<br/>📋 READY<br/>13 SP"]
    J["1.2.5<br/>Rechnungs-Kosten-Tracking<br/>⚠️ BLOCKED<br/>8 SP"]
    
    %% Epic 2 Dependency
    K["Epic 2<br/>OCR-Integration<br/>⚠️ EXTERNAL<br/>TBD SP"]
    
    %% Abhängigkeiten - Kern-Stories
    A --> B
    B --> C
    A --> C
    C --> D
    C --> E
    
    %% Abhängigkeiten - Erweiterte Stories
    B --> F
    B --> H
    A --> H
    F --> G
    G --> I
    F --> J
    K --> J
    
    %% Styling
    classDef completed fill:#d4edda,stroke:#155724,stroke-width:2px,color:#155724
    classDef ready fill:#fff3cd,stroke:#856404,stroke-width:2px,color:#856404
    classDef critical fill:#f8d7da,stroke:#721c24,stroke-width:3px,color:#721c24
    classDef blocked fill:#f1f3f4,stroke:#6c757d,stroke-width:2px,color:#6c757d
    classDef external fill:#e2e3e5,stroke:#495057,stroke-width:2px,color:#495057
    
    class A,B,C,D,E completed
    class F,G,I ready
    class H critical
    class J blocked
    class K external
```

## 📊 **Sprint-Timeline-Diagramm**

```mermaid
gantt
    title Epic 1: Sprint-Timeline mit Abhängigkeiten
    dateFormat  X
    axisFormat %s
    
    section Abgeschlossen ✅
    1.1 Jahresbudget           :done, s1-1, 0, 4
    1.2 Geschäftsprojekt       :done, s1-2, 4, 10
    1.3 Budget-Tracking        :done, s2-1, 10, 16
    1.4 Transfer-System        :done, s2-2, 16, 26
    1.5 Dashboard              :done, s3-1, 20, 26
    
    section Sprint 4 🔴
    1.2.3 Budget-Zuordnung     :crit, s4-1, 26, 32
    1.2.1 Dienstleister        :active, s4-2, 32, 37
    
    section Sprint 5 🟠
    1.2.2 Multi-Team           :s5-1, 37, 44
    1.2.4 Rollen-Kosten (1/2)  :s5-2, 44, 48
    
    section Sprint 6 🟡
    1.2.4 Rollen-Kosten (2/2)  :s6-1, 48, 51
    1.2.5 Rechnungs-Tracking   :s6-2, 51, 55
```

## 🎯 **Kritische Pfad-Analyse**

### **Längster Pfad (27.5 Tage):**
```mermaid
graph LR
    A[1.1<br/>4d] --> B[1.2<br/>6d]
    B --> C[1.2.1<br/>4.5d]
    C --> D[1.2.2<br/>6.5d]
    D --> E[1.2.4<br/>6.5d]
    
    style A fill:#d4edda
    style B fill:#d4edda
    style C fill:#fff3cd
    style D fill:#fff3cd
    style E fill:#fff3cd
```

### **Parallele Pfade:**
```mermaid
graph LR
    A[1.1 + 1.2<br/>✅ DONE] --> B[1.2.3<br/>5.5d<br/>🔴 PARALLEL]
    A --> C[1.2.1<br/>4.5d<br/>📋 SEQUENTIAL]
    
    style A fill:#d4edda
    style B fill:#f8d7da
    style C fill:#fff3cd
```

## 🔧 **Technische Abhängigkeiten-Matrix**

### **Database Schema Dependencies:**
```mermaid
graph TD
    A[annual_budgets<br/>✅ 1.1] --> B[projects<br/>✅ 1.2]
    B --> C[dienstleister<br/>📋 1.2.1]
    C --> D[projekt_teams<br/>📋 1.2.2]
    D --> E[rollen_stammdaten<br/>📋 1.2.4]
    B --> F[budget_validierung<br/>🔴 1.2.3]
    G[rechnungen<br/>⚠️ Epic 2] --> H[rechnung_projekt_zuordnungen<br/>⚠️ 1.2.5]
    C --> H
    
    classDef completed fill:#d4edda,stroke:#155724
    classDef ready fill:#fff3cd,stroke:#856404
    classDef critical fill:#f8d7da,stroke:#721c24
    classDef blocked fill:#f1f3f4,stroke:#6c757d
    
    class A,B completed
    class C,D,E ready
    class F critical
    class G,H blocked
```

### **API Dependencies:**
```mermaid
graph TD
    A[Budget API<br/>✅ Implemented] --> B[Project API<br/>✅ Implemented]
    B --> C[Dienstleister API<br/>📋 1.2.1]
    C --> D[Team Management API<br/>📋 1.2.2]
    D --> E[Role & Cost API<br/>📋 1.2.4]
    B --> F[Budget Validation API<br/>🔴 1.2.3]
    G[OCR API<br/>⚠️ Epic 2] --> H[Invoice Tracking API<br/>⚠️ 1.2.5]
    C --> H
    
    classDef completed fill:#d4edda,stroke:#155724
    classDef ready fill:#fff3cd,stroke:#856404
    classDef critical fill:#f8d7da,stroke:#721c24
    classDef blocked fill:#f1f3f4,stroke:#6c757d
    
    class A,B completed
    class C,D,E ready
    class F critical
    class G,H blocked
```

## ⚠️ **Risiko-Heatmap**

| Story | Tech Risk | Business Risk | Dependency Risk | **Total Risk** |
|-------|-----------|---------------|-----------------|----------------|
| 1.2.1 | 🟢 Low | 🟡 Medium | 🟢 Low | 🟢 **Low** |
| 1.2.2 | 🔴 High | 🟠 High | 🟡 Medium | 🔴 **High** |
| 1.2.3 | 🟡 Medium | 🔴 Critical | 🟢 Low | 🔴 **Critical** |
| 1.2.4 | 🟡 Medium | 🟡 Medium | 🟡 Medium | 🟡 **Medium** |
| 1.2.5 | 🟠 High | 🟡 Medium | 🔴 High | 🔴 **High** |

### **Risiko-Mitigation-Strategien:**
```mermaid
graph TD
    A[🔴 Story 1.2.3<br/>CRITICAL] --> A1[Sofortige Implementierung]
    A --> A2[Einfache Validierung zuerst]
    A --> A3[Umfangreiche Tests]
    
    B[🔴 Story 1.2.2<br/>HIGH RISK] --> B1[Schrittweise Schema-Evolution]
    B --> B2[Prototyping vor Implementierung]
    B --> B3[Rollback-Strategien]
    
    C[🔴 Story 1.2.5<br/>BLOCKED] --> C1[Epic 2 Koordination]
    C --> C2[Fallback-Pläne]
    C --> C3[Parallel-Entwicklung]
```

## 📈 **Implementierungs-Roadmap**

### **🔴 Woche 1 (SOFORT):**
```mermaid
graph LR
    A[Mo-Mi<br/>Story 1.2.3<br/>Budget-Zuordnung<br/>🔴 CRITICAL] --> B[Do-Fr<br/>Testing &<br/>Bug Fixes<br/>✅ DEPLOY]
```

### **🟠 Woche 2-3 (Sprint 4):**
```mermaid
graph LR
    A[Mo-Do<br/>Story 1.2.1<br/>Dienstleister<br/>📋 READY] --> B[Fr<br/>Integration<br/>Testing<br/>✅ DEPLOY]
```

### **🟠 Woche 4-5 (Sprint 5):**
```mermaid
graph LR
    A[Mo-Mi<br/>Story 1.2.2<br/>Multi-Team<br/>📋 HIGH RISK] --> B[Do-Fr<br/>Story 1.2.4<br/>Rollen (Start)<br/>📋 MEDIUM]
```

### **🟡 Woche 6-7 (Sprint 6):**
```mermaid
graph LR
    A[Mo-Mi<br/>Story 1.2.4<br/>Rollen (Ende)<br/>📋 MEDIUM] --> B[Do-Fr<br/>Story 1.2.5<br/>Rechnungen<br/>⚠️ IF Epic 2]
```

## 🎯 **Success Metrics & KPIs**

### **Sprint 4 Success Criteria:**
- ✅ Budget-Überschreitungen werden verhindert (1.2.3)
- ✅ Dienstleister-Dropdown funktioniert (1.2.1)
- ✅ OCR-Pattern-Vorbereitung abgeschlossen (1.2.1)
- 📊 **Target:** 16/35 SP completed (46% of extended stories)

### **Sprint 5 Success Criteria:**
- ✅ Multi-Team-Projekte erstellbar (1.2.2)
- ✅ Dynamische Team-Listen mit Add-Button (1.2.2)
- ✅ Automatische Kosten-Berechnung (1.2.4 Start)
- 📊 **Target:** 29/35 SP completed (83% of extended stories)

### **Epic 1 Complete Success Criteria:**
- ✅ Alle 10 Stories implementiert und getestet
- ✅ 103/103 Story Points abgeschlossen (100%)
- ✅ Vollständiges Budget-Management-System produktionsreif
- 📊 **Target:** Production-ready system with all features

---

## 📋 **Nächste Schritte:**

1. **🔴 SOFORT:** Story 1.2.3 implementieren (Budget-Zuordnung)
2. **📋 Sprint 4:** Story 1.2.1 implementieren (Dienstleister-Stammdaten)
3. **🔄 Koordination:** Epic 2 Timeline für Story 1.2.5 abstimmen
4. **📊 Monitoring:** Sprint-Fortschritt und Risiko-Mitigation überwachen

**Status: 68/103 SP (66%) | Kritischer Pfad: Story 1.2.3 🔴**

