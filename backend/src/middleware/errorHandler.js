// =====================================================
// Budget Manager 2025 - Error Handler Middleware
// Deutsche Geschäfts-Fehlerbehandlung
// =====================================================

import { createAuditLog } from '../utils/auditLogger.js';

// =====================================================
// ERROR HANDLER MIDDLEWARE
// =====================================================

/**
 * Globaler Error Handler mit deutscher Lokalisierung
 * @param {Error} err - Error-Objekt
 * @param {Object} req - Request-Objekt
 * @param {Object} res - Response-Objekt
 * @param {Function} next - Next-Funktion
 */
export const errorHandler = async (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error für Debugging
  console.error('❌ API Error:', err);

  // Audit Log für kritische Fehler
  if (err.statusCode >= 500) {
    await createAuditLog({
      table_name: 'system_errors',
      record_id: 'system',
      action: 'ERROR',
      new_values: {
        error_message: err.message,
        error_stack: err.stack,
        request_url: req.originalUrl,
        request_method: req.method,
        user_id: req.user?.id || null
      },
      changed_by: req.user?.id || null,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
  }

  // Deutsche Fehlermeldungen basierend auf Error-Typ
  const germanErrorMessages = {
    // Validierungsfehler
    'ValidationError': 'Ungültige Eingabedaten',
    'CastError': 'Ungültiges Datenformat',
    
    // Authentifizierung
    'UnauthorizedError': 'Nicht autorisiert',
    'ForbiddenError': 'Zugriff verweigert',
    'TokenExpiredError': 'Sitzung abgelaufen',
    'JsonWebTokenError': 'Ungültiges Authentifizierungstoken',
    
    // Datenbank
    'DatabaseError': 'Datenbankfehler',
    'ConnectionError': 'Verbindungsfehler zur Datenbank',
    'QueryError': 'Fehler bei der Datenabfrage',
    
    // Business Logic
    'BusinessRuleError': 'Geschäftsregel-Verletzung',
    'BudgetAllocationError': 'Budget-Zuordnungsfehler',
    'InsufficientBudgetError': 'Unzureichendes Budget',
    
    // System
    'InternalServerError': 'Interner Serverfehler',
    'ServiceUnavailableError': 'Service nicht verfügbar',
    'TimeoutError': 'Anfrage-Zeitüberschreitung'
  };

  // Standard Error Response Format
  const errorResponse = {
    error: germanErrorMessages[error.name] || 'Unbekannter Fehler',
    message: error.message || 'Ein unerwarteter Fehler ist aufgetreten',
    code: error.code || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Spezifische Error-Behandlung
  if (err.name === 'ValidationError') {
    // Mongoose/Joi Validation Errors
    const validationErrors = Object.values(err.errors || {}).map(val => val.message);
    errorResponse.details = validationErrors;
    errorResponse.message = 'Validierungsfehler in den Eingabedaten';
    return res.status(400).json(errorResponse);
  }

  if (err.code === '23505') {
    // PostgreSQL Unique Constraint Violation
    errorResponse.error = 'Daten bereits vorhanden';
    errorResponse.message = 'Ein Eintrag mit diesen Daten existiert bereits';
    errorResponse.code = 'DUPLICATE_ENTRY';
    return res.status(409).json(errorResponse);
  }

  if (err.code === '23503') {
    // PostgreSQL Foreign Key Constraint Violation
    errorResponse.error = 'Referenz-Fehler';
    errorResponse.message = 'Referenzierter Datensatz existiert nicht';
    errorResponse.code = 'FOREIGN_KEY_VIOLATION';
    return res.status(400).json(errorResponse);
  }

  if (err.code === '23502') {
    // PostgreSQL Not Null Constraint Violation
    errorResponse.error = 'Pflichtfeld fehlt';
    errorResponse.message = 'Ein erforderliches Feld wurde nicht ausgefüllt';
    errorResponse.code = 'MISSING_REQUIRED_FIELD';
    return res.status(400).json(errorResponse);
  }

  if (err.code === '23514') {
    // PostgreSQL Check Constraint Violation
    errorResponse.error = 'Ungültiger Wert';
    errorResponse.message = 'Der eingegebene Wert entspricht nicht den Geschäftsregeln';
    errorResponse.code = 'BUSINESS_RULE_VIOLATION';
    return res.status(400).json(errorResponse);
  }

  // Supabase spezifische Errors
  if (err.message?.includes('JWT')) {
    errorResponse.error = 'Authentifizierungsfehler';
    errorResponse.message = 'Bitte melden Sie sich erneut an';
    errorResponse.code = 'AUTHENTICATION_REQUIRED';
    return res.status(401).json(errorResponse);
  }

  if (err.message?.includes('RLS')) {
    errorResponse.error = 'Zugriff verweigert';
    errorResponse.message = 'Sie haben keine Berechtigung für diese Aktion';
    errorResponse.code = 'ACCESS_DENIED';
    return res.status(403).json(errorResponse);
  }

  // Rate Limiting Errors
  if (err.message?.includes('rate limit')) {
    errorResponse.error = 'Zu viele Anfragen';
    errorResponse.message = 'Bitte warten Sie einen Moment und versuchen Sie es erneut';
    errorResponse.code = 'RATE_LIMIT_EXCEEDED';
    return res.status(429).json(errorResponse);
  }

  // File Upload Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    errorResponse.error = 'Datei zu groß';
    errorResponse.message = 'Die hochgeladene Datei ist zu groß';
    errorResponse.code = 'FILE_TOO_LARGE';
    return res.status(413).json(errorResponse);
  }

  // Network/Timeout Errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    errorResponse.error = 'Verbindungsfehler';
    errorResponse.message = 'Service ist vorübergehend nicht verfügbar';
    errorResponse.code = 'SERVICE_UNAVAILABLE';
    return res.status(503).json(errorResponse);
  }

  // Default: Internal Server Error
  const statusCode = err.statusCode || 500;
  
  // In Produktion keine Stack Traces an Client senden
  if (process.env.NODE_ENV === 'production') {
    delete errorResponse.stack;
  } else {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }

  // Kritische Fehler zusätzlich loggen
  if (statusCode >= 500) {
    console.error('🚨 Kritischer Serverfehler:', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 * @param {Object} req - Request-Objekt
 * @param {Object} res - Response-Objekt
 * @param {Function} next - Next-Funktion
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} nicht gefunden`);
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};

/**
 * Async Error Wrapper
 * @param {Function} fn - Async-Funktion
 * @returns {Function} Wrapped function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom Business Error Classes
 */
export class BusinessRuleError extends Error {
  constructor(message, code = 'BUSINESS_RULE_VIOLATION') {
    super(message);
    this.name = 'BusinessRuleError';
    this.statusCode = 400;
    this.code = code;
  }
}

export class BudgetAllocationError extends Error {
  constructor(message, code = 'BUDGET_ALLOCATION_ERROR') {
    super(message);
    this.name = 'BudgetAllocationError';
    this.statusCode = 400;
    this.code = code;
  }
}

export class InsufficientBudgetError extends Error {
  constructor(message, availableBudget, requestedBudget) {
    super(message);
    this.name = 'InsufficientBudgetError';
    this.statusCode = 400;
    this.code = 'INSUFFICIENT_BUDGET';
    this.availableBudget = availableBudget;
    this.requestedBudget = requestedBudget;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentifizierung erforderlich') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
    this.code = 'AUTHENTICATION_REQUIRED';
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Nicht autorisiert') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.code = 'ACCESS_DENIED';
  }
}

// =====================================================
// EXPORT ERROR HANDLERS
// =====================================================

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  BusinessRuleError,
  BudgetAllocationError,
  InsufficientBudgetError,
  AuthenticationError,
  AuthorizationError
};