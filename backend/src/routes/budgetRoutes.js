// =====================================================
// Budget Manager 2025 - Budget Routes
// Story 1.1: Jahresbudget-Verwaltung API-Endpunkte
// =====================================================

import express from 'express';
import * as budgetController from '../controllers/budgetController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireBudgetRead, requireBudgetWrite, requireBudgetDelete } from '../middleware/permissionMiddleware.js';
import { rateLimitBudget } from '../middleware/rateLimiter.js';

const router = express.Router();

// =====================================================
// BUDGET VALIDATION SCHEMAS
// =====================================================

const budgetCreationSchema = {
  jahr: {
    isInt: {
      options: { min: 2020, max: 2035 },
      errorMessage: 'Jahr muss zwischen 2020 und 2035 liegen'
    }
  },
  gesamtbudget: {
    isFloat: {
      options: { min: 0.01 },
      errorMessage: 'Gesamtbudget muss größer als 0 sein'
    }
  },
  reserve_allokation: {
    optional: true,
    isFloat: {
      options: { min: 0, max: 50 },
      errorMessage: 'Reserve-Allokation muss zwischen 0% und 50% liegen'
    }
  },
  beschreibung: {
    optional: true,
    isLength: {
      options: { max: 1000 },
      errorMessage: 'Beschreibung darf maximal 1000 Zeichen lang sein'
    }
  }
};

const budgetUpdateSchema = {
  gesamtbudget: {
    optional: true,
    isFloat: {
      options: { min: 0.01 },
      errorMessage: 'Gesamtbudget muss größer als 0 sein'
    }
  },
  reserve_allokation: {
    optional: true,
    isFloat: {
      options: { min: 0, max: 50 },
      errorMessage: 'Reserve-Allokation muss zwischen 0% und 50% liegen'
    }
  },
  beschreibung: {
    optional: true,
    isLength: {
      options: { max: 1000 },
      errorMessage: 'Beschreibung darf maximal 1000 Zeichen lang sein'
    }
  }
};

const statusUpdateSchema = {
  status: {
    isIn: {
      options: [['DRAFT', 'ACTIVE', 'CLOSED']],
      errorMessage: 'Status muss DRAFT, ACTIVE oder CLOSED sein'
    }
  }
};

// =====================================================
// BUDGET ROUTES
// =====================================================

/**
 * @route   GET /api/budgets/health
 * @desc    Budget-Service Health Check
 * @access  Public
 * @story   Story 1.1 - System Health Monitoring
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Budget API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: [
      'Jahresbudget-Verwaltung',
      'Deutsche Geschäftslogik',
      'Währungsformatierung',
      'Validierung'
    ]
  });
});

/**
 * @route   GET /api/budgets/available-years
 * @desc    Hole verfügbare Jahre für Budget-Erstellung
 * @access  Private
 */
router.get('/available-years',
  requireAuth,
  requireBudgetRead,
  budgetController.getAvailableYears
);

/**
 * @route   POST /api/budgets
 * @desc    Erstelle neues Jahresbudget
 * @access  Private
 * @story   Story 1.1 - Funktionale Kriterien 1
 */
router.post('/',
  rateLimitBudget,
  requireAuth,
  requireBudgetWrite,
  // TODO: Implement proper validation schema
  budgetController.createAnnualBudget
);

/**
 * @route   GET /api/budgets
 * @desc    Alle Jahresbudgets abrufen (mit Pagination und Filtern)
 * @access  Private
 * @story   Story 1.1 - Funktionale Kriterien 6
 * @query   ?status=ACTIVE&jahr=2025&limit=10&offset=0
 */
router.get('/',
  requireAuth,
  requireBudgetRead,
  budgetController.getAllAnnualBudgets
);

// GET /api/budgets/years - Verfügbare Jahresbudgets (MUSS vor /:id stehen!)
router.get('/years', async (req, res) => {
  try {
    console.log('[Budget] 📥 GET /api/budgets/years')
    
    const currentYear = new Date().getFullYear()
    const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2]
    
    const { supabaseAdmin } = await import('../config/database.js')
    const { data, error } = await supabaseAdmin
      .from('annual_budgets')
      .select('year, total_budget, available_budget, status')
      .in('year', years)
      .order('year')

    if (error) {
      console.error('[Budget] ❌ Fehler beim Laden der Jahresbudgets:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Jahresbudgets',
        details: error.message
      })
    }

    // Erstelle vollständige Jahr-Liste mit Status
    const yearBudgets = years.map(jahr => {
      const budget = data.find(b => b.year === jahr)
      return {
        jahr,
        hasbudget: !!budget,
        gesamtbudget: budget?.total_budget || 0,
        verfuegbares_budget: budget?.available_budget || 0,
        status: budget?.status || 'NONE',
        isActive: budget?.status === 'ACTIVE'
      }
    })

    console.log(`[Budget] ✅ Jahresbudgets geladen:`, yearBudgets)
    res.json(yearBudgets)

  } catch (error) {
    console.error('[Budget] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Laden der Jahresbudgets',
      details: error.message
    })
  }
})

