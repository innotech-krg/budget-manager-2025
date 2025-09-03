// =====================================================
// Budget Manager 2025 - Budget Management Page
// Hauptseite für Jahresbudget-Verwaltung
// Konsolidiert mit bewährten Learnings aus UltraSimpleBudgetManagement
// =====================================================

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, TrendingUp, TrendingDown, DollarSign, Calendar, Eye, Edit, Trash2 } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../components/auth/AuthProvider';
import BudgetForm from '../components/budget/BudgetForm';
import BudgetDetailModal from '../components/budget/BudgetDetailModal';

// Types
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

interface BudgetStats {
  total: number;
  active: number;
  draft: number;
  closed: number;
}

export const BudgetManagement: React.FC = () => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================

  const { user, isAuthenticated, isInitialized } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentYearBudget, setCurrentYearBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedBudgetProjects, setSelectedBudgetProjects] = useState<any[]>([]);
  const [selectedBudgetAllocations, setSelectedBudgetAllocations] = useState<any>(null);

  // =====================================================
  // EFFECTS
  // =====================================================

  useEffect(() => {
    // 🔧 FIX: Wait for auth initialization AND authentication
    if (isInitialized && isAuthenticated) {
      console.log('🔐 BudgetManagement: Auth initialized and authenticated, loading budgets');
      loadBudgets();
    } else if (isInitialized && !isAuthenticated) {
      console.log('🔐 BudgetManagement: Auth initialized but not authenticated');
      setIsLoading(false);
    }
  }, [isInitialized, isAuthenticated]);

  // =====================================================
  // API METHODS
  // =====================================================

  const loadBudgets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Loading budgets...');
      
      // Verwende bewährten apiService mit robuster Fehlerbehandlung
      const response = await apiService.get('/api/budgets');
      
      console.log('📥 API response:', response);
      
      // Behandle verschiedene Response-Formate (bewährtes Learning)
      let budgetData: Budget[] = [];
      
      if (response && response.budgets && Array.isArray(response.budgets)) {
        budgetData = response.budgets;
      } else if (response && response.data && Array.isArray(response.data)) {
        budgetData = response.data;
      } else if (response && Array.isArray(response)) {
        budgetData = response;
      } else if (response && response.success === false) {
        throw new Error(response.error || 'API-Fehler');
      } else {
        console.log('🔍 Unbekanntes Response-Format:', response);
        throw new Error('Unbekanntes Datenformat erhalten');
      }
      
      setBudgets(budgetData);
      setCurrentYearBudget(response.currentYearBudget || null);
      console.log('✅ Budgets loaded:', budgetData.length);
      console.log('📅 Current year budget:', response.currentYearBudget?.year || 'None');
      
    } catch (err: any) {
      console.error('❌ Loading error:', err);
      
      if (err.message.includes('Session abgelaufen') || err.message.includes('Nicht autorisiert')) {
        setError('Session abgelaufen - bitte neu anmelden');
        // Trigger page reload after 2 seconds
        setTimeout(() => {
          localStorage.removeItem('auth_token');
          window.location.reload();
        }, 2000);
      } else {
        setError(err.message || 'Fehler beim Laden der Budgets');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // COMPUTED VALUES
  // =====================================================

  const budgetStats: BudgetStats = {
    total: budgets.length,
    active: budgets.filter(b => b.status === 'ACTIVE').length,
    draft: budgets.filter(b => b.status === 'DRAFT').length,
    closed: budgets.filter(b => b.status === 'CLOSED').length
  };

  // 📅 Verwende aktuelles Jahr statt Summe aller Jahre
  const currentYearTotal = currentYearBudget?.total_budget || 0;
  const currentYearAllocated = currentYearBudget?.allokiertes_budget || 0;
  const currentYearConsumed = currentYearBudget?.consumed_budget || 0;
  const currentYearAvailable = currentYearBudget?.available_budget || 0;

  // =====================================================
  // EVENT HANDLERS
  // =====================================================

  const handleRefresh = () => {
    loadBudgets();
  };

  const handleCreateNew = () => {
    setSelectedBudget(null);
    setShowCreateForm(true);
  };

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowEditForm(true);
  };

  const handleDelete = async (budget: Budget) => {
    try {
      setError(null);
      
      const response = await apiService.delete(`/api/budgets/${budget.id}`);
      
      if (response.success) {
        // Remove budget from list
        setBudgets(prev => prev.filter(b => b.id !== budget.id));
        setShowDetailModal(false);
        setSelectedBudget(null);
      } else {
        throw new Error(response.error || 'Fehler beim Löschen des Budgets');
      }
    } catch (err: any) {
      console.error('❌ Delete error:', err);
      setError(err.message || 'Fehler beim Löschen des Budgets');
    }
  };

  const handleView = async (budget: Budget) => {
    try {
      setIsLoading(true);
      console.log(`🔍 Loading detailed budget data for: ${budget.id}`);
      
      // Load detailed budget data with projects
      const response = await apiService.get(`/api/budgets/${budget.id}`);
      console.log('📥 Detailed budget response:', response);
      
      if (response.budget) {
        setSelectedBudget(response.budget);
        setSelectedBudgetProjects(response.projects || []);
        setSelectedBudgetAllocations(response.allocations || null);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('❌ Error loading budget details:', error);
      setError('Fehler beim Laden der Budget-Details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBudget = async (budgetData: Omit<Budget, 'id'>) => {
    try {
      setError(null);
      
      if (showCreateForm) {
        // Create new budget
        const response = await apiService.post('/api/budgets', budgetData);
        
        if (response.success && response.budget) {
          setBudgets(prev => [...prev, response.budget]);
          setShowCreateForm(false);
        } else {
          throw new Error(response.error || 'Fehler beim Erstellen des Budgets');
        }
      } else if (showEditForm && selectedBudget) {
        // Update existing budget
        const response = await apiService.put(`/api/budgets/${selectedBudget.id}`, budgetData);
        
        if (response.success && response.budget) {
          setBudgets(prev => prev.map(b => b.id === selectedBudget.id ? response.budget : b));
          setShowEditForm(false);
          setSelectedBudget(null);
        } else {
          throw new Error(response.error || 'Fehler beim Aktualisieren des Budgets');
        }
      }
    } catch (err: any) {
      console.error('❌ Save error:', err);
      throw err; // Re-throw to be handled by form
    }
  };

  // =====================================================
  // RENDER HELPERS
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

  // Show loading state - wait for auth initialization
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-700">
              {!isInitialized ? 'Authentifizierung wird geprüft...' : 'Budgets werden geladen...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Sie müssen sich anmelden, um Budgets zu verwalten.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-medium mb-2">Fehler beim Laden</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Budgetverwaltung</h1>
              <p className="text-gray-600">Jahresbudgets verwalten und überwachen</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Aktualisieren
              </button>
              
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Neues Budget
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {budgets.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
              <p className="text-green-800 font-medium">
                ✅ Erfolgreich geladen: {budgets.length} Budgets verfügbar
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Total Budgets */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gesamt</p>
                <p className="text-2xl font-bold text-gray-900">{budgetStats.total}</p>
              </div>
            </div>
          </div>

          {/* Active Budgets */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktiv</p>
                <p className="text-2xl font-bold text-green-600">{budgetStats.active}</p>
              </div>
            </div>
          </div>

          {/* Draft Budgets */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Entwurf</p>
                <p className="text-2xl font-bold text-yellow-600">{budgetStats.draft}</p>
              </div>
            </div>
          </div>

          {/* Total Allocated Sum */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Allokiert</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(currentYearAllocated)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Total Budget */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gesamtbudget</h3>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatCurrency(currentYearTotal)}
            </div>
            <p className="text-sm text-gray-600">Budget für {currentYearBudget?.year || new Date().getFullYear()}</p>
          </div>

          {/* Allocated Budget */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Allokiert</h3>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {formatCurrency(currentYearAllocated)}
            </div>
            <p className="text-sm text-gray-600">
              {currentYearTotal > 0 ? Math.round((currentYearAllocated / currentYearTotal) * 100) : 0}% des Gesamtbudgets
            </p>
          </div>

          {/* Consumed Budget */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verbraucht</h3>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {formatCurrency(currentYearConsumed)}
            </div>
            <p className="text-sm text-gray-600">
              {currentYearTotal > 0 ? Math.round((currentYearConsumed / currentYearTotal) * 100) : 0}% des Gesamtbudgets
            </p>
          </div>

          {/* Available Budget */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verfügbar</h3>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(currentYearAvailable)}
            </div>
            <p className="text-sm text-gray-600">
              {currentYearTotal > 0 ? Math.round((currentYearAvailable / currentYearTotal) * 100) : 0}% des Gesamtbudgets
            </p>
          </div>
        </div>

        {/* Budget List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Alle Budgets</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jahr
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beschreibung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gesamtbudget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allokiert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verbraucht
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verfügbar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {budgets.map((budget) => (
                  <tr key={budget.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {budget.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {budget.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {budget.gesamtbudget_formatted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {budget.allokiertes_budget_formatted || formatCurrency(budget.allokiertes_budget || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {budget.verbrauchtes_budget_formatted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {budget.verfuegbares_budget_formatted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(budget.status)}`}>
                        {getStatusText(budget.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(budget)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                          title="Details anzeigen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(budget)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(budget)}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {budgets.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Keine Budgets gefunden</p>
              <button
                onClick={handleCreateNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Erstes Budget erstellen
              </button>
            </div>
          )}
        </div>

        {/* Budget Form Modals */}
        <BudgetForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSave={handleSaveBudget}
          mode="create"
        />

        <BudgetForm
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setSelectedBudget(null);
          }}
          onSave={handleSaveBudget}
          budget={selectedBudget}
          mode="edit"
        />

        {/* Budget Detail Modal */}
        <BudgetDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedBudget(null);
            setSelectedBudgetProjects([]);
            setSelectedBudgetAllocations(null);
          }}
          budget={selectedBudget}
          projects={selectedBudgetProjects}
          allocations={selectedBudgetAllocations}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default BudgetManagement;