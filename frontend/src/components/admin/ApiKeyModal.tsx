// =====================================================
// API Key Modal - CREATE für API-Keys
// Epic 8 - Story 8.7: API-Key-Management
// =====================================================

import React, { useState, useEffect } from 'react';
import { X, Save, Key, Eye, EyeOff } from 'lucide-react';

interface ApiKeyData {
  service_name: string;
  key_name: string;
  description: string;
  api_key: string;
  expires_at?: string;
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKeyData: ApiKeyData) => void;
  title: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title
}) => {
  const [formData, setFormData] = useState<ApiKeyData>({
    service_name: '',
    key_name: '',
    description: '',
    api_key: '',
    expires_at: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        service_name: '',
        key_name: '',
        description: '',
        api_key: '',
        expires_at: ''
      });
      setErrors({});
      setShowApiKey(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.service_name.trim()) {
      newErrors.service_name = 'Service-Name ist erforderlich';
    }

    if (!formData.key_name.trim()) {
      newErrors.key_name = 'Key-Name ist erforderlich';
    }

    if (!formData.api_key.trim()) {
      newErrors.api_key = 'API-Key ist erforderlich';
    } else if (formData.api_key.length < 10) {
      newErrors.api_key = 'API-Key muss mindestens 10 Zeichen lang sein';
    }

    // Validate expiration date if provided
    if (formData.expires_at) {
      const expirationDate = new Date(formData.expires_at);
      const today = new Date();
      if (expirationDate <= today) {
        newErrors.expires_at = 'Ablaufdatum muss in der Zukunft liegen';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: keyof ApiKeyData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const getServiceOptions = () => [
    { value: 'OpenAI', label: 'OpenAI' },
    { value: 'Anthropic', label: 'Anthropic' },
    { value: 'Supabase', label: 'Supabase' },
    { value: 'Google Cloud', label: 'Google Cloud' },
    { value: 'AWS', label: 'AWS' },
    { value: 'Custom', label: 'Custom Service' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Key className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Service Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service-Name *
              </label>
              <select
                value={formData.service_name}
                onChange={(e) => handleInputChange('service_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.service_name ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Service auswählen</option>
                {getServiceOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.service_name && (
                <p className="mt-1 text-sm text-red-600">{errors.service_name}</p>
              )}
            </div>

            {/* Key Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key-Name *
              </label>
              <input
                type="text"
                value={formData.key_name}
                onChange={(e) => handleInputChange('key_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.key_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="z.B. Production Key, Development Key"
              />
              {errors.key_name && (
                <p className="mt-1 text-sm text-red-600">{errors.key_name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Kurze Beschreibung des API-Keys"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API-Key *
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.api_key}
                  onChange={(e) => handleInputChange('api_key', e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.api_key ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Geben Sie den API-Key ein"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.api_key && (
                <p className="mt-1 text-sm text-red-600">{errors.api_key}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Der API-Key wird verschlüsselt in der Datenbank gespeichert
              </p>
            </div>

            {/* Expiration Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ablaufdatum (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => handleInputChange('expires_at', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.expires_at ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.expires_at && (
                <p className="mt-1 text-sm text-red-600">{errors.expires_at}</p>
              )}
            </div>
          </div>

          {/* Security Warning */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <Key className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Sicherheitshinweis
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    API-Keys werden verschlüsselt gespeichert und sind nur für SuperAdmins sichtbar. 
                    Teilen Sie API-Keys niemals mit unbefugten Personen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            API-Key speichern
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;





