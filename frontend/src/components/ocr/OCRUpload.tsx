// =====================================================
// OCR Upload Component - Drag & Drop Interface
// Story 2.1: Dual OCR Engine Integration
// =====================================================

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface OCRResult {
  ocrProcessingId: string;
  selectedEngine: 'tesseract' | 'cloud-vision' | 'hybrid';
  confidence: number;
  text: string;
  processingTime: number;
  boundingBoxes: any[];
  engines: {
    tesseract?: {
      confidence: number;
      processingTime: number;
    };
    cloudVision?: {
      confidence: number;
      processingTime: number;
    };
  };
  aiAnalysis?: {
    supplier: {
      name: string;
      address?: string;
      uid?: string;
      contact?: string;
    };
    recipient: {
      name: string;
      address?: string;
      uid?: string;
    };
    invoice: {
      number?: string;
      date?: string;
      dueDate?: string;
      project?: string;
    };
    positions: Array<{
      description: string;
      quantity: number;
      unit?: string;
      unitPrice: number;
      totalPrice: number;
      vatRate?: number;
    }>;
    totals: {
      netAmount: number;
      vatAmount: number;
      grossAmount: number;
      currency: string;
    };
    confidence: number;
    extractedFields: string[];
  };
}

interface OCRUploadProps {
  onResult?: (result: OCRResult) => void;
  onError?: (error: string) => void;
  className?: string;
}

