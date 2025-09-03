// =====================================================
// PROMPT TEST MODAL COMPONENT
// @po.mdc - Woche 1, Tag 2
// =====================================================

import React, { useState } from 'react';
import { X, Play, Loader, CheckCircle, AlertCircle, Clock, DollarSign } from 'lucide-react';

interface SystemPrompt {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  model?: string;
  prompt_text: string;
  is_active: boolean;
}

interface TestResult {
  prompt_name: string;
  test_input: string;
  response_time_ms: number;
  result: {
    model: string;
    response: string;
    tokens_used: number;
    cost_eur: string;
  };
  timestamp: string;
}

interface PromptTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: SystemPrompt | null;
  onTest: (promptId: string, testInput: string, modelOverride?: string) => Promise<{ success: boolean; data?: TestResult; message?: string }>;
}

export const PromptTestModal: React.FC<PromptTestModalProps> = ({
  isOpen,
  onClose,
  prompt,
  onTest
}) => {
  const [testInput, setTestInput] = useState('');
  const [modelOverride, setModelOverride] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!prompt || !testInput.trim()) return;

    setIsTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      const result = await onTest(prompt.id, testInput, modelOverride || undefined);
      
      if (result.success && result.data) {
        setTestResult(result.data);
      } else {
        setTestError(result.message || 'Test fehlgeschlagen');
      }
    } catch (error: any) {
      setTestError(error.message || 'Fehler beim Testen des Prompts');
    } finally {
      setIsTesting(false);
    }
  };

  const handleClose = () => {
    setTestInput('');
    setModelOverride('');
    setTestResult(null);
    setTestError(null);
    onClose();
  };

  if (!isOpen || !prompt) return null;

  const availableModels = {
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus'],
    custom: ['custom-model', 'local-llm']
  };

  const models = availableModels[prompt.provider as keyof typeof availableModels] || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Prompt testen: {prompt.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {prompt.provider} • {prompt.category} • {prompt.model || 'Standard-Model'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Prompt Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System-Prompt (Vorschau)
            </label>
            <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {prompt.prompt_text}
              </pre>
            </div>
          </div>

          {/* Test Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test-Input *
              </label>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Geben Sie hier Ihren Test-Input ein..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Override (optional)
              </label>
              <select
                value={modelOverride}
                onChange={(e) => setModelOverride(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Standard-Model verwenden</option>
                {models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Standard: {prompt.model || 'Nicht definiert'}
              </p>
            </div>
          </div>

          {/* Test Button */}
          <div className="flex justify-center">
            <button
              onClick={handleTest}
              disabled={isTesting || !testInput.trim()}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <Loader className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Play className="w-5 h-5 mr-2" />
              )}
              {isTesting ? 'Teste...' : 'Prompt testen'}
            </button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Test erfolgreich</h3>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Response Time</p>
                      <p className="text-xl font-bold text-blue-900">
                        {testResult.response_time_ms}ms
                      </p>
                    </div>
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Tokens verwendet</p>
                      <p className="text-xl font-bold text-green-900">
                        {testResult.result.tokens_used}
                      </p>
                    </div>
                    <div className="w-6 h-6 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">
                      T
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600">Kosten</p>
                      <p className="text-xl font-bold text-yellow-900">
                        €{testResult.result.cost_eur}
                      </p>
                    </div>
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              {/* Model Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Model:</strong> {testResult.result.model} | 
                  <strong> Timestamp:</strong> {new Date(testResult.timestamp).toLocaleString('de-DE')}
                </p>
              </div>

              {/* Response */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KI-Antwort
                </label>
                <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {testResult.result.response}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Test Error */}
          {testError && (
            <div className="border-t pt-6">
              <div className="flex items-center p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Test fehlgeschlagen</h3>
                  <p className="text-sm text-red-700 mt-1">{testError}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Schließen
          </button>
          {testResult && (
            <button
              onClick={() => {
                setTestResult(null);
                setTestError(null);
                setTestInput('');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Neuer Test
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptTestModal;





