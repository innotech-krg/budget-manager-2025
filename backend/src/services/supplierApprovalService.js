// =====================================================
// Supplier Approval Service - Manuelle Lieferanten-Genehmigung
// User kann OCR-erkannte Lieferanten vor Übernahme bearbeiten
// =====================================================

import { supabaseAdmin } from '../config/database.js';
import { createAuditLog } from '../utils/auditLogger.js';

class SupplierApprovalService {
  constructor() {
    this.pendingSuppliers = new Map(); // In-Memory Cache für Pending Suppliers
  }

  // =====================================================
  // CREATE PENDING SUPPLIER FOR APPROVAL
  // =====================================================

  async createPendingSupplier(ocrResult, ocrProcessingId) {
    try {
      console.log('📋 Erstelle Lieferanten-Vorschlag für User-Genehmigung...');

      if (!ocrResult.supplierInfo || ocrResult.supplierInfo.confidence < 50) {
        return {
          success: false,
          reason: 'CONFIDENCE_TOO_LOW',
          confidence: ocrResult.supplierInfo?.confidence || 0
        };
      }

      const supplierInfo = ocrResult.supplierInfo;
      
      // Prüfe ob bereits existierender Lieferant
      const existingSupplier = await this.findExistingSupplier(supplierInfo);
      
      // Erstelle Pending Supplier Record
      const pendingSupplier = {
        id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ocrProcessingId,
        status: 'PENDING_APPROVAL',
        confidence: supplierInfo.confidence,
        
        // OCR-erkannte Daten (editierbar)
        extractedData: {
          name: supplierInfo.name || '',
          address: supplierInfo.address || '',
          taxNumber: supplierInfo.taxNumber || '',
          uidNumber: supplierInfo.uidNumber || '', // Österreichische UID
          firmenbuchNumber: supplierInfo.firmenbuchNumber || '', // Österreichisches Firmenbuch
          iban: supplierInfo.iban || '',
          email: this.extractEmail(ocrResult.text) || '',
          phone: this.extractPhone(ocrResult.text) || '',
          website: this.extractWebsite(ocrResult.text) || ''
        },
        
        // Zusätzliche OCR-Daten für User-Kontext
        ocrContext: {
          fullText: ocrResult.text,
          documentType: ocrResult.documentType,
          extractedAmounts: ocrResult.extractedData?.amounts || [],
          extractedDates: ocrResult.extractedData?.dates || [],
          businessDataFound: ocrResult.businessDataFound
        },
        
        // Matching-Information
        existingSupplier: existingSupplier ? {
          id: existingSupplier.id,
          name: existingSupplier.name,
          similarity: this.calculateSimilarity(supplierInfo.name, existingSupplier.name),
          action: 'UPDATE_EXISTING'
        } : null,
        
        // Metadaten
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h Expiry
      };

      // In Memory Cache speichern
      this.pendingSuppliers.set(pendingSupplier.id, pendingSupplier);
      
      // In Datenbank als JSON speichern (für Persistenz)
      await this.savePendingSupplierToDb(pendingSupplier);

      console.log(`✅ Pending Supplier erstellt: ${pendingSupplier.id}`);
      
      return {
        success: true,
        pendingSupplier,
        requiresApproval: true,
        existingSupplier: existingSupplier
      };

    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Pending Suppliers:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =====================================================
  // USER APPROVAL WORKFLOW
  // =====================================================

  async approvePendingSupplier(pendingId, userEdits, userId = 'user') {
    try {
      console.log(`✅ User genehmigt Lieferanten: ${pendingId}`);

      const pendingSupplier = this.pendingSuppliers.get(pendingId) || 
                             await this.loadPendingSupplierFromDb(pendingId);

      if (!pendingSupplier) {
        throw new Error('Pending Supplier nicht gefunden');
      }

      if (pendingSupplier.status !== 'PENDING_APPROVAL') {
        throw new Error(`Supplier bereits verarbeitet: ${pendingSupplier.status}`);
      }

      // User-Edits mit OCR-Daten zusammenführen
      const finalSupplierData = {
        ...pendingSupplier.extractedData,
        ...userEdits, // User-Änderungen haben Priorität
        
        // Metadaten
        approved_by: userId,
        approved_at: new Date().toISOString(),
        ocr_confidence: pendingSupplier.confidence,
        ocr_processing_id: pendingSupplier.ocrProcessingId
      };

      let result;

      // Entscheidung: Neuer Lieferant oder Update existierender
      if (pendingSupplier.existingSupplier && userEdits.updateExisting !== false) {
        result = await this.updateExistingSupplier(
          pendingSupplier.existingSupplier.id, 
          finalSupplierData
        );
        result.action = 'UPDATED_EXISTING';
      } else {
        result = await this.createNewSupplier(finalSupplierData);
        result.action = 'CREATED_NEW';
      }

      // Pending Supplier als approved markieren
      pendingSupplier.status = 'APPROVED';
      pendingSupplier.approvedAt = new Date().toISOString();
      pendingSupplier.finalData = finalSupplierData;
      
      // Update in Cache und DB
      this.pendingSuppliers.set(pendingId, pendingSupplier);
      await this.updatePendingSupplierInDb(pendingId, pendingSupplier);

      // OCR Processing Record aktualisieren
      await supabaseAdmin
        .from('ocr_processing')
        .update({
          supplier_id: result.supplier.id,
          supplier_confidence: pendingSupplier.confidence,
          supplier_action: result.action,
          supplier_approved_by: userId,
          supplier_approved_at: new Date().toISOString()
        })
        .eq('id', pendingSupplier.ocrProcessingId);

      console.log(`✅ Lieferant genehmigt: ${result.supplier.name} (${result.action})`);

      return {
        success: true,
        supplier: result.supplier,
        action: result.action,
        pendingId
      };

    } catch (error) {
      console.error('❌ Fehler bei Lieferanten-Genehmigung:', error);
      throw error;
    }
  }

  // =====================================================
  // USER REJECTION WORKFLOW
  // =====================================================

  async rejectPendingSupplier(pendingId, reason, userId = 'user') {
    try {
      console.log(`❌ User lehnt Lieferanten ab: ${pendingId}`);

      const pendingSupplier = this.pendingSuppliers.get(pendingId) || 
                             await this.loadPendingSupplierFromDb(pendingId);

      if (!pendingSupplier) {
        throw new Error('Pending Supplier nicht gefunden');
      }

      // Als rejected markieren
      pendingSupplier.status = 'REJECTED';
      pendingSupplier.rejectedAt = new Date().toISOString();
      pendingSupplier.rejectedBy = userId;
      pendingSupplier.rejectionReason = reason;

      // Update in Cache und DB
      this.pendingSuppliers.set(pendingId, pendingSupplier);
      await this.updatePendingSupplierInDb(pendingId, pendingSupplier);

      // OCR Processing Record aktualisieren
      await supabaseAdmin
        .from('ocr_processing')
        .update({
          supplier_action: 'USER_REJECTED',
          supplier_rejected_by: userId,
          supplier_rejected_at: new Date().toISOString(),
          supplier_rejection_reason: reason
        })
        .eq('id', pendingSupplier.ocrProcessingId);

      return {
        success: true,
        action: 'REJECTED',
        reason
      };

    } catch (error) {
      console.error('❌ Fehler bei Lieferanten-Ablehnung:', error);
      throw error;
    }
  }

  // =====================================================
  // DIENSTLEISTER INTEGRATION
  // =====================================================

  async findExistingSupplier(supplierInfo) {
    try {
      if (!supplierInfo.name) return null;

      const normalizedName = this.normalizeName(supplierInfo.name);

      // 1. Exakte Suche nach normalisiertem Namen in suppliers Tabelle
      const { data: exactMatch } = await supabaseAdmin
        .from('suppliers')
        .select('*')
        .eq('normalized_name', normalizedName)
        .eq('status', 'ACTIVE')
        .single();

      if (exactMatch) return exactMatch;

      // 2. Suche nach UID-Nummer (österreichisch)
      if (supplierInfo.uidNumber) {
        const { data: uidMatch } = await supabaseAdmin
          .from('suppliers')
          .select('*')
          .eq('uid_number', supplierInfo.uidNumber)
          .eq('status', 'ACTIVE')
          .single();

        if (uidMatch) return uidMatch;
      }

      // 3. Ähnlichkeits-Suche bei allen aktiven Lieferanten
      const { data: allSuppliers } = await supabaseAdmin
        .from('suppliers')
        .select('*')
        .eq('status', 'ACTIVE');

      for (const supplier of allSuppliers || []) {
        const similarity = this.calculateSimilarity(normalizedName, supplier.normalized_name);
        if (similarity >= 0.8) {
          return supplier;
        }
      }

      return null;

    } catch (error) {
      console.error('❌ Fehler bei Supplier-Suche:', error);
      return null;
    }
  }

  async createNewSupplier(supplierData) {
    try {
      const supplierDataForDb = {
        name: supplierData.name,
        normalized_name: this.normalizeName(supplierData.name),
        
        // Österreichische Identifikatoren
        uid_number: supplierData.uidNumber || null,
        tax_number: supplierData.taxNumber || null,
        fb_number: supplierData.firmenbuchNumber || null,
        
        // Kontaktdaten
        address: supplierData.address || null,
        email: supplierData.email || null,
        phone: supplierData.phone || null,
        website: supplierData.website || null,
        
        // Bankdaten
        iban: supplierData.iban || null,
        
        // Geschäftsdaten
        legal_form: this.detectLegalForm(supplierData.name),
        business_sector: this.detectCategory(supplierData.name),
        country: 'AT',
        
        // OCR-Metadaten
        ocr_recognized: true,
        ocr_confidence: supplierData.ocr_confidence,
        ocr_processing_id: supplierData.ocr_processing_id,
        
        // Status
        status: 'ACTIVE',
        created_by: supplierData.approved_by || 'ocr-system'
      };

      const { data: newSupplier, error } = await supabaseAdmin
        .from('suppliers')
        .insert([supplierDataForDb])
        .select()
        .single();

      if (error) throw error;

      // Audit Log
      await createAuditLog({
        table_name: 'suppliers',
        record_id: newSupplier.id,
        action: 'OCR_CREATE_APPROVED',
        new_data: supplierDataForDb,
        user_id: supplierData.approved_by
      });

      return { supplier: newSupplier };

    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Suppliers:', error);
      throw error;
    }
  }

  async updateExistingSupplier(supplierId, supplierData) {
    try {
      const updateData = {
        // Nur leere Felder aktualisieren, existierende nicht überschreiben
        email: supplierData.email,
        phone: supplierData.phone,
        website: supplierData.website,
        tax_number: supplierData.taxNumber,
        uid_number: supplierData.uidNumber,
        fb_number: supplierData.firmenbuchNumber,
        iban: supplierData.iban,
        address: supplierData.address,
        // OCR-Update-Metadaten
        updated_at: new Date().toISOString(),
        ocr_confidence: supplierData.ocr_confidence
      };

      const { data: updatedSupplier, error } = await supabaseAdmin
        .from('suppliers')
        .update(updateData)
        .eq('id', supplierId)
        .select()
        .single();

      if (error) throw error;

      // Audit Log
      await createAuditLog({
        table_name: 'suppliers',
        record_id: supplierId,
        action: 'OCR_UPDATE_APPROVED',
        new_data: updateData,
        user_id: supplierData.approved_by
      });

      return { supplier: updatedSupplier };

    } catch (error) {
      console.error('❌ Fehler beim Update des Suppliers:', error);
      throw error;
    }
  }

  // =====================================================
  // PERSISTENCE METHODS
  // =====================================================

  async savePendingSupplierToDb(pendingSupplier) {
    try {
      // Verwende ocr_processing Tabelle für Persistenz
      await supabaseAdmin
        .from('ocr_processing')
        .update({
          pending_supplier_data: pendingSupplier,
          supplier_status: 'PENDING_APPROVAL'
        })
        .eq('id', pendingSupplier.ocrProcessingId);

    } catch (error) {
      console.error('❌ Fehler beim Speichern des Pending Suppliers:', error);
    }
  }

  async loadPendingSupplierFromDb(pendingId) {
    try {
      const { data } = await supabaseAdmin
        .from('ocr_processing')
        .select('pending_supplier_data')
        .eq('pending_supplier_data->id', pendingId)
        .single();

      return data?.pending_supplier_data || null;

    } catch (error) {
      console.error('❌ Fehler beim Laden des Pending Suppliers:', error);
      return null;
    }
  }

  async updatePendingSupplierInDb(pendingId, pendingSupplier) {
    try {
      await supabaseAdmin
        .from('ocr_processing')
        .update({
          pending_supplier_data: pendingSupplier,
          supplier_status: pendingSupplier.status
        })
        .eq('id', pendingSupplier.ocrProcessingId);

    } catch (error) {
      console.error('❌ Fehler beim Update des Pending Suppliers:', error);
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  normalizeName(name) {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\säöüß]/g, '')
      .replace(/\b(gmbh|ag|kg|ohg|ug|ek)\b/g, '')
      .trim();
  }

  calculateSimilarity(str1, str2) {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
    
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

  extractEmail(text) {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0] : null;
  }

  extractPhone(text) {
    const phoneMatch = text.match(/(?:\+49|0)\s?(?:\d{2,5})\s?(?:\d{3,8})/);
    return phoneMatch ? phoneMatch[0] : null;
  }

  extractWebsite(text) {
    const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return websiteMatch ? websiteMatch[0] : null;
  }

  detectCategory(name) {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('software') || lowerName.includes('it') || lowerName.includes('tech')) {
      return 'IT & Software';
    }
    if (lowerName.includes('marketing') || lowerName.includes('werbung') || lowerName.includes('media')) {
      return 'Marketing & Werbung';
    }
    if (lowerName.includes('beratung') || lowerName.includes('consulting')) {
      return 'Beratung & Consulting';
    }
    if (lowerName.includes('bau') || lowerName.includes('handwerk')) {
      return 'Bau & Handwerk';
    }
    if (lowerName.includes('transport') || lowerName.includes('logistik')) {
      return 'Transport & Logistik';
    }
    
    return 'Sonstiges';
  }

  detectLegalForm(name) {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('gmbh')) return 'GmbH';
    if (lowerName.includes(' ag ') || lowerName.endsWith(' ag')) return 'AG';
    if (lowerName.includes(' kg ') || lowerName.endsWith(' kg')) return 'KG';
    if (lowerName.includes(' og ') || lowerName.endsWith(' og')) return 'OG';
    if (lowerName.includes('keg')) return 'KEG';
    if (lowerName.includes(' se ') || lowerName.endsWith(' se')) return 'SE';
    if (lowerName.includes(' eu ') || lowerName.endsWith(' eu')) return 'eU';
    
    return null;
  }

  // =====================================================
  // CLEANUP & MAINTENANCE
  // =====================================================

  async cleanupExpiredPendingSuppliers() {
    const now = new Date();
    const expired = [];

    for (const [id, supplier] of this.pendingSuppliers.entries()) {
      if (new Date(supplier.expiresAt) < now && supplier.status === 'PENDING_APPROVAL') {
        expired.push(id);
      }
    }

    for (const id of expired) {
      await this.rejectPendingSupplier(id, 'EXPIRED', 'system');
      this.pendingSuppliers.delete(id);
    }

    if (expired.length > 0) {
      console.log(`🧹 ${expired.length} abgelaufene Pending Suppliers bereinigt`);
    }
  }

  // Periodische Bereinigung
  startCleanupScheduler() {
    setInterval(() => {
      this.cleanupExpiredPendingSuppliers();
    }, 60 * 60 * 1000); // Jede Stunde
  }
}

export default new SupplierApprovalService();
