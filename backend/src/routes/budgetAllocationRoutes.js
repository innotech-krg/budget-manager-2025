// =====================================================
// Budget Manager 2025 - Budget Allocation Routes
// Story 1.2.3: Intelligente Budget-Zuordnung
// =====================================================

import express from 'express';
import { budgetAllocationService } from '../services/budgetAllocationService.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// =====================================================
// VALIDATION RULES
// =====================================================

const validateYear = [
  param('jahr')
    .isInt({ min: 2020, max: 2050 })
    .withMessage('Jahr muss zwischen 2020 und 2050 liegen')
];

// NEW: English field name validation
const validateYearEnglish = [
  param('year')
    .isInt({ min: 2020, max: 2050 })
    .withMessage('Year must be between 2020 and 2050')
];

const validateBudgetAllocation = [
  body('geplantes_budget')
    .isFloat({ min: 0.01 })
    .withMessage('Geplantes Budget muss größer als 0 sein'),
  body('jahr')
    .isInt({ min: 2020, max: 2050 })
    .withMessage('Jahr muss zwischen 2020 und 2050 liegen'),
  body('projekt_id')
    .optional()
    .isUUID()
    .withMessage('Projekt-ID muss eine gültige UUID sein')
];

// =====================================================
// BUDGET ALLOCATION ROUTES
// =====================================================

/**
 * GET /api/budget-allocation/available/:jahr
 * Verfügbares Budget für ein Jahr abrufen
 * Story 1.2.3 - AC-1: Verfügbares Budget anzeigen
 */
router.get('/available/:jahr', 
  validateYear,
  validateRequest,
  async (req, res) => {
    console.log('🚀 Budget-Allocation API aufgerufen für Jahr:', req.params.jahr);
    
    try {
      const { jahr } = req.params;
      console.log('📅 Verarbeite Jahr:', jahr, 'Typ:', typeof jahr);
      
      // Echte Supabase-Daten abrufen
      const availableBudget = await budgetAllocationService.getAvailableBudget(parseInt(jahr));
      
      console.log('✅ Budget erfolgreich abgerufen:', availableBudget);
      
      // Deutsche Formatierung für Frontend
      const formattedBudget = {
        ...availableBudget,
        gesamtbudget_formatted: new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR'
        }).format(availableBudget.gesamtbudget),
        zugewiesenes_budget_formatted: new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR'
        }).format(availableBudget.zugewiesenes_budget),
        verfuegbares_budget_formatted: new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR'
        }).format(availableBudget.verfuegbares_budget),
        verfuegbar_ohne_reserve_formatted: new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR'
        }).format(availableBudget.verfuegbar_ohne_reserve),
        reserve_budget_formatted: new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR'
        }).format(availableBudget.reserve_budget)
      };
      
      console.log('📤 Sende Antwort zurück');
      res.json({
        success: true,
        availableBudget: formattedBudget,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Fehler beim Abrufen des verfügbaren Budgets:', error);
      
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Fehler beim Abrufen des verfügbaren Budgets',
        code: 'BUDGET_FETCH_ERROR',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/budget-allocation/validate
 * Budget-Zuordnung validieren
 * Story 1.2.3 - AC-2: Budget-Zuordnung mit Validierung
 */
router.post('/validate',
  validateBudgetAllocation,
  validateRequest,
  async (req, res) => {
    try {
      const { jahr, geplantes_budget, projekt_id } = req.body;
      
      const validation = await budgetAllocationService.validateBudgetAllocation(
        parseInt(jahr),
        parseFloat(geplantes_budget),
        projekt_id || null
      );
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          isValid: false,
          error: validation.error,
          message: validation.message,
          maxAllowedBudget: validation.maxAllowedBudget,
          maxAllowedBudget_formatted: validation.maxAllowedBudget 
            ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(validation.maxAllowedBudget)
            : null,
          availableBudget: validation.availableBudget
        });
      }
      
      // Erfolgreiche Validierung
      res.json({
        success: true,
        isValid: true,
        availableBudget: validation.availableBudget,
        newUtilization: validation.newUtilization,
        warning: validation.warning,
        message: 'Budget-Zuordnung ist gültig'
      });
      
    } catch (error) {
      console.error('❌ Fehler bei Budget-Validierung:', error);
      res.status(500).json({
        success: false,
        isValid: false,
        error: 'VALIDATION_ERROR',
        message: 'Fehler bei der Budget-Validierung',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/budget-allocation/reserve
 * Budget für Projekt reservieren
 * Story 1.2.3 - AC-3: Budget-Reservierung bei Projekt-Erstellung
 */
router.post('/reserve',
  [
    body('projekt_id')
      .isUUID()
      .withMessage('Projekt-ID muss eine gültige UUID sein'),
    body('geplantes_budget')
      .isFloat({ min: 0.01 })
      .withMessage('Geplantes Budget muss größer als 0 sein')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { projekt_id, geplantes_budget } = req.body;
      
      const result = await budgetAllocationService.reserveBudget(
        projekt_id,
        parseFloat(geplantes_budget)
      );
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: result.message,
          details: result.details
        });
      }
      
      res.json({
        success: true,
        message: result.message,
        project: result.project,
        availableBudget: result.availableBudget
      });
      
    } catch (error) {
      console.error('❌ Fehler bei Budget-Reservierung:', error);
      res.status(500).json({
        success: false,
        error: 'RESERVATION_ERROR',
        message: 'Fehler bei der Budget-Reservierung',
        details: error.message
      });
    }
  }
);

