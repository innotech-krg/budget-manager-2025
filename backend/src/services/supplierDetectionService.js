// =====================================================
// Supplier Detection Service - Automatische Lieferanten-Erkennung
// Erkennt und legt Lieferanten aus OCR-Daten automatisch an
// =====================================================

import { supabaseAdmin } from '../config/database.js';
import { createAuditLog } from '../utils/auditLogger.js';
// Tesseract-Optimizer entfernt in Story 2.7 (KI-Refactoring)

class SupplierDetectionService {
  constructor() {
    this.confidenceThreshold = 70; // Mindest-Konfidenz für automatische Lieferanten-Anlage
    this.similarityThreshold = 0.8; // Schwellwert für Ähnlichkeits-Matching
  }

  // =====================================================
  // MAIN SUPPLIER DETECTION
  // =====================================================

  async detectAndCreateSupplier(ocrResult, ocrProcessingId) {
    try {
      console.log('🔍 Starte automatische Lieferanten-Erkennung...');

      if (!ocrResult.supplierInfo || ocrResult.supplierInfo.confidence < this.confidenceThreshold) {
        console.log(`⚠️ Lieferanten-Konfidenz zu niedrig: ${ocrResult.supplierInfo?.confidence || 0}%`);
        return {
          success: false,
          reason: 'CONFIDENCE_TOO_LOW',
          confidence: ocrResult.supplierInfo?.confidence || 0
        };
      }

      const supplierInfo = ocrResult.supplierInfo;
      console.log(`📊 Lieferanten-Info gefunden: ${supplierInfo.name} (${supplierInfo.confidence}%)`);

      // 1. Prüfe ob Lieferant bereits existiert
      const existingSupplier = await this.findExistingSupplier(supplierInfo);
      
      if (existingSupplier) {
        console.log(`✅ Lieferant bereits vorhanden: ${existingSupplier.name}`);
        return {
          success: true,
          supplier: existingSupplier,
          action: 'FOUND_EXISTING',
          confidence: supplierInfo.confidence
        };
      }

      // 2. Erstelle neuen Lieferanten
      const newSupplier = await this.createNewSupplier(supplierInfo, ocrResult, ocrProcessingId);
      
      if (newSupplier) {
        console.log(`🆕 Neuer Lieferant angelegt: ${newSupplier.name}`);
        return {
          success: true,
          supplier: newSupplier,
          action: 'CREATED_NEW',
          confidence: supplierInfo.confidence
        };
      } else {
        throw new Error('Lieferanten-Erstellung fehlgeschlagen');
      }

    } catch (error) {
      console.error('❌ Fehler bei Lieferanten-Erkennung:', error);
      return {
        success: false,
        error: error.message,
        confidence: ocrResult.supplierInfo?.confidence || 0
      };
    }
  }

  // =====================================================
  // EXISTING SUPPLIER SEARCH
  // =====================================================

  async findExistingSupplier(supplierInfo) {
    try {
      if (!supplierInfo.name) return null;

      // Normalisiere den Namen für besseres Matching
      const normalizedName = this.normalizeSupplierName(supplierInfo.name);
      
      console.log(`🔍 Suche nach existierendem Lieferanten: "${normalizedName}"`);

      // 1. Exakte Suche nach normalisiertem Namen
      const { data: exactMatch, error: exactError } = await supabaseAdmin
        .from('suppliers')
        .select('*')
        .eq('normalized_name', normalizedName)
        .eq('status', 'ACTIVE')
        .single();

      if (!exactError && exactMatch) {
        console.log(`✅ Exakte Übereinstimmung gefunden: ${exactMatch.name}`);
        return exactMatch;
      }

      // 2. Ähnlichkeits-Suche bei allen aktiven Lieferanten
      const { data: allSuppliers, error: allError } = await supabaseAdmin
        .from('suppliers')
        .select('*')
        .eq('status', 'ACTIVE');

      if (allError) {
        console.error('❌ Fehler beim Abrufen der Lieferanten:', allError);
        return null;
      }

      // 3. Ähnlichkeits-Matching
      for (const supplier of allSuppliers || []) {
        const similarity = this.calculateNameSimilarity(normalizedName, supplier.normalized_name);
        
        if (similarity >= this.similarityThreshold) {
          console.log(`🎯 Ähnlicher Lieferant gefunden: ${supplier.name} (${(similarity * 100).toFixed(1)}% Ähnlichkeit)`);
          
          // Zusätzliche Validierung mit Steuernummer oder VAT-ID
          if (this.validateSupplierMatch(supplierInfo, supplier)) {
            return supplier;
          }
        }
      }

      // 4. Suche nach Steuernummer/VAT-ID
      if (supplierInfo.taxNumber || supplierInfo.vatId) {
        const taxIdentifier = supplierInfo.vatId || supplierInfo.taxNumber;
        
        const { data: taxMatch, error: taxError } = await supabaseAdmin
          .from('suppliers')
          .select('*')
          .or(`tax_id.eq.${taxIdentifier}`)
          .eq('status', 'ACTIVE')
          .single();

        if (!taxError && taxMatch) {
          console.log(`🏛️ Lieferant über Steuernummer gefunden: ${taxMatch.name}`);
          return taxMatch;
        }
      }

      console.log('🆕 Kein existierender Lieferant gefunden');
      return null;

    } catch (error) {
      console.error('❌ Fehler bei der Lieferanten-Suche:', error);
      return null;
    }
  }

