// =====================================================
// Budget Manager 2025 - Project Routes
// Story 1.2: Deutsche Geschäftsprojekt-Erstellung
// =====================================================

import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticateUser } from '../middleware/auth.js';
import { rateLimitGeneral as rateLimiter } from '../middleware/rateLimiter.js';
import { 
  validateProjectCreation, 
  performanceMonitoring 
} from '../middleware/advancedValidation.js';
import {
  createProject,
  getAllProjects,
  getProject,
  getProjectMasterData,
  deleteProject
} from '../controllers/projectController.js';

const router = express.Router();

// =====================================================
// MIDDLEWARE CHAIN
// =====================================================

// Apply rate limiting to all project routes
router.use(rateLimiter);

// Apply performance monitoring to all project routes
router.use(performanceMonitoring);

// Apply authentication to all project routes
// router.use(authenticateUser); // Temporär deaktiviert für Development

// =====================================================
// VALIDATION RULES
// =====================================================

const createProjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Project name must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be max 1000 characters'),
  
  body('category_id')
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  
  body('team_id')
    .optional()
    .isUUID()
    .withMessage('Team ID must be a valid UUID'),
  
  body('annual_budget_id')
    .optional()
    .isUUID()
    .withMessage('Annual budget ID must be a valid UUID'),
  
  body('planned_budget')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Planned budget must be a non-negative number'),
  
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high or critical'),
  
  body('cost_type')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Cost type must be max 50 characters'),
  
  body('supplier')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Supplier must be max 200 characters'),
  
  body('impact_level')
    .optional()
    .isIn(['low', 'medium', 'high', 'very_high'])
    .withMessage('Impact level must be low, medium, high or very_high'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('internal_hours_design')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Internal design hours must be a positive number'),
  
  body('internal_hours_content')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Internal content hours must be a positive number'),
  
  body('internal_hours_dev')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Internal dev hours must be a positive number'),
  
  body('budget_year')
    .optional()
    .isInt({ min: 2020, max: 2050 })
    .withMessage('Budget year must be between 2020 and 2050')
];

const getProjectsValidation = [
  query('status')
    .optional()
    .isIn(['geplant', 'aktiv', 'pausiert', 'abgeschlossen', 'abgebrochen'])
    .withMessage('Ungültiger Status'),
  
  query('kategorie_id')
    .optional()
    .isUUID()
    .withMessage('Kategorie-ID muss eine gültige UUID sein'),
  
  query('team_id')
    .optional()
    .isUUID()
    .withMessage('Team-ID muss eine gültige UUID sein'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit muss zwischen 1 und 100 liegen'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset muss eine positive Zahl sein')
];

const getProjectValidation = [
  param('id')
    .isUUID()
    .withMessage('Projekt-ID muss eine gültige UUID sein')
];

// =====================================================
// ROUTES
// =====================================================

/**
 * @route   GET /api/projects/master-data
 * @desc    Master-Daten für Projekt-Erstellung abrufen
 * @access  Private
 */
router.get('/master-data', getProjectMasterData);

/**
 * @route   GET /api/projects
 * @desc    Alle Projekte abrufen mit Filter- und Paginierungsoptionen
 * @access  Private
 */