/**
 * @route   GET /api/budgets/:id
 * @desc    Einzelnes Jahresbudget abrufen
 * @access  Private
 * @param   {string} id - Budget-ID (UUID)
 */
router.get('/:id',
  requireAuth,
  requireBudgetRead,
  budgetController.getAnnualBudgetById
);

/**
 * @route   PUT /api/budgets/:id
 * @desc    Jahresbudget bearbeiten (nur DRAFT-Status)
 * @access  Private
 * @story   Story 1.1 - Funktionale Kriterien 4
 * @param   {string} id - Budget-ID (UUID)
 */
router.put('/:id',
  rateLimitBudget,
  requireAuth,
  requireBudgetWrite,
  // TODO: Implement proper validation schema
  budgetController.updateAnnualBudget
);

/**
 * @route   PATCH /api/budgets/:id/status
 * @desc    Budget-Status ändern (DRAFT → ACTIVE → CLOSED)
 * @access  Private
 * @story   Story 1.1 - Funktionale Kriterien 5
 * @param   {string} id - Budget-ID (UUID)
 */
router.patch('/:id/status',
  rateLimitBudget,
  requireAuth,
  requireBudgetWrite,
  // TODO: Implement proper validation schema
  budgetController.updateBudgetStatus
);

/**
 * @route   GET /api/budgets/overview/:jahr
 * @desc    Budget-Übersicht mit aktueller Allokation/Verbrauch
 * @access  Private
 * @story   Story 1.1 - Funktionale Kriterien 6
 * @param   {number} jahr - Geschäftsjahr
 */
router.get('/overview/:jahr',
  requireAuth,
  requireBudgetRead,
  budgetController.getBudgetOverview
);

// =====================================================
// ADVANCED BUDGET ROUTES (für spätere Stories)
// =====================================================

/**
 * @route   GET /api/budgets/:id/projects
 * @desc    Alle Projekte für ein Budget abrufen
 * @access  Private
 * @story   Story 1.2 - Deutsche Geschäftsprojekt-Erstellung
 * @param   {string} id - Budget-ID (UUID)
 */
router.get('/:id/projects',
  requireAuth,
  requireBudgetRead,
  async (req, res) => {
    // Placeholder für Story 1.2 Implementation
    res.json({
      message: 'Projekt-Liste für Budget wird in Story 1.2 implementiert',
      budgetId: req.params.id,
      implementationStatus: 'PLANNED'
    });
  }
);

/**
 * @route   GET /api/budgets/:id/transfers
 * @desc    Budget-Transfer-Historie abrufen
 * @access  Private
 * @story   Story 1.4 - Budget-Transfer-System
 * @param   {string} id - Budget-ID (UUID)
 */
router.get('/:id/transfers',
  requireAuth,
  requireBudgetRead,
  async (req, res) => {
    // Placeholder für Story 1.4 Implementation
    res.json({
      message: 'Budget-Transfer-Historie wird in Story 1.4 implementiert',
      budgetId: req.params.id,
      implementationStatus: 'PLANNED'
    });
  }
);

/**
 * @route   GET /api/budgets/:id/analytics
 * @desc    Budget-Analytics und Trends
 * @access  Private
 * @story   Story 1.5 - Echtzeit-Budget-Dashboard
 * @param   {string} id - Budget-ID (UUID)
 */
router.get('/:id/analytics',
  requireAuth,
  requireBudgetRead,
  async (req, res) => {
    // Placeholder für Story 1.5 Implementation
    res.json({
      message: 'Budget-Analytics werden in Story 1.5 implementiert',
      budgetId: req.params.id,
      implementationStatus: 'PLANNED'
    });
  }
);

// =====================================================
// ERWEITERTE BUDGET-ROUTEN (Story 1.2.3)
// =====================================================



