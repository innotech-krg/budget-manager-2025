// =====================================================
// Budget Manager 2025 - Request Validation Middleware
// Express-Validator Integration
// =====================================================

import { validationResult, body, param, query } from 'express-validator';

/**
 * Simple middleware to handle validation errors from express-validator
 * This should be used after validation rules like validateYear
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('❌ Validierungsfehler:', errors.array());
    return res.status(400).json({
      error: 'Validierungsfehler',
      message: 'Die übermittelten Daten sind ungültig',
      code: 'VALIDATION_ERROR',
      details: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  console.log('✅ Validierung erfolgreich');
  next();
};

export default validateRequest;