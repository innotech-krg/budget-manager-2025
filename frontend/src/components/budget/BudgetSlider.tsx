// =====================================================
// Budget Manager 2025 - Budget Slider Component
// Story 1.2.3 Enhancement: Visueller Budget-Schieber
// =====================================================

import React, { useState, useEffect } from 'react'

interface BudgetSliderProps {
  verfuegbaresBudget: number
  externeKosten: number
  interneKosten: number
  onBudgetChange: (budget: number) => void
  jahr: number
  className?: string
  // Zusätzliche Budget-Info
  jahresbudget?: number
  zugeordnetesbudget?: number
  gesamtstunden?: number
}

export const BudgetSlider: React.FC<BudgetSliderProps> = ({
  verfuegbaresBudget,
  externeKosten,
  interneKosten,
  onBudgetChange,
  jahr,
  className = '',
  jahresbudget,
  zugeordnetesbudget = 0,
  gesamtstunden = 0
}) => {
  const [sliderValue, setSliderValue] = useState(externeKosten || 0)
  const gesamtKosten = externeKosten + interneKosten
  const maxBudget = verfuegbaresBudget
  
  // Berechne Prozentsätze für visuelle Darstellung
  const externesProzent = maxBudget > 0 ? (externeKosten / maxBudget) * 100 : 0
  const internesProzent = maxBudget > 0 ? (interneKosten / maxBudget) * 100 : 0
  const gesamtProzent = maxBudget > 0 ? (gesamtKosten / maxBudget) * 100 : 0
  
  // Bestimme Farbe basierend auf Budget-Auslastung
  const getBudgetColor = (prozent: number) => {
    if (prozent <= 60) return 'bg-green-500'
    if (prozent <= 80) return 'bg-yellow-500'
    if (prozent <= 100) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0
    console.log('🎯 BudgetSlider handleSliderChange:', newValue);
    setSliderValue(newValue)
    onBudgetChange(newValue)
  }

  useEffect(() => {
    const newValue = externeKosten || 0;
    console.log('🎯 BudgetSlider useEffect - externeKosten changed:', newValue);
    setSliderValue(newValue);
    if (newValue !== sliderValue) {
      onBudgetChange(newValue);
    }
  }, [externeKosten])

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header mit Jahresbudget-Übersicht */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            📊 Budget-Zuweisung {jahr}
          </h3>
          <div className="text-sm text-gray-500">
            Verfügbar: {formatCurrency(verfuegbaresBudget)}
          </div>
        </div>
        

      </div>

      {/* Budget-Schieber */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Externes Budget: {formatCurrency(sliderValue)}
        </label>
        <input
          type="range"
          min="0"
          max={maxBudget}
          step="1000"
          value={sliderValue}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(sliderValue / maxBudget) * 100}%, #E5E7EB ${(sliderValue / maxBudget) * 100}%, #E5E7EB 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0 €</span>
          <span>{formatCurrency(maxBudget)}</span>
        </div>
      </div>

      {/* Visuelle Budget-Darstellung */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Budget-Aufteilung</span>
          <span className="text-sm text-gray-500">
            {gesamtProzent.toFixed(1)}% verwendet
          </span>
        </div>
        
        {/* Budget-Balken */}
        <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
          {/* Externes Budget */}
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${Math.min(externesProzent, 100)}%` }}
          />
          {/* Internes Budget */}
          <div
            className="bg-purple-500 h-full transition-all duration-300 absolute top-0"
            style={{ 
              left: `${Math.min(externesProzent, 100)}%`,
              width: `${Math.min(internesProzent, 100 - externesProzent)}%`
            }}
          />
          {/* Überschreitung */}
          {gesamtProzent > 100 && (
            <div
              className="bg-red-500 h-full absolute top-0 right-0 animate-pulse"
              style={{ width: `${Math.min(gesamtProzent - 100, 100)}%` }}
            />
          )}
        </div>
      </div>

      {/* Budget-Legende */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
          <div className="text-sm">
            <div className="font-medium">Externes Budget</div>
            <div className="text-gray-500">{formatCurrency(externeKosten)}</div>
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
          <div className="text-sm">
            <div className="font-medium">Internes Budget</div>
            <div className="text-gray-500">{formatCurrency(interneKosten)}</div>
          </div>
        </div>
      </div>

      {/* Integrierte Kostenberechnung */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">💰 Kosten-Berechnung (Live)</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-purple-50 p-3 rounded-md">
            <span className="text-purple-600 text-sm font-medium">Interne Kosten:</span>
            <div className="font-bold text-lg text-purple-800">{formatCurrency(interneKosten)}</div>
            <div className="text-xs text-purple-600">
              {gesamtstunden > 0 ? `${gesamtstunden}h gesamt` : 'Keine Stunden geplant'}
            </div>
            <div className="text-xs text-purple-500 mt-1">
              ⚠️ Wirken sich NICHT auf Jahresbudget aus
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-md">
            <span className="text-blue-600 text-sm font-medium">Externe Kosten:</span>
            <div className="font-bold text-lg text-blue-800">{formatCurrency(externeKosten)}</div>
            <div className="text-xs text-blue-600">Geplantes Budget</div>
            <div className="text-xs text-blue-500 mt-1">
              💰 Wirken sich auf Jahresbudget aus
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-md">
            <span className="text-green-600 text-sm font-medium">Projekt-Gesamtkosten:</span>
            <div className="font-bold text-lg text-green-800">{formatCurrency(gesamtKosten)}</div>
            <div className="text-xs text-green-600">Automatisch berechnet</div>
            <div className="text-xs text-green-500 mt-1">
              📊 Externe + Interne Kosten
            </div>
          </div>
        </div>

        {/* Budget-Status und Validierung */}
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">Budget-Validierung (nur externe Kosten):</span>
            <span className={`ml-2 font-bold text-lg ${
              externeKosten <= verfuegbaresBudget ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(externeKosten)} / {formatCurrency(verfuegbaresBudget)}
            </span>
          </div>
          <div className="flex items-center">
            {externeKosten <= verfuegbaresBudget ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Budget OK
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                ⚠️ Budget überschritten
              </span>
            )}
          </div>
        </div>
        
        {/* Verbleibendes Budget (nur externe Kosten) */}
        <div className="mt-2 text-sm text-gray-600">
          Verbleibendes Jahresbudget: 
          <span className={`ml-1 font-medium ${
            verfuegbaresBudget - externeKosten >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(verfuegbaresBudget - externeKosten)}
          </span>
          <span className="text-xs text-gray-500 ml-2">
            (Interne Kosten wirken sich nicht auf Jahresbudget aus)
          </span>
        </div>
      </div>

      {/* Warnung bei Budget-Überschreitung (nur externe Kosten) */}
      {externeKosten > verfuegbaresBudget && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Jahresbudget-Überschreitung
              </h3>
              <div className="mt-2 text-sm text-red-700">
                Die externen Projektkosten überschreiten das verfügbare Jahresbudget um{' '}
                <span className="font-medium">
                  {formatCurrency(externeKosten - verfuegbaresBudget)}
                </span>
                . Bitte reduzieren Sie das externe Budget oder wählen Sie ein anderes Jahr.
              </div>
              <div className="mt-1 text-xs text-red-600">
                💡 Hinweis: Interne Kosten ({formatCurrency(interneKosten)}) wirken sich nicht auf das Jahresbudget aus.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BudgetSlider
