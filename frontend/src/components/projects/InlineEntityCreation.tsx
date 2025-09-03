// =====================================================
// Budget Manager 2025 - Inline Entity Creation
// Epic 9 - Story 9.4: Inline-Entity-Creation
// =====================================================

import React, { useState } from 'react';
import { PlusIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface InlineEntityCreationProps {
  entityType: 'categories' | 'tags' | 'suppliers' | 'teams';
  onEntityCreated: (entity: any) => void;
  onCancel: () => void;
  isVisible: boolean;
}

const InlineEntityCreation: React.FC<InlineEntityCreationProps> = ({
  entityType,
  onEntityCreated,
  onCancel,
  isVisible
}) => {
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isVisible) return null;

  const getEntityConfig = () => {
    switch (entityType) {
      case 'categories':
        return {
          title: 'Neue Kategorie erstellen',
          fields: [
            { key: 'name', label: 'Kategorie-Name', type: 'text', required: true, placeholder: 'z.B. Software-Entwicklung' }
          ],
          apiEndpoint: '/api/categories'
        };
      case 'tags':
        return {
          title: 'Neuen Tag erstellen',
          fields: [
            { key: 'name', label: 'Tag-Name', type: 'text', required: true, placeholder: 'z.B. Priorität-Hoch' },
            { key: 'color', label: 'Farbe', type: 'color', required: false, placeholder: '#3B82F6' }
          ],
          apiEndpoint: '/api/tags'
        };
      case 'suppliers':
        return {
          title: 'Neuen Lieferanten erstellen',
          fields: [
            { key: 'name', label: 'Firmenname', type: 'text', required: true, placeholder: 'z.B. InnoTech Solutions GmbH' },
            { key: 'email', label: 'E-Mail', type: 'email', required: false, placeholder: 'kontakt@firma.at' },
            { key: 'phone', label: 'Telefon', type: 'tel', required: false, placeholder: '+43 1 234 5678' }
          ],
          apiEndpoint: '/api/suppliers'
        };
      case 'teams':
        return {
          title: 'Neues Team erstellen',
          fields: [
            { key: 'name', label: 'Team-Name', type: 'text', required: true, placeholder: 'z.B. Frontend-Entwicklung' },
            { key: 'description', label: 'Beschreibung', type: 'textarea', required: false, placeholder: 'Team-Beschreibung...' }
          ],
          apiEndpoint: '/api/teams'
        };
      default:
        return { title: '', fields: [], apiEndpoint: '' };
    }
  };

  const config = getEntityConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Fehler beim Erstellen: ${response.statusText}`);
      }

      const newEntity = await response.json();
      onEntityCreated(newEntity);
      setFormData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-full max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">{config.title}</h4>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {config.fields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={formData[field.key] || ''}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={2}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <input
                type={field.type}
                value={formData[field.key] || ''}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>
        ))}

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                Erstellen...
              </>
            ) : (
              <>
                <CheckIcon className="w-3 h-3 mr-1" />
                Erstellen
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InlineEntityCreation;
