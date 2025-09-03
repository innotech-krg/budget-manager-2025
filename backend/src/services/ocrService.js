// =====================================================
// KI-OCR Service - Reine KI-basierte Rechnungsverarbeitung (Story 2.7)
// Nur ChatGPT + Claude APIs - Tesseract.js und Cloud Vision entfernt
// =====================================================

import fs from 'fs/promises';
import path from 'path';
import { supabaseAdmin } from '../config/database.js';
import { createAuditLog } from '../utils/auditLogger.js';
import supplierDetectionService from './supplierDetectionService.js';
import supplierApprovalService from './supplierApprovalService.js';
import AIEnhancedOCRService from './aiOcrService.js';
import SupplierPatternLearningService from './supplierPatternLearningService.js';
import PDFConverterService from './pdfConverterService.js';

class OCRService {
  constructor() {
    // Lazy initialization - Services werden erst beim ersten Aufruf initialisiert
    this.aiService = null;
    this.patternLearningService = null;
    this.pdfConverter = null;
    this.initialized = false;
    // ❌ NICHT im Constructor aufrufen - wird bei Bedarf initialisiert
    // this.initializeService();
  }

  // =====================================================
  // SERVICE INITIALIZATION (KI-Only)
  // =====================================================

  async initializeService() {
    if (this.initialized) return;
    
    try {
      console.log('🤖 Initialisiere KI-basierte OCR-Pipeline...');
      
      // Initialisiere Services erst jetzt (nach .env-Loading)
      this.aiService = new AIEnhancedOCRService();
      this.patternLearningService = new SupplierPatternLearningService();
      this.pdfConverter = new PDFConverterService();
      
      // Prüfe verfügbare KI-APIs (mit Debug-Info)
      const availableAPIs = [];
      const openaiKey = process.env.OPENAI_API_KEY;
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      
      console.log('🔍 Debug - API-Keys Status:');
      console.log(`   OpenAI: ${openaiKey ? `Konfiguriert (${openaiKey.substring(0, 10)}...)` : 'Nicht gefunden'}`);
      console.log(`   Anthropic: ${anthropicKey ? `Konfiguriert (${anthropicKey.substring(0, 15)}...)` : 'Nicht gefunden'}`);
      
      if (openaiKey) {
        availableAPIs.push('OpenAI GPT-4');
      }
      if (anthropicKey) {
        availableAPIs.push('Anthropic Claude');
      }

      if (availableAPIs.length === 0) {
        console.log('⚠️ Keine KI-APIs konfiguriert. Bitte OPENAI_API_KEY oder ANTHROPIC_API_KEY setzen.');
        console.log('💡 Tipp: Prüfen Sie die .env-Datei in backend/.env');
      } else {
        console.log(`✅ KI-OCR bereit mit: ${availableAPIs.join(', ')}`);
      }

      this.initialized = true;
    } catch (error) {
      console.error('❌ Fehler bei KI-OCR-Initialisierung:', error);
    }
  }

  // =====================================================
  // HAUPTVERARBEITUNGSMETHODE (Nur KI)
  // =====================================================

  /**
   * Verarbeitet ein Dokument mit reiner KI-basierter OCR
   */
  async processDocument(filePath, originalName, mimeType) {
    console.log(`📥 Starte KI-OCR-Verarbeitung: ${originalName}`);
    
    // Stelle sicher, dass Services initialisiert sind
    await this.initializeService();
    
    let ocrProcessingId = null;
    
    try {
      // 1. OCR-Processing-Record erstellen
      ocrProcessingId = await this.createOCRRecord(originalName, mimeType, filePath);
      console.log(`📋 OCR-Processing-ID: ${ocrProcessingId}`);

      // 2. Datei für KI-Verarbeitung vorbereiten
      let base64Data, processedMimeType;
      
      if (this.pdfConverter.isPdf(filePath, mimeType)) {
        console.log('📄 PDF erkannt - konvertiere zu Bild für KI-Analyse...');
        const conversionResult = await this.pdfConverter.convertPdfToBase64(filePath);
        base64Data = conversionResult.base64Data;
        processedMimeType = conversionResult.mimeType;
        console.log('✅ PDF erfolgreich zu Bild konvertiert');
      } else {
        // Normales Bild - direkt verarbeiten
        const fileBuffer = await fs.readFile(filePath);
        base64Data = fileBuffer.toString('base64');
        processedMimeType = mimeType;
      }

      // 3. KI-basierte OCR-Verarbeitung
      console.log('🧠 Starte KI-basierte OCR-Analyse...');
      const aiResult = await this.aiService.analyzeInvoiceWithAI(
        null, // Kein Raw-Text mehr, KI arbeitet direkt mit Bildern
        ocrProcessingId,
        null, // Pattern wird intern geladen
        base64Data,
        processedMimeType
      );

      // 4. Lieferanten-Erkennung und Pattern Learning
      let detectedSupplierName = null;
      if (aiResult && aiResult.supplier && aiResult.supplier.name) {
        detectedSupplierName = aiResult.supplier.name;
        console.log(`🔍 Potentieller Lieferant erkannt: ${detectedSupplierName}`);

        // Pattern Learning initiieren (mit KI-Ergebnis als Text)
        const rawTextFromAI = aiResult.raw_text || JSON.stringify(aiResult);
        await this.patternLearningService.initiateSupplierLearning(
          ocrProcessingId,
          rawTextFromAI,
          null // Keine User-Corrections
        );
      }

      // 5. OCR-Record mit Ergebnissen aktualisieren
      await this.updateOCRRecord(ocrProcessingId, {
        status: 'COMPLETED',
        ai_analysis: aiResult,
        detected_supplier: detectedSupplierName,
        confidence_score: aiResult?.confidence || 0,
        processing_time_ms: Date.now() - parseInt(ocrProcessingId.split('-')[0]) // Approximation
      });

      console.log('✅ KI-OCR-Verarbeitung abgeschlossen');

      return {
        success: true,
        ocrProcessingId,
        aiAnalysis: aiResult,
        detectedSupplier: detectedSupplierName,
        engine: 'ai-enhanced',
        confidence: aiResult?.confidence || 0
      };

    } catch (error) {
      console.error('❌ Fehler bei KI-OCR-Verarbeitung:', error);
      
      if (ocrProcessingId) {
        await this.updateOCRRecord(ocrProcessingId, {
          status: 'FAILED',
          error_message: error.message
        });
      }

      return {
        success: false,
        error: error.message,
        ocrProcessingId
      };
    }
  }

