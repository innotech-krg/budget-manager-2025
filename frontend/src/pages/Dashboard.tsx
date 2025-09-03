// =====================================================
// Budget Manager 2025 - Dashboard Page
// Story 1.5: Echtzeit-Budget-Dashboard - Haupt-Seite
// =====================================================

import React from 'react';
import RealtimeDashboard from '../components/dashboard/RealtimeDashboard';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Echtzeit-Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Live-Übersicht aller Budget-Aktivitäten und Kennzahlen
              </p>
            </div>
          </div>
          
          {/* Dashboard Info Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-lg">💡</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-900">Dashboard-Features</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Automatische Updates alle 30 Sekunden • WebSocket Live-Verbindung • 
                  Deutsche Geschäfts-Standards • Performance-optimiert
                </p>
              </div>
            </div>
          </div>
        </div>

        <RealtimeDashboard />
      </div>
    </div>
  );
};

export default Dashboard;
