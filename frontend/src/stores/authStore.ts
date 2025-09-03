// =====================================================
// Budget Manager 2025 - Auth Store
// Epic 8 - Story 8.3: Login-Overlay Frontend
// =====================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, AuthUser, LoginCredentials, MFACredentials, UserProfile } from '../services/authService';

// Types
interface AuthState {
  // State
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // MFA State
  requiresMFA: boolean;
  tempToken: string | null;
  
  // UI State
  showLoginOverlay: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  verifyMFA: (credentials: MFACredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  
  // UI Actions
  openLoginOverlay: () => void;
  closeLoginOverlay: () => void;
  
  // Permission Actions
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasMinRole: (minRole: string) => boolean;
  
  // Profile Actions
  refreshProfile: () => Promise<void>;
  
  // MFA Actions
  setupMFA: () => Promise<{ success: boolean; secret?: string; qrCode?: string; backupCodes?: string[]; error?: string; }>;
  enableMFA: (token: string, secret: string) => Promise<boolean>;
}

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  'USER': 1,
  'MANAGER': 2,
  'ADMIN': 3,
  'SUPERADMIN': 4
};

/**
 * Auth Store - Central state management for authentication
 * Uses Zustand with persistence for auth state
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // =====================================================
      // INITIAL STATE
      // =====================================================
      
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      requiresMFA: false,
      tempToken: null,
      showLoginOverlay: false,

      // =====================================================
      // AUTHENTICATION ACTIONS
      // =====================================================

      /**
       * Login with email and password
       */
      login: async (credentials: LoginCredentials): Promise<boolean> => {
        try {
          console.log('🔐 Auth Store: Attempting login');
          
          set({ isLoading: true, error: null });

          const response = await authService.login(credentials);

          if (!response.success) {
            // Handle MFA requirement
            if (response.requiresMFA) {
              set({
                requiresMFA: true,
                tempToken: response.tempToken || null,
                isLoading: false,
                error: null
              });
              return false;
            }

            // Handle login error
            set({
              error: response.error || 'Anmeldefehler',
              isLoading: false
            });
            return false;
          }

          // Successful login
          const user = await authService.getCurrentUser();
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            requiresMFA: false,
            tempToken: null,
            showLoginOverlay: false
          });

          console.log('✅ Auth Store: Login successful');
          return true;

        } catch (error: any) {
          console.error('❌ Auth Store: Login error:', error);
          
          set({
            error: error.message || 'Unbekannter Anmeldefehler',
            isLoading: false
          });
          
          return false;
        }
      },

      /**
       * Verify MFA token
       */
      verifyMFA: async (credentials: MFACredentials): Promise<boolean> => {
        try {
          console.log('🔐 Auth Store: Verifying MFA');
          
          set({ isLoading: true, error: null });

          const response = await authService.verifyMFA(credentials);

          if (!response.success) {
            set({
              error: response.error || 'MFA-Verifizierungsfehler',
              isLoading: false
            });
            return false;
          }

          // Successful MFA verification
          const user = await authService.getCurrentUser();
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            requiresMFA: false,
            tempToken: null,
            showLoginOverlay: false
          });

          console.log('✅ Auth Store: MFA verification successful');
          return true;

        } catch (error: any) {
          console.error('❌ Auth Store: MFA verification error:', error);
          
          set({
            error: error.message || 'MFA-Verifizierungsfehler',
            isLoading: false
          });
          
          return false;
        }
      },

      /**
       * Logout user
       */
      logout: async (): Promise<void> => {
        try {
          console.log('🔐 Auth Store: Logging out');
          
          set({ isLoading: true });

          await authService.logout();

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            requiresMFA: false,
            tempToken: null,
            showLoginOverlay: false
          });

          console.log('✅ Auth Store: Logout successful');

        } catch (error: any) {
          console.error('❌ Auth Store: Logout error:', error);
          
          // Force logout even if there's an error
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            requiresMFA: false,
            tempToken: null
          });
        }
      },

      /**
       * Check authentication status
       */
      checkAuth: async (): Promise<void> => {
        try {
          console.log('🔐 Auth Store: Checking authentication');
          
          set({ isLoading: true, error: null });

          const user = await authService.getCurrentUser();

          if (user) {
            set({
              user,
              isAuthenticated: true,
              isLoading: false
            });
            console.log('✅ Auth Store: User authenticated');
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
            console.log('ℹ️ Auth Store: No authenticated user');
          }

        } catch (error: any) {
          console.error('❌ Auth Store: Auth check error:', error);
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message
          });
        }
      },

      /**
       * Clear error state
       */
      clearError: (): void => {
        set({ error: null });
      },

      // =====================================================
      // UI ACTIONS
      // =====================================================

      /**
       * Open login overlay
       */
      openLoginOverlay: (): void => {
        set({ showLoginOverlay: true, error: null });
      },

      /**
       * Close login overlay
       */
      closeLoginOverlay: (): void => {
        set({ 
          showLoginOverlay: false, 
          error: null,
          requiresMFA: false,
          tempToken: null
        });
      },

      // =====================================================
      // PERMISSION ACTIONS
      // =====================================================

      /**
       * Check if user has specific permission
       */
      hasPermission: (permission: string): boolean => {
        const { user } = get();
        
        if (!user || !user.permissions) {
          return false;
        }

        return user.permissions.includes(permission);
      },

      /**
       * Check if user has specific role
       */
      hasRole: (role: string): boolean => {
        const { user } = get();
        
        if (!user || !user.profile) {
          return false;
        }

        return user.profile.role === role;
      },

      /**
       * Check if user has minimum role (hierarchy)
       */
      hasMinRole: (minRole: string): boolean => {
        const { user } = get();
        
        if (!user || !user.profile) {
          return false;
        }

        const userRoleLevel = ROLE_HIERARCHY[user.profile.role as keyof typeof ROLE_HIERARCHY] || 0;
        const minRoleLevel = ROLE_HIERARCHY[minRole as keyof typeof ROLE_HIERARCHY] || 0;

        return userRoleLevel >= minRoleLevel;
      },

      // =====================================================
      // PROFILE ACTIONS
      // =====================================================

      /**
       * Refresh user profile
       */
      refreshProfile: async (): Promise<void> => {
        try {
          const { user: currentUser } = get();
          
          if (!currentUser) {
            return;
          }

          console.log('🔐 Auth Store: Refreshing user profile');

          const updatedUser = await authService.getCurrentUser();

          if (updatedUser) {
            set({ user: updatedUser });
            console.log('✅ Auth Store: Profile refreshed');
          }

        } catch (error: any) {
          console.error('❌ Auth Store: Profile refresh error:', error);
        }
      },

      // =====================================================
      // MFA ACTIONS
      // =====================================================

      /**
       * Setup MFA for current user
       */
      setupMFA: async () => {
        try {
          console.log('🔐 Auth Store: Setting up MFA');
          
          const response = await authService.setupMFA();
          
          if (response.success) {
            console.log('✅ Auth Store: MFA setup successful');
          }
          
          return response;

        } catch (error: any) {
          console.error('❌ Auth Store: MFA setup error:', error);
          return {
            success: false,
            error: error.message || 'MFA-Setup-Fehler'
          };
        }
      },

      /**
       * Enable MFA after verification
       */
      enableMFA: async (token: string, secret: string): Promise<boolean> => {
        try {
          console.log('🔐 Auth Store: Enabling MFA');
          
          const response = await authService.enableMFA(token, secret);

          if (response.success) {
            // Refresh user profile to get updated MFA status
            await get().refreshProfile();
            console.log('✅ Auth Store: MFA enabled successfully');
            return true;
          } else {
            set({ error: response.error || 'MFA-Aktivierungsfehler' });
            return false;
          }

        } catch (error: any) {
          console.error('❌ Auth Store: MFA enable error:', error);
          set({ error: error.message || 'MFA-Aktivierungsfehler' });
          return false;
        }
      }
    }),
    {
      name: 'budget-manager-auth', // Storage key
      partialize: (state) => ({
        // Only persist essential state, not sensitive data
        isAuthenticated: state.isAuthenticated,
        showLoginOverlay: state.showLoginOverlay
      })
    }
  )
);

