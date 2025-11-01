/**
 * Step Indicator Component
 * Progress bar for multi-step onboarding form
 */

import { CheckIcon } from '@heroicons/react/24/solid';

interface Step {
  id: number;
  title: string;
  completed: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="relative flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                  step.completed
                    ? 'bg-green-500 border-green-500'
                    : currentStep === index
                    ? 'bg-coral border-coral'
                    : 'bg-slate-700 border-slate-600'
                }`}
              >
                {step.completed ? (
                  <CheckIcon className="w-6 h-6 text-white" />
                ) : (
                  <span className="text-white font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <span
                className={`mt-2 text-xs md:text-sm font-medium text-center ${
                  currentStep === index ? 'text-coral' : 'text-gray-400'
                }`}
              >
                {step.title}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 transition-all ${
                  step.completed ? 'bg-green-500' : 'bg-slate-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Progress Percentage */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Progress</span>
          <span>
            {Math.round(((currentStep + 1) / steps.length) * 100)}% pabeigts
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-coral to-orange-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};
