// =====================================================
// Budget Manager 2025 - Role Service
// Epic 8 - Story 8.2: Custom Rollen-System
// =====================================================

import { supabaseAdmin } from '../config/database.js';

/**
 * RoleService - Zentrale Verwaltung für Rollen und Berechtigungen
 * Bietet granulare Berechtigungsprüfung und Rollen-Management
 */
class RoleService {
  
  // =====================================================
  // KONSTANTEN
  // =====================================================

  static ROLES = {
    SUPERADMIN: 'SUPERADMIN',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    USER: 'USER'
  };

  static PERMISSIONS = {
    // Admin-Bereich
    ADMIN_ACCESS: 'admin:access',
    USER_MANAGEMENT: 'admin:users',
    SYSTEM_SETTINGS: 'admin:settings',
    SYSTEM_LOGS: 'admin:logs',
    ROLE_MANAGEMENT: 'admin:roles',
    
    // Budget-Management
    BUDGET_READ: 'budget:read',
    BUDGET_WRITE: 'budget:write',
    BUDGET_DELETE: 'budget:delete',
    BUDGET_TRANSFER: 'budget:transfer',
    BUDGET_APPROVE: 'budget:approve',
    
    // Projekt-Management
    PROJECT_READ: 'project:read',
    PROJECT_WRITE: 'project:write',
    PROJECT_DELETE: 'project:delete',
    PROJECT_ASSIGN: 'project:assign',
    
    // OCR & Rechnungen
    OCR_UPLOAD: 'ocr:upload',
    OCR_REVIEW: 'ocr:review',
    OCR_APPROVE: 'ocr:approve',
    INVOICE_READ: 'invoice:read',
    INVOICE_WRITE: 'invoice:write',
    
    // Berichte & Analytics
    REPORTS_READ: 'reports:read',
    REPORTS_EXPORT: 'reports:export',
    ANALYTICS_READ: 'analytics:read'
  };

  // Rollen-Hierarchie (höhere Zahl = mehr Rechte)
  static ROLE_HIERARCHY = {
    [this.ROLES.USER]: 1,
    [this.ROLES.MANAGER]: 2,
    [this.ROLES.ADMIN]: 3,
    [this.ROLES.SUPERADMIN]: 4
  };

  // =====================================================
  // BERECHTIGUNGSPRÜFUNG
  // =====================================================

  /**
   * Prüft ob ein Benutzer eine bestimmte Berechtigung hat
   * @param {string} userId - Benutzer-ID
   * @param {string} permission - Erforderliche Berechtigung
   * @returns {Promise<boolean>} Hat Berechtigung
   */
  static async hasPermission(userId, permission) {
    try {
      console.log(`🔐 Role Service: Checking permission '${permission}' for user:`, userId);

      if (!userId || !permission) {
        console.log('❌ Role Service: Missing userId or permission');
        return false;
      }

      // Verwende die Datenbank-Funktion für optimale Performance
      const { data, error } = await supabaseAdmin
        .rpc('has_permission', {
          user_uuid: userId,
          required_permission: permission
        });

      if (error) {
        console.error('❌ Role Service: Error checking permission:', error);
        return false;
      }

      const hasPermission = data === true;
      console.log(`${hasPermission ? '✅' : '❌'} Role Service: Permission check result:`, hasPermission);
      
      return hasPermission;

    } catch (error) {
      console.error('❌ Role Service: Permission check error:', error);
      return false;
    }
  }

  /**
   * Prüft ob ein Benutzer eine bestimmte Rolle hat
   * @param {string} userId - Benutzer-ID
   * @param {string} requiredRole - Erforderliche Rolle
   * @returns {Promise<boolean>} Hat Rolle
   */
  static async hasRole(userId, requiredRole) {
    try {
      console.log(`🔐 Role Service: Checking role '${requiredRole}' for user:`, userId);

      const userProfile = await this.getUserProfile(userId);
      
      if (!userProfile) {
        console.log('❌ Role Service: User profile not found');
        return false;
      }

      const hasRole = userProfile.role === requiredRole;
      console.log(`${hasRole ? '✅' : '❌'} Role Service: Role check result:`, hasRole);
      
      return hasRole;

    } catch (error) {
      console.error('❌ Role Service: Role check error:', error);
      return false;
    }
  }

