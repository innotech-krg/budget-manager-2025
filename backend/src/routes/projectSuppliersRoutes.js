// =====================================================
// Budget Manager 2025 - Project Suppliers Routes
// Epic 9 - Story 9.2: Multi-Dienstleister-System
// =====================================================

import express from 'express';
import { supabase } from '../config/database.js';
import authMiddleware from '../middleware/authMiddleware.js';
import permissionMiddleware from '../middleware/permissionMiddleware.js';

const router = express.Router();

// =====================================================
// MIDDLEWARE
// =====================================================
router.use(authMiddleware.requireAuth);

// =====================================================
// GET /api/projects/:id/suppliers
// Alle Projekt-Dienstleister abrufen (aktiv + entfernt)
// =====================================================
router.get('/:projectId/suppliers', permissionMiddleware.requirePermission('project:read'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { include_removed = 'false' } = req.query;

    console.log(`📥 [Project-Suppliers] GET /api/projects/${projectId}/suppliers`);

    // Query mit Supplier-Details
    let query = supabase
      .from('project_suppliers')
      .select(`
        *,
        suppliers:supplier_id (
          id,
          name,
          email,
          phone,
          address,
          uid,
          iban,
          is_active
        )
      `)
      .eq('project_id', projectId);

    // Filter für aktive/entfernte Dienstleister
    if (include_removed !== 'true') {
      query = query.eq('is_active', true);
    }

    const { data: projectSuppliers, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Fehler beim Laden der Projekt-Dienstleister:', error);
      return res.status(500).json({ 
        error: 'Fehler beim Laden der Projekt-Dienstleister',
        details: error.message 
      });
    }

    // Berechne Gesamtstatistiken
    const stats = {
      total_suppliers: projectSuppliers.length,
      active_suppliers: projectSuppliers.filter(ps => ps.is_active).length,
      total_allocated: projectSuppliers.reduce((sum, ps) => sum + (ps.allocated_budget || 0), 0),
      total_consumed: projectSuppliers.reduce((sum, ps) => sum + (ps.consumed_budget || 0), 0),
      total_available: projectSuppliers.reduce((sum, ps) => sum + ((ps.allocated_budget || 0) - (ps.consumed_budget || 0)), 0)
    };

    console.log(`✅ [Project-Suppliers] ${projectSuppliers.length} Dienstleister geladen`);
    
    res.json({
      suppliers: projectSuppliers,
      stats
    });

  } catch (error) {
    console.error('❌ Server-Fehler beim Laden der Projekt-Dienstleister:', error);
    res.status(500).json({ 
      error: 'Server-Fehler beim Laden der Projekt-Dienstleister',
      details: error.message 
    });
  }
});

