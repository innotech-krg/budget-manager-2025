// =====================================================
// Budget Manager 2025 - Budget Detail Modal Component
// Detailansicht für Budgets mit Aktionen
// =====================================================

import React from 'react';
import { X, Edit, Trash2, Calendar, DollarSign, FileText, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  planned_budget: number;
  consumed_budget: number;
  status: string;
  geplantes_budget_formatted: string;
  verbrauchtes_budget_formatted: string;
  verfuegbares_budget_formatted: string;
  budget_auslastung: number;
}

interface Budget {
  id: string;
  year: number;
  total_budget: number;
  consumed_budget: number;
  available_budget: number;
  allokiertes_budget?: number;
  status: string;
  description: string;
  gesamtbudget_formatted: string;
  verbrauchtes_budget_formatted: string;
  verfuegbares_budget_formatted: string;
  allokiertes_budget_formatted?: string;
  created_at?: string;
  updated_at?: string;
}

interface BudgetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget | null;
  projects?: Project[];
  allocations?: {
    total_allocated: number;
    total_consumed: number;
    allocation_percentage: number;
    consumption_percentage: number;
  };
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

export const BudgetDetailModal: React.FC<BudgetDetailModalProps> = ({
  isOpen,
  onClose,
  budget,
  projects = [],
  allocations,
  onEdit,
  onDelete
}) => {
  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

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

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Nicht verfügbar';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'Ungültiges Datum';
    }
  };

  const getConsumptionPercentage = (): number => {
    if (!budget || budget.total_budget === 0) return 0;
    return Math.round((budget.consumed_budget / budget.total_budget) * 100);
  };

  const getConsumptionColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  // =====================================================
  // EVENT HANDLERS
  // =====================================================

  const handleEdit = () => {
    if (budget) {
      onEdit(budget);
    }
  };

  const handleDelete = () => {
    if (budget && window.confirm(`Sind Sie sicher, dass Sie das Budget "${budget.description}" löschen möchten?`)) {
      onDelete(budget);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (!isOpen || !budget) return null;

  const consumptionPercentage = getConsumptionPercentage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Budget-Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Vollständige Übersicht über das Budget für {budget.year}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Left Column */}
            <div className="space-y-4">
              
              {/* Year */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Budgetjahr</p>
                  <p className="text-lg font-semibold text-gray-900">{budget.year}</p>
                </div>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Beschreibung</p>
                  <p className="text-gray-900">{budget.description}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Activity className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(budget.status)}`}>
                    {getStatusText(budget.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Budget Overview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget-Übersicht</h3>
              
              {/* Total Budget */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Gesamtbudget</span>
                  <span className="text-lg font-bold text-blue-600">{budget.gesamtbudget_formatted}</span>
                </div>
              </div>

              {/* Allocated Budget */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Allokiert</span>
                  <span className="text-lg font-bold text-purple-600">{budget.allokiertes_budget_formatted || '0,00 €'}</span>
                </div>
              </div>

              {/* Consumed Budget */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Verbraucht</span>
                  <span className="text-lg font-bold text-red-600">{budget.verbrauchtes_budget_formatted}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300 bg-red-500"
                    style={{ width: `${Math.min((budget.consumed_budget / budget.total_budget) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{Math.round((budget.consumed_budget / budget.total_budget) * 100)}% verbraucht</p>
              </div>

              {/* Available Budget */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Verfügbar</span>
                  <span className="text-lg font-bold text-green-600">{budget.verfuegbares_budget_formatted}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            
            {/* Total Budget Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Gesamtbudget</p>
                  <p className="text-xl font-bold text-blue-600">{budget.gesamtbudget_formatted}</p>
                </div>
              </div>
            </div>

            {/* Allocated Budget Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Allokiert</p>
                  <p className="text-xl font-bold text-purple-600">{budget.allokiertes_budget_formatted || '0,00 €'}</p>
                </div>
              </div>
            </div>

            {/* Consumed Budget Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verbraucht</p>
                  <p className="text-xl font-bold text-red-600">{budget.verbrauchtes_budget_formatted}</p>
                </div>
              </div>
            </div>

            {/* Available Budget Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verfügbar</p>
                  <p className="text-xl font-bold text-green-600">{budget.verfuegbares_budget_formatted}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Project Allocations */}
          {projects && projects.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Projekt-Allokationen</h3>
              
              {/* Allocation Summary */}
              {allocations && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Allokiert</p>
                      <p className="text-lg font-bold text-blue-600">{budget.allokiertes_budget_formatted}</p>
                      <p className="text-xs text-gray-500">{allocations.allocation_percentage}% des Gesamtbudgets</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Verbraucht</p>
                      <p className="text-lg font-bold text-red-600">{budget.verbrauchtes_budget_formatted}</p>
                      <p className="text-xs text-gray-500">{allocations.consumption_percentage}% der Allokation</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Projekte</p>
                      <p className="text-lg font-bold text-gray-900">{projects.length}</p>
                      <p className="text-xs text-gray-500">Aktive Projekte</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Effizienz</p>
                      <p className={`text-lg font-bold ${allocations.consumption_percentage < 50 ? 'text-green-600' : allocations.consumption_percentage < 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {allocations.consumption_percentage < 50 ? 'Niedrig' : allocations.consumption_percentage < 80 ? 'Mittel' : 'Hoch'}
                      </p>
                      <p className="text-xs text-gray-500">Budget-Nutzung</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Projects Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Projekt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Geplant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verbraucht
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verfügbar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Auslastung
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{project.geplantes_budget_formatted}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{project.verbrauchtes_budget_formatted}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{project.verfuegbares_budget_formatted}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  project.budget_auslastung >= 90 ? 'bg-red-500' :
                                  project.budget_auslastung >= 75 ? 'bg-orange-500' :
                                  project.budget_auslastung >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(project.budget_auslastung, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{project.budget_auslastung}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                            {getStatusText(project.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Metadata */}
          {(budget.created_at || budget.updated_at) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Metadaten</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {budget.created_at && (
                  <div>
                    <span className="font-medium text-gray-600">Erstellt:</span>
                    <span className="ml-2 text-gray-900">{formatDate(budget.created_at)}</span>
                  </div>
                )}
                {budget.updated_at && (
                  <div>
                    <span className="font-medium text-gray-600">Zuletzt geändert:</span>
                    <span className="ml-2 text-gray-900">{formatDate(budget.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning for high consumption */}
          {consumptionPercentage >= 90 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <TrendingDown className="w-5 h-5" />
                <span className="font-medium">Warnung: Hoher Budgetverbrauch</span>
              </div>
              <p className="text-red-700 mt-1">
                Das Budget ist zu {consumptionPercentage}% verbraucht. Bitte prüfen Sie die Ausgaben.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Bearbeiten
            </button>
            
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Löschen
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetDetailModal;