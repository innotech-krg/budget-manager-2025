// =====================================================
// Budget Manager 2025 - Auth Provider Component
// Epic 8 - Story 8.3: Login-Overlay Frontend
// Konsolidiert mit bewährten Learnings aus SimpleAuthProvider
// =====================================================

import React, { useState, useEffect, createContext, useContext } from 'react';
import LoginOverlay from './LoginOverlay';
import { apiService } from '../../services/apiService';

// Types
interface User {
  id: string;
  email: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    role: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // 🔧 NEW: Indicates auth check is complete
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  showLogin: () => void;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

// Context
const AuthContext = createContext<AuthContextType | null>(null);

// Hook für Auth-Zugriff
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * AuthProvider - Vollständiger Auth Provider mit bewährten Learnings
 * - Direkte API-Integration ohne Store-Komplexität
 * - Automatische Token-Erneuerung
 * - Event-basierte Session-Verwaltung
 * - Robuste Fehlerbehandlung
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // 🔧 NEW: Auth check completed
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);

  const isAuthenticated = !!user;

  // =====================================================
  // EFFECTS
  // =====================================================

  // Initialize authentication on app start
  useEffect(() => {
    checkAuth();
    
    // Listen for token expiration events
    const handleTokenExpired = () => {
      console.log('🔑 Token expired event received');
      setUser(null);
      setShowLoginOverlay(true);
    };
    
    window.addEventListener('auth-token-expired', handleTokenExpired);
    
    return () => {
      window.removeEventListener('auth-token-expired', handleTokenExpired);
    };
  }, []);

  // =====================================================
  // AUTH METHODS
  // =====================================================

  const checkAuth = async () => {
    try {
      console.log('🔐 AuthProvider: Starting auth check...');
      
      // Check if we have a stored token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('🔑 AuthProvider: No token found, showing login');
        setIsLoading(false);
        setShowLoginOverlay(true);
        return;
      }

      console.log('🔑 AuthProvider: Token found, setting in apiService');
      // Set token in apiService IMMEDIATELY
      apiService.setAuthToken(token);

      // Verify token with backend (with timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch('http://localhost:3001/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          console.log('✅ AuthProvider: User authenticated successfully');
          setUser(data.user);
        } else {
          console.log('❌ AuthProvider: Invalid user data, clearing auth');
          localStorage.removeItem('auth_token');
          apiService.clearAuthToken();
          setShowLoginOverlay(true);
        }
      } else {
        console.log('🔑 AuthProvider: Token expired or invalid, clearing auth');
        localStorage.removeItem('auth_token');
        apiService.clearAuthToken();
        setUser(null);
        setShowLoginOverlay(true);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Auth check timed out after 5s - backend not available');
      } else {
        console.error('Auth check failed:', error);
      }
      // Clear invalid token and show login
      localStorage.removeItem('auth_token');
      apiService.clearAuthToken();
      setUser(null);
      setShowLoginOverlay(true);
    } finally {
      setIsLoading(false);
      setIsInitialized(true); // 🔧 NEW: Mark auth check as complete
      console.log('✅ AuthProvider: Auth check completed');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for login
      
      const response = await fetch('http://localhost:3001/api/auth/login', {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Anmeldefehler');
      }

      // Store token and set in apiService
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        apiService.setAuthToken(data.token);
      }

      // Set user
      setUser(data.user);
      setShowLoginOverlay(false);

      console.log('✅ Login successful');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('❌ Login timed out - backend not available');
        throw new Error('Login-Timeout: Backend nicht erreichbar');
      } else {
        console.error('❌ Login failed:', error);
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      apiService.clearAuthToken();
      setUser(null);
      setShowLoginOverlay(true);
    }
  };

  const showLogin = () => {
    setShowLoginOverlay(true);
  };

  // =====================================================
  // CONTEXT VALUE
  // =====================================================

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isInitialized, // 🔧 NEW: Expose initialization state
    login,
    logout,
    showLogin: () => setShowLoginOverlay(true)
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authentifizierung wird geprüft...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginOverlay
        isOpen={showLoginOverlay}
        onClose={() => setShowLoginOverlay(false)}
        onLogin={login}
      />
    </AuthContext.Provider>
  );
};

export default AuthProvider;