  // =====================================================
  // NEW SUPPLIER CREATION
  // =====================================================

  async createNewSupplier(supplierInfo, ocrResult, ocrProcessingId) {
    try {
      console.log(`🆕 Erstelle neuen Lieferanten: ${supplierInfo.name}`);

      // Lieferanten-Daten zusammenstellen
      const supplierData = {
        name: supplierInfo.name.trim(),
        normalized_name: this.normalizeSupplierName(supplierInfo.name),
        tax_id: supplierInfo.vatId || supplierInfo.taxNumber || null,
        address: supplierInfo.address || null,
        identifiers: this.buildSupplierIdentifiers(supplierInfo, ocrResult),
        status: 'ACTIVE'
      };

      // Lieferant in Datenbank anlegen
      const { data: newSupplier, error: createError } = await supabaseAdmin
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (createError) {
        throw new Error(`Fehler beim Anlegen des Lieferanten: ${createError.message}`);
      }

      // Initiales Pattern für diesen Lieferanten erstellen
      await this.createInitialSupplierPattern(newSupplier.id, ocrResult, ocrProcessingId);

      // Audit-Log erstellen
      await createAuditLog({
        table_name: 'suppliers',
        record_id: newSupplier.id,
        action: 'CREATE',
        new_data: supplierData,
        user_id: 'system-ocr'
      });

      console.log(`✅ Lieferant erfolgreich angelegt: ${newSupplier.name} (ID: ${newSupplier.id})`);
      return newSupplier;

    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Lieferanten:', error);
      throw error;
    }
  }

  // =====================================================
  // INITIAL PATTERN CREATION
  // =====================================================

  async createInitialSupplierPattern(supplierId, ocrResult, ocrProcessingId) {
    try {
      console.log(`🧠 Erstelle initiales Pattern für Lieferant ${supplierId}...`);

      // Pattern-Daten aus OCR-Ergebnis extrahieren
      const patternData = {
        // Lieferanten-spezifische Erkennungsmerkmale
        companyNamePatterns: this.extractNamePatterns(ocrResult.supplierInfo.name),
        
        // Dokumentstruktur-Patterns
        layoutPatterns: this.extractLayoutPatterns(ocrResult),
        
        // Feld-Positionen (falls Bounding Boxes verfügbar)
        fieldPositions: this.extractFieldPositions(ocrResult),
        
        // Typische Begriffe und Formulierungen
        textPatterns: this.extractTextPatterns(ocrResult.text),
        
        // Dokumenttyp-spezifische Merkmale
        documentTypeIndicators: this.extractDocumentTypeIndicators(ocrResult),
        
        // Metadaten
        metadata: {
          created_from_ocr: ocrProcessingId,
          initial_confidence: ocrResult.supplierInfo.confidence,
          document_type: ocrResult.documentType || 'invoice',
          language: 'de'
        }
      };

      // Pattern in Datenbank speichern
      const { data: pattern, error: patternError } = await supabaseAdmin
        .from('supplier_patterns')
        .insert([{
          supplier_id: supplierId,
          version: 1,
          pattern_data: patternData,
          accuracy_score: ocrResult.supplierInfo.confidence,
          training_samples: 1,
          is_active: true
        }])
        .select()
        .single();

      if (patternError) {
        console.error('❌ Fehler beim Erstellen des Patterns:', patternError);
        return null;
      }

      // Training-Session dokumentieren
      await this.createTrainingSession(supplierId, pattern.id, ocrProcessingId, ocrResult);

      console.log(`✅ Initiales Pattern erstellt: ${pattern.id}`);
      return pattern;

    } catch (error) {
      console.error('❌ Fehler beim Erstellen des initialen Patterns:', error);
      return null;
    }
  }