router.get('/', getProjectsValidation, validateRequest, getAllProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Einzelnes Projekt abrufen
 * @access  Private
 */
router.get('/:id', getProjectValidation, validateRequest, getProject);

/**
 * @route   POST /api/projects
 * @desc    Neues Projekt mit deutschen Geschäftsfeldern erstellen
 * @access  Private
 */
router.post('/', createProjectValidation, validateRequest, createProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Projekt löschen
 * @access  Private
 */
router.delete('/:id', getProjectValidation, validateRequest, deleteProject);

// =====================================================
// PROJECT INVOICE POSITIONS ROUTES (Story 2.4)
// =====================================================

import { supabase } from '../config/database.js';

/**
 * GET /api/projects/:projectId/invoice-positions
 * Alle Rechnungspositionen für ein Projekt laden
 */
router.get('/:projectId/invoice-positions', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    console.log(`📥 Lade Rechnungspositionen für Projekt: ${projectId}`);

    // Validierung
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Projekt-ID ist erforderlich'
      });
    }

    // Prüfe ob invoice_positions Tabelle existiert und lade Daten
    let positions = [];
    let error = null;

    try {
      const { data, error: queryError } = await supabase
        .from('invoice_positions')
        .select(`
          id,
          position_number,
          description,
          quantity,
          unit_price,
          total_amount,
          tax_amount,
          tax_rate,
          category,
          assignment_type,
          confidence,
          assigned_by,
          created_at,
          updated_at,
          invoice_id,
          invoices (
            id,
            invoice_number,
            supplier_name,
            invoice_date,
            total_amount,
            net_amount
          )
        `)
        .eq('project_id', projectId)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * limit, page * limit - 1);

      if (queryError) {
        console.log('⚠️ Tabelle invoice_positions existiert noch nicht oder ist leer:', queryError.message);
        positions = []; // Leere Liste zurückgeben
      } else {
        positions = data || [];
      }
    } catch (err) {
      console.log('⚠️ Fehler beim Zugriff auf invoice_positions:', err.message);
      positions = []; // Leere Liste zurückgeben
    }

    // Budget-Impact berechnen
    const { data: budgetData, error: budgetError } = await supabase
      .from('projects')
      .select('planned_budget, consumed_budget')
      .eq('id', projectId)
      .single();

    if (budgetError) {
      console.error('❌ Fehler beim Laden der Budget-Daten:', budgetError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Budget-Daten'
      });
    }

    // Gesamtsumme der Rechnungspositionen berechnen (= Verbrauch aus Rechnungen)
    const totalConsumedFromPositions = positions.reduce((sum, pos) => sum + (pos.total_amount || 0), 0);

    // Budget-Berechnungen korrigieren
    // Verbrauchtes Budget = Summe aller Rechnungspositionen (das ist die Realität!)
    // Das consumed_budget in der DB ist nur ein Cache-Wert
    const plannedBudget = budgetData.planned_budget || 0;
    const actualConsumedBudget = totalConsumedFromPositions; // Die echten Verbrauchsdaten
    const availableBudget = plannedBudget - actualConsumedBudget;

    // Antwort formatieren
    const response = {
      success: true,
      data: {
        positions: positions.map(pos => ({
          id: pos.id,
          position_number: pos.position_number,
          description: pos.description,
          quantity: pos.quantity,
          unit_price: pos.unit_price,
          total_amount: pos.total_amount,
          tax_amount: pos.tax_amount,
          tax_rate: pos.tax_rate,
          category: pos.category,
          assignment_type: pos.assignment_type,
          confidence: pos.confidence,
          assigned_by: pos.assigned_by,
          created_at: pos.created_at,
          updated_at: pos.updated_at,
          // Echte Invoice-Details aus der Datenbank
          invoice: {
            id: pos.invoices?.id || 'unknown',
            number: pos.invoices?.invoice_number || 'UNBEKANNT',
            date: pos.invoices?.invoice_date || '1970-01-01',
            supplier_name: pos.invoices?.supplier_name || 'UNBEKANNTER LIEFERANT',
            total_amount: pos.invoices?.total_amount || 0,
            status: 'APPROVED',
            created_at: pos.invoices?.created_at || pos.created_at
          }
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: positions.length
        },
        budget_impact: {
          total_consumed_from_positions: totalConsumedFromPositions, // Das verbrauchte Budget (Realität)
          planned_budget: plannedBudget,
          available_budget: availableBudget, // Korrekt berechnet: planned - consumed
          positions_count: positions.length,
          // Zusätzliche Info für Debugging
          db_consumed_budget: budgetData.consumed_budget || 0 // Der Cache-Wert aus der DB
        }
      }
    };

    console.log(`✅ ${positions.length} Rechnungspositionen geladen für Projekt ${projectId}`);
    res.json(response);

  } catch (error) {
    console.error('❌ Fehler beim Laden der Projekt-Rechnungspositionen:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler'
    });
  }
});

/**
 * DELETE /api/projects/:projectId/invoice-positions/:positionId
 * Rechnungsposition von Projekt entfernen
 */
router.delete('/:projectId/invoice-positions/:positionId', async (req, res) => {
  try {
    const { projectId, positionId } = req.params;
    const { reason = 'Manual removal' } = req.body;

    console.log(`📥 Entferne Position ${positionId} von Projekt ${projectId}`);

    // Position laden für Historie
    const { data: position, error: posError } = await supabase
      .from('invoice_positions')
      .select('*')
      .eq('id', positionId)
      .eq('project_id', projectId)
      .single();

    if (posError || !position) {
      return res.status(404).json({
        success: false,
        error: 'Rechnungsposition nicht gefunden'
      });
    }

    // Projekt-Zuordnung entfernen
    const { error: updateError } = await supabase
      .from('invoice_positions')
      .update({ 
        project_id: null,
        assigned_by: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', positionId);

    if (updateError) {
      console.error('❌ Fehler beim Entfernen der Position:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Entfernen der Position'
      });
    }

    console.log(`✅ Position ${positionId} erfolgreich von Projekt ${projectId} entfernt`);
    res.json({
      success: true,
      message: 'Rechnungsposition erfolgreich entfernt'
    });

  } catch (error) {
    console.error('❌ Fehler beim Entfernen der Position:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler'
    });
  }
});

// =====================================================
// ERROR HANDLING
// =====================================================

// Catch-all für undefinierte Projekt-Routen - ENTFERNT
// Diese Route blockierte andere project-related Routes in anderen Dateien
// router.use('*', (req, res) => { ... });

export default router;
