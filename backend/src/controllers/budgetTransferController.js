// =====================================================
// Budget Manager 2025 - Budget Transfer Controller
// Story 1.4: Budget-Transfer-System
// =====================================================

import { supabaseAdmin, formatGermanCurrency, toGermanCurrency } from '../config/database.js';
import { createAuditLog } from '../utils/auditLogger.js';
import { sendTransferNotificationEmail } from '../services/emailService.js';

// =====================================================
// BUDGET TRANSFER OPERATIONS
// =====================================================

/**
 * Neuen Budget-Transfer-Antrag erstellen
 * Story 1.4 - Budget-Transfer-System
 */
export const createTransferRequest = async (req, res) => {
  try {
    const {
      from_project_id,
      to_project_id,
      transfer_amount,
      reason
    } = req.body;
    
    // Validierung der Transfer-Daten
    const validation = validateTransferRequest({
      from_project_id,
      to_project_id,
      transfer_amount,
      reason
    });
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Ungültige Transfer-Daten',
        message: validation.errors.join(', '),
        code: 'INVALID_TRANSFER_DATA'
      });
    }
    
    // Prüfe ob Projekte existieren und genügend Budget vorhanden
    const projectsCheck = await validateProjectsForTransfer(from_project_id, to_project_id, transfer_amount);
    if (!projectsCheck.isValid) {
      return res.status(400).json({
        error: 'Transfer nicht möglich',
        message: projectsCheck.message,
        code: 'TRANSFER_VALIDATION_FAILED'
      });
    }
    
    // Formatiere Transfer-Betrag für deutsche Geschäftslogik
    const formattedAmount = formatGermanCurrency(transfer_amount);
    
    // Erstelle Transfer-Antrag
    const { data: newTransfer, error } = await supabaseAdmin
      .from('budget_transfers')
      .insert([{
        from_project_id,
        to_project_id,
        transfer_amount: formattedAmount,
        reason: reason.trim(),
        requested_by: 'dev-user-123', // TODO: req.user?.id,
        status: 'PENDING'
      }])
      .select(`
        *,
        from_project:from_project_id (name, project_number),
        to_project:to_project_id (name, project_number)
      `)
      .single();
    
    if (error) {
      console.error('Supabase Insert Error:', error);
      return res.status(400).json({
        error: 'Fehler beim Erstellen des Transfer-Antrags',
        message: error.message,
        code: 'TRANSFER_CREATION_FAILED'
      });
    }
    
    // Audit Log erstellen
    try {
      await createAuditLog({
        table_name: 'budget_transfers',
        record_id: newTransfer.id,
        action: 'CREATE_TRANSFER_REQUEST',
        new_values: newTransfer,
        changed_by: 'dev-user-123', // req.user?.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.log('⚠️ Audit-Log übersprungen:', auditError.message);
    }
    
    // E-Mail-Benachrichtigung senden (asynchron)
    try {
      await sendTransferNotificationEmail({
        type: 'TRANSFER_REQUESTED',
        transfer: newTransfer,
        recipient: 'approver@company.com' // TODO: Dynamisch bestimmen
      });
    } catch (emailError) {
      console.log('⚠️ E-Mail-Benachrichtigung fehlgeschlagen:', emailError.message);
    }
    
    // Deutsche Formatierung für Response
    const formattedTransfer = formatTransferResponse(newTransfer);
    
    res.status(201).json({
      message: 'Transfer-Antrag erfolgreich erstellt',
      transfer: formattedTransfer,
      code: 'TRANSFER_REQUEST_CREATED'
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Transfer-Antrags:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Der Transfer-Antrag konnte nicht erstellt werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Alle Transfer-Anträge abrufen (mit Filterung)
 * Story 1.4 - Transfer-Historie
 */
export const getAllTransfers = async (req, res) => {
  try {
    const { 
      status, 
      requested_by, 
      project_id,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = supabaseAdmin
      .from('budget_transfers')
      .select(`
        *,
        from_project:from_project_id (name, project_number),
        to_project:to_project_id (name, project_number)
      `)
      .order('requested_at', { ascending: false });
    
    // Filter anwenden
    if (status && ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      query = query.eq('status', status);
    }
    
    if (requested_by) {
      query = query.eq('requested_by', requested_by);
    }
    
    if (project_id) {
      query = query.or(`from_project_id.eq.${project_id},to_project_id.eq.${project_id}`);
    }
    
    // Pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    const { data: transfers, error, count } = await query;
    
    if (error) {
      throw new Error(`Fehler beim Abrufen der Transfers: ${error.message}`);
    }
    
    // Deutsche Formatierung für alle Transfers
    const formattedTransfers = transfers.map(formatTransferResponse);
    
    // Transfer-Zusammenfassung berechnen
    const transferSummary = calculateTransferSummary(transfers);
    
    res.json({
      transfers: formattedTransfers,
      summary: transferSummary,
      pagination: {
        total: count || formattedTransfers.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: formattedTransfers.length === parseInt(limit)
      },
      filters: {
        status: status || null,
        requested_by: requested_by || null,
        project_id: project_id || null
      }
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Transfers:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Die Transfer-Historie konnte nicht abgerufen werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Einzelnen Transfer abrufen
 * Story 1.4 - Transfer-Details
 */
export const getTransfer = async (req, res) => {
  try {
    const { transferId } = req.params;
    
    const { data: transfer, error } = await supabaseAdmin
      .from('budget_transfers')
      .select(`
        *,
        from_project:from_project_id (name, project_number, allocated_budget),
        to_project:to_project_id (name, project_number, allocated_budget)
      `)
      .eq('id', transferId)
      .single();
    
    if (error || !transfer) {
      return res.status(404).json({
        error: 'Transfer nicht gefunden',
        message: `Der Transfer mit der ID ${transferId} existiert nicht.`,
        code: 'TRANSFER_NOT_FOUND'
      });
    }
    
    // Audit-Trail für diesen Transfer abrufen
    const { data: auditTrail } = await supabaseAdmin
      .from('budget_transfer_audit')
      .select('*')
      .eq('transfer_id', transferId)
      .order('changed_at', { ascending: true });
    
    // Deutsche Formatierung
    const formattedTransfer = formatTransferResponse(transfer);
    const formattedAuditTrail = auditTrail?.map(formatAuditEntry) || [];
    
    res.json({
      transfer: formattedTransfer,
      auditTrail: formattedAuditTrail
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Transfers:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Der Transfer konnte nicht abgerufen werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Transfer genehmigen oder ablehnen
 * Story 1.4 - Genehmigungs-Workflow
 */
export const reviewTransfer = async (req, res) => {
  try {
    const { transferId } = req.params;
    const { action, comment } = req.body;
    
    // Validierung
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({
        error: 'Ungültige Aktion',
        message: 'Aktion muss APPROVE oder REJECT sein.',
        code: 'INVALID_ACTION'
      });
    }
    
    // Aktuellen Transfer abrufen
    const { data: currentTransfer, error: fetchError } = await supabaseAdmin
      .from('budget_transfers')
      .select('*')
      .eq('id', transferId)
      .single();
    
    if (fetchError || !currentTransfer) {
      return res.status(404).json({
        error: 'Transfer nicht gefunden',
        code: 'TRANSFER_NOT_FOUND'
      });
    }
    
    // Prüfe ob Transfer noch pending ist
    if (currentTransfer.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Transfer kann nicht mehr bearbeitet werden',
        message: `Transfer hat bereits den Status: ${currentTransfer.status}`,
        code: 'TRANSFER_NOT_PENDING'
      });
    }
    
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    
    // Update Transfer-Status
    const { data: updatedTransfer, error: updateError } = await supabaseAdmin
      .from('budget_transfers')
      .update({
        status: newStatus,
        reviewed_by: 'dev-user-123', // req.user?.id,
        reviewed_at: new Date().toISOString(),
        review_comment: comment || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transferId)
      .select(`
        *,
        from_project:from_project_id (name, project_number),
        to_project:to_project_id (name, project_number)
      `)
      .single();
    
    if (updateError) {
      throw new Error(`Fehler beim Update: ${updateError.message}`);
    }
    
    // Bei Genehmigung: Transfer ausführen
    let executionResult = null;
    if (action === 'APPROVE') {
      try {
        const { data: result } = await supabaseAdmin
          .rpc('execute_budget_transfer', { transfer_uuid: transferId });
        
        executionResult = result?.[0];
        
        if (!executionResult?.success) {
          // Rollback bei Ausführungsfehler
          await supabaseAdmin
            .from('budget_transfers')
            .update({
              status: 'PENDING',
              reviewed_by: null,
              reviewed_at: null,
              review_comment: `Ausführung fehlgeschlagen: ${executionResult?.message}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', transferId);
          
          return res.status(400).json({
            error: 'Transfer-Ausführung fehlgeschlagen',
            message: executionResult?.message || 'Unbekannter Fehler',
            code: 'TRANSFER_EXECUTION_FAILED'
          });
        }
      } catch (execError) {
        console.error('❌ Transfer-Ausführung fehlgeschlagen:', execError);
        return res.status(500).json({
          error: 'Transfer-Ausführung fehlgeschlagen',
          message: execError.message,
          code: 'TRANSFER_EXECUTION_ERROR'
        });
      }
    }
    
    // Audit Log erstellen
    try {
      await createAuditLog({
        table_name: 'budget_transfers',
        record_id: transferId,
        action: `TRANSFER_${action}D`,
        old_values: { status: currentTransfer.status },
        new_values: { status: newStatus, comment },
        changed_by: 'dev-user-123', // req.user?.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.log('⚠️ Audit-Log übersprungen:', auditError.message);
    }
    
    // E-Mail-Benachrichtigung senden
    try {
      await sendTransferNotificationEmail({
        type: `TRANSFER_${action}D`,
        transfer: updatedTransfer,
        recipient: 'requester@company.com' // TODO: Dynamisch bestimmen
      });
    } catch (emailError) {
      console.log('⚠️ E-Mail-Benachrichtigung fehlgeschlagen:', emailError.message);
    }
    
    const formattedTransfer = formatTransferResponse(updatedTransfer);
    
    res.json({
      message: `Transfer erfolgreich ${action === 'APPROVE' ? 'genehmigt' : 'abgelehnt'}`,
      transfer: formattedTransfer,
      executionResult,
      code: `TRANSFER_${action}D_SUCCESS`
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Review des Transfers:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Der Transfer konnte nicht bearbeitet werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Transfer stornieren (nur durch Antragsteller)
 * Story 1.4 - Transfer-Stornierung
 */
export const cancelTransfer = async (req, res) => {
  try {
    const { transferId } = req.params;
    const { reason } = req.body;
    
    // Aktuellen Transfer abrufen
    const { data: currentTransfer, error: fetchError } = await supabaseAdmin
      .from('budget_transfers')
      .select('*')
      .eq('id', transferId)
      .single();
    
    if (fetchError || !currentTransfer) {
      return res.status(404).json({
        error: 'Transfer nicht gefunden',
        code: 'TRANSFER_NOT_FOUND'
      });
    }
    
    // Prüfe ob Transfer storniert werden kann
    if (currentTransfer.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Transfer kann nicht storniert werden',
        message: `Transfer hat bereits den Status: ${currentTransfer.status}`,
        code: 'TRANSFER_NOT_CANCELLABLE'
      });
    }
    
    // TODO: Prüfe ob aktueller Benutzer der Antragsteller ist
    // if (currentTransfer.requested_by !== req.user?.id) { ... }
    
    // Transfer stornieren
    const { data: cancelledTransfer, error: updateError } = await supabaseAdmin
      .from('budget_transfers')
      .update({
        status: 'CANCELLED',
        review_comment: reason || 'Vom Antragsteller storniert',
        updated_at: new Date().toISOString()
      })
      .eq('id', transferId)
      .select(`
        *,
        from_project:from_project_id (name, project_number),
        to_project:to_project_id (name, project_number)
      `)
      .single();
    
    if (updateError) {
      throw new Error(`Fehler beim Stornieren: ${updateError.message}`);
    }
    
    // Audit Log erstellen
    try {
      await createAuditLog({
        table_name: 'budget_transfers',
        record_id: transferId,
        action: 'TRANSFER_CANCELLED',
        old_values: { status: currentTransfer.status },
        new_values: { status: 'CANCELLED', reason },
        changed_by: 'dev-user-123', // req.user?.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.log('⚠️ Audit-Log übersprungen:', auditError.message);
    }
    
    const formattedTransfer = formatTransferResponse(cancelledTransfer);
    
    res.json({
      message: 'Transfer erfolgreich storniert',
      transfer: formattedTransfer,
      code: 'TRANSFER_CANCELLED_SUCCESS'
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Stornieren des Transfers:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Der Transfer konnte nicht storniert werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Formatiere Transfer für Response
 */
function formatTransferResponse(transfer) {
  return {
    ...transfer,
    transfer_amount_formatted: toGermanCurrency(transfer.transfer_amount || 0),
    status_label: getTransferStatusLabel(transfer.status),
    status_color: getTransferStatusColor(transfer.status),
    requested_at_formatted: transfer.requested_at ? 
      new Date(transfer.requested_at).toLocaleDateString('de-DE') : null,
    reviewed_at_formatted: transfer.reviewed_at ? 
      new Date(transfer.reviewed_at).toLocaleDateString('de-DE') : null,
    executed_at_formatted: transfer.executed_at ? 
      new Date(transfer.executed_at).toLocaleDateString('de-DE') : null,
    from_project_name: transfer.from_project?.name || 'Unbekannt',
    from_project_number: transfer.from_project?.project_number || 'N/A',
    to_project_name: transfer.to_project?.name || 'Unbekannt',
    to_project_number: transfer.to_project?.project_number || 'N/A'
  };
}

/**
 * Deutsche Transfer-Status-Labels
 */
function getTransferStatusLabel(status) {
  const labels = {
    'PENDING': 'Ausstehend',
    'APPROVED': 'Genehmigt',
    'REJECTED': 'Abgelehnt',
    'CANCELLED': 'Storniert'
  };
  return labels[status] || 'Unbekannt';
}

/**
 * Transfer-Status-Farben für UI
 */
function getTransferStatusColor(status) {
  const colors = {
    'PENDING': 'yellow',
    'APPROVED': 'green',
    'REJECTED': 'red',
    'CANCELLED': 'gray'
  };
  return colors[status] || 'gray';
}

/**
 * Formatiere Audit-Eintrag
 */
function formatAuditEntry(entry) {
  return {
    ...entry,
    changed_at_formatted: new Date(entry.changed_at).toLocaleString('de-DE'),
    action_label: getAuditActionLabel(entry.action)
  };
}

/**
 * Deutsche Audit-Action-Labels
 */
function getAuditActionLabel(action) {
  const labels = {
    'CREATED': 'Erstellt',
    'APPROVED': 'Genehmigt',
    'REJECTED': 'Abgelehnt',
    'CANCELLED': 'Storniert',
    'EXECUTED': 'Ausgeführt'
  };
  return labels[action] || action;
}

/**
 * Berechne Transfer-Zusammenfassung
 */
function calculateTransferSummary(transfers) {
  const summary = {
    total_transfers: transfers.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    total_amount_pending: 0,
    total_amount_approved: 0
  };
  
  transfers.forEach(transfer => {
    // Status-Zählung
    switch (transfer.status) {
      case 'PENDING': 
        summary.pending++; 
        summary.total_amount_pending += transfer.transfer_amount || 0;
        break;
      case 'APPROVED': 
        summary.approved++; 
        summary.total_amount_approved += transfer.transfer_amount || 0;
        break;
      case 'REJECTED': summary.rejected++; break;
      case 'CANCELLED': summary.cancelled++; break;
    }
  });
  
  // Deutsche Formatierung
  summary.total_amount_pending_formatted = toGermanCurrency(summary.total_amount_pending);
  summary.total_amount_approved_formatted = toGermanCurrency(summary.total_amount_approved);
  
  return summary;
}

/**
 * Validiere Transfer-Request-Daten
 */
function validateTransferRequest(data) {
  const errors = [];
  
  if (!data.from_project_id) {
    errors.push('Quell-Projekt ist erforderlich');
  }
  
  if (!data.to_project_id) {
    errors.push('Ziel-Projekt ist erforderlich');
  }
  
  if (data.from_project_id === data.to_project_id) {
    errors.push('Quell- und Ziel-Projekt müssen unterschiedlich sein');
  }
  
  if (!data.transfer_amount || data.transfer_amount <= 0) {
    errors.push('Transfer-Betrag muss größer als 0 sein');
  }
  
  if (!data.reason || data.reason.trim().length < 10) {
    errors.push('Begründung muss mindestens 10 Zeichen lang sein');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validiere Projekte für Transfer
 */
async function validateProjectsForTransfer(fromProjectId, toProjectId, amount) {
  try {
    // Beide Projekte abrufen
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('id, name, allocated_budget')
      .in('id', [fromProjectId, toProjectId]);
    
    if (error || !projects || projects.length !== 2) {
      return {
        isValid: false,
        message: 'Ein oder beide Projekte wurden nicht gefunden'
      };
    }
    
    const fromProject = projects.find(p => p.id === fromProjectId);
    const toProject = projects.find(p => p.id === toProjectId);
    
    if (!fromProject || !toProject) {
      return {
        isValid: false,
        message: 'Projekte konnten nicht zugeordnet werden'
      };
    }
    
    // Prüfe verfügbares Budget
    if (fromProject.allocated_budget < amount) {
      return {
        isValid: false,
        message: `Nicht genügend Budget verfügbar. Verfügbar: ${toGermanCurrency(fromProject.allocated_budget)}, Benötigt: ${toGermanCurrency(amount)}`
      };
    }
    
    return { isValid: true };
    
  } catch (error) {
    return {
      isValid: false,
      message: `Validierungsfehler: ${error.message}`
    };
  }
}

export default {
  createTransferRequest,
  getAllTransfers,
  getTransfer,
  reviewTransfer,
  cancelTransfer
};

