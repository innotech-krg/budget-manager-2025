// =====================================================
// Budget Manager 2025 - Auth Routes
// Epic 8 - Story 8.1: Supabase Auth Integration
// =====================================================

import express from 'express';
import authService from '../services/authService.js';
import { supabaseAdmin } from '../config/database.js';
import { requireAuth, requireSuperAdmin, authRateLimit, getClientIP, getUserAgent } from '../middleware/authMiddleware.js';

const router = express.Router();

// =====================================================
// BASIC AUTHENTICATION ROUTES
// =====================================================

/**
 * POST /api/auth/login
 * User login with email and password
 */
router.post('/login', authRateLimit(5, 10 * 60 * 1000), async (req, res) => {
  try {
    console.log('📥 Auth: Login request received');

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'E-Mail und Passwort sind erforderlich',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Ungültiges E-Mail-Format',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate password strength
    const passwordValidation = authService.validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Passwort erfüllt nicht die Sicherheitsanforderungen',
        code: 'WEAK_PASSWORD',
        details: passwordValidation.errors
      });
    }

    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    // Attempt login
    const result = await authService.signIn(email, password, clientIP, userAgent);

    if (!result.success) {
      return res.status(401).json(result);
    }

    // Handle MFA requirement
    if (result.requiresMFA) {
      return res.status(200).json({
        success: true,
        requiresMFA: true,
        tempToken: result.tempToken,
        message: result.message
      });
    }

    // Successful login
    console.log('✅ Auth: Login successful for:', email);

    return res.status(200).json({
      success: true,
      message: 'Anmeldung erfolgreich',
      user: result.user,
      session: result.session,
      token: result.customToken
    });

  } catch (error) {
    console.error('❌ Auth: Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Anmeldefehler',
      code: 'LOGIN_ERROR'
    });
  }
});

/**
 * POST /api/auth/mfa-verify
 * Verify MFA token during login
 */
router.post('/mfa-verify', authRateLimit(3, 5 * 60 * 1000), async (req, res) => {
  try {
    console.log('📥 Auth: MFA verification request received');

    const { tempToken, mfaToken } = req.body;

    if (!tempToken || !mfaToken) {
      return res.status(400).json({
        success: false,
        error: 'Temporärer Token und MFA-Code sind erforderlich',
        code: 'MISSING_MFA_DATA'
      });
    }

    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    const result = await authService.verifyMFALogin(tempToken, mfaToken, clientIP, userAgent);

    if (!result.success) {
      return res.status(401).json(result);
    }

    console.log('✅ Auth: MFA verification successful');

    return res.status(200).json({
      success: true,
      message: 'MFA-Anmeldung erfolgreich',
      user: result.user,
      token: result.customToken
    });

  } catch (error) {
    console.error('❌ Auth: MFA verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'MFA-Verifizierungsfehler',
      code: 'MFA_VERIFY_ERROR'
    });
  }
});

/**
 * POST /api/auth/logout
 * User logout
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    console.log('📥 Auth: Logout request received');

    const accessToken = req.headers.authorization?.substring(7);
    const result = await authService.signOut(accessToken, req.user.id, req.clientIP, req.userAgent);

    console.log('✅ Auth: Logout successful');

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Auth: Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Abmeldefehler',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**
 * GET /api/auth/user
 * Get current user information
 */
