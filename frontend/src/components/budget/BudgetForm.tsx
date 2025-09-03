// =====================================================
// Budget Manager 2025 - Budget Form Component
// Formular für Budget-Erstellung und -Bearbeitung
// =====================================================

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, DollarSign, Calendar, FileText, ChevronDown } from 'lucide-react';
import { apiService } from '../../services/apiService';

interface Budget {
  id?: string;
  year: number;
  total_budget: number;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
}

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budget: Omit<Budget, 'id'>) => Promise<void>;
  budget?: Budget | null;
  mode: 'create' | 'edit';
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  isOpen,
  onClose,
  onSave,
  budget,
  mode
}) => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================

  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    total_budget: 0,
    description: '',
    status: 'DRAFT' as const
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoadingYears, setIsLoadingYears] = useState(false);

  // =====================================================
  // EFFECTS
  // =====================================================

  // Load available years when form opens
  useEffect(() => {
    if (isOpen && mode === 'create') {
      loadAvailableYears();
    }
  }, [isOpen, mode]);

  // Initialize form with budget data when editing
  useEffect(() => {
    if (mode === 'edit' && budget) {
      setFormData({
        year: budget.year,
        total_budget: budget.total_budget,
        description: budget.description,
        status: budget.status
      });
    } else {
      // Reset form for create mode
      setFormData({
        year: new Date().getFullYear(),
        total_budget: 0,
        description: '',
        status: 'DRAFT'
      });
    }
    setErrors({});
  }, [mode, budget, isOpen]);

  // =====================================================
  // API FUNCTIONS
  // =====================================================

  const loadAvailableYears = async () => {
    try {
      setIsLoadingYears(true);
      const response = await apiService.get('/api/budgets/available-years');
      
      if (response.availableYears && response.availableYears.length > 0) {
        setAvailableYears(response.availableYears);
        // Set first available year as default
        setFormData(prev => ({
          ...prev,
          year: response.availableYears[0]
        }));
      } else {
        // No available years - show error
        setErrors({ year: 'Alle Jahre haben bereits Budgets. Keine neuen Budgets möglich.' });
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden verfügbarer Jahre:', error);
      setErrors({ year: 'Verfügbare Jahre konnten nicht geladen werden.' });
    } finally {
      setIsLoadingYears(false);
    }
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Year validation
    const currentYear = new Date().getFullYear();
    if (!formData.year) {
      newErrors.year = 'Jahr ist erforderlich';
    } else if (formData.year < currentYear) {
      newErrors.year = `Jahr muss das aktuelle Jahr (${currentYear}) oder ein zukünftiges Jahr sein`;
    } else if (formData.year > currentYear + 10) {
      newErrors.year = `Jahr darf maximal ${currentYear + 10} sein`;
    }

    // Budget validation
    if (!formData.total_budget || formData.total_budget <= 0) {
      newErrors.total_budget = 'Budget muss größer als 0 sein';
    } else if (formData.total_budget > 100000000) {
      newErrors.total_budget = 'Budget darf nicht größer als 100 Millionen Euro sein';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich';
    } else if (formData.description.length < 3) {
      newErrors.description = 'Beschreibung muss mindestens 3 Zeichen lang sein';
    } else if (formData.description.length > 200) {
      newErrors.description = 'Beschreibung darf nicht länger als 200 Zeichen sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =====================================================
  // EVENT HANDLERS
  // =====================================================

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error: any) {
      setErrors({ general: error.message || 'Fehler beim Speichern des Budgets' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'Aktiv';
      case 'DRAFT':
        return 'Entwurf';
      case 'CLOSED':
        return 'Geschlossen';
      default:
        return status;
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Neues Budget erstellen' : 'Budget bearbeiten'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'create' 
                ? 'Erstellen Sie ein neues Jahresbudget für Ihr Unternehmen'
                : 'Bearbeiten Sie die Budget-Details'
              }
            </p>
          </div>
          
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* General Error */}
          {errors.general && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Year Field */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Budgetjahr
            </label>
            
            {mode === 'create' ? (
              // Dropdown for available years when creating
              <div className="relative">
                <select
                  id="year"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                  disabled={isSubmitting || isLoadingYears || availableYears.length === 0}
                  className={`block w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors appearance-none ${
                    errors.year ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {isLoadingYears ? (
                    <option value="">Jahre werden geladen...</option>
                  ) : availableYears.length === 0 ? (
                    <option value="">Keine verfügbaren Jahre</option>
                  ) : (
                    availableYears.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            ) : (
              // Read-only field when editing
              <input
                id="year"
                type="number"
                value={formData.year}
                disabled={true}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                placeholder="Jahr kann beim Bearbeiten nicht geändert werden"
              />
            )}
            
            {errors.year && (
              <p className="mt-1 text-sm text-red-600">{errors.year}</p>
            )}
            
            {mode === 'create' && availableYears.length === 0 && !isLoadingYears && (
              <p className="mt-1 text-sm text-amber-600">
                ⚠️ Alle Jahre haben bereits Budgets. Keine neuen Budgets möglich.
              </p>
            )}
          </div>

          {/* Budget Amount Field */}
          <div>
            <label htmlFor="total_budget" className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Gesamtbudget
            </label>
            <div className="relative">
              <input
                id="total_budget"
                type="number"
                value={formData.total_budget}
                onChange={(e) => handleInputChange('total_budget', parseFloat(e.target.value) || 0)}
                disabled={isSubmitting}
                className={`block w-full px-3 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors ${
                  errors.total_budget ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="z.B. 1000000"
                min="0"
                step="0.01"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">€</span>
              </div>
            </div>
            {formData.total_budget > 0 && (
              <p className="mt-1 text-sm text-gray-600">
                Formatiert: {formatCurrency(formData.total_budget)}
              </p>
            )}
            {errors.total_budget && (
              <p className="mt-1 text-sm text-red-600">{errors.total_budget}</p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Beschreibung
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors resize-none ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="z.B. Hauptbudget für Geschäftsjahr 2025"
              maxLength={200}
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>{errors.description || 'Kurze Beschreibung des Budgets'}</span>
              <span>{formData.description.length}/200</span>
            </div>
          </div>

          {/* Status Field */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as any)}
              disabled={isSubmitting}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
            >
              <option value="DRAFT">Entwurf</option>
              <option value="ACTIVE">Aktiv</option>
              <option value="CLOSED">Geschlossen</option>
            </select>
            <div className="mt-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(formData.status)}`}>
                {getStatusText(formData.status)}
              </span>
            </div>
          </div>

          {/* Preview */}
          {formData.year && formData.total_budget > 0 && formData.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Vorschau:</h4>
              <div className="text-sm text-gray-700">
                <p><span className="font-medium">Jahr:</span> {formData.year}</p>
                <p><span className="font-medium">Budget:</span> {formatCurrency(formData.total_budget)}</p>
                <p><span className="font-medium">Beschreibung:</span> {formData.description}</p>
                <p><span className="font-medium">Status:</span> {getStatusText(formData.status)}</p>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Abbrechen
          </button>
          
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={
              isSubmitting || 
              !formData.year || 
              !formData.total_budget || 
              !formData.description ||
              (mode === 'create' && availableYears.length === 0)
            }
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Speichern...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {mode === 'create' ? 'Budget erstellen' : 'Änderungen speichern'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetForm;