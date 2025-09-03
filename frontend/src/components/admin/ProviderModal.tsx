// =====================================================
// PROVIDER MODAL COMPONENT
// @po.mdc - Woche 1, Tag 1
// =====================================================

import React, { useState, useEffect } from 'react';
import { X, Save, TestTube, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface AIProvider {
  id?: string;
  name: string;
  description: string;
  api_endpoint: string;
  default_model: string;
  rate_limit_per_minute: number;
  cost_per_1k_tokens: number;
  is_active: boolean;
}

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider?: AIProvider | null;
  onSave: (provider: Omit<AIProvider, 'id'>) => Promise<void>;
  onTest?: (providerId: string) => Promise<{ success: boolean; data?: any; message?: string }>;
}

export const ProviderModal: React.FC<ProviderModalProps> = ({
  isOpen,
  onClose,
  provider,
  onSave,
  onTest
}) => {
  const [formData, setFormData] = useState<Omit<AIProvider, 'id'>>({
    name: '',
    description: '',
    api_endpoint: '',
    default_model: '',
    rate_limit_per_minute: 60,
    cost_per_1k_tokens: 0.01,
    is_active: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!provider;

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        description: provider.description,
        api_endpoint: provider.api_endpoint,
        default_model: provider.default_model,
        rate_limit_per_minute: provider.rate_limit_per_minute,
        cost_per_1k_tokens: provider.cost_per_1k_tokens,
        is_active: provider.is_active
      });
    } else {
      setFormData({
        name: '',
        description: '',
        api_endpoint: '',
        default_model: '',
        rate_limit_per_minute: 60,
        cost_per_1k_tokens: 0.01,
        is_active: true
      });
    }
    setErrors({});
    setTestResult(null);
  }, [provider, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    if (!formData.api_endpoint.trim()) {
      newErrors.api_endpoint = 'API-Endpoint ist erforderlich';
    } else if (!formData.api_endpoint.startsWith('http')) {
      newErrors.api_endpoint = 'API-Endpoint muss mit http:// oder https:// beginnen';
    }

    if (!formData.default_model.trim()) {
      newErrors.default_model = 'Default-Model ist erforderlich';
    }

    if (formData.rate_limit_per_minute < 1) {
      newErrors.rate_limit_per_minute = 'Rate-Limit muss mindestens 1 sein';
    }

    if (formData.cost_per_1k_tokens < 0) {
      newErrors.cost_per_1k_tokens = 'Kosten können nicht negativ sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!provider?.id || !onTest) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await onTest(provider.id);
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? 'Verbindung erfolgreich' : 'Verbindung fehlgeschlagen')
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Fehler beim Testen der Verbindung'
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'KI-Provider bearbeiten' : 'Neuer KI-Provider'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="z.B. openai, anthropic"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default-Model *
              </label>
              <input
                type="text"
                value={formData.default_model}
                onChange={(e) => handleInputChange('default_model', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.default_model ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="z.B. gpt-4o, claude-3-sonnet"
              />
              {errors.default_model && (
                <p className="mt-1 text-sm text-red-600">{errors.default_model}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Beschreibung des KI-Providers..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API-Endpoint *
            </label>
            <input
              type="url"
              value={formData.api_endpoint}
              onChange={(e) => handleInputChange('api_endpoint', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.api_endpoint ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://api.openai.com/v1"
            />
            {errors.api_endpoint && (
              <p className="mt-1 text-sm text-red-600">{errors.api_endpoint}</p>
            )}
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate-Limit (pro Minute)
              </label>
              <input
                type="number"
                min="1"
                value={formData.rate_limit_per_minute}
                onChange={(e) => handleInputChange('rate_limit_per_minute', parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.rate_limit_per_minute ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.rate_limit_per_minute && (
                <p className="mt-1 text-sm text-red-600">{errors.rate_limit_per_minute}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kosten (€ pro 1k Tokens)
              </label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={formData.cost_per_1k_tokens}
                onChange={(e) => handleInputChange('cost_per_1k_tokens', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cost_per_1k_tokens ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.cost_per_1k_tokens && (
                <p className="mt-1 text-sm text-red-600">{errors.cost_per_1k_tokens}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Provider ist aktiv
            </label>
          </div>

          {/* Test Connection (nur im Edit-Modus) */}
          {isEditMode && onTest && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Verbindung testen</h3>
                <button
                  onClick={handleTest}
                  disabled={isTesting}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  {isTesting ? 'Teste...' : 'Verbindung testen'}
                </button>
              </div>

              {testResult && (
                <div className={`flex items-center p-3 rounded-lg ${
                  testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2" />
                  )}
                  <span className="text-sm">{testResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Speichere...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderModal;





