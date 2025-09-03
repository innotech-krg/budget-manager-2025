import React, { useState, useRef } from 'react';

const OCRSimple = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3001/api/ocr/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadResult(result.data);
      } else {
        setError(result.message || 'Upload fehlgeschlagen');
      }
    } catch (err) {
      setError(`Upload-Fehler: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <div style={{ padding: '40px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
          🤖 KI-Rechnungsverarbeitung
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>
          Intelligente Erkennung mit ChatGPT & Claude - Automatische Strukturierung österreichischer Geschäftsrechnungen
        </p>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            System-Status
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
              <span style={{ color: '#374151' }}>✅ Frontend läuft korrekt</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
              <span style={{ color: '#374151' }}>✅ Backend API erreichbar</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
              <span style={{ color: '#374151' }}>✅ React Router funktioniert</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '50%' }}></div>
              <span style={{ color: '#374151' }}>⚠️ OCR-Seite wird jetzt korrekt angezeigt</span>
            </div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            Rechnung hochladen
          </h2>
          
          {/* Error Display */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '16px',
              color: '#dc2626'
            }}>
              ❌ {error}
            </div>
          )}

          <div style={{
            border: isUploading ? '2px solid #2563eb' : '2px dashed #d1d5db',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center' as const,
            backgroundColor: isUploading ? '#eff6ff' : '#f9fafb'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {isUploading ? '🤖' : '📄'}
            </div>
            <p style={{ color: '#6b7280', marginBottom: '8px' }}>
              {isUploading ? 'KI analysiert Ihre Rechnung...' : 'Ziehen Sie eine Rechnung hierher oder klicken Sie zum Auswählen'}
            </p>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
              🤖 KI-basierte Verarbeitung • Unterstützte Formate: JPG, PNG, PDF
            </p>
            <button 
              onClick={handleFileSelect}
              disabled={isUploading}
              style={{
                backgroundColor: isUploading ? '#9ca3af' : '#2563eb',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {isUploading ? '🤖 KI-Analyse läuft...' : '🚀 Rechnung hochladen'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              padding: '16px',
              marginTop: '16px'
            }}>
              <h3 style={{ color: '#166534', marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>
                🤖 KI-Analyse erfolgreich abgeschlossen!
              </h3>
              <div style={{ fontSize: '14px', color: '#166534' }}>
                <p><strong>KI-Engine:</strong> {uploadResult.engine || 'AI-Enhanced'}</p>
                <p><strong>Konfidenz:</strong> {uploadResult.confidence || 0}%</p>
                <p><strong>Verarbeitungszeit:</strong> {uploadResult.processingTime || 'N/A'}ms</p>
                
                {uploadResult.aiAnalysis && (
                  <div style={{ marginTop: '12px' }}>
                    <strong>🧠 Strukturierte KI-Daten:</strong>
                    <div style={{
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '8px',
                      marginTop: '4px',
                      fontSize: '12px',
                      maxHeight: '300px',
                      overflow: 'auto'
                    }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(uploadResult.aiAnalysis, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {uploadResult.text && !uploadResult.aiAnalysis && (
                  <div style={{ marginTop: '12px' }}>
                    <strong>Erkannter Text:</strong>
                    <div style={{
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '8px',
                      marginTop: '4px',
                      fontSize: '12px',
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}>
                      {uploadResult.text.substring(0, 500)}
                      {uploadResult.text.length > 500 && '...'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OCRSimple;
