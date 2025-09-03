// =====================================================
// Budget Manager 2025 - Document Management Routes
// Story 2.10: Original-Rechnungen Speicherung & Verwaltung
// =====================================================

import express from 'express';
import multer from 'multer';
import { documentStorageService } from '../services/documentStorageService.js';
import { supabase } from '../config/database.js';

const router = express.Router();

// Multer-Konfiguration für File-Upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Dateityp nicht erlaubt: ${file.mimetype}`), false);
    }
  }
});

/**
 * POST /api/documents/upload
 * Lädt ein neues Dokument hoch
 */
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Keine Datei hochgeladen'
      });
    }

    const { ocrProcessingId, invoiceId, uploadedBy } = req.body;

    console.log('📤 Dokument-Upload:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    const metadata = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      ocrProcessingId: ocrProcessingId || null,
      invoiceId: invoiceId || null,
      uploadedBy: uploadedBy || 'system'
    };

    const document = await documentStorageService.storeDocument(req.file.buffer, metadata);

    res.json({
      success: true,
      message: 'Dokument erfolgreich hochgeladen',
      data: {
        documentId: document.id,
        originalFilename: document.original_filename,
        fileSize: document.file_size,
        uploadDate: document.upload_date,
        retentionUntil: document.retention_until
      }
    });

  } catch (error) {
    console.error('❌ Upload-Fehler:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Fehler beim Hochladen des Dokuments'
    });
  }
});

/**
 * GET /api/documents/:documentId/download
 * Lädt ein Dokument herunter
 */
router.get('/:documentId/download', async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.query.userId || 'system';

    console.log('📥 Dokument-Download angefordert:', documentId);

    const { buffer, metadata } = await documentStorageService.retrieveDocument(documentId, userId);

    // Content-Disposition Header für Download
    const filename = encodeURIComponent(metadata.original_filename);
    
    res.set({
      'Content-Type': metadata.mime_type,
      'Content-Length': buffer.byteLength,
      'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      'Cache-Control': 'private, no-cache'
    });

    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('❌ Download-Fehler:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'Dokument nicht gefunden'
    });
  }
});

/**
 * GET /api/documents/:documentId/url
 * Generiert eine sichere Download-URL
 */
router.get('/:documentId/url', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { expiresIn = 3600, userId = 'system' } = req.query;

    console.log('🔗 Download-URL angefordert für:', documentId);

    const downloadUrl = await documentStorageService.generateDownloadUrl(
      documentId, 
      parseInt(expiresIn), 
      userId
    );

    res.json({
      success: true,
      data: {
        downloadUrl: downloadUrl,
        expiresIn: parseInt(expiresIn),
        expiresAt: new Date(Date.now() + parseInt(expiresIn) * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('❌ URL-Generierung-Fehler:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'URL-Generierung fehlgeschlagen'
    });
  }
});

/**
 * GET /api/documents/:documentId/metadata
 * Lädt Dokument-Metadaten
 */
router.get('/:documentId/metadata', async (req, res) => {
  try {
    const { documentId } = req.params;

    console.log('📋 Metadaten angefordert für:', documentId);

    const metadata = await documentStorageService.getDocumentMetadata(documentId);

    res.json({
      success: true,
      data: {
        id: metadata.id,
        originalFilename: metadata.original_filename,
        storedFilename: metadata.stored_filename,
        fileSize: metadata.file_size,
        mimeType: metadata.mime_type,
        fileHash: metadata.file_hash,
        version: metadata.version,
        uploadDate: metadata.upload_date,
        uploadedBy: metadata.uploaded_by,
        accessCount: metadata.access_count,
        lastAccessed: metadata.last_accessed,
        archived: metadata.archived,
        retentionUntil: metadata.retention_until,
        ocrProcessingId: metadata.ocr_processing_id,
        invoiceId: metadata.invoice_id
      }
    });

  } catch (error) {
    console.error('❌ Metadaten-Fehler:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'Metadaten nicht gefunden'
    });
  }
});

/**
 * GET /api/documents/by-invoice/:invoiceId
 * Lädt alle Dokumente zu einer Rechnung
 */
router.get('/by-invoice/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;

    console.log('📄 Dokumente für Rechnung:', invoiceId);

    const { data: documents, error } = await supabase
      .from('invoice_documents')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('archived', false)
      .order('version', { ascending: false });

    if (error) {
      throw new Error(`Datenbankfehler: ${error.message}`);
    }

    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      originalFilename: doc.original_filename,
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      version: doc.version,
      uploadDate: doc.upload_date,
      uploadedBy: doc.uploaded_by,
      accessCount: doc.access_count,
      lastAccessed: doc.last_accessed
    }));

    res.json({
      success: true,
      data: {
        invoiceId: invoiceId,
        documents: formattedDocuments,
        totalCount: documents.length
      }
    });

  } catch (error) {
    console.error('❌ Fehler beim Laden der Rechnungs-Dokumente:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Fehler beim Laden der Dokumente'
    });
  }
});