  /**
   * Prüft ob ein Benutzer mindestens eine bestimmte Rolle hat (Hierarchie)
   * @param {string} userId - Benutzer-ID
   * @param {string} minRole - Mindest-Rolle
   * @returns {Promise<boolean>} Hat mindestens die Rolle
   */
  static async hasMinRole(userId, minRole) {
    try {
      const userProfile = await this.getUserProfile(userId);
      
      if (!userProfile) {
        return false;
      }

      const userRoleLevel = this.ROLE_HIERARCHY[userProfile.role] || 0;
      const minRoleLevel = this.ROLE_HIERARCHY[minRole] || 0;

      return userRoleLevel >= minRoleLevel;

    } catch (error) {
      console.error('❌ Role Service: Min role check error:', error);
      return false;
    }
  }

  /**
   * Prüft mehrere Berechtigungen gleichzeitig
   * @param {string} userId - Benutzer-ID
   * @param {Array<string>} permissions - Liste der Berechtigungen
   * @param {boolean} requireAll - Alle oder nur eine Berechtigung erforderlich
   * @returns {Promise<boolean>} Hat Berechtigungen
   */
  static async hasPermissions(userId, permissions, requireAll = true) {
    try {
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return false;
      }

      const results = await Promise.all(
        permissions.map(permission => this.hasPermission(userId, permission))
      );

      return requireAll ? results.every(Boolean) : results.some(Boolean);

    } catch (error) {
      console.error('❌ Role Service: Multiple permissions check error:', error);
      return false;
    }
  }

  // =====================================================
  // BENUTZER-VERWALTUNG
  // =====================================================

  /**
   * Holt das Benutzerprofil
   * @param {string} userId - Benutzer-ID
   * @returns {Promise<Object|null>} Benutzerprofil
   */
  static async getUserProfile(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not "not found" error
          console.error('❌ Role Service: Error getting user profile:', error);
        }
        return null;
      }

      return data;

    } catch (error) {
      console.error('❌ Role Service: Get user profile error:', error);
      return null;
    }
  }

  /**
   * Holt alle Berechtigungen eines Benutzers
   * @param {string} userId - Benutzer-ID
   * @returns {Promise<Array>} Liste der Berechtigungen
   */
  static async getUserPermissions(userId) {
    try {
      console.log('🔐 Role Service: Getting permissions for user:', userId);

      const { data, error } = await supabaseAdmin
        .rpc('get_user_permissions', {
          user_uuid: userId
        });

      if (error) {
        console.error('❌ Role Service: Error getting user permissions:', error);
        return [];
      }

      console.log('✅ Role Service: User permissions retrieved:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('❌ Role Service: Get user permissions error:', error);
      return [];
    }
  }

  /**
   * Ändert die Rolle eines Benutzers
   * @param {string} userId - Benutzer-ID
   * @param {string} newRole - Neue Rolle
   * @param {string} changedBy - ID des Benutzers der die Änderung vornimmt
   * @param {string} reason - Grund für die Änderung
   * @param {string} ipAddress - IP-Adresse
   * @param {string} userAgent - User Agent
   * @returns {Promise<Object>} Ergebnis der Änderung
   */
  static async changeUserRole(userId, newRole, changedBy, reason = null, ipAddress = null, userAgent = null) {
    try {
      console.log(`🔐 Role Service: Changing role for user ${userId} to ${newRole}`);

      // Validiere neue Rolle
      if (!Object.values(this.ROLES).includes(newRole)) {
        return {
          success: false,
          error: 'Ungültige Rolle',
          code: 'INVALID_ROLE'
        };
      }

      // Prüfe ob der Benutzer existiert
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        return {
          success: false,
          error: 'Benutzer nicht gefunden',
          code: 'USER_NOT_FOUND'
        };
      }

      // Prüfe ob sich die Rolle tatsächlich ändert
      if (userProfile.role === newRole) {
        return {
          success: true,
          message: 'Rolle bereits gesetzt',
          user: userProfile
        };
      }

      // Verhindere Selbst-Degradierung von SuperAdmin
      if (userId === changedBy && userProfile.role === this.ROLES.SUPERADMIN && newRole !== this.ROLES.SUPERADMIN) {
        return {
          success: false,
          error: 'SuperAdmin kann sich nicht selbst degradieren',
          code: 'SELF_DEMOTION_DENIED'
        };
      }

      // Aktualisiere die Rolle
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Role Service: Error updating user role:', error);
        return {
          success: false,
          error: 'Fehler beim Aktualisieren der Rolle',
          code: 'UPDATE_ERROR'
        };
      }

      // Manuell Rollen-Änderung loggen (zusätzlich zum Trigger)
      await this.logRoleChange(userId, userProfile.role, newRole, changedBy, reason, ipAddress, userAgent);

      console.log('✅ Role Service: Role changed successfully');

      return {
        success: true,
        message: 'Rolle erfolgreich geändert',
        user: data
      };

    } catch (error) {
      console.error('❌ Role Service: Change user role error:', error);
      return {
        success: false,
        error: 'Fehler beim Ändern der Rolle',
        code: 'ROLE_CHANGE_ERROR'
      };
    }
  }

  // =====================================================
  // ROLLEN-VERWALTUNG
  // =====================================================

  /**
   * Holt alle verfügbaren Rollen
   * @returns {Promise<Array>} Liste der Rollen
   */
  static async getAvailableRoles() {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_available_roles');

      if (error) {
        console.error('❌ Role Service: Error getting available roles:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ Role Service: Get available roles error:', error);
      return [];
    }
  }

  /**
   * Holt alle Berechtigungen einer Rolle
   * @param {string} role - Rolle
   * @returns {Promise<Array>} Liste der Berechtigungen
   */
  static async getRolePermissions(role) {
    try {
      const { data, error } = await supabaseAdmin
        .from('role_permissions')
        .select('permission, description')
        .eq('role', role)
        .eq('is_active', true)
        .order('permission');

      if (error) {
        console.error('❌ Role Service: Error getting role permissions:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ Role Service: Get role permissions error:', error);
      return [];
    }
  }

  /**
   * Fügt eine Berechtigung zu einer Rolle hinzu
   * @param {string} role - Rolle
   * @param {string} permission - Berechtigung
   * @param {string} description - Beschreibung
   * @returns {Promise<Object>} Ergebnis
   */
  static async addRolePermission(role, permission, description = null) {
    try {
      const { data, error } = await supabaseAdmin
        .from('role_permissions')
        .insert({
          role,
          permission,
          description,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Role Service: Error adding role permission:', error);
        return {
          success: false,
          error: 'Fehler beim Hinzufügen der Berechtigung',
          code: 'ADD_PERMISSION_ERROR'
        };
      }

      return {
        success: true,
        message: 'Berechtigung erfolgreich hinzugefügt',
        permission: data
      };

    } catch (error) {
      console.error('❌ Role Service: Add role permission error:', error);
      return {
        success: false,
        error: 'Fehler beim Hinzufügen der Berechtigung',
        code: 'ADD_PERMISSION_ERROR'
      };
    }
  }

  /**
   * Entfernt eine Berechtigung von einer Rolle
   * @param {string} role - Rolle
   * @param {string} permission - Berechtigung
   * @returns {Promise<Object>} Ergebnis
   */
  static async removeRolePermission(role, permission) {
    try {
      const { error } = await supabaseAdmin
        .from('role_permissions')
        .update({ is_active: false })
        .eq('role', role)
        .eq('permission', permission);

      if (error) {
        console.error('❌ Role Service: Error removing role permission:', error);
        return {
          success: false,
          error: 'Fehler beim Entfernen der Berechtigung',
          code: 'REMOVE_PERMISSION_ERROR'
        };
      }

      return {
        success: true,
        message: 'Berechtigung erfolgreich entfernt'
      };

    } catch (error) {
      console.error('❌ Role Service: Remove role permission error:', error);
      return {
        success: false,
        error: 'Fehler beim Entfernen der Berechtigung',
        code: 'REMOVE_PERMISSION_ERROR'
      };
    }
  }

  // =====================================================
  // AUDIT & LOGGING
  // =====================================================

  /**
   * Loggt eine Rollen-Änderung
   * @param {string} userId - Benutzer-ID
   * @param {string} oldRole - Alte Rolle
   * @param {string} newRole - Neue Rolle
   * @param {string} changedBy - ID des Benutzers der die Änderung vornimmt
   * @param {string} reason - Grund
   * @param {string} ipAddress - IP-Adresse
   * @param {string} userAgent - User Agent
   * @returns {Promise<void>}
   */
  static async logRoleChange(userId, oldRole, newRole, changedBy, reason = null, ipAddress = null, userAgent = null) {
    try {
      await supabaseAdmin
        .from('role_change_log')
        .insert({
          user_id: userId,
          old_role: oldRole,
          new_role: newRole,
          changed_by: changedBy,
          reason,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: {
            timestamp: new Date().toISOString(),
            old_role: oldRole,
            new_role: newRole
          }
        });

    } catch (error) {
      console.error('❌ Role Service: Error logging role change:', error);
      // Don't throw - logging failures shouldn't break role changes
    }
  }

  /**
   * Holt die Rollen-Änderungshistorie
   * @param {string} userId - Benutzer-ID (optional)
   * @param {number} limit - Anzahl der Einträge
   * @param {number} offset - Offset für Paginierung
   * @returns {Promise<Array>} Änderungshistorie
   */
  static async getRoleChangeHistory(userId = null, limit = 50, offset = 0) {
    try {
      let query = supabaseAdmin
        .from('role_change_log')
        .select(`
          *,
          user_profiles!role_change_log_user_id_fkey (
            email,
            first_name,
            last_name
          ),
          changed_by_profile:user_profiles!role_change_log_changed_by_fkey (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Role Service: Error getting role change history:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ Role Service: Get role change history error:', error);
      return [];
    }
  }

  // =====================================================
  // UTILITY FUNKTIONEN
  // =====================================================

  /**
   * Validiert eine Rolle
   * @param {string} role - Rolle
   * @returns {boolean} Ist gültig
   */
  static isValidRole(role) {
    return Object.values(this.ROLES).includes(role);
  }

  /**
   * Validiert eine Berechtigung
   * @param {string} permission - Berechtigung
   * @returns {boolean} Ist gültig
   */
  static isValidPermission(permission) {
    return Object.values(this.PERMISSIONS).includes(permission);
  }

  /**
   * Holt die Rollen-Hierarchie-Stufe
   * @param {string} role - Rolle
   * @returns {number} Hierarchie-Stufe
   */
  static getRoleLevel(role) {
    return this.ROLE_HIERARCHY[role] || 0;
  }

  /**
   * Prüft ob Rolle A höher als Rolle B ist
   * @param {string} roleA - Rolle A
   * @param {string} roleB - Rolle B
   * @returns {boolean} Ist höher
   */
  static isRoleHigher(roleA, roleB) {
    return this.getRoleLevel(roleA) > this.getRoleLevel(roleB);
  }

  /**
   * Holt eine benutzerfreundliche Rollen-Beschreibung
   * @param {string} role - Rolle
   * @returns {string} Beschreibung
   */
  static getRoleDescription(role) {
    const descriptions = {
      [this.ROLES.SUPERADMIN]: 'Super Administrator - Vollzugriff auf alle Funktionen',
      [this.ROLES.ADMIN]: 'Administrator - Erweiterte Verwaltungsrechte',
      [this.ROLES.MANAGER]: 'Manager - Projekt- und Team-Management',
      [this.ROLES.USER]: 'Benutzer - Basis Budget-Management'
    };

    return descriptions[role] || 'Unbekannte Rolle';
  }
}

export default RoleService;
