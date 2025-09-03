# Story 8.1: Supabase Auth Integration

## 📋 **STORY DETAILS**

**Epic:** 8 - Admin-Management-System  
**Story ID:** 8.1  
**Titel:** Supabase Auth Integration  
**Priorität:** HOCH  
**Aufwand:** 1 Woche  
**Abhängigkeiten:** Keine

---

## 🎯 **USER STORY**

**Als** System-Administrator  
**möchte ich** eine sichere Authentifizierung über Supabase Auth  
**damit** Benutzer sich sicher anmelden können und Sessions verwaltet werden.

---

## 📝 **BESCHREIBUNG**

Integration von Supabase Auth in das Budget Manager 2025 System für sichere Benutzer-Authentifizierung. Das System soll E-Mail+Passwort Login unterstützen und für zukünftige Microsoft OAuth-Integration vorbereitet sein.

---

## ✅ **AKZEPTANZKRITERIEN**

### **Backend Integration:**
- [ ] Supabase Auth Client konfiguriert und initialisiert
- [ ] Auth-Middleware für geschützte Routen implementiert
- [ ] JWT-Token Validierung funktioniert
- [ ] Session-Management über Supabase Auth
- [ ] Passwort-Anforderungen nach internationalen Standards
- [ ] E-Mail-Verifikation aktiviert (optional für MVP)

### **Datenbank Schema:**
- [ ] `auth.users` Tabelle von Supabase genutzt
- [ ] Custom `user_profiles` Tabelle für zusätzliche Daten
- [ ] Foreign Key Beziehung zwischen `auth.users` und `user_profiles`
- [ ] RLS Policies für `user_profiles` implementiert

### **API Endpoints:**
- [ ] `POST /api/auth/login` - Benutzer-Anmeldung
- [ ] `POST /api/auth/logout` - Benutzer-Abmeldung
- [ ] `GET /api/auth/user` - Aktueller Benutzer abrufen
- [ ] `POST /api/auth/refresh` - Token erneuern
- [ ] Fehlerbehandlung für ungültige Credentials

### **Sicherheit:**
- [ ] Passwort-Mindestlänge: 8 Zeichen
- [ ] Passwort muss enthalten: Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen
- [ ] Rate Limiting für Login-Versuche (5 Versuche/10 Min)
- [ ] Sichere Session-Cookies
- [ ] CSRF-Schutz implementiert
- [ ] **Multi-Faktor-Authentifizierung (MFA)** mit TOTP (Google Authenticator)
- [ ] **IP-Whitelist** für Admin-Zugriffe (optional)
- [ ] **JWT-Token** mit kurzer Lebensdauer (15 Min) und Auto-Refresh
- [ ] **Audit-Trail** für alle Authentifizierungs-Ereignisse

---

## 🔧 **TECHNISCHE SPEZIFIKATION**

### **Backend Komponenten:**

#### **1. Supabase Auth Service**
```javascript
// backend/src/services/authService.js
class AuthService {
  constructor() {
    this.supabase = supabaseClient;
  }
  
  async signIn(email, password) { /* ... */ }
  async signOut(token) { /* ... */ }
  async getUser(token) { /* ... */ }
  async refreshToken(refreshToken) { /* ... */ }
}
```

#### **2. Auth Middleware**
```javascript
// backend/src/middleware/authMiddleware.js
export const requireAuth = async (req, res, next) => {
  // JWT Token Validierung
  // User-Daten in req.user setzen
};

export const requireSuperAdmin = async (req, res, next) => {
  // SuperAdmin-Rolle prüfen
};
```

#### **3. Auth Routes**
```javascript
// backend/src/routes/authRoutes.js
router.post('/login', authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/user', requireAuth, authController.getUser);
router.post('/refresh', authController.refreshToken);
```

### **Datenbank Migration:**

#### **Migration: `16_setup_supabase_auth.sql`**
```sql
-- User Profiles Tabelle für zusätzliche Daten
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('SUPERADMIN', 'USER')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "SuperAdmins can view all profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'SUPERADMIN'
    )
  );

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON public.user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Erster SuperAdmin (wird später über Seeding erstellt)
-- INSERT INTO auth.users wird über Supabase Auth API gemacht
```

### **Environment Variablen:**
```env
# Bereits vorhanden in .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Neue Variablen
JWT_SECRET=your-jwt-secret
SESSION_TIMEOUT=86400000  # 24 Stunden in ms
```

---

## 🧪 **TESTS**

### **Unit Tests:**
- [ ] AuthService Methoden testen
- [ ] Auth Middleware Funktionalität
- [ ] Passwort-Validierung
- [ ] Token-Generierung und -Validierung

### **Integration Tests:**
- [ ] Login/Logout Flow
- [ ] Geschützte Routen Zugriff
- [ ] Token Refresh Mechanismus
- [ ] Fehlerbehandlung bei ungültigen Credentials

### **Security Tests:**
- [ ] SQL Injection Schutz
- [ ] XSS Schutz
- [ ] Rate Limiting funktioniert
- [ ] Session Hijacking Schutz

---

## 📋 **DEFINITION OF DONE**

- [ ] Alle Akzeptanzkriterien erfüllt
- [ ] Code Review durchgeführt
- [ ] Unit Tests geschrieben und bestehen (>90% Coverage)
- [ ] Integration Tests bestehen
- [ ] Security Tests bestehen
- [ ] Dokumentation aktualisiert
- [ ] Migration erfolgreich ausgeführt
- [ ] Manueller Test auf Staging-Umgebung erfolgreich

---

## 🔗 **ABHÄNGIGKEITEN**

**Vor dieser Story:**
- Keine

**Nach dieser Story:**
- Story 8.2: Custom Rollen-System
- Story 8.3: Login-Overlay Frontend

---

## 📝 **NOTIZEN**

- Supabase Auth ist bereits im Projekt konfiguriert
- Bestehende `users` Tabelle muss eventuell migriert werden
- Microsoft OAuth Integration für zukünftige Stories vorbereiten
- Rate Limiting kann über Supabase Edge Functions implementiert werden
