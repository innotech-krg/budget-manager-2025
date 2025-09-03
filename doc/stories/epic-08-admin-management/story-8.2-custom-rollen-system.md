# Story 8.2: Custom Rollen-System

## 📋 **STORY DETAILS**

**Epic:** 8 - Admin-Management-System  
**Story ID:** 8.2  
**Titel:** Custom Rollen-System  
**Priorität:** HOCH  
**Aufwand:** 1 Woche  
**Abhängigkeiten:** Story 8.1 (Supabase Auth Integration)

---

## 🎯 **USER STORY**

**Als** System-Administrator  
**möchte ich** ein flexibles Rollen- und Berechtigungssystem  
**damit** ich verschiedene Benutzertypen mit unterschiedlichen Zugriffsrechten verwalten kann.

---

## 📝 **BESCHREIBUNG**

Implementierung eines erweiterbaren Rollen-Systems, das auf Supabase Auth aufbaut. Das System soll zunächst SuperAdmin und User-Rollen unterstützen und für zukünftige Erweiterungen (Admin, Manager, etc.) vorbereitet sein.

---

## ✅ **AKZEPTANZKRITERIEN**

### **Rollen-Definition:**
- [ ] **SuperAdmin:** Vollzugriff auf alle Funktionen + Benutzerverwaltung
- [ ] **User:** Nur Budget-Management, kein Admin-Bereich Zugriff
- [ ] System erweiterbar für zukünftige Rollen (Admin, Manager, etc.)
- [ ] Rollen-Hierarchie definiert und implementiert

### **Backend Implementation:**
- [ ] Rollen-Service für Berechtigungsprüfung
- [ ] Middleware für rollenbasierte Zugriffskontrolle
- [ ] API-Endpoints für Rollen-Management
- [ ] Automatische Rollen-Zuweisung bei Benutzer-Erstellung

### **Datenbank Schema:**
- [ ] Erweiterte `user_profiles` Tabelle mit Rollen-Feld
- [ ] Berechtigungs-Matrix in der Datenbank
- [ ] RLS Policies basierend auf Rollen
- [ ] Audit-Log für Rollen-Änderungen

### **Berechtigungen:**
- [ ] Admin-Bereich: Nur SuperAdmin
- [ ] Benutzerverwaltung: Nur SuperAdmin
- [ ] System-Einstellungen: Nur SuperAdmin
- [ ] Budget-Management: SuperAdmin + User
- [ ] OCR-Upload: SuperAdmin + User

---

## 🔧 **TECHNISCHE SPEZIFIKATION**

### **Backend Komponenten:**

#### **1. Rollen-Service**
```javascript
// backend/src/services/roleService.js
class RoleService {
  static ROLES = {
    SUPERADMIN: 'SUPERADMIN',
    USER: 'USER'
    // Zukünftig: ADMIN: 'ADMIN', MANAGER: 'MANAGER'
  };

  static PERMISSIONS = {
    // Admin-Bereich
    ADMIN_ACCESS: 'admin:access',
    USER_MANAGEMENT: 'admin:users',
    SYSTEM_SETTINGS: 'admin:settings',
    
    // Budget-Management
    BUDGET_READ: 'budget:read',
    BUDGET_WRITE: 'budget:write',
    
    // OCR
    OCR_UPLOAD: 'ocr:upload',
    OCR_REVIEW: 'ocr:review'
  };

  static getRolePermissions(role) {
    const permissions = {
      [this.ROLES.SUPERADMIN]: [
        // Alle Berechtigungen
        ...Object.values(this.PERMISSIONS)
      ],
      [this.ROLES.USER]: [
        this.PERMISSIONS.BUDGET_READ,
        this.PERMISSIONS.BUDGET_WRITE,
        this.PERMISSIONS.OCR_UPLOAD,
        this.PERMISSIONS.OCR_REVIEW
      ]
    };
    
    return permissions[role] || [];
  }

  static hasPermission(userRole, requiredPermission) {
    const userPermissions = this.getRolePermissions(userRole);
    return userPermissions.includes(requiredPermission);
  }
}
```

#### **2. Berechtigungs-Middleware**
```javascript
// backend/src/middleware/permissionMiddleware.js
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = req.user; // Aus authMiddleware
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Nicht authentifiziert'
        });
      }

      const hasPermission = RoleService.hasPermission(user.role, permission);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Keine Berechtigung für diese Aktion'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Fehler bei Berechtigungsprüfung'
      });
    }
  };
};

// Convenience-Middlewares
export const requireSuperAdmin = requirePermission(RoleService.PERMISSIONS.ADMIN_ACCESS);
export const requireUserManagement = requirePermission(RoleService.PERMISSIONS.USER_MANAGEMENT);
```

