// =====================================================
// Supplier Approval Controller - API für User-Genehmigung
// Endpoints für manuelle Lieferanten-Genehmigung
// =====================================================

import supplierApprovalService from '../services/supplierApprovalService.js';
import { supabaseAdmin } from '../config/database.js';

// =====================================================
// GET PENDING SUPPLIERS
// =====================================================

export const getPendingSuppliers = async (req, res) => {
  try {
    const { limit = 10, offset = 0, status = 'PENDING_APPROVAL' } = req.query;

    // Lade Pending Suppliers aus OCR Processing
    const { data: pendingOcrRecords, error } = await supabaseAdmin
      .from('ocr_processing')
      .select(`
        id,
        file_name,
        supplier_confidence,
        supplier_status,
        pending_supplier_data,
        created_at
      `)
      .eq('supplier_status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Fehler beim Abrufen der Pending Suppliers:', error);
      return res.status(500).json({
        success: false,
        error: 'Interner Serverfehler',
        message: 'Fehler beim Abrufen der ausstehenden Lieferanten.',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }

    // Formatiere Daten für Frontend
    const pendingSuppliers = pendingOcrRecords.map(record => ({
      id: record.pending_supplier_data?.id || `ocr_${record.id}`,
      ocrProcessingId: record.id,
      fileName: record.file_name,
      confidence: record.supplier_confidence,
      status: record.supplier_status,
      extractedData: record.pending_supplier_data?.extractedData || {},
      existingSupplier: record.pending_supplier_data?.existingSupplier || null,
      createdAt: record.created_at,
      expiresAt: record.pending_supplier_data?.expiresAt || null
    }));

    res.status(200).json({
      success: true,
      data: pendingSuppliers,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: pendingSuppliers.length
      }
    });

  } catch (error) {
    console.error('❌ Unerwarteter Fehler beim Abrufen der Pending Suppliers:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      message: 'Ein unerwarteter Fehler ist aufgetreten.',
      code: 'UNEXPECTED_ERROR'
    });
  }
};

// =====================================================
// GET SINGLE PENDING SUPPLIER
// =====================================================

export const getPendingSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Lade spezifischen Pending Supplier
    const { data: ocrRecord, error } = await supabaseAdmin
      .from('ocr_processing')
      .select(`
        *,
        pending_supplier_data
      `)
      .or(`pending_supplier_data->id.eq.${id},id.eq.${id}`)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'Pending Supplier nicht gefunden',
        message: `Kein ausstehender Lieferant mit der ID ${id} gefunden.`,
        code: 'PENDING_SUPPLIER_NOT_FOUND'
      });
    } else if (error) {
      console.error('❌ Fehler beim Abrufen des Pending Suppliers:', error);
      return res.status(500).json({
        success: false,
        error: 'Interner Serverfehler',
        message: 'Fehler beim Abrufen des ausstehenden Lieferanten.',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }

    // Vollständige Daten zurückgeben
    const pendingSupplier = {
      ...ocrRecord.pending_supplier_data,
      ocrProcessingId: ocrRecord.id,
      ocrText: ocrRecord.final_text,
      ocrConfidence: ocrRecord.final_confidence
    };

    res.status(200).json({
      success: true,
      data: pendingSupplier
    });

  } catch (error) {
    console.error('❌ Unerwarteter Fehler beim Abrufen des Pending Suppliers:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      message: 'Ein unerwarteter Fehler ist aufgetreten.',
      code: 'UNEXPECTED_ERROR'
    });
  }
};

// =====================================================
// APPROVE PENDING SUPPLIER
// =====================================================