// =====================================================
// UTILITY HOOKS
// =====================================================

/**
 * Hook to get auth status
 */
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    login: store.login,
    logout: store.logout,
    checkAuth: store.checkAuth,
    clearError: store.clearError
  };
};

/**
 * Hook to get permission helpers
 */
export const usePermissions = () => {
  const store = useAuthStore();
  
  return {
    hasPermission: store.hasPermission,
    hasRole: store.hasRole,
    hasMinRole: store.hasMinRole,
    permissions: store.user?.permissions || [],
    role: store.user?.profile?.role || null
  };
};

/**
 * Hook to get MFA helpers
 */
export const useMFA = () => {
  const store = useAuthStore();
  
  return {
    requiresMFA: store.requiresMFA,
    tempToken: store.tempToken,
    verifyMFA: store.verifyMFA,
    setupMFA: store.setupMFA,
    enableMFA: store.enableMFA,
    mfaEnabled: store.user?.profile?.mfa_enabled || false
  };
};

/**
 * Hook to get login overlay state
 */
export const useLoginOverlay = () => {
  const store = useAuthStore();
  
  return {
    showLoginOverlay: store.showLoginOverlay,
    openLoginOverlay: store.openLoginOverlay,
    closeLoginOverlay: store.closeLoginOverlay
  };
};

export default useAuthStore;
