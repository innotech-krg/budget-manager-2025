# Story 7.1: KI-Budget-Assistent mit Chat-Interface

## 📋 **Story Übersicht**
- **Epic**: 07 - Erweiterte KI-Integration
- **Story**: 7.1 - KI-Budget-Assistent
- **Priorität**: Hoch
- **Status**: Konzept
- **Geschätzter Aufwand**: 2-3 Wochen

## 🎯 **Ziel**
Entwicklung eines intelligenten Chat-basierten Budget-Assistenten, der Users bei Budget-Fragen unterstützt, Analysen durchführt und Empfehlungen gibt. Der Assistent versteht natürliche Sprache und kann komplexe Budget-Abfragen beantworten.

## 📝 **Beschreibung**
Ein KI-Assistent, der als Chat-Interface in der App integriert ist und Users bei allen Budget-bezogenen Aufgaben unterstützt. Von einfachen Abfragen bis hin zu komplexen Analysen und Empfehlungen.

## ✅ **Akzeptanzkriterien**

### **Chat-Interface**
- [ ] **Floating Chat-Button**: Immer verfügbarer Chat-Zugang
- [ ] **Natürliche Sprache**: Verständnis deutscher Anfragen
- [ ] **Kontext-Bewusstsein**: Assistent kennt aktuellen App-Bereich
- [ ] **Conversation History**: Gespeicherte Chat-Verläufe
- [ ] **Quick Actions**: Vordefinierte häufige Fragen

### **Budget-Funktionalitäten**
- [ ] **Budget-Abfragen**: "Wie viel Budget ist noch verfügbar?"
- [ ] **Projekt-Analysen**: "Welche Projekte sind über Budget?"
- [ ] **Trend-Analysen**: "Wie entwickeln sich meine Ausgaben?"
- [ ] **Vergleiche**: "Vergleiche Q1 mit Q2 Budget"
- [ ] **Empfehlungen**: "Wo kann ich Budget optimieren?"

### **Intelligente Features**
- [ ] **Daten-Visualisierung**: Automatische Chart-Generierung
- [ ] **Proaktive Insights**: Assistent schlägt relevante Analysen vor
- [ ] **Action Items**: Konkrete Handlungsempfehlungen
- [ ] **Budget-Alerts**: Warnung bei kritischen Situationen
- [ ] **Learning**: Lernt aus User-Präferenzen

## 🔧 **Technische Umsetzung**

### **Backend-Services**
```javascript
// Neue Services:
- chatAssistantService.js
- budgetQueryService.js
- nlpProcessingService.js
- conversationHistoryService.js

// KI-Integration:
- OpenAI GPT-4 für Conversation
- Custom Prompts für Budget-Kontext
- Function Calling für Daten-Abfragen
```

### **Frontend-Komponenten**
```typescript
// Chat-Interface:
- ChatWidget (floating)
- ConversationView
- MessageBubble
- QuickActionButtons
- DataVisualizationCards
```

### **Datenbank-Erweiterungen**
```sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY,
  user_id UUID,
  title TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID,
  role VARCHAR(20), -- user, assistant, system
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP
);

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID,
  preference_type VARCHAR(50),
  preference_value JSONB,
  created_at TIMESTAMP
);
```

## 🎯 **Beispiel-Interaktionen**

### **Budget-Abfragen**
```
User: "Wie steht es um mein Budget für Q4?"
Assistant: "Ihr Q4-Budget beträgt 50.000€. Bisher wurden 32.000€ (64%) verbraucht. 
Sie haben noch 18.000€ verfügbar. Basierend auf dem aktuellen Trend werden Sie 
voraussichtlich 95% des Budgets nutzen."

User: "Welche Projekte verbrauchen am meisten?"
Assistant: "Die Top 3 Budget-Verbraucher sind:
1. Website Redesign: 12.000€ (75% des Projekt-Budgets)
2. Marketing Campaign: 8.500€ (85% des Projekt-Budgets) ⚠️
3. Server Migration: 6.200€ (62% des Projekt-Budgets)"
```

### **Empfehlungen**
```
User: "Wo kann ich sparen?"
Assistant: "Ich habe 3 Optimierungsmöglichkeiten gefunden:
1. 🔄 Transfer von 2.000€ vom unterbudgetierten 'Training' Projekt
2. 📊 Verhandlung mit Lieferant XYZ (15% Einsparpotential)
3. ⏰ Verschiebung des 'Office Equipment' Kaufs ins nächste Quartal
Soll ich Details zu einer Option zeigen?"
```

## 📊 **KI-Prompting-Strategie**

### **System-Prompt**
```
Du bist ein intelligenter Budget-Assistent für eine deutsche Firma. 
Du hilfst bei:
- Budget-Analysen und Abfragen
- Projekt-Übersichten
- Optimierungsempfehlungen
- Trend-Analysen

Aktueller Kontext:
- Benutzer: {user_name}
- Aktuelle Seite: {current_page}
- Verfügbare Budgets: {budget_summary}
- Aktuelle Projekte: {project_summary}

Antworte immer:
- Auf Deutsch
- Präzise und handlungsorientiert
- Mit konkreten Zahlen
- Mit Empfehlungen wenn möglich
```

### **Function Calling**
```javascript
// Verfügbare Funktionen:
- getBudgetSummary()
- getProjectStatus()
- analyzeSpendingTrends()
- generateBudgetChart()
- createTransferSuggestion()
```

## 📋 **Implementierungs-Phasen**

### **Phase 1: Basis-Chat**
- Einfaches Chat-Interface
- Grundlegende Budget-Abfragen
- Statische Antworten

### **Phase 2: KI-Integration**
- OpenAI GPT-4 Integration
- Dynamische Daten-Abfragen
- Kontext-bewusste Antworten

### **Phase 3: Erweiterte Features**
- Proaktive Empfehlungen
- Daten-Visualisierung
- Lern-Algorithmen

## 🚨 **Risiken**
- **API-Kosten**: Intensive Chat-Nutzung kann teuer werden
- **Datengenauigkeit**: KI muss auf korrekte Daten zugreifen
- **User-Erwartungen**: Hohe Erwartungen an KI-Fähigkeiten

## 📝 **Notizen**
- Integration in alle App-Bereiche geplant
- Möglichkeit für Voice-Interface in Zukunft
- Mehrsprachigkeit (DE/EN) erwünscht

