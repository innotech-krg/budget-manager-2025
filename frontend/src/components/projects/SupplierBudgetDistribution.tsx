// =====================================================
// Budget Manager 2025 - Supplier Budget Distribution
// Epic 9 - Budget-Verteilung auf Dienstleister
// =====================================================

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  X, 
  Euro,
  Calculator,
  AlertCircle,
  Check,
  Percent
} from 'lucide-react';
import InlineEntityCreation from './InlineEntityCreation';

interface Supplier {
  id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
}

interface SupplierBudgetAllocation {
  supplierId: string;
  supplier: Supplier;
  allocatedBudget: number;
  percentage: number;
  description?: string;
}

interface SupplierBudgetDistributionProps {
  totalExternalBudget: number;
  onTotalBudgetChange: (budget: number) => void;
  availableSuppliers: Supplier[];
  onSupplierAllocationsChange: (allocations: SupplierBudgetAllocation[]) => void;
  onSupplierCreate: () => void;
  availableAnnualBudget?: number; // Verfügbares Jahresbudget als Referenz
}

const SupplierBudgetDistribution: React.FC<SupplierBudgetDistributionProps> = ({
  totalExternalBudget,
  onTotalBudgetChange,
  availableSuppliers,
  onSupplierAllocationsChange,
  onSupplierCreate,
  availableAnnualBudget
}) => {
  const [allocations, setAllocations] = useState<SupplierBudgetAllocation[]>([]);
  const [showInlineModal, setShowInlineModal] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Berechne Summen
  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocatedBudget, 0);
  const remainingBudget = totalExternalBudget - totalAllocated;
  const totalPercentage = allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);

  // Update parent component when allocations change
  useEffect(() => {
    onSupplierAllocationsChange(allocations);
  }, [allocations, onSupplierAllocationsChange]);

  // Recalculate percentages when budget changes
  useEffect(() => {
    if (totalExternalBudget > 0) {
      setAllocations(prev => prev.map(alloc => ({
        ...alloc,
        percentage: (alloc.allocatedBudget / totalExternalBudget) * 100
      })));
    }
  }, [totalExternalBudget]);

  const addSupplier = (supplierId: string) => {
    const supplier = availableSuppliers.find(s => s.id === supplierId);
    if (!supplier || allocations.find(a => a.supplierId === supplierId)) return;

    const newAllocation: SupplierBudgetAllocation = {
      supplierId,
      supplier,
      allocatedBudget: 0,
      percentage: 0,
      description: ''
    };

    setAllocations(prev => [...prev, newAllocation]);
  };

  const removeSupplier = (supplierId: string) => {
    setAllocations(prev => prev.filter(a => a.supplierId !== supplierId));
  };

  const updateAllocation = (supplierId: string, field: keyof SupplierBudgetAllocation, value: any) => {
    setAllocations(prev => prev.map(alloc => {
      if (alloc.supplierId === supplierId) {
        const updated = { ...alloc, [field]: value };
        
        // Update percentage when budget changes
        if (field === 'allocatedBudget' && totalExternalBudget > 0) {
          updated.percentage = (value / totalExternalBudget) * 100;
        }
        
        // Update budget when percentage changes
        if (field === 'percentage' && totalExternalBudget > 0) {
          updated.allocatedBudget = (value / 100) * totalExternalBudget;
        }
        
        return updated;
      }
      return alloc;
    }));
  };

  const distributeEqually = () => {
    if (allocations.length === 0) return;
    
    const budgetPerSupplier = totalExternalBudget / allocations.length;
    const percentagePerSupplier = 100 / allocations.length;
    
    setAllocations(prev => prev.map(alloc => ({
      ...alloc,
      allocatedBudget: budgetPerSupplier,
      percentage: percentagePerSupplier
    })));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getAvailableSuppliers = () => {
    return availableSuppliers.filter(supplier => 
      !allocations.find(alloc => alloc.supplierId === supplier.id)
    );
  };

  const handleInlineCreate = (entityType: string, newEntity: any) => {
    if (entityType === 'suppliers') {
      onSupplierCreate();
      setShowInlineModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gesamt Budget Input */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-green-800 mb-2">
          <Euro className="w-4 h-4 inline mr-1" />
          Gesamt Externes Budget
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={totalExternalBudget || ''}
          onChange={(e) => onTotalBudgetChange(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="0.00"
        />
        <p className="mt-1 text-sm text-green-700">
          Dieses Budget wird auf die ausgewählten Dienstleister verteilt
        </p>
        {availableAnnualBudget && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            💰 Verfügbares Jahresbudget: {availableAnnualBudget.toLocaleString('de-DE')} €
            {totalExternalBudget > availableAnnualBudget && (
              <span className="text-red-600 font-medium ml-2">
                ⚠️ Budget überschreitet verfügbares Jahresbudget!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dienstleister hinzufügen */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Building2 className="w-4 h-4 mr-2 text-blue-600" />
          Dienstleister auswählen
        </h4>
        
        {getAvailableSuppliers().length > 0 ? (
          <div className="space-y-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addSupplier(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Dienstleister auswählen...</option>
              {getAvailableSuppliers().map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} {supplier.description ? `- ${supplier.description}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-3">
            {allocations.length > 0 
              ? "Alle verfügbaren Dienstleister wurden bereits hinzugefügt"
              : "Keine Dienstleister verfügbar"
            }
          </p>
        )}
        
        <button
          type="button"
          onClick={() => setShowInlineModal(true)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          Neuen Dienstleister erstellen
        </button>
      </div>

      {/* Budget-Verteilung */}
      {allocations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Calculator className="w-4 h-4 mr-2 text-purple-600" />
              Budget-Verteilung
            </h4>
            <button
              type="button"
              onClick={distributeEqually}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              Gleichmäßig verteilen
            </button>
          </div>

          <div className="space-y-4">
            {allocations.map((allocation) => (
              <div key={allocation.supplierId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 text-blue-600 mr-2" />
                    <div>
                      <h5 className="font-medium text-gray-900">{allocation.supplier.name}</h5>
                      {allocation.supplier.description && (
                        <p className="text-sm text-gray-500">{allocation.supplier.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSupplier(allocation.supplierId)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Dienstleister entfernen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Budget Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Euro className="w-4 h-4 inline mr-1" />
                      Budget
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={allocation.allocatedBudget || ''}
                      onChange={(e) => updateAllocation(allocation.supplierId, 'allocatedBudget', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Percentage Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Percent className="w-4 h-4 inline mr-1" />
                      Prozent
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={allocation.percentage.toFixed(1)}
                      onChange={(e) => updateAllocation(allocation.supplierId, 'percentage', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.0"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beschreibung (Optional)
                    </label>
                    <input
                      type="text"
                      value={allocation.description || ''}
                      onChange={(e) => updateAllocation(allocation.supplierId, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="z.B. Frontend-Entwicklung"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget-Zusammenfassung */}
      {totalExternalBudget > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-3 flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Budget-Zusammenfassung
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-purple-700 font-medium">Gesamt-Budget</p>
              <p className="text-lg font-bold text-purple-900">{formatCurrency(totalExternalBudget)}</p>
            </div>
            <div>
              <p className="text-purple-700 font-medium">Zugewiesen</p>
              <p className="text-lg font-bold text-purple-900">{formatCurrency(totalAllocated)}</p>
            </div>
            <div>
              <p className="text-purple-700 font-medium">Verbleibt</p>
              <p className={`text-lg font-bold ${remainingBudget >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(remainingBudget)}
              </p>
            </div>
            <div>
              <p className="text-purple-700 font-medium">Prozent</p>
              <p className={`text-lg font-bold ${totalPercentage <= 100 ? 'text-purple-900' : 'text-red-700'}`}>
                {totalPercentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Validierung */}
          {totalAllocated > totalExternalBudget && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-800">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="font-medium">Budget überschritten!</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Die Summe der zugewiesenen Budgets ({formatCurrency(totalAllocated)}) 
                überschreitet das Gesamt-Budget ({formatCurrency(totalExternalBudget)}).
              </p>
            </div>
          )}

          {totalAllocated === totalExternalBudget && totalAllocated > 0 && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center text-green-800">
                <Check className="w-4 h-4 mr-2" />
                <span className="font-medium">Budget vollständig verteilt!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Das gesamte externe Budget wurde auf {allocations.length} Dienstleister verteilt.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Inline Entity Creation Modal */}
      {showInlineModal && (
        <InlineEntityCreation
          entityType="suppliers"
          onClose={() => setShowInlineModal(false)}
          onCreate={handleInlineCreate}
        />
      )}
    </div>
  );
};

export default SupplierBudgetDistribution;