#### **3. Rollen-Controller**
```javascript
// backend/src/controllers/roleController.js
class RoleController {
  async getUserRole(req, res) {
    // Aktuelle Benutzer-Rolle abrufen
  }

  async updateUserRole(req, res) {
    // Benutzer-Rolle ändern (nur SuperAdmin)
  }

  async getRolePermissions(req, res) {
    // Berechtigungen einer Rolle abrufen
  }

  async getAllRoles(req, res) {
    // Alle verfügbaren Rollen auflisten
  }
}
```

### **Datenbank Erweiterung:**

#### **Migration: `17_extend_user_roles.sql`**
```sql
-- Erweiterte Rollen-Enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'MANAGER';

-- Oder falls noch nicht existiert:
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SUPERADMIN', 'ADMIN', 'MANAGER', 'USER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- User Profiles Tabelle erweitern
ALTER TABLE public.user_profiles 
  ALTER COLUMN role TYPE user_role USING role::user_role;

-- Berechtigungs-Matrix Tabelle
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission)
);

-- Standard-Berechtigungen einfügen
INSERT INTO public.role_permissions (role, permission) VALUES
  -- SuperAdmin Berechtigungen
  ('SUPERADMIN', 'admin:access'),
  ('SUPERADMIN', 'admin:users'),
  ('SUPERADMIN', 'admin:settings'),
  ('SUPERADMIN', 'budget:read'),
  ('SUPERADMIN', 'budget:write'),
  ('SUPERADMIN', 'ocr:upload'),
  ('SUPERADMIN', 'ocr:review'),
  
  -- User Berechtigungen
  ('USER', 'budget:read'),
  ('USER', 'budget:write'),
  ('USER', 'ocr:upload'),
  ('USER', 'ocr:review');

-- RLS für role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins can manage role permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'SUPERADMIN'
    )
  );

CREATE POLICY "Users can view their role permissions" ON public.role_permissions
  FOR SELECT USING (
    role = (
      SELECT up.role FROM public.user_profiles up 
      WHERE up.id = auth.uid()
    )
  );

-- Audit-Log für Rollen-Änderungen
CREATE TABLE public.role_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id),
  old_role user_role,
  new_role user_role NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.user_profiles(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS für role_change_log
ALTER TABLE public.role_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins can view all role changes" ON public.role_change_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'SUPERADMIN'
    )
  );

-- Trigger für Rollen-Änderungen
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.role_change_log (user_id, old_role, new_role, changed_by, reason)
    VALUES (NEW.id, OLD.role, NEW.role, auth.uid(), 'Role updated via system');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_role_change
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_role_change();
```

### **API Routes:**
```javascript
// backend/src/routes/roleRoutes.js
router.get('/my-role', requireAuth, roleController.getUserRole);
router.get('/permissions', requireAuth, roleController.getRolePermissions);
router.get('/all-roles', requireSuperAdmin, roleController.getAllRoles);
router.put('/user/:userId/role', requireUserManagement, roleController.updateUserRole);
router.get('/change-log', requireSuperAdmin, roleController.getRoleChangeLog);
```

---

## 🧪 **TESTS**

### **Unit Tests:**
- [ ] RoleService Berechtigungsprüfung
- [ ] Middleware Funktionalität
- [ ] Rollen-Hierarchie Logik
- [ ] Berechtigungs-Matrix Validierung

### **Integration Tests:**
- [ ] API-Endpoints mit verschiedenen Rollen
- [ ] RLS Policies funktionieren korrekt
- [ ] Rollen-Änderung Audit-Log
- [ ] Berechtigungs-Vererbung

### **Security Tests:**
- [ ] Privilege Escalation Schutz
- [ ] Rollen-Bypass Versuche
- [ ] Unauthorized Access Prevention
- [ ] Audit-Log Manipulation Schutz

---

## 📋 **DEFINITION OF DONE**

- [ ] Alle Akzeptanzkriterien erfüllt
- [ ] Code Review durchgeführt
- [ ] Unit Tests geschrieben und bestehen (>90% Coverage)
- [ ] Integration Tests bestehen
- [ ] Security Tests bestehen
- [ ] Dokumentation aktualisiert
- [ ] Migration erfolgreich ausgeführt
- [ ] Rollen-System in Admin-Bereich testbar

---

## 🔗 **ABHÄNGIGKEITEN**

**Vor dieser Story:**
- Story 8.1: Supabase Auth Integration

**Nach dieser Story:**
- Story 8.3: Login-Overlay Frontend
- Story 8.4: SuperAdmin Benutzerverwaltung
- Story 8.5: Admin-Bereich Zugriffskontrolle

---

## 📝 **NOTIZEN**

- System für zukünftige Rollen-Erweiterungen vorbereiten
- Berechtigungs-Matrix flexibel und erweiterbar gestalten
- Audit-Log für Compliance-Anforderungen
- Performance bei Berechtigungsprüfungen beachten
