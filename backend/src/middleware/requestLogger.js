// =====================================================
// Budget Manager 2025 - Request Logger Middleware
// Deutsche Geschäfts-API Logging
// =====================================================

/**
 * Custom request logger middleware
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request start
  console.log(`📥 ${req.method} ${req.originalUrl} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
    
    console.log(`📤 ${statusEmoji} ${req.method} ${req.originalUrl} - ${statusCode} - ${duration}ms`);
    
    originalEnd.apply(this, args);
  };
  
  next();
};

export default requestLogger;