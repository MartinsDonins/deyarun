/**
 * Profile Setup Form Component
 * Multi-step form for collecting user data for personalized training
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { StepIndicator } from './StepIndicator';
import {
  basicInfoSchema,
  runningExperienceSchema,
  trainingGoalsSchema,
  healthInfoSchema,
  type BasicInfoForm,
  type RunningExperienceForm,
  type TrainingGoalsForm,
  type HealthInfoForm
} from '../../lib/validations/onboarding';

interface ProfileSetupFormProps {
  onComplete: (data: any) => Promise<void>;
  onBack?: () => void;
}

export const ProfileSetupForm = ({ onComplete, onBack }: ProfileSetupFormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const steps = [
    { id: 0, title: 'Pamata Info', completed: false },
    { id: 1, title: 'Pieredze', completed: false },
    { id: 2, title: 'Mērķi', completed: false },
    { id: 3, title: 'Veselība', completed: false }
  ];

  // Auto-save to localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('onboarding-draft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
      } catch (e) {
        console.error('Failed to parse saved onboarding data');
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(formData).length > 0) {
        localStorage.setItem('onboarding-draft', JSON.stringify(formData));
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [formData]);

  const goToNextStep = (stepData: any) => {
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinalSubmit(updatedData);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleFinalSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onComplete(data);
      localStorage.removeItem('onboarding-draft');
    } catch (error) {
      console.error('Failed to submit onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-700">
          {/* Step Indicator */}
          <StepIndicator
            steps={steps.map((step, idx) => ({
              ...step,
              completed: idx < currentStep
            }))}
            currentStep={currentStep}
          />

          {/* Form Steps */}
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <BasicInfoStep
                key="step-0"
                onNext={goToNextStep}
                onBack={goToPreviousStep}
                initialData={formData.basicInfo}
              />
            )}
            {currentStep === 1 && (
              <RunningExperienceStep
                key="step-1"
                onNext={goToNextStep}
                onBack={goToPreviousStep}
                initialData={formData.runningExperience}
              />
            )}
            {currentStep === 2 && (
              <TrainingGoalsStep
                key="step-2"
                onNext={goToNextStep}
                onBack={goToPreviousStep}
                initialData={formData.trainingGoals}
              />
            )}
            {currentStep === 3 && (
              <HealthInfoStep
                key="step-3"
                onNext={goToNextStep}
                onBack={goToPreviousStep}
                initialData={formData.healthInfo}
                isSubmitting={isSubmitting}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Step 1: Basic Info
interface StepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
  isSubmitting?: boolean;
}

const BasicInfoStep = ({ onNext, onBack, initialData }: StepProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BasicInfoForm>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: initialData
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-3xl font-bold text-white mb-6">Pamata Informācija</h2>
      <form onSubmit={handleSubmit((data) => onNext({ basicInfo: data }))} className="space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pilns vārds <span className="text-coral">*</span>
          </label>
          <input
            {...register('fullName')}
            type="text"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral"
            placeholder="Jānis Bērziņš"
          />
          {errors.fullName && (
            <p className="text-red-400 text-sm mt-1">{errors.fullName.message}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Dzimšanas datums <span className="text-coral">*</span>
          </label>
          <input
            {...register('dateOfBirth')}
            type="date"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral"
          />
          {errors.dateOfBirth && (
            <p className="text-red-400 text-sm mt-1">{errors.dateOfBirth.message}</p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Dzimums <span className="text-coral">*</span>
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'male', label: 'Vīrietis' },
              { value: 'female', label: 'Sieviete' },
              { value: 'other', label: 'Cits' }
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center justify-center px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:border-coral transition-colors"
              >
                <input
                  {...register('gender')}
                  type="radio"
                  value={option.value}
                  className="mr-2"
                />
                <span className="text-white">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.gender && (
            <p className="text-red-400 text-sm mt-1">{errors.gender.message}</p>
          )}
        </div>

        {/* Weight and Height */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Svars (kg) <span className="text-coral">*</span>
            </label>
            <input
              {...register('weight', { valueAsNumber: true })}
              type="number"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral"
              placeholder="70"
            />
            {errors.weight && (
              <p className="text-red-400 text-sm mt-1">{errors.weight.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Augums (cm) <span className="text-coral">*</span>
            </label>
            <input
              {...register('height', { valueAsNumber: true })}
              type="number"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral"
              placeholder="175"
            />
            {errors.height && (
              <p className="text-red-400 text-sm mt-1">{errors.height.message}</p>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg hover:bg-slate-700 text-white transition-all"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>Atpakaļ</span>
          </button>
          <button
            type="submit"
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-coral to-orange-500 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-semibold"
          >
            <span>Tālāk</span>
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// Step 2: Running Experience
const RunningExperienceStep = ({ onNext, onBack, initialData }: StepProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RunningExperienceForm>({
    resolver: zodResolver(runningExperienceSchema),
    defaultValues: initialData
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-3xl font-bold text-white mb-6">Skriešanas Pieredze</h2>
      <form onSubmit={handleSubmit((data) => onNext({ runningExperience: data }))} className="space-y-6">
        {/* Running Level */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Skriešanas līmenis <span className="text-coral">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: 'beginner', label: 'Iesācējs' },
              { value: 'intermediate', label: 'Vidējs' },
              { value: 'advanced', label: 'Progresīvs' },
              { value: 'elite', label: 'Elites' }
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:border-coral transition-colors"
              >
                <input
                  {...register('level')}
                  type="radio"
                  value={option.value}
                  className="mr-2"
                />
                <span className="text-white">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.level && (
            <p className="text-red-400 text-sm mt-1">{errors.level.message}</p>
          )}
        </div>

        {/* Years Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cik gadus skrien? <span className="text-coral">*</span>
          </label>
          <input
            {...register('yearsExperience', { valueAsNumber: true })}
            type="number"
            min="0"
            max="50"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral"
            placeholder="2"
          />
          {errors.yearsExperience && (
            <p className="text-red-400 text-sm mt-1">{errors.yearsExperience.message}</p>
          )}
        </div>

        {/* Weekly Distance */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nedēļas distance <span className="text-coral">*</span>
          </label>
          <select
            {...register('weeklyDistance')}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral"
          >
            <option value="">Izvēlieties...</option>
            <option value="0-10">0-10 km</option>
            <option value="10-20">10-20 km</option>
            <option value="20-30">20-30 km</option>
            <option value="30-40">30-40 km</option>
            <option value="40-50">40-50 km</option>
            <option value="50+">50+ km</option>
          </select>
          {errors.weeklyDistance && (
            <p className="text-red-400 text-sm mt-1">{errors.weeklyDistance.message}</p>
          )}
        </div>

        {/* Personal Bests */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-4">
            Personīgie rekordi (neobligāti)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">5K laiks (MM:SS)</label>
              <input
                {...register('personalBests.fiveK')}
                type="text"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral"
                placeholder="23:45"
              />
              {errors.personalBests?.fiveK && (
                <p className="text-red-400 text-xs mt-1">{errors.personalBests.fiveK.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">10K laiks (MM:SS)</label>
              <input
                {...register('personalBests.tenK')}
                type="text"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral"
                placeholder="48:30"
              />
              {errors.personalBests?.tenK && (
                <p className="text-red-400 text-xs mt-1">{errors.personalBests.tenK.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Pusmaratons (HH:MM:SS)</label>
              <input
                {...register('personalBests.halfMarathon')}
                type="text"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral"
                placeholder="1:45:00"
              />
              {errors.personalBests?.halfMarathon && (
                <p className="text-red-400 text-xs mt-1">{errors.personalBests.halfMarathon.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Maratons (HH:MM:SS)</label>
              <input
                {...register('personalBests.marathon')}
                type="text"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral"
                placeholder="3:30:00"
              />
              {errors.personalBests?.marathon && (
                <p className="text-red-400 text-xs mt-1">{errors.personalBests.marathon.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg hover:bg-slate-700 text-white transition-all"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>Atpakaļ</span>
          </button>
          <button
            type="submit"
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-coral to-orange-500 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-semibold"
          >
            <span>Tālāk</span>
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// Step 3: Training Goals
const TrainingGoalsStep = ({ onNext, onBack, initialData }: StepProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<TrainingGoalsForm>({
    resolver: zodResolver(trainingGoalsSchema),
    defaultValues: initialData || { trainingDaysPerWeek: 3, preferredTrainingTime: [] }
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-3xl font-bold text-white mb-6">Treniņu Mērķi</h2>
      <form onSubmit={handleSubmit((data) => onNext({ trainingGoals: data }))} className="space-y-6">
        {/* Primary Goal */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Galvenais mērķis <span className="text-coral">*</span>
          </label>
          <select
            {...register('primaryGoal')}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral"
          >
            <option value="">Izvēlieties...</option>
            <option value="lose_weight">Zaudēt svaru</option>
            <option value="build_endurance">Uzlabot izturību</option>
            <option value="increase_speed">Palielināt ātrumu</option>
            <option value="first_5k">Pirmais 5K</option>
            <option value="first_10k">Pirmais 10K</option>
            <option value="first_half_marathon">Pirmais pusmaratons</option>
            <option value="first_marathon">Pirmais maratons</option>
            <option value="general_fitness">Uzlabot vispārējo fizisko formu</option>
          </select>
          {errors.primaryGoal && (
            <p className="text-red-400 text-sm mt-1">{errors.primaryGoal.message}</p>
          )}
        </div>

        {/* Target Race Date */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Mērķa sacensību datums (neobligāti)
          </label>
          <input
            {...register('targetRaceDate')}
            type="date"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>

        {/* Training Days per Week */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Treniņu dienas nedēļā: <span className="text-coral">*</span>
          </label>
          <input
            {...register('trainingDaysPerWeek', { valueAsNumber: true })}
            type="range"
            min="1"
            max="7"
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          {errors.trainingDaysPerWeek && (
            <p className="text-red-400 text-sm mt-1">{errors.trainingDaysPerWeek.message}</p>
          )}
        </div>

        {/* Preferred Training Time */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Vēlamais treniņa laiks <span className="text-coral">*</span>
          </label>
          <div className="space-y-2">
            {[
              { value: 'morning', label: 'Rīts (6:00 - 10:00)' },
              { value: 'afternoon', label: 'Diena (10:00 - 17:00)' },
              { value: 'evening', label: 'Vakars (17:00 - 22:00)' }
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:border-coral transition-colors"
              >
                <input
                  {...register('preferredTrainingTime')}
                  type="checkbox"
                  value={option.value}
                  className="mr-3"
                />
                <span className="text-white">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.preferredTrainingTime && (
            <p className="text-red-400 text-sm mt-1">{errors.preferredTrainingTime.message}</p>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg hover:bg-slate-700 text-white transition-all"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>Atpakaļ</span>
          </button>
          <button
            type="submit"
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-coral to-orange-500 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-semibold"
          >
            <span>Tālāk</span>
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// Step 4: Health Info
const HealthInfoStep = ({ onNext, onBack, initialData, isSubmitting }: StepProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<HealthInfoForm>({
    resolver: zodResolver(healthInfoSchema),
    defaultValues: initialData
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-3xl font-bold text-white mb-6">Veselības Informācija</h2>
      <form onSubmit={handleSubmit((data) => onNext({ healthInfo: data }))} className="space-y-6">
        {/* Injury History */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Traumu vēsture (neobligāti)
          </label>
          <textarea
            {...register('injuryHistory')}
            rows={3}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral resize-none"
            placeholder="Aprakstiet iepriekšējās traumas..."
          />
        </div>

        {/* Current Injuries */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pašreizējās sāpes/traumas (neobligāti)
          </label>
          <textarea
            {...register('currentInjuries')}
            rows={3}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral resize-none"
            placeholder="Aprakstiet pašreizējās problēmas..."
          />
        </div>

        {/* Medical Conditions */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Medicīniskie stāvokļi (neobligāti)
          </label>
          <textarea
            {...register('medicalConditions')}
            rows={3}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral resize-none"
            placeholder="Astma, diabēts, sirds slimības..."
          />
        </div>

        {/* Medications */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Medikamenti (neobligāti)
          </label>
          <textarea
            {...register('medications')}
            rows={2}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-coral resize-none"
            placeholder="Regulāri lietojamie medikamenti..."
          />
        </div>

        {/* Consent Checkbox */}
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <label className="flex items-start cursor-pointer">
            <input
              {...register('consent')}
              type="checkbox"
              className="mt-1 mr-3"
            />
            <span className="text-white text-sm">
              <span className="text-coral">*</span> Apstiprinu, ka sniegtā informācija ir patiesa un pilnīga.
              Es saprotu, ka šī informācija tiks izmantota, lai izveidotu man piemērotu treniņu plānu.
            </span>
          </label>
          {errors.consent && (
            <p className="text-red-400 text-sm mt-2">{errors.consent.message}</p>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg hover:bg-slate-700 text-white transition-all disabled:opacity-50"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>Atpakaļ</span>
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                <span>Saglabā...</span>
              </>
            ) : (
              <>
                <span>Pabeigt</span>
                <ChevronRightIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
