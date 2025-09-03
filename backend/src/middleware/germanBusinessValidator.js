// =====================================================
// Budget Manager 2025 - German Business Validator Middleware
// Deutsche Geschäftsregeln-Validierung
// =====================================================

/**
 * Middleware to validate German business rules
 */
export const validateGermanBusiness = (req, res, next) => {
  // Add German business context to request
  req.germanBusiness = {
    currency: 'EUR',
    locale: 'de-DE',
    taxRates: {
      standard: 19,
      reduced: 7
    },
    businessYear: new Date().getFullYear()
  };
  
  // Validate German currency format in request body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (key.includes('budget') || key.includes('betrag') || key.includes('amount')) {
        const value = req.body[key];
        if (typeof value === 'string' && value.includes('$')) {
          return res.status(400).json({
            error: 'Ungültiges Währungsformat',
            message: 'Bitte verwenden Sie das deutsche EUR-Format (€1.000.000,50)',
            code: 'INVALID_CURRENCY_FORMAT',
            field: key
          });
        }
      }
    });
  }
  
  next();
};

export default validateGermanBusiness;