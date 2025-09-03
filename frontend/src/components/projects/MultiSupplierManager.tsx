// =====================================================
// Budget Manager 2025 - Multi-Supplier Manager
// Epic 9 - Story 9.3: Intelligente Budget-Logik
// =====================================================

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowLeft,
  Save,
  X
} from 'lucide-react';
import { apiService } from '../../services/apiService';

interface MultiSupplierManagerProps {
  projectId: string;
  externalBudget: number;
  onBudgetChange: (newBudget: number) => void;
  availableSuppliers: any[];
  onSupplierCreate?: () => void;
}

interface ProjectSupplier {
  id: string;
  supplier_id: string;
  allocated_budget: number;
  consumed_budget: number;
  is_active: boolean;
  removed_at?: string;
  available_at_removal?: number;
  removal_reason?: string;
  suppliers: {
    id: string;
    name: string;
    email: string;
    is_active: boolean;
  };
}

interface BudgetSummary {
  project: {
    id: string;
    name: string;
  };
  external: {
    total_budget: number;
    allocated_to_suppliers: number;
    unassigned_budget: number;
    consumed_budget: number;
    available_budget: number;
    suppliers_count: number;
  };
  validation: {
    is_valid: boolean;
    warnings: string[];
    errors: string[];
  };
}

const MultiSupplierManager: React.FC<MultiSupplierManagerProps> = ({
  projectId,
  externalBudget,
  onBudgetChange,
  availableSuppliers,
  onSupplierCreate
}) => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  const [projectSuppliers, setProjectSuppliers] = useState<ProjectSupplier[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<ProjectSupplier | null>(null);
  
  // Form States
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [allocatedBudget, setAllocatedBudget] = useState(0);
  const [removalReason, setRemovalReason] = useState('');

  // =====================================================
  // LIFECYCLE HOOKS
  // =====================================================
  useEffect(() => {
    if (projectId) {
      loadProjectSuppliers();
      loadBudgetSummary();
    }
  }, [projectId, externalBudget]);

  // =====================================================
  // DATA LOADING
  // =====================================================
  const loadProjectSuppliers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/api/projects/${projectId}/suppliers?include_removed=true`);
      setProjectSuppliers(response.suppliers || []);
    } catch (error) {
      console.error('Fehler beim Laden der Projekt-Dienstleister:', error);
      setError('Fehler beim Laden der Dienstleister');
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetSummary = async () => {
    try {
      const response = await apiService.get(`/api/projects/${projectId}/budget-summary`);
      setBudgetSummary(response);
    } catch (error) {
      console.error('Fehler beim Laden der Budget-Übersicht:', error);
    }
  };

  // =====================================================
  // SUPPLIER MANAGEMENT
  // =====================================================
  const handleAddSupplier = async () => {
    if (!selectedSupplierId || allocatedBudget < 0) return;

    try {
      setLoading(true);
      await apiService.post(`/api/projects/${projectId}/suppliers`, {
        supplier_id: selectedSupplierId,
        allocated_budget: allocatedBudget
      });

      await loadProjectSuppliers();
      await loadBudgetSummary();
      
      setShowAddModal(false);
      setSelectedSupplierId('');
      setAllocatedBudget(0);
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Dienstleisters:', error);
      setError('Fehler beim Hinzufügen des Dienstleisters');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSupplier = async () => {
    if (!selectedSupplier || allocatedBudget < selectedSupplier.consumed_budget) return;

    try {
      setLoading(true);
      await apiService.put(`/api/projects/${projectId}/suppliers/${selectedSupplier.supplier_id}`, {
        allocated_budget: allocatedBudget
      });

      await loadProjectSuppliers();
      await loadBudgetSummary();
      
      setShowEditModal(false);
      setSelectedSupplier(null);
      setAllocatedBudget(0);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Dienstleisters:', error);
      setError('Fehler beim Aktualisieren des Dienstleisters');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSupplier = async () => {
    if (!selectedSupplier) return;

    try {
      setLoading(true);
      const response = await apiService.delete(`/api/projects/${projectId}/suppliers/${selectedSupplier.supplier_id}`, {
        reason: removalReason || 'Dienstleister entfernt'
      });

      console.log('Dienstleister entfernt:', response.message);
      
      await loadProjectSuppliers();
      await loadBudgetSummary();
      
      setShowRemoveModal(false);
      setSelectedSupplier(null);
      setRemovalReason('');
    } catch (error) {
      console.error('Fehler beim Entfernen des Dienstleisters:', error);
      setError('Fehler beim Entfernen des Dienstleisters');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // MODAL HANDLERS
  // =====================================================
  const openAddModal = () => {
    setSelectedSupplierId('');
    setAllocatedBudget(0);
    setShowAddModal(true);
  };

  const openEditModal = (supplier: ProjectSupplier) => {
    setSelectedSupplier(supplier);
    setAllocatedBudget(supplier.allocated_budget);
    setShowEditModal(true);
  };

  const openRemoveModal = (supplier: ProjectSupplier) => {
    setSelectedSupplier(supplier);
    setRemovalReason('');
    setShowRemoveModal(true);
  };

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================
  const getAvailableSuppliers = () => {
    const assignedSupplierIds = projectSuppliers
      .filter(ps => ps.is_active)
      .map(ps => ps.supplier_id);
    
    return availableSuppliers.filter(supplier => 
      supplier.is_active && !assignedSupplierIds.includes(supplier.id)
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // =====================================================
  // RENDER METHODS
  // =====================================================
  const renderSupplierCard = (projectSupplier: ProjectSupplier) => {
    const availableBudget = projectSupplier.allocated_budget - projectSupplier.consumed_budget;
    const utilizationPercent = projectSupplier.allocated_budget > 0 
      ? (projectSupplier.consumed_budget / projectSupplier.allocated_budget) * 100 
      : 0;

    return (
      <div 
        key={projectSupplier.id} 
        className={`bg-white rounded-lg border p-4 ${
          projectSupplier.is_active ? 'border-gray-200' : 'border-red-200 bg-red-50'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <ExternalLink className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <h4 className="font-semibold text-gray-900">
                {projectSupplier.suppliers.name}
              </h4>
              <p className="text-sm text-gray-500">
                {projectSupplier.suppliers.email}
              </p>
            </div>
          </div>
          
          {projectSupplier.is_active ? (
            <div className="flex space-x-2">
              <button
                onClick={() => openEditModal(projectSupplier)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Budget bearbeiten"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => openRemoveModal(projectSupplier)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Dienstleister entfernen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-sm text-red-600 font-medium">
              Entfernt
            </div>
          )}
        </div>

        {/* Budget Information */}
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <p className="text-sm text-gray-500">Zugewiesen</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(projectSupplier.allocated_budget)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Verbraucht</p>
            <p className="font-semibold text-orange-600">
              {formatCurrency(projectSupplier.consumed_budget)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Verfügbar</p>
            <p className="font-semibold text-green-600">
              {formatCurrency(availableBudget)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Budget-Auslastung</span>
            <span>{utilizationPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                utilizationPercent > 90 ? 'bg-red-500' :
                utilizationPercent > 75 ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Removal Information */}
        {!projectSupplier.is_active && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-800 mb-1">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span className="font-medium">Entfernt</span>
            </div>
            <p className="text-sm text-red-700">
              {projectSupplier.removal_reason}
            </p>
            {projectSupplier.available_at_removal && (
              <p className="text-sm text-red-700 mt-1">
                Zurückgeflossen: {formatCurrency(projectSupplier.available_at_removal)}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderBudgetSummary = () => {
    if (!budgetSummary) return null;

    const { external, validation } = budgetSummary;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          Budget-Übersicht
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Gesamt-Budget</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(external.total_budget)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Zugewiesen</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(external.allocated_to_suppliers)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Nicht zugewiesen</p>
            <p className="text-xl font-bold text-orange-600">
              {formatCurrency(external.unassigned_budget)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Verbraucht</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(external.consumed_budget)}
            </p>
          </div>
        </div>

        {/* Validation Status */}
        <div className={`p-3 rounded-lg ${
          validation.is_valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center mb-2">
            {validation.is_valid ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            )}
            <span className={`font-medium ${
              validation.is_valid ? 'text-green-800' : 'text-red-800'
            }`}>
              {validation.is_valid ? 'Budget-Validierung erfolgreich' : 'Budget-Validierung fehlgeschlagen'}
            </span>
          </div>
          
          {validation.errors.length > 0 && (
            <div className="mb-2">
              <p className="text-sm font-medium text-red-800 mb-1">Fehler:</p>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {validation.warnings.length > 0 && (
            <div>
              <p className="text-sm font-medium text-orange-800 mb-1">Warnungen:</p>
              <ul className="text-sm text-orange-700 list-disc list-inside">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  // =====================================================
  // MAIN RENDER
  // =====================================================
  return (
    <div className="space-y-6">
      {/* External Budget Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Externes Budget
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gesamt-Budget (€)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={externalBudget}
              onChange={(e) => onBudgetChange(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
          <div className="text-sm text-gray-500">
            <Info className="w-4 h-4 inline mr-1" />
            Das Budget kann flexibel auf Dienstleister aufgeteilt werden
          </div>
        </div>
      </div>

      {/* Budget Summary */}
      {renderBudgetSummary()}

      {/* Suppliers List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Dienstleister ({projectSuppliers.filter(ps => ps.is_active).length} aktiv)
          </h3>
          <button
            onClick={openAddModal}
            disabled={getAvailableSuppliers().length === 0}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Dienstleister hinzufügen
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Lade Dienstleister...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center text-red-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="font-medium">Fehler</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {!loading && projectSuppliers.length === 0 && (
          <div className="text-center py-8">
            <ExternalLink className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Noch keine Dienstleister zugeordnet
            </h4>
            <p className="text-gray-500 mb-4">
              Fügen Sie Dienstleister hinzu, um das externe Budget zu verwalten.
            </p>
          </div>
        )}

        {!loading && projectSuppliers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectSuppliers.map(renderSupplierCard)}
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dienstleister hinzufügen
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dienstleister auswählen
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Dienstleister auswählen...</option>
                  {getAvailableSuppliers().map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget zuweisen (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={allocatedBudget}
                  onChange={(e) => setAllocatedBudget(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddSupplier}
                disabled={!selectedSupplierId || allocatedBudget < 0}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Budget bearbeiten: {selectedSupplier.suppliers.name}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  Verbrauchtes Budget: {formatCurrency(selectedSupplier.consumed_budget)}
                </p>
                <p className="text-sm text-gray-500">
                  Neues Budget muss mindestens dem verbrauchten Budget entsprechen
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neues Budget (€)
                </label>
                <input
                  type="number"
                  min={selectedSupplier.consumed_budget}
                  step="0.01"
                  value={allocatedBudget}
                  onChange={(e) => setAllocatedBudget(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
                {allocatedBudget < selectedSupplier.consumed_budget && (
                  <p className="text-sm text-red-600 mt-1">
                    Budget kann nicht unter verbrauchtes Budget gesetzt werden
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleEditSupplier}
                disabled={allocatedBudget < selectedSupplier.consumed_budget}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Supplier Modal */}
      {showRemoveModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dienstleister entfernen: {selectedSupplier.suppliers.name}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center text-orange-800 mb-2">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span className="font-medium">Intelligente Budget-Logik</span>
                </div>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Verbrauchtes Budget: {formatCurrency(selectedSupplier.consumed_budget)} (bleibt bestehen)</li>
                  <li>• Verfügbares Budget: {formatCurrency(selectedSupplier.allocated_budget - selectedSupplier.consumed_budget)} (fließt zurück)</li>
                  <li>• Dienstleister bleibt für Dokumentation sichtbar</li>
                </ul>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grund für Entfernung (optional)
                </label>
                <textarea
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Grund für die Entfernung des Dienstleisters..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleRemoveSupplier}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Entfernen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSupplierManager;



