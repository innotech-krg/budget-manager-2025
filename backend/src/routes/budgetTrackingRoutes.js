// =====================================================
// Budget Manager 2025 - Budget Tracking Routes
// Story 1.3: Dreidimensionales Budget-Tracking
// =====================================================

import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticateUser } from '../middleware/auth.js';
import { rateLimitGeneral as rateLimiter } from '../middleware/rateLimiter.js';
import {
  updateProjectBudget,
  getAllProjectBudgets,
  getProjectBudget,
  addBudgetExpense
} from '../controllers/budgetTrackingController.js';

const router = express.Router();

// =====================================================
// MIDDLEWARE CHAIN
// =====================================================

// Apply rate limiting to all budget tracking routes
router.use(rateLimiter);

// Apply authentication to all budget tracking routes
router.use(authenticateUser);

// =====================================================
// VALIDATION RULES
// =====================================================

const updateBudgetValidation = [
  param('projectId')
    .isUUID()
    .withMessage('Projekt-ID muss eine gültige UUID sein'),
  
  body('veranschlagtes_budget')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Veranschlagtes Budget muss eine positive Zahl sein'),
  
  body('zugewiesenes_budget')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Zugewiesenes Budget muss eine positive Zahl sein'),
  
  body('verbrauchtes_budget')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Verbrauchtes Budget muss eine positive Zahl sein')
];

const getBudgetsValidation = [
  query('status')
    .optional()
    .isIn(['HEALTHY', 'WARNING', 'CRITICAL', 'EXCEEDED'])
    .withMessage('Ungültiger Budget-Status'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit muss zwischen 1 und 100 liegen'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset muss eine positive Zahl sein')
];

const getProjectBudgetValidation = [
  param('projectId')
    .isUUID()
    .withMessage('Projekt-ID muss eine gültige UUID sein')
];

const addExpenseValidation = [
  param('projectId')
    .isUUID()
    .withMessage('Projekt-ID muss eine gültige UUID sein'),
  
  body('amount')
    .isNumeric()
    .isFloat({ min: 0.01 })
    .withMessage('Betrag muss größer als 0 sein'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Beschreibung darf maximal 500 Zeichen lang sein'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Kategorie darf maximal 100 Zeichen lang sein')
];

// =====================================================
// ROUTES - STORY 1.3: DREIDIMENSIONALES BUDGET-TRACKING
// =====================================================

/**
 * @route   GET /api/budget-tracking
 * @desc    Budget-Status für alle Projekte abrufen
 * @access  Private
 */
router.get('/', getBudgetsValidation, validateRequest, getAllProjectBudgets);

/**
 * @route   GET /api/budget-tracking/:projectId
 * @desc    Budget-Status für einzelnes Projekt abrufen
 * @access  Private
 */
router.get('/:projectId', getProjectBudgetValidation, validateRequest, getProjectBudget);

/**
 * @route   PUT /api/budget-tracking/:projectId
 * @desc    Budget-Dimensionen für Projekt aktualisieren
 * @access  Private
 */
router.put('/:projectId', updateBudgetValidation, validateRequest, updateProjectBudget);

/**
 * @route   POST /api/budget-tracking/:projectId/expense
 * @desc    Budget-Ausgabe für Projekt hinzufügen
 * @access  Private
 */
router.post('/:projectId/expense', addExpenseValidation, validateRequest, addBudgetExpense);

// =====================================================
// ERROR HANDLING
// =====================================================

// Catch-all für undefinierte Budget-Tracking-Routen
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Budget-Tracking-Route nicht gefunden',
    message: `Die angeforderte Budget-Tracking-Route ${req.originalUrl} existiert nicht.`,
    code: 'BUDGET_TRACKING_ROUTE_NOT_FOUND',
    availableRoutes: [
      'GET /api/budget-tracking',
      'GET /api/budget-tracking/:projectId',
      'PUT /api/budget-tracking/:projectId',
      'POST /api/budget-tracking/:projectId/expense'
    ]
  });
});

export default router;

