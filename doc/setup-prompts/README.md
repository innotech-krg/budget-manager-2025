# Setup-Prompts für externe LLMs

Dieses Verzeichnis enthält detaillierte Prompts, die du in deine bevorzugte LLM (Claude, GPT-4, Gemini, etc.) kopieren kannst, um schritt-für-schritt Setup-Anleitungen zu erhalten.

## 📋 Verfügbare Setup-Prompts

### 1. [Google Cloud Vision API Setup](google-cloud-vision-setup-prompt.md)
**Für:** OCR-Integration mit Google Cloud Vision
**Verwendung:** Kopiere den Prompt in deine LLM für detaillierte API-Setup-Anleitung
**Zeitaufwand:** 2-4 Stunden Setup
**Entwicklungs-Beschleunigung:** 1-2 Wochen

### 2. [Supabase Setup](supabase-setup-prompt.md)
**Für:** Backend-as-a-Service mit PostgreSQL und Storage
**Verwendung:** Kopiere den Prompt in deine LLM für detaillierte Supabase-Setup-Anleitung
**Zeitaufwand:** 1-2 Stunden Setup
**Entwicklungs-Beschleunigung:** 3-5 Tage

## 🚀 Warum Vorab-Setup?

### **Entwicklungs-Beschleunigung:**
- ✅ **Epic 1 + Epic 5** können sofort starten
- ✅ **Epic 2 (OCR)** kann sofort getestet werden
- ✅ **Keine Blockierungen** durch externe Service-Setups
- ✅ **Frühe Integrationstests** möglich

### **Timeline-Optimierung:**
```
Ohne Vorab-Setup:    Epic 2 Start: Woche 11, OCR-Testing: Woche 13-14
Mit Vorab-Setup:     Epic 2 Start: Woche 11, OCR-Testing: Woche 11-12

Gewonnene Zeit: 1-2 Wochen! ⚡
```

## 📱 Verwendung der Prompts

### **Schritt 1: Prompt kopieren**
- Öffne die gewünschte .md-Datei
- Kopiere den gesamten Prompt-Bereich (zwischen den `---`)

### **Schritt 2: In LLM einfügen**
- Füge den Prompt in deine bevorzugte LLM ein
- Die LLM wird dir eine detaillierte Setup-Anleitung geben

### **Schritt 3: Schritt-für-Schritt folgen**
- Folge der Anleitung systematisch
- Bei Problemen: Verwende den gleichen Prompt mit spezifischen Fragen

## 🎯 Empfohlene Reihenfolge

### **1. Supabase Setup (1-2 Stunden)**
- Einfacher zu konfigurieren
- Sofort für Epic 1 (Budget-Management) nutzbar
- Basis für alle anderen Features

### **2. Google Cloud Vision (2-4 Stunden)**
- Komplexer, aber kritisch für Epic 2
- Frühe Tests mit deutschen Rechnungen möglich
- Kosten-Optimierung von Anfang an

## 🔧 Setup-Checkliste

### **Vor dem Setup:**
- [ ] Kreditkarte für Google Cloud bereit
- [ ] E-Mail-Adresse für Supabase Account
- [ ] Projekt-Name: "bdgt-2025" festgelegt
- [ ] 2-4 Stunden Zeit für Setup eingeplant

### **Nach dem Setup:**
- [ ] API-Keys sicher gespeichert
- [ ] Test-Integration funktioniert
- [ ] Kosten-Tracking aktiviert
- [ ] Dokumentation für Team erstellt

## 💡 Tipps für erfolgreiches Setup

### **Google Cloud Vision:**
- Starte mit kostenlosem Tier (1000 API-Calls/Monat)
- Service Account mit minimalen Berechtigungen
- Kosten-Alerts bei 80% des Budgets

### **Supabase:**
- Wähle Region nahe deinem Standort
- RLS von Anfang an aktivieren
- Backup-Strategien früh planen

## 🆘 Bei Problemen

### **Häufige Probleme:**
1. **API-Quotas überschritten:** Quotas erhöhen oder kostenpflichtigen Plan wählen
2. **RLS-Policies funktionieren nicht:** Berechtigungen überprüfen
3. **Storage-Uploads schlagen fehl:** Bucket-Berechtigungen prüfen

### **Hilfe bekommen:**
- Verwende den gleichen Prompt mit spezifischen Fehlermeldungen
- Google Cloud und Supabase haben ausgezeichnete Dokumentation
- Community-Foren für spezifische Probleme

## 🎉 Nach dem Setup

**Du wirst haben:**
- ✅ Vollständig konfigurierte Google Cloud Vision API
- ✅ Funktionsfähige Supabase-Instanz mit PostgreSQL
- ✅ Alle API-Keys und Credentials
- ✅ Test-Integrationen funktionsfähig
- ✅ Projekt bereit für sofortigen Entwicklungsstart!

**Das Budget Manager 2025-Projekt kann dann sofort mit Epic 1 + Epic 5 starten!** 🚀