/**
 * POST /api/budget-allocation/release
 * Budget freigeben (bei Projekt-Stornierung)
 * Story 1.2.3 - AC-4: Automatische Budget-Freigabe
 */
router.post('/release',
  [
    body('projekt_id')
      .isUUID()
      .withMessage('Projekt-ID muss eine gültige UUID sein')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { projekt_id } = req.body;
      
      const result = await budgetAllocationService.releaseBudget(projekt_id);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }
      
      res.json({
        success: true,
        message: result.message,
        releasedBudget: result.releasedBudget,
        releasedBudget_formatted: new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR'
        }).format(result.releasedBudget),
        availableBudget: result.availableBudget
      });
      
    } catch (error) {
      console.error('❌ Fehler bei Budget-Freigabe:', error);
      res.status(500).json({
        success: false,
        error: 'RELEASE_ERROR',
        message: 'Fehler bei der Budget-Freigabe',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/budget-allocation/statistics/:jahr
 * Budget-Statistiken für Dashboard
 * Story 1.2.3 - AC-5: Real-time Budget-Übersicht
 */
router.get('/statistics/:jahr',
  validateYear,
  validateRequest,
  async (req, res) => {
    try {
      const { jahr } = req.params;
      
      const statistics = await budgetAllocationService.getBudgetStatistics(parseInt(jahr));
      
      res.json({
        success: true,
        statistics,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Fehler beim Abrufen der Budget-Statistiken:', error);
      res.status(500).json({
        success: false,
        error: 'STATISTICS_ERROR',
        message: 'Fehler beim Abrufen der Budget-Statistiken',
        details: error.message
      });
    }
  }
);

/**
 * GET /api/budget-allocation/health
 * Health Check für Budget-Allocation-Service
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'budget-allocation',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// =====================================================
// NEW ENGLISH API ENDPOINTS (Story 1.6)
// =====================================================

/**
 * @route GET /api/budget-allocation/available/:year
 * @desc Get available budget for a specific year (English API)
 * @access Public
 */
router.get('/available/:year', validateYearEnglish, validateRequest, async (req, res) => {
  try {
    console.log(`[Budget] 📥 GET /api/budget-allocation/available/${req.params.year}`);
    
    const year = parseInt(req.params.year);
    const result = await budgetAllocationService.getAvailableBudget(year);
    
    // Transform German field names to English
    const englishResult = {
      year: result.jahr,
      total_budget: result.gesamtbudget,
      annual_budget_available: result.jahresbudget_verfuegbar,
      external_budget_allocated: result.externes_budget_zugeordnet,
      internal_budget_allocated: result.internes_budget_zugeordnet,
      total_allocated: result.gesamt_zugeordnet,
      available_budget: result.verfuegbares_budget,
      allocated_percent: result.zugeordnet_prozent,
      available_percent: result.verfuegbar_prozent
    };
    
    console.log(`[Budget] ✅ Budget availability for ${year}:`, englishResult);
    res.json(englishResult);
    
  } catch (error) {
    console.error('[Budget] ❌ Error getting available budget:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting available budget',
      details: error.message
    });
  }
});

/**
 * @route GET /api/budget-allocation/years
 * @desc Get all years with budgets (English API)
 * @access Public
 */
router.get('/years', validateRequest, async (req, res) => {
  try {
    console.log('[Budget] 📥 GET /api/budget-allocation/years');
    
    const result = await budgetAllocationService.getAvailableYears();
    
    // Transform German field names to English
    const englishResult = result.map(item => ({
      year: item.jahr,
      has_budget: item.hasbudget,
      total_budget: item.gesamtbudget,
      available_budget: item.verfuegbares_budget,
      status: item.status,
      is_active: item.isActive
    }));
    
    console.log(`[Budget] ✅ Available years loaded:`, englishResult);
    res.json(englishResult);
    
  } catch (error) {
    console.error('[Budget] ❌ Error getting available years:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting available years',
      details: error.message
    });
  }
});

export default router;

