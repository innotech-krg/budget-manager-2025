// =====================================================
// Budget Manager 2025 - Budget Transfer Routes
// Story 1.4: Budget-Transfer-System API Routes
// =====================================================

import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticateUser } from '../middleware/auth.js';
import { rateLimitGeneral as rateLimiter } from '../middleware/rateLimiter.js';
import {
  createTransferRequest,
  getAllTransfers,
  getTransfer,
  reviewTransfer,
  cancelTransfer
} from '../controllers/budgetTransferController.js';

const router = express.Router();

// Middleware für alle Routes
router.use(authenticateUser);
router.use(rateLimiter);

// =====================================================
// TRANSFER REQUEST ROUTES
// =====================================================

/**
 * POST /api/budget-transfers
 * Neuen Budget-Transfer-Antrag erstellen
 * Story 1.4 - Transfer-Antrag
 */
router.post(
  '/',
  [
    body('from_project_id')
      .isUUID()
      .withMessage('Quell-Projekt-ID muss eine gültige UUID sein'),
    
    body('to_project_id')
      .isUUID()
      .withMessage('Ziel-Projekt-ID muss eine gültige UUID sein'),
    
    body('transfer_amount')
      .isFloat({ gt: 0 })
      .withMessage('Transfer-Betrag muss eine positive Zahl sein')
      .custom((value) => {
        // Prüfe auf realistische Beträge (max 10 Millionen)
        if (value > 10000000) {
          throw new Error('Transfer-Betrag ist unrealistisch hoch');
        }
        return true;
      }),
    
    body('reason')
      .isString()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Begründung muss zwischen 10 und 1000 Zeichen lang sein'),
    
    // Zusätzliche Geschäftslogik-Validierung
    body('from_project_id')
      .custom((value, { req }) => {
        if (value === req.body.to_project_id) {
          throw new Error('Quell- und Ziel-Projekt müssen unterschiedlich sein');
        }
        return true;
      })
  ],
  validateRequest,
  createTransferRequest
);

/**
 * GET /api/budget-transfers
 * Alle Transfer-Anträge abrufen (mit Filterung und Pagination)
 * Story 1.4 - Transfer-Historie
 */
router.get(
  '/',
  [
    query('status')
      .optional()
      .isIn(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])
      .withMessage('Status muss PENDING, APPROVED, REJECTED oder CANCELLED sein'),
    
    query('requested_by')
      .optional()
      .isUUID()
      .withMessage('Requested_by muss eine gültige UUID sein'),
    
    query('project_id')
      .optional()
      .isUUID()
      .withMessage('Project_id muss eine gültige UUID sein'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit muss zwischen 1 und 100 liegen'),
    
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset muss eine nicht-negative Zahl sein'),
    
    query('from_date')
      .optional()
      .isISO8601()
      .withMessage('From_date muss ein gültiges Datum sein'),
    
    query('to_date')
      .optional()
      .isISO8601()
      .withMessage('To_date muss ein gültiges Datum sein')
  ],
  validateRequest,
  getAllTransfers
);

/**
 * GET /api/budget-transfers/:transferId
 * Einzelnen Transfer mit Audit-Trail abrufen
 * Story 1.4 - Transfer-Details
 */
router.get(
  '/:transferId',
  [
    param('transferId')
      .isUUID()
      .withMessage('Transfer-ID muss eine gültige UUID sein')
  ],
  validateRequest,
  getTransfer
);

// =====================================================
// TRANSFER WORKFLOW ROUTES
// =====================================================

/**
 * PUT /api/budget-transfers/:transferId/review
 * Transfer genehmigen oder ablehnen
 * Story 1.4 - Genehmigungs-Workflow
 */