  // =====================================================
  // TRAINING SESSION DOCUMENTATION
  // =====================================================

  async createTrainingSession(supplierId, patternId, ocrProcessingId, ocrResult) {
    try {
      const trainingData = {
        supplier_recognition: {
          name: ocrResult.supplierInfo.name,
          confidence: ocrResult.supplierInfo.confidence,
          extracted_fields: ocrResult.extractedData
        },
        ocr_quality: {
          overall_confidence: ocrResult.confidence,
          text_length: ocrResult.text.length,
          business_data_found: ocrResult.businessDataFound
        }
      };

      const { error: sessionError } = await supabaseAdmin
        .from('pattern_training_sessions')
        .insert([{
          supplier_id: supplierId,
          pattern_id: patternId,
          ocr_processing_id: ocrProcessingId,
          training_data: trainingData,
          session_type: 'INITIAL',
          accuracy_before: 0,
          accuracy_after: ocrResult.supplierInfo.confidence
        }]);

      if (sessionError) {
        console.error('❌ Fehler beim Erstellen der Training-Session:', sessionError);
      } else {
        console.log('📚 Training-Session dokumentiert');
      }

    } catch (error) {
      console.error('❌ Fehler bei Training-Session-Dokumentation:', error);
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  normalizeSupplierName(name) {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\säöüß]/g, '')
      .replace(/\b(gmbh|ag|kg|ohg|ug|ek)\b/g, '') // Rechtsformen entfernen für besseres Matching
      .trim();
  }