router.get('/user', requireAuth, async (req, res) => {
  try {
    console.log('📥 Auth: Get user request received');

    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        profile: req.userProfile
      }
    });

  } catch (error) {
    console.error('❌ Auth: Get user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Benutzerdaten',
      code: 'GET_USER_ERROR'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh authentication token
 */
router.post('/refresh', async (req, res) => {
  try {
    console.log('📥 Auth: Token refresh request received');

    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh-Token ist erforderlich',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    const result = await authService.refreshToken(refreshToken);

    if (!result.success) {
      return res.status(401).json(result);
    }

    console.log('✅ Auth: Token refresh successful');

    return res.status(200).json({
      success: true,
      message: 'Token erfolgreich aktualisiert',
      session: result.session,
      token: result.customToken
    });

  } catch (error) {
    console.error('❌ Auth: Token refresh error:', error);
    return res.status(500).json({
      success: false,
      error: 'Token-Aktualisierungsfehler',
      code: 'REFRESH_ERROR'
    });
  }
});

// =====================================================
// MULTI-FACTOR AUTHENTICATION ROUTES
// =====================================================

/**
 * POST /api/auth/mfa/setup
 * Setup MFA for current user
 */
router.post('/mfa/setup', requireAuth, async (req, res) => {
  try {
    console.log('📥 Auth: MFA setup request received');

    const result = await authService.setupMFA(req.user.id);

    if (!result.success) {
      return res.status(500).json(result);
    }

    console.log('✅ Auth: MFA setup successful');

    return res.status(200).json({
      success: true,
      message: 'MFA-Setup vorbereitet',
      secret: result.secret,
      qrCode: result.qrCode,
      backupCodes: result.backupCodes
    });

  } catch (error) {
    console.error('❌ Auth: MFA setup error:', error);
    return res.status(500).json({
      success: false,
      error: 'MFA-Setup-Fehler',
      code: 'MFA_SETUP_ERROR'
    });
  }
});

/**
 * POST /api/auth/mfa/enable
 * Enable MFA after verification
 */
router.post('/mfa/enable', requireAuth, async (req, res) => {
  try {
    console.log('📥 Auth: MFA enable request received');

    const { token, secret } = req.body;

    if (!token || !secret) {
      return res.status(400).json({
        success: false,
        error: 'MFA-Token und Secret sind erforderlich',
        code: 'MISSING_MFA_DATA'
      });
    }

    const result = await authService.verifyAndEnableMFA(req.user.id, token, secret);

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log('✅ Auth: MFA enabled successfully');

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Auth: MFA enable error:', error);
    return res.status(500).json({
      success: false,
      error: 'MFA-Aktivierungsfehler',
      code: 'MFA_ENABLE_ERROR'
    });
  }
});

/**
 * POST /api/auth/mfa/disable
 * Disable MFA for current user (SuperAdmin only or with password confirmation)
 */
router.post('/mfa/disable', requireAuth, async (req, res) => {
  try {
    console.log('📥 Auth: MFA disable request received');

    const { password } = req.body;

    // For now, require password confirmation
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Passwort-Bestätigung erforderlich',
        code: 'PASSWORD_REQUIRED'
      });
    }

    // TODO: Verify password and disable MFA
    // This would require additional implementation

    return res.status(501).json({
      success: false,
      error: 'MFA-Deaktivierung noch nicht implementiert',
      code: 'NOT_IMPLEMENTED'
    });

  } catch (error) {
    console.error('❌ Auth: MFA disable error:', error);
    return res.status(500).json({
      success: false,
      error: 'MFA-Deaktivierungsfehler',
      code: 'MFA_DISABLE_ERROR'
    });
  }
});

// =====================================================
// ADMIN ROUTES (SuperAdmin only)
// =====================================================

/**
 * GET /api/auth/admin/users
 * Get all users (SuperAdmin only)
 */
router.get('/admin/users', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    console.log('📥 Auth: Admin get users request received');

    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    // Apply role filter
    if (role) {
      query = query.eq('role', role);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: users, error, count } = await query;

    if (error) {
      console.error('❌ Auth: Error fetching users:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Benutzer',
        code: 'FETCH_USERS_ERROR'
      });
    }

    console.log('✅ Auth: Users fetched successfully');

    return res.status(200).json({
      success: true,
      users: users.map(user => ({
        ...user,
        mfa_secret: undefined // Don't expose MFA secrets
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('❌ Auth: Admin get users error:', error);
    return res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Benutzer',
      code: 'ADMIN_USERS_ERROR'
    });
  }
});

