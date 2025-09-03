// =====================================================
// Budget Manager 2025 - Budget Creation Wizard
// Story 1.1: 4-Schritt Jahresbudget-Erstellungs-Dialog
// =====================================================

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon,
  CalendarDaysIcon,
  CurrencyEuroIcon,
  ShieldCheckIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { formatGermanCurrency, parseGermanCurrency, validateGermanCurrency } from '@/utils/currency';
import { CurrencyInput } from './CurrencyInput';
import { ReserveSlider } from './ReserveSlider';
import { ProgressIndicator } from '../ui/ProgressIndicator';

// =====================================================
// VALIDATION SCHEMA
// =====================================================

const budgetCreationSchema = z.object({
  jahr: z.number()
    .min(2020, 'Jahr muss mindestens 2020 sein')
    .max(2035, 'Jahr darf maximal 2035 sein'),
  gesamtbudget: z.number()
    .min(1, 'Gesamtbudget muss größer als 0 sein')
    .max(999999999.99, 'Gesamtbudget ist zu hoch'),
  reserve_allokation: z.number()
    .min(5, 'Reserve muss mindestens 5% betragen')
    .max(20, 'Reserve darf maximal 20% betragen'),
  beschreibung: z.string()
    .max(1000, 'Beschreibung darf maximal 1000 Zeichen lang sein')
    .optional()
});

type BudgetCreationData = z.infer<typeof budgetCreationSchema>;

// =====================================================
// WIZARD STEPS
// =====================================================

const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Jahr auswählen',
    description: 'Wählen Sie das Geschäftsjahr für Ihr Budget',
    icon: CalendarDaysIcon
  },
  {
    id: 2,
    title: 'Gesamtbudget festlegen',
    description: 'Geben Sie das gesamte verfügbare Budget ein',
    icon: CurrencyEuroIcon
  },
  {
    id: 3,
    title: 'Reserve konfigurieren',
    description: 'Bestimmen Sie die Reserve-Allokation (5-20%)',
    icon: ShieldCheckIcon
  },
  {
    id: 4,
    title: 'Bestätigung',
    description: 'Überprüfen Sie Ihre Angaben und erstellen Sie das Budget',
    icon: DocumentCheckIcon
  }
];

// =====================================================
// BUDGET CREATION WIZARD COMPONENT
// =====================================================

interface BudgetCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BudgetCreationData) => Promise<void>;
  isLoading?: boolean;
}

