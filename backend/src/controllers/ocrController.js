// =====================================================
// OCR Controller - API Endpoints für OCR-System
// =====================================================

import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { supabaseAdmin } from '../config/database.js';
import ocrService from '../services/ocrService.js';
import { createAuditLog } from '../utils/auditLogger.js';
import { documentStorageService } from '../services/documentStorageService.js';

// =====================================================
// MULTER CONFIGURATION
// =====================================================

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'ocr');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${sanitizedName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Nicht unterstützter Dateityp: ${file.mimetype}. Erlaubt: JPG, PNG, PDF`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// =====================================================
// OCR UPLOAD & PROCESSING
// =====================================================

const uploadAndProcessOCR = async (req, res) => {
  try {
    console.log('📥 OCR Upload Request empfangen');
    console.log('📋 Request Headers:', req.headers);
    console.log('📋 Request Body Keys:', Object.keys(req.body || {}));
    console.log('📋 Request File:', req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Keine Datei hochgeladen',
        message: 'Bitte wählen Sie eine Datei aus.',
        code: 'NO_FILE_PROVIDED'
      });
    }

    const { file } = req;
    console.log(`📄 Verarbeite Datei: ${file.originalname} (${file.size} bytes)`);

    try {
      // Process with OCR service
      const result = await ocrService.processDocument(
        file.path,
        file.originalname,
        file.mimetype
      );

      if (result.success) {
        // Speichere Original-Dokument in Supabase Storage
        let documentId = null;
        try {
          const fileBuffer = await fs.readFile(file.path);
          const documentMetadata = {
            originalName: file.originalname,
            mimeType: file.mimetype,
            ocrProcessingId: result.ocrProcessingId,
            uploadedBy: 'ocr-system' // TODO: Echte User-ID verwenden
          };

          const document = await documentStorageService.storeDocument(fileBuffer, documentMetadata);
          documentId = document.id;
          console.log('✅ Original-Dokument gespeichert:', documentId);

          // Verknüpfe Dokument mit OCR-Processing-Record
          if (result.ocrProcessingId && documentId) {
            try {
              await supabaseAdmin
                .from('ocr_processing')
                .update({ document_id: documentId })
                .eq('id', result.ocrProcessingId);
              console.log('✅ Dokument-ID mit OCR-Processing verknüpft');
            } catch (linkError) {
              console.error('⚠️ Fehler bei Dokument-Verknüpfung:', linkError);
            }
          }

        } catch (docError) {
          console.error('⚠️ Fehler beim Speichern des Original-Dokuments:', docError);
          // Dokument-Speicherung ist nicht kritisch für OCR-Erfolg
        }

        // Erstelle automatisch eine Review-Session für Browser-Workflow
        let reviewSessionId = null;
        try {
          const sessionData = {
            id: result.ocrProcessingId, // Verwende OCR-Processing-ID als Session-ID
            extracted_data: result.aiAnalysis || result.extractedData || {},
            confidence_score: result.confidence || 0,
            status: 'pending_review',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h Gültigkeit
          };

          const { data: session, error: sessionError } = await supabaseAdmin
            .from('ocr_review_sessions')
            .insert(sessionData)
            .select()
            .single();

          if (sessionError) {
            console.error('⚠️ Fehler beim Erstellen der Review-Session:', sessionError);
          } else {
            reviewSessionId = session.id;
            console.log('✅ Review-Session automatisch erstellt:', reviewSessionId);
          }
        } catch (sessionError) {
          console.error('⚠️ Fehler bei automatischer Review-Session Erstellung:', sessionError);
        }

        res.status(200).json({
          success: true,
          message: 'OCR-Verarbeitung erfolgreich abgeschlossen',
          data: {
            ocrProcessingId: result.ocrProcessingId,
            reviewSessionId: reviewSessionId, // Neue Review-Session ID für Browser-Workflow
            documentId: documentId, // Neue Feld für Frontend
            selectedEngine: result.selectedEngine,
            confidence: result.confidence,
            text: result.text,
            processingTime: result.processingTime,
            boundingBoxes: result.boundingBoxes,
            engines: {
              tesseract: result.tesseractResult ? {
                confidence: result.tesseractResult.confidence,
                processingTime: result.tesseractResult.processingTime
              } : null,
              cloudVision: result.cloudVisionResult ? {
                confidence: result.cloudVisionResult.confidence,
                processingTime: result.cloudVisionResult.processingTime
              } : null
            },
            // KI-Enhanced Analysis
            aiAnalysis: result.aiAnalysis
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'OCR-Verarbeitung fehlgeschlagen',
          message: result.error,
          code: 'OCR_PROCESSING_ERROR',
          ocrProcessingId: result.ocrProcessingId
        });
      }

    } catch (processingError) {
      console.error('❌ OCR-Verarbeitungsfehler:', processingError);
      res.status(500).json({
        success: false,
        error: 'Interner Serverfehler',
        message: 'Fehler bei der OCR-Verarbeitung.',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }

  } catch (error) {
    console.error('❌ Unerwarteter Fehler beim OCR-Upload:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      message: 'Ein unerwarteter Fehler ist aufgetreten.',
      code: 'UNEXPECTED_ERROR'
    });
  }
};

// =====================================================
// GET OCR PROCESSING RESULT
// =====================================================

const getOCRResult = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige OCR-Processing-ID',
        message: 'Die ID muss eine gültige UUID sein.',
        code: 'INVALID_OCR_ID'
      });
    }

    const { data: ocrResult, error } = await supabaseAdmin
      .from('ocr_processing')
      .select(`
        *,
        ocr_raw_data (
          engine,
          raw_response,
          bounding_boxes,
          metadata
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'OCR-Verarbeitung nicht gefunden',
        message: `Keine OCR-Verarbeitung mit der ID ${id} gefunden.`,
        code: 'OCR_NOT_FOUND'
      });
    } else if (error) {
      console.error('❌ Fehler beim Abrufen der OCR-Verarbeitung:', error);
      return res.status(500).json({
        success: false,
        error: 'Interner Serverfehler',
        message: 'Fehler beim Abrufen der OCR-Verarbeitung.',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }

    res.status(200).json({
      success: true,
      data: ocrResult
    });

  } catch (error) {
    console.error('❌ Unerwarteter Fehler beim Abrufen der OCR-Verarbeitung:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      message: 'Ein unerwarteter Fehler ist aufgetreten.',
      code: 'UNEXPECTED_ERROR'
    });
  }
};

