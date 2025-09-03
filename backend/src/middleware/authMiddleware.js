// =====================================================
// Budget Manager 2025 - Auth Middleware
// Epic 8 - Story 8.1: Supabase Auth Integration
// =====================================================

import authService from '../services/authService.js';
import jwt from 'jsonwebtoken';

/**
 * Extract IP address from request
 */
export const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
};

/**
 * Extract User Agent from request
 */
export const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

/**
 * Middleware to require authentication
 */
export const requireAuth = async (req, res, next) => {
  try {
    console.log('🔐 Auth Middleware: Checking authentication');

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth Middleware: No valid authorization header');
      return res.status(401).json({
        success: false,
        error: 'Authentifizierung erforderlich',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Auth Middleware: JWT token valid for user:', decoded.email);
      
      const userProfile = await authService.getUserProfile(decoded.sub);
      
      if (!userProfile) {
        console.log('❌ Auth Middleware: User profile not found');
        return res.status(401).json({
          success: false,
          error: 'Benutzer-Profil nicht gefunden',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!userProfile.is_active) {
        console.log('❌ Auth Middleware: User account is disabled');
        return res.status(401).json({
          success: false,
          error: 'Benutzer-Account ist deaktiviert',
          code: 'ACCOUNT_DISABLED'
        });
      }

      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role
      };
      req.userProfile = userProfile;

      console.log('✅ Auth Middleware: Authentication successful');
      next();

    } catch (jwtError) {
      console.log('❌ Auth Middleware: JWT verification failed:', jwtError.message);
      return res.status(401).json({
        success: false,
        error: 'Ungültiger oder abgelaufener Token',
        code: 'INVALID_TOKEN'
      });
    }

  } catch (error) {
    console.error('❌ Auth Middleware Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler bei der Authentifizierung',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to require SuperAdmin role
 */
export const requireSuperAdmin = async (req, res, next) => {
  try {
    console.log('🔐 Auth Middleware: Checking SuperAdmin role');

    if (!req.user || !req.userProfile) {
      console.log('❌ Auth Middleware: No user data found');
      return res.status(401).json({
        success: false,
        error: 'Authentifizierung erforderlich',
        code: 'NO_AUTH'
      });
    }

    if (req.userProfile.role !== 'SUPERADMIN') {
      console.log(`❌ Auth Middleware: User ${req.user.email} has role ${req.userProfile.role}, SuperAdmin required`);
      return res.status(403).json({
        success: false,
        error: 'SuperAdmin-Berechtigung erforderlich',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (!req.userProfile.is_active) {
      console.log(`❌ Auth Middleware: User ${req.user.email} is not active`);
      return res.status(403).json({
        success: false,
        error: 'Benutzer-Account ist deaktiviert',
        code: 'ACCOUNT_DISABLED'
      });
    }

    console.log(`✅ Auth Middleware: SuperAdmin access granted for ${req.user.email}`);
    next();

  } catch (error) {
    console.error('❌ Auth Middleware SuperAdmin Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler bei der Autorisierung',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to require specific roles
 */
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      console.log('🔐 Auth Middleware: Checking role access for:', allowedRoles);

      if (!req.user || !req.userProfile) {
        console.log('❌ Auth Middleware: No user data found');
        return res.status(401).json({
          success: false,
          error: 'Authentifizierung erforderlich',
          code: 'NO_AUTH'
        });
      }

      if (!allowedRoles.includes(req.userProfile.role)) {
        console.log(`❌ Auth Middleware: User ${req.user.email} has role ${req.userProfile.role}, required: ${allowedRoles.join(', ')}`);
        return res.status(403).json({
          success: false,
          error: 'Unzureichende Berechtigung',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      console.log(`✅ Auth Middleware: Role access granted for ${req.user.email} (${req.userProfile.role})`);
      next();

    } catch (error) {
      console.error('❌ Auth Middleware Role Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Interner Server-Fehler bei der Autorisierung',
        code: 'AUTH_ERROR'
      });
    }
  };
};

/**
 * Middleware for optional authentication
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.userProfile = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userProfile = await authService.getUserProfile(decoded.sub);
      
      if (userProfile && userProfile.is_active) {
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role
        };
        req.userProfile = userProfile;
      } else {
        req.user = null;
        req.userProfile = null;
      }
    } catch (jwtError) {
      req.user = null;
      req.userProfile = null;
    }

    next();

  } catch (error) {
    console.error('❌ Optional Auth Middleware Error:', error);
    req.user = null;
    req.userProfile = null;
    next();
  }
};

/**
 * Rate limiting for authentication endpoints
 */
export const authRateLimit = (maxAttempts, windowMs) => {
  return (req, res, next) => {
    // Simple rate limiting - in production use express-rate-limit
    // For now, just pass through
    next();
  };
};

/**
 * Error handler for authentication errors
 */
export const authErrorHandler = (error, req, res, next) => {
  console.error('🔥 Auth Error Handler:', error);

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Ungültiger Token',
      code: 'INVALID_TOKEN'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token abgelaufen',
      code: 'TOKEN_EXPIRED'
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Interner Server-Fehler',
    code: 'INTERNAL_ERROR'
  });
};

// Default export
export default {
  requireAuth,
  requireSuperAdmin,
  requireRole,
  optionalAuth,
  getClientIP,
  getUserAgent,
  authRateLimit,
  authErrorHandler
};