// =====================================================
// Budget Manager 2025 - Realtime Dashboard
// Story 1.5: Echtzeit-Budget-Dashboard - Haupt-Dashboard
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import BudgetOverviewCard from './BudgetOverviewCard';
import BurnRateChart from './BurnRateChart';
import CriticalAlertsPanel from './CriticalAlertsPanel';
import { formatGermanCurrency } from '../../utils/currency';
import { apiService } from '../../services/apiService';

interface DashboardData {
  budgetOverview: any;
  projectPortfolio: any;
  criticalAlerts: any;
  burnRateData: any;
  recentTransfers: any;
  lastUpdated: string;
  performance: {
    loadTime: number;
  };
}

const RealtimeDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    status: 'UNKNOWN'
  });

  // Echte API-Daten laden
  const loadRealDashboardData = useCallback(async (): Promise<DashboardData> => {
    try {
      // Dashboard-Übersicht von echter API laden
      const result = await apiService.getDashboardData();
      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Laden der Dashboard-Daten');
      }
      const apiData = result.data;
      
      return {
        budgetOverview: {
          totalBudget: {
            amount: apiData?.totalBudget?.amount || 0,
            formatted: apiData?.totalBudget?.formatted || formatGermanCurrency(0)
          },
          allocatedBudget: {
            amount: apiData?.allocatedBudget?.amount || 0,
            formatted: apiData?.allocatedBudget?.formatted || formatGermanCurrency(0),
            percentage: apiData?.allocatedBudget?.percentage || 0
          },
          consumedBudget: {
            amount: apiData?.consumedBudget?.amount || 0,
            formatted: apiData?.consumedBudget?.formatted || formatGermanCurrency(0),
            percentage: apiData?.consumedBudget?.percentage || 0
          },
          availableBudget: {
            amount: apiData?.availableBudget?.amount || 0,
            formatted: apiData?.availableBudget?.formatted || formatGermanCurrency(0)
          },
          remainingBudget: {
            amount: apiData?.remainingBudget?.amount || 0,
            formatted: apiData?.remainingBudget?.formatted || formatGermanCurrency(0)
          },
          budgetStatus: apiData?.budgetStatus || 'UNKNOWN',
          budgetStatusLabel: apiData?.budgetStatusLabel || 'Unbekannt',
          utilizationPercentage: apiData?.utilizationPercentage || 0,
          budgetCount: apiData?.budgetCount || 1,
          activeProjects: apiData?.activeProjects || 0
        },
        projectPortfolio: {
          portfolioStats: {
            total: apiData?.activeProjects || 0,
            healthy: 0,
            warning: 0,
            critical: 0,
            exceeded: 0
          },
          projectsByStatus: {
            HEALTHY: [],
            WARNING: [],
            CRITICAL: [],
            EXCEEDED: []
          },
          riskProjects: []
        },
        criticalAlerts: {
          alerts: [],
          totalAlerts: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0
        },
        burnRateData: {
          monthlyData: [],
          currentTrend: 'STABLE',
          projectedBurnRate: 0
        },
        recentTransfers: {
          transfers: [],
          totalTransfers: 0,
          pendingCount: 0,
          approvedCount: 0
        },
        lastUpdated: new Date().toISOString(),
        performance: {
          loadTime: 0
        }
      };
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Daten:', error);
      throw error;
    }
  }, []);

  // Dashboard-Daten laden
  useEffect(() => {
    const startTime = Date.now();
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Simuliere Netzwerk-Delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const realData = await loadRealDashboardData();
        const loadTime = Date.now() - startTime;
        
        setDashboardData(realData);
        setLastUpdate(new Date().toISOString());
        setPerformanceMetrics({
          loadTime,
          status: loadTime < 3000 ? 'OPTIMAL' : 'SLOW'
        });

        console.log(`📊 Dashboard-Daten geladen in ${loadTime}ms`);

      } catch (error) {
        console.error('❌ Fehler beim Laden der Dashboard-Daten:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [loadRealDashboardData]);

  // WebSocket-Verbindung initialisieren
  useEffect(() => {
    const socketInstance = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('🔌 WebSocket verbunden');
      setIsConnected(true);
      socketInstance.emit('dashboard:subscribe', { userId: 'demo-user' });
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 WebSocket getrennt');
      setIsConnected(false);
    });

    socketInstance.on('dashboard:update', (data) => {
      console.log('📊 Dashboard-Update erhalten:', data);
      setDashboardData(data);
      setLastUpdate(new Date().toISOString());
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Auto-Refresh alle 30 Sekunden
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isLoading) {
        try {
          const realData = await loadRealDashboardData();
          setDashboardData(realData);
          setLastUpdate(new Date().toISOString());
        } catch (error) {
          console.error('Fehler beim Auto-Refresh:', error);
        }
      }
    }, 30000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, loadRealDashboardData]);

  const handleManualRefresh = async () => {
    setIsLoading(true);
    try {
      const realData = await loadRealDashboardData();
      setDashboardData(realData);
      setLastUpdate(new Date().toISOString());
    } catch (error) {
      console.error('Fehler beim manuellen Refresh:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Dashboard wird geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Echtzeit-Dashboard</h1>
                <p className="text-gray-600">Live-Übersicht aller Budget-Aktivitäten und Kennzahlen</p>
              </div>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm">💡</span>
                <div>
                  <h3 className="font-semibold text-blue-900">Dashboard-Features</h3>
                  <p className="text-xs text-blue-700">
                    Automatische Updates alle 30 Sekunden • WebSocket Live-Verbindung • Deutsche Geschäfts-Standards • Performance-optimiert
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status und Performance */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">
                    {isConnected ? '🟢 Live-Modus' : '🔴 Offline-Modus'}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  ⚡ Ladezeit: {performanceMetrics.loadTime}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto-Update alle 30s</span>
                <button
                  onClick={handleManualRefresh}
                  disabled={isLoading}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 disabled:opacity-50"
                >
                  {isLoading ? 'Lädt...' : '🔄 Aktualisieren'}
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Zuletzt aktualisiert: {lastUpdate ? new Date(lastUpdate).toLocaleString('de-DE') : 'Nie'}
              </p>
            </div>
          </div>
        </div>

        {/* Budget-Übersicht */}
        {dashboardData?.budgetOverview && (
          <BudgetOverviewCard data={dashboardData.budgetOverview} />
        )}

        {/* Projekt-Portfolio */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-xl">🎯</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Projekt-Portfolio</h3>
              <p className="text-sm text-gray-600">
                {dashboardData?.projectPortfolio?.portfolioStats?.total || 0} Projekte • Budget-Status-Übersicht
              </p>
            </div>
          </div>
        </div>

        {/* Performance-Metriken */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <span className="text-xl">⚡</span>
              <div>
                <h3 className="font-semibold text-gray-900">Performance</h3>
                <p className="text-sm text-gray-600">
                  Ladezeit: {performanceMetrics.loadTime}ms<br />
                  Status: {performanceMetrics.status === 'OPTIMAL' ? 'Optimal' : 'Langsam'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🔄</span>
              <div>
                <h3 className="font-semibold text-gray-900">Live-Updates</h3>
                <p className="text-sm text-gray-600">
                  WebSocket: {isConnected ? 'Aktiv' : 'Inaktiv'}<br />
                  Auto-Refresh: Alle 30 Sekunden
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🇩🇪</span>
              <div>
                <h3 className="font-semibold text-gray-900">Compliance</h3>
                <p className="text-sm text-gray-600">
                  Deutsche Standards<br />
                  EUR-Formatierung
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            🚀 Budget Manager 2025 • Entwickelt mit deutscher Präzision • Powered by React + TypeScript + Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
};

export default RealtimeDashboard;