// =====================================================
// GET OCR PROCESSING HISTORY
// =====================================================

const getOCRHistory = async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, engine } = req.query;

    let query = supabaseAdmin
      .from('ocr_processing')
      .select(`
        id,
        file_name,
        file_size,
        file_type,
        selected_engine,
        final_confidence,
        processing_time_ms,
        status,
        created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (engine) {
      query = query.eq('selected_engine', engine);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Fehler beim Abrufen der OCR-Historie:', error);
      return res.status(500).json({
        success: false,
        error: 'Interner Serverfehler',
        message: 'Fehler beim Abrufen der OCR-Historie.',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }

    res.status(200).json({
      success: true,
      data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count
      }
    });

  } catch (error) {
    console.error('❌ Unerwarteter Fehler beim Abrufen der OCR-Historie:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      message: 'Ein unerwarteter Fehler ist aufgetreten.',
      code: 'UNEXPECTED_ERROR'
    });
  }
};

// =====================================================
// GET OCR STATISTICS
// =====================================================

const getOCRStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await ocrService.getProcessingStats(parseInt(days));

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Statistik-Berechnung fehlgeschlagen',
        message: 'Fehler beim Berechnen der OCR-Statistiken.',
        code: 'STATS_CALCULATION_ERROR'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        period: `${days} Tage`,
        ...stats
      }
    });

  } catch (error) {
    console.error('❌ Unerwarteter Fehler beim Abrufen der OCR-Statistiken:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      message: 'Ein unerwarteter Fehler ist aufgetreten.',
      code: 'UNEXPECTED_ERROR'
    });
  }
};

// =====================================================
// DELETE OCR PROCESSING
// =====================================================

const deleteOCRProcessing = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige OCR-Processing-ID',
        message: 'Die ID muss eine gültige UUID sein.',
        code: 'INVALID_OCR_ID'
      });
    }

    // Check if processing exists
    const { data: existingProcessing, error: fetchError } = await supabaseAdmin
      .from('ocr_processing')
      .select('id, file_name, file_path')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'OCR-Verarbeitung nicht gefunden',
        message: `Keine OCR-Verarbeitung mit der ID ${id} gefunden.`,
        code: 'OCR_NOT_FOUND'
      });
    } else if (fetchError) {
      console.error('❌ Fehler beim Abrufen der OCR-Verarbeitung:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Interner Serverfehler',
        message: 'Fehler beim Abrufen der OCR-Verarbeitung.',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }

    // Delete file if it exists
    try {
      if (existingProcessing.file_path) {
        await fs.unlink(existingProcessing.file_path);
        console.log(`🗑️ Datei gelöscht: ${existingProcessing.file_path}`);
      }
    } catch (fileError) {
      console.warn('⚠️ Datei konnte nicht gelöscht werden:', fileError.message);
    }

    // Delete OCR processing (cascade will delete related records)
    const { error: deleteError } = await supabaseAdmin
      .from('ocr_processing')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Fehler beim Löschen der OCR-Verarbeitung:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Interner Serverfehler',
        message: 'Die OCR-Verarbeitung konnte nicht gelöscht werden.',
        code: 'OCR_DELETE_ERROR'
      });
    }

    // Create audit log
    try {
      await createAuditLog({
        table_name: 'ocr_processing',
        record_id: id,
        action: 'DELETE',
        old_data: existingProcessing,
        new_data: null,
        user_id: req.user?.id || 'system'
      });
    } catch (auditError) {
      console.error('❌ Fehler beim Erstellen des Audit-Logs:', auditError);
    }

    res.status(200).json({
      success: true,
      message: `OCR-Verarbeitung '${existingProcessing.file_name}' erfolgreich gelöscht.`
    });

  } catch (error) {
    console.error('❌ Unerwarteter Fehler beim Löschen der OCR-Verarbeitung:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      message: 'Ein unerwarteter Fehler ist aufgetreten.',
      code: 'UNEXPECTED_ERROR'
    });
  }
};

// =====================================================
// REPROCESS OCR
// =====================================================

const reprocessOCR = async (req, res) => {
  try {
    const { id } = req.params;
    const { forceEngine } = req.body; // 'tesseract', 'cloud-vision', or 'both'

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige OCR-Processing-ID',
        message: 'Die ID muss eine gültige UUID sein.',
        code: 'INVALID_OCR_ID'
      });
    }

    // Get existing processing
    const { data: existingProcessing, error: fetchError } = await supabaseAdmin
      .from('ocr_processing')
      .select('file_path, file_name, file_size, file_type')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'OCR-Verarbeitung nicht gefunden',
        message: `Keine OCR-Verarbeitung mit der ID ${id} gefunden.`,
        code: 'OCR_NOT_FOUND'
      });
    } else if (fetchError) {
      console.error('❌ Fehler beim Abrufen der OCR-Verarbeitung:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Interner Serverfehler',
        message: 'Fehler beim Abrufen der OCR-Verarbeitung.',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }

    // Check if file still exists
    try {
      await fs.access(existingProcessing.file_path);
    } catch (fileError) {
      return res.status(404).json({
        success: false,
        error: 'Datei nicht gefunden',
        message: 'Die ursprüngliche Datei ist nicht mehr verfügbar.',
        code: 'FILE_NOT_FOUND'
      });
    }

    console.log(`🔄 Starte Neuverarbeitung: ${existingProcessing.file_name}`);

    // Reprocess with OCR service
    const result = await ocrService.processDocument(
      existingProcessing.file_path,
      existingProcessing.file_name,
      existingProcessing.file_size,
      existingProcessing.file_type
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'OCR-Neuverarbeitung erfolgreich abgeschlossen',
        data: {
          ocrProcessingId: result.ocrProcessingId,
          selectedEngine: result.selectedEngine,
          confidence: result.confidence,
          text: result.text,
          processingTime: result.processingTime
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'OCR-Neuverarbeitung fehlgeschlagen',
        message: result.error,
        code: 'OCR_REPROCESSING_ERROR'
      });
    }

  } catch (error) {
    console.error('❌ Unerwarteter Fehler bei der OCR-Neuverarbeitung:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      message: 'Ein unerwarteter Fehler ist aufgetreten.',
      code: 'UNEXPECTED_ERROR'
    });
  }
};

export { upload, uploadAndProcessOCR };
