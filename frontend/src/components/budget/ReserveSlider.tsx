// =====================================================
// Budget Manager 2025 - Reserve Slider Component
// Visueller 5-20% Reserve-Slider mit Echtzeit-Berechnung
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { formatGermanCurrency, formatGermanPercentage } from '@/utils/currency';
import { clsx } from 'clsx';

interface ReserveSliderProps {
  value: number;
  onChange: (value: number) => void;
  gesamtbudget: number;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const ReserveSlider: React.FC<ReserveSliderProps> = ({
  value,
  onChange,
  gesamtbudget,
  error,
  disabled = false,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  // Update display value when prop changes
  useEffect(() => {
    if (!isDragging) {
      setDisplayValue(value);
    }
  }, [value, isDragging]);

  // Calculate derived values
  const reserveBetrag = gesamtbudget * (displayValue / 100);
  const verfuegbaresBudget = gesamtbudget - reserveBetrag;
  const sliderPosition = ((displayValue - 5) / (20 - 5)) * 100;

  // Predefined reserve recommendations
  const reservePresets = [
    { value: 5, label: 'Minimal', description: 'Für stabile Projekte', color: 'ampel-gruen' },
    { value: 10, label: 'Standard', description: 'Empfohlener Wert', color: 'primary' },
    { value: 15, label: 'Sicher', description: 'Für unsichere Projekte', color: 'ampel-gelb' },
    { value: 20, label: 'Maximal', description: 'Höchste Absicherung', color: 'ampel-orange' }
  ];

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    setDisplayValue(newValue);
    onChange(newValue);
  };

  const handlePresetClick = (presetValue: number) => {
    setDisplayValue(presetValue);
    onChange(presetValue);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Get color based on reserve percentage
  const getReserveColor = (percentage: number) => {
    if (percentage <= 7) return 'ampel-gruen';
    if (percentage <= 12) return 'primary';
    if (percentage <= 17) return 'ampel-gelb';
    return 'ampel-orange';
  };

  const currentColor = getReserveColor(displayValue);

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <ShieldCheckIcon className={`h-6 w-6 text-${currentColor}-500 mr-2`} />
          <h4 className="text-lg font-semibold text-geschaeft-900">
            Reserve-Allokation
          </h4>
        </div>
        <p className="text-sm text-geschaeft-600">
          Bestimmen Sie, wie viel Prozent als Sicherheitsreserve zurückbehalten werden soll
        </p>
      </div>

      {/* Current Value Display */}
      <div className="text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-lg bg-${currentColor}-50 border border-${currentColor}-200`}>
          <span className={`text-3xl font-bold text-${currentColor}-600 mr-2`}>
            {displayValue.toFixed(1)}%
          </span>
          <div className="text-left">
            <div className={`text-sm font-medium text-${currentColor}-700`}>
              {formatGermanCurrency(reserveBetrag)}
            </div>
            <div className="text-xs text-geschaeft-500">Reserve</div>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <div className="relative h-2 bg-geschaeft-200 rounded-full">
          {/* Track gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-ampel-gruen-300 via-ampel-gelb-300 to-ampel-orange-400 rounded-full opacity-50" />
          
          {/* Progress */}
          <motion.div
            className={`absolute left-0 top-0 h-full bg-${currentColor}-500 rounded-full`}
            style={{ width: `${sliderPosition}%` }}
            animate={{ width: `${sliderPosition}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Slider Input */}
        <input
          type="range"
          min="5"
          max="20"
          step="0.5"
          value={displayValue}
          onChange={handleSliderChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          disabled={disabled}
          className={clsx(
            'absolute inset-0 w-full h-2 opacity-0 cursor-pointer',
            disabled && 'cursor-not-allowed'
          )}
        />

        {/* Slider Thumb */}
        <motion.div
          className={clsx(
            'absolute top-1/2 w-6 h-6 -mt-3 rounded-full shadow-lg border-2 border-white',
            `bg-${currentColor}-500`,
            isDragging ? 'scale-125' : 'scale-100',
            disabled ? 'opacity-50' : 'cursor-pointer'
          )}
          style={{ left: `calc(${sliderPosition}% - 12px)` }}
          animate={{ 
            left: `calc(${sliderPosition}% - 12px)`,
            scale: isDragging ? 1.25 : 1
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Scale markers */}
        <div className="flex justify-between mt-4 text-xs text-geschaeft-500">
          <span>5%</span>
          <span>10%</span>
          <span>15%</span>
          <span>20%</span>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {reservePresets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handlePresetClick(preset.value)}
            disabled={disabled}
            className={clsx(
              'p-3 rounded-lg border-2 transition-all duration-200',
              displayValue === preset.value
                ? `border-${preset.color}-500 bg-${preset.color}-50`
                : 'border-geschaeft-200 bg-white hover:border-geschaeft-300 hover:bg-geschaeft-50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className={clsx(
              'text-lg font-bold mb-1',
              displayValue === preset.value ? `text-${preset.color}-600` : 'text-geschaeft-700'
            )}>
              {preset.value}%
            </div>
            <div className="text-xs font-medium text-geschaeft-600 mb-1">
              {preset.label}
            </div>
            <div className="text-xs text-geschaeft-500">
              {preset.description}
            </div>
          </button>
        ))}
      </div>

      {/* Budget calculation preview */}
      {gesamtbudget > 0 && (
        <motion.div
          className="bg-geschaeft-50 rounded-lg p-4 space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h5 className="font-medium text-geschaeft-900 mb-3">Budget-Aufteilung:</h5>
          
          <div className="space-y-2">
            {/* Gesamtbudget */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-geschaeft-600">Gesamtbudget:</span>
              <span className="font-semibold currency-display text-geschaeft-900">
                {formatGermanCurrency(gesamtbudget)}
              </span>
            </div>
            
            {/* Reserve */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-geschaeft-600">
                Reserve ({displayValue.toFixed(1)}%):
              </span>
              <span className={`font-semibold currency-display text-${currentColor}-600`}>
                -{formatGermanCurrency(reserveBetrag)}
              </span>
            </div>
            
            {/* Verfügbares Budget */}
            <div className="flex justify-between items-center pt-2 border-t border-geschaeft-200">
              <span className="font-medium text-geschaeft-900">Verfügbares Budget:</span>
              <span className="font-bold text-lg currency-display text-ampel-gruen-600">
                {formatGermanCurrency(verfuegbaresBudget)}
              </span>
            </div>
          </div>

          {/* Visual bar */}
          <div className="mt-4">
            <div className="flex h-4 rounded-lg overflow-hidden bg-geschaeft-200">
              <div
                className="bg-ampel-gruen-500 transition-all duration-300"
                style={{ width: `${100 - displayValue}%` }}
                title={`Verfügbar: ${formatGermanCurrency(verfuegbaresBudget)}`}
              />
              <div
                className={`bg-${currentColor}-500 transition-all duration-300`}
                style={{ width: `${displayValue}%` }}
                title={`Reserve: ${formatGermanCurrency(reserveBetrag)}`}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-ampel-gruen-600 font-medium">
                {(100 - displayValue).toFixed(1)}% Verfügbar
              </span>
              <span className={`text-${currentColor}-600 font-medium`}>
                {displayValue.toFixed(1)}% Reserve
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-ampel-rot-600 flex items-start">
          <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Recommendation */}
      {!error && (
        <div className="text-center">
          <p className="text-xs text-geschaeft-500">
            💡 <strong>Empfehlung:</strong> 10% Reserve ist für die meisten Geschäftsprojekte optimal
          </p>
        </div>
      )}
    </div>
  );
};

export default ReserveSlider;