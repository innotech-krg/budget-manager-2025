// =====================================================
// Budget Manager 2025 - Critical Alerts Panel
// Story 1.5: Echtzeit-Budget-Dashboard - Kritische Warnungen
// =====================================================

import React from 'react';

interface Alert {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  projectId?: string;
  projectName?: string;
  data?: any;
  timestamp: string;
}

interface CriticalAlertsData {
  alerts: Alert[];
  totalAlerts: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
}

interface CriticalAlertsPanelProps {
  data: CriticalAlertsData;
  isLoading?: boolean;
  onAlertClick?: (alert: Alert) => void;
  maxAlerts?: number;
}

const CriticalAlertsPanel: React.FC<CriticalAlertsPanelProps> = ({
  data,
  isLoading = false,
  onAlertClick,
  maxAlerts = 5
}) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'MEDIUM': return '🟡';
      case 'LOW': return 'ℹ️';
      default: return '❓';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'border-red-500 bg-red-50 text-red-800';
      case 'HIGH': return 'border-orange-500 bg-orange-50 text-orange-800';
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      case 'LOW': return 'border-blue-500 bg-blue-50 text-blue-800';
      default: return 'border-gray-500 bg-gray-50 text-gray-800';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'BUDGET_EXCEEDED': return '💸';
      case 'BUDGET_CRITICAL': return '⚡';
      case 'PENDING_TRANSFERS': return '🔄';
      case 'PROJECT_OVERDUE': return '⏰';
      case 'SYSTEM_ERROR': return '🔧';
      default: return '📋';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `vor ${diffMins} Min`;
    } else if (diffHours < 24) {
      return `vor ${diffHours} Std`;
    } else if (diffDays < 7) {
      return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    } else {
      return date.toLocaleDateString('de-DE');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayedAlerts = data.alerts.slice(0, maxAlerts);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">🚨</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Kritische Warnungen</h3>
            <p className="text-sm text-gray-500">
              {data.totalAlerts} Warnungen • {data.criticalCount} kritisch
            </p>
          </div>
        </div>
        
        {data.criticalCount > 0 && (
          <div className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <span className="mr-1">🚨</span>
            {data.criticalCount} Kritisch
          </div>
        )}
      </div>

      {/* Alert-Zusammenfassung */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-2xl font-bold text-red-600">{data.criticalCount}</p>
          <p className="text-xs text-red-600 font-medium">Kritisch</p>
        </div>
        
        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-2xl font-bold text-orange-600">{data.highCount}</p>
          <p className="text-xs text-orange-600 font-medium">Hoch</p>
        </div>
        
        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-600">{data.mediumCount}</p>
          <p className="text-xs text-yellow-600 font-medium">Mittel</p>
        </div>
        
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-2xl font-bold text-blue-600">{data.totalAlerts - data.criticalCount - data.highCount - data.mediumCount}</p>
          <p className="text-xs text-blue-600 font-medium">Niedrig</p>
        </div>
      </div>

      {/* Alert-Liste */}
      <div className="space-y-3">
        {displayedAlerts.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-2 block">✅</span>
            <p className="text-gray-500 font-medium">Keine kritischen Warnungen</p>
            <p className="text-sm text-gray-400">Alle Systeme funktionieren normal</p>
          </div>
        ) : (
          displayedAlerts.map((alert, index) => (
            <div
              key={index}
              className={`border-l-4 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${getSeverityColor(alert.severity)}`}
              onClick={() => onAlertClick && onAlertClick(alert)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                    <span className="text-sm">{getAlertTypeIcon(alert.type)}</span>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
                    <p className="text-sm opacity-90 mb-2">{alert.message}</p>
                    
                    {alert.projectName && (
                      <div className="flex items-center space-x-2 text-xs opacity-75">
                        <span>📁</span>
                        <span>Projekt: {alert.projectName}</span>
                      </div>
                    )}
                    
                    {alert.data && (
                      <div className="mt-2 text-xs opacity-75">
                        {alert.data.overspendFormatted && (
                          <span>Überschreitung: {alert.data.overspendFormatted}</span>
                        )}
                        {alert.data.remainingFormatted && (
                          <span>Verbleibend: {alert.data.remainingFormatted}</span>
                        )}
                        {alert.data.count && (
                          <span>Anzahl: {alert.data.count}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-xs opacity-75 ml-2">
                  {formatTimestamp(alert.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mehr anzeigen */}
      {data.totalAlerts > maxAlerts && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            {data.totalAlerts - maxAlerts} weitere Warnungen anzeigen
          </button>
        </div>
      )}

      {/* Auto-Refresh Hinweis */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <span className="inline-flex items-center space-x-1">
          <span>🔄</span>
          <span>Automatische Aktualisierung alle 30 Sekunden</span>
        </span>
      </div>
    </div>
  );
};

export default CriticalAlertsPanel;