// =====================================================
// POST /api/projects/:id/suppliers
// Dienstleister zu Projekt hinzufügen
// =====================================================
router.post('/:projectId/suppliers', permissionMiddleware.requirePermission('project:write'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { supplier_id, allocated_budget = 0 } = req.body;
    const userId = req.user.id;

    console.log(`📥 [Project-Suppliers] POST /api/projects/${projectId}/suppliers`);

    // Validierung
    if (!supplier_id) {
      return res.status(400).json({ error: 'supplier_id ist erforderlich' });
    }

    if (allocated_budget < 0) {
      return res.status(400).json({ error: 'Budget muss positiv sein' });
    }

    // Prüfe ob Dienstleister bereits zugeordnet ist
    const { data: existing, error: existingError } = await supabase
      .from('project_suppliers')
      .select('id, is_active')
      .eq('project_id', projectId)
      .eq('supplier_id', supplier_id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Fehler beim Prüfen bestehender Zuordnung:', existingError);
      return res.status(500).json({ error: 'Fehler beim Prüfen der Dienstleister-Zuordnung' });
    }

    if (existing) {
      if (existing.is_active) {
        return res.status(409).json({ error: 'Dienstleister ist bereits diesem Projekt zugeordnet' });
      } else {
        // Reaktiviere entfernten Dienstleister
        const { data: reactivated, error: reactivateError } = await supabase
          .from('project_suppliers')
          .update({
            is_active: true,
            allocated_budget,
            removed_at: null,
            available_at_removal: null,
            removal_reason: null,
            removed_by: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select(`
            *,
            suppliers:supplier_id (
              id, name, email, phone, address, uid, iban, is_active
            )
          `)
          .single();

        if (reactivateError) {
          console.error('❌ Fehler beim Reaktivieren des Dienstleisters:', reactivateError);
          return res.status(500).json({ error: 'Fehler beim Reaktivieren des Dienstleisters' });
        }

        console.log(`✅ [Project-Suppliers] Dienstleister reaktiviert: ${supplier_id}`);
        return res.status(200).json(reactivated);
      }
    }

    // Neuen Dienstleister hinzufügen
    const { data: newProjectSupplier, error: insertError } = await supabase
      .from('project_suppliers')
      .insert({
        project_id: projectId,
        supplier_id,
        allocated_budget,
        consumed_budget: 0,
        is_active: true
      })
      .select(`
        *,
        suppliers:supplier_id (
          id, name, email, phone, address, uid, iban, is_active
        )
      `)
      .single();

    if (insertError) {
      console.error('❌ Fehler beim Hinzufügen des Dienstleisters:', insertError);
      return res.status(500).json({ 
        error: 'Fehler beim Hinzufügen des Dienstleisters',
        details: insertError.message 
      });
    }

    console.log(`✅ [Project-Suppliers] Dienstleister hinzugefügt: ${supplier_id}`);
    res.status(201).json(newProjectSupplier);

  } catch (error) {
    console.error('❌ Server-Fehler beim Hinzufügen des Dienstleisters:', error);
    res.status(500).json({ 
      error: 'Server-Fehler beim Hinzufügen des Dienstleisters',
      details: error.message 
    });
  }
});

// =====================================================
// PUT /api/projects/:id/suppliers/:supplierId
// Dienstleister-Budget aktualisieren
// =====================================================
router.put('/:projectId/suppliers/:supplierId', permissionMiddleware.requirePermission('project:write'), async (req, res) => {
  try {
    const { projectId, supplierId } = req.params;
    const { allocated_budget } = req.body;

    console.log(`📥 [Project-Suppliers] PUT /api/projects/${projectId}/suppliers/${supplierId}`);

    // Validierung
    if (allocated_budget === undefined || allocated_budget < 0) {
      return res.status(400).json({ error: 'Gültiges allocated_budget ist erforderlich' });
    }

    // Aktuelle Daten abrufen
    const { data: current, error: currentError } = await supabase
      .from('project_suppliers')
      .select('*')
      .eq('project_id', projectId)
      .eq('supplier_id', supplierId)
      .eq('is_active', true)
      .single();

    if (currentError) {
      console.error('❌ Projekt-Dienstleister nicht gefunden:', currentError);
      return res.status(404).json({ error: 'Projekt-Dienstleister nicht gefunden' });
    }

    // Prüfe ob neues Budget >= verbrauchtes Budget
    if (allocated_budget < current.consumed_budget) {
      return res.status(400).json({ 
        error: `Budget kann nicht unter verbrauchtes Budget (€${current.consumed_budget}) gesetzt werden` 
      });
    }

    // Budget aktualisieren
    const { data: updated, error: updateError } = await supabase
      .from('project_suppliers')
      .update({
        allocated_budget,
        updated_at: new Date().toISOString()
      })
      .eq('id', current.id)
      .select(`
        *,
        suppliers:supplier_id (
          id, name, email, phone, address, uid, iban, is_active
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ Fehler beim Aktualisieren des Budgets:', updateError);
      return res.status(500).json({ 
        error: 'Fehler beim Aktualisieren des Budgets',
        details: updateError.message 
      });
    }

    console.log(`✅ [Project-Suppliers] Budget aktualisiert: ${supplierId} -> €${allocated_budget}`);
    res.json(updated);

  } catch (error) {
    console.error('❌ Server-Fehler beim Aktualisieren des Budgets:', error);
    res.status(500).json({ 
      error: 'Server-Fehler beim Aktualisieren des Budgets',
      details: error.message 
    });
  }
});

// =====================================================
// DELETE /api/projects/:id/suppliers/:supplierId
// Dienstleister entfernen (intelligente Budget-Logik)
// =====================================================
router.delete('/:projectId/suppliers/:supplierId', permissionMiddleware.requirePermission('project:write'), async (req, res) => {
  try {
    const { projectId, supplierId } = req.params;
    const { reason = 'Dienstleister entfernt' } = req.body;
    const userId = req.user.id;

    console.log(`📥 [Project-Suppliers] DELETE /api/projects/${projectId}/suppliers/${supplierId}`);

    // Aktuelle Daten abrufen
    const { data: current, error: currentError } = await supabase
      .from('project_suppliers')
      .select('*')
      .eq('project_id', projectId)
      .eq('supplier_id', supplierId)
      .eq('is_active', true)
      .single();

    if (currentError) {
      console.error('❌ Projekt-Dienstleister nicht gefunden:', currentError);
      return res.status(404).json({ error: 'Projekt-Dienstleister nicht gefunden' });
    }

    // Berechne verfügbares Budget das zurückfließt
    const availableBudget = current.allocated_budget - current.consumed_budget;

    // Dienstleister als entfernt markieren (Soft Delete)
    const { data: removed, error: removeError } = await supabase
      .from('project_suppliers')
      .update({
        is_active: false,
        removed_at: new Date().toISOString(),
        available_at_removal: availableBudget,
        removal_reason: reason,
        removed_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', current.id)
      .select(`
        *,
        suppliers:supplier_id (
          id, name, email, phone, address, uid, iban, is_active
        )
      `)
      .single();

    if (removeError) {
      console.error('❌ Fehler beim Entfernen des Dienstleisters:', removeError);
      return res.status(500).json({ 
        error: 'Fehler beim Entfernen des Dienstleisters',
        details: removeError.message 
      });
    }

    console.log(`✅ [Project-Suppliers] Dienstleister entfernt: ${supplierId}, verfügbares Budget: €${availableBudget}`);
    
    res.json({
      ...removed,
      message: `Dienstleister entfernt. €${availableBudget.toFixed(2)} verfügbares Budget fließt zurück.`
    });

  } catch (error) {
    console.error('❌ Server-Fehler beim Entfernen des Dienstleisters:', error);
    res.status(500).json({ 
      error: 'Server-Fehler beim Entfernen des Dienstleisters',
      details: error.message 
    });
  }
});

// =====================================================
// GET /api/projects/:id/budget-summary
// Vollständige Budget-Übersicht
// =====================================================
router.get('/:projectId/budget-summary', permissionMiddleware.requirePermission('project:read'), async (req, res) => {
  try {
    const { projectId } = req.params;

    console.log(`📥 [Project-Suppliers] GET /api/projects/${projectId}/budget-summary`);

    // Projekt-Daten mit externem Budget
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, external_budget, planned_budget, consumed_budget')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('❌ Projekt nicht gefunden:', projectError);
      return res.status(404).json({ error: 'Projekt nicht gefunden' });
    }

    // Aktive Dienstleister-Budgets
    const { data: activeSuppliers, error: suppliersError } = await supabase
      .from('project_suppliers')
      .select('allocated_budget, consumed_budget')
      .eq('project_id', projectId)
      .eq('is_active', true);

    if (suppliersError) {
      console.error('❌ Fehler beim Laden der Dienstleister-Budgets:', suppliersError);
      return res.status(500).json({ error: 'Fehler beim Laden der Dienstleister-Budgets' });
    }

    // Berechnungen
    const externalBudget = project.external_budget || 0;
    const supplierAllocated = activeSuppliers.reduce((sum, s) => sum + (s.allocated_budget || 0), 0);
    const supplierConsumed = activeSuppliers.reduce((sum, s) => sum + (s.consumed_budget || 0), 0);
    const unassignedExternal = externalBudget - supplierAllocated;
    const availableExternal = supplierAllocated - supplierConsumed;

    // Jahresbudget-Auswirkung (nur externe Kosten)
    const annualBudgetImpact = supplierConsumed;

    const summary = {
      project: {
        id: project.id,
        name: project.name,
        planned_budget: project.planned_budget || 0,
        consumed_budget: project.consumed_budget || 0
      },
      external: {
        total_budget: externalBudget,
        allocated_to_suppliers: supplierAllocated,
        unassigned_budget: unassignedExternal,
        consumed_budget: supplierConsumed,
        available_budget: availableExternal,
        suppliers_count: activeSuppliers.length
      },
      internal: {
        // Wird in Story 9.4 implementiert
        teams_count: 0,
        estimated_costs: 0,
        note: 'Interne Kosten werden in Story 9.4 implementiert'
      },
      annual_budget_impact: {
        consumed_amount: annualBudgetImpact,
        note: 'Nur externe Kosten beeinflussen das Jahresbudget'
      },
      validation: {
        is_valid: unassignedExternal >= 0 && availableExternal >= 0,
        warnings: [],
        errors: []
      }
    };

    // Validierungs-Warnungen
    if (unassignedExternal < 0) {
      summary.validation.errors.push('Mehr Budget zugewiesen als verfügbar');
    }
    if (availableExternal < 0) {
      summary.validation.errors.push('Mehr Budget verbraucht als zugewiesen');
    }
    if (unassignedExternal > externalBudget * 0.5) {
      summary.validation.warnings.push('Großer Anteil des externen Budgets ist noch nicht zugewiesen');
    }

    console.log(`✅ [Project-Suppliers] Budget-Summary erstellt für Projekt ${projectId}`);
    res.json(summary);

  } catch (error) {
    console.error('❌ Server-Fehler beim Erstellen der Budget-Übersicht:', error);
    res.status(500).json({ 
      error: 'Server-Fehler beim Erstellen der Budget-Übersicht',
      details: error.message 
    });
  }
});

// =====================================================
// GET /api/projects/:id/audit-log
// Vollständiger Audit-Trail
// =====================================================
router.get('/:projectId/audit-log', permissionMiddleware.requirePermission('project:read'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    console.log(`📥 [Project-Suppliers] GET /api/projects/${projectId}/audit-log`);

    const { data: auditLog, error } = await supabase
      .from('budget_audit_log')
      .select(`
        *,
        suppliers:supplier_id (id, name),
        users:created_by (id, email)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error('❌ Fehler beim Laden des Audit-Logs:', error);
      return res.status(500).json({ 
        error: 'Fehler beim Laden des Audit-Logs',
        details: error.message 
      });
    }

    console.log(`✅ [Project-Suppliers] ${auditLog.length} Audit-Log-Einträge geladen`);
    res.json(auditLog);

  } catch (error) {
    console.error('❌ Server-Fehler beim Laden des Audit-Logs:', error);
    res.status(500).json({ 
      error: 'Server-Fehler beim Laden des Audit-Logs',
      details: error.message 
    });
  }
});

export default router;
