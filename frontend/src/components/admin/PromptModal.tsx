import React, { useState, useEffect } from 'react';
import { X, Brain, Save, AlertCircle } from 'lucide-react';

interface SystemPrompt {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  model: string;
  prompt_text: string;
  version: number;
  is_active: boolean;
  is_default: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (promptData: any) => void;
  prompt?: SystemPrompt | null;
}

const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, onSave, prompt }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    provider: 'openai',
    model: 'gpt-4o',
    prompt_text: '',
    is_active: true,
    is_default: false,
    supplier_id: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Categories for dropdown
  const categories = [
    'OCR',
    'SUPPLIER_RECOGNITION',
    'SUPPLIER_PROCESSING',
    'BUDGET_ANALYSIS',
    'INVOICE_PROCESSING',
    'PATTERN_LEARNING',
    'DATA_EXTRACTION',
    'QUALITY_CONTROL'
  ];

  // Suppliers state
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Provider options
  const providers = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { value: 'anthropic', label: 'Anthropic', models: ['claude-3-sonnet', 'claude-3-haiku'] }
  ];

  useEffect(() => {
    if (prompt) {
      setFormData({
        name: prompt.name,
        description: prompt.description,
        category: prompt.category,
        provider: prompt.provider,
        model: prompt.model,
        prompt_text: prompt.prompt_text,
        is_active: prompt.is_active,
        is_default: prompt.is_default,
        supplier_id: prompt.supplier_id || null
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'OCR',
        provider: 'openai',
        model: 'gpt-4o',
        prompt_text: '',
        is_active: true,
        is_default: false,
        supplier_id: null
      });
    }
    setErrors({});
  }, [prompt, isOpen]);

  // Load suppliers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
    }
  }, [isOpen]);

  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const response = await fetch('/api/suppliers');
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Lieferanten geladen:', result);
        setSuppliers(result.data || []);
      } else {
        console.error('❌ Fehler beim Laden der Lieferanten:', response.status);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Lieferanten:', error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    const providerConfig = providers.find(p => p.value === newProvider);
    
    setFormData(prev => ({
      ...prev,
      provider: newProvider,
      model: providerConfig?.models[0] || 'gpt-4o'
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Kategorie ist erforderlich';
    }
    if (!formData.prompt_text.trim()) {
      newErrors.prompt_text = 'Prompt-Text ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedProvider = providers.find(p => p.value === formData.provider);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <Brain className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">
              {prompt ? 'System-Prompt bearbeiten' : 'Neuer System-Prompt'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="z.B. ocr_invoice_extraction"
                disabled={saving}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategorie *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={saving}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.category}
                </p>
              )}
            </div>

            {/* Supplier (only for SUPPLIER_PROCESSING category) */}
            {formData.category === 'SUPPLIER_PROCESSING' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lieferant *
                </label>
                <select
                  name="supplier_id"
                  value={formData.supplier_id || ''}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.supplier_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={saving || loadingSuppliers}
                >
                  <option value="">Lieferant auswählen...</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {loadingSuppliers && (
                  <p className="mt-1 text-sm text-gray-500">Lade Lieferanten...</p>
                )}
                {errors.supplier_id && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.supplier_id}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Wählen Sie einen Lieferanten für lieferantenspezifische Prompts
                </p>
              </div>
            )}

            {/* Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                KI-Provider *
              </label>
              <select
                name="provider"
                value={formData.provider}
                onChange={handleProviderChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
              >
                {providers.map(provider => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modell *
              </label>
              <select
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
              >
                {selectedProvider?.models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung *
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Kurze Beschreibung des Prompt-Zwecks"
              disabled={saving}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Prompt Text */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt-Text *
            </label>
            <textarea
              name="prompt_text"
              value={formData.prompt_text}
              onChange={handleInputChange}
              rows={8}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.prompt_text ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Der vollständige Prompt-Text für die KI..."
              disabled={saving}
            />
            {errors.prompt_text && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.prompt_text}
              </p>
            )}
          </div>

          {/* Checkboxes */}
          <div className="mt-6 flex space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={saving}
              />
              <span className="ml-2 text-sm text-gray-700">Aktiv</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_default"
                checked={formData.is_default}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={saving}
              />
              <span className="ml-2 text-sm text-gray-700">Standard für Kategorie</span>
            </label>
          </div>
        </form>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Speichern...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {prompt ? 'Aktualisieren' : 'Erstellen'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
