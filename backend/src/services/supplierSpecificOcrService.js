// =====================================================
// Supplier-Specific OCR Service - Zweistufige OCR-Verarbeitung
// =====================================================

import { supabaseAdmin } from '../config/database.js';
import AIEnhancedOCRService from './aiOcrService.js';

class SupplierSpecificOCRService {
  constructor() {
    this.aiOcrService = new AIEnhancedOCRService();
  }

  // =====================================================
  // HAUPTFUNKTION: ZWEISTUFIGE OCR-VERARBEITUNG
  // =====================================================

  async processInvoiceWithSupplierSpecificPrompts(pdfBuffer, filename) {
    try {
      console.log('🎯 Starte zweistufige OCR-Verarbeitung...');

      // STUFE 1: LIEFERANTEN-IDENTIFIKATION
      console.log('🔍 Stufe 1: Lieferanten-Identifikation...');
      const supplierRecognitionResult = await this.recognizeSupplier(pdfBuffer, filename);
      
      if (!supplierRecognitionResult.success) {
        console.log('❌ Lieferanten-Identifikation fehlgeschlagen');
        return supplierRecognitionResult;
      }

      const identifiedSupplier = supplierRecognitionResult.supplier;
      console.log(`✅ Lieferant identifiziert: ${identifiedSupplier.name}`);

      // STUFE 2: LIEFERANTENSPEZIFISCHE VERARBEITUNG
      console.log('⚙️ Stufe 2: Lieferantenspezifische Verarbeitung...');
      const processingResult = await this.processWithSupplierPrompt(
        pdfBuffer, 
        filename, 
        identifiedSupplier
      );

      return {
        success: true,
        supplier: identifiedSupplier,
        recognition_result: supplierRecognitionResult,
        processing_result: processingResult,
        workflow: 'two_stage_supplier_specific'
      };

    } catch (error) {
      console.error('❌ Fehler bei zweistufiger OCR-Verarbeitung:', error);
      return {
        success: false,
        error: error.message,
        workflow: 'two_stage_supplier_specific'
      };
    }
  }

  // =====================================================
  // STUFE 1: LIEFERANTEN-IDENTIFIKATION
  // =====================================================

