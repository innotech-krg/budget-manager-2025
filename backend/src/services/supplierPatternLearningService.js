/**
 * Supplier Pattern Learning Service
 * Lernt lieferantenspezifische Muster und generiert optimierte Prompts
 */

import { supabaseAdmin } from '../config/database.js';

class SupplierPatternLearningService {
  constructor() {
    this.patterns = new Map(); // Cache für Lieferanten-Patterns
  }

  /**
   * PHASE 1: INITIALES ANLERNEN
   * Benutzer-geführte Pattern-Erkennung beim ersten Upload
   */
  async initiateSupplierLearning(ocrProcessingId, rawText, userCorrections = null) {
    console.log('🎓 Starte Lieferanten-Pattern-Learning...');
    
    try {
      // 1. Analysiere den rohen OCR-Text für Pattern
      const detectedPatterns = this.analyzeTextPatterns(rawText);
      
      // 2. Wenn Benutzer-Korrekturen vorhanden, integriere sie
      if (userCorrections) {
        detectedPatterns.userCorrections = userCorrections;
      }
      
      // 3. Generiere initiales Lieferanten-Pattern
      const supplierPattern = await this.generateSupplierPattern(detectedPatterns);
      
      // 4. Speichere Pattern in Datenbank
      const patternId = await this.saveSupplierPattern(supplierPattern);
      
      console.log(`✅ Lieferanten-Pattern erstellt: ${patternId}`);
      return { patternId, supplierPattern };
      
    } catch (error) {
      console.error('❌ Fehler beim Lieferanten-Learning:', error);
      throw error;
    }
  }

