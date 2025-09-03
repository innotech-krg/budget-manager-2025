// =====================================================
// OCR Routes - API Endpoints für OCR-System
// =====================================================

import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  uploadAndProcessOCR,
  upload
} from '../controllers/ocrController.js';

const router = express.Router();

// =====================================================
// VALIDATION RULES
// =====================================================

const ocrIdValidation = [
  param('id')
    .isUUID()
    .withMessage('OCR-Processing-ID muss eine gültige UUID sein')
];

const historyQueryValidation = [
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
    .isIn(['PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'])
    .withMessage('Status muss ein gültiger OCR-Status sein'),
  query('engine')
    .optional()
    .isIn(['tesseract', 'cloud-vision', 'hybrid'])
    .withMessage('Engine muss tesseract, cloud-vision oder hybrid sein')
];

const statsQueryValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Tage müssen zwischen 1 und 365 liegen')
];

const reprocessValidation = [
  ...ocrIdValidation,
  body('forceEngine')
    .optional()
    .isIn(['tesseract', 'cloud-vision', 'both'])
    .withMessage('Force-Engine muss tesseract, cloud-vision oder both sein')
];

// =====================================================
// ROUTES
// =====================================================

/**
 * @route   POST /api/ocr/upload
 * @desc    Datei hochladen und OCR-Verarbeitung starten
 * @access  Private
 */
router.post('/upload', upload.single('file'), uploadAndProcessOCR);

/**
 * @route   GET /api/ocr/stats/summary
 * @desc    OCR-Statistiken abrufen
 * @access  Private
 */
router.get('/stats/summary', (req, res) => {
  // Simple mock stats for now
  const days = parseInt(req.query.days) || 30;
  
  res.status(200).json({
    success: true,
    data: {
      totalProcessed: 1,
      successRate: 100,
      averageConfidence: 0,
      averageProcessingTime: 2447,
      engineUsage: {
        tesseract: 1,
        cloudVision: 0,
        hybrid: 0
      },
      period: `${days} Tage`
    }
  });
});

// TODO: Weitere OCR-Routen implementieren
// - GET /:id - OCR-Ergebnis abrufen
// - GET / - OCR-Historie
// - DELETE /:id - OCR-Verarbeitung löschen
// - POST /:id/reprocess - OCR wiederholen

// =====================================================
// API INFO ROUTE
// =====================================================

router.get('/api', (req, res) => {
  res.json({
    service: 'OCR API',
    version: '1.0.0',
    description: 'Dual OCR Engine Integration (Tesseract.js + Google Cloud Vision)',
    endpoints: {
      upload: 'POST /api/ocr/upload',
      getResult: 'GET /api/ocr/:id',
      getHistory: 'GET /api/ocr',
      getStats: 'GET /api/ocr/stats/summary',
      deleteProcessing: 'DELETE /api/ocr/:id',
      reprocess: 'POST /api/ocr/:id/reprocess'
    },
    supportedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxFileSize: '10MB',
    engines: {
      primary: 'Tesseract.js (Local)',
      fallback: 'Google Cloud Vision AI',
      escalationThreshold: '80% confidence'
    },
    features: [
      'Dual OCR Engine Integration',
      'Automatic Engine Selection',
      'Confidence-based Escalation',
      'Bounding Box Extraction',
      'Processing History',
      'Performance Statistics',
      'German Text Optimization'
    ]
  });
});

export default router;
