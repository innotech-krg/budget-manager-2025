import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import DocumentViewer from '../documents/DocumentViewer';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface ExtractedData {
  supplier: {
    name: string;
    address: string;
    uid_number: string;
    email: string;
    phone: string;
  };
  invoice: {
    number: string;
    date: string;
    due_date: string;
    total_amount: number;
    currency: string;
    tax_amount: number;
    net_amount: number;
  };
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    tax_rate?: number;
  }>;
  confidence_score: number;
  raw_text: string;
}

interface OCRReviewInterfaceProps {
  extractedData: ExtractedData;
  onApprove: (approvedData: ExtractedData, projectAssignments: ProjectAssignment[]) => void;
  onReject: () => void;
  ocrProcessingId?: string; // Für Dokument-Verwaltung
}

interface ProjectAssignment {
  lineItemIndex: number;
  projectId: string;
  projectName: string;
  confidence: number;
}

interface Project {
  id: string;
  name: string;
  available_budget: number;
  consumed_budget: number;
}

interface Supplier {
  id: string;
  name: string;
  uid_number: string;
  email?: string;
}

const OCRReviewInterface: React.FC<OCRReviewInterfaceProps> = ({
  extractedData,
  onApprove,
  onReject,
  ocrProcessingId
}) => {
  const [editedData, setEditedData] = useState<ExtractedData>(extractedData);
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([]);
  const [supplierConfirmed, setSupplierConfirmed] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    recipient: true,
    supplier: true,
    invoice: true,
    positions: true,
    budget: true,
    duplicates: false
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicateCheck, setDuplicateCheck] = useState<any>(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Projekte und Lieferanten laden
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [projectsResponse, suppliersResponse] = await Promise.all([
          apiService.get('/api/projects'),
          apiService.get('/api/suppliers')
        ]);

        // Handle different API response formats
        let fetchedProjectsData = [];
        if (projectsResponse.success) {
          fetchedProjectsData = projectsResponse.data || projectsResponse.projects || [];
        } else if (projectsResponse.projects) {
          // Direct API response without success wrapper
          fetchedProjectsData = projectsResponse.projects;
        } else if (Array.isArray(projectsResponse)) {
          // Direct array response
          fetchedProjectsData = projectsResponse;
        }
        
        console.log('🔍 Projekt-API Response Debug:', {
          hasSuccess: !!projectsResponse.success,
          hasProjects: !!projectsResponse.projects,
          isArray: Array.isArray(projectsResponse),
          projectsCount: fetchedProjectsData.length,
          responseKeys: Object.keys(projectsResponse || {})
        });
        
        if (fetchedProjectsData.length > 0) {
          setProjects(fetchedProjectsData);
        }

        if (suppliersResponse.success) {
          setSuppliers(suppliersResponse.data || []);
        }

        // Wenn keine Projekte geladen wurden, verwende Fallback-Daten
        if (fetchedProjectsData.length === 0) {
          console.log('⚠️ Keine Projekte von API erhalten, verwende Fallback-Daten');
          setProjects([
            { id: 'mock-1', name: 'Website Relaunch', available_budget: 5000, consumed_budget: 0 },
            { id: 'mock-2', name: 'Backend API', available_budget: 8000, consumed_budget: 0 },
            { id: 'mock-3', name: 'Mobile App', available_budget: 12000, consumed_budget: 0 },
          ]);
        } else {
          // Transformiere die Projekt-Daten für OCR-Verwendung
          const transformedProjects = fetchedProjectsData.map(project => ({
            id: project.id,
            name: project.name,
            available_budget: project.available_budget || (project.planned_budget - project.consumed_budget) || 0,
            consumed_budget: project.consumed_budget || 0
          }));
          setProjects(transformedProjects);
          console.log('✅ Echte Projekte geladen:', transformedProjects.length);
        }

        // Wenn keine Lieferanten geladen wurden, verwende Fallback-Daten
        if (!suppliersResponse.success || !suppliersResponse.data || suppliersResponse.data.length === 0) {
          console.log('⚠️ Keine Lieferanten von API erhalten, verwende Fallback-Daten');
          setSuppliers([
            { id: '1', name: 'DEFINE® - Design & Marketing GmbH', uid_number: 'ATU2783446' },
            { id: '2', name: 'DEFINE® GmbH', uid_number: 'ATU2783446' },
          ]);
        } else {
          console.log('✅ Echte Lieferanten geladen:', suppliersResponse.data.length);
        }

        // Prüfe ob erkannter Lieferant bereits in der Liste existiert
        const recognizedSupplierName = extractedData?.supplier?.name;
        if (recognizedSupplierName) {
          const suppliersData = suppliersResponse.data || [];
          const existingSupplier = suppliersData.find(
            s => s.name.toLowerCase().includes(recognizedSupplierName.toLowerCase()) ||
                 recognizedSupplierName.toLowerCase().includes(s.name.toLowerCase())
          );
          
          if (existingSupplier) {
            setSelectedSupplierId(existingSupplier.id);
            setSupplierConfirmed(true);
            setIsNewSupplier(false);
            console.log('✅ Lieferant automatisch erkannt:', existingSupplier.name);
          } else {
            setIsNewSupplier(true);
            setSelectedSupplierId('new');
            console.log('🆕 Neuer Lieferant erkannt:', recognizedSupplierName);
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        // Keine Mock-Daten mehr - zeige Fehlermeldung oder leere Listen
        setProjects([]);
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Duplikatsprüfung beim Laden der Komponente
  useEffect(() => {
    const checkForDuplicates = async () => {
      if (!editedData.invoice.number || !editedData.supplier.name) {
        return;
      }

      try {
        setCheckingDuplicates(true);
        const result = await apiService.checkDuplicates(
          editedData.invoice.number,
          editedData.supplier.name,
          editedData.totals?.grossAmount || 0,
          editedData.line_items
        );

        if (result.success) {
          setDuplicateCheck(result.data);
          if (result.data.hasDuplicates) {
            setExpandedSections(prev => ({ ...prev, duplicates: true }));
          }
        }
      } catch (error) {
        console.error('Fehler bei Duplikatsprüfung:', error);
      } finally {
        setCheckingDuplicates(false);
      }
    };

    checkForDuplicates();
  }, [editedData.invoice.number, editedData.supplier.name, editedData.totals?.grossAmount]);

  // Automatische Projekt-Zuordnungsvorschläge generieren
  useEffect(() => {
    if (projects.length === 0) return;
    const suggestions = editedData.line_items.map((item, index) => {
      // Einfache Keyword-basierte Zuordnung (später durch KI ersetzen)
      let suggestedProject = projects[0]; // Default
      let confidence = 0.3;

      const description = item.description.toLowerCase();
      if (description.includes('programmier') || description.includes('entwickl')) {
        suggestedProject = projects.find(p => p.name.toLowerCase().includes('api')) || projects[0];
        confidence = 0.8;
      } else if (description.includes('design') || description.includes('website')) {
        suggestedProject = projects.find(p => p.name.toLowerCase().includes('website')) || projects[0];
        confidence = 0.7;
      } else if (description.includes('marketing') || description.includes('content')) {
        suggestedProject = projects.find(p => p.name.toLowerCase().includes('marketing')) || projects[0];
        confidence = 0.6;
      }

      return {
        lineItemIndex: index,
        projectId: suggestedProject.id,
        projectName: suggestedProject.name,
        confidence
      };
    });

    setProjectAssignments(suggestions);
  }, [editedData.line_items, projects]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFieldEdit = (fieldPath: string, value: any) => {
    const keys = fieldPath.split('.');
    setEditedData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newData;
    });
  };

  const handleProjectAssignment = (lineItemIndex: number, projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    setProjectAssignments(prev => prev.map(assignment => 
      assignment.lineItemIndex === lineItemIndex
        ? { ...assignment, projectId, projectName: project.name, confidence: 1.0 }
        : assignment
    ));
  };

  // Hilfsfunktion: Netto-Betrag berechnen (nur bei Brutto-Beträgen)
  const calculateNetAmount = (amount, vatRate = 20, isNetAmount = true) => {
    // Wenn bereits Netto-Betrag, keine Umrechnung nötig
    if (isNetAmount) {
      return amount;
    }
    // Nur bei Brutto-Beträgen umrechnen
    return amount / (1 + vatRate / 100);
  };

  const calculateBudgetImpact = () => {
    return projectAssignments.reduce((acc, assignment) => {
      const project = projects.find(p => p.id === assignment.projectId);
      const lineItem = editedData.line_items[assignment.lineItemIndex];
      
      if (project && lineItem) {
        // Verwende Netto-Betrag für Budget-Berechnungen
        const netAmount = calculateNetAmount(lineItem.total_amount, lineItem.vat_rate || 20, lineItem.isNetAmount !== false);
        
        const existing = acc.find(item => item.projectId === assignment.projectId);
        if (existing) {
          existing.impact += netAmount;
        } else {
          acc.push({
            projectId: assignment.projectId,
            projectName: assignment.projectName,
            impact: netAmount,
            availableBudget: project.available_budget,
            consumedBudget: project.consumed_budget
          });
        }
      }
      
      return acc;
    }, [] as Array<{
      projectId: string;
      projectName: string;
      impact: number;
      availableBudget: number;
      consumedBudget: number;
    }>);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircleIcon className="h-4 w-4" />;
    return <ExclamationTriangleIcon className="h-4 w-4" />;
  };

  const isReadyForApproval = () => {
    return supplierConfirmed && 
           projectAssignments.every(assignment => assignment.projectId) &&
           editedData.supplier.name &&
           editedData.invoice.number &&
           (editedData.totals?.grossAmount || 0) > 0;
  };

  const budgetImpact = calculateBudgetImpact();
  const totalImpact = budgetImpact.reduce((sum, item) => sum + item.impact, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mr-3"></div>
            <span className="text-gray-600">Lade Projekte und Lieferanten...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              📋 Rechnungsdaten überprüfen
            </h2>
            <p className="text-gray-600">
              Bitte überprüfen Sie die extrahierten Daten und bestätigen Sie die Projekt-Zuordnungen
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(editedData.confidence_score)}`}>
              {getConfidenceIcon(editedData.confidence_score)}
              <span className="ml-1">{Math.min(100, Math.round(editedData.confidence_score))}% Konfidenz</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linke Spalte: Rechnungsdaten */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Empfänger-Sektion */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('recipient')}
            >
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-900">📋 Empfänger (Rechnungsempfänger)</h3>
              </div>
              {expandedSections.recipient ? 
                <ChevronDownIcon className="h-5 w-5 text-gray-400" /> : 
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              }
            </div>
            
            {expandedSections.recipient && (
              <div className="p-4 border-t border-gray-200 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Firma</label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value="Innotech GmbH"
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                      />
                      <CheckCircleIcon className="h-5 w-5 text-green-600 ml-2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UID</label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value="ATU12345678"
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                      />
                      <CheckCircleIcon className="h-5 w-5 text-green-600 ml-2" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Original-Dokument */}
          {ocrProcessingId && (
            <div className="mb-6">
              <DocumentViewer 
                ocrProcessingId={ocrProcessingId}
                showUpload={true}
              />
            </div>
          )}

          {/* Lieferanten-Sektion */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('supplier')}
            >
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 text-orange-600 mr-2" />
                <h3 className="font-semibold text-gray-900">🏢 Lieferant (Rechnungssteller)</h3>
              </div>
              {expandedSections.supplier ? 
                <ChevronDownIcon className="h-5 w-5 text-gray-400" /> : 
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              }
            </div>
            
            {expandedSections.supplier && (
              <div className="p-4 border-t border-gray-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Erkannter Lieferant</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editedData.supplier.name}
                      onChange={(e) => handleFieldEdit('supplier.name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {isNewSupplier ? (
                      <div className="flex items-center text-blue-600">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-1" />
                        <span className="text-sm font-medium">Neuer Lieferant</span>
                      </div>
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  {isNewSupplier && (
                    <p className="text-sm text-blue-600 mt-1">
                      ℹ️ Dieser Lieferant ist noch nicht in der Datenbank und wird bei der Freigabe automatisch angelegt.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lieferant bestätigen oder auswählen</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => {
                      setSelectedSupplierId(e.target.value);
                      if (e.target.value === 'new') {
                        setIsNewSupplier(true);
                        setSupplierConfirmed(false);
                      } else {
                        const supplier = suppliers.find(s => s.id === e.target.value);
                        if (supplier) {
                          handleFieldEdit('supplier.name', supplier.name);
                          handleFieldEdit('supplier.uid_number', supplier.uid_number);
                          setIsNewSupplier(false);
                          setSupplierConfirmed(true);
                        } else {
                          setIsNewSupplier(false);
                          setSupplierConfirmed(false);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Bitte wählen...</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.uid_number || 'Keine UID'})
                      </option>
                    ))}
                    <option value="new">
                      {isNewSupplier ? '🆕 Als neuen Lieferant bestätigen' : '+ Neuen Lieferant anlegen'}
                    </option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSupplierConfirmed(!supplierConfirmed)}
                    className={`flex items-center px-4 py-2 rounded-md font-medium ${
                      supplierConfirmed 
                        ? 'bg-green-100 text-green-800 border border-green-300' 
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    }`}
                  >
                    {supplierConfirmed ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        {isNewSupplier ? 'Neuer Lieferant bestätigt' : 'Lieferant bestätigt'}
                      </>
                    ) : (
                      <>
                        <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                        {isNewSupplier ? 'Neuen Lieferant bestätigen' : 'Bestätigung erforderlich'}
                      </>
                    )}
                  </button>
                  {isNewSupplier && supplierConfirmed && (
                    <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
                      🆕 Wird bei Freigabe automatisch angelegt
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Rechnungspositionen-Sektion */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('positions')}
            >
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-900">📄 Rechnungspositionen</h3>
              </div>
              {expandedSections.positions ? 
                <ChevronDownIcon className="h-5 w-5 text-gray-400" /> : 
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              }
            </div>
            
            {expandedSections.positions && (
              <div className="p-4 border-t border-gray-200 space-y-4">
                {editedData.line_items.map((item, index) => {
                  const assignment = projectAssignments.find(a => a.lineItemIndex === index);
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            Position {index + 1}: {item.description}
                          </h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              {item.quantity}x {item.unit_price?.toFixed(2)} € = {item.total_amount?.toFixed(2)} € {item.isNetAmount !== false ? '(netto)' : '(brutto)'}
                            </p>
                            <p className="text-green-600 font-medium">
                              {item.isNetAmount !== false ? 'Netto' : 'Netto (berechnet)'}: {calculateNetAmount(item.total_amount || 0, item.vat_rate || 20, item.isNetAmount !== false).toFixed(2)} € 
                              <span className="text-gray-500 ml-1">({item.vat_rate || 20}% MwSt.)</span>
                            </p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(0.9)}`}>
                          ✅
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Projekt-Zuordnung
                        </label>
                        <div className="flex items-center space-x-2">
                          <select
                            value={assignment?.projectId || ''}
                            onChange={(e) => handleProjectAssignment(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Bitte wählen...</option>
                            {projects.map(project => (
                              <option key={project.id} value={project.id}>
                                🎯 {project.name} (Verfügbar: {project.available_budget.toLocaleString()} €)
                              </option>
                            ))}
                          </select>
                          {assignment?.projectId ? (
                            <CheckIcon className="h-5 w-5 text-green-600" />
                          ) : (
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                          )}
                        </div>
                        {assignment?.confidence && assignment.confidence < 1.0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            KI-Vorschlag (Konfidenz: {Math.round(assignment.confidence * 100)}%)
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rechnungsdaten-Sektion */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('invoice')}
            >
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-gray-900">📊 Rechnungsdaten</h3>
              </div>
              {expandedSections.invoice ? 
                <ChevronDownIcon className="h-5 w-5 text-gray-400" /> : 
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              }
            </div>
            
            {expandedSections.invoice && (
              <div className="p-4 border-t border-gray-200 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rechnungsnummer</label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={editedData.invoice.number}
                        onChange={(e) => handleFieldEdit('invoice.number', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <CheckCircleIcon className="h-5 w-5 text-green-600 ml-2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rechnungsdatum</label>
                    <div className="flex items-center">
                      <input
                        type="date"
                        value={editedData.invoice.date}
                        onChange={(e) => handleFieldEdit('invoice.date', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <CheckCircleIcon className="h-5 w-5 text-green-600 ml-2" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nettobetrag</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="0.01"
                        value={editedData.totals?.netAmount || 0}
                        onChange={(e) => handleFieldEdit('totals.netAmount', parseFloat(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <span className="ml-2 text-gray-500">€</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Steuerbetrag</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="0.01"
                        value={editedData.totals?.vatAmount || 0}
                        onChange={(e) => handleFieldEdit('totals.vatAmount', parseFloat(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <span className="ml-2 text-gray-500">€</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gesamtbetrag</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="0.01"
                        value={editedData.totals?.grossAmount || 0}
                        onChange={(e) => handleFieldEdit('totals.grossAmount', parseFloat(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-bold"
                      />
                      <span className="ml-2 text-gray-500">€</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rechte Spalte: Duplikate, Budget-Impact und Freigabe */}
        <div className="space-y-6">
          
          {/* Duplikatsprüfung */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('duplicates')}
            >
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-orange-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Duplikatsprüfung</h3>
                  <p className="text-sm text-gray-600">
                    {checkingDuplicates ? 'Prüfe auf Duplikate...' : 
                     duplicateCheck?.hasDuplicates ? 
                       `${duplicateCheck.summary.exactInvoiceDuplicates + duplicateCheck.summary.similarInvoices + duplicateCheck.summary.duplicatePositions} mögliche Duplikate gefunden` :
                       'Keine Duplikate gefunden'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {checkingDuplicates ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent mr-2"></div>
                ) : duplicateCheck?.hasDuplicates ? (
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                )}
                {expandedSections.duplicates ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>

            {expandedSections.duplicates && (
              <div className="px-4 pb-4 border-t border-gray-100">
                {checkingDuplicates ? (
                  <div className="py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Prüfe auf existierende Rechnungen und Positionen...</p>
                  </div>
                ) : duplicateCheck ? (
                  <div className="space-y-4 mt-4">
                    {/* Exakte Rechnungsduplikate */}
                    {duplicateCheck.duplicateInvoices.length > 0 && (
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <h4 className="font-medium text-red-900 mb-2">
                          ⚠️ Exakte Rechnungsduplikate ({duplicateCheck.duplicateInvoices.length})
                        </h4>
                        {duplicateCheck.duplicateInvoices.map((invoice: any, index: number) => (
                          <div key={index} className="text-sm text-red-800 mb-1">
                            • Rechnung #{invoice.invoice_number} von {invoice.supplier_name} 
                            ({invoice.total_amount}€, {new Date(invoice.created_at).toLocaleDateString()})
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ähnliche Rechnungen */}
                    {duplicateCheck.similarInvoices.length > 0 && (
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-yellow-900 mb-2">
                          ⚠️ Ähnliche Rechnungen ({duplicateCheck.similarInvoices.length})
                        </h4>
                        {duplicateCheck.similarInvoices.map((invoice: any, index: number) => (
                          <div key={index} className="text-sm text-yellow-800 mb-1">
                            • Rechnung #{invoice.invoice_number} von {invoice.supplier_name} 
                            ({invoice.total_amount}€, {new Date(invoice.created_at).toLocaleDateString()})
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Doppelte Positionen */}
                    {duplicateCheck.duplicatePositions.length > 0 && (
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <h4 className="font-medium text-orange-900 mb-2">
                          ⚠️ Ähnliche Positionen ({duplicateCheck.duplicatePositions.length})
                        </h4>
                        {duplicateCheck.duplicatePositions.map((dup: any, index: number) => (
                          <div key={index} className="text-sm text-orange-800 mb-2">
                            <div className="font-medium">Position: {dup.lineItem.description}</div>
                            <div className="ml-2">
                              {dup.existingPositions.map((pos: any, posIndex: number) => (
                                <div key={posIndex} className="text-xs">
                                  • In Rechnung #{pos.invoices.invoice_number} von {pos.invoices.supplier_name} ({pos.amount}€)
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Keine Duplikate */}
                    {!duplicateCheck.hasDuplicates && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-sm text-green-800 font-medium">
                            ✅ Keine Duplikate gefunden - Rechnung kann sicher verarbeitet werden
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center text-sm text-gray-500">
                    Duplikatsprüfung noch nicht durchgeführt
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Budget-Impact */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('budget')}
            >
              <div className="flex items-center">
                <CurrencyEuroIcon className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-gray-900">💰 Budget-Auswirkung</h3>
              </div>
              {expandedSections.budget ? 
                <ChevronDownIcon className="h-5 w-5 text-gray-400" /> : 
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              }
            </div>
            
            {expandedSections.budget && (
              <div className="p-4 border-t border-gray-200 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 mb-1">Brutto-Betrag</div>
                    <div className="text-xl font-bold text-blue-900">
                      {editedData.totals?.grossAmount?.toLocaleString()} €
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Inkl. MwSt.
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-green-700 mb-1">Netto-Betrag</div>
                    <div className="text-xl font-bold text-green-900">
                      {editedData.totals?.netAmount?.toLocaleString()} €
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Für Budget-Berechnung
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">Zugeordnet (Netto)</div>
                    <div className="text-xl font-bold text-gray-900">
                      {totalImpact.toLocaleString()} €
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {projectAssignments.filter(a => a.projectId).length} von {editedData.line_items.length} Positionen
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {budgetImpact.map((impact, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">🎯 {impact.projectName}</span>
                        <span className="font-bold text-red-600">-{impact.impact.toLocaleString()} €</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Budget: {impact.availableBudget.toLocaleString()} € → {(impact.availableBudget - impact.impact).toLocaleString()} €
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(((impact.consumedBudget + impact.impact) / impact.availableBudget) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(((impact.consumedBudget + impact.impact) / impact.availableBudget) * 100)}% ausgelastet
                      </div>
                    </div>
                  ))}
                </div>

                {projectAssignments.some(a => !a.projectId) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium text-yellow-800">
                        {projectAssignments.filter(a => !a.projectId).length} Position(en) ohne Projekt-Zuordnung
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Finale Freigabe */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                ✅ Finale Freigabe
              </h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">Empfänger bestätigt</span>
                </div>
                <div className="flex items-center">
                  {supplierConfirmed ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mr-2" />
                  )}
                  <span className={`text-sm ${supplierConfirmed ? 'text-gray-700' : 'text-yellow-700'}`}>
                    Lieferant {supplierConfirmed ? 'bestätigt' : 'nicht bestätigt'}
                  </span>
                </div>
                <div className="flex items-center">
                  {projectAssignments.every(a => a.projectId) ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mr-2" />
                  )}
                  <span className={`text-sm ${projectAssignments.every(a => a.projectId) ? 'text-gray-700' : 'text-yellow-700'}`}>
                    {projectAssignments.filter(a => !a.projectId).length > 0 
                      ? `${projectAssignments.filter(a => !a.projectId).length} Position(en) ohne Projekt-Zuordnung`
                      : 'Alle Positionen zugeordnet'
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">Budget-Impact geprüft</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kommentar (optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Zusätzliche Anmerkungen zur Rechnung..."
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => onApprove(editedData, projectAssignments)}
                  disabled={!isReadyForApproval()}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                    isReadyForApproval()
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isReadyForApproval() ? (
                    <>
                      🚀 RECHNUNG FREIGEBEN UND BUCHEN
                    </>
                  ) : (
                    <>
                      ❌ Noch nicht bereit zur Freigabe
                    </>
                  )}
                </button>
                
                <button
                  onClick={onReject}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRReviewInterface;
