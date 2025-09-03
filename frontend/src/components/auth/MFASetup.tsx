// =====================================================
// Budget Manager 2025 - MFA Setup Component
// Epic 8 - Story 8.3: Login-Overlay Frontend
// =====================================================

import React, { useState, useEffect } from 'react';
import { Shield, Copy, Check, AlertCircle, Loader2, QrCode, Key } from 'lucide-react';
import { useMFA } from '../../stores/authStore';

// Types
interface MFASetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface MFASetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * MFASetup - Component for setting up Multi-Factor Authentication
 * Features: QR code display, manual secret entry, backup codes, verification
 */
export const MFASetup: React.FC<MFASetupProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================

  const { setupMFA, enableMFA } = useMFA();

  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [mfaData, setMfaData] = useState<MFASetupData | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // =====================================================
  // EFFECTS
  // =====================================================

  // Initialize MFA setup when modal opens
  useEffect(() => {
    if (isOpen && step === 'setup') {
      initializeMFASetup();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('setup');
      setMfaData(null);
      setVerificationToken('');
      setError(null);
      setCopiedSecret(false);
      setCopiedBackupCodes(false);
    }
  }, [isOpen]);

  // =====================================================
  // MFA SETUP LOGIC
  // =====================================================

  const initializeMFASetup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await setupMFA();

      if (response.success && response.secret && response.qrCode) {
        setMfaData({
          secret: response.secret,
          qrCode: response.qrCode,
          backupCodes: response.backupCodes || []
        });
      } else {
        setError(response.error || 'MFA-Setup fehlgeschlagen');
      }

    } catch (error: any) {
      setError(error.message || 'MFA-Setup-Fehler');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!verificationToken.trim() || !mfaData?.secret) {
      setError('Verifizierungscode ist erforderlich');
      return;
    }

    if (!/^\d{6}$/.test(verificationToken.trim())) {
      setError('Verifizierungscode muss 6 Ziffern enthalten');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await enableMFA(verificationToken.trim(), mfaData.secret);

      if (success) {
        setStep('complete');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      }

    } catch (error: any) {
      setError(error.message || 'MFA-Verifizierung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  const copyToClipboard = async (text: string, type: 'secret' | 'backupCodes') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackupCodes(true);
        setTimeout(() => setCopiedBackupCodes(false), 2000);
      }

    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && step !== 'verify') {
      onClose();
    }
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const renderSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Zwei-Faktor-Authentifizierung einrichten
        </h3>
        <p className="text-gray-600">
          Erhöhen Sie die Sicherheit Ihres Kontos mit MFA
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">MFA wird eingerichtet...</span>
        </div>
      ) : mfaData ? (
        <div className="space-y-6">
          
          {/* QR Code */}
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
              <img 
                src={mfaData.qrCode} 
                alt="MFA QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Scannen Sie den QR-Code mit Ihrer Authenticator-App
            </p>
          </div>

          {/* Manual Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Oder geben Sie diesen Code manuell ein:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={mfaData.secret}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(mfaData.secret, 'secret')}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="In Zwischenablage kopieren"
              >
                {copiedSecret ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Backup Codes */}
          {mfaData.backupCodes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup-Codes (sicher aufbewahren):
              </label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Wichtig: Bewahren Sie diese Codes sicher auf!
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {mfaData.backupCodes.map((code, index) => (
                    <div key={index} className="bg-white px-2 py-1 rounded border">
                      {code}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => copyToClipboard(mfaData.backupCodes.join('\n'), 'backupCodes')}
                  className="mt-2 flex items-center gap-1 text-sm text-yellow-700 hover:text-yellow-800"
                >
                  {copiedBackupCodes ? (
                    <>
                      <Check className="w-3 h-3" />
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Alle Codes kopieren
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setStep('verify')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Weiter zur Verifizierung
          </button>
        </div>
      ) : null}
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          MFA verifizieren
        </h3>
        <p className="text-gray-600">
          Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein
        </p>
      </div>

      <div>
        <label htmlFor="verificationToken" className="block text-sm font-medium text-gray-700 mb-2">
          Verifizierungscode
        </label>
        <input
          type="text"
          id="verificationToken"
          value={verificationToken}
          onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          maxLength={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest"
          disabled={isLoading}
          autoComplete="one-time-code"
          autoFocus
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('setup')}
          disabled={isLoading}
          className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          Zurück
        </button>
        <button
          onClick={handleVerification}
          disabled={isLoading || verificationToken.length !== 6}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifizierung...
            </>
          ) : (
            'MFA aktivieren'
          )}
        </button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          MFA erfolgreich aktiviert!
        </h3>
        <p className="text-gray-600">
          Ihr Konto ist jetzt durch Zwei-Faktor-Authentifizierung geschützt.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          Bei zukünftigen Anmeldungen werden Sie nach Ihrem MFA-Code gefragt.
        </p>
      </div>
    </div>
  );

  // =====================================================
  // MAIN RENDER
  // =====================================================

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Close Button */}
        {step !== 'verify' && (
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Schließen"
          >
            ×
          </button>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Content */}
        {step === 'setup' && renderSetupStep()}
        {step === 'verify' && renderVerifyStep()}
        {step === 'complete' && renderCompleteStep()}
      </div>
    </div>
  );
};

export default MFASetup;
