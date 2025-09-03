// =====================================================
// Budget Manager 2025 - Advanced Project Management
// Epic 9: Erweiterte Projekt-Verwaltung
// =====================================================

import React, { useState } from 'react';
import ProjectFormAdvanced from '../components/projects/ProjectFormAdvanced';
import { ArrowLeft } from 'lucide-react';
import apiService from '../services/apiService';

const ProjectManagementAdvanced: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleSaveProject = async (projectData: any) => {
    try {
      console.log('🚀 Erstelle Projekt mit Daten:', projectData);
      
      // Transformiere die Daten für die Backend-API
      const apiData = {
        name: projectData.name,
        description: projectData.description,
        category_id: projectData.category_id, // Korrigiert: category_id statt kategorie_id
        team_id: projectData.team_id,
        planned_budget: parseFloat(projectData.external_budget) || 0,
        start_date: projectData.start_date || null, // Korrigiert: null statt leerer String
        end_date: projectData.end_date || null, // Korrigiert: null statt leerer String
        priority: projectData.priority || 'medium',
        cost_type: projectData.cost_type,
        supplier_id: projectData.supplier_id,
        impact_level: projectData.impact_level || 'medium',
        tags: projectData.tags || [],
        internal_hours_design: parseInt(projectData.internal_hours_design) || 0,
        internal_hours_content: parseInt(projectData.internal_hours_content) || 0,
        internal_hours_dev: parseInt(projectData.internal_hours_dev) || 0,
        // Epic 9: Neue Felder für Relationen
        teams: projectData.teams || [],
        team_costs: projectData.team_costs || {},
        supplier_allocations: projectData.supplier_allocations || [],
        external_budget: parseFloat(projectData.external_budget) || 0,
        budget_year: new Date().getFullYear() // Aktuelles Jahr
      };

      console.log('📤 Sende API-Daten:', apiData);

      // API-Call über ApiService
      const result = await apiService.post('/api/projects', apiData);
      console.log('✅ Projekt erfolgreich erstellt:', result);

      alert(`✅ Projekt "${apiData.name}" erfolgreich erstellt!\nProjekt-ID: ${result.data?.id || 'N/A'}`);
      setShowCreateForm(false);
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      alert(`❌ Fehler beim Speichern des Projekts:\n${error.message}`);
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
  };

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProjectFormAdvanced
          onSave={handleSaveProject}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Zurück zur Projekt-Verwaltung
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 Erweiterte Projekt-Verwaltung
          </h1>
          <p className="text-gray-600">
            Epic 9: Semantische UI-Struktur, Multi-Dienstleister-System und intelligente Budget-Logik
          </p>
        </div>

        {/* Epic 9 Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold">9.1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">UI-Struktur</h3>
                <p className="text-sm text-green-600">✅ Implementiert</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Semantische Bereiche: Allgemein, Extern, Intern, Übersicht
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-green-600 font-semibold">9.2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Multi-Dienstleister</h3>
                <p className="text-sm text-orange-600">🔄 In Arbeit</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Flexible Budget-Aufteilung auf mehrere Dienstleister
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-purple-600 font-semibold">9.3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Budget-Logik</h3>
                <p className="text-sm text-gray-500">⏳ Geplant</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Intelligente Budget-Logik mit Soft-Delete
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-orange-600 font-semibold">9.4+</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Weitere Features</h3>
                <p className="text-sm text-gray-500">⏳ Geplant</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Inline-Creation, Kosten-Übersicht
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span className="mr-2">🚀</span>
            Neues Projekt mit Epic 9 Features erstellen
          </button>
        </div>

        {/* Implementation Status */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🛠️ Implementierungs-Status
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Story 9.1: Semantische UI-Struktur</h3>
                <p className="text-green-700">
                  Vollständig implementiert - Bereiche: Allgemein, Extern, Intern, Übersicht
                </p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-sm font-bold">⚡</span>
              </div>
              <div>
                <h3 className="font-semibold text-orange-900">Story 9.2: Multi-Dienstleister-System</h3>
                <p className="text-orange-700">
                  Backend-APIs implementiert, Frontend-Integration in Arbeit
                </p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-sm font-bold">⏳</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Stories 9.3-9.5</h3>
                <p className="text-gray-700">
                  Geplant: Intelligente Budget-Logik, Inline-Creation, Kosten-Übersicht
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🔧 Technische Implementierung
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Backend-APIs</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ <code>GET /api/projects/:id/suppliers</code></li>
                <li>✅ <code>POST /api/projects/:id/suppliers</code></li>
                <li>✅ <code>PUT /api/projects/:id/suppliers/:supplierId</code></li>
                <li>✅ <code>DELETE /api/projects/:id/suppliers/:supplierId</code></li>
                <li>✅ <code>GET /api/projects/:id/budget-summary</code></li>
                <li>✅ <code>GET /api/projects/:id/audit-log</code></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Datenbank-Schema</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ <code>project_suppliers</code> (Many-to-Many)</li>
                <li>✅ <code>budget_audit_log</code> (Audit-Trail)</li>
                <li>✅ Soft-Delete für alle Entitäten</li>
                <li>✅ <code>external_budget</code> in projects</li>
                <li>✅ Automatische Trigger für Audit-Log</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagementAdvanced;
