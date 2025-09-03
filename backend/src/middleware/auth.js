// =====================================================
// Budget Manager 2025 - Authentication Middleware
// Placeholder Authentication for Testing
// =====================================================

/**
 * Mock authentication middleware for testing
 * In production, this would integrate with Supabase Auth
 */
export const authenticateUser = (req, res, next) => {
  // For testing, we'll use a mock user
  if (process.env.NODE_ENV === 'test') {
    req.user = {
      id: 'test-user-123',
      email: 'test@example.com',
      role: 'admin'
    };
    return next();
  }
  
  // In development, allow requests without authentication
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      id: 'dev-user-123',
      email: 'dev@example.com',
      role: 'admin'
    };
    return next();
  }
  
  // TODO: Implement actual Supabase authentication
  // const token = req.headers.authorization?.replace('Bearer ', '');
  // Validate token with Supabase
  
  next();
};

export default authenticateUser;