  /**
   * Analysiert OCR-Text für wiederkehrende Muster
   */
  analyzeTextPatterns(rawText) {
    const patterns = {
      // Lieferanten-Position-Patterns
      supplierPositions: [],
      // Adress-Patterns
      addressPatterns: [],
      // UID/Steuer-Patterns
      taxPatterns: [],
      // Kontakt-Patterns
      contactPatterns: [],
      // Layout-Patterns
      layoutPatterns: {}
    };

    // Sicherstellen, dass rawText ein String ist
    let textToAnalyze = '';
    if (typeof rawText === 'string') {
      textToAnalyze = rawText;
    } else if (typeof rawText === 'object' && rawText !== null) {
      textToAnalyze = JSON.stringify(rawText);
    } else {
      textToAnalyze = String(rawText || '');
    }
    
    const lines = textToAnalyze.split('\n').filter(line => line.trim());
    
    // 1. LIEFERANTEN-POSITION ERKENNEN
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Mögliche Lieferanten-Positionen
      if (this.isLikelySupplierName(trimmed)) {
        patterns.supplierPositions.push({
          text: trimmed,
          position: index,
          context: {
            before: lines[index - 1] || '',
            after: lines[index + 1] || ''
          }
        });
      }
      
      // Adress-Patterns
      if (this.isLikelyAddress(trimmed)) {
        patterns.addressPatterns.push({
          text: trimmed,
          position: index,
          type: 'address'
        });
      }
      
      // UID/Steuer-Patterns
      if (this.isLikelyTaxNumber(trimmed)) {
        patterns.taxPatterns.push({
          text: trimmed,
          position: index,
          type: 'tax_number'
        });
      }
    });

    // 2. LAYOUT-ANALYSE
    patterns.layoutPatterns = {
      totalLines: lines.length,
      supplierInHeader: patterns.supplierPositions.some(p => p.position < 5),
      supplierInFooter: patterns.supplierPositions.some(p => p.position > lines.length - 5),
      hasLetterhead: this.hasLetterheadPattern(lines.slice(0, 3)),
      hasSignature: this.hasSignaturePattern(lines.slice(-3))
    };

    return patterns;
  }

  /**
   * Generiert lieferantenspezifisches Pattern basierend auf Analyse
   */
  async generateSupplierPattern(detectedPatterns) {
    const pattern = {
      id: `pattern_${Date.now()}`,
      supplierName: null,
      confidence: 0,
      
      // Position-Strategien
      positionStrategies: [],
      
      // Erkennungs-Regeln
      recognitionRules: {
        namePatterns: [],
        addressPatterns: [],
        contactPatterns: [],
        layoutRules: {}
      },
      
      // Optimierter Prompt
      customPrompt: null,
      
      // Metadaten
      createdAt: new Date().toISOString(),
      learningSessions: 1,
      successRate: 0
    };

    // 1. BESTIMME LIEFERANTEN-NAME
    // Priorisiere erkannten Namen aus OCR-Service
    if (detectedPatterns.userCorrections?.detectedSupplierName) {
      pattern.supplierName = detectedPatterns.userCorrections.detectedSupplierName;
      pattern.confidence = 95; // Hohe Konfidenz für OCR-Service Erkennung
      console.log(`🎯 Verwende OCR-erkannten Lieferanten: ${pattern.supplierName}`);
    } else if (detectedPatterns.supplierPositions.length > 0) {
      // Wähle wahrscheinlichsten Kandidaten
      const bestCandidate = this.selectBestSupplierCandidate(detectedPatterns.supplierPositions);
      pattern.supplierName = bestCandidate.text;
      pattern.confidence = bestCandidate.confidence;
      console.log(`🎯 Bester Lieferanten-Kandidat: ${bestCandidate.text} (${bestCandidate.confidence}% Konfidenz)`);
    } else {
      console.log('⚠️ Keine Lieferanten-Kandidaten gefunden');
      // Fallback: Verwende "UNKNOWN" als Platzhalter
      pattern.supplierName = 'UNKNOWN';
      pattern.confidence = 0;
    }

    // 2. ERSTELLE POSITION-STRATEGIEN
    pattern.positionStrategies = this.createPositionStrategies(detectedPatterns);

    // 3. GENERIERE CUSTOM PROMPT
    pattern.customPrompt = this.generateCustomPrompt(pattern, detectedPatterns);

    return pattern;
  }

  /**
   * Erstellt Position-Strategien basierend auf erkannten Mustern
   */
  createPositionStrategies(patterns) {
    const strategies = [];

    // Strategie 1: Header-Position
    if (patterns.layoutPatterns.supplierInHeader) {
      strategies.push({
        type: 'header',
        description: 'Lieferant steht im Briefkopf (erste 5 Zeilen)',
        searchArea: 'top',
        priority: 1
      });
    }

    // Strategie 2: Footer-Position
    if (patterns.layoutPatterns.supplierInFooter) {
      strategies.push({
        type: 'footer',
        description: 'Lieferant steht am Ende (letzte 5 Zeilen)',
        searchArea: 'bottom',
        priority: patterns.layoutPatterns.supplierInHeader ? 2 : 1
      });
    }

    // Strategie 3: Signature-Position
    if (patterns.layoutPatterns.hasSignature) {
      strategies.push({
        type: 'signature',
        description: 'Lieferant als Unterschrift/Signatur',
        searchArea: 'signature',
        priority: 3
      });
    }

    return strategies;
  }

  /**
   * Generiert lieferantenspezifischen Custom Prompt
   */
  generateCustomPrompt(pattern, detectedPatterns) {
    let customPrompt = `
LIEFERANTEN-SPEZIFISCHE ANALYSE FÜR: ${pattern.supplierName || 'UNBEKANNT'}

ERKANNTE MUSTER:
`;

    // Position-spezifische Anweisungen
    pattern.positionStrategies.forEach(strategy => {
      customPrompt += `
- ${strategy.description}
  Suchbereich: ${strategy.searchArea}
  Priorität: ${strategy.priority}`;
    });

    customPrompt += `

SPEZIFISCHE ERKENNUNGSREGELN:
`;

    // Layout-spezifische Regeln
    if (detectedPatterns.layoutPatterns.supplierInFooter) {
      customPrompt += `
- WICHTIG: Lieferant steht am ENDE der Rechnung
- Schaue in den letzten 3-5 Zeilen nach einzelnen Wörtern
- Typische Position: Nach "Vielen Dank" oder als letzte Zeile`;
    }

    if (detectedPatterns.layoutPatterns.hasLetterhead) {
      customPrompt += `
- Briefkopf vorhanden: Prüfe auch Header-Bereich
- Firmenname könnte im oberen Bereich stehen`;
    }

    // Adress-Pattern
    if (detectedPatterns.addressPatterns.length > 0) {
      customPrompt += `
- Adress-Muster erkannt: ${detectedPatterns.addressPatterns.length} Kandidaten
- Suche nach Postleitzahl + Ort Kombinationen
- Österreichische PLZ: 4-stellig (z.B. 1010, 4658)`;
    }

    // UID-Pattern
    if (detectedPatterns.taxPatterns.length > 0) {
      customPrompt += `
- UID-Muster erkannt: Österreichische UID (ATU + 8 Ziffern)
- Beispiel: ATU63124826`;
    }

    customPrompt += `

ANALYSE-PRIORITÄT:
1. Suche zuerst nach bekannten Lieferanten-Namen: "${pattern.supplierName}"
2. Dann nach Position-Strategien (siehe oben)
3. Validiere mit Adress- und UID-Mustern
4. Extrahiere vollständige Lieferanten-Informationen

AUSGABE-FORMAT:
Stelle sicher, dass folgende Felder gefüllt werden:
- supplier.name: "${pattern.supplierName || '[ERKANNTER_NAME]'}"
- supplier.address: "[VOLLSTÄNDIGE_ADRESSE]"
- supplier.uid: "[ATU_NUMMER]"
- supplier.contact: "[TELEFON/EMAIL_FALLS_VORHANDEN]"
`;

    return customPrompt;
  }

  /**
   * Hilfsmethoden für Pattern-Erkennung
   */
  isLikelySupplierName(text) {
    // Heuristische Regeln für Lieferanten-Namen
    const patterns = [
      /^[A-Z][a-z]+$/,           // Einzelwort, Großbuchstabe
      /^[A-Z]+$/,                // Nur Großbuchstaben (z.B. DEFINE)
      /GmbH|AG|OG|KG/i,          // Rechtsformen
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/ // Vor- und Nachname
    ];
    
    return patterns.some(pattern => pattern.test(text)) && 
           text.length > 2 && 
           text.length < 50;
  }

  isLikelyAddress(text) {
    // Österreichische Adress-Patterns
    const patterns = [
      /\d{4}\s+[A-Z][a-z]+/,     // PLZ + Ort
      /[A-Z][a-z]+\s+\d+/,       // Straße + Hausnummer
      /\d{4}\s*[A-Z][a-z]+\s*,?\s*Österreich/i
    ];
    
    return patterns.some(pattern => pattern.test(text));
  }

  isLikelyTaxNumber(text) {
    // Österreichische Steuer-Patterns
    const patterns = [
      /ATU\d{8}/,                // UID
      /FN\s*\d+[a-z]?/i,         // Firmenbuchnummer
      /IBAN\s*AT\d{2}/i          // IBAN
    ];
    
    return patterns.some(pattern => pattern.test(text));
  }

  selectBestSupplierCandidate(candidates) {
    // Bewerte Kandidaten nach verschiedenen Kriterien
    return candidates.map(candidate => ({
      ...candidate,
      confidence: this.calculateSupplierConfidence(candidate)
    })).sort((a, b) => b.confidence - a.confidence)[0];
  }

  calculateSupplierConfidence(candidate) {
    let confidence = 50; // Basis-Konfidenz
    
    // Position-basierte Bewertung
    if (candidate.position < 5) confidence += 20;      // Header
    if (candidate.position > 20) confidence += 30;     // Footer (höhere Priorität)
    
    // Text-basierte Bewertung
    if (/^[A-Z]+$/.test(candidate.text)) confidence += 25; // Nur Großbuchstaben
    if (candidate.text.length < 10) confidence += 15;      // Kurze Namen
    
    return Math.min(confidence, 100);
  }

  hasLetterheadPattern(headerLines) {
    return headerLines.some(line => 
      /GmbH|AG|OG|KG|Tel|Email|www/i.test(line)
    );
  }

  hasSignaturePattern(footerLines) {
    return footerLines.some(line => 
      /Vielen Dank|Liebe Grüße|Team|Ihr/i.test(line)
    );
  }

  /**
   * Speichert Lieferanten-Pattern in Datenbank
   */
  async saveSupplierPattern(pattern) {
    try {
      const { data, error } = await supabaseAdmin
        .from('supplier_patterns')
        .insert({
          supplier_name: pattern.supplierName,
          pattern_data: pattern,
          confidence: pattern.confidence,
          position_strategies: pattern.positionStrategies,
          custom_prompt: pattern.customPrompt,
          learning_sessions: pattern.learningSessions,
          success_rate: pattern.successRate,
          created_at: pattern.createdAt
        })
        .select()
        .single();

      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Patterns:', error);
      throw error;
    }
  }

  /**
   * PHASE 2: PATTERN-ANWENDUNG
   * Lädt und wendet lieferantenspezifische Patterns an
   */
  async getSupplierPattern(supplierName) {
    try {
      const { data, error } = await supabaseAdmin
        .from('supplier_patterns')
        .select('*')
        .eq('supplier_name', supplierName)
        .order('success_rate', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data || null;
    } catch (error) {
      console.error('❌ Fehler beim Laden des Patterns:', error);
      return null;
    }
  }

  /**
   * Generiert optimierten Prompt basierend auf Lieferanten-Pattern
   */
  generateOptimizedPrompt(rawText, supplierPattern = null) {
    let basePrompt = `
Analysiere diese österreichische Rechnung und extrahiere die Daten strukturiert als JSON:

ROHER OCR-TEXT:
${rawText}

WICHTIGE HINWEISE FÜR LIEFERANTEN-ERKENNUNG:
- InnoTech Holding GmbH ist IMMER der Empfänger (Kunde), NICHT der Lieferant
- Der Lieferant kann an verschiedenen Stellen stehen:
  * Oben im Briefkopf (häufigste Position)
  * Am Ende der Rechnung als Unterschrift/Firmenname
  * In der Mitte bei Kontaktdaten
  * Als einzelnes Wort am Ende (z.B. "DEFINE")
`;

    // Wenn Lieferanten-Pattern vorhanden, verwende Custom Prompt
    if (supplierPattern && supplierPattern.custom_prompt) {
      basePrompt += `

${supplierPattern.custom_prompt}
`;
    } else {
      // Fallback: Generische Anweisungen
      basePrompt += `

BEISPIELE FÜR LIEFERANTEN-ERKENNUNG:
- "DEFINE" am Ende → Lieferant: "DEFINE"
- "Ihr ABC-Team" → Lieferant: "ABC"
- "XYZ GmbH" irgendwo im Text → Lieferant: "XYZ GmbH"

SPEZIELLE ANWEISUNGEN FÜR DIESEN TEXT:
Schaue besonders nach:
1. Einzelwörtern am Ende des Texts (letzten 3-5 Zeilen)
2. Firmennamen nach "Liebe Grüße" oder "VIELEN DANK"
3. Namen vor "Team" oder nach "Ihr"
4. Alle Großbuchstaben-Wörter die Firmennamen sein könnten

ANALYSE-REIHENFOLGE:
1. Suche zuerst am Ende des Texts nach Lieferanten-Hinweisen
2. Dann im Briefkopf/Header
3. Dann in der Mitte bei Kontaktdaten
`;
    }

    basePrompt += `

ÖSTERREICHISCHE GESCHÄFTSLOGIK:
- UID-Nummern: ATU + 8 Ziffern (z.B. ATU63124826)
- Postleitzahlen: 4-stellig (z.B. 1010, 4658)
- Währung: EUR
- Standard-USt: 20%

EXTRAHIERE ALLE RECHNUNGSPOSITIONEN:
- Beschreibung der Leistung
- Menge und Einheit
- Einzelpreis und Gesamtpreis
- USt-Satz

ANTWORT-FORMAT (JSON):
{
  "supplier": {
    "name": "[LIEFERANTEN_NAME]",
    "address": "[VOLLSTÄNDIGE_ADRESSE]",
    "uid": "[ATU_NUMMER]",
    "contact": "[TELEFON/EMAIL]"
  },
  "recipient": {
    "name": "InnoTech Holding GmbH",
    "address": "[EMPFÄNGER_ADRESSE]",
    "uid": "[EMPFÄNGER_UID]"
  },
  "invoice": {
    "number": "[RECHNUNGSNUMMER]",
    "date": "[RECHNUNGSDATUM]",
    "dueDate": "[FÄLLIGKEITSDATUM]"
  },
  "positions": [
    {
      "description": "[LEISTUNGSBESCHREIBUNG]",
      "quantity": [MENGE],
      "unit": "[EINHEIT]",
      "unitPrice": [EINZELPREIS],
      "totalPrice": [GESAMTPREIS],
      "vatRate": [UST_SATZ]
    }
  ],
  "totals": {
    "netAmount": [NETTO_BETRAG],
    "vatAmount": [UST_BETRAG],
    "grossAmount": [BRUTTO_BETRAG],
    "currency": "EUR"
  },
  "confidence": [KONFIDENZ_0_BIS_100],
  "extractedFields": ["[LISTE_DER_ERKANNTEN_FELDER]"]
}
`;

    return basePrompt;
  }
}

export default SupplierPatternLearningService;