  calculateNameSimilarity(name1, name2) {
    // Einfache Levenshtein-Distanz-basierte Ähnlichkeit
    const distance = this.levenshteinDistance(name1, name2);
    const maxLength = Math.max(name1.length, name2.length);
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  validateSupplierMatch(supplierInfo, existingSupplier) {
    // Zusätzliche Validierung über Steuernummer oder Adresse
    if (supplierInfo.taxNumber && existingSupplier.tax_id) {
      return supplierInfo.taxNumber === existingSupplier.tax_id;
    }
    
    if (supplierInfo.vatId && existingSupplier.tax_id) {
      return supplierInfo.vatId === existingSupplier.tax_id;
    }
    
    // Adress-Ähnlichkeit prüfen (falls verfügbar)
    if (supplierInfo.address && existingSupplier.address) {
      const addressSimilarity = this.calculateNameSimilarity(
        supplierInfo.address.toLowerCase(),
        existingSupplier.address.toLowerCase()
      );
      return addressSimilarity >= 0.7;
    }
    
    return true; // Wenn keine zusätzlichen Daten verfügbar, akzeptiere Name-Match
  }

  buildSupplierIdentifiers(supplierInfo, ocrResult) {
    return {
      // Erkennungsmerkmale für zukünftige OCR-Verarbeitung
      name_variations: [
        supplierInfo.name,
        this.normalizeSupplierName(supplierInfo.name)
      ],
      tax_identifiers: [
        supplierInfo.taxNumber,
        supplierInfo.vatId
      ].filter(Boolean),
      address_keywords: supplierInfo.address ? 
        supplierInfo.address.split(/\s+/).filter(word => word.length > 3) : [],
      document_indicators: [
        ocrResult.documentType || 'invoice'
      ],
      confidence_score: supplierInfo.confidence
    };
  }

  // Pattern-Extraktion-Methoden
  extractNamePatterns(name) {
    return {
      exact: name,
      normalized: this.normalizeSupplierName(name),
      keywords: name.split(/\s+/).filter(word => word.length > 2),
      variations: [
        name.toUpperCase(),
        name.toLowerCase(),
        name.replace(/\s+/g, '')
      ]
    };
  }

  extractLayoutPatterns(ocrResult) {
    // Vereinfachte Layout-Pattern-Extraktion
    return {
      text_length: ocrResult.text.length,
      line_count: ocrResult.text.split('\n').length,
      has_tables: ocrResult.text.includes('\t') || /\s{3,}/.test(ocrResult.text),
      currency_positions: this.findCurrencyPositions(ocrResult.text)
    };
  }

  extractFieldPositions(ocrResult) {
    // Bounding Box Informationen (falls verfügbar)
    if (ocrResult.boundingBoxes && ocrResult.boundingBoxes.length > 0) {
      return {
        supplier_name_area: this.findSupplierNameArea(ocrResult.boundingBoxes),
        amount_areas: this.findAmountAreas(ocrResult.boundingBoxes),
        date_areas: this.findDateAreas(ocrResult.boundingBoxes)
      };
    }
    return {};
  }

  extractTextPatterns(text) {
    return {
      common_phrases: this.extractCommonPhrases(text),
      number_formats: this.extractNumberFormats(text),
      date_formats: this.extractDateFormats(text),
      currency_formats: this.extractCurrencyFormats(text)
    };
  }

  extractDocumentTypeIndicators(ocrResult) {
    const text = ocrResult.text.toLowerCase();
    return {
      document_type: ocrResult.documentType || 'invoice',
      indicators: [
        text.includes('rechnung') ? 'invoice' : null,
        text.includes('angebot') ? 'quote' : null,
        text.includes('lieferschein') ? 'delivery_note' : null
      ].filter(Boolean),
      language: 'de'
    };
  }

  // Vereinfachte Helper-Methoden für Pattern-Extraktion
  findCurrencyPositions(text) {
    const positions = [];
    const euroMatches = [...text.matchAll(/€/g)];
    euroMatches.forEach(match => positions.push(match.index));
    return positions;
  }

  findSupplierNameArea(boundingBoxes) {
    // Erste Textzeilen sind meist der Lieferantenname
    return boundingBoxes.slice(0, 3).map(box => box.bbox);
  }

  findAmountAreas(boundingBoxes) {
    // Suche nach Beträgen in Bounding Boxes
    return boundingBoxes
      .filter(box => /\d+[,\.]\d{2}/.test(box.text))
      .map(box => box.bbox);
  }

  findDateAreas(boundingBoxes) {
    // Suche nach Daten in Bounding Boxes
    return boundingBoxes
      .filter(box => /\d{1,2}\.\d{1,2}\.\d{4}/.test(box.text))
      .map(box => box.bbox);
  }

  extractCommonPhrases(text) {
    const phrases = [];
    const lines = text.split('\n').filter(line => line.trim().length > 5);
    lines.slice(0, 10).forEach(line => {
      if (line.length < 100) phrases.push(line.trim());
    });
    return phrases;
  }

  extractNumberFormats(text) {
    const formats = [];
    const numberMatches = text.match(/\d{1,3}(?:[.,]\d{3})*[.,]\d{2}/g);
    if (numberMatches) {
      numberMatches.forEach(match => {
        if (!formats.includes(match)) formats.push(match);
      });
    }
    return formats.slice(0, 5); // Nur die ersten 5 Formate
  }

  extractDateFormats(text) {
    const formats = [];
    const dateMatches = text.match(/\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}/g);
    if (dateMatches) {
      dateMatches.forEach(match => {
        if (!formats.includes(match)) formats.push(match);
      });
    }
    return formats.slice(0, 3); // Nur die ersten 3 Formate
  }

  extractCurrencyFormats(text) {
    const formats = [];
    const currencyMatches = text.match(/\d+[,\.]\d{2}\s*[€$]|[€$]\s*\d+[,\.]\d{2}/g);
    if (currencyMatches) {
      currencyMatches.forEach(match => {
        if (!formats.includes(match)) formats.push(match);
      });
    }
    return formats.slice(0, 5); // Nur die ersten 5 Formate
  }
}

export default new SupplierDetectionService();

