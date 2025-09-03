// =====================================================
// Budget Manager 2025 - Transfer Request Form
// Story 1.4: Budget-Transfer-System - Antrags-Formular
// =====================================================

import React, { useState, useEffect } from 'react';
import { formatGermanCurrency, parseGermanCurrency } from '../../utils/currency';

interface Project {
  id: string;
  name: string;
  projektnummer: string;
  zugewiesenes_budget: number;
  verbrauchtes_budget: number;
}

interface TransferRequestFormProps {
  projects: Project[];
  onSubmit: (transferData: {
    from_project_id: string;
    to_project_id: string;
    transfer_amount: number;
    reason: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TransferRequestForm: React.FC<TransferRequestFormProps> = ({
  projects,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    from_project_id: '',
    to_project_id: '',
    transfer_amount: '',
    reason: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableBudget, setAvailableBudget] = useState<number>(0);

  // Berechne verfügbares Budget wenn Quell-Projekt ausgewählt wird
  useEffect(() => {
    if (formData.from_project_id) {
      const project = projects.find(p => p.id === formData.from_project_id);
      if (project) {
        const available = project.zugewiesenes_budget - project.verbrauchtes_budget;
        setAvailableBudget(Math.max(0, available));
      }
    } else {
      setAvailableBudget(0);
    }
  }, [formData.from_project_id, projects]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Entferne Fehler wenn Feld korrigiert wird
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Quell-Projekt validieren
    if (!formData.from_project_id) {
      newErrors.from_project_id = 'Bitte wählen Sie ein Quell-Projekt aus';
    }

    // Ziel-Projekt validieren
    if (!formData.to_project_id) {
      newErrors.to_project_id = 'Bitte wählen Sie ein Ziel-Projekt aus';
    }

    // Prüfe ob Projekte unterschiedlich sind
    if (formData.from_project_id && formData.to_project_id && 
        formData.from_project_id === formData.to_project_id) {
      newErrors.to_project_id = 'Quell- und Ziel-Projekt müssen unterschiedlich sein';
    }

    // Transfer-Betrag validieren
    if (!formData.transfer_amount) {
      newErrors.transfer_amount = 'Bitte geben Sie einen Transfer-Betrag ein';
    } else {
      const amount = parseGermanCurrency(formData.transfer_amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.transfer_amount = 'Transfer-Betrag muss eine positive Zahl sein';
      } else if (amount > availableBudget) {
        newErrors.transfer_amount = `Transfer-Betrag darf nicht höher als das verfügbare Budget sein (${formatGermanCurrency(availableBudget)})`;
      }
    }

    // Begründung validieren
    if (!formData.reason.trim()) {
      newErrors.reason = 'Bitte geben Sie eine Begründung ein';
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Begründung muss mindestens 10 Zeichen lang sein';
    } else if (formData.reason.trim().length > 1000) {
      newErrors.reason = 'Begründung darf maximal 1000 Zeichen lang sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const transferAmount = parseGermanCurrency(formData.transfer_amount);
    
    onSubmit({
      from_project_id: formData.from_project_id,
      to_project_id: formData.to_project_id,
      transfer_amount: transferAmount,
      reason: formData.reason.trim()
    });
  };

  const getProjectDisplayName = (project: Project) => {
    return `${project.name} (${project.projektnummer})`;
  };

  const getProjectBudgetInfo = (project: Project) => {
    const available = project.zugewiesenes_budget - project.verbrauchtes_budget;
    return `Verfügbar: ${formatGermanCurrency(Math.max(0, available))}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          🔄 Neuer Budget-Transfer-Antrag
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Schließen"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quell-Projekt */}
        <div>
          <label htmlFor="from_project" className="block text-sm font-medium text-gray-700 mb-2">
            📤 Von Projekt *
          </label>
          <select
            id="from_project"
            value={formData.from_project_id}
            onChange={(e) => handleInputChange('from_project_id', e.target.value)}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errors.from_project_id ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
            disabled={isLoading}
          >
            <option value="">-- Quell-Projekt auswählen --</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {getProjectDisplayName(project)} - {getProjectBudgetInfo(project)}
              </option>
            ))}
          </select>
          {errors.from_project_id && (
            <p className="mt-1 text-sm text-red-600">{errors.from_project_id}</p>
          )}
          {formData.from_project_id && (
            <p className="mt-1 text-sm text-blue-600">
              💰 Verfügbares Budget: {formatGermanCurrency(availableBudget)}
            </p>
          )}
        </div>

        {/* Ziel-Projekt */}
        <div>
          <label htmlFor="to_project" className="block text-sm font-medium text-gray-700 mb-2">
            📥 Zu Projekt *
          </label>
          <select
            id="to_project"
            value={formData.to_project_id}
            onChange={(e) => handleInputChange('to_project_id', e.target.value)}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errors.to_project_id ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
            disabled={isLoading}
          >
            <option value="">-- Ziel-Projekt auswählen --</option>
            {projects
              .filter(project => project.id !== formData.from_project_id)
              .map(project => (
                <option key={project.id} value={project.id}>
                  {getProjectDisplayName(project)}
                </option>
              ))}
          </select>
          {errors.to_project_id && (
            <p className="mt-1 text-sm text-red-600">{errors.to_project_id}</p>
          )}
        </div>

        {/* Transfer-Betrag */}
        <div>
          <label htmlFor="transfer_amount" className="block text-sm font-medium text-gray-700 mb-2">
            💰 Transfer-Betrag *
          </label>
          <div className="relative">
            <input
              type="text"
              id="transfer_amount"
              value={formData.transfer_amount}
              onChange={(e) => handleInputChange('transfer_amount', e.target.value)}
              placeholder="z.B. 15.000,00"
              className={`
                w-full px-3 py-2 pr-12 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.transfer_amount ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              `}
              disabled={isLoading}
            />
            <span className="absolute right-3 top-2 text-gray-500 text-sm">€</span>
          </div>
          {errors.transfer_amount && (
            <p className="mt-1 text-sm text-red-600">{errors.transfer_amount}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Format: Deutsche Zahlenformatierung (z.B. 1.500,50 für 1500.50 Euro)
          </p>
        </div>

        {/* Begründung */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
            📝 Begründung *
          </label>
          <textarea
            id="reason"
            value={formData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            placeholder="Bitte geben Sie eine detaillierte Begründung für den Budget-Transfer ein..."
            rows={4}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
              ${errors.reason ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
            disabled={isLoading}
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.reason.length}/1000 Zeichen (mindestens 10 erforderlich)
          </p>
        </div>

        {/* Wichtiger Hinweis */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-start">
            <span className="text-yellow-600 text-lg mr-2">⚠️</span>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Wichtiger Hinweis</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Alle Budget-Transfers erfordern eine manuelle Genehmigung. 
                Sie erhalten eine E-Mail-Benachrichtigung über den Status Ihres Antrags.
              </p>
            </div>
          </div>
        </div>

        {/* Aktions-Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            disabled={isLoading}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Antrag wird erstellt...
              </>
            ) : (
              '📤 Transfer-Antrag stellen'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransferRequestForm;

