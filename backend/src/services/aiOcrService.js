// =====================================================
// AI-Enhanced OCR Service - Intelligente Rechnungsverarbeitung
// =====================================================

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '../config/database.js';
import { createAuditLog } from '../utils/auditLogger.js';

// =====================================================
// USAGE TRACKING HELPER
// =====================================================
async function trackApiUsage(provider, model, tokensUsed = 0, cost = 0) {
  try {
    // Update AI Provider last_used_at
    await supabaseAdmin
      .from('ai_providers')
      .update({ 
        last_used_at: new Date().toISOString()
      })
      .eq('name', provider.toLowerCase());

    // Update API Key usage (find by service name)
    const serviceName = provider === 'openai' ? 'OpenAI' : 'Anthropic';
    // Erst aktuellen usage_count holen
    const { data: currentKey } = await supabaseAdmin
      .from('api_keys')
      .select('usage_count')
      .eq('service_name', serviceName)
      .eq('is_active', true)
      .single();

    // Dann mit incrementiertem Wert updaten
    await supabaseAdmin
      .from('api_keys')
      .update({ 
        last_used_at: new Date().toISOString(),
        usage_count: (currentKey?.usage_count || 0) + 1
      })
      .eq('service_name', serviceName)
      .eq('is_active', true);

    // Log usage for monitoring
    console.log(`📊 API Usage tracked: ${provider} (${model}) - Tokens: ${tokensUsed}, Cost: €${cost}`);
    
  } catch (error) {
    console.error('❌ Fehler beim Usage-Tracking:', error);
    // Nicht kritisch - OCR soll weiterlaufen auch wenn Tracking fehlschlägt
  }
}

class AIEnhancedOCRService {
  constructor() {
    // Lazy initialization - APIs werden erst beim ersten Aufruf initialisiert
    this.openai = null;
    this.anthropic = null;
    this.initialized = false;

    // Austrian Business Context
    this.austrianContext = {
      currency: 'EUR',
      vatRates: [10, 13, 20],
      businessIdentifiers: ['UID', 'ATU', 'Firmenbuch', 'FN'],
      commonSuppliers: ['Defne', 'InnoTech', 'Holding'],
      recipient: 'InnoTech Holding GmbH' // Wir sind immer der Empfänger
    };
  }

  // Lazy initialization der KI-APIs
  initializeAPIs() {
    if (this.initialized) return;

    console.log('🔍 Debug - Initialisiere KI-APIs...');
    console.log('  OpenAI Key:', process.env.OPENAI_API_KEY ? 'Gefunden' : 'Nicht gefunden');
    console.log('  Anthropic Key:', process.env.ANTHROPIC_API_KEY ? 'Gefunden' : 'Nicht gefunden');

    // OpenAI Configuration
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('✅ OpenAI initialisiert');
    }

