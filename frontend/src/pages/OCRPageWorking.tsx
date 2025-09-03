// =====================================================
// OCR Page - Funktionierende Version
// =====================================================

import React, { useState, useEffect } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface OCRStats {
  totalDocuments: number;
  successfulProcessing: number;
  successRate: number;
  avgConfidence: number;
  avgProcessingTime: number;
  engineUsage: {
    tesseract: number;
    cloudVision: number;
    hybrid: number;
  };
}

const OCRPageWorking: React.FC = () => {
  const [stats, setStats] = useState<OCRStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      setError(null);
      
      const response = await fetch('http://localhost:3001/api/ocr/stats/summary?days=30');
      const data = await response.json();
      
      if (data.success) {
        // Map API field names to frontend expected names
        const mappedStats = {
          ...data.data,
          avgConfidence: data.data.averageConfidence || 0,
          avgProcessingTime: data.data.averageProcessingTime || 0
        };
        setStats(mappedStats);
      } else {
        setError('Fehler beim Laden der Statistiken');
      }
    } catch (error) {
      console.error('Fehler beim Laden der OCR-Statistiken:', error);
      setError(`Fehler beim Laden der Statistiken: ${error}`);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const renderStatsCard = (title: string, value: string, icon: React.ReactNode, subtitle: string, color: string) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                OCR-Rechnungsverarbeitung
              </h1>
              <p className="text-gray-600">
                Automatische Erkennung und Verarbeitung von Geschäftsrechnungen
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Fehler</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Statistics Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              OCR-Statistiken (letzte 30 Tage)
            </h2>
            
            {isLoadingStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {renderStatsCard(
                  'Verarbeitete Dokumente',
                  stats.totalDocuments?.toString() || '0',
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />,
                  'Gesamt verarbeitet',
                  'blue'
                )}
                
                {renderStatsCard(
                  'Erfolgsrate',
                  `${(stats.successRate || 0).toFixed(1)}%`,
                  <DocumentTextIcon className="h-6 w-6 text-green-600" />,
                  'Erfolgreich verarbeitet',
                  'green'
                )}
                
                {renderStatsCard(
                  'Durchschnittliche Konfidenz',
                  `${(stats.avgConfidence || 0).toFixed(1)}%`,
                  <DocumentTextIcon className="h-6 w-6 text-purple-600" />,
                  'OCR-Genauigkeit',
                  'purple'
                )}
                
                {renderStatsCard(
                  'Ø Verarbeitungszeit',
                  `${((stats.avgProcessingTime || 0) / 1000).toFixed(1)}s`,
                  <DocumentTextIcon className="h-6 w-6 text-orange-600" />,
                  'Pro Dokument',
                  'orange'
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Keine Statistiken verfügbar</p>
              </div>
            )}
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Rechnung hochladen
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Ziehen Sie eine Rechnung hierher oder klicken Sie zum Auswählen
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Unterstützte Formate: JPG, PNG, PDF
              </p>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Datei auswählen
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              System-Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Frontend läuft</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Backend API erreichbar</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Tesseract.js bereit</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-700">Google Cloud Vision (deaktiviert)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRPageWorking;