export const BudgetCreationWizard: React.FC<BudgetCreationWizardProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<BudgetCreationData>({
    resolver: zodResolver(budgetCreationSchema),
    defaultValues: {
      jahr: new Date().getFullYear() + 1,
      gesamtbudget: 0,
      reserve_allokation: 10,
      beschreibung: ''
    },
    mode: 'onChange'
  });

  const formData = watch();

  // Berechne verfügbares Budget
  const verfuegbaresBudget = formData.gesamtbudget * (1 - formData.reserve_allokation / 100);
  const reserveBetrag = formData.gesamtbudget * (formData.reserve_allokation / 100);

  // =====================================================
  // STEP NAVIGATION
  // =====================================================

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNextStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !errors.jahr && formData.jahr > 0;
      case 2:
        return !errors.gesamtbudget && formData.gesamtbudget > 0;
      case 3:
        return !errors.reserve_allokation;
      case 4:
        return isValid;
      default:
        return false;
    }
  };

  // =====================================================
  // FORM SUBMISSION
  // =====================================================

  const handleFormSubmit = async (data: BudgetCreationData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      toast.success('Jahresbudget erfolgreich erstellt!');
      onClose();
      setCurrentStep(1);
    } catch (error) {
      toast.error('Fehler beim Erstellen des Budgets');
      console.error('Budget creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // STEP COMPONENTS
  // =====================================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CalendarDaysIcon className="mx-auto h-16 w-16 text-primary-500 mb-4" />
              <h3 className="text-lg font-semibold text-geschaeft-900 mb-2">
                Geschäftsjahr auswählen
              </h3>
              <p className="text-geschaeft-600">
                Für welches Jahr möchten Sie ein Budget erstellen?
              </p>
            </div>
            
            <Controller
              name="jahr"
              control={control}
              render={({ field }) => (
                <div className="max-w-xs mx-auto">
                  <label className="block text-sm font-medium text-geschaeft-700 mb-2">
                    Jahr
                  </label>
                  <select
                    {...field}
                    className="w-full input-german p-3 text-lg text-center font-semibold"
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  >
                    {Array.from({ length: 16 }, (_, i) => 2020 + i).map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors.jahr && (
                    <p className="mt-1 text-sm text-ampel-rot-600">
                      {errors.jahr.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CurrencyEuroIcon className="mx-auto h-16 w-16 text-primary-500 mb-4" />
              <h3 className="text-lg font-semibold text-geschaeft-900 mb-2">
                Gesamtbudget festlegen
              </h3>
              <p className="text-geschaeft-600">
                Geben Sie das gesamte verfügbare Budget für {formData.jahr} ein
              </p>
            </div>
            
            <Controller
              name="gesamtbudget"
              control={control}
              render={({ field }) => (
                <div className="max-w-md mx-auto">
                  <CurrencyInput
                    label="Gesamtbudget"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.gesamtbudget?.message}
                    placeholder="€0,00"
                    className="text-2xl font-bold text-center"
                  />
                </div>
              )}
            />

            {formData.gesamtbudget > 0 && (
              <div className="bg-geschaeft-50 p-4 rounded-lg">
                <p className="text-sm text-geschaeft-700">
                  <strong>Hinweis:</strong> Von diesem Betrag wird automatisch eine Reserve 
                  abgezogen, die Sie im nächsten Schritt konfigurieren können.
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <ShieldCheckIcon className="mx-auto h-16 w-16 text-primary-500 mb-4" />
              <h3 className="text-lg font-semibold text-geschaeft-900 mb-2">
                Reserve konfigurieren
              </h3>
              <p className="text-geschaeft-600">
                Bestimmen Sie, wie viel Prozent als Reserve zurückbehalten werden soll
              </p>
            </div>
            
            <Controller
              name="reserve_allokation"
              control={control}
              render={({ field }) => (
                <div className="max-w-lg mx-auto">
                  <ReserveSlider
                    value={field.value}
                    onChange={field.onChange}
                    gesamtbudget={formData.gesamtbudget}
                    error={errors.reserve_allokation?.message}
                  />
                </div>
              )}
            />

            <div className="bg-primary-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-geschaeft-700">Gesamtbudget:</span>
                <span className="font-semibold currency-display">
                  {formatGermanCurrency(formData.gesamtbudget)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-geschaeft-700">Reserve:</span>
                <span className="font-semibold currency-display text-ampel-orange-600">
                  {formatGermanCurrency(reserveBetrag)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-primary-200">
                <span className="text-sm font-bold text-geschaeft-900">Verfügbares Budget:</span>
                <span className="font-bold text-lg currency-display text-ampel-gruen-600">
                  {formatGermanCurrency(verfuegbaresBudget)}
                </span>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DocumentCheckIcon className="mx-auto h-16 w-16 text-primary-500 mb-4" />
              <h3 className="text-lg font-semibold text-geschaeft-900 mb-2">
                Budget erstellen
              </h3>
              <p className="text-geschaeft-600">
                Überprüfen Sie Ihre Angaben und erstellen Sie das Jahresbudget
              </p>
            </div>
            
            <div className="geschaeft-card p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-geschaeft-600">Jahr</label>
                  <p className="text-lg font-semibold text-geschaeft-900">{formData.jahr}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-geschaeft-600">Gesamtbudget</label>
                  <p className="text-lg font-semibold currency-display text-geschaeft-900">
                    {formatGermanCurrency(formData.gesamtbudget)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-geschaeft-600">Reserve</label>
                  <p className="text-lg font-semibold text-ampel-orange-600">
                    {formData.reserve_allokation}% ({formatGermanCurrency(reserveBetrag)})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-geschaeft-600">Verfügbar</label>
                  <p className="text-lg font-semibold currency-display text-ampel-gruen-600">
                    {formatGermanCurrency(verfuegbaresBudget)}
                  </p>
                </div>
              </div>

              <Controller
                name="beschreibung"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-geschaeft-700 mb-2">
                      Beschreibung (optional)
                    </label>
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full input-german resize-none"
                      placeholder="Zusätzliche Informationen zum Budget..."
                    />
                    {errors.beschreibung && (
                      <p className="mt-1 text-sm text-ampel-rot-600">
                        {errors.beschreibung.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // =====================================================
  // RENDER WIZARD
  // =====================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-geschaeft-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-geschaeft-900 mb-2">
              Neues Jahresbudget erstellen
            </h2>
            <ProgressIndicator 
              steps={WIZARD_STEPS}
              currentStep={currentStep}
            />
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="mb-8"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="flex justify-between items-center pt-6 border-t border-geschaeft-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center px-4 py-2 text-sm font-medium text-geschaeft-700 bg-white border border-geschaeft-300 rounded-md hover:bg-geschaeft-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Zurück
            </button>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-geschaeft-700 bg-white border border-geschaeft-300 rounded-md hover:bg-geschaeft-50"
              >
                Abbrechen
              </button>

              {currentStep < WIZARD_STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToNextStep()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Weiter
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit(handleFormSubmit)}
                  disabled={!isValid || isSubmitting || isLoading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Erstelle...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      Budget erstellen
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetCreationWizard;