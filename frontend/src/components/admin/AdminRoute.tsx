// =====================================================
// Budget Manager 2025 - Admin Route Protection
// Epic 8 - Story 8.5: Admin-Bereich Zugriffskontrolle
// =====================================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Shield, AlertTriangle } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute - Protected Route für Admin-Bereiche
 * Nur SuperAdmins haben Zugriff auf Admin-Funktionen
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Berechtigung wird geprüft...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Check SuperAdmin role
  const isSuperAdmin = user.profile?.role === 'SUPERADMIN';
  
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          
          {/* 403 Unauthorized Page */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            
            {/* Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Zugriff verweigert
            </h1>
            
            {/* Message */}
            <div className="flex items-center justify-center gap-2 text-red-600 mb-6">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">403 - Nicht autorisiert</span>
            </div>
            
            <p className="text-gray-600 mb-6">
              Sie haben keine Berechtigung für den Admin-Bereich. 
              Nur SuperAdmins können auf diese Funktionen zugreifen.
            </p>
            
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Angemeldet als:</span> {user.email}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Rolle:</span> {user.profile?.role || 'USER'}
              </p>
            </div>
            
            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Zurück zur vorherigen Seite
              </button>
              
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Zum Dashboard
              </button>
            </div>
            
            {/* Contact Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Benötigen Sie Admin-Zugriff? Wenden Sie sich an Ihren System-Administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SuperAdmin - allow access
  return <>{children}</>;
};

export default AdminRoute;