export const approvePendingSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const userEdits = req.body;
    const userId = req.user?.id || 'anonymous';

    console.log(`✅ User genehmigt Lieferanten: ${id}`);

    // Validiere User-Edits
    if (!userEdits.name || userEdits.name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Validierungsfehler',
        message: 'Lieferantenname ist erforderlich (min. 2 Zeichen).',
        code: 'VALIDATION_ERROR'
      });
    }

    // Approval durchführen
    const result = await supplierApprovalService.approvePendingSupplier(
      id, 
      userEdits, 
      userId
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Lieferant erfolgreich ${result.action === 'CREATED_NEW' ? 'angelegt' : 'aktualisiert'}.`,
        data: {
          supplier: result.supplier,
          action: result.action,
          pendingId: result.pendingId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Genehmigung fehlgeschlagen',
        message: result.error || 'Unbekannter Fehler bei der Genehmigung.',
        code: 'APPROVAL_FAILED'
      });
    }

  } catch (error) {
    console.error('❌ Fehler bei Lieferanten-Genehmigung:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      message: 'Fehler bei der Lieferanten-Genehmigung.',
      code: 'APPROVAL_ERROR'
    });
  }
};

// =====================================================
// REJECT PENDING SUPPLIER
// =====================================================

export const rejectPendingSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Vom User abgelehnt' } = req.body;
    const userId = req.user?.id || 'anonymous';

    console.log(`❌ User lehnt Lieferanten ab: ${id}`);

    // Rejection durchführen
    const result = await supplierApprovalService.rejectPendingSupplier(
      id, 
      reason, 
      userId
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Lieferant erfolgreich abgelehnt.',
        data: {
          action: result.action,
          reason: result.reason
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Ablehnung fehlgeschlagen',
        message: result.error || 'Unbekannter Fehler bei der Ablehnung.',
        code: 'REJECTION_FAILED'
      });
    }

  } catch (error) {
    console.error('❌ Fehler bei Lieferanten-Ablehnung:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      message: 'Fehler bei der Lieferanten-Ablehnung.',
      code: 'REJECTION_ERROR'
    });
  }
};

// =====================================================
// UPDATE PENDING SUPPLIER (DRAFT SAVE)
// =====================================================

export const updatePendingSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Lade aktuellen Pending Supplier
    const { data: ocrRecord, error: fetchError } = await supabaseAdmin
      .from('ocr_processing')
      .select('pending_supplier_data')
      .or(`pending_supplier_data->id.eq.${id},id.eq.${id}`)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        error: 'Pending Supplier nicht gefunden',
        code: 'PENDING_SUPPLIER_NOT_FOUND'
      });
    }

    // Update Pending Supplier Daten
    const updatedPendingSupplier = {
      ...ocrRecord.pending_supplier_data,
      extractedData: {
        ...ocrRecord.pending_supplier_data.extractedData,
        ...updates
      },
      lastModified: new Date().toISOString()
    };

    // Speichere Updates
    const { error: updateError } = await supabaseAdmin
      .from('ocr_processing')
      .update({
        pending_supplier_data: updatedPendingSupplier
      })
      .eq('id', ocrRecord.pending_supplier_data?.ocrProcessingId || id);

    if (updateError) {
      console.error('❌ Fehler beim Update des Pending Suppliers:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Update fehlgeschlagen',
        code: 'UPDATE_FAILED'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Änderungen gespeichert.',
      data: updatedPendingSupplier
    });

  } catch (error) {
    console.error('❌ Fehler beim Update des Pending Suppliers:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      code: 'UNEXPECTED_ERROR'
    });
  }
};

// =====================================================
// GET APPROVAL STATISTICS
// =====================================================

export const getApprovalStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const { data: stats, error } = await supabaseAdmin
      .from('ocr_processing')
      .select('supplier_status, supplier_confidence, created_at')
      .gte('created_at', startDate.toISOString())
      .not('supplier_status', 'is', null);

    if (error) {
      console.error('❌ Fehler beim Abrufen der Approval-Statistiken:', error);
      return res.status(500).json({
        success: false,
        error: 'Statistik-Fehler',
        code: 'STATS_ERROR'
      });
    }

    const approvalStats = {
      totalProcessed: stats.length,
      pendingApproval: stats.filter(s => s.supplier_status === 'PENDING_APPROVAL').length,
      approved: stats.filter(s => s.supplier_status === 'APPROVED').length,
      rejected: stats.filter(s => s.supplier_status === 'REJECTED').length,
      avgConfidence: stats.length > 0 
        ? stats.reduce((sum, s) => sum + (s.supplier_confidence || 0), 0) / stats.length 
        : 0,
      approvalRate: stats.length > 0 
        ? (stats.filter(s => s.supplier_status === 'APPROVED').length / stats.length) * 100 
        : 0
    };

    res.status(200).json({
      success: true,
      data: {
        period: `${days} Tage`,
        ...approvalStats
      }
    });

  } catch (error) {
    console.error('❌ Fehler bei Approval-Statistiken:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      code: 'UNEXPECTED_ERROR'
    });
  }
};

export default {
  getPendingSuppliers,
  getPendingSupplier,
  approvePendingSupplier,
  rejectPendingSupplier,
  updatePendingSupplier,
  getApprovalStats
};

