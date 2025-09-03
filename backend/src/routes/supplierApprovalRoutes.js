// =====================================================
// Supplier Approval Routes - API für manuelle Lieferanten-Genehmigung
// =====================================================

import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  getPendingSuppliers,
  getPendingSupplier,
  approvePendingSupplier,
  rejectPendingSupplier,
  updatePendingSupplier,
  getApprovalStats
} from '../controllers/supplierApprovalController.js';

const router = express.Router();

// =====================================================
// VALIDATION RULES
// =====================================================

const pendingSupplierIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Pending Supplier ID ist erforderlich')
    .isLength({ min: 5 })
    .withMessage('Ungültige Pending Supplier ID')
];

const approvalValidation = [
  ...pendingSupplierIdValidation,
  body('name')
    .notEmpty()
    .withMessage('Lieferantenname ist erforderlich')
    .isLength({ min: 2, max: 255 })
    .withMessage('Lieferantenname muss zwischen 2 und 255 Zeichen lang sein'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Adresse darf maximal 500 Zeichen lang sein'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Ungültige E-Mail-Adresse'),
  body('phone')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]+$/)
    .withMessage('Ungültige Telefonnummer'),
  body('taxNumber')
    .optional()
    .matches(/^\d{2,3}\/\d{3,4}\/\d{4,5}$/)
    .withMessage('Ungültige deutsche Steuernummer (Format: 123/456/7890)'),
  body('vatId')
    .optional()
    .matches(/^DE\d{9}$/)
    .withMessage('Ungültige deutsche USt-IdNr (Format: DE123456789)'),
  body('iban')
    .optional()
    .matches(/^DE\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}$/)
    .withMessage('Ungültige deutsche IBAN'),
  body('updateExisting')
    .optional()
    .isBoolean()
    .withMessage('updateExisting muss ein Boolean sein')
];

const rejectionValidation = [
  ...pendingSupplierIdValidation,
  body('reason')
    .optional()
    .isLength({ min: 5, max: 500 })
    .withMessage('Ablehnungsgrund muss zwischen 5 und 500 Zeichen lang sein')
];

const updateValidation = [
  ...pendingSupplierIdValidation,
  body('name')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Lieferantenname muss zwischen 2 und 255 Zeichen lang sein'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Adresse darf maximal 500 Zeichen lang sein'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Ungültige E-Mail-Adresse')
];

const statsQueryValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Tage müssen zwischen 1 und 365 liegen')
];

const listQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit muss zwischen 1 und 100 liegen'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset muss >= 0 sein'),
  query('status')
    .optional()
    .isIn(['PENDING_APPROVAL', 'APPROVED', 'REJECTED'])
    .withMessage('Status muss PENDING_APPROVAL, APPROVED oder REJECTED sein')
];

// =====================================================
// ROUTES
// =====================================================

/**
 * @route   GET /api/supplier-approval
 * @desc    Liste aller ausstehenden Lieferanten-Genehmigungen
 * @access  Private
 */
router.get('/', listQueryValidation, validateRequest, getPendingSuppliers);

/**
 * @route   GET /api/supplier-approval/stats
 * @desc    Statistiken zu Lieferanten-Genehmigungen
 * @access  Private
 */
router.get('/stats', statsQueryValidation, validateRequest, getApprovalStats);

/**
 * @route   GET /api/supplier-approval/:id
 * @desc    Einzelnen ausstehenden Lieferanten abrufen
 * @access  Private
 */
router.get('/:id', pendingSupplierIdValidation, validateRequest, getPendingSupplier);

/**
 * @route   POST /api/supplier-approval/:id/approve
 * @desc    Lieferanten genehmigen (mit User-Edits)
 * @access  Private
 */
router.post('/:id/approve', approvalValidation, validateRequest, approvePendingSupplier);

/**
 * @route   POST /api/supplier-approval/:id/reject
 * @desc    Lieferanten ablehnen
 * @access  Private
 */
router.post('/:id/reject', rejectionValidation, validateRequest, rejectPendingSupplier);

/**
 * @route   PUT /api/supplier-approval/:id
 * @desc    Ausstehenden Lieferanten bearbeiten (Draft Save)
 * @access  Private
 */
router.put('/:id', updateValidation, validateRequest, updatePendingSupplier);

// =====================================================
// API INFO ROUTE
// =====================================================

router.get('/api', (req, res) => {
  res.json({
    service: 'Supplier Approval API',
    version: '1.0.0',
    description: 'Manuelle Genehmigung von OCR-erkannten Lieferanten',
    endpoints: {
      list: 'GET /api/supplier-approval',
      get: 'GET /api/supplier-approval/:id',
      approve: 'POST /api/supplier-approval/:id/approve',
      reject: 'POST /api/supplier-approval/:id/reject',
      update: 'PUT /api/supplier-approval/:id',
      stats: 'GET /api/supplier-approval/stats'
    },
    workflow: [
      '1. OCR erkennt Lieferanten → Pending Status',
      '2. User überprüft und bearbeitet Daten',
      '3. User genehmigt → Lieferant wird angelegt/aktualisiert',
      '4. Oder User lehnt ab → Kein Lieferant angelegt'
    ],
    features: [
      'Manuelle User-Genehmigung erforderlich',
      'Bearbeitung vor Genehmigung möglich',
      'Integration mit existierender Dienstleister-Tabelle',
      'Ähnlichkeits-Matching für Duplikat-Vermeidung',
      'Draft-Save für schrittweise Bearbeitung',
      'Vollständige Audit-Logs',
      'Automatische Bereinigung abgelaufener Requests'
    ],
    validation: {
      name: 'Erforderlich, 2-255 Zeichen',
      email: 'Optional, gültige E-Mail-Adresse',
      taxNumber: 'Optional, deutsches Format (123/456/7890)',
      vatId: 'Optional, deutsches Format (DE123456789)',
      iban: 'Optional, deutsches Format (DE89 3704 0044...)'
    }
  });
});

export default router;
