// =====================================================
// Budget Manager 2025 - Advanced Project Form
// Epic 9 - Story 9.1: Semantische UI-Struktur
// =====================================================

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  ExternalLink, 
  BarChart3,
  Plus,
  X,
  Tag,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Calculator
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import MultiSupplierManager from './MultiSupplierManager';
import InlineEntityCreation from './InlineEntityCreation';
import TeamRoleManager from './TeamRoleManager';
import TeamSelector from './TeamSelector';
import SupplierBudgetDistribution from './SupplierBudgetDistribution';

interface ProjectFormAdvancedProps {
  project?: any;
  onSave: (projectData: any) => void;
  onCancel: () => void;
}

interface FormSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const ProjectFormAdvanced: React.FC<ProjectFormAdvancedProps> = ({ 
  project, 
  onSave, 
  onCancel 
}) => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================
  const [activeSection, setActiveSection] = useState<string>('allgemein');
  const [formData, setFormData] = useState<any>({
    // Allgemein
    name: '',
    description: '',
    category_id: '',
    tags: [],
    start_date: '',
    end_date: '',
    annual_budget_id: '', // Jahresbudget-Auswahl
    
    // Extern
    external_budget: 0,
    suppliers: [],
    
    // Intern
    teams: [],
    
    // Übersicht wird automatisch berechnet
  });

  // Entity Data
  const [categories, setCategories] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<any[]>([]);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [availableBudgets, setAvailableBudgets] = useState<any[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [showInlineModal, setShowInlineModal] = useState<string | null>(null);
  
  // Team-Kosten State
  const [teamCosts, setTeamCosts] = useState<Record<string, {
    totalCost: number;
    totalHours: number;
    roles: any[];
  }>>({});
  
  // Dienstleister-Budget-Zuweisungen State
  const [supplierAllocations, setSupplierAllocations] = useState<any[]>([]);
  const [showInlineCreation, setShowInlineCreation] = useState<{
    categories: boolean;
    tags: boolean;
    suppliers: boolean;
    teams: boolean;
  }>({
    categories: false,
    tags: false,
    suppliers: false,
    teams: false
  });

  // =====================================================
  // SECTIONS CONFIGURATION
  // =====================================================
  const sections: FormSection[] = [
    {
      id: 'allgemein',
      title: 'Allgemein',
      icon: <Building2 className="w-5 h-5" />,
      description: 'Grundlegende Projekt-Eigenschaften'
    },
    {
      id: 'extern',
      title: 'Extern',
      icon: <ExternalLink className="w-5 h-5" />,
      description: 'Externe Dienstleister und Budget'
    },
    {
      id: 'intern',
      title: 'Intern',
      icon: <Users className="w-5 h-5" />,
      description: 'Interne Teams und Ressourcen'
    },
    {
      id: 'uebersicht',
      title: 'Übersicht',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Kosten-Übersicht und Validierung'
    }
  ];

  // =====================================================
  // LIFECYCLE HOOKS
  // =====================================================
  useEffect(() => {
    loadInitialData();
    if (project) {
      setFormData(project);
    }
  }, [project]);

  const loadInitialData = async () => {
    try {
      console.log('🔄 Lade Entitäts-Daten...');
      
      const [categoriesRes, tagsRes, suppliersRes, teamsRes, budgetsRes] = await Promise.all([
        apiService.get('/api/categories'),
        apiService.get('/api/tags'),
        apiService.get('/api/suppliers'),
        apiService.get('/api/teams'),
        apiService.get('/api/budgets')
      ]);

      console.log('📊 API-Antworten:', {
        categories: categoriesRes,
        tags: tagsRes,
        suppliers: suppliersRes,
        teams: teamsRes,
        budgets: budgetsRes
      });

      // API-Antworten können in verschiedenen Formaten kommen
      const extractData = (response: any) => {
        if (Array.isArray(response)) return response;
        if (response && Array.isArray(response.data)) return response.data;
        if (response && response.success && Array.isArray(response.data)) return response.data;
        return [];
      };

      setCategories(extractData(categoriesRes));
      setAvailableTags(extractData(tagsRes));
      setAvailableSuppliers(extractData(suppliersRes));
      setAvailableTeams(extractData(teamsRes));
      setAvailableBudgets(extractData(budgetsRes));

      console.log('✅ Daten erfolgreich geladen:', {
        categories: categoriesRes?.length || 0,
        tags: tagsRes?.length || 0,
        suppliers: suppliersRes?.length || 0,
        teams: teamsRes?.length || 0,
        budgets: budgetsRes?.length || 0
      });
    } catch (error) {
      console.error('❌ Fehler beim Laden der Daten:', error);
      setCategories([]);
      setAvailableTags([]);
      setAvailableSuppliers([]);
      setAvailableTeams([]);
      setAvailableBudgets([]);
    }
  };

  // =====================================================
  // FORM HANDLERS
  // =====================================================
    const handleInlineCreate = (entityType: string, newEntity: any) => {
    console.log('🆕 Neue Entität erstellt:', entityType, newEntity);
    
    // Extrahiere die tatsächlichen Daten aus der API-Antwort
    const actualEntity = newEntity.data || newEntity;
    console.log('📦 Extrahierte Entität:', actualEntity);
    
    switch (entityType) {
      case 'categories':
        setCategories(prev => {
          const updated = [...prev, actualEntity];
          console.log('📝 Kategorien aktualisiert:', updated);
          return updated;
        });
        handleInputChange('category_id', actualEntity.id);
        break;
      case 'tags':
        setAvailableTags(prev => {
          const updated = [...prev, actualEntity];
          console.log('🏷️ Tags aktualisiert:', updated);
          return updated;
        });
        handleInputChange('tags', [...(formData.tags || []), actualEntity.id]);
        break;
      case 'suppliers':
        setAvailableSuppliers(prev => {
          const updated = [...prev, actualEntity];
          console.log('🏢 Lieferanten aktualisiert:', updated);
          return updated;
        });
        break;
      case 'teams':
        setAvailableTeams(prev => {
          const updated = [...prev, actualEntity];
          console.log('👥 Teams aktualisiert:', updated);
          return updated;
        });
        break;
    }
    
    setShowInlineModal(null);
    
    // Zusätzlich: Daten neu laden um sicherzustellen, dass alles synchron ist
    setTimeout(() => {
      console.log('🔄 Lade Daten nach Entity-Erstellung neu...');
      loadInitialData();
    }, 500);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleTeamCostChange = (teamId: string, totalCost: number, totalHours: number, roles: any[]) => {
    setTeamCosts(prev => ({
      ...prev,
      [teamId]: {
        totalCost,
        totalHours,
        roles
      }
    }));
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Projektname ist erforderlich';
    }
    
    if (!formData.category_id) {
      newErrors.category_id = 'Kategorie ist erforderlich';
    }
    
    if (formData.external_budget < 0) {
      newErrors.external_budget = 'Budget muss positiv sein';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  // =====================================================
  // RENDER METHODS
  // =====================================================
  const renderSectionNavigation = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex space-x-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeSection === section.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {section.icon}
            <div className="text-left">
              <div className="font-medium">{section.title}</div>
              <div className="text-xs opacity-75">{section.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderAllgemeinSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-blue-600" />
          Projekt-Eigenschaften
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Projektname */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projektname *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Projektname eingeben..."
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Kategorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategorie *
            </label>
            <div className="flex space-x-2">
              <select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Kategorie auswählen...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowInlineModal('categories')}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {errors.category_id && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.category_id}
              </p>
            )}
          </div>

          {/* Jahresbudget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jahresbudget *
            </label>
            <select
              value={formData.annual_budget_id}
              onChange={(e) => handleInputChange('annual_budget_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.annual_budget_id ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Jahresbudget auswählen...</option>
              {availableBudgets.map((budget) => (
                <option key={budget.id} value={budget.id}>
                  {budget.year || budget.jahr} - {budget.gesamtbudget_formatted || `${budget.total_budget?.toLocaleString('de-DE')} €`}
                  {budget.verfuegbares_budget !== undefined && (
                    ` (Verfügbar: ${budget.verfuegbares_budget_formatted || `${budget.available_budget?.toLocaleString('de-DE')} €`})`
                  )}
                </option>
              ))}
            </select>
            {errors.annual_budget_id && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.annual_budget_id}
              </p>
            )}
            {formData.annual_budget_id && availableBudgets.find(b => b.id === formData.annual_budget_id) && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  💰 Verfügbares Budget: {(() => {
                    const selectedBudget = availableBudgets.find(b => b.id === formData.annual_budget_id);
                    return selectedBudget?.verfuegbares_budget_formatted || 
                           `${selectedBudget?.available_budget?.toLocaleString('de-DE')} €` || 
                           'Wird berechnet...';
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Beschreibung */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Beschreibung
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Projektbeschreibung..."
          />
        </div>

        {/* Zeitraum */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Startdatum
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enddatum
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex space-x-2 mb-3">
            <select
              onChange={(e) => {
                const tagId = e.target.value;
                if (tagId && !formData.tags.includes(tagId)) {
                  handleInputChange('tags', [...formData.tags, tagId]);
                }
                e.target.value = '';
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tag hinzufügen...</option>
              {availableTags
                .filter(tag => !formData.tags.includes(tag.id))
                .map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={() => setShowInlineModal('tags')}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Selected Tags */}
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tagId) => {
              const tag = availableTags.find(t => t.id === tagId);
              return tag ? (
                <span
                  key={tagId}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => handleInputChange('tags', formData.tags.filter(id => id !== tagId))}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderExternSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ExternalLink className="w-5 h-5 mr-2 text-green-600" />
          Externes Budget & Dienstleister
        </h3>
        
        {/* Multi-Dienstleister System - Story 9.3 Implementiert */}
        {formData.id ? (
          <MultiSupplierManager
            projectId={formData.id}
            externalBudget={formData.external_budget || 0}
            onBudgetChange={(newBudget) => handleInputChange('external_budget', newBudget)}
            availableSuppliers={availableSuppliers}
            onSupplierCreate={() => {
              // Reload suppliers when new one is created
              loadInitialData();
            }}
          />
        ) : (
          <SupplierBudgetDistribution
            totalExternalBudget={formData.external_budget || 0}
            onTotalBudgetChange={(budget) => handleInputChange('external_budget', budget)}
            availableSuppliers={availableSuppliers}
            onSupplierAllocationsChange={setSupplierAllocations}
            onSupplierCreate={() => loadInitialData()}
            availableAnnualBudget={(() => {
              const selectedBudget = availableBudgets.find(b => b.id === formData.annual_budget_id);
              return selectedBudget?.available_budget || selectedBudget?.verfuegbares_budget;
            })()}
          />
        )}
      </div>
    </div>
  );

  const renderInternSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-purple-600" />
          Interne Teams & Ressourcen
        </h3>
        
        <div className="space-y-6">
          {/* Team-Auswahl mit neuer UX */}
          <TeamSelector
            availableTeams={availableTeams}
            selectedTeams={formData.teams || []}
            onTeamChange={(teamIds) => handleInputChange('teams', teamIds)}
            onInlineCreate={() => setShowInlineModal('teams')}
          />

          {/* Team-Lead Auswahl */}
          {formData.teams && formData.teams.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team-Lead (Optional)
              </label>
              <select
                value={formData.team_lead_id || ''}
                onChange={(e) => handleInputChange('team_lead_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Team-Lead auswählen...</option>
                {availableTeams
                  .filter(team => formData.teams?.includes(team.id))
                  .map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Der Team-Lead wird nur zur Information gespeichert
              </p>
            </div>
          )}

          {/* Rollen-basierte Kosten-Kalkulation */}
          <div className="space-y-4">
            {formData.teams && formData.teams.length > 0 ? (
              formData.teams.map((teamId: string) => {
                const team = availableTeams.find(t => t.id === teamId);
                if (!team) return null;
                
                return (
                  <TeamRoleManager
                    key={teamId}
                    teamId={teamId}
                    teamName={team.name}
                    onCostChange={handleTeamCostChange}
                  />
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="font-medium">Keine Teams ausgewählt</p>
                <p className="text-sm">Wählen Sie zuerst Teams aus, um Rollen und Kosten zu kalkulieren</p>
              </div>
            )}
          </div>

          {/* Gesamtkosten-Übersicht als Tabelle */}
          {Object.keys(teamCosts).length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-4 flex items-center">
                <Calculator className="w-4 h-4 mr-2" />
                Gesamte Interne Kosten - Alle Teams
              </h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-purple-300">
                      <th className="text-left py-2 px-3 font-medium text-purple-800">Team</th>
                      <th className="text-right py-2 px-3 font-medium text-purple-800">Rollen</th>
                      <th className="text-right py-2 px-3 font-medium text-purple-800">Stunden</th>
                      <th className="text-right py-2 px-3 font-medium text-purple-800">Ø Stundensatz</th>
                      <th className="text-right py-2 px-3 font-medium text-purple-800">Kosten</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(teamCosts).map(([teamId, costs], index) => {
                      const team = availableTeams.find(t => t.id === teamId);
                      if (!team) return null;
                      
                      const avgHourlyRate = costs.totalHours > 0 ? costs.totalCost / costs.totalHours : 0;
                      
                      return (
                        <tr key={teamId} className={index % 2 === 0 ? 'bg-white' : 'bg-purple-25'}>
                          <td className="py-2 px-3 text-gray-900">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 text-purple-600 mr-2 flex-shrink-0" />
                              <div>
                                <div className="font-medium">{team.name}</div>
                                {team.description && (
                                  <div className="text-xs text-gray-500 truncate">{team.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-gray-900">
                            {costs.roles?.length || 0}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-gray-900">
                            {costs.totalHours.toLocaleString('de-DE')}h
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-gray-900">
                            {new Intl.NumberFormat('de-DE', {
                              style: 'currency',
                              currency: 'EUR'
                            }).format(avgHourlyRate)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-gray-900">
                            {new Intl.NumberFormat('de-DE', {
                              style: 'currency',
                              currency: 'EUR'
                            }).format(costs.totalCost)}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Gesamt-Summe */}
                    <tr className="border-t-2 border-purple-400 bg-purple-100 font-medium">
                      <td className="py-3 px-3 text-purple-900 font-bold">
                        Gesamt-Summe ({Object.keys(teamCosts).length} Teams)
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-purple-900">
                        {Object.values(teamCosts).reduce((sum, tc) => sum + (tc.roles?.length || 0), 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-purple-900">
                        {Object.values(teamCosts).reduce((sum, tc) => sum + tc.totalHours, 0).toLocaleString('de-DE')}h
                      </td>
                      <td className="py-3 px-3 text-right text-purple-700">
                        Ø {new Intl.NumberFormat('de-DE', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(
                          Object.values(teamCosts).reduce((sum, tc) => sum + tc.totalHours, 0) > 0
                            ? Object.values(teamCosts).reduce((sum, tc) => sum + tc.totalCost, 0) / 
                              Object.values(teamCosts).reduce((sum, tc) => sum + tc.totalHours, 0)
                            : 0
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-purple-900 text-lg">
                        {new Intl.NumberFormat('de-DE', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(Object.values(teamCosts).reduce((sum, tc) => sum + tc.totalCost, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-blue-800">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="font-medium">Wichtiger Hinweis</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Interne Kosten haben <strong>keine Auswirkung auf das Jahresbudget</strong>. 
                  Diese Kalkulation dient nur der internen Kostentransparenz.
                </p>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );

  // =====================================================
  // BUDGET CALCULATIONS - Story 9.5
  // =====================================================
  const calculateBudgetSummary = () => {
    // Externes Budget Summary
    const externalBudget = formData.external_budget || 0;
    
    // Berechne zugewiesenes Budget aus Supplier-Allocations
    const allocatedBudget = supplierAllocations.reduce((sum, alloc) => sum + (alloc.allocatedBudget || 0), 0);
    const consumedBudget = formData.consumed_budget || 0; // Aus bestehenden Projekten
    const unallocatedBudget = externalBudget - allocatedBudget;
    const availableBudget = externalBudget - consumedBudget;

    // Internes Budget Summary (basierend auf echten Rollen-Kalkulationen)
    const teams = formData.teams || [];
    const estimatedInternalCosts = Object.values(teamCosts).reduce((sum, tc) => sum + tc.totalCost, 0);
    const estimatedHours = Object.values(teamCosts).reduce((sum, tc) => sum + tc.totalHours, 0);
    const averageHourlyRate = estimatedHours > 0 ? estimatedInternalCosts / estimatedHours : 0;

    // Jahresbudget-Auswirkung (echte Daten)
    const selectedBudget = availableBudgets.find(b => b.id === formData.annual_budget_id);
    const yearlyBudget = selectedBudget?.total_budget || selectedBudget?.gesamtbudget || 0;
    const availableYearlyBudget = selectedBudget?.available_budget || selectedBudget?.verfuegbares_budget || 0;
    const remainingAfterProject = availableYearlyBudget - externalBudget;
    const utilizationPercentage = yearlyBudget > 0 ? (externalBudget / yearlyBudget) * 100 : 0;

    // Validierung
    const warnings = [];
    const errors = [];

    if (utilizationPercentage > 80) {
      warnings.push('Hohe Jahresbudget-Nutzung: ' + utilizationPercentage.toFixed(1) + '%');
    }
    if (externalBudget > availableYearlyBudget) {
      errors.push('Verfügbares Jahresbudget überschritten um €' + (externalBudget - availableYearlyBudget).toLocaleString('de-DE'));
    }
    if (unallocatedBudget > 0) {
      warnings.push('€' + unallocatedBudget.toLocaleString('de-DE') + ' noch nicht auf Dienstleister verteilt');
    }
    if (!formData.name || !formData.category_id) {
      errors.push('Pflichtfelder nicht ausgefüllt');
    }

    return {
      external: {
        total: externalBudget,
        allocated: allocatedBudget,
        consumed: consumedBudget,
        unallocated: unallocatedBudget,
        available: availableBudget,
        suppliers_count: supplierAllocations.length
      },
      internal: {
        estimated_costs: estimatedInternalCosts,
        total_hours: estimatedHours,
        average_hourly_rate: averageHourlyRate,
        teams_count: teams.length
      },
      yearly_impact: {
        current_available: availableYearlyBudget,
        total_yearly_budget: yearlyBudget,
        project_allocation: externalBudget,
        remaining_after_project: remainingAfterProject,
        utilization_percentage: utilizationPercentage,
        budget_name: selectedBudget?.year || selectedBudget?.jahr || 'Kein Budget ausgewählt'
      },
      validation: {
        is_complete: errors.length === 0,
        is_consistent: errors.length === 0,
        warnings: warnings,
        errors: errors
      }
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderUebersichtSection = () => {
    const budgetSummary = calculateBudgetSummary();
    
    return (
      <div className="space-y-6">
        {/* Externes Budget Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Externes Budget
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Gesamt-Budget</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(budgetSummary.external.total)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Zugewiesen</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(budgetSummary.external.allocated)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Nicht zugewiesen</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(budgetSummary.external.unallocated)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Verbraucht</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(budgetSummary.external.consumed)}
              </p>
            </div>
          </div>

          {/* Budget Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Budget-Auslastung</span>
              <span>{budgetSummary.external.total > 0 ? ((budgetSummary.external.allocated / budgetSummary.external.total) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${budgetSummary.external.total > 0 ? (budgetSummary.external.allocated / budgetSummary.external.total) * 100 : 0}%` 
                }}
              />
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>📊 {budgetSummary.external.suppliers_count} Dienstleister vorgemerkt</p>
          </div>
        </div>

        {/* Internes Budget Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Internes Budget
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Geschätzte Kosten</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrency(budgetSummary.internal.estimated_costs)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Geschätzte Stunden</p>
              <p className="text-xl font-bold text-blue-700">
                {budgetSummary.internal.total_hours.toLocaleString('de-DE')}h
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Ø Stundensatz</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(budgetSummary.internal.average_hourly_rate)}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center text-blue-800">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="font-medium">Hinweis</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Interne Kosten haben keine Auswirkung auf das Jahresbudget. 
              Teams: {budgetSummary.internal.teams_count}
            </p>
          </div>
        </div>

        {/* Jahresbudget-Auswirkung */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
            Jahresbudget-Auswirkung
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Verfügbares Jahresbudget</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(budgetSummary.yearly_impact.current_available)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Projekt-Allokation</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(budgetSummary.yearly_impact.project_allocation)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Verbleibendes Budget</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(budgetSummary.yearly_impact.remaining_after_project)}
              </p>
            </div>
          </div>

          {/* Yearly Budget Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Jahresbudget-Nutzung</span>
              <span>{budgetSummary.yearly_impact.utilization_percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  budgetSummary.yearly_impact.utilization_percentage > 80 ? 'bg-red-500' :
                  budgetSummary.yearly_impact.utilization_percentage > 60 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetSummary.yearly_impact.utilization_percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Validierungs-Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Validierungs-Status
          </h3>
          
          <div className="space-y-3">
            {/* Completion Status */}
            <div className="flex items-center">
              {budgetSummary.validation.is_complete ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className={`font-medium ${budgetSummary.validation.is_complete ? 'text-green-800' : 'text-red-800'}`}>
                {budgetSummary.validation.is_complete ? 'Projekt vollständig' : 'Projekt unvollständig'}
              </span>
            </div>

            {/* Consistency Status */}
            <div className="flex items-center">
              {budgetSummary.validation.is_consistent ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className={`font-medium ${budgetSummary.validation.is_consistent ? 'text-green-800' : 'text-red-800'}`}>
                {budgetSummary.validation.is_consistent ? 'Budget konsistent' : 'Budget inkonsistent'}
              </span>
            </div>

            {/* Errors */}
            {budgetSummary.validation.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800 mb-1">Fehler:</p>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {budgetSummary.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {budgetSummary.validation.warnings.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm font-medium text-orange-800 mb-1">Warnungen:</p>
                <ul className="text-sm text-orange-700 list-disc list-inside">
                  {budgetSummary.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success State */}
            {budgetSummary.validation.is_complete && budgetSummary.validation.is_consistent && budgetSummary.validation.warnings.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  ✅ Projekt ist bereit zur Erstellung! Alle Validierungen erfolgreich.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // MAIN RENDER
  // =====================================================
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {project ? 'Projekt bearbeiten' : 'Neues Projekt erstellen'}
        </h1>
        <p className="text-gray-600">
          Verwenden Sie die semantischen Bereiche, um Ihr Projekt strukturiert zu konfigurieren.
        </p>
      </div>

      {/* Section Navigation */}
      {renderSectionNavigation()}

      {/* Section Content */}
      <div className="min-h-96">
        {activeSection === 'allgemein' && renderAllgemeinSection()}
        {activeSection === 'extern' && renderExternSection()}
        {activeSection === 'intern' && renderInternSection()}
        {activeSection === 'uebersicht' && renderUebersichtSection()}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between items-center">
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg"
          >
            Abbrechen
          </button>
          {activeSection !== 'allgemein' && (
            <button
              type="button"
              onClick={() => {
                const sections = ['allgemein', 'extern', 'intern', 'uebersicht'];
                const currentIndex = sections.indexOf(activeSection);
                if (currentIndex > 0) {
                  setActiveSection(sections[currentIndex - 1] as any);
                }
              }}
              className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors border border-blue-300 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          {activeSection !== 'uebersicht' && (
            <button
              type="button"
              onClick={() => {
                const sections = ['allgemein', 'extern', 'intern', 'uebersicht'];
                const currentIndex = sections.indexOf(activeSection);
                if (currentIndex < sections.length - 1) {
                  setActiveSection(sections[currentIndex + 1] as any);
                }
              }}
              className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors border border-blue-300 rounded-lg"
            >
              Weiter
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
          {activeSection === 'uebersicht' && (
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {project ? 'Änderungen speichern' : 'Projekt erstellen'}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Inline Modals - Placeholder für Story 9.4 */}
      {showInlineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <InlineEntityCreation
              entityType={showInlineModal as 'categories' | 'tags' | 'suppliers' | 'teams'}
              onEntityCreated={(entity) => handleInlineCreate(showInlineModal!, entity)}
              onCancel={() => setShowInlineModal(null)}
              isVisible={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFormAdvanced;
