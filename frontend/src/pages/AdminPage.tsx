/**
 * Admin-Management-System Frontend
 * Epic 8: Umfassendes Admin-Management
 */

import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon, 
  CpuChipIcon, 
  DocumentTextIcon, 
  ServerIcon,
  KeyIcon,
  UserGroupIcon,
  TagIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
// import UserManagement from '../components/admin/UserManagement'; // Temporarily disabled
import SystemManagement from '../components/admin/SystemManagement';
import AIManagement from '../components/admin/AIManagement';
import EntityManagement from '../components/admin/EntityManagement';
import { apiService } from '../services/apiService';

interface AdminData {
  dashboard: any;
  aiProviders: any;
  systemLogs: any[];
  ocrLogs: any[];
}

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminData, setAdminData] = useState<AdminData>({
    dashboard: null,
    aiProviders: null,
    systemLogs: [],
    ocrLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin-API-Aufrufe
  const adminApiCall = async (endpoint: string) => {
    try {
      const response = await apiService.get(`/api/admin/${endpoint}`);
      
      if (!response.success) {
        throw new Error(`${response.error || 'Endpoint nicht gefunden'}`);
      }
      
      return response;
    } catch (err) {
      console.error(`Admin API Call failed for ${endpoint}:`, err);
      throw err;
    }
  };

  // Retry-Funktion für Admin-Daten
  const retryLoadAdminData = async () => {
    setError(null);
    setLoading(true);
    
    try {
      // Token aus localStorage löschen um Neuanmeldung zu erzwingen
      localStorage.removeItem('auth_token');
      apiService.clearAuthToken();
      
      // Seite neu laden um Login-Overlay zu zeigen
      window.location.reload();
    } catch (err) {
      setError('Fehler beim Neuladen. Bitte Seite manuell aktualisieren.');
      setLoading(false);
    }
  };

  // Daten laden
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        
        // Nur funktionierende Endpoints aufrufen
        const [dashboardRes] = await Promise.all([
          adminApiCall('dashboard')
        ]);

        setAdminData({
          dashboard: dashboardRes.data,
          aiProviders: null, // Nicht verfügbar
          systemLogs: [], // Nicht verfügbar
          ocrLogs: [] // Nicht verfügbar
        });
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Admin-Daten');
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  // Tab-Konfiguration
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
    { id: 'users', name: 'Benutzerverwaltung', icon: UserGroupIcon },
    { id: 'system', name: 'System-Management', icon: Cog6ToothIcon },
    { id: 'ai-management', name: 'KI-Management', icon: CpuChipIcon },
    { id: 'logs', name: 'Logs & Monitoring', icon: DocumentTextIcon },
    { id: 'database', name: 'Datenbank', icon: ServerIcon },
    { id: 'entities', name: 'Entitäten', icon: TagIcon }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Admin-Bereich...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Admin-Zugriff fehlgeschlagen</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button 
            onClick={retryLoadAdminData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Cog6ToothIcon className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                Admin-Management
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                System Online
              </div>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleString('de-DE')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-64 mr-8">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <DashboardTab data={adminData.dashboard} />
            )}
            
            {activeTab === 'users' && (
              <div className="text-center py-8">
                <p className="text-gray-500">Benutzerverwaltung ist temporär deaktiviert</p>
              </div>
            )}
            
            {activeTab === 'system' && (
              <SystemManagement />
            )}
            
            {activeTab === 'ai-management' && (
              <AIManagement />
            )}
            
            {activeTab === 'logs' && (
              <LogsTab 
                systemLogs={adminData.systemLogs} 
                ocrLogs={adminData.ocrLogs} 
              />
            )}
            
            {activeTab === 'database' && (
              <DatabaseTab />
            )}
            
            {activeTab === 'entities' && (
              <EntityManagement />
            )}
            
            {activeTab === 'system' && (
              <SystemConfigTab />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return <div>Lade Dashboard...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Admin-Dashboard</h2>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Benutzer</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Aktive Projekte</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.activeProjects}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">OCR Heute</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.ocrProcessedToday}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">System-Health</p>
              <p className="text-lg font-semibold text-green-600 capitalize">{data.overview.systemHealth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KI Usage Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">KI-Nutzung</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">OpenAI Aufrufe</p>
            <p className="text-xl font-bold text-gray-900">{data.aiUsage.openaiCalls}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Claude Aufrufe</p>
            <p className="text-xl font-bold text-gray-900">{data.aiUsage.anthropicCalls}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Gesamtkosten</p>
            <p className="text-xl font-bold text-gray-900">€{data.aiUsage.totalCost}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ø Confidence</p>
            <p className="text-xl font-bold text-gray-900">{data.aiUsage.avgConfidence}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// AI Management Tab Component
const AIManagementTab: React.FC<{ providers: any }> = ({ providers }) => {
  if (!providers) return <div>Lade KI-Provider...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">KI-System-Management</h2>
      
      {/* AI Providers */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">KI-Provider</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Object.entries(providers).map(([key, provider]: [string, any]) => (
              <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center">
                  <CpuChipIcon className="h-8 w-8 text-blue-600 mr-4" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                    <p className="text-sm text-gray-500">Model: {provider.model}</p>
                    <p className="text-sm text-gray-500">
                      Capabilities: {provider.capabilities.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    provider.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {provider.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    €{provider.costPerToken}/Token
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Prompts */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">System-Prompts</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-600">System-Prompt-Editor wird in Story 8.2 implementiert...</p>
        </div>
      </div>
    </div>
  );
};

// Logs Tab Component
const LogsTab: React.FC<{ systemLogs: any[], ocrLogs: any[] }> = ({ systemLogs, ocrLogs }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Logs & Monitoring</h2>
      
      {/* System Logs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">System-Logs</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {systemLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      log.level === 'success' ? 'bg-green-100 text-green-800' :
                      log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      log.level === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">{log.source}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString('de-DE')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mt-1">{log.message}</p>
                  {log.details && (
                    <pre className="text-xs text-gray-600 mt-2 bg-white p-2 rounded border">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* OCR Logs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">OCR-Processing-Logs</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {ocrLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{log.fileName}</p>
                  <p className="text-sm text-gray-500">
                    {log.aiProvider} • {log.confidence}% Confidence • {log.processingTime}ms
                  </p>
                  {log.detectedSupplier && (
                    <p className="text-sm text-blue-600">→ {log.detectedSupplier}</p>
                  )}
                </div>
                <span className={`px-3 py-1 text-sm rounded-full ${
                  log.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  log.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder Components für andere Tabs
const DatabaseTab: React.FC = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Datenbank-Management</h2>
    <p className="text-gray-600">Datenbank-Konfiguration wird in Story 8.4 implementiert...</p>
  </div>
);

const EntitiesTab: React.FC = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Entitäten-Management</h2>
    <p className="text-gray-600">Kategorien, Teams, Rollen, Tags, Lieferanten werden in Stories 8.5-8.9 implementiert...</p>
  </div>
);

const SystemConfigTab: React.FC = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">System-Konfiguration</h2>
    <p className="text-gray-600">System-Einstellungen werden in Story 8.10 implementiert...</p>
  </div>
);

export default AdminPage;
