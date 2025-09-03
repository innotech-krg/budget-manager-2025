// =====================================================
// PROVIDER TEST MODAL COMPONENT
// @po.mdc - Woche 1, Tag 3
// =====================================================

import React, { useState } from 'react';
import { X, Play, Loader, CheckCircle, AlertCircle, Clock, Zap, DollarSign } from 'lucide-react';

interface AIProvider {
  id: string;
  name: string;
  display_name: string;
  default_model: string;
  rate_limit_per_minute: number;
  cost_per_1k_tokens: number;
  is_active: boolean;
  config?: {
    description?: string;
    api_endpoint?: string;
  };
}

interface TestResult {
  success: boolean;
  message?: string;
  data?: {
    provider: string;
    response_time_ms: number;
    status: 'connected' | 'failed';
    model_tested: string;
    timestamp: string;
    details?: any;
  };
}

interface ProviderTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: AIProvider | null;
  onTest: (providerId: string) => Promise<TestResult>;
}

export const ProviderTestModal: React.FC<ProviderTestModalProps> = ({
  isOpen,
  onClose,
  provider,
  onTest
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleTest = async () => {
    if (!provider) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await onTest(provider.id);
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Fehler beim Testen der Provider-Verbindung',
        data: {
          provider: provider.display_name,
          response_time_ms: 0,
          status: 'failed',
          model_tested: provider.default_model,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClose = () => {
    setTestResult(null);
    onClose();
  };

  if (!isOpen || !provider) return null;

  const getProviderIcon = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'openai':
        return '🤖';
      case 'anthropic':
        return '🧠';
      default:
        return '⚡';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <div className="text-2xl mr-3">{getProviderIcon(provider.name)}</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Provider-Verbindung testen
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {provider.display_name} • {provider.default_model}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Provider Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Provider-Konfiguration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">API-Endpoint:</span>
                <p className="font-medium text-gray-900 break-all">
                  {provider.config?.api_endpoint || 'Standard-Endpoint'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Standard-Model:</span>
                <p className="font-medium text-gray-900">{provider.default_model}</p>
              </div>
              <div>
                <span className="text-gray-500">Rate-Limit:</span>
                <p className="font-medium text-gray-900">{provider.rate_limit_per_minute}/min</p>
              </div>
              <div>
                <span className="text-gray-500">Kosten:</span>
                <p className="font-medium text-gray-900">€{provider.cost_per_1k_tokens}/1k tokens</p>
              </div>
            </div>
          </div>

          {/* Test Button */}
          <div className="flex justify-center">
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTesting ? (
                <Loader className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Play className="w-5 h-5 mr-2" />
              )}
              {isTesting ? 'Teste Verbindung...' : 'Verbindung testen'}
            </button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                {testResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {testResult.success ? 'Verbindung erfolgreich' : 'Verbindung fehlgeschlagen'}
                </h3>
              </div>

              {testResult.success && testResult.data && (
                <>
                  {/* Success Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600">Response Time</p>
                          <p className="text-xl font-bold text-green-900">
                            {testResult.data.response_time_ms}ms
                          </p>
                        </div>
                        <Clock className="w-6 h-6 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600">Status</p>
                          <p className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(testResult.data.status)}`}>
                            {testResult.data.status === 'connected' ? 'Verbunden' : 'Fehler'}
                          </p>
                        </div>
                        <Zap className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600">Model</p>
                          <p className="text-sm font-bold text-purple-900">
                            {testResult.data.model_tested}
                          </p>
                        </div>
                        <div className="w-6 h-6 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">
                          AI
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Getestet am:</strong> {new Date(testResult.data.timestamp).toLocaleString('de-DE')}
                    </p>
                  </div>
                </>
              )}

              {/* Error Message */}
              {!testResult.success && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Fehlerdetails</h4>
                  <p className="text-sm text-red-700">{testResult.message}</p>
                  {testResult.data && (
                    <div className="mt-3 text-xs text-red-600">
                      <p><strong>Provider:</strong> {testResult.data.provider}</p>
                      <p><strong>Timestamp:</strong> {new Date(testResult.data.timestamp).toLocaleString('de-DE')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Schließen
          </button>
          {testResult && (
            <button
              onClick={() => {
                setTestResult(null);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Erneut testen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderTestModal;





