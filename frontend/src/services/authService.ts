// =====================================================
// Budget Manager 2025 - Frontend Auth Service
// Epic 8 - Story 8.3: Login-Overlay Frontend
// =====================================================

import { createClient, AuthResponse, User, Session } from '@supabase/supabase-js';
import { apiService } from './apiService';

// Supabase Configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ppaletujnevtftvpoorx.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYWxldHVqbmV2dGZ0dnBvb3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTI3NzMsImV4cCI6MjA3MTk2ODc3M30.UiSDTbLhsK4Oz1Db5KllBWeH5ttFf8X-E1jPqkjey-U';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface MFACredentials {
  tempToken: string;
  mfaToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  mfa_enabled: boolean;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface AuthUser extends User {
  profile?: UserProfile;
  permissions?: string[];
}

export interface LoginResponse {
  success: boolean;
  requiresMFA?: boolean;
  tempToken?: string;
  user?: AuthUser;
  session?: Session;
  token?: string;
  message?: string;
  error?: string;
  code?: string;
}

/**
 * AuthService - Handles all authentication operations for the frontend
 * Integrates with Supabase Auth and Budget Manager 2025 backend
 */
class AuthService {
  private supabase;
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.initializeAuthListener();
  }

  // =====================================================
  // INITIALIZATION
  // =====================================================

  /**
   * Initialize auth state listener
   */
  private initializeAuthListener() {
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth State Change:', event, session?.user?.email);

      let user: AuthUser | null = null;

      if (session?.user) {
        try {
          // Get user profile from backend
          const profile = await this.getUserProfile();
          user = {
            ...session.user,
            profile,
            permissions: await this.getUserPermissions()
          };
        } catch (error) {
          console.error('❌ Error loading user profile:', error);
          user = session.user as AuthUser;
        }
      }

      // Notify all listeners
      this.authStateListeners.forEach(listener => listener(user));
    });
  }

  // =====================================================
  // AUTHENTICATION METHODS
  // =====================================================

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('🔐 Auth Service: Attempting login for:', credentials.email);

      // Use backend API for login (includes MFA handling)
      const response = await apiService.post('/api/auth/login', credentials);

      if (!response.success) {
        return response;
      }

      // Handle MFA requirement
      if (response.requiresMFA) {
        console.log('🔐 Auth Service: MFA required');
        return {
          success: false,
          requiresMFA: true,
          tempToken: response.tempToken,
          message: response.message
        };
      }

      // Successful login - set session in Supabase
      if (response.session) {
        await this.supabase.auth.setSession({
          access_token: response.session.access_token,
          refresh_token: response.session.refresh_token
        });
      }

      console.log('✅ Auth Service: Login successful');
      return response;

    } catch (error: any) {
      console.error('❌ Auth Service: Login error:', error);
      return {
        success: false,
        error: error.message || 'Anmeldefehler',
        code: 'LOGIN_ERROR'
      };
    }
  }

  /**
   * Verify MFA token during login
   */
  async verifyMFA(credentials: MFACredentials): Promise<LoginResponse> {
    try {
      console.log('🔐 Auth Service: Verifying MFA token');

      const response = await apiService.post('/api/auth/mfa-verify', credentials);

      if (response.success && response.token) {
        // Set custom token as Authorization header for future requests
        apiService.setAuthToken(response.token);
        
        console.log('✅ Auth Service: MFA verification successful');
      }

      return response;

    } catch (error: any) {
      console.error('❌ Auth Service: MFA verification error:', error);
      return {
        success: false,
        error: error.message || 'MFA-Verifizierungsfehler',
        code: 'MFA_ERROR'
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      console.log('🔐 Auth Service: Logging out');

      // Logout from backend
      try {
        await apiService.post('/api/auth/logout', {});
      } catch (error) {
        console.warn('⚠️ Backend logout failed:', error);
      }

      // Logout from Supabase
      await this.supabase.auth.signOut();

      // Clear auth token
      apiService.clearAuthToken();

      console.log('✅ Auth Service: Logout successful');

    } catch (error) {
      console.error('❌ Auth Service: Logout error:', error);
      // Continue with logout even if there are errors
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      // Get user profile from backend
      const profile = await this.getUserProfile();
      const permissions = await this.getUserPermissions();

      return {
        ...user,
        profile,
        permissions
      } as AuthUser;

    } catch (error) {
      console.error('❌ Auth Service: Get current user error:', error);
      return null;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error || !data.session) {
        console.error('❌ Auth Service: Token refresh failed:', error);
        return false;
      }

      console.log('✅ Auth Service: Token refreshed successfully');
      return true;

    } catch (error) {
      console.error('❌ Auth Service: Token refresh error:', error);
      return false;
    }
  }

  // =====================================================
  // USER PROFILE METHODS
  // =====================================================

  /**
   * Get user profile from backend
   */
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const response = await apiService.get('/api/auth/user');
      
      if (response.success && response.user) {
        return response.user.profile;
      }

      return null;

    } catch (error) {
      console.error('❌ Auth Service: Get user profile error:', error);
      return null;
    }
  }

  /**
   * Get user permissions from backend
   */
  async getUserPermissions(): Promise<string[]> {
    try {
      const response = await apiService.get('/api/roles/permissions');
      
      if (response.success && response.permissions) {
        return response.permissions.map((p: any) => p.permission);
      }

      return [];

    } catch (error) {
      console.error('❌ Auth Service: Get user permissions error:', error);
      return [];
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(permission: string): Promise<boolean> {
    try {
      const response = await apiService.get(`/api/roles/check-permission/${permission}`);
      return response.success && response.has_permission;

    } catch (error) {
      console.error('❌ Auth Service: Permission check error:', error);
      return false;
    }
  }

  // =====================================================
  // MFA METHODS
  // =====================================================

  /**
   * Setup MFA for current user
   */
  async setupMFA(): Promise<{
    success: boolean;
    secret?: string;
    qrCode?: string;
    backupCodes?: string[];
    error?: string;
  }> {
    try {
      const response = await apiService.post('/api/auth/mfa/setup', {});
      return response;

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'MFA-Setup-Fehler'
      };
    }
  }

  /**
   * Enable MFA after verification
   */
  async enableMFA(token: string, secret: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await apiService.post('/api/auth/mfa/enable', {
        token,
        secret
      });
      return response;

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'MFA-Aktivierungsfehler'
      };
    }
  }

  // =====================================================
  // AUTH STATE MANAGEMENT
  // =====================================================

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      return !!session;
    } catch {
      return false;
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      return session;
    } catch {
      return null;
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Passwort muss mindestens 8 Zeichen lang sein');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Passwort muss mindestens einen Großbuchstaben enthalten');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Passwort muss mindestens einen Kleinbuchstaben enthalten');
    }

    if (!/\d/.test(password)) {
      errors.push('Passwort muss mindestens eine Zahl enthalten');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Passwort muss mindestens ein Sonderzeichen enthalten');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get auth service health status
   */
  async getHealthStatus(): Promise<{
    status: string;
    services: Record<string, string>;
  }> {
    try {
      const response = await apiService.get('/api/auth/health');
      return response.health || { status: 'unknown', services: {} };

    } catch (error) {
      return {
        status: 'error',
        services: {
          backend: 'error',
          supabase: 'unknown'
        }
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
