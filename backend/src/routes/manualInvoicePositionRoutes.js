import express from 'express';
import { supabase } from '../config/database.js';
const router = express.Router();

/**
 * POST /api/manual-positions
 * Erstellt eine neue manuelle Rechnungsposition
 */
router.post('/', async (req, res) => {
  try {
    const {
      projectId,
      description,
      quantity,
      unitPrice,
      totalAmount,
      taxRate,
      taxAmount,
      category,
      reason,
      notes,
      sourceDocuments,
      validationOverrides
    } = req.body;

    console.log('📝 Erstelle manuelle Rechnungsposition:', { projectId, description, totalAmount });

    // Validierung der Pflichtfelder
    if (!projectId || !description || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Pflichtfelder fehlen: projectId, description, totalAmount'
      });
    }

    // Prüfe ob Projekt existiert
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, planned_budget, consumed_budget')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Projekt nicht gefunden'
      });
    }

    // Berechne automatische Werte
    const calculatedQuantity = quantity || 1;
    const calculatedUnitPrice = unitPrice || totalAmount;
    const calculatedTaxRate = taxRate || 20; // Standard MwSt-Satz
    const calculatedTaxAmount = taxAmount || (totalAmount * calculatedTaxRate / 100);

    // Erstelle manuelle Position
    const positionData = {
      project_id: projectId,
      position_number: 1, // Wird durch Trigger automatisch gesetzt
      description: description,
      quantity: calculatedQuantity,
      unit_price: calculatedUnitPrice,
      total_amount: parseFloat(totalAmount),
      tax_rate: calculatedTaxRate,
      tax_amount: calculatedTaxAmount,
      category: category || 'Sonstige',
      assignment_type: 'MANUAL',
      confidence: 100, // Manuelle Eingaben haben 100% Konfidenz
      assigned_by: 'manual_user', // TODO: Echte User-ID verwenden
      manual_entry_data: {
        createdBy: 'manual_user', // TODO: Echte User-ID verwenden
        reason: reason || 'Manuelle Eingabe',
        sourceDocuments: sourceDocuments || [],
        notes: notes || null
      },
      verification_status: 'VERIFIED', // Manuelle Eingaben sind per Default verifiziert
      validation_overrides: validationOverrides || {},
      entry_notes: notes
    };

    const { data: position, error: positionError } = await supabase
      .from('invoice_positions')
      .insert(positionData)
      .select()
      .single();

    if (positionError) {
      console.error('❌ Fehler beim Erstellen der manuellen Position:', positionError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen der Position'
      });
    }

    // Aktualisiere Projekt-Budget
    const newConsumedBudget = (project.consumed_budget || 0) + parseFloat(totalAmount);
    
    const { error: budgetError } = await supabase
      .from('projects')
      .update({ consumed_budget: newConsumedBudget })
      .eq('id', projectId);

    if (budgetError) {
      console.error('⚠️ Warnung: Budget konnte nicht aktualisiert werden:', budgetError);
    }

    console.log('✅ Manuelle Position erstellt:', position.id);

    res.json({
      success: true,
      message: 'Manuelle Rechnungsposition erfolgreich erstellt',
      data: {
        position: position,
        budgetImpact: {
          previousBudget: project.consumed_budget || 0,
          addedAmount: parseFloat(totalAmount),
          newBudget: newConsumedBudget,
          remainingBudget: (project.planned_budget || 0) - newConsumedBudget
        }
      }
    });

  } catch (error) {
    console.error('❌ Fehler bei manueller Position-Erstellung:', error);
    res.status(500).json({
      success: false,
      error: `Interner Server-Fehler: ${error.message}`
    });
  }
});

/**
 * GET /api/manual-positions/templates
 * Lädt verfügbare Templates für manuelle Eingaben
 */
router.get('/templates', async (req, res) => {
  try {
    console.log('📋 Lade manuelle Eingabe-Templates');

    // Für MVP: Statische Templates
    const templates = [
      {
        id: 'office-supplies',
        name: 'Büromaterial',
        description: 'Standard-Template für Büromaterial-Einkäufe',
        defaultCategory: 'Büromaterial',
        defaultTaxRate: 20,
        requiredFields: ['description', 'totalAmount'],
        usageCount: 15,
        lastUsed: new Date().toISOString()
      },
      {
        id: 'travel-expenses',
        name: 'Reisekosten',
        description: 'Template für Reisekosten und Spesen',
        defaultCategory: 'Reisekosten',
        defaultTaxRate: 20,
        requiredFields: ['description', 'totalAmount', 'reason'],
        usageCount: 8,
        lastUsed: new Date().toISOString()
      },
      {
        id: 'consulting',
        name: 'Beratungsleistungen',
        description: 'Template für externe Beratungsleistungen',
        defaultCategory: 'Beratung',
        defaultTaxRate: 20,
        requiredFields: ['description', 'quantity', 'unitPrice', 'totalAmount'],
        usageCount: 23,
        lastUsed: new Date().toISOString()
      },
      {
        id: 'software-licenses',
        name: 'Software-Lizenzen',
        description: 'Template für Software-Lizenz-Käufe',
        defaultCategory: 'Software',
        defaultTaxRate: 20,
        requiredFields: ['description', 'totalAmount'],
        usageCount: 12,
        lastUsed: new Date().toISOString()
      }
    ];

    console.log(`✅ ${templates.length} Templates geladen`);

    res.json({
      success: true,
      data: {
        templates: templates,
        totalCount: templates.length
      }
    });

  } catch (error) {
    console.error('❌ Fehler beim Laden der Templates:', error);
    res.status(500).json({
      success: false,
      error: `Fehler beim Laden der Templates: ${error.message}`
    });
  }
});

/**
 * GET /api/manual-positions/validation-rules/:projectId
 * Lädt Validierungsregeln für ein spezifisches Projekt
 */
router.get('/validation-rules/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    console.log('🔍 Lade Validierungsregeln für Projekt:', projectId);

    // Lade Projekt-Daten für Validierung
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, planned_budget, consumed_budget, start_date, end_date')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Projekt nicht gefunden'
      });
    }

    const remainingBudget = (project.planned_budget || 0) - (project.consumed_budget || 0);
    
    const validationRules = {
      budget: {
        maxAmount: remainingBudget,
        warningThreshold: remainingBudget * 0.8, // Warnung bei 80% des verfügbaren Budgets
        allowOverride: true
      },
      dateRange: {
        minDate: project.start_date,
        maxDate: project.end_date,
        allowOverride: true
      },
      amount: {
        minAmount: 0.01,
        maxAmount: 50000, // Warnung bei sehr hohen Beträgen
        warningThreshold: 5000,
        allowOverride: true
      },
      requiredFields: ['description', 'totalAmount'],
      optionalFields: ['quantity', 'unitPrice', 'category', 'reason', 'notes']
    };

    console.log('✅ Validierungsregeln geladen für Projekt:', project.name);

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          plannedBudget: project.planned_budget,
          consumedBudget: project.consumed_budget,
          remainingBudget: remainingBudget
        },
        validationRules: validationRules
      }
    });

  } catch (error) {
    console.error('❌ Fehler beim Laden der Validierungsregeln:', error);
    res.status(500).json({
      success: false,
      error: `Fehler beim Laden der Validierungsregeln: ${error.message}`
    });
  }
});

export default router;
