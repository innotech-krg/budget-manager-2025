import React, { useState, useRef, useCallback } from 'react';
import { apiService } from '../services/apiService';
import OCRReviewInterface from '../components/ocr/OCRReviewInterface';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CpuChipIcon,
  EyeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

interface UploadResult {
  success: boolean;
  data?: {
    ocrProcessingId: string;
    engine: string;
    confidence: number;
    processingTime: number;
    text?: string;
    aiAnalysis?: any;
    detectedSupplier?: string;
  };
  message?: string;
  error?: string;
}

const OCRPage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validierung
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    
    if (file.size > maxSize) {
      setError('Datei zu groß. Maximum: 10MB');
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      setError('Dateityp nicht unterstützt. Erlaubt: JPG, PNG, PDF');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const result = await apiService.uploadOCRFile(file);
      
      if (result.success) {
        setUploadResult(result);
      } else {
        setError(result.error || result.message || 'Upload fehlgeschlagen');
      }
    } catch (err) {
      setError(`Unerwarteter Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApproveInvoice = async (approvedData: any, projectAssignments: any[]) => {
    try {
      console.log('Rechnung freigegeben:', { approvedData, projectAssignments });
      
      // Erstelle eine Review-Session und gebe sie frei
      console.log('Upload Result Structure:', uploadResult);
      const ocrProcessingId = uploadResult?.data?.ocrProcessingId || uploadResult?.data?.data?.ocrProcessingId;
      console.log('OCR Processing ID:', ocrProcessingId);
      
      if (!ocrProcessingId) {
        console.error('Upload Result:', JSON.stringify(uploadResult, null, 2));
        throw new Error('OCR Processing ID nicht gefunden');
      }
      
      const sessionResponse = await apiService.createReviewSession(ocrProcessingId, approvedData);
      
      if (!sessionResponse.success) {
        throw new Error(sessionResponse.error || 'Fehler beim Erstellen der Review-Session');
      }
      
      // Rechnung freigeben
      const sessionId = sessionResponse.data.reviewSessionId || sessionResponse.data.sessionId;
      console.log('Session ID für Freigabe:', sessionId);
      
      const approvalResponse = await apiService.approveInvoice(
        sessionId,
        approvedData,
        projectAssignments
      );
      
      if (!approvalResponse.success) {
        throw new Error(approvalResponse.error || 'Fehler bei der Freigabe');
      }
      
      // Erfolgs-Feedback anzeigen
      alert('✅ Rechnung erfolgreich freigegeben und Budget aktualisiert!');
      
      // Zurück zum Upload-Interface
      resetUpload();
    } catch (err) {
      console.error('Fehler bei der Freigabe:', err);
      setError(`Fehler bei der Freigabe: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    }
  };

  const handleRejectInvoice = () => {
    resetUpload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <CpuChipIcon className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              KI-Rechnungsverarbeitung
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Intelligente Erkennung österreichischer Geschäftsrechnungen mit ChatGPT & Claude. 
            Automatische Strukturierung und Projekt-Zuordnung.
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
          <div className="p-8">
            {!uploadResult && (
              <div
                className={`
                  relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
                  ${dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : isUploading 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {/* Upload Icon & Animation */}
                <div className="mb-6">
                  {isUploading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent"></div>
                      <CpuChipIcon className="h-8 w-8 text-green-600 ml-4 animate-pulse" />
                    </div>
                  ) : (
                    <CloudArrowUpIcon className={`h-16 w-16 mx-auto ${dragActive ? 'text-blue-600' : 'text-gray-400'} transition-colors`} />
                  )}
                </div>

                {/* Upload Text */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {isUploading 
                      ? '🤖 KI analysiert Ihre Rechnung...' 
                      : dragActive 
                        ? 'Datei hier ablegen' 
                        : 'Rechnung hochladen'
                    }
                  </h3>
                  <p className="text-gray-600">
                    {isUploading 
                      ? 'Bitte warten Sie während die KI Ihre Rechnung verarbeitet'
                      : 'Ziehen Sie eine Datei hierher oder klicken Sie zum Auswählen'
                    }
                  </p>
                </div>

                {/* File Info */}
                <div className="mb-6">
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      PDF, JPG, PNG
                    </div>
                    <div className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Max. 10MB
                    </div>
                    <div className="flex items-center">
                      <CpuChipIcon className="h-4 w-4 mr-1" />
                      KI-basiert
                    </div>
                  </div>
                </div>

                {/* Upload Button */}
                <button
                  onClick={handleFileSelect}
                  disabled={isUploading}
                  className={`
                    inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg
                    transition-all duration-200 transform hover:scale-105
                    ${isUploading
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                    }
                  `}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent mr-2"></div>
                      KI-Analyse läuft...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                      Datei auswählen
                    </>
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-800 font-medium">Fehler</p>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={resetUpload}
                  className="mt-2 text-red-600 hover:text-red-800 font-medium"
                >
                  Erneut versuchen
                </button>
              </div>
            )}

            {/* Success Result */}
            {uploadResult?.success && (
              <div className="space-y-6">
                {/* Success Header */}
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">
                        🤖 KI-Analyse erfolgreich!
                      </h3>
                      <p className="text-green-700">
                        Ihre Rechnung wurde intelligent verarbeitet und strukturiert.
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={resetUpload}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Neue Rechnung
                    </button>
                  </div>
                </div>

                {/* Processing Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <CpuChipIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-900">KI-Engine</span>
                    </div>
                    <p className="text-lg font-bold text-blue-800 mt-1">
                      {uploadResult.data?.engine || 'AI-Enhanced'}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <EyeIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-900">Konfidenz</span>
                    </div>
                    <p className="text-lg font-bold text-green-800 mt-1">
                      {uploadResult.data?.confidence || 0}%
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center">
                      <DocumentDuplicateIcon className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-purple-900">Verarbeitung</span>
                    </div>
                    <p className="text-lg font-bold text-purple-800 mt-1">
                      {uploadResult.data?.processingTime || 'N/A'}ms
                    </p>
                  </div>
                </div>

                {/* Detected Supplier */}
                {uploadResult.data?.detectedSupplier && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2">🏢 Erkannter Lieferant</h4>
                    <p className="text-yellow-800 text-lg font-medium">
                      {uploadResult.data.detectedSupplier}
                    </p>
                  </div>
                )}

                {/* AI Analysis Results */}
                {uploadResult.data?.data?.aiAnalysis && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <CpuChipIcon className="h-5 w-5 mr-2" />
                      🧠 Strukturierte KI-Daten
                    </h4>
                    <div className="bg-white p-4 rounded border border-gray-300 max-h-96 overflow-auto">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(uploadResult.data.data.aiAnalysis, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Raw Text Fallback */}
                {uploadResult.data?.text && !uploadResult.data?.data?.aiAnalysis && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">📄 Erkannter Text</h4>
                    <div className="bg-white p-4 rounded border border-gray-300 max-h-64 overflow-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {uploadResult.data.text.substring(0, 1000)}
                        {uploadResult.data.text.length > 1000 && '...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Features Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <CpuChipIcon className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">KI-basierte Erkennung</h3>
            <p className="text-gray-600 text-sm">
              Modernste KI-Technologie für präzise Texterkennung und Datenextraktion aus Geschäftsrechnungen.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <DocumentTextIcon className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Strukturierte Daten</h3>
            <p className="text-gray-600 text-sm">
              Automatische Extraktion von Lieferanten, Rechnungspositionen, Beträgen und österreichischen Geschäftsdaten.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <EyeIcon className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Intelligente Zuordnung</h3>
            <p className="text-gray-600 text-sm">
              Automatische Projekt-Zuordnung und Lieferanten-Erkennung mit Lern-Algorithmus für bessere Genauigkeit.
            </p>
          </div>
        </div>
      </div>

      {/* Debug: Zeige Upload-Ergebnis */}
      {uploadResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3>Debug Info:</h3>
          <p>Success: {uploadResult.success ? 'Ja' : 'Nein'}</p>
          <p>Hat data: {uploadResult.data ? 'Ja' : 'Nein'}</p>
          {uploadResult.data && (
            <>
              <p>Data keys: {Object.keys(uploadResult.data).join(', ')}</p>
              <p>Hat aiAnalysis: {uploadResult.data.data?.aiAnalysis ? 'Ja' : 'Nein'}</p>
              {uploadResult.data.data?.aiAnalysis && (
                <p>Lieferant: {uploadResult.data.data.aiAnalysis.supplier?.name}</p>
              )}
            </>
          )}
          <details className="mt-2">
            <summary>Vollständige Daten</summary>
            <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto max-h-40">
              {JSON.stringify(uploadResult, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* OCR Review Interface - wird automatisch nach erfolgreichem Upload angezeigt */}
      {uploadResult?.success && uploadResult?.data?.data?.aiAnalysis && (() => {
        // Adapter: Backend-Datenstruktur zu OCRReviewInterface-Format
        const backendData = uploadResult.data.data.aiAnalysis;
        const adaptedData = {
          supplier: {
            name: backendData.supplier?.name || '',
            address: backendData.supplier?.address || '',
            uid_number: backendData.supplier?.uid || '',
            email: backendData.supplier?.contact || '',
            phone: ''
          },
          invoice: {
            number: backendData.invoice?.number || '',
            date: backendData.invoice?.date || '',
            due_date: backendData.invoice?.dueDate || '',
            total_amount: backendData.totals?.grossAmount || 0,
            currency: backendData.invoice?.currency || 'EUR',
            tax_amount: backendData.totals?.vatAmount || 0,
            net_amount: backendData.totals?.netAmount || 0
          },
          totals: {
            netAmount: backendData.totals?.netAmount || 0,
            vatAmount: backendData.totals?.vatAmount || 0,
            grossAmount: backendData.totals?.grossAmount || 0
          },
          line_items: (backendData.positions || []).map((pos: any) => ({
            description: pos.description || '',
            quantity: pos.quantity || 1,
            unit_price: pos.unitPrice || 0,
            total_amount: pos.totalPrice || 0,
            tax_rate: pos.vatRate || 0,
            isNetAmount: pos.isNetAmount !== false
          })),
          confidence_score: backendData.confidence || 0.5,
          raw_text: backendData.raw_text || ''
        };
        
        return (
          <div className="fixed inset-0 bg-white z-50 overflow-auto">
            <OCRReviewInterface
              extractedData={adaptedData}
              onApprove={handleApproveInvoice}
              onReject={handleRejectInvoice}
            />
          </div>
        );
      })()}
    </div>
  );
};

export default OCRPage;