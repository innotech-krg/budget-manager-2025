import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, CheckCircle, FileText, Calculator } from 'lucide-react';

interface ManualPositionFormProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onSuccess: (position: any) => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  defaultCategory: string;
  defaultTaxRate: number;
  requiredFields: string[];
  usageCount: number;
}

interface ValidationRules {
  budget: {
    maxAmount: number;
    warningThreshold: number;
    allowOverride: boolean;
  };
  amount: {
    minAmount: number;
    maxAmount: number;
    warningThreshold: number;
  };
  requiredFields: string[];
}

const ManualPositionForm: React.FC<ManualPositionFormProps> = ({
  projectId,
  projectName,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0,
    totalAmount: 0,
    taxRate: 20,
    taxAmount: 0,
    category: '',
    reason: '',
    notes: ''
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [validationRules, setValidationRules] = useState<ValidationRules | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lade Templates und Validierungsregeln
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Templates laden
        const templatesResponse = await fetch('/api/manual-positions/templates');
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          setTemplates(templatesData.data.templates || []);
        }

        // Validierungsregeln laden
        const rulesResponse = await fetch(`/api/manual-positions/validation-rules/${projectId}`);
        if (rulesResponse.ok) {
          const rulesData = await rulesResponse.json();
          setValidationRules(rulesData.data.validationRules);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // Berechne automatisch Werte bei Änderungen
  useEffect(() => {
    const quantity = formData.quantity || 1;
    const unitPrice = formData.unitPrice || 0;
    const totalAmount = formData.totalAmount || 0;
    const taxRate = formData.taxRate || 20;

    // Wenn Menge oder Einzelpreis geändert wurde, berechne Gesamtbetrag
    if (quantity > 0 && unitPrice > 0) {
      const calculatedTotal = quantity * unitPrice;
      if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
        setFormData(prev => ({
          ...prev,
          totalAmount: calculatedTotal,
          taxAmount: calculatedTotal * taxRate / 100
        }));
      }
    }
    // Wenn Gesamtbetrag geändert wurde, berechne Einzelpreis
    else if (totalAmount > 0 && quantity > 0) {
      const calculatedUnitPrice = totalAmount / quantity;
      if (Math.abs(calculatedUnitPrice - unitPrice) > 0.01) {
        setFormData(prev => ({
          ...prev,
          unitPrice: calculatedUnitPrice,
          taxAmount: totalAmount * taxRate / 100
        }));
      }
    }
    // Berechne MwSt
    else {
      setFormData(prev => ({
        ...prev,
        taxAmount: totalAmount * taxRate / 100
      }));
    }
  }, [formData.quantity, formData.unitPrice, formData.totalAmount, formData.taxRate]);

  // Template anwenden
  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const templateData = JSON.parse(template.description || '{}');
    
    setFormData(prev => ({
      ...prev,
      category: template.defaultCategory || prev.category,
      taxRate: template.defaultTaxRate || prev.taxRate,
      reason: `Basierend auf Template: ${template.name}`
    }));

    setSelectedTemplate(templateId);
  };

  // Validierung
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const newWarnings: Record<string, string> = {};

    // Pflichtfelder prüfen
    if (!formData.description.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich';
    }

    if (!formData.totalAmount || formData.totalAmount <= 0) {
      newErrors.totalAmount = 'Gesamtbetrag muss größer als 0 sein';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Grund für manuelle Eingabe ist erforderlich';
    }

    // Budget-Validierung
    if (validationRules && formData.totalAmount > 0) {
      if (formData.totalAmount > validationRules.budget.maxAmount) {
        newErrors.totalAmount = `Betrag überschreitet verfügbares Budget (${validationRules.budget.maxAmount.toFixed(2)} €)`;
      } else if (formData.totalAmount > validationRules.budget.warningThreshold) {
        newWarnings.totalAmount = `Hoher Betrag: Über 80% des verfügbaren Budgets`;
      }

      if (formData.totalAmount > validationRules.amount.warningThreshold) {
        newWarnings.amount = `Ungewöhnlich hoher Betrag (>${validationRules.amount.warningThreshold.toFixed(2)} €)`;
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);

    return Object.keys(newErrors).length === 0;
  };

  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/manual-positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          ...formData,
          validationOverrides: Object.keys(warnings).length > 0 ? { 
            budgetWarningAccepted: true 
          } : {}
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result.data.position);
        onClose();
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'Fehler beim Erstellen der Position' });
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Position:', error);
      setErrors({ submit: 'Netzwerkfehler beim Erstellen der Position' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Entferne Fehler für dieses Feld
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Lade Formulardaten...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Manuelle Rechnungsposition erstellen
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Projekt: <span className="font-medium">{projectName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Template-Auswahl */}
          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template verwenden (optional)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => applyTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Kein Template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.usageCount}x verwendet)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Beschreibung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="z.B. Büromaterial, Beratungsleistung, Software-Lizenz"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Beträge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Menge
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Einzelpreis (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gesamtbetrag (€) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => handleInputChange('totalAmount', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.totalAmount ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.totalAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.totalAmount}</p>
              )}
              {warnings.totalAmount && (
                <p className="mt-1 text-sm text-yellow-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {warnings.totalAmount}
                </p>
              )}
            </div>
          </div>

          {/* MwSt */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MwSt-Satz (%)
              </label>
              <select
                value={formData.taxRate}
                onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>0% (Steuerbefreit)</option>
                <option value={7}>7% (Ermäßigt)</option>
                <option value={19}>19% (Standard)</option>
                <option value={20}>20% (Österreich Standard)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MwSt-Betrag (€)
              </label>
              <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                <Calculator className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-700">{formData.taxAmount.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Kategorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategorie
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. Büromaterial, Software, Beratung"
            />
          </div>

          {/* Grund */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grund für manuelle Eingabe *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              rows={2}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.reason ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="z.B. Keine digitale Rechnung verfügbar, Barauslagen, Interne Verrechnung"
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
            )}
          </div>

          {/* Notizen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zusätzliche Notizen
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Weitere Details, Referenzen, etc."
            />
          </div>

          {/* Warnungen */}
          {Object.keys(warnings).length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Warnungen</h4>
                  <ul className="mt-1 text-sm text-yellow-700">
                    {Object.values(warnings).map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-yellow-600">
                    Sie können trotzdem fortfahren, wenn Sie sicher sind.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fehler */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                <span className="text-sm text-red-700">{errors.submit}</span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Object.keys(errors).length > 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Erstelle...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Position erstellen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualPositionForm;
