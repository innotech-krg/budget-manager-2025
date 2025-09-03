// =====================================================
// Budget Manager 2025 - Permission Middleware
// Epic 8 - Story 8.2: Custom Rollen-System
// =====================================================

import RoleService from '../services/roleService.js';

/**
 * Middleware für granulare Berechtigungsprüfung
 * Baut auf authMiddleware auf und erweitert es um rollenbasierte Berechtigungen
 */

/**
 * Middleware um eine spezifische Berechtigung zu erfordern
 * @param {string} permission - Erforderliche Berechtigung
 * @returns {Function} Middleware-Funktion
 */
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      console.log(`🔐 Permission Middleware: Checking permission '${permission}'`);

      // 1. Prüfe ob Benutzer authentifiziert ist
      if (!req.user || !req.user.id) {
        console.log('❌ Permission Middleware: No authenticated user found');
        return res.status(401).json({
          success: false,
          error: 'Authentifizierung erforderlich',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // 2. Prüfe Berechtigung
      const hasPermission = await RoleService.hasPermission(req.user.id, permission);

      if (!hasPermission) {
        console.log(`❌ Permission Middleware: User lacks permission '${permission}'`);
        
        // Log unauthorized access attempt
        await logUnauthorizedAccess(req, permission, 'PERMISSION_DENIED');

        return res.status(403).json({
          success: false,
          error: 'Keine Berechtigung für diese Aktion',
          code: 'PERMISSION_DENIED',
          required_permission: permission
        });
      }

      console.log(`✅ Permission Middleware: Permission '${permission}' granted`);
      next();

    } catch (error) {
      console.error('❌ Permission Middleware: Error checking permission:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler bei Berechtigungsprüfung',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware um mehrere Berechtigungen zu erfordern
 * @param {Array<string>} permissions - Liste der erforderlichen Berechtigungen
 * @param {boolean} requireAll - Alle oder nur eine Berechtigung erforderlich
 * @returns {Function} Middleware-Funktion
 */
export const requirePermissions = (permissions, requireAll = true) => {
  return async (req, res, next) => {
    try {
      console.log(`🔐 Permission Middleware: Checking permissions [${permissions.join(', ')}] (requireAll: ${requireAll})`);

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentifizierung erforderlich',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const hasPermissions = await RoleService.hasPermissions(req.user.id, permissions, requireAll);

      if (!hasPermissions) {
        console.log('❌ Permission Middleware: User lacks required permissions');
        
        await logUnauthorizedAccess(req, permissions.join(','), 'PERMISSIONS_DENIED');

        return res.status(403).json({
          success: false,
          error: requireAll 
            ? 'Alle erforderlichen Berechtigungen fehlen' 
            : 'Mindestens eine erforderliche Berechtigung fehlt',
          code: 'PERMISSIONS_DENIED',
          required_permissions: permissions,
          require_all: requireAll
        });
      }

      console.log('✅ Permission Middleware: Permissions granted');
      next();

    } catch (error) {
      console.error('❌ Permission Middleware: Error checking permissions:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler bei Berechtigungsprüfung',
        code: 'PERMISSIONS_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware um eine spezifische Rolle zu erfordern
 * @param {string} role - Erforderliche Rolle
 * @returns {Function} Middleware-Funktion
 */
export const requireRole = (role) => {
  return async (req, res, next) => {
    try {
      console.log(`🔐 Permission Middleware: Checking role '${role}'`);

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentifizierung erforderlich',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const hasRole = await RoleService.hasRole(req.user.id, role);

      if (!hasRole) {
        console.log(`❌ Permission Middleware: User lacks role '${role}'`);
        
        await logUnauthorizedAccess(req, role, 'ROLE_DENIED');

        return res.status(403).json({
          success: false,
          error: `Rolle '${role}' erforderlich`,
          code: 'ROLE_DENIED',
          required_role: role
        });
      }

      console.log(`✅ Permission Middleware: Role '${role}' granted`);
      next();

    } catch (error) {
      console.error('❌ Permission Middleware: Error checking role:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler bei Rollenprüfung',
        code: 'ROLE_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware um eine Mindest-Rolle zu erfordern (Hierarchie)
 * @param {string} minRole - Mindest-Rolle
 * @returns {Function} Middleware-Funktion
 */
export const requireMinRole = (minRole) => {
  return async (req, res, next) => {
    try {
      console.log(`🔐 Permission Middleware: Checking minimum role '${minRole}'`);

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentifizierung erforderlich',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const hasMinRole = await RoleService.hasMinRole(req.user.id, minRole);

      if (!hasMinRole) {
        console.log(`❌ Permission Middleware: User lacks minimum role '${minRole}'`);
        
        await logUnauthorizedAccess(req, minRole, 'MIN_ROLE_DENIED');

        return res.status(403).json({
          success: false,
          error: `Mindestens Rolle '${minRole}' erforderlich`,
          code: 'MIN_ROLE_DENIED',
          required_min_role: minRole
        });
      }

      console.log(`✅ Permission Middleware: Minimum role '${minRole}' satisfied`);
      next();

    } catch (error) {
      console.error('❌ Permission Middleware: Error checking minimum role:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler bei Mindest-Rollenprüfung',
        code: 'MIN_ROLE_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware um Benutzer-Berechtigungen in Request zu laden
 * Lädt alle Berechtigungen des Benutzers und stellt sie in req.userPermissions zur Verfügung
 */
export const loadUserPermissions = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      req.userPermissions = [];
      return next();
    }

    console.log('🔐 Permission Middleware: Loading user permissions');

    const permissions = await RoleService.getUserPermissions(req.user.id);
    req.userPermissions = permissions.map(p => p.permission);

    console.log(`✅ Permission Middleware: Loaded ${req.userPermissions.length} permissions`);
    next();

  } catch (error) {
    console.error('❌ Permission Middleware: Error loading user permissions:', error);
    req.userPermissions = [];
    next(); // Continue even if loading fails
  }
};

// =====================================================
// CONVENIENCE MIDDLEWARES
// =====================================================

// Admin-Bereich Zugriff
export const requireAdminAccess = requirePermission(RoleService.PERMISSIONS.ADMIN_ACCESS);
export const requireUserManagement = requirePermission(RoleService.PERMISSIONS.USER_MANAGEMENT);
export const requireSystemSettings = requirePermission(RoleService.PERMISSIONS.SYSTEM_SETTINGS);
export const requireRoleManagement = requirePermission(RoleService.PERMISSIONS.ROLE_MANAGEMENT);

// Budget-Management
export const requireBudgetRead = requirePermission(RoleService.PERMISSIONS.BUDGET_READ);
export const requireBudgetWrite = requirePermission(RoleService.PERMISSIONS.BUDGET_WRITE);
export const requireBudgetDelete = requirePermission(RoleService.PERMISSIONS.BUDGET_DELETE);
export const requireBudgetTransfer = requirePermission(RoleService.PERMISSIONS.BUDGET_TRANSFER);
export const requireBudgetApprove = requirePermission(RoleService.PERMISSIONS.BUDGET_APPROVE);

// Projekt-Management
export const requireProjectRead = requirePermission(RoleService.PERMISSIONS.PROJECT_READ);
export const requireProjectWrite = requirePermission(RoleService.PERMISSIONS.PROJECT_WRITE);
export const requireProjectDelete = requirePermission(RoleService.PERMISSIONS.PROJECT_DELETE);
export const requireProjectAssign = requirePermission(RoleService.PERMISSIONS.PROJECT_ASSIGN);

// OCR & Rechnungen
export const requireOCRUpload = requirePermission(RoleService.PERMISSIONS.OCR_UPLOAD);
export const requireOCRReview = requirePermission(RoleService.PERMISSIONS.OCR_REVIEW);
export const requireOCRApprove = requirePermission(RoleService.PERMISSIONS.OCR_APPROVE);
export const requireInvoiceRead = requirePermission(RoleService.PERMISSIONS.INVOICE_READ);
export const requireInvoiceWrite = requirePermission(RoleService.PERMISSIONS.INVOICE_WRITE);

// Berichte & Analytics
export const requireReportsRead = requirePermission(RoleService.PERMISSIONS.REPORTS_READ);
export const requireReportsExport = requirePermission(RoleService.PERMISSIONS.REPORTS_EXPORT);
export const requireAnalyticsRead = requirePermission(RoleService.PERMISSIONS.ANALYTICS_READ);

// Rollen-basierte Middlewares
export const requireSuperAdminRole = requireRole(RoleService.ROLES.SUPERADMIN);
export const requireAdminRole = requireRole(RoleService.ROLES.ADMIN);
export const requireManagerRole = requireRole(RoleService.ROLES.MANAGER);
export const requireUserRole = requireRole(RoleService.ROLES.USER);

// Hierarchie-basierte Middlewares
export const requireMinAdmin = requireMinRole(RoleService.ROLES.ADMIN);
export const requireMinManager = requireMinRole(RoleService.ROLES.MANAGER);
export const requireMinUser = requireMinRole(RoleService.ROLES.USER);

// =====================================================
// UTILITY FUNKTIONEN
// =====================================================

/**
 * Loggt einen unbefugten Zugriff
 * @param {Object} req - Express Request
 * @param {string} resource - Ressource/Berechtigung
 * @param {string} reason - Grund der Verweigerung
 */
async function logUnauthorizedAccess(req, resource, reason) {
  try {
    // Import authService dynamisch um Circular Dependencies zu vermeiden
    const { default: authService } = await import('../services/authService.js');
    
    await authService.logAuthEvent(
      req.user?.id || null,
      'UNAUTHORIZED_ACCESS',
      req.clientIP || null,
      req.userAgent || null,
      {
        resource,
        reason,
        url: req.originalUrl,
        method: req.method,
        user_role: req.userProfile?.role || 'unknown'
      }
    );
  } catch (error) {
    console.error('❌ Permission Middleware: Error logging unauthorized access:', error);
  }
}

/**
 * Hilfsfunktion um zu prüfen ob Benutzer eine Berechtigung hat (ohne Middleware)
 * @param {Object} req - Express Request
 * @param {string} permission - Berechtigung
 * @returns {Promise<boolean>} Hat Berechtigung
 */
export const checkPermission = async (req, permission) => {
  if (!req.user || !req.user.id) {
    return false;
  }

  try {
    return await RoleService.hasPermission(req.user.id, permission);
  } catch (error) {
    console.error('❌ Permission Middleware: Error in checkPermission:', error);
    return false;
  }
};

/**
 * Hilfsfunktion um zu prüfen ob Benutzer eine Rolle hat (ohne Middleware)
 * @param {Object} req - Express Request
 * @param {string} role - Rolle
 * @returns {Promise<boolean>} Hat Rolle
 */
export const checkRole = async (req, role) => {
  if (!req.user || !req.user.id) {
    return false;
  }

  try {
    return await RoleService.hasRole(req.user.id, role);
  } catch (error) {
    console.error('❌ Permission Middleware: Error in checkRole:', error);
    return false;
  }
};

/**
 * Middleware um Berechtigungen in Response-Header zu setzen
 * Nützlich für Frontend um UI-Elemente basierend auf Berechtigungen zu zeigen/verstecken
 */
export const addPermissionsToResponse = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      const permissions = await RoleService.getUserPermissions(req.user.id);
      const permissionList = permissions.map(p => p.permission);
      
      res.set('X-User-Permissions', JSON.stringify(permissionList));
      res.set('X-User-Role', req.userProfile?.role || 'unknown');
    }
    
    next();
  } catch (error) {
    console.error('❌ Permission Middleware: Error adding permissions to response:', error);
    next(); // Continue even if this fails
  }
};

// Export all middleware functions
export default {
  requirePermission,
  requirePermissions,
  requireRole,
  requireMinRole,
  loadUserPermissions,
  
  // Convenience middlewares
  requireAdminAccess,
  requireUserManagement,
  requireSystemSettings,
  requireRoleManagement,
  requireBudgetRead,
  requireBudgetWrite,
  requireBudgetDelete,
  requireBudgetTransfer,
  requireBudgetApprove,
  requireProjectRead,
  requireProjectWrite,
  requireProjectDelete,
  requireProjectAssign,
  requireOCRUpload,
  requireOCRReview,
  requireOCRApprove,
  requireInvoiceRead,
  requireInvoiceWrite,
  requireReportsRead,
  requireReportsExport,
  requireAnalyticsRead,
  requireSuperAdminRole,
  requireAdminRole,
  requireManagerRole,
  requireUserRole,
  requireMinAdmin,
  requireMinManager,
  requireMinUser,
  
  // Utility functions
  checkPermission,
  checkRole,
  addPermissionsToResponse
};
