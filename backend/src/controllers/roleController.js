// =====================================================
// Budget Manager 2025 - Role Controller
// Epic 8 - Story 8.2: Custom Rollen-System
// =====================================================

import RoleService from '../services/roleService.js';
import { supabaseAdmin } from '../config/database.js';

/**
 * RoleController - Handles role and permission management
 */
class RoleController {

  // =====================================================
  // BENUTZER-ROLLEN VERWALTUNG
  // =====================================================

  /**
   * GET /api/roles/my-role
   * Aktuelle Benutzer-Rolle abrufen
   */
  async getUserRole(req, res) {
    try {
      console.log('📥 Role Controller: Get user role request');

      const userProfile = await RoleService.getUserProfile(req.user.id);

      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: 'Benutzerprofil nicht gefunden',
          code: 'USER_PROFILE_NOT_FOUND'
        });
      }

      const roleDescription = RoleService.getRoleDescription(userProfile.role);
      const roleLevel = RoleService.getRoleLevel(userProfile.role);

      return res.status(200).json({
        success: true,
        role: {
          name: userProfile.role,
          description: roleDescription,
          level: roleLevel,
          is_active: userProfile.is_active
        },
        user: {
          id: userProfile.id,
          email: userProfile.email,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          last_login_at: userProfile.last_login_at,
          created_at: userProfile.created_at
        }
      });

    } catch (error) {
      console.error('❌ Role Controller: Get user role error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Abrufen der Benutzer-Rolle',
        code: 'GET_USER_ROLE_ERROR'
      });
    }
  }

  /**
   * GET /api/roles/permissions
   * Berechtigungen des aktuellen Benutzers abrufen
   */
  async getUserPermissions(req, res) {
    try {
      console.log('📥 Role Controller: Get user permissions request');

      const permissions = await RoleService.getUserPermissions(req.user.id);

      return res.status(200).json({
        success: true,
        permissions: permissions,
        count: permissions.length
      });

    } catch (error) {
      console.error('❌ Role Controller: Get user permissions error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Abrufen der Benutzer-Berechtigungen',
        code: 'GET_USER_PERMISSIONS_ERROR'
      });
    }
  }

  /**
   * PUT /api/roles/user/:userId/role
   * Benutzer-Rolle ändern (nur SuperAdmin)
   */
  async updateUserRole(req, res) {
    try {
      console.log('📥 Role Controller: Update user role request');

      const { userId } = req.params;
      const { role, reason } = req.body;

      // Validierung
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'Benutzer-ID ist erforderlich',
          code: 'MISSING_USER_ID'
        });
      }

      if (!role) {
        return res.status(400).json({
          success: false,
          error: 'Rolle ist erforderlich',
          code: 'MISSING_ROLE'
        });
      }

      if (!RoleService.isValidRole(role)) {
        return res.status(400).json({
          success: false,
          error: 'Ungültige Rolle',
          code: 'INVALID_ROLE',
          valid_roles: Object.values(RoleService.ROLES)
        });
      }

      // Rolle ändern
      const result = await RoleService.changeUserRole(
        userId,
        role,
        req.user.id,
        reason,
        req.clientIP,
        req.userAgent
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ Role Controller: User role updated successfully');

      return res.status(200).json({
        success: true,
        message: 'Benutzer-Rolle erfolgreich aktualisiert',
        user: {
          ...result.user,
          role_description: RoleService.getRoleDescription(result.user.role),
          role_level: RoleService.getRoleLevel(result.user.role)
        }
      });

    } catch (error) {
      console.error('❌ Role Controller: Update user role error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren der Benutzer-Rolle',
        code: 'UPDATE_USER_ROLE_ERROR'
      });
    }
  }

  // =====================================================
  // ROLLEN-VERWALTUNG
  // =====================================================

  /**
   * GET /api/roles/all-roles
   * Alle verfügbaren Rollen auflisten (nur SuperAdmin)
   */
  async getAllRoles(req, res) {
    try {
      console.log('📥 Role Controller: Get all roles request');

      const roles = await RoleService.getAvailableRoles();

      // Erweitere Rollen-Informationen
      const enrichedRoles = roles.map(role => ({
        name: role.role,
        description: RoleService.getRoleDescription(role.role),
        level: RoleService.getRoleLevel(role.role),
        permission_count: role.permission_count,
        is_valid: RoleService.isValidRole(role.role)
      }));

      // Sortiere nach Hierarchie-Level
      enrichedRoles.sort((a, b) => b.level - a.level);

      return res.status(200).json({
        success: true,
        roles: enrichedRoles,
        count: enrichedRoles.length,
        hierarchy: RoleService.ROLE_HIERARCHY
      });

    } catch (error) {
      console.error('❌ Role Controller: Get all roles error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Abrufen der Rollen',
        code: 'GET_ALL_ROLES_ERROR'
      });
    }
  }

  /**
   * GET /api/roles/:role/permissions
   * Berechtigungen einer spezifischen Rolle abrufen
   */
  async getRolePermissions(req, res) {
    try {
      console.log('📥 Role Controller: Get role permissions request');

      const { role } = req.params;

      if (!role) {
        return res.status(400).json({
          success: false,
          error: 'Rolle ist erforderlich',
          code: 'MISSING_ROLE'
        });
      }

      if (!RoleService.isValidRole(role)) {
        return res.status(400).json({
          success: false,
          error: 'Ungültige Rolle',
          code: 'INVALID_ROLE'
        });
      }

      const permissions = await RoleService.getRolePermissions(role);

      return res.status(200).json({
        success: true,
        role: {
          name: role,
          description: RoleService.getRoleDescription(role),
          level: RoleService.getRoleLevel(role)
        },
        permissions: permissions,
        count: permissions.length
      });

    } catch (error) {
      console.error('❌ Role Controller: Get role permissions error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Abrufen der Rollen-Berechtigungen',
        code: 'GET_ROLE_PERMISSIONS_ERROR'
      });
    }
  }

  // =====================================================
  // BERECHTIGUNGS-VERWALTUNG
  // =====================================================

  /**
   * POST /api/roles/:role/permissions
   * Berechtigung zu einer Rolle hinzufügen (nur SuperAdmin)
   */
  async addRolePermission(req, res) {
    try {
      console.log('📥 Role Controller: Add role permission request');

      const { role } = req.params;
      const { permission, description } = req.body;

      // Validierung
      if (!role || !permission) {
        return res.status(400).json({
          success: false,
          error: 'Rolle und Berechtigung sind erforderlich',
          code: 'MISSING_ROLE_OR_PERMISSION'
        });
      }

      if (!RoleService.isValidRole(role)) {
        return res.status(400).json({
          success: false,
          error: 'Ungültige Rolle',
          code: 'INVALID_ROLE'
        });
      }

      // Berechtigung hinzufügen
      const result = await RoleService.addRolePermission(role, permission, description);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ Role Controller: Role permission added successfully');

      return res.status(201).json({
        success: true,
        message: 'Berechtigung erfolgreich hinzugefügt',
        permission: result.permission
      });

    } catch (error) {
      console.error('❌ Role Controller: Add role permission error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Hinzufügen der Berechtigung',
        code: 'ADD_ROLE_PERMISSION_ERROR'
      });
    }
  }

  /**
   * DELETE /api/roles/:role/permissions/:permission
   * Berechtigung von einer Rolle entfernen (nur SuperAdmin)
   */
  async removeRolePermission(req, res) {
    try {
      console.log('📥 Role Controller: Remove role permission request');

      const { role, permission } = req.params;

      // Validierung
      if (!role || !permission) {
        return res.status(400).json({
          success: false,
          error: 'Rolle und Berechtigung sind erforderlich',
          code: 'MISSING_ROLE_OR_PERMISSION'
        });
      }

      if (!RoleService.isValidRole(role)) {
        return res.status(400).json({
          success: false,
          error: 'Ungültige Rolle',
          code: 'INVALID_ROLE'
        });
      }

      // Berechtigung entfernen
      const result = await RoleService.removeRolePermission(role, permission);

      if (!result.success) {
        return res.status(400).json(result);
      }

      console.log('✅ Role Controller: Role permission removed successfully');

      return res.status(200).json({
        success: true,
        message: 'Berechtigung erfolgreich entfernt'
      });

    } catch (error) {
      console.error('❌ Role Controller: Remove role permission error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Entfernen der Berechtigung',
        code: 'REMOVE_ROLE_PERMISSION_ERROR'
      });
    }
  }

  // =====================================================
  // AUDIT & HISTORIE
  // =====================================================

  /**
   * GET /api/roles/change-log
   * Rollen-Änderungshistorie abrufen (SuperAdmin oder eigene)
   */
  async getRoleChangeLog(req, res) {
    try {
      console.log('📥 Role Controller: Get role change log request');

      const { 
        userId = null, 
        page = 1, 
        limit = 50 
      } = req.query;

      const offset = (page - 1) * limit;

      // Prüfe ob SuperAdmin oder nur eigene Änderungen
      const isSuperAdmin = await RoleService.hasRole(req.user.id, RoleService.ROLES.SUPERADMIN);
      const targetUserId = isSuperAdmin ? userId : req.user.id;

      const changes = await RoleService.getRoleChangeHistory(
        targetUserId, 
        parseInt(limit), 
        parseInt(offset)
      );

      return res.status(200).json({
        success: true,
        changes: changes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          count: changes.length,
          has_more: changes.length === parseInt(limit)
        },
        filters: {
          user_id: targetUserId,
          is_superadmin_view: isSuperAdmin
        }
      });

    } catch (error) {
      console.error('❌ Role Controller: Get role change log error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Abrufen der Rollen-Änderungshistorie',
        code: 'GET_ROLE_CHANGE_LOG_ERROR'
      });
    }
  }

  // =====================================================
  // UTILITY ENDPOINTS
  // =====================================================

  /**
   * GET /api/roles/check-permission/:permission
   * Prüft ob aktueller Benutzer eine spezifische Berechtigung hat
   */
  async checkPermission(req, res) {
    try {
      const { permission } = req.params;

      if (!permission) {
        return res.status(400).json({
          success: false,
          error: 'Berechtigung ist erforderlich',
          code: 'MISSING_PERMISSION'
        });
      }

      const hasPermission = await RoleService.hasPermission(req.user.id, permission);

      return res.status(200).json({
        success: true,
        has_permission: hasPermission,
        permission: permission,
        user_id: req.user.id
      });

    } catch (error) {
      console.error('❌ Role Controller: Check permission error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler bei Berechtigungsprüfung',
        code: 'CHECK_PERMISSION_ERROR'
      });
    }
  }

  /**
   * GET /api/roles/available-permissions
   * Liste aller verfügbaren Berechtigungen (nur SuperAdmin)
   */
  async getAvailablePermissions(req, res) {
    try {
      console.log('📥 Role Controller: Get available permissions request');

      const permissions = Object.entries(RoleService.PERMISSIONS).map(([key, value]) => ({
        key,
        value,
        category: value.split(':')[0],
        action: value.split(':')[1]
      }));

      // Gruppiere nach Kategorien
      const categories = permissions.reduce((acc, perm) => {
        if (!acc[perm.category]) {
          acc[perm.category] = [];
        }
        acc[perm.category].push(perm);
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        permissions: permissions,
        categories: categories,
        count: permissions.length
      });

    } catch (error) {
      console.error('❌ Role Controller: Get available permissions error:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Abrufen der verfügbaren Berechtigungen',
        code: 'GET_AVAILABLE_PERMISSIONS_ERROR'
      });
    }
  }

  /**
   * GET /api/roles/health
   * Gesundheitsprüfung des Rollen-Systems
   */
  async healthCheck(req, res) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          role_service: 'unknown',
          database: 'unknown',
          permissions: 'unknown'
        },
        statistics: {
          total_roles: 0,
          total_permissions: 0,
          active_users: 0
        }
      };

      // Test RoleService
      try {
        const roles = await RoleService.getAvailableRoles();
        health.services.role_service = 'healthy';
        health.statistics.total_roles = roles.length;
      } catch (error) {
        health.services.role_service = 'error';
      }

      // Test Permissions
      try {
        const permissions = await RoleService.getRolePermissions(RoleService.ROLES.SUPERADMIN);
        health.services.permissions = 'healthy';
        health.statistics.total_permissions = permissions.length;
      } catch (error) {
        health.services.permissions = 'error';
      }

      // Test Database
      try {
        const { data, error } = await supabaseAdmin
          .from('user_profiles')
          .select('count', { count: 'exact', head: true })
          .eq('is_active', true);
        
        health.services.database = error ? 'error' : 'healthy';
        health.statistics.active_users = data || 0;
      } catch (error) {
        health.services.database = 'error';
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
      console.error('❌ Role Controller: Health check error:', error);
      return res.status(503).json({
        success: false,
        error: 'Rollen-System-Gesundheitsprüfung fehlgeschlagen',
        code: 'HEALTH_CHECK_ERROR'
      });
    }
  }
}

export default new RoleController();
