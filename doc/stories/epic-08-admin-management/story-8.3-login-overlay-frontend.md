# Story 8.3: Login-Overlay Frontend

## 📋 **STORY DETAILS**

**Epic:** 8 - Admin-Management-System  
**Story ID:** 8.3  
**Titel:** Login-Overlay Frontend  
**Priorität:** HOCH  
**Aufwand:** 1 Woche  
**Abhängigkeiten:** Story 8.1 (Supabase Auth Integration), Story 8.2 (Custom Rollen-System)

---

## 🎯 **USER STORY**

**Als** Benutzer  
**möchte ich** mich über ein modernes Login-Overlay anmelden  
**damit** ich schnell und sicher Zugang zum Budget Manager 2025 erhalte.

---

## 📝 **BESCHREIBUNG**

Entwicklung eines professionellen Login-Overlay (Modal) für das Frontend mit modernem Design, Benutzerfreundlichkeit und Integration in das bestehende React-System. Das Overlay soll responsive sein und eine optimale User Experience bieten.

---

## ✅ **AKZEPTANZKRITERIEN**

### **UI/UX Design:**
- [ ] Modernes, professionelles Login-Overlay Design
- [ ] Responsive Design (Desktop, Tablet, Mobile)
- [ ] Konsistent mit Budget Manager 2025 Design-System
- [ ] Smooth Animationen (Fade-in/out, Loading-States)
- [ ] Accessibility-konform (WCAG 2.1 AA)

### **Funktionalität:**
- [ ] E-Mail + Passwort Login-Formular
- [ ] Passwort-Sichtbarkeit Toggle
- [ ] Form-Validierung (Client-side + Server-side)
- [ ] Loading-States während Login-Prozess
- [ ] Fehlerbehandlung und Benutzer-Feedback
- [ ] "Passwort vergessen" Link (für zukünftige Implementation)

### **Integration:**
- [ ] Integration mit Supabase Auth Service
- [ ] Automatische Weiterleitung nach erfolgreichem Login
- [ ] Session-Management im Frontend
- [ ] Logout-Funktionalität
- [ ] Auth-State Management (Zustand)

### **Security:**
- [ ] Sichere Passwort-Eingabe
- [ ] XSS-Schutz in Form-Inputs
- [ ] Rate Limiting Feedback
- [ ] Secure Session Handling

---

## 🔧 **TECHNISCHE SPEZIFIKATION**

### **Frontend Komponenten:**

#### **1. Login-Overlay Komponente**
```typescript
// frontend/src/components/auth/LoginOverlay.tsx
interface LoginOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Login-Logic, Form-Handling, Validation
};
```

#### **2. Auth-Service (Frontend)**
```typescript
// frontend/src/services/authService.ts
class AuthService {
  private supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw new Error(error.message);
    return data;
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }
}
```

#### **3. Auth-Store (Zustand)**
```typescript
// frontend/src/stores/authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await authService.login(email, password);
      
      // User-Profile von Backend abrufen
      const userProfile = await apiService.get('/api/auth/user');
      
      set({ 
        user: { ...response.user, ...userProfile.data },
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const userProfile = await apiService.get('/api/auth/user');
        set({ 
          user: { ...user, ...userProfile.data },
          isAuthenticated: true 
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      set({ isLoading: false });
    }
  }
}));
```

#### **4. Protected Route Komponente**
```typescript
// frontend/src/components/auth/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  fallback = <LoginPrompt />
}) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return fallback;
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <UnauthorizedMessage />;
  }

  return <>{children}</>;
};
```

### **Design Spezifikationen:**

#### **Login-Overlay Styling (Tailwind CSS)**
```css
/* Overlay-Backdrop */
.login-overlay-backdrop {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4;
  backdrop-filter: blur(4px);
}

/* Modal Container */
.login-modal {
  @apply bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative;
  animation: modalSlideIn 0.3s ease-out;
}

/* Form Styling */
.login-form-input {
  @apply w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200;
}

.login-form-button {
  @apply w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### **Form-Validierung:**
```typescript
// frontend/src/utils/authValidation.ts
export const validateLoginForm = (email: string, password: string) => {
  const errors: Record<string, string> = {};

  // E-Mail Validierung
  if (!email) {
    errors.email = 'E-Mail ist erforderlich';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Ungültige E-Mail-Adresse';
  }

  // Passwort Validierung
  if (!password) {
    errors.password = 'Passwort ist erforderlich';
  } else if (password.length < 8) {
    errors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

---

## 🎨 **DESIGN MOCKUP**

### **Login-Overlay Layout:**
```
┌─────────────────────────────────────┐
│           [X] Close                 │
│                                     │
│         Budget Manager 2025         │
│              Anmeldung              │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ E-Mail-Adresse                  ││
│  │ [email@example.com            ] ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Passwort                    [👁] ││
│  │ [••••••••••••••••••••••••••••] ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │         ANMELDEN                ││
│  └─────────────────────────────────┘│
│                                     │
│         Passwort vergessen?         │
│                                     │
└─────────────────────────────────────┘
```

---

## 🧪 **TESTS**

### **Unit Tests:**
- [ ] LoginOverlay Komponente Rendering
- [ ] Form-Validierung Logik
- [ ] AuthService Methoden
- [ ] AuthStore State-Management

### **Integration Tests:**
- [ ] Login-Flow End-to-End
- [ ] Fehlerbehandlung bei ungültigen Credentials
- [ ] Session-Management
- [ ] Logout-Funktionalität

### **E2E Tests:**
- [ ] Kompletter Login-Prozess im Browser
- [ ] Responsive Design auf verschiedenen Geräten
- [ ] Accessibility mit Screen-Reader
- [ ] Performance und Loading-States

---

## 📋 **DEFINITION OF DONE**

- [ ] Alle Akzeptanzkriterien erfüllt
- [ ] Code Review durchgeführt
- [ ] Unit Tests geschrieben und bestehen (>90% Coverage)
- [ ] Integration Tests bestehen
- [ ] E2E Tests bestehen
- [ ] Accessibility Tests bestehen
- [ ] Design Review mit UX-Team
- [ ] Cross-Browser Testing (Chrome, Firefox, Safari)
- [ ] Mobile Responsiveness getestet

---

## 🔗 **ABHÄNGIGKEITEN**

**Vor dieser Story:**
- Story 8.1: Supabase Auth Integration
- Story 8.2: Custom Rollen-System

**Nach dieser Story:**
- Story 8.4: SuperAdmin Benutzerverwaltung
- Story 8.5: Admin-Bereich Zugriffskontrolle

---

## 📝 **NOTIZEN**

- Design konsistent mit bestehendem Budget Manager 2025 UI
- Vorbereitung für zukünftige Microsoft OAuth Integration
- Performance-optimiert für schnelle Login-Erfahrung
- Accessibility als Priorität für alle Benutzer
- Mobile-First Approach für responsive Design