/**
 * PUT /api/auth/admin/users/:userId/role
 * Update user role (SuperAdmin only)
 */
router.put('/admin/users/:userId/role', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    console.log('📥 Auth: Admin update user role request received');

    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['USER', 'SUPERADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige Rolle',
        code: 'INVALID_ROLE'
      });
    }

    // Prevent self-demotion
    if (userId === req.user.id && role !== 'SUPERADMIN') {
      return res.status(400).json({
        success: false,
        error: 'Sie können Ihre eigene SuperAdmin-Rolle nicht entfernen',
        code: 'SELF_DEMOTION_DENIED'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Auth: Error updating user role:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren der Benutzerrolle',
        code: 'UPDATE_ROLE_ERROR'
      });
    }

    // Log role change
    await authService.logAuthEvent(
      req.user.id,
      'ROLE_CHANGED',
      req.clientIP,
      req.userAgent,
      {
        target_user: userId,
        new_role: role,
        changed_by: req.user.id
      }
    );

    console.log('✅ Auth: User role updated successfully');

    return res.status(200).json({
      success: true,
      message: 'Benutzerrolle erfolgreich aktualisiert',
      user: {
        ...data,
        mfa_secret: undefined
      }
    });

  } catch (error) {
    console.error('❌ Auth: Admin update role error:', error);
    return res.status(500).json({
      success: false,
      error: 'Fehler beim Aktualisieren der Benutzerrolle',
      code: 'ADMIN_ROLE_ERROR'
    });
  }
});

/**
 * GET /api/auth/admin/audit-logs
 * Get authentication audit logs (SuperAdmin only)
 */
router.get('/admin/audit-logs', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    console.log('📥 Auth: Admin get audit logs request received');

    const { page = 1, limit = 50, userId = '', eventType = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('auth_audit_log')
      .select(`
        *,
        user_profiles!auth_audit_log_user_id_fkey (
          email,
          first_name,
          last_name
        )
      `, { count: 'exact' });

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('❌ Auth: Error fetching audit logs:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Audit-Logs',
        code: 'FETCH_LOGS_ERROR'
      });
    }

    console.log('✅ Auth: Audit logs fetched successfully');

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('❌ Auth: Admin get audit logs error:', error);
    return res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Audit-Logs',
      code: 'ADMIN_LOGS_ERROR'
    });
  }
});

// =====================================================
// HEALTH CHECK ROUTE
// =====================================================

/**
 * GET /api/auth/health
 * Auth system health check
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        supabase_auth: 'unknown',
        database: 'unknown',
        jwt: 'unknown'
      }
    };

    // Test Supabase Auth
    try {
      const { data, error } = await supabase.auth.getSession();
      health.services.supabase_auth = error ? 'error' : 'healthy';
    } catch (error) {
      health.services.supabase_auth = 'error';
    }

    // Test Database
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('count', { count: 'exact', head: true });
      health.services.database = error ? 'error' : 'healthy';
    } catch (error) {
      health.services.database = 'error';
    }

    // Test JWT
    try {
      const testToken = authService.generateJWTToken(
        { id: 'test', email: 'test@example.com' },
        { role: 'USER' }
      );
      health.services.jwt = testToken ? 'healthy' : 'error';
    } catch (error) {
      health.services.jwt = 'error';
    }

    // Determine overall status
    const hasErrors = Object.values(health.services).includes('error');
    health.status = hasErrors ? 'degraded' : 'healthy';

    const statusCode = health.status === 'healthy' ? 200 : 503;

    return res.status(statusCode).json({
      success: true,
      health
    });

  } catch (error) {
    console.error('❌ Auth: Health check error:', error);
    return res.status(503).json({
      success: false,
      error: 'Auth-System-Gesundheitsprüfung fehlgeschlagen',
      code: 'HEALTH_CHECK_ERROR'
    });
  }
});

export default router;
