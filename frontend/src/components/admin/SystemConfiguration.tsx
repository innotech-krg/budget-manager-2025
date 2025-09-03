// =====================================================
// System Configuration Component
// Epic 8 - System-Konfiguration und Datenabgleich
// =====================================================

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Key, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  FileText,
  Users,
  Download,
  Upload
} from 'lucide-react';
import { apiService } from '../../services/apiService';

interface DataSyncStatus {
  ocrInvoices: number;
  ocrSuppliers: number;
  dbSuppliers: number;
  syncNeeded: boolean;
  lastSync?: string;
}

interface SystemConfig {
  ocrEngine: string;
  defaultCurrency: string;
  budgetWarningThreshold: number;
  budgetCriticalThreshold: number;
  autoBackup: boolean;
  backupRetentionDays: number;
}

export const SystemConfiguration: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<DataSyncStatus | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load data sync status
      const syncResponse = await apiService.get('/api/admin/system/sync-status');
      if (syncResponse.success) {
        setSyncStatus(syncResponse.data);
      }

      // Load system configuration
      const configResponse = await apiService.get('/api/admin/system/config');
      if (configResponse.success) {
        setSystemConfig(configResponse.data);
      }

    } catch (err: any) {
      console.error('❌ Fehler beim Laden der System-Daten:', err);
      setError(err.message || 'Fehler beim Laden der System-Konfiguration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);

      const response = await apiService.post('/api/admin/system/sync-data');
      if (response.success) {
        setSuccessMessage('Datenabgleich erfolgreich durchgeführt');
        await loadSystemData(); // Reload data
      } else {
        setError(response.message || 'Fehler beim Datenabgleich');
      }
    } catch (err: any) {
      console.error('❌ Fehler beim Datenabgleich:', err);
      setError(err.message || 'Fehler beim Datenabgleich');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConfigUpdate = async (newConfig: Partial<SystemConfig>) => {
    try {
      const response = await apiService.put('/api/admin/system/config', newConfig);
      if (response.success) {
        setSuccessMessage('System-Konfiguration erfolgreich aktualisiert');
        setSystemConfig(prev => prev ? { ...prev, ...newConfig } : null);
      } else {
        setError(response.message || 'Fehler beim Aktualisieren der Konfiguration');
      }
    } catch (err: any) {
      console.error('❌ Fehler beim Aktualisieren der Konfiguration:', err);
      setError(err.message || 'Fehler beim Aktualisieren der Konfiguration');
    }
  };

  const handleEnvSync = async () => {
    try {
      setError(null);
      const response = await apiService.post('/api/admin/system/sync-env-keys');
      if (response.success) {
        setSuccessMessage('API-Keys aus .env erfolgreich synchronisiert');
      } else {
        setError(response.message || 'Fehler beim Synchronisieren der API-Keys');
      }
    } catch (err: any) {
      console.error('❌ Fehler beim Synchronisieren der API-Keys:', err);
      setError(err.message || 'Fehler beim Synchronisieren der API-Keys');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Lade System-Konfiguration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Data Synchronization */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Database className="w-5 h-5 text-blue-600 mr-2" />
          Datenabgleich OCR ↔ Datenbank
        </h3>

        {syncStatus && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">OCR Rechnungen</p>
                    <p className="text-2xl font-bold text-blue-900">{syncStatus.ocrInvoices}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">OCR Lieferanten</p>
                    <p className="text-2xl font-bold text-green-900">{syncStatus.ocrSuppliers}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">DB Lieferanten</p>
                    <p className="text-2xl font-bold text-purple-900">{syncStatus.dbSuppliers}</p>
                  </div>
                  <Database className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {syncStatus.syncNeeded && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="font-medium text-yellow-800">Synchronisation erforderlich</p>
                    <p className="text-sm text-yellow-700">
                      OCR-Daten und Datenbank-Einträge sind nicht synchron. 
                      Führen Sie einen Datenabgleich durch.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleDataSync}
                disabled={isSyncing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {isSyncing ? 'Synchronisiere...' : 'Daten synchronisieren'}
              </button>

              <button
                onClick={loadSystemData}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Aktualisieren
              </button>
            </div>
          </div>
        )}
      </div>

      {/* API Keys Synchronization */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Key className="w-5 h-5 text-green-600 mr-2" />
          API-Keys aus .env synchronisieren
        </h3>

        <p className="text-gray-600 mb-4">
          Synchronisiert API-Keys aus der .env-Datei mit dem System-Management.
          Bestehende Keys werden aktualisiert, neue Keys werden hinzugefügt.
        </p>

        <button
          onClick={handleEnvSync}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
        >
          <Upload className="w-4 h-4 mr-2" />
          API-Keys aus .env importieren
        </button>
      </div>

      {/* System Configuration */}
      {systemConfig && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 text-gray-600 mr-2" />
            System-Einstellungen
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OCR-Engine
              </label>
              <select
                value={systemConfig.ocrEngine}
                onChange={(e) => handleConfigUpdate({ ocrEngine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="tesseract">Tesseract (Lokal)</option>
                <option value="google-vision">Google Cloud Vision</option>
                <option value="aws-textract">AWS Textract</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard-Währung
              </label>
              <select
                value={systemConfig.defaultCurrency}
                onChange={(e) => handleConfigUpdate({ defaultCurrency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (US-Dollar)</option>
                <option value="CHF">CHF (Schweizer Franken)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget-Warnschwelle (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={systemConfig.budgetWarningThreshold}
                onChange={(e) => handleConfigUpdate({ budgetWarningThreshold: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget-Kritisch-Schwelle (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={systemConfig.budgetCriticalThreshold}
                onChange={(e) => handleConfigUpdate({ budgetCriticalThreshold: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={systemConfig.autoBackup}
                    onChange={(e) => handleConfigUpdate({ autoBackup: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Automatische Backups</span>
                </label>

                {systemConfig.autoBackup && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Aufbewahrung:</span>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={systemConfig.backupRetentionDays}
                      onChange={(e) => handleConfigUpdate({ backupRetentionDays: parseInt(e.target.value) })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-700">Tage</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemConfiguration;
