// =====================================================
// LIVE METRICS DISPLAY COMPONENT
// @po.mdc - Woche 1, Tag 3
// =====================================================

import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle, AlertTriangle, DollarSign, Zap } from 'lucide-react';

interface LiveMetrics {
  provider_name: string;
  total_requests_24h: number;
  successful_requests_24h: number;
  failed_requests_24h: number;
  success_rate_24h: number;
  avg_response_time_24h: number;
  total_cost_24h: number;
  total_tokens_24h: number;
  requests_last_hour: number;
  avg_response_time_last_hour: number;
  status: 'active' | 'idle' | 'warning' | 'critical';
  last_updated: string;
}

interface LiveMetricsDisplayProps {
  providerId: string;
  providerName: string;
  displayName: string;
  className?: string;
}

export const LiveMetricsDisplay: React.FC<LiveMetricsDisplayProps> = ({
  providerId,
  providerName,
  displayName,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Metriken laden
  const loadMetrics = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/providers/${providerId}/metrics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Metriken');
      }

      const data = await response.json();
      if (data.success && data.data.live_metrics) {
        setMetrics(data.data.live_metrics);
      }
    } catch (error: any) {
      console.error('Fehler beim Laden der Live-Metriken:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load und Auto-Refresh
  useEffect(() => {
    loadMetrics();
    
    // Auto-Refresh alle 30 Sekunden
    const interval = setInterval(loadMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [providerId]);

  // Status-Farben bestimmen
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'idle':
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      case 'idle':
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'warning':
        return 'Warnung';
      case 'critical':
        return 'Kritisch';
      case 'idle':
      default:
        return 'Inaktiv';
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className={`bg-red-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-red-600">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span className="text-sm">Metriken nicht verfügbar</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header mit Status */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900">{displayName} Live-Metriken</h4>
        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metrics.status)}`}>
          {getStatusIcon(metrics.status)}
          <span className="ml-1">{getStatusText(metrics.status)}</span>
        </div>
      </div>

      {/* Metriken Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Response Time */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600">Response Time</p>
              <p className="text-sm font-bold text-blue-900">
                {metrics.avg_response_time_24h > 0 ? `${metrics.avg_response_time_24h}ms` : 'Keine Daten'}
              </p>
            </div>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600">Success Rate</p>
              <p className="text-sm font-bold text-green-900">
                {metrics.success_rate_24h}%
              </p>
            </div>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
        </div>

        {/* Requests 24h */}
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600">Requests 24h</p>
              <p className="text-sm font-bold text-purple-900">
                {metrics.total_requests_24h}
              </p>
            </div>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
        </div>

        {/* Cost 24h */}
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-600">Kosten 24h</p>
              <p className="text-sm font-bold text-yellow-900">
                €{metrics.total_cost_24h.toFixed(4)}
              </p>
            </div>
            <DollarSign className="w-4 h-4 text-yellow-600" />
          </div>
        </div>

        {/* Tokens 24h */}
        <div className="bg-indigo-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-600">Tokens 24h</p>
              <p className="text-sm font-bold text-indigo-900">
                {metrics.total_tokens_24h.toLocaleString('de-DE')}
              </p>
            </div>
            <div className="w-4 h-4 bg-indigo-600 rounded text-white text-xs flex items-center justify-center font-bold">
              T
            </div>
          </div>
        </div>

        {/* Last Hour Activity */}
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600">Letzte Stunde</p>
              <p className="text-sm font-bold text-orange-900">
                {metrics.requests_last_hour} Requests
              </p>
            </div>
            <Zap className="w-4 h-4 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Letzte Aktualisierung: {new Date(metrics.last_updated).toLocaleString('de-DE')}
        </p>
      </div>
    </div>
  );
};

export default LiveMetricsDisplay;