router.put(
  '/:transferId/review',
  [
    param('transferId')
      .isUUID()
      .withMessage('Transfer-ID muss eine gültige UUID sein'),
    
    body('action')
      .isIn(['APPROVE', 'REJECT'])
      .withMessage('Aktion muss APPROVE oder REJECT sein'),
    
    body('comment')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Kommentar darf maximal 500 Zeichen lang sein'),
    
    // Bei Ablehnung ist Kommentar erforderlich
    body('comment')
      .if(body('action').equals('REJECT'))
      .notEmpty()
      .withMessage('Bei Ablehnung ist ein Kommentar erforderlich')
  ],
  validateRequest,
  reviewTransfer
);

/**
 * PUT /api/budget-transfers/:transferId/cancel
 * Transfer stornieren (nur durch Antragsteller)
 * Story 1.4 - Transfer-Stornierung
 */
router.put(
  '/:transferId/cancel',
  [
    param('transferId')
      .isUUID()
      .withMessage('Transfer-ID muss eine gültige UUID sein'),
    
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Stornierungsgrund darf maximal 500 Zeichen lang sein')
  ],
  validateRequest,
  cancelTransfer
);

// =====================================================
// UTILITY ROUTES
// =====================================================

/**
 * GET /api/budget-transfers/stats/summary
 * Transfer-Statistiken abrufen
 * Story 1.4 - Dashboard-Statistiken
 */
router.get('/stats/summary', async (req, res) => {
  try {
    // TODO: Implementiere Transfer-Statistiken
    // - Anzahl Transfers pro Status
    // - Gesamtvolumen der Transfers
    // - Durchschnittliche Bearbeitungszeit
    // - Top-Projekte für Transfers
    
    res.json({
      message: 'Transfer-Statistiken noch nicht implementiert',
      code: 'STATS_NOT_IMPLEMENTED'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Fehler beim Abrufen der Statistiken',
      code: 'STATS_ERROR'
    });
  }
});

/**
 * POST /api/budget-transfers/test/email
 * E-Mail-Template testen (nur in Development)
 * Story 1.4 - E-Mail-Testing
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test/email', 
    [
      body('type')
        .isIn(['TRANSFER_REQUESTED', 'TRANSFER_APPROVED', 'TRANSFER_REJECTED'])
        .withMessage('E-Mail-Typ muss TRANSFER_REQUESTED, TRANSFER_APPROVED oder TRANSFER_REJECTED sein'),
      
      body('recipient')
        .isEmail()
        .withMessage('Empfänger muss eine gültige E-Mail-Adresse sein')
    ],
    validateRequest,
    async (req, res) => {
      try {
        const { testEmailTemplate } = await import('../services/emailService.js');
        
        const template = await testEmailTemplate(req.body.type, {
          // Sample-Daten für Test
          from_project: { name: 'Test Projekt A', projektnummer: 'TEST-001' },
          to_project: { name: 'Test Projekt B', projektnummer: 'TEST-002' },
          transfer_amount: 25000,
          reason: 'Test-Transfer für E-Mail-Template-Validierung'
        });
        
        res.json({
          message: 'E-Mail-Template erfolgreich getestet',
          template: {
            subject: template.subject,
            preview: template.text.substring(0, 200) + '...'
          },
          code: 'EMAIL_TEMPLATE_TESTED'
        });
      } catch (error) {
        res.status(500).json({
          error: 'Fehler beim Testen des E-Mail-Templates',
          message: error.message,
          code: 'EMAIL_TEMPLATE_TEST_FAILED'
        });
      }
    }
  );
}

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 Handler für nicht existierende Transfer-Routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Budget-Transfer-Endpoint nicht gefunden',
    message: `Die Route ${req.method} ${req.originalUrl} existiert nicht.`,
    code: 'TRANSFER_ROUTE_NOT_FOUND',
    availableRoutes: [
      'POST /api/budget-transfers',
      'GET /api/budget-transfers',
      'GET /api/budget-transfers/:transferId',
      'PUT /api/budget-transfers/:transferId/review',
      'PUT /api/budget-transfers/:transferId/cancel'
    ]
  });
});

export default router;

