// =====================================================
// Budget Manager 2025 - Role Routes
// Epic 8 - Story 8.2: Custom Rollen-System
// =====================================================

import express from 'express';
import roleController from '../controllers/roleController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { 
  requireAdminAccess,
  requireUserManagement,
  requireRoleManagement,
  requireSuperAdminRole,
  loadUserPermissions,
  addPermissionsToResponse
} from '../middleware/permissionMiddleware.js';

const router = express.Router();

// =====================================================
// MIDDLEWARE SETUP
// =====================================================

// Alle Routes erfordern Authentifizierung
router.use(requireAuth);

// Lade Benutzer-Berechtigungen für alle Routes
router.use(loadUserPermissions);

// Füge Berechtigungen zu Response-Header hinzu
router.use(addPermissionsToResponse);

// =====================================================
// BENUTZER-ROLLEN ROUTES
// =====================================================

/**
 * GET /api/roles/my-role
 * Aktuelle Benutzer-Rolle abrufen
 * Berechtigung: Authentifiziert
 */
router.get('/my-role', roleController.getUserRole);

/**
 * GET /api/roles/permissions
 * Berechtigungen des aktuellen Benutzers abrufen
 * Berechtigung: Authentifiziert
 */
router.get('/permissions', roleController.getUserPermissions);

/**
 * GET /api/roles/check-permission/:permission
 * Prüft ob aktueller Benutzer eine spezifische Berechtigung hat
 * Berechtigung: Authentifiziert
 */
router.get('/check-permission/:permission', roleController.checkPermission);

// =====================================================
// ROLLEN-VERWALTUNG ROUTES (SuperAdmin only)
// =====================================================

/**
 * GET /api/roles/all-roles
 * Alle verfügbaren Rollen auflisten
 * Berechtigung: SuperAdmin
 */
router.get('/all-roles', requireSuperAdminRole, roleController.getAllRoles);

/**
 * GET /api/roles/:role/permissions
 * Berechtigungen einer spezifischen Rolle abrufen
 * Berechtigung: Admin-Zugriff
 */
router.get('/:role/permissions', requireAdminAccess, roleController.getRolePermissions);

/**
 * GET /api/roles/available-permissions
 * Liste aller verfügbaren Berechtigungen
 * Berechtigung: SuperAdmin
 */
router.get('/available-permissions', requireSuperAdminRole, roleController.getAvailablePermissions);

// =====================================================
// BENUTZER-ROLLEN-MANAGEMENT ROUTES
// =====================================================

/**
 * PUT /api/roles/user/:userId/role
 * Benutzer-Rolle ändern
 * Berechtigung: Benutzerverwaltung
 */
router.put('/user/:userId/role', requireUserManagement, roleController.updateUserRole);

// =====================================================
// BERECHTIGUNGS-VERWALTUNG ROUTES (SuperAdmin only)
// =====================================================

/**
 * POST /api/roles/:role/permissions
 * Berechtigung zu einer Rolle hinzufügen
 * Berechtigung: Rollen-Management
 */
router.post('/:role/permissions', requireRoleManagement, roleController.addRolePermission);

/**
 * DELETE /api/roles/:role/permissions/:permission
 * Berechtigung von einer Rolle entfernen
 * Berechtigung: Rollen-Management
 */
router.delete('/:role/permissions/:permission', requireRoleManagement, roleController.removeRolePermission);

// =====================================================
// AUDIT & HISTORIE ROUTES
// =====================================================

/**
 * GET /api/roles/change-log
 * Rollen-Änderungshistorie abrufen
 * Berechtigung: Authentifiziert (eigene) oder SuperAdmin (alle)
 */
router.get('/change-log', roleController.getRoleChangeLog);

// =====================================================
// SYSTEM ROUTES
// =====================================================

/**
 * GET /api/roles/health
 * Gesundheitsprüfung des Rollen-Systems
 * Berechtigung: Admin-Zugriff
 */
router.get('/health', requireAdminAccess, roleController.healthCheck);

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler für unbekannte Role-Routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rollen-Endpoint nicht gefunden',
    code: 'ROLE_ENDPOINT_NOT_FOUND',
    available_endpoints: [
      'GET /api/roles/my-role',
      'GET /api/roles/permissions',
      'GET /api/roles/check-permission/:permission',
      'GET /api/roles/all-roles',
      'GET /api/roles/:role/permissions',
      'GET /api/roles/available-permissions',
      'PUT /api/roles/user/:userId/role',
      'POST /api/roles/:role/permissions',
      'DELETE /api/roles/:role/permissions/:permission',
      'GET /api/roles/change-log',
      'GET /api/roles/health'
    ]
  });
});

export default router;
