import React, { useState } from 'react';
import {
  Brain,
  TestTube,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Building2,
  FileText,
  DollarSign,
  FolderOpen
} from 'lucide-react';

interface SystemPrompt {
  id: string;
  name: string;
  description?: string;
  category: string;
  supplier_id?: string;
  prompt_text: string;
  is_active: boolean;
  provider?: string;
  model?: string;
  version?: string;
  created_at: string;
  updated_at: string;
}

interface ImprovedPromptDisplayProps {
  prompts: SystemPrompt[];
  onCreatePrompt: () => void;
  onEditPrompt: (prompt: SystemPrompt) => void;
  onDeletePrompt: (promptId: string) => void;
  onTestPrompt: (prompt: SystemPrompt) => void;
}

const ImprovedPromptDisplay: React.FC<ImprovedPromptDisplayProps> = ({
  prompts,
  onCreatePrompt,
  onEditPrompt,
  onDeletePrompt,
  onTestPrompt
}) => {
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());

  // Gruppiere Prompts nach Kategorie für bessere Übersicht
  const promptsByCategory = prompts.reduce((acc, prompt) => {
    const category = prompt.category || 'UNCATEGORIZED';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(prompt);
    return acc;
  }, {} as Record<string, SystemPrompt[]>);

  const categoryConfig = {
    'OCR': {
      label: '📄 OCR-Verarbeitung',
      description: 'Prompts für die Extraktion von Rechnungsdaten',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: FileText
    },
    'SUPPLIER_RECOGNITION': {
      label: '🏢 Lieferanten-Erkennung',
      description: 'Prompts zur Identifikation von Lieferanten',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: Building2
    },
    'BUDGET_ANALYSIS': {
      label: '💰 Budget-Analyse',
      description: 'Prompts für Budget-Berechnungen und -Analysen',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: DollarSign
    },
    'PROJECT_ASSIGNMENT': {
      label: '📋 Projekt-Zuordnung',
      description: 'Prompts für die automatische Projekt-Zuordnung',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: FolderOpen
    },
    'UNCATEGORIZED': {
      label: '📝 Allgemein',
      description: 'Nicht kategorisierte Prompts',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Brain
    }
  };

  const togglePromptExpansion = (promptId: string) => {
    const newExpanded = new Set(expandedPrompts);
    if (newExpanded.has(promptId)) {
      newExpanded.delete(promptId);
    } else {
      newExpanded.add(promptId);
    }
    setExpandedPrompts(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-600" />
            System-Prompts Management
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {prompts.length} Prompts in {Object.keys(promptsByCategory).length} Kategorien
          </p>
        </div>
        <button 
          onClick={onCreatePrompt}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuer Prompt
        </button>
      </div>

      {/* Prompts nach Kategorien */}
      {prompts.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(promptsByCategory).map(([category, categoryPrompts]) => {
            const config = categoryConfig[category] || categoryConfig['UNCATEGORIZED'];
            const IconComponent = config.icon;
            
            return (
              <div key={category} className={`bg-white rounded-lg border-2 ${config.color.split(' ')[2]} p-6`}>
                {/* Kategorie Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <IconComponent className="w-5 h-5 mr-2 text-gray-700" />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {config.label}
                      </h4>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full ${config.color}`}>
                    {categoryPrompts.length} {categoryPrompts.length === 1 ? 'Prompt' : 'Prompts'}
                  </span>
                </div>
                
                {/* Prompts in dieser Kategorie */}
                <div className="space-y-4">
                  {categoryPrompts.map((prompt) => {
                    const isExpanded = expandedPrompts.has(prompt.id);
                    
                    return (
                      <div key={prompt.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        {/* Prompt Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <h5 className="font-medium text-gray-900">{prompt.name}</h5>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              prompt.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {prompt.is_active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                            {prompt.supplier_id && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full flex items-center">
                                <Building2 className="w-3 h-3 mr-1" />
                                Lieferant-spezifisch
                              </span>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => togglePromptExpansion(prompt.id)}
                              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                              title={isExpanded ? 'Einklappen' : 'Ausklappen'}
                            >
                              {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => onTestPrompt(prompt)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Prompt testen"
                            >
                              <TestTube className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEditPrompt(prompt)}
                              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Bearbeiten"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeletePrompt(prompt.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Prompt Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Provider:</span>
                            <span className="ml-1 text-gray-600">{prompt.provider || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Model:</span>
                            <span className="ml-1 text-gray-600">{prompt.model || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Version:</span>
                            <span className="ml-1 text-gray-600">{prompt.version || '1.0'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Zeichen:</span>
                            <span className="ml-1 text-gray-600">{prompt.prompt_text?.length || 0}</span>
                          </div>
                        </div>
                        
                        {/* Beschreibung */}
                        {prompt.description && (
                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-700">Beschreibung:</span>
                            <p className="mt-1 text-sm text-gray-600">{prompt.description}</p>
                          </div>
                        )}
                        
                        {/* Prompt Text */}
                        <div className="bg-white rounded border border-gray-200 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Prompt-Text:</span>
                            <button
                              onClick={() => togglePromptExpansion(prompt.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              {isExpanded ? 'Weniger anzeigen' : 'Vollständig anzeigen'}
                              {isExpanded ? <EyeOff className="w-3 h-3 ml-1" /> : <Eye className="w-3 h-3 ml-1" />}
                            </button>
                          </div>
                          <div className={`text-sm text-gray-600 bg-gray-50 p-3 rounded font-mono ${
                            isExpanded ? '' : 'max-h-20 overflow-hidden'
                          }`}>
                            {isExpanded 
                              ? prompt.prompt_text || 'Kein Text verfügbar'
                              : truncateText(prompt.prompt_text || 'Kein Text verfügbar')
                            }
                          </div>
                        </div>
                        
                        {/* Timestamps */}
                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                          <span>Erstellt: {formatDate(prompt.created_at)}</span>
                          <span>Aktualisiert: {formatDate(prompt.updated_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine System-Prompts vorhanden</h3>
          <p className="text-gray-500 mb-4">
            Erstellen Sie System-Prompts für OCR-Verarbeitung, Lieferanten-Erkennung und mehr.
          </p>
          <button 
            onClick={onCreatePrompt}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center mx-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ersten Prompt erstellen
          </button>
        </div>
      )}
    </div>
  );
};

export default ImprovedPromptDisplay;


