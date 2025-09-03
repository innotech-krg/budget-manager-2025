import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  EyeIcon,
  InformationCircleIcon,
  ClockIcon,
  UserIcon,
  HashtagIcon
} from '@heroicons/react/24/outline';

interface DocumentMetadata {
  id: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  version: number;
  uploadDate: string;
  uploadedBy: string;
  accessCount: number;
  lastAccessed?: string;
  retentionUntil: string;
  fileHash: string;
}

interface DocumentViewerProps {
  documentId?: string;
  ocrProcessingId?: string;
  invoiceId?: string;
  showUpload?: boolean;
  onDocumentUploaded?: (documentId: string) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  ocrProcessingId,
  invoiceId,
  showUpload = false,
  onDocumentUploaded
}) => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Dokumente laden
  useEffect(() => {
    if (documentId) {
      loadSingleDocument(documentId);
    } else if (ocrProcessingId) {
      loadDocumentsByOcr(ocrProcessingId);
    } else if (invoiceId) {
      loadDocumentsByInvoice(invoiceId);
    }
  }, [documentId, ocrProcessingId, invoiceId]);

  const loadSingleDocument = async (docId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/documents/${docId}/metadata`);
      if (!response.ok) {
        throw new Error('Dokument nicht gefunden');
      }

      const result = await response.json();
      if (result.success) {
        setDocuments([result.data]);
        setSelectedDocument(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocumentsByOcr = async (ocrId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/documents/by-ocr/${ocrId}`);
      if (!response.ok) {
        throw new Error('Dokumente nicht gefunden');
      }

      const result = await response.json();
      if (result.success) {
        setDocuments(result.data.documents);
        if (result.data.documents.length > 0) {
          setSelectedDocument(result.data.documents[0]);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocumentsByInvoice = async (invId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/documents/by-invoice/${invId}`);
      if (!response.ok) {
        throw new Error('Dokumente nicht gefunden');
      }

      const result = await response.json();
      if (result.success) {
        setDocuments(result.data.documents);
        if (result.data.documents.length > 0) {
          setSelectedDocument(result.data.documents[0]);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (document: DocumentMetadata) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`);
      if (!response.ok) {
        throw new Error('Download fehlgeschlagen');
      }

      // Erstelle Download-Link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.originalFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err: any) {
      setError(`Download-Fehler: ${err.message}`);
    }
  };

  const handleViewDocument = async (document: DocumentMetadata) => {
    try {
      // Generiere sichere URL für Anzeige
      const response = await fetch(`/api/documents/${document.id}/url?expiresIn=3600`);
      if (!response.ok) {
        throw new Error('URL-Generierung fehlgeschlagen');
      }

      const result = await response.json();
      if (result.success) {
        // Öffne in neuem Tab
        window.open(result.data.downloadUrl, '_blank');
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(`Anzeige-Fehler: ${err.message}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('document', file);
      if (ocrProcessingId) formData.append('ocrProcessingId', ocrProcessingId);
      if (invoiceId) formData.append('invoiceId', invoiceId);
      formData.append('uploadedBy', 'user'); // TODO: Echte User-ID

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload fehlgeschlagen');
      }

      const result = await response.json();
      if (result.success) {
        // Dokumente neu laden
        if (ocrProcessingId) {
          await loadDocumentsByOcr(ocrProcessingId);
        } else if (invoiceId) {
          await loadDocumentsByInvoice(invoiceId);
        }

        if (onDocumentUploaded) {
          onDocumentUploaded(result.data.documentId);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(`Upload-Fehler: ${err.message}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Lade Dokumente...</span>
        </div>
      </div>
    );
  }

  if (error && documents.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center text-red-600">
          <InformationCircleIcon className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DocumentTextIcon className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              📎 Original-Rechnung
            </h3>
          </div>
          {showUpload && (
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.tiff"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <button
                disabled={isUploading}
                className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : '📤 Hochladen'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Noch keine Dokumente hochgeladen</p>
            {showUpload && (
              <p className="text-sm mt-1">Verwenden Sie den Upload-Button oben</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                {/* Dokument-Info */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <DocumentTextIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="font-medium text-gray-900">
                        {doc.originalFilename}
                      </span>
                      {doc.version > 1 && (
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          v{doc.version}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-500 flex items-center space-x-4">
                      <span>📊 {formatFileSize(doc.fileSize)}</span>
                      <span>📅 {formatDate(doc.uploadDate)}</span>
                      <span>👁️ {doc.accessCount}x aufgerufen</span>
                    </div>
                  </div>

                  {/* Aktionen */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDocument(doc)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                      title="Dokument anzeigen"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                      title="Dokument herunterladen"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                      title="Details anzeigen"
                    >
                      <InformationCircleIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Erweiterte Details */}
                {showDetails && selectedDocument?.id === doc.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">Hochgeladen von:</span>
                          <span className="ml-2 font-medium">{doc.uploadedBy}</span>
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">Aufbewahrung bis:</span>
                          <span className="ml-2 font-medium">
                            {new Date(doc.retentionUntil).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                        {doc.lastAccessed && (
                          <div className="flex items-center">
                            <EyeIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">Letzter Zugriff:</span>
                            <span className="ml-2 font-medium">
                              {formatDate(doc.lastAccessed)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <HashtagIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">Hash:</span>
                          <span className="ml-2 font-mono text-xs">
                            {doc.fileHash.substring(0, 16)}...
                          </span>
                        </div>
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">MIME-Type:</span>
                          <span className="ml-2 font-medium">{doc.mimeType}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center text-green-600 text-sm">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    <span>Original sicher gespeichert (10 Jahre)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fehler-Anzeige */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center text-red-700">
              <InformationCircleIcon className="w-5 h-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