/**
 * GET /api/documents/by-ocr/:ocrProcessingId
 * Lädt alle Dokumente zu einer OCR-Verarbeitung
 */
router.get('/by-ocr/:ocrProcessingId', async (req, res) => {
  try {
    const { ocrProcessingId } = req.params;

    console.log('📄 Dokumente für OCR-Verarbeitung:', ocrProcessingId);

    const { data: documents, error } = await supabase
      .from('invoice_documents')
      .select('*')
      .eq('ocr_processing_id', ocrProcessingId)
      .eq('archived', false)
      .order('version', { ascending: false });

    if (error) {
      throw new Error(`Datenbankfehler: ${error.message}`);
    }

    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      originalFilename: doc.original_filename,
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      version: doc.version,
      uploadDate: doc.upload_date,
      uploadedBy: doc.uploaded_by,
      accessCount: doc.access_count,
      lastAccessed: doc.last_accessed
    }));

    res.json({
      success: true,
      data: {
        ocrProcessingId: ocrProcessingId,
        documents: formattedDocuments,
        totalCount: documents.length
      }
    });

  } catch (error) {
    console.error('❌ Fehler beim Laden der OCR-Dokumente:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Fehler beim Laden der Dokumente'
    });
  }
});

/**
 * POST /api/documents/:documentId/archive
 * Archiviert ein Dokument
 */
router.post('/:documentId/archive', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { userId = 'system' } = req.body;

    console.log('📦 Archiviere Dokument:', documentId);

    await documentStorageService.archiveDocument(documentId, userId);

    res.json({
      success: true,
      message: 'Dokument erfolgreich archiviert',
      data: {
        documentId: documentId,
        archivedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Archivierungs-Fehler:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Fehler beim Archivieren des Dokuments'
    });
  }
});

/**
 * GET /api/documents/:documentId/access-log
 * Lädt Zugriffs-Log für ein Dokument
 */
router.get('/:documentId/access-log', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    console.log('📊 Zugriffs-Log für Dokument:', documentId);

    const { data: accessLog, error } = await supabase
      .from('document_access_log')
      .select('*')
      .eq('document_id', documentId)
      .order('accessed_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      throw new Error(`Datenbankfehler: ${error.message}`);
    }

    res.json({
      success: true,
      data: {
        documentId: documentId,
        accessLog: accessLog,
        totalCount: accessLog.length
      }
    });

  } catch (error) {
    console.error('❌ Fehler beim Laden des Zugriffs-Logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Fehler beim Laden des Zugriffs-Logs'
    });
  }
});

/**
 * GET /api/documents/check-duplicate
 * Prüft auf Duplikate anhand Hash
 */
router.post('/check-duplicate', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Keine Datei für Duplikatsprüfung'
      });
    }

    console.log('🔍 Prüfe Duplikat für:', req.file.originalname);

    const hash = documentStorageService.calculateHash(req.file.buffer);
    const existingDoc = await documentStorageService.checkDuplicate(hash);

    res.json({
      success: true,
      data: {
        isDuplicate: !!existingDoc,
        existingDocument: existingDoc ? {
          id: existingDoc.id,
          originalFilename: existingDoc.original_filename,
          uploadDate: existingDoc.upload_date,
          version: existingDoc.version
        } : null,
        fileHash: hash
      }
    });

  } catch (error) {
    console.error('❌ Duplikatsprüfung-Fehler:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Fehler bei der Duplikatsprüfung'
    });
  }
});

/**
 * GET /api/documents/by-ocr/:ocrProcessingId
 * Findet Dokument-ID für OCR-Processing-ID
 */
router.get('/by-ocr/:ocrProcessingId', async (req, res) => {
  try {
    const { ocrProcessingId } = req.params;
    
    console.log('🔍 Suche Dokument für OCR-Processing:', ocrProcessingId);

    // Suche Dokument über OCR-Processing-ID
    const { data: ocrRecord, error: ocrError } = await supabase
      .from('ocr_processing')
      .select('document_id')
      .eq('id', ocrProcessingId)
      .single();

    if (ocrError || !ocrRecord) {
      return res.status(404).json({
        success: false,
        error: 'OCR-Processing nicht gefunden'
      });
    }

    if (!ocrRecord.document_id) {
      return res.status(404).json({
        success: false,
        error: 'Kein Dokument für diese OCR-Processing gefunden'
      });
    }

    // Dokument-Metadaten laden
    const { data: document, error: docError } = await supabase
      .from('invoice_documents')
      .select('id, original_filename, file_size, mime_type, created_at')
      .eq('id', ocrRecord.document_id)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        success: false,
        error: 'Dokument nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: {
        documentId: document.id,
        filename: document.original_filename,
        fileSize: document.file_size,
        mimeType: document.mime_type,
        createdAt: document.created_at,
        downloadUrl: `/api/documents/${document.id}/download`
      }
    });

  } catch (error) {
    console.error('❌ Fehler bei Dokument-Suche:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Fehler bei der Dokument-Suche'
    });
  }
});

export default router;
