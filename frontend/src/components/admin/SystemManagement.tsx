// =====================================================
// Budget Manager 2025 - System Management Component
// Epic 8 - Story 8.6: System-Prompt-Editor + API Keys + Logs
// =====================================================

import React, { useState, useEffect } from 'react';
import { 
  Cog, 
  Brain, 
  Key, 
  FileText, 
  Edit, 
  Save, 
  Eye, 
  EyeOff,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Database,
  Zap,
  Filter,
  Search,
  Calendar,
  Download
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import SystemPromptModal from './SystemPromptModal';
import ApiKeyModal from './ApiKeyModal';
import SystemConfiguration from './SystemConfiguration';

// Types
interface SystemPrompt {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  model: string;
  version: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface AIProvider {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  default_model: string;
  rate_limit_per_minute: number;
  cost_per_1k_tokens: number;
  last_used_at?: string;
}

interface SystemLog {
  id: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  category: string;
  message: string;
  details?: any;
  user_id?: string;
  ip_address?: string;
  created_at: string;
}

interface APIKey {
  id: string;
  service_name: string;
  key_name: string;
  description: string;
  is_active: boolean;
  expires_at?: string;
  last_used_at?: string;
  usage_count: number;
  created_at: string;
}

/**
 * SystemManagement - Erweiterte Admin-Tools
 * Features: System-Prompts, AI-Provider, API-Keys, System-Logs
 */
export const SystemManagement: React.FC = () => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================

  const [activeTab, setActiveTab] = useState<'api-keys' | 'logs'>('api-keys');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data States
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [logCategories, setLogCategories] = useState<string[]>([]);

  // Filter States
  const [logFilter, setLogFilter] = useState({
    level: '',
    category: '',
    search: ''
  });

  // Modal States
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPrompt | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  // =====================================================
  // DATA LOADING
  // =====================================================

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Lade System-Management Daten...');

      const [promptsRes, providersRes, apiKeysRes, logsRes, categoriesRes] = await Promise.all([
        apiService.get('/api/admin/system/prompts'),
        apiService.get('/api/admin/system/ai-providers'),
        apiService.get('/api/admin/system/api-keys'),
        apiService.get('/api/admin/system/logs?limit=50'),
        apiService.get('/api/admin/system/logs/categories')
      ]);

      console.log('📊 API Responses:', {
        prompts: promptsRes,
        providers: providersRes,
        apiKeys: apiKeysRes,
        logs: logsRes,
        categories: categoriesRes
      });

      if (promptsRes.success) {
        setPrompts(promptsRes.data);
        console.log('✅ System-Prompts geladen:', promptsRes.data?.length);
      } else {
        console.error('❌ Fehler bei System-Prompts:', promptsRes);
      }

      if (providersRes.success) {
        setProviders(providersRes.data);
        console.log('✅ AI-Provider geladen:', providersRes.data?.length);
      } else {
        console.error('❌ Fehler bei AI-Providern:', providersRes);
      }

      if (apiKeysRes.success) {
        setApiKeys(apiKeysRes.data);
        console.log('✅ API-Keys geladen:', apiKeysRes.data?.length);
      } else {
        console.error('❌ Fehler bei API-Keys:', apiKeysRes);
      }

      if (logsRes.success) {
        setLogs(logsRes.data);
        console.log('✅ System-Logs geladen:', logsRes.data?.length);
      } else {
        console.error('❌ Fehler bei System-Logs:', logsRes);
      }

      if (categoriesRes.success) {
        setLogCategories(categoriesRes.data);
        console.log('✅ Log-Kategorien geladen:', categoriesRes.data?.length);
      } else {
        console.error('❌ Fehler bei Log-Kategorien:', categoriesRes);
      }

    } catch (err: any) {
      console.error('❌ Fehler beim Laden der System-Daten:', err);
      setError(err.message || 'Fehler beim Laden der System-Daten');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-600 bg-red-50';
      case 'WARN': return 'text-yellow-600 bg-yellow-50';
      case 'INFO': return 'text-blue-600 bg-blue-50';
      case 'DEBUG': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'OCR': return <Brain className="w-4 h-4" />;
      case 'SUPPLIER_RECOGNITION': return <Search className="w-4 h-4" />;
      case 'BUDGET_ANALYSIS': return <Activity className="w-4 h-4" />;
      default: return <Cog className="w-4 h-4" />;
    }
  };

  // =====================================================
  // CRUD OPERATIONS
  // =====================================================

  const handleSavePrompt = async (promptData: any) => {
    try {
      let response;
      
      if (isEditingPrompt && selectedPrompt?.id) {
        // Update existing prompt
        response = await apiService.put(`/api/admin/system/prompts/${selectedPrompt.id}`, promptData);
        if (response.success) {
          setSuccessMessage('System-Prompt erfolgreich aktualisiert');
        }
      } else {
        // Create new prompt
        response = await apiService.post('/api/admin/system/prompts', promptData);
        if (response.success) {
          setSuccessMessage('System-Prompt erfolgreich erstellt');
        }
      }

      if (response.success) {
        await loadData(); // Reload data
        setShowPromptEditor(false);
        setSelectedPrompt(null);
        setIsEditingPrompt(false);
      } else {
        setError(response.message || 'Fehler beim Speichern des System-Prompts');
      }
    } catch (error: any) {
      console.error('❌ Fehler beim Speichern des Prompts:', error);
      setError(error.message || 'Fehler beim Speichern des System-Prompts');
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen System-Prompt löschen möchten?')) {
      return;
    }

    try {
      const response = await apiService.delete(`/api/admin/system/prompts/${id}`);
      if (response.success) {
        setSuccessMessage('System-Prompt erfolgreich gelöscht');
        await loadData(); // Reload data
      } else {
        setError(response.message || 'Fehler beim Löschen des System-Prompts');
      }
    } catch (error: any) {
      console.error('❌ Fehler beim Löschen des Prompts:', error);
      setError(error.message || 'Fehler beim Löschen des System-Prompts');
    }
  };

  const handleSaveApiKey = async (apiKeyData: any) => {
    try {
      const response = await apiService.post('/api/admin/system/api-keys', apiKeyData);
      if (response.success) {
        setSuccessMessage('API-Key erfolgreich erstellt');
        await loadData(); // Reload data
        setShowApiKeyModal(false);
      } else {
        setError(response.message || 'Fehler beim Erstellen des API-Keys');
      }
    } catch (error: any) {
      console.error('❌ Fehler beim Erstellen des API-Keys:', error);
      setError(error.message || 'Fehler beim Erstellen des API-Keys');
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen API-Key löschen möchten?')) {
      return;
    }

    try {
      const response = await apiService.delete(`/api/admin/system/api-keys/${id}`);
      if (response.success) {
        setSuccessMessage('API-Key erfolgreich gelöscht');
        await loadData(); // Reload data
      } else {
        setError(response.message || 'Fehler beim Löschen des API-Keys');
      }
    } catch (error: any) {
      console.error('❌ Fehler beim Löschen des API-Keys:', error);
      setError(error.message || 'Fehler beim Löschen des API-Keys');
    }
  };

  // =====================================================
  // TAB COMPONENTS
  // =====================================================

  const PromptsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">System-Prompts</h3>
        <button
          onClick={() => {
            setSelectedPrompt(null);
            setIsEditingPrompt(false);
            setShowPromptEditor(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuer Prompt
        </button>
      </div>

      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getCategoryIcon(prompt.category)}
                  <h4 className="font-medium">{prompt.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    prompt.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {prompt.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  {prompt.is_default && (
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Standard
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-2">{prompt.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{prompt.category}</span>
                  <span>{prompt.provider}</span>
                  <span>v{prompt.version}</span>
                  <span>{formatDate(prompt.updated_at)}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedPrompt(prompt);
                    setIsEditingPrompt(true);
                    setShowPromptEditor(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                  title="Bearbeiten"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePrompt(prompt.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ProvidersTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">AI-Provider</h3>
      
      <div className="grid gap-4">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-5 h-5" />
                  <h4 className="font-medium">{provider.display_name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    provider.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {provider.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Standard-Modell:</span>
                    <span className="ml-2">{provider.default_model}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Max. Rate Limit:</span>
                    <span className="ml-2">{provider.rate_limit_per_minute}/min</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Konfigurierte Preise:</span>
                    <span className="ml-2">€{provider.cost_per_1k_tokens}/1k tokens</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Letzte Nutzung:</span>
                    <span className="ml-2">
                      {provider.last_used_at ? formatDate(provider.last_used_at) : 'Wird getrackt'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ApiKeysTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">API-Keys</h3>
        <button
          onClick={() => setShowApiKeyModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuer API-Key
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Echte Nutzung</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erstellt</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {apiKeys.map((key) => (
              <tr key={key.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Key className="w-4 h-4 mr-2 text-gray-400" />
                    {key.service_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {key.key_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    key.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {key.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {key.usage_count > 0 ? `${key.usage_count} Calls` : 'Wird getrackt'}
                  {key.last_used_at && (
                    <div className="text-xs text-gray-400">
                      Zuletzt: {formatDate(key.last_used_at)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(key.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => handleDeleteApiKey(key.id)}
                    className="text-red-600 hover:text-red-900"
                    title="API-Key löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const LogsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">System-Logs</h3>
        <div className="flex space-x-2">
          <select
            value={logFilter.level}
            onChange={(e) => setLogFilter({...logFilter, level: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Alle Level</option>
            <option value="ERROR">Error</option>
            <option value="WARN">Warning</option>
            <option value="INFO">Info</option>
            <option value="DEBUG">Debug</option>
          </select>
          <select
            value={logFilter.category}
            onChange={(e) => setLogFilter({...logFilter, category: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Alle Kategorien</option>
            {logCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="border-b border-gray-100 p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-sm text-gray-500">{log.category}</span>
                    <span className="text-xs text-gray-400">{formatDate(log.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-900">{log.message}</p>
                  {log.details && (
                    <pre className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // =====================================================
  // RENDER
  // =====================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">System-Daten werden geladen...</span>
      </div>
    );
  }

  const tabs = [
    { id: 'api-keys', name: 'API-Keys', icon: Key },
    { id: 'logs', name: 'System-Logs', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Cog className="w-6 h-6 mr-2" />
          System-Management
        </h2>
        <p className="text-gray-600 mt-1">
          Erweiterte Admin-Tools für System-Konfiguration
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-800">{successMessage}</span>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-50 rounded-lg p-6">
        {activeTab === 'api-keys' && <ApiKeysTab />}
        {activeTab === 'logs' && <LogsTab />}
      </div>

      {/* System Configuration Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Cog className="w-6 h-6 text-blue-600 mr-2" />
          System-Konfiguration
        </h2>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">KI-basierte Rechnungsverarbeitung</h3>
            <p className="text-blue-800 text-sm">
              Das System verwendet moderne KI-Engines (OpenAI, Anthropic) für OCR und Rechnungsverarbeitung.
              Alle Prompts und API-Keys sind bereits optimal konfiguriert.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Aktive System-Prompts</p>
                  <p className="text-2xl font-bold text-green-900">{prompts.length}</p>
                </div>
                <Brain className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Konfigurierte API-Keys</p>
                  <p className="text-2xl font-bold text-purple-900">{apiKeys.length}</p>
                </div>
                <Key className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="text-center text-gray-600">
            <p>System läuft optimal mit bewährten KI-Konfigurationen</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SystemPromptModal
        isOpen={showPromptEditor}
        onClose={() => {
          setShowPromptEditor(false);
          setSelectedPrompt(null);
          setIsEditingPrompt(false);
        }}
        onSave={handleSavePrompt}
        prompt={selectedPrompt}
        title={isEditingPrompt ? 'System-Prompt bearbeiten' : 'Neuer System-Prompt'}
      />

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleSaveApiKey}
        title="Neuer API-Key"
      />
    </div>
  );
};

export default SystemManagement;

