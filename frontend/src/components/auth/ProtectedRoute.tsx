// =====================================================
// Budget Manager 2025 - Protected Route Component
// Epic 8 - Story 8.3: Login-Overlay Frontend
// =====================================================

import React, { useEffect } from 'react';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';
import { useAuthStore, usePermissions, useLoginOverlay } from '../../stores/authStore';

// Types
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  minRole?: string;
  fallback?: React.ReactNode;
  showLoginPrompt?: boolean;
}

/**
 * ProtectedRoute - Wrapper component for route-based access control
 * Features: Permission checking, role validation, automatic login prompts
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  minRole,
  fallback,
  showLoginPrompt = true
}) => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================

  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    checkAuth 
  } = useAuthStore();

  const { 
    hasPermission, 
    hasRole, 
    hasMinRole,
    role: userRole 
  } = usePermissions();

  const { openLoginOverlay } = useLoginOverlay();

  // =====================================================
  // EFFECTS
  // =====================================================

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  // =====================================================
  // ACCESS CONTROL LOGIC
  // =====================================================

  /**
   * Check if user has required access
   */
  const hasRequiredAccess = (): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    // Check specific permission
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return false;
    }

    // Check specific role
    if (requiredRole && !hasRole(requiredRole)) {
      return false;
    }

    // Check minimum role
    if (minRole && !hasMinRole(minRole)) {
      return false;
    }

    return true;
  };

  // =====================================================
  // RENDER COMPONENTS
  // =====================================================

  /**
   * Loading spinner component
   */
  const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Authentifizierung wird geprüft...</p>
      </div>
    </div>
  );

  /**
   * Login prompt component
   */
  const LoginPrompt: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-blue-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Anmeldung erforderlich
        </h2>
        
        <p className="text-gray-600 mb-6">
          Sie müssen sich anmelden, um auf diese Seite zugreifen zu können.
        </p>
        
        <button
          onClick={openLoginOverlay}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Jetzt anmelden
        </button>
      </div>
    </div>
  );

  /**
   * Unauthorized access component
   */
  const UnauthorizedMessage: React.FC = () => {
    const getAccessRequirement = (): string => {
      if (requiredPermission) {
        return `Berechtigung "${requiredPermission}"`;
      }
      if (requiredRole) {
        return `Rolle "${requiredRole}"`;
      }
      if (minRole) {
        return `Mindestrolle "${minRole}"`;
      }
      return 'entsprechende Berechtigung';
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Zugriff verweigert
          </h2>
          
          <p className="text-gray-600 mb-4">
            Sie haben nicht die erforderlichen Berechtigungen für diese Seite.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Erforderlich:</strong> {getAccessRequirement()}
            </p>
            {userRole && (
              <p className="text-sm text-gray-700 mt-1">
                <strong>Ihre Rolle:</strong> {userRole}
              </p>
            )}
          </div>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  };

  // =====================================================
  // MAIN RENDER LOGIC
  // =====================================================

  // Show loading spinner while checking authentication
  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showLoginPrompt) {
      return <LoginPrompt />;
    }
    
    return null;
  }

  // Show unauthorized message if access requirements not met
  if (!hasRequiredAccess()) {
    return <UnauthorizedMessage />;
  }

  // Render protected content
  return <>{children}</>;
};

/**
 * Higher-order component for protecting routes
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) => {
  return (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

/**
 * Hook for conditional rendering based on permissions
 */
export const useAuthGuard = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { hasPermission, hasRole, hasMinRole } = usePermissions();

  return {
    isAuthenticated,
    user,
    canAccess: (options: {
      permission?: string;
      role?: string;
      minRole?: string;
    }) => {
      if (!isAuthenticated) return false;
      
      if (options.permission && !hasPermission(options.permission)) return false;
      if (options.role && !hasRole(options.role)) return false;
      if (options.minRole && !hasMinRole(options.minRole)) return false;
      
      return true;
    }
  };
};

export default ProtectedRoute;