  async recognizeSupplier(pdfBuffer, filename) {
    try {
      // Hole universellen Erkennungs-Prompt
      const recognitionPrompt = await this.getPromptByCategory('SUPPLIER_RECOGNITION');
      
      if (!recognitionPrompt) {
        throw new Error('Kein SUPPLIER_RECOGNITION Prompt gefunden');
      }

      console.log(`🧠 Verwende Erkennungs-Prompt: ${recognitionPrompt.name}`);

      // Führe OCR-Erkennung durch
      const ocrResult = await this.aiOcrService.processInvoice(pdfBuffer, filename);
      
      if (!ocrResult.success) {
        return {
          success: false,
          error: 'OCR-Verarbeitung fehlgeschlagen',
          ocr_error: ocrResult.error
        };
      }

      // Extrahiere Lieferanten-Info aus OCR-Ergebnis
      const supplierInfo = ocrResult.data.supplierInfo;
      
      if (!supplierInfo || !supplierInfo.name) {
        return {
          success: false,
          error: 'Keine Lieferanten-Information in OCR-Ergebnis gefunden'
        };
      }

      // Suche Lieferant in Datenbank
      const supplier = await this.findSupplierByInfo(supplierInfo);
      
      if (!supplier) {
        return {
          success: false,
          error: 'Lieferant nicht in Datenbank gefunden',
          supplier_info: supplierInfo
        };
      }

      return {
        success: true,
        supplier: supplier,
        supplier_info: supplierInfo,
        prompt_used: recognitionPrompt,
        confidence: supplierInfo.confidence || 0
      };

    } catch (error) {
      console.error('❌ Fehler bei Lieferanten-Identifikation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================
  // STUFE 2: LIEFERANTENSPEZIFISCHE VERARBEITUNG
  // =====================================================

  async processWithSupplierPrompt(pdfBuffer, filename, supplier) {
    try {
      // Hole lieferantenspezifischen Verarbeitungs-Prompt
      const processingPrompt = await this.getPromptBySupplier('SUPPLIER_PROCESSING', supplier.id);
      
      if (!processingPrompt) {
        console.log(`⚠️ Kein spezifischer Prompt für ${supplier.name}, verwende generischen OCR-Prompt`);
        
        // Fallback: Generischer OCR-Prompt
        const fallbackPrompt = await this.getPromptByCategory('OCR');
        if (!fallbackPrompt) {
          throw new Error('Weder spezifischer noch generischer OCR-Prompt gefunden');
        }
        
        return await this.processWithPrompt(pdfBuffer, filename, fallbackPrompt, supplier);
      }

      console.log(`🎯 Verwende spezifischen Prompt: ${processingPrompt.name} für ${supplier.name}`);
      
      return await this.processWithPrompt(pdfBuffer, filename, processingPrompt, supplier);

    } catch (error) {
      console.error('❌ Fehler bei lieferantenspezifischer Verarbeitung:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================
  // HILFSFUNKTIONEN
  // =====================================================

  async processWithPrompt(pdfBuffer, filename, prompt, supplier) {
    try {
      // Hier würde die tatsächliche AI-Verarbeitung mit dem spezifischen Prompt stattfinden
      // Für jetzt simulieren wir das Ergebnis
      
      const result = await this.aiOcrService.processInvoice(pdfBuffer, filename);
      
      return {
        success: true,
        data: result.data,
        prompt_used: prompt,
        supplier: supplier,
        processing_type: 'supplier_specific',
        enhanced_fields: this.getSupplierSpecificFields(supplier)
      };

    } catch (error) {
      console.error('❌ Fehler bei Prompt-Verarbeitung:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getPromptByCategory(category, supplierId = null) {
    try {
      const query = supabaseAdmin
        .from('system_prompts')
        .select('*')
        .eq('category', category)
        .eq('is_active', true);

      if (supplierId) {
        query.eq('supplier_id', supplierId);
      } else {
        query.is('supplier_id', null);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error(`❌ Fehler beim Abrufen des ${category} Prompts:`, error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Fehler bei getPromptByCategory:', error);
      return null;
    }
  }

  async getPromptBySupplier(category, supplierId) {
    return await this.getPromptByCategory(category, supplierId);
  }

  async findSupplierByInfo(supplierInfo) {
    try {
      // Suche zuerst nach exaktem Namen
      let { data: supplier, error } = await supabaseAdmin
        .from('suppliers')
        .select('*')
        .eq('status', 'ACTIVE')
        .ilike('name', `%${supplierInfo.name}%`)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Fehler bei Lieferanten-Suche:', error);
        return null;
      }

      if (supplier) {
        return supplier;
      }

      // Suche nach normalisiertem Namen
      const normalizedName = supplierInfo.name.toLowerCase().trim();
      ({ data: supplier, error } = await supabaseAdmin
        .from('suppliers')
        .select('*')
        .eq('status', 'ACTIVE')
        .ilike('normalized_name', `%${normalizedName}%`)
        .single());

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Fehler bei normalisierter Lieferanten-Suche:', error);
        return null;
      }

      return supplier;

    } catch (error) {
      console.error('❌ Fehler bei findSupplierByInfo:', error);
      return null;
    }
  }

  getSupplierSpecificFields(supplier) {
    // Definiere lieferantenspezifische Felder basierend auf dem Lieferanten
    const specificFields = {
      'Red Bull GmbH': [
        'energy_drink_variants',
        'sponsoring_components', 
        'event_references',
        'volume_discounts'
      ],
      'Österreichische Post AG': [
        'postal_services',
        'package_categories',
        'weight_dimensions',
        'tracking_numbers'
      ],
      'BILLA AG': [
        'product_categories',
        'store_locations',
        'loyalty_discounts',
        'fresh_products'
      ]
    };

    return specificFields[supplier.name] || ['standard_fields'];
  }
}

export default SupplierSpecificOcrService;





