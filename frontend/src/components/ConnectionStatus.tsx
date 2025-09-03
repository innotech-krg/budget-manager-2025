import React, { useState, useEffect } from 'react';
import { 
  WifiIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CloudIcon,
  CpuChipIcon,
  ServerIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface ServiceStatus {
  backend: { status: string; message: string };
  supabase: { status: string; message: string };
  openai: { status: string; message: string; available: boolean };
  anthropic: { status: string; message: string; available: boolean };
}

const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'connecting'>('connecting');
  const [isVisible, setIsVisible] = useState(true);
  const [services, setServices] = useState<ServiceStatus | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Test basic connection with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
        
        const response = await fetch('http://localhost:3001/api/status/system', {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.services) {
            setServices(result.data.services);
            setStatus('online');
          } else {
            setStatus('offline');
          }
        } else {
          setStatus('offline');
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('Connection check timed out after 3s');
        } else {
          console.error('Connection check failed:', error);
        }
        setStatus('offline');
        setServices(null);
      }
    };

    // Initial check with delay to prevent blocking
    const initialDelay = setTimeout(() => {
      checkConnection();
    }, 1000); // 1s delay

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'backend':
        return <ServerIcon className="h-4 w-4" />;
      case 'supabase':
        return <CloudIcon className="h-4 w-4" />;
      case 'openai':
      case 'anthropic':
        return <CpuChipIcon className="h-4 w-4" />;
      default:
        return <WifiIcon className="h-4 w-4" />;
    }
  };

  const getServiceColor = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'connected':
      case 'ready':
      case 'configured':
        return 'text-green-600';
      case 'error':
      case 'invalid':
      case 'not_configured':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getServiceBadge = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'connected':
      case 'ready':
      case 'configured':
        return '✅';
      case 'error':
      case 'invalid':
      case 'not_configured':
        return '❌';
      default:
        return '⚠️';
    }
  };

  const getOverallStatus = () => {
    if (!services) return { color: 'bg-red-500', text: 'Offline', icon: '❌' };
    
    const backendOk = services.backend.status === 'connected';
    const supabaseOk = services.supabase.status === 'connected';
    const aiOk = services.openai.available || services.anthropic.available;
    
    if (backendOk && supabaseOk && aiOk) {
      return { color: 'bg-green-500', text: 'Alle Services Online', icon: '✅' };
    } else if (backendOk && supabaseOk) {
      return { color: 'bg-yellow-500', text: 'Basis-Services Online', icon: '⚠️' };
    } else {
      return { color: 'bg-red-500', text: 'Service-Probleme', icon: '❌' };
    }
  };

  if (!isVisible) return null;

  const overallStatus = getOverallStatus();

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {/* Main Status Bar */}
      <div 
        className={`${overallStatus.color} text-white px-4 py-2 rounded-lg shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{overallStatus.icon}</span>
            <span className="font-medium text-sm">{overallStatus.text}</span>
          </div>
          {showDetails ? 
            <ChevronUpIcon className="h-4 w-4" /> : 
            <ChevronDownIcon className="h-4 w-4" />
          }
        </div>
      </div>

      {/* Detailed Status */}
      {showDetails && services && (
        <div className="mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-80">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">System-Status</h3>
          
          <div className="space-y-3">
            {/* Backend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getServiceIcon('backend')}
                <span className="text-sm font-medium text-gray-700">Backend Server</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs">{getServiceBadge(services.backend.status)}</span>
                <span className={`text-xs ${getServiceColor(services.backend.status)}`}>
                  {services.backend.status === 'connected' ? 'Verbunden' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Supabase */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getServiceIcon('supabase')}
                <span className="text-sm font-medium text-gray-700">Supabase DB</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs">{getServiceBadge(services.supabase.status)}</span>
                <span className={`text-xs ${getServiceColor(services.supabase.status)}`}>
                  {services.supabase.status === 'connected' ? 'Verbunden' : 'Fehler'}
                </span>
              </div>
            </div>

            {/* OpenAI */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getServiceIcon('openai')}
                <span className="text-sm font-medium text-gray-700">ChatGPT API</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs">{getServiceBadge(services.openai.status)}</span>
                <span className={`text-xs ${getServiceColor(services.openai.status)}`}>
                  {services.openai.available ? 'Konfiguriert' : 'Nicht konfiguriert'}
                </span>
              </div>
            </div>

            {/* Anthropic */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getServiceIcon('anthropic')}
                <span className="text-sm font-medium text-gray-700">Claude API</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs">{getServiceBadge(services.anthropic.status)}</span>
                <span className={`text-xs ${getServiceColor(services.anthropic.status)}`}>
                  {services.anthropic.available ? 'Konfiguriert' : 'Nicht konfiguriert'}
                </span>
              </div>
            </div>
          </div>

          {/* KI Status Summary */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">🤖 KI-OCR Status</span>
              <span className={`text-xs font-medium ${
                services.openai.available || services.anthropic.available 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {services.openai.available || services.anthropic.available 
                  ? 'Funktional' 
                  : 'Nicht verfügbar'
                }
              </span>
            </div>
            {services.openai.available && services.anthropic.available && (
              <p className="text-xs text-gray-500 mt-1">
                Dual-Engine-Modus aktiv (OpenAI + Claude)
              </p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={() => setShowDetails(false)}
            className="mt-3 w-full text-xs text-gray-500 hover:text-gray-700 py-1"
          >
            Schließen
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;