  // =====================================================
  // DATENBANK-OPERATIONEN
  // =====================================================

  /**
   * Erstellt einen OCR-Processing-Record
   */
  async createOCRRecord(fileName, mimeType, filePath) {
    try {
      const { data, error } = await supabaseAdmin
        .from('ocr_processing')
        .insert({
          file_name: fileName,
          mime_type: mimeType,
          file_path: filePath,
          selected_engine: 'ai-enhanced', // Nur noch KI
          status: 'PROCESSING',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Fehler beim Erstellen des OCR-Records:', error);
        throw new Error(`Fehler beim Erstellen des OCR-Records: ${error.message}`);
      }

      // Audit Log (temporär deaktiviert wegen Foreign Key Constraint)
      try {
        await createAuditLog({
          table_name: 'ocr_processing',
          record_id: data.id,
          action: 'INSERT',
          changed_by: '00000000-0000-0000-0000-000000000000', // System UUID
          changes: { file_name: fileName, engine: 'ai-enhanced' }
        });
      } catch (auditError) {
        console.warn('⚠️ Audit-Log Fehler (ignoriert):', auditError.message);
      }

      return data.id;
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des OCR-Records:', error);
      throw error;
    }
  }

  /**
   * Aktualisiert einen OCR-Processing-Record
   */
  async updateOCRRecord(ocrProcessingId, updates) {
    try {
      const { error } = await supabaseAdmin
        .from('ocr_processing')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', ocrProcessingId);

      if (error) {
        console.error('❌ Fehler beim Update des OCR-Records:', error);
        return false;
      }

      // Audit Log (temporär deaktiviert wegen Foreign Key Constraint)
      try {
        await createAuditLog({
          table_name: 'ocr_processing',
          record_id: ocrProcessingId,
          action: 'UPDATE',
          changed_by: '00000000-0000-0000-0000-000000000000', // System UUID
          changes: updates
        });
      } catch (auditError) {
        console.warn('⚠️ Audit-Log Fehler (ignoriert):', auditError.message);
      }

      return true;
    } catch (error) {
      console.error('❌ Fehler beim Update des OCR-Records:', error);
      return false;
    }
  }

  // =====================================================
  // STATISTIKEN & MONITORING
  // =====================================================

  /**
   * Holt OCR-Statistiken (nur KI-basiert)
   */
  async getOCRStats() {
    try {
      const { data, error } = await supabaseAdmin
        .from('ocr_processing')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Fehler beim Laden der OCR-Statistiken: ${error.message}`);
      }

      // Statistiken berechnen (nur AI-Enhanced)
      const stats = {
        total_processed: data.length,
        successful: data.filter(r => r.status === 'COMPLETED').length,
        failed: data.filter(r => r.status === 'FAILED').length,
        average_confidence: 0,
        engines: {
          'ai-enhanced': data.filter(r => r.selected_engine === 'ai-enhanced').length
        }
      };

      // Durchschnittliche Konfidenz berechnen
      const completedRecords = data.filter(r => r.status === 'COMPLETED' && r.confidence_score);
      if (completedRecords.length > 0) {
        stats.average_confidence = completedRecords.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / completedRecords.length;
      }

      return stats;
    } catch (error) {
      console.error('❌ Fehler beim Laden der OCR-Statistiken:', error);
      throw error;
    }
  }

  /**
   * Holt detaillierte OCR-Verarbeitungshistorie
   */
  async getProcessingHistory(limit = 50) {
    try {
      const { data, error } = await supabaseAdmin
        .from('ocr_processing')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Fehler beim Laden der Verarbeitungshistorie: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Verarbeitungshistorie:', error);
      throw error;
    }
  }

  // =====================================================
  // CLEANUP & MAINTENANCE
  // =====================================================

  /**
   * Bereinigt alte OCR-Dateien und Records
   */
  async cleanupOldRecords(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabaseAdmin
        .from('ocr_processing')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('file_path');

      if (error) {
        throw new Error(`Fehler beim Bereinigen alter Records: ${error.message}`);
      }

      // Dateien löschen
      for (const record of data) {
        try {
          await fs.unlink(record.file_path);
        } catch (fileError) {
          console.warn(`⚠️ Datei konnte nicht gelöscht werden: ${record.file_path}`);
        }
      }

      console.log(`🧹 ${data.length} alte OCR-Records bereinigt (älter als ${daysOld} Tage)`);
      return data.length;
    } catch (error) {
      console.error('❌ Fehler beim Bereinigen alter Records:', error);
      throw error;
    }
  }
}

// =====================================================
// EXPORT
// =====================================================

export default new OCRService();