// =====================================================
// System Prompt Modal - CREATE/EDIT für System-Prompts
// Epic 8 - Story 8.6: System-Prompt-Editor
// =====================================================

import React, { useState, useEffect } from 'react';
import { X, Save, Brain } from 'lucide-react';

interface SystemPrompt {
  id?: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  model: string;
  prompt_text: string;
  is_active: boolean;
  is_default: boolean;
}

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (promptData: SystemPrompt) => void;
  prompt?: SystemPrompt | null;
  title: string;
}

export const SystemPromptModal: React.FC<SystemPromptModalProps> = ({
  isOpen,
  onClose,
  onSave,
  prompt,
  title
}) => {
  const [formData, setFormData] = useState<SystemPrompt>({
    name: '',
    description: '',
    category: 'GENERAL',
    provider: 'openai',
    model: 'gpt-4',
    prompt_text: '',
    is_active: true,
    is_default: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (prompt) {
      setFormData({
        id: prompt.id,
        name: prompt.name || '',
        description: prompt.description || '',
        category: prompt.category || 'GENERAL',
        provider: prompt.provider || 'openai',
        model: prompt.model || 'gpt-4',
        prompt_text: prompt.prompt_text || '',
        is_active: prompt.is_active ?? true,
        is_default: prompt.is_default ?? false
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'GENERAL',
        provider: 'openai',
        model: 'gpt-4',
        prompt_text: '',
        is_active: true,
        is_default: false
      });
    }
    setErrors({});
  }, [prompt, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    if (!formData.category) {
      newErrors.category = 'Kategorie ist erforderlich';
    }

    if (!formData.provider) {
      newErrors.provider = 'Provider ist erforderlich';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Modell ist erforderlich';
    }

    if (!formData.prompt_text.trim()) {
      newErrors.prompt_text = 'Prompt-Text ist erforderlich';
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

  const handleInputChange = (field: keyof SystemPrompt, value: any) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Brain className="w-6 h-6 text-blue-600 mr-2" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
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
                placeholder="z.B. ocr_invoice_extraction"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Kategorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="GENERAL">Allgemein</option>
                <option value="OCR">OCR</option>
                <option value="SUPPLIER_RECOGNITION">Lieferanten-Erkennung</option>
                <option value="BUDGET_ANALYSIS">Budget-Analyse</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI-Provider *
              </label>
              <select
                value={formData.provider}
                onChange={(e) => handleInputChange('provider', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.provider ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="custom">Custom</option>
              </select>
              {errors.provider && (
                <p className="mt-1 text-sm text-red-600">{errors.provider}</p>
              )}
            </div>

            {/* Modell */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modell *
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.model ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="z.B. gpt-4, claude-3-sonnet"
              />
              {errors.model && (
                <p className="mt-1 text-sm text-red-600">{errors.model}</p>
              )}
            </div>
          </div>

          {/* Beschreibung */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Kurze Beschreibung des Prompts"
            />
          </div>

          {/* Prompt-Text */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt-Text *
            </label>
            <textarea
              value={formData.prompt_text}
              onChange={(e) => handleInputChange('prompt_text', e.target.value)}
              rows={8}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.prompt_text ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Geben Sie hier den System-Prompt ein..."
            />
            {errors.prompt_text && (
              <p className="mt-1 text-sm text-red-600">{errors.prompt_text}</p>
            )}
          </div>

          {/* Checkboxes */}
          <div className="mt-6 flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Aktiv</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => handleInputChange('is_default', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Standard für diese Kategorie</span>
            </label>
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
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemPromptModal;