    // Anthropic Configuration  
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      console.log('✅ Anthropic initialisiert');
    }

    this.initialized = true;
  }

  /**
   * Intelligente Rechnungsanalyse mit KI (Story 2.7 - Direkte Bildverarbeitung)
   */
  async analyzeInvoiceWithAI(rawText, ocrProcessingId, supplierPattern = null, base64Data = null, mimeType = null) {
    console.log('🧠 Starte KI-basierte Rechnungsanalyse...');
    console.log(`🔍 Debug - mimeType: ${mimeType}, base64Data: ${base64Data ? 'vorhanden' : 'nicht vorhanden'}`);
    
    // Normalisiere MIME-Type für KI-APIs
    if (mimeType === 'image/jpg') {
      mimeType = 'image/jpeg';
      console.log('🔧 MIME-Type korrigiert: image/jpg → image/jpeg');
    }
    
    // Initialisiere KI-APIs falls noch nicht geschehen
    this.initializeAPIs();
    
    try {
      let result = null;
      
      // 1. Für PDFs: Verwende Claude (unterstützt PDFs nativ)
      if (mimeType === 'application/pdf' && this.anthropic) {
        console.log('🤖 Verwende Anthropic Claude für PDF-Analyse...');
        if (base64Data && mimeType) {
          result = await this.analyzeImageWithClaude(base64Data, mimeType, supplierPattern);
        } else if (rawText) {
          result = await this.analyzeWithClaude(rawText, supplierPattern);
        }
      }
      
      // 2. Für Bilder: Verwende OpenAI GPT-4 Vision
      else if (this.openai && (typeof mimeType === 'string' && mimeType.startsWith('image/') || !mimeType)) {
        console.log('🤖 Verwende OpenAI GPT-4 Vision für Bild-Analyse...');
        if (base64Data && mimeType) {
          result = await this.analyzeImageWithOpenAI(base64Data, mimeType, supplierPattern);
        } else if (rawText) {
          result = await this.analyzeWithOpenAI(rawText, supplierPattern);
        }
      }
      
      // 3. Fallback zu Claude falls OpenAI nicht verfügbar oder fehlgeschlagen
      if (!result && this.anthropic) {
        console.log('🤖 Fallback zu Anthropic Claude...');
        if (base64Data && mimeType) {
          result = await this.analyzeImageWithClaude(base64Data, mimeType, supplierPattern);
        } else if (rawText) {
          result = await this.analyzeWithClaude(rawText, supplierPattern);
        }
      }
      
      if (!result) {
        throw new Error('Keine KI-API verfügbar. Bitte OPENAI_API_KEY oder ANTHROPIC_API_KEY konfigurieren.');
      }

      // 3. Ergebnis validieren und speichern
      const validatedResult = this.validateAIResult(result);
      await this.saveAIAnalysis(ocrProcessingId, validatedResult);
      
      console.log('✅ KI-Analyse erfolgreich abgeschlossen');
      return validatedResult;

    } catch (error) {
      console.error('❌ Fehler bei KI-Analyse:', error);
      throw error;
    }
  }

  /**
   * OpenAI GPT-4 Analyse
   */
  async analyzeWithOpenAI(rawText, supplierPattern = null) {
    const prompt = this.createAnalysisPrompt(rawText, supplierPattern);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "Du bist ein Experte für österreichische Rechnungsverarbeitung und Lieferanten-Erkennung. Analysiere Rechnungen strukturiert und erkenne Lieferanten auch wenn sie nur als einzelnes Wort am Ende stehen (z.B. 'DEFINE'). Extrahiere alle relevanten Daten als JSON."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    // Track API usage
    const tokensUsed = response.usage?.total_tokens || 0;
    const cost = (tokensUsed / 1000) * 0.03; // €0.03 per 1k tokens for GPT-4
    await trackApiUsage('openai', 'gpt-4-turbo-preview', tokensUsed, cost);

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Anthropic Claude Analyse
   */
  async analyzeWithClaude(rawText, supplierPattern = null) {
    const prompt = this.createAnalysisPrompt(rawText, supplierPattern);
    
    const response = await this.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      temperature: 0.1,
      system: "Du bist ein Experte für österreichische Rechnungsverarbeitung und Lieferanten-Erkennung. Analysiere Rechnungen strukturiert und erkenne Lieferanten auch wenn sie nur als einzelnes Wort am Ende stehen (z.B. 'DEFINE'). Extrahiere alle relevanten Daten als JSON.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    // Track API usage
    const tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;
    const cost = (tokensUsed / 1000) * 0.025; // €0.025 per 1k tokens for Claude
    await trackApiUsage('anthropic', 'claude-3-5-sonnet', tokensUsed, cost);

    // Claude gibt manchmal Text zurück, der JSON enthält
    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
  }

  /**
   * Erstellt strukturierten Analyse-Prompt
   */
  createAnalysisPrompt(rawText, supplierPattern = null) {
    let prompt = `
Analysiere diese österreichische Rechnung und extrahiere die Daten strukturiert als JSON:

ROHER OCR-TEXT:
${rawText}

WICHTIGE HINWEISE FÜR LIEFERANTEN-ERKENNUNG:
- InnoTech Holding GmbH ist IMMER der Empfänger (Kunde), NICHT der Lieferant
- Der Lieferant kann an verschiedenen Stellen stehen:
  * Oben im Briefkopf (häufigste Position)
  * Am Ende der Rechnung als Unterschrift/Firmenname (z.B. "DEFINE", "Ihr XYZ-Team")
  * In der Fußzeile mit Kontaktdaten
  * Als "Rechnungssteller" oder "Von:" bezeichnet
- Suche nach Firmennamen wie "DEFINE", "GmbH", "OG", "KG", etc. im GESAMTEN Text
- Auch einzelne Wörter am Ende können Firmennamen sein (z.B. "DEFINE")
- Extrahiere ALLE Rechnungspositionen einzeln mit Beschreibung und Betrag
- Österreichische Geschäftslogik: UID-Nummern, EUR-Währung, 20% USt Standard

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
3. Dann in der Mitte bei Kontaktdaten`;

    // LIEFERANTEN-SPEZIFISCHE PATTERN-INTEGRATION
    if (supplierPattern && supplierPattern.custom_prompt) {
      prompt += `

🎯 LIEFERANTEN-SPEZIFISCHE ERKENNUNGSREGELN:
${supplierPattern.custom_prompt}

BEKANNTE INFORMATIONEN ÜBER DIESEN LIEFERANTEN:
- Name: ${supplierPattern.supplier_name}
- Erfolgsrate: ${supplierPattern.success_rate}%
- Lern-Sessions: ${supplierPattern.learning_sessions}`;

      // Position-Strategien hinzufügen
      if (supplierPattern.position_strategies && supplierPattern.position_strategies.length > 0) {
        prompt += `

POSITION-STRATEGIEN FÜR DIESEN LIEFERANTEN:`;
        supplierPattern.position_strategies.forEach((strategy, index) => {
          prompt += `
${index + 1}. ${strategy.description}
   - Suchbereich: ${strategy.searchArea}
   - Priorität: ${strategy.priority}`;
        });
      }
    }

    prompt += `

GEWÜNSCHTES JSON-FORMAT:
{
  "supplier": {
    "name": "Name des Lieferanten",
    "address": "Vollständige Adresse",
    "uid": "UID-Nummer falls vorhanden",
    "contact": "E-Mail oder Telefon falls vorhanden"
  },
  "recipient": {
    "name": "InnoTech Holding GmbH",
    "address": "Empfänger-Adresse",
    "uid": "ATU-Nummer falls vorhanden"
  },
  "invoice": {
    "number": "Rechnungsnummer",
    "date": "Rechnungsdatum (YYYY-MM-DD)",
    "dueDate": "Zahlungsziel (YYYY-MM-DD)",
    "project": "Projekt-/Auftragsnummer falls vorhanden"
  },
  "positions": [
    {
      "description": "Detaillierte Beschreibung der Position",
      "quantity": 1,
      "unit": "Stk/Std/etc",
      "unitPrice": 0.00,
      "totalPrice": 0.00,
      "vatRate": 20
    }
  ],
  "totals": {
    "netAmount": 0.00,
    "vatAmount": 0.00,
    "grossAmount": 0.00,
    "currency": "EUR"
  },
  "confidence": 95,
  "extractedFields": ["Liste der erfolgreich extrahierten Felder"]
}

Antworte NUR mit dem JSON, ohne zusätzlichen Text.
`;
    
    return prompt;
  }

  /**
   * Validiert KI-Ergebnis
   */
  validateAIResult(result) {
    // Basis-Validierung
    if (!result || typeof result !== 'object') {
      throw new Error('Ungültiges KI-Ergebnis');
    }

    // Stelle sicher, dass InnoTech als Empfänger erkannt wird
    if (!result.recipient) {
      result.recipient = {
        name: 'InnoTech Holding GmbH',
        address: 'Laing 10, 4658 Kirchham',
        uid: 'ATU63124826'
      };
    }

    // Validiere Positionen
    if (!result.positions || !Array.isArray(result.positions)) {
      result.positions = [];
    }

    // Setze Mindest-Konfidenz
    if (!result.confidence || result.confidence < 50) {
      result.confidence = 75; // KI-basiert ist immer besser als Tesseract
    }

    return result;
  }

  /**
   * OpenAI GPT-4 Vision - Direkte Bildanalyse (Story 2.7)
   */
  async analyzeImageWithOpenAI(base64Data, mimeType, supplierPattern = null) {
    try {
      const prompt = this.buildImageAnalysisPrompt(supplierPattern);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      });

      // Track API usage for Vision
      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = (tokensUsed / 1000) * 0.03; // €0.03 per 1k tokens for GPT-4o Vision
      await trackApiUsage('openai', 'gpt-4o-vision', tokensUsed, cost);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Keine Antwort von OpenAI Vision API');
      }

      return this.parseAIResponse(content);
    } catch (error) {
      console.error('❌ OpenAI Vision Fehler:', error);
      throw error;
    }
  }

  /**
   * Anthropic Claude - Direkte Bildanalyse (Story 2.7)
   */
  async analyzeImageWithClaude(base64Data, mimeType, supplierPattern = null) {
    try {
      const prompt = this.buildImageAnalysisPrompt(supplierPattern);
      
      const response = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: base64Data
                }
              },
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ]
      });

      // Track API usage for Claude Vision
      const tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;
      const cost = (tokensUsed / 1000) * 0.025; // €0.025 per 1k tokens for Claude Vision
      await trackApiUsage('anthropic', 'claude-3-5-sonnet-vision', tokensUsed, cost);

      const content = response.content[0]?.text;
      if (!content) {
        throw new Error('Keine Antwort von Claude Vision API');
      }

      return this.parseAIResponse(content);
    } catch (error) {
      console.error('❌ Claude Vision Fehler:', error);
      throw error;
    }
  }

  /**
   * Erstellt optimierten Prompt für Bildanalyse
   */
  buildImageAnalysisPrompt(supplierPattern = null) {
    let prompt = `
Analysiere diese österreichische Geschäftsrechnung und extrahiere strukturierte Daten im JSON-Format.

WICHTIG: 
- Der EMPFÄNGER ist IMMER "InnoTech Holding GmbH" (wir sind das empfangende Unternehmen)
- Der LIEFERANT/RECHNUNGSSTELLER ist das andere Unternehmen
- Achte besonders auf Lieferanten-Namen, die am Ende des Dokuments stehen können

ÖSTERREICHISCHE GESCHÄFTSLOGIK:
- Währung: EUR
- MwSt-Sätze: 10%, 13%, 20%
- UID-Nummern: ATU + 8 Ziffern
- Firmenbuch: FN + Nummer

WICHTIG - NETTO/BRUTTO-ERKENNUNG:
- Prüfe GENAU, ob die Positionsbeträge bereits NETTO (ohne MwSt.) oder BRUTTO (inkl. MwSt.) sind
- ÖSTERREICHISCHE RECHNUNGEN: Meist sind Positionsbeträge NETTO und MwSt. wird am Ende addiert
- Wenn die MwSt. erst am Ende der Rechnung addiert wird → Positionen sind NETTO → "isNetAmount": true
- Wenn bei jeder Position bereits MwSt. enthalten ist → Positionen sind BRUTTO → "isNetAmount": false
- DEFINE®-Rechnungen: Positionen sind typischerweise NETTO-Beträge → "isNetAmount": true

${supplierPattern ? `
BEKANNTER LIEFERANT: ${supplierPattern.supplier_name}
Verwende diese Informationen zur besseren Erkennung.
` : ''}

Extrahiere folgende Daten als JSON:

{
  "supplier": {
    "name": "Firmenname des Lieferanten",
    "address": "Vollständige Adresse",
    "uid": "UID-Nummer falls vorhanden",
    "contact": "E-Mail oder Telefon"
  },
  "recipient": {
    "name": "InnoTech Holding GmbH",
    "address": "Empfänger-Adresse falls sichtbar"
  },
  "invoice": {
    "number": "Rechnungsnummer",
    "date": "Rechnungsdatum (YYYY-MM-DD)",
    "dueDate": "Fälligkeitsdatum (YYYY-MM-DD)",
    "currency": "EUR"
  },
  "positions": [
    {
      "description": "Leistungsbeschreibung",
      "quantity": 1,
      "unitPrice": 100.00,
      "totalPrice": 100.00,
      "vatRate": 20,
      "isNetAmount": true
    }
  ],
  "totals": {
    "netAmount": 100.00,
    "vatAmount": 20.00,
    "grossAmount": 120.00
  },
  "confidence": 95,
  "extractedFields": ["supplier", "invoice", "positions", "totals"]
}

Antworte NUR mit dem JSON, keine zusätzlichen Erklärungen.`;

    return prompt;
  }

  /**
   * Speichert KI-Analyse in Datenbank
   */
  async saveAIAnalysis(ocrProcessingId, analysis) {
    try {
      // Speichere strukturierte Daten
      const { error } = await supabaseAdmin
        .from('ocr_ai_analysis')
        .insert([{
          ocr_processing_id: ocrProcessingId,
          supplier_data: analysis.supplier,
          recipient_data: analysis.recipient,
          invoice_data: analysis.invoice,
          positions: analysis.positions,
          totals: analysis.totals,
          confidence: analysis.confidence,
          extracted_fields: analysis.extractedFields,
          ai_provider: this.openai ? 'openai' : 'anthropic',
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('❌ Fehler beim Speichern der KI-Analyse:', error);
      }

      // Audit-Log
      await createAuditLog({
        table_name: 'ocr_ai_analysis',
        record_id: ocrProcessingId,
        action: 'INSERT',
        new_values: { confidence: analysis.confidence },
        changed_by: '00000000-0000-0000-0000-000000000000' // System user UUID
      });

    } catch (error) {
      console.error('❌ Fehler beim Speichern der KI-Analyse:', error);
    }
  }

  /**
   * Parst die KI-Response und extrahiert strukturierte Daten
   */
  parseAIResponse(content) {
    try {
      console.log('🔍 Parsing KI-Response...');
      console.log('📋 Rohe KI-Antwort (erste 500 Zeichen):', content.substring(0, 500));
      
      // Bereinige die Antwort - entferne Markdown-Blöcke
      let cleanContent = content.trim();
      
      // Entferne ```json und ``` Blöcke
      cleanContent = cleanContent.replace(/```json\s*/gi, '');
      cleanContent = cleanContent.replace(/```\s*/g, '');
      
      // Suche nach JSON-Struktur - erweiterte Regex
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        console.log('📄 Gefundenes JSON:', jsonString.substring(0, 200) + '...');
        
        const parsed = JSON.parse(jsonString);
        
        // Validiere die Struktur
        if (parsed && typeof parsed === 'object') {
          console.log('✅ JSON erfolgreich geparst');
          console.log('🏢 Lieferant:', parsed.supplier?.name || 'Nicht gefunden');
          console.log('📄 Rechnung:', parsed.invoice?.number || 'Nicht gefunden');
          console.log('📊 Positionen:', parsed.positions?.length || 0);
          
          return {
            supplier: parsed.supplier || { name: "Nicht erkannt" },
            recipient: parsed.recipient || { name: "InnoTech Holding GmbH" },
            invoice: parsed.invoice || { currency: "EUR" },
            positions: parsed.positions || [],
            totals: parsed.totals || { netAmount: 0, vatAmount: 0, grossAmount: 0 },
            confidence: parsed.confidence || 50,
            extractedFields: parsed.extractedFields || [],
            raw_text: content
          };
        }
      }
      
      // Fallback: Versuche Zeilen-basiertes Parsing
      console.log('⚠️ JSON-Parsing fehlgeschlagen, versuche Text-Parsing...');
      return this.parseTextResponse(content);
      
    } catch (error) {
      console.error('❌ Fehler beim Parsen der KI-Response:', error);
      console.log('📋 Vollständige KI-Antwort:', content);
      
      // Fallback bei Parse-Fehlern
      return {
        supplier: { name: "Parse-Fehler: " + error.message },
        recipient: { name: "InnoTech Holding GmbH" },
        invoice: { currency: "EUR" },
        positions: [],
        totals: { netAmount: 0, vatAmount: 0, grossAmount: 0 },
        confidence: 10,
        extractedFields: [],
        raw_text: content,
        parse_error: error.message
      };
    }
  }

  /**
   * Fallback Text-Parsing wenn JSON fehlschlägt
   */
  parseTextResponse(content) {
    console.log('📝 Führe Text-basiertes Parsing durch...');
    
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    const result = {
      supplier: { name: "Text-Parsing" },
      recipient: { name: "InnoTech Holding GmbH" },
      invoice: { currency: "EUR" },
      positions: [],
      totals: { netAmount: 0, vatAmount: 0, grossAmount: 0 },
      confidence: 30,
      extractedFields: ["text_parsing"],
      raw_text: content
    };
    
    // Suche nach Lieferant
    for (const line of lines) {
      if (line.toLowerCase().includes('lieferant') || 
          line.toLowerCase().includes('rechnungssteller') ||
          line.toLowerCase().includes('define') ||
          line.toLowerCase().includes('gmbh')) {
        result.supplier.name = line;
        break;
      }
    }
    
    console.log('📝 Text-Parsing Ergebnis:', result.supplier.name);
    return result;
  }

  /**
   * Prüft verfügbare KI-APIs
   */
  getAvailableProviders() {
    const providers = [];
    if (this.openai) providers.push('OpenAI GPT-4');
    if (this.anthropic) providers.push('Anthropic Claude');
    return providers;
  }
}

export default AIEnhancedOCRService;
