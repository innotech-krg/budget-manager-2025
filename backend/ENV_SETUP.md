# 🔑 KI-OCR API Setup

## Erforderliche API-Keys für intelligente Rechnungsverarbeitung

### 1. OpenAI API (Empfohlen)
```bash
# In .env hinzufügen:
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Vorteile:**
- Exzellente strukturierte Datenextraktion
- Sehr gute österreichische Geschäftslogik
- JSON-Format-Ausgabe
- Rechnungspositions-Erkennung

### 2. Anthropic Claude API (Alternative)
```bash
# In .env hinzufügen:
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

**Vorteile:**
- Hervorragende Dokumentenanalyse
- Kontext-Verständnis
- Fallback wenn OpenAI nicht verfügbar

### 3. Beide APIs (Optimal)
```bash
# Für maximale Zuverlässigkeit beide konfigurieren:
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

## 🚀 Nach API-Setup:

1. **Server neu starten**
2. **OCR-Upload testen** mit echter Rechnung
3. **Strukturierte Daten** werden automatisch extrahiert:
   - ✅ Lieferant vs. Empfänger korrekt erkannt
   - ✅ Rechnungspositionen einzeln extrahiert
   - ✅ Beträge und Beschreibungen strukturiert
   - ✅ Projekt-Zuordnung möglich

## 📊 Erwartete Verbesserungen:

**Vorher (Tesseract.js):**
- Nur roher Text
- 0-98% Konfidenz
- Keine Strukturierung
- Keine Geschäftslogik

**Nachher (KI-Enhanced):**
- Strukturierte JSON-Daten
- 85-95% Konfidenz
- Intelligente Feldererkennung
- Österreichische Geschäftslogik
- Rechnungspositions-Extraktion

