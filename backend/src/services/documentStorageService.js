// =====================================================
// Budget Manager 2025 - Document Storage Service
// Story 2.10: Original-Rechnungen Speicherung & Verwaltung
// Supabase Storage Integration für 10-jährige Aufbewahrung
// =====================================================

import { supabase } from '../config/database.js';
import crypto from 'crypto';
import path from 'path';

class DocumentStorageService {
  constructor() {
    this.bucketName = 'invoice-pdfs'; // Verwende existierenden Bucket
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/tiff'
    ];
  }

  /**
   * Speichert ein Dokument in Supabase Storage
   * @param {Buffer} fileBuffer - Datei-Buffer
   * @param {Object} metadata - Metadaten
   * @returns {Promise<Object>} Gespeicherte Dokument-Info
   */
  async storeDocument(fileBuffer, metadata) {
    try {
      console.log('📄 Speichere Dokument:', metadata.originalName);

      // Validierung
      this.validateFile(fileBuffer, metadata);

      // Hash berechnen für Duplikatserkennung
      const fileHash = this.calculateHash(fileBuffer);
      
      // Prüfe auf Duplikate
      const existingDoc = await this.checkDuplicate(fileHash);
      if (existingDoc) {
        console.log('⚠️ Duplikat erkannt:', existingDoc.original_filename);
        return await this.handleDuplicate(existingDoc, fileBuffer, metadata);
      }

      // Generiere sicheren Dateinamen
      const storedFilename = this.generateStoredFilename(metadata.originalName);
      const storagePath = this.generateStoragePath(storedFilename);

      // Upload zu Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(storagePath, fileBuffer, {
          contentType: metadata.mimeType,
          duplex: false
        });

      if (uploadError) {
        throw new Error(`Supabase Storage Upload Fehler: ${uploadError.message}`);
      }

      // Metadaten in Datenbank speichern
      const documentData = {
        ocr_processing_id: metadata.ocrProcessingId || null,
        invoice_id: metadata.invoiceId || null,
        original_filename: metadata.originalName,
        stored_filename: storedFilename,
        storage_path: storagePath,
        file_size: fileBuffer.length,
        mime_type: metadata.mimeType,
        file_hash: fileHash,
        version: 1,
        storage_bucket: this.bucketName, // 'invoice-pdfs'
        uploaded_by: metadata.uploadedBy || 'system',
        retention_until: this.calculateRetentionDate()
      };

      const { data: document, error: dbError } = await supabase
        .from('invoice_documents')
        .insert(documentData)
        .select()
        .single();

      if (dbError) {
        // Cleanup: Lösche Upload bei DB-Fehler
        await this.deleteFromStorage(storagePath);
        throw new Error(`Datenbank-Fehler: ${dbError.message}`);
      }

      // Zugriff loggen
      await this.logAccess(document.id, metadata.uploadedBy || 'system', 'UPLOAD');

      console.log('✅ Dokument gespeichert:', document.id);
      return document;

    } catch (error) {
      console.error('❌ Fehler beim Speichern des Dokuments:', error);
      throw error;
    }
  }

  /**
   * Lädt ein Dokument aus Supabase Storage
   * @param {string} documentId - Dokument-ID
   * @param {string} userId - User-ID für Logging
   * @returns {Promise<Object>} Dokument-Daten und Metadaten
   */
  async retrieveDocument(documentId, userId = 'system') {
    try {
      console.log('📥 Lade Dokument:', documentId);

      // Metadaten aus DB laden
      const { data: document, error: dbError } = await supabase
        .from('invoice_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (dbError || !document) {
        throw new Error('Dokument nicht gefunden');
      }

      // Prüfe ob archiviert
      if (document.archived) {
        throw new Error('Dokument ist archiviert und nicht verfügbar');
      }

      // Download von Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(this.bucketName)
        .download(document.storage_path);

      if (downloadError) {
        throw new Error(`Download-Fehler: ${downloadError.message}`);
      }

      // Zugriffszähler erhöhen und Zugriff loggen
      await this.incrementAccessCount(documentId);
      await this.logAccess(documentId, userId, 'DOWNLOAD');

      console.log('✅ Dokument geladen:', document.original_filename);

      return {
        buffer: await fileData.arrayBuffer(),
        metadata: document
      };

    } catch (error) {
      console.error('❌ Fehler beim Laden des Dokuments:', error);
      await this.logAccess(documentId, userId, 'DOWNLOAD', false, error.message);
      throw error;
    }
  }

  /**
   * Generiert eine sichere Download-URL
   * @param {string} documentId - Dokument-ID
   * @param {number} expiresIn - Ablaufzeit in Sekunden (default: 1 Stunde)
   * @param {string} userId - User-ID für Logging
   * @returns {Promise<string>} Signierte URL
   */
  async generateDownloadUrl(documentId, expiresIn = 3600, userId = 'system') {
    try {
      console.log('🔗 Generiere Download-URL für:', documentId);

      // Metadaten laden
      const { data: document, error: dbError } = await supabase
        .from('invoice_documents')
        .select('storage_path, original_filename, archived')
        .eq('id', documentId)
        .single();

      if (dbError || !document) {
        throw new Error('Dokument nicht gefunden');
      }

      if (document.archived) {
        throw new Error('Dokument ist archiviert');
      }

      // Signierte URL erstellen
      const { data: urlData, error: urlError } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(document.storage_path, expiresIn);

      if (urlError) {
        throw new Error(`URL-Generierung fehlgeschlagen: ${urlError.message}`);
      }

      // Zugriff loggen
      await this.logAccess(documentId, userId, 'VIEW');

      console.log('✅ Download-URL generiert für:', document.original_filename);
      return urlData.signedUrl;

    } catch (error) {
      console.error('❌ Fehler bei URL-Generierung:', error);
      await this.logAccess(documentId, userId, 'VIEW', false, error.message);
      throw error;
    }
  }

  /**
   * Prüft auf Duplikate anhand des Hash-Werts
   * @param {string} hash - SHA-256 Hash
   * @returns {Promise<Object|null>} Existierendes Dokument oder null
   */
  async checkDuplicate(hash) {
    const { data: documents, error } = await supabase
      .from('invoice_documents')
      .select('*')
      .eq('file_hash', hash)
      .eq('archived', false)
      .order('version', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Fehler bei Duplikatsprüfung:', error);
      return null;
    }

    return documents.length > 0 ? documents[0] : null;
  }

  /**
   * Behandelt Duplikate durch Versionierung
   * @param {Object} existingDoc - Existierendes Dokument
   * @param {Buffer} fileBuffer - Neuer Datei-Buffer
   * @param {Object} metadata - Metadaten
   * @returns {Promise<Object>} Dokument-Info
   */
  async handleDuplicate(existingDoc, fileBuffer, metadata) {
    // Wenn exakt identisch, gebe existierendes Dokument zurück
    if (existingDoc.file_size === fileBuffer.length) {
      console.log('📋 Identisches Dokument bereits vorhanden:', existingDoc.id);
      return existingDoc;
    }

    // Erstelle neue Version
    const newVersion = existingDoc.version + 1;
    const storedFilename = this.generateStoredFilename(metadata.originalName, newVersion);
    const storagePath = this.generateStoragePath(storedFilename);

    // Upload neue Version
    const { error: uploadError } = await supabase.storage
      .from(this.bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: metadata.mimeType
      });

    if (uploadError) {
      throw new Error(`Upload neue Version fehlgeschlagen: ${uploadError.message}`);
    }

    // Neue Version in DB speichern
    const documentData = {
      ...existingDoc,
      id: undefined, // Neue ID generieren lassen
      stored_filename: storedFilename,
      storage_path: storagePath,
      file_size: fileBuffer.length,
      version: newVersion,
      uploaded_by: metadata.uploadedBy || 'system',
      upload_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newDocument, error: dbError } = await supabase
      .from('invoice_documents')
      .insert(documentData)
      .select()
      .single();

    if (dbError) {
      await this.deleteFromStorage(storagePath);
      throw new Error(`DB-Fehler neue Version: ${dbError.message}`);
    }

    console.log(`✅ Neue Version ${newVersion} erstellt:`, newDocument.id);
    return newDocument;
  }

  /**
   * Loggt Dokument-Zugriffe für Compliance
   * @param {string} documentId - Dokument-ID
   * @param {string} userId - User-ID
   * @param {string} accessType - Art des Zugriffs
   * @param {boolean} success - Erfolgreich
   * @param {string} errorMessage - Fehlermeldung
   */
  async logAccess(documentId, userId, accessType, success = true, errorMessage = null) {
    try {
      const logData = {
        document_id: documentId,
        accessed_by: userId,
        access_type: accessType,
        success: success,
        error_message: errorMessage,
        // IP und User-Agent würden in echtem Request verfügbar sein
        ip_address: null,
        user_agent: null
      };

      await supabase
        .from('document_access_log')
        .insert(logData);

    } catch (error) {
      console.error('⚠️ Fehler beim Logging:', error);
      // Logging-Fehler sollten nicht die Hauptfunktion beeinträchtigen
    }
  }

  /**
   * Hilfsmethoden
   */
  validateFile(fileBuffer, metadata) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('Datei ist leer');
    }

    if (fileBuffer.length > this.maxFileSize) {
      throw new Error(`Datei zu groß. Maximum: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    if (!this.allowedMimeTypes.includes(metadata.mimeType)) {
      throw new Error(`Dateityp nicht erlaubt: ${metadata.mimeType}`);
    }
  }

  calculateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  generateStoredFilename(originalName, version = 1) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext);
    const sanitized = base.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    return version > 1 
      ? `${sanitized}_v${version}_${timestamp}${ext}`
      : `${sanitized}_${timestamp}${ext}`;
  }

  generateStoragePath(filename) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    return `invoices/${year}/${month}/${filename}`;
  }

  calculateRetentionDate() {
    const now = new Date();
    now.setFullYear(now.getFullYear() + 10); // 10 Jahre deutsche Aufbewahrungspflicht
    return now.toISOString().split('T')[0]; // Nur Datum
  }

  async incrementAccessCount(documentId) {
    await supabase
      .from('invoice_documents')
      .update({ 
        access_count: supabase.raw('access_count + 1'),
        last_accessed: new Date().toISOString()
      })
      .eq('id', documentId);
  }

  async deleteFromStorage(storagePath) {
    try {
      await supabase.storage
        .from(this.bucketName)
        .remove([storagePath]);
    } catch (error) {
      console.error('⚠️ Cleanup-Fehler:', error);
    }
  }

  /**
   * Lädt Dokument-Metadaten
   * @param {string} documentId - Dokument-ID
   * @returns {Promise<Object>} Metadaten
   */
  async getDocumentMetadata(documentId) {
    const { data: document, error } = await supabase
      .from('invoice_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      throw new Error(`Metadaten nicht gefunden: ${error.message}`);
    }

    return document;
  }

  /**
   * Archiviert ein Dokument
   * @param {string} documentId - Dokument-ID
   * @param {string} userId - User-ID
   * @returns {Promise<void>}
   */
  async archiveDocument(documentId, userId = 'system') {
    const { error } = await supabase
      .from('invoice_documents')
      .update({
        archived: true,
        archive_date: new Date().toISOString()
      })
      .eq('id', documentId);

    if (error) {
      throw new Error(`Archivierung fehlgeschlagen: ${error.message}`);
    }

    await this.logAccess(documentId, userId, 'ARCHIVE');
    console.log('📦 Dokument archiviert:', documentId);
  }
}

// Singleton-Instanz exportieren
export const documentStorageService = new DocumentStorageService();
export default documentStorageService;