// GET /api/budgets/available/:jahr - Verfügbares Budget (erweitert)
router.get('/available/:jahr', async (req, res) => {
  try {
    const { jahr } = req.params
    console.log(`[Budget] 📥 GET /api/budgets/available/${jahr}`)
    
    // Erweiterte Budget-Verfügbarkeit mit internen Kosten
    const { supabase } = await import('../config/database.js')
    const { data, error } = await supabase
      .from('budget_availability_extended')
      .select('*')
      .eq('jahr', parseInt(jahr))
      .single()

    if (error) {
      console.error('[Budget] ❌ Fehler beim Laden der Budget-Verfügbarkeit:', error)
      
      // Fallback: Basis-Budget ohne interne Kosten
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('annual_budgets')
        .select('*')
        .eq('jahr', parseInt(jahr))
        .eq('status', 'ACTIVE')
        .single()

      if (fallbackError) {
        return res.status(404).json({
          success: false,
          error: `Kein aktives Budget für Jahr ${jahr} gefunden`,
          details: fallbackError.message
        })
      }

      // Einfache Budget-Info zurückgeben
      const budgetInfo = {
        jahr: fallbackData.jahr,
        jahresbudget: fallbackData.gesamtbudget,
        verfuegbares_budget: fallbackData.verfuegbares_budget,
        externes_budget_zugeordnet: 0,
        internes_budget_zugeordnet: 0,
        gesamt_zugeordnet: 0,
        zugeordnet_prozent: 0,
        verfuegbar_prozent: 100
      }

      console.log(`[Budget] ⚠️ Fallback Budget-Info für ${jahr}:`, budgetInfo)
      return res.json(budgetInfo)
    }

    console.log(`[Budget] ✅ Budget-Verfügbarkeit für ${jahr}:`, data)
    res.json(data)

  } catch (error) {
    console.error('[Budget] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Laden der Budget-Verfügbarkeit',
      details: error.message
    })
  }
})

// POST /api/budgets/validate - Budget-Validierung
router.post('/validate', async (req, res) => {
  try {
    console.log('[Budget] 📥 POST /api/budgets/validate')
    
    const {
      externe_kosten,
      interne_kosten,
      budget_jahr
    } = req.body

    // Validierung der Eingabedaten
    if (!budget_jahr || externe_kosten === undefined || interne_kosten === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Budget-Jahr, externe und interne Kosten sind erforderlich'
      })
    }

    const externeKosten = parseFloat(externe_kosten) || 0
    const interneKosten = parseFloat(interne_kosten) || 0
    const gesamtKosten = externeKosten + interneKosten

    // Budget-Verfügbarkeit prüfen
    const { supabase } = await import('../config/database.js')
    const { data: budgetData, error } = await supabase
      .from('budget_availability_extended')
      .select('*')
      .eq('jahr', parseInt(budget_jahr))
      .single()

    if (error) {
      console.error('[Budget] ❌ Fehler beim Laden der Budget-Verfügbarkeit:', error)
      return res.status(404).json({
        success: false,
        error: `Kein aktives Budget für Jahr ${budget_jahr} gefunden`
      })
    }

    const isValid = gesamtKosten <= budgetData.verfuegbares_budget
    const validationResult = {
      isValid,
      externe_kosten: externeKosten,
      interne_kosten: interneKosten,
      gesamt_kosten: gesamtKosten,
      verfuegbares_budget: budgetData.verfuegbares_budget,
      budget_nach_zuordnung: budgetData.verfuegbares_budget - gesamtKosten,
      warnung: gesamtKosten > budgetData.verfuegbares_budget ? 
        `Projekt-Gesamtkosten (${gesamtKosten.toLocaleString('de-DE')} €) überschreiten verfügbares Budget (${budgetData.verfuegbares_budget.toLocaleString('de-DE')} €)` : 
        null
    }

    console.log('[Budget] ✅ Budget-Validierung:', validationResult)
    res.json(validationResult)

  } catch (error) {
    console.error('[Budget] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler bei Budget-Validierung',
      details: error.message
    })
  }
})

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 für unbekannte Budget-Routen
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Budget-Endpunkt nicht gefunden',
    message: `Die Route ${req.originalUrl} existiert nicht.`,
    code: 'BUDGET_ENDPOINT_NOT_FOUND',
    availableEndpoints: [
      'GET /api/budgets/health',
      'POST /api/budgets',
      'GET /api/budgets',
      'GET /api/budgets/:id',
      'PUT /api/budgets/:id',
      'PATCH /api/budgets/:id/status',
      'GET /api/budgets/overview/:jahr',
      'GET /api/budgets/available/:jahr',
      'POST /api/budgets/validate'
    ]
  });
});

export default router;