const OCRUpload: React.FC<OCRUploadProps> = ({ 
  onResult, 
  onError, 
  className = '' 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editedText, setEditedText] = useState('');

  // =====================================================
  // FILE UPLOAD & PROCESSING
  // =====================================================

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setUploadProgress(0);

    try {
      console.log(`📤 Starte OCR-Upload: ${file.name}`, {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Debug FormData
      console.log('📋 FormData Inhalt:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      console.log('🌐 Sende Request an /api/ocr/upload...');
      
      const response = await fetch('http://localhost:3001/api/ocr/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('📡 Response erhalten:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();
      console.log('📄 Response Data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'OCR-Verarbeitung fehlgeschlagen');
      }

      if (data.success) {
        const ocrResult = data.data as OCRResult;
        setResult(ocrResult);
        onResult?.(ocrResult);
        
        toast.success(
          `OCR erfolgreich! ${ocrResult.selectedEngine} (${ocrResult.confidence}% Konfidenz)`,
          { duration: 4000 }
        );
        
        console.log('✅ OCR-Verarbeitung abgeschlossen:', ocrResult);
      } else {
        throw new Error(data.message || 'Unbekannter Fehler');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(errorMessage);
      onError?.(errorMessage);
      
      toast.error(`OCR-Fehler: ${errorMessage}`, { duration: 6000 });
      console.error('❌ OCR-Fehler:', err);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  }, [onResult, onError]);

  // =====================================================
  // DROPZONE CONFIGURATION
  // =====================================================

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, [processFile]);

  // =====================================================
  // BUTTON HANDLERS
  // =====================================================

  const handleSupplierRecognition = useCallback(() => {
    if (!result) return;
    
    console.log('🏢 Starte Lieferanten-Erkennung für OCR-ID:', result.ocrProcessingId);
    toast.success('Lieferanten-Erkennung wird gestartet...', { duration: 3000 });
    
    // TODO: Navigate to supplier recognition page or show supplier modal
    // For now, just show a placeholder
    alert(`Lieferanten-Erkennung für OCR-ID: ${result.ocrProcessingId}\n\nDiese Funktion wird in der nächsten Version implementiert.`);
  }, [result]);

  const handleTextCorrection = useCallback(() => {
    if (!result) return;
    
    setEditedText(result.text);
    setShowTextEditor(true);
    console.log('✏️ Text-Editor geöffnet für OCR-ID:', result.ocrProcessingId);
  }, [result]);

  const handleSaveText = useCallback(async () => {
    if (!result || !editedText.trim()) return;
    
    try {
      console.log('💾 Speichere korrigierten Text für OCR-ID:', result.ocrProcessingId);
      
      // Update the result with corrected text
      const updatedResult = {
        ...result,
        text: editedText.trim()
      };
      
      setResult(updatedResult);
      setShowTextEditor(false);
      
      toast.success('Text erfolgreich korrigiert!', { duration: 3000 });
      
      // TODO: Send corrected text to backend API
      console.log('📤 Korrigierter Text:', editedText.trim());
      
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Textes:', error);
      toast.error('Fehler beim Speichern des Textes', { duration: 4000 });
    }
  }, [result, editedText]);

  const handleCancelEdit = useCallback(() => {
    setShowTextEditor(false);
    setEditedText('');
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isProcessing
  });

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  const getEngineIcon = (engine: string) => {
    switch (engine) {
      case 'tesseract':
        return '🔍';
      case 'cloud-vision':
        return '☁️';
      case 'hybrid':
        return '🔄';
      default:
        return '📄';
    }
  };

  const getEngineLabel = (engine: string) => {
    switch (engine) {
      case 'tesseract':
        return 'Tesseract.js (Lokal)';
      case 'cloud-vision':
        return 'Google Cloud Vision';
      case 'hybrid':
        return 'Hybrid (Beide Engines)';
      default:
        return engine;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive && !isDragReject 
            ? 'border-blue-400 bg-blue-50' 
            : isDragReject 
            ? 'border-red-400 bg-red-50'
            : isProcessing
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className="space-y-4">
            <ArrowPathIcon className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                OCR-Verarbeitung läuft...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                {uploadProgress < 90 ? 'Datei wird hochgeladen...' : 'OCR-Engines arbeiten...'}
              </p>
            </div>
          </div>
        ) : isDragActive ? (
          <div className="space-y-2">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-blue-500" />
            <p className="text-lg font-medium text-blue-600">
              {isDragReject ? 'Dateityp nicht unterstützt' : 'Datei hier ablegen...'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                Rechnung für OCR-Verarbeitung hochladen
              </p>
              <p className="text-sm text-gray-500">
                Ziehen Sie eine Datei hierher oder klicken Sie zum Auswählen
              </p>
              <p className="text-xs text-gray-400">
                Unterstützt: JPG, PNG, PDF (max. 10MB)
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
              Datei auswählen
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                OCR-Verarbeitung fehlgeschlagen
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="rounded-md bg-green-50 p-6 border border-green-200">
          <div className="flex items-start">
            <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-green-800 mb-4">
                OCR-Verarbeitung erfolgreich abgeschlossen
              </h3>
              
              {/* Engine Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{getEngineIcon(result.selectedEngine)}</span>
                    <span className="text-sm font-medium text-gray-900">
                      Verwendete Engine
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {getEngineLabel(result.selectedEngine)}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🎯</span>
                    <span className="text-sm font-medium text-gray-900">
                      Konfidenz
                    </span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${getConfidenceColor(result.confidence)}`}>
                    {result.confidence}%
                  </span>
                </div>

                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">⏱️</span>
                    <span className="text-sm font-medium text-gray-900">
                      Verarbeitungszeit
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {(result.processingTime / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>

              {/* Engine Details */}
              {(result.engines.tesseract || result.engines.cloudVision) && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Engine-Details:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.engines.tesseract && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <span>🔍</span>
                          <span className="text-sm font-medium">Tesseract.js</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Konfidenz: {result.engines.tesseract.confidence}% | 
                          Zeit: {(result.engines.tesseract.processingTime / 1000).toFixed(1)}s
                        </p>
                      </div>
                    )}
                    {result.engines.cloudVision && (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <span>☁️</span>
                          <span className="text-sm font-medium">Cloud Vision</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Konfidenz: {result.engines.cloudVision.confidence}% | 
                          Zeit: {(result.engines.cloudVision.processingTime / 1000).toFixed(1)}s
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* KI-Analyseergebnisse */}
              {result.aiAnalysis && (
                <div className="bg-white rounded-lg p-4 border border-green-200 mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <span className="text-2xl">🧠</span>
                    <span>KI-Strukturanalyse ({result.aiAnalysis.confidence}% Konfidenz)</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Lieferant */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <h5 className="font-medium text-blue-900 mb-2">📤 Lieferant</h5>
                      <div className="text-sm text-blue-800">
                        <div className="font-medium">{result.aiAnalysis.supplier.name}</div>
                        {result.aiAnalysis.supplier.address && (
                          <div className="text-xs mt-1">{result.aiAnalysis.supplier.address}</div>
                        )}
                        {result.aiAnalysis.supplier.uid && (
                          <div className="text-xs mt-1">UID: {result.aiAnalysis.supplier.uid}</div>
                        )}
                      </div>
                    </div>

                    {/* Empfänger */}
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <h5 className="font-medium text-green-900 mb-2">📥 Empfänger</h5>
                      <div className="text-sm text-green-800">
                        <div className="font-medium">{result.aiAnalysis.recipient.name}</div>
                        {result.aiAnalysis.recipient.address && (
                          <div className="text-xs mt-1">{result.aiAnalysis.recipient.address}</div>
                        )}
                        {result.aiAnalysis.recipient.uid && (
                          <div className="text-xs mt-1">UID: {result.aiAnalysis.recipient.uid}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rechnungspositionen */}
                  {result.aiAnalysis.positions && result.aiAnalysis.positions.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 mb-4">
                      <h5 className="font-medium text-purple-900 mb-2">📋 Rechnungspositionen ({result.aiAnalysis.positions.length})</h5>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {result.aiAnalysis.positions.map((position, index) => (
                          <div key={index} className="bg-white rounded p-2 border border-purple-100">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-purple-900 text-sm">{position.description}</div>
                                <div className="text-xs text-purple-700">
                                  {position.quantity} {position.unit || 'Stk'} × {position.unitPrice.toFixed(2)} EUR
                                </div>
                              </div>
                              <div className="font-bold text-purple-900 text-sm">
                                {position.totalPrice.toFixed(2)} EUR
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summen */}
                  {result.aiAnalysis.totals && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Netto:</span>
                          <div className="font-bold">{result.aiAnalysis.totals.netAmount.toFixed(2)} {result.aiAnalysis.totals.currency}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">USt:</span>
                          <div className="font-bold">{result.aiAnalysis.totals.vatAmount.toFixed(2)} {result.aiAnalysis.totals.currency}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Brutto:</span>
                          <div className="font-bold text-lg">{result.aiAnalysis.totals.grossAmount.toFixed(2)} {result.aiAnalysis.totals.currency}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text Preview */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    Erkannter Text (Vorschau)
                  </h4>
                  <button
                    type="button"
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-500"
                  >
                    <EyeIcon className="h-3 w-3 mr-1" />
                    Vollständig anzeigen
                  </button>
                </div>
                <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                    {result.text.length > 500 
                      ? `${result.text.substring(0, 500)}...` 
                      : result.text
                    }
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleSupplierRecognition}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Weiter zu Lieferanten-Erkennung
                </button>
                <button
                  type="button"
                  onClick={handleTextCorrection}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Text korrigieren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text Editor Modal */}
      {showTextEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Text korrigieren
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Bearbeiten Sie den erkannten Text und speichern Sie die Änderungen.
              </p>
            </div>
            
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Erkannter Text hier bearbeiten..."
              />
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveText}
                disabled={!editedText.trim()}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRUpload;
