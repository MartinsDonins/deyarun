import { useState, useEffect } from 'react'
import { Card, Metric } from '@tremor/react'
import { motion, AnimatePresence } from 'framer-motion'
import { logger } from '../../lib/productionLogger';
import { 
  SparklesIcon,
  CalendarDaysIcon,
  TrophyIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronRightIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addDays, addWeeks } from 'date-fns'
import { trainingIntelligenceAPI, SmartPlanConfig, SmartPlan, formatTime, formatDistance } from '../../lib/trainingIntelligenceAPI'
import toast from 'react-hot-toast'

// Validation schema for smart plan generation
const planConfigSchema = z.object({
  targetRace: z.object({
    distance: z.string().min(1, 'Race distance is required'),
    date: z.string().min(1, 'Race date is required'),
    name: z.string().optional(),
    timeGoal: z.number().optional()
  }),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  currentWeeklyMileage: z.number().min(0).optional(),
  longestRecentRun: z.number().min(0).optional(),
  preferredTrainingDays: z.array(z.string()).optional(),
  age: z.number().min(10).max(100).optional(),
  restingHeartRate: z.number().min(30).max(100).optional(),
  maxHeartRate: z.number().min(120).max(220).optional(),
  injuryHistory: z.array(z.object({
    type: z.string(),
    date: z.string(),
    severity: z.string(),
    chronic: z.boolean().optional()
  })).optional(),
  availableTime: z.enum(['limited', 'moderate', 'extensive']),
  experience: z.enum(['novice', 'beginner', 'intermediate', 'advanced', 'expert']),
  preferredIntensity: z.enum(['low', 'moderate', 'high'])
})

type PlanConfigForm = z.infer<typeof planConfigSchema>

interface SmartPlanGeneratorProps {
  userId?: string
  onPlanCreated?: (plan: SmartPlan) => void
}

export default function SmartPlanGenerator({ userId, onPlanCreated }: SmartPlanGeneratorProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<SmartPlan | null>(null)
  const [injuryHistory, setInjuryHistory] = useState<Array<{ type: string; date: string; severity: string; chronic?: boolean }>>([])
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm<PlanConfigForm>({
    resolver: zodResolver(planConfigSchema),
    defaultValues: {
      targetRace: {
        distance: '10k',
        date: format(addWeeks(new Date(), 12), 'yyyy-MM-dd')
      },
      fitnessLevel: 'intermediate',
      availableTime: 'moderate',
      experience: 'intermediate',
      preferredIntensity: 'moderate',
      preferredTrainingDays: []
    }
  })

  const fitnessLevel = watch('fitnessLevel')
  const targetDistance = watch('targetRace.distance')
  const availableTime = watch('availableTime')

  const raceDistances = [
    { value: '5k', label: '5K (3.1 miles)', weeks: 8 },
    { value: '10k', label: '10K (6.2 miles)', weeks: 10 },
    { value: 'half_marathon', label: 'Half Marathon (13.1 miles)', weeks: 12 },
    { value: 'marathon', label: 'Marathon (26.2 miles)', weeks: 16 },
    { value: 'ultra_50k', label: '50K Ultra (31 miles)', weeks: 20 }
  ]

  const fitnessLevels = [
    { 
      value: 'beginner', 
      label: 'Beginner', 
      description: 'New to running or returning after a long break',
      weeklyMileage: '0-15 miles/week'
    },
    { 
      value: 'intermediate', 
      label: 'Intermediate', 
      description: 'Regular runner with some race experience',
      weeklyMileage: '15-30 miles/week'
    },
    { 
      value: 'advanced', 
      label: 'Advanced', 
      description: 'Experienced runner with consistent training',
      weeklyMileage: '30-50 miles/week'
    },
    { 
      value: 'expert', 
      label: 'Expert', 
      description: 'Competitive runner with years of experience',
      weeklyMileage: '50+ miles/week'
    }
  ]

  const weekDays = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' }
  ]

  const injuryTypes = [
    'Runner\'s Knee', 'IT Band Syndrome', 'Plantar Fasciitis', 'Shin Splints', 
    'Achilles Tendinitis', 'Stress Fracture', 'Hip Flexor Strain', 'Calf Strain', 'Other'
  ]

  const onSubmitPlan = async (data: PlanConfigForm) => {
    try {
      setIsGenerating(true)
      
      const config: SmartPlanConfig = {
        ...data,
        preferredTrainingDays: selectedDays,
        injuryHistory: injuryHistory.length > 0 ? injuryHistory : undefined
      }

      const response = await trainingIntelligenceAPI.generateSmartPlan(config)
      
      if (response.success) {
        setGeneratedPlan(response.plan)
        toast.success('Smart training plan generated!')
        onPlanCreated?.(response.plan)
      }
    } catch (error) {
      logger.error('ERROR', 'Error generating plan:', { error: error })
      toast.error('Failed to generate training plan')
    } finally {
      setIsGenerating(false)
    }
  }

  const nextStep = async () => {
    const isValid = await trigger()
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addInjury = () => {
    setInjuryHistory([...injuryHistory, { 
      type: '', 
      date: format(new Date(), 'yyyy-MM-dd'), 
      severity: 'minor' 
    }])
  }

  const removeInjury = (index: number) => {
    setInjuryHistory(injuryHistory.filter((_, i) => i !== index))
  }

  const updateInjury = (index: number, field: string, value: any) => {
    const updated = [...injuryHistory]
    updated[index] = { ...updated[index], [field]: value }
    setInjuryHistory(updated)
  }

  const toggleDay = (day: string) => {
    const updated = selectedDays.includes(day) 
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day]
    setSelectedDays(updated)
    setValue('preferredTrainingDays', updated)
  }

  const resetForm = () => {
    setCurrentStep(1)
    setGeneratedPlan(null)
    setInjuryHistory([])
    setSelectedDays([])
  }

  const stepTitles = [
    'Race Goal',
    'Fitness Profile', 
    'Training Preferences',
    'Health & Experience'
  ]

  if (generatedPlan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-8 h-8 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Training Plan Generated</h2>
          </div>
          <button
            onClick={resetForm}
            className="btn btn-secondary"
          >
            Create Another Plan
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Plan Overview */}
          <Card className="bg-gray-900 border-gray-800">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-coral flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{generatedPlan.name}</h3>
                <p className="text-gray-400">{generatedPlan.description}</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div>
                <p className="text-sm text-gray-400">Duration</p>
                <Metric className="text-white">{generatedPlan.duration} weeks</Metric>
              </div>
              <div>
                <p className="text-sm text-gray-400">Smart Features</p>
                <Metric className="text-coral">
                  {Object.values(generatedPlan.aiFeatures).filter(Boolean).length} enabled
                </Metric>
              </div>
              <div>
                <p className="text-sm text-gray-400">Adaptation</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${generatedPlan.adaptationEnabled ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <span className="text-white">
                    {generatedPlan.adaptationEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Intelligence</p>
                <Metric className="text-blue-400">
                  {Object.values(generatedPlan.intelligenceFeatures).filter(Boolean).length}/4
                </Metric>
              </div>
            </div>

            <button className="btn btn-primary w-full flex items-center justify-center gap-2">
              <PlayIcon className="w-4 h-4" />
              Start Training Plan
            </button>
          </Card>

          {/* Smart Features */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-gray-900 border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Smart Features</h3>
              <div className="space-y-3">
                {Object.entries(generatedPlan.aiFeatures).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center justify-between">
                    <span className="text-gray-300 capitalize">
                      {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <div className={`w-4 h-4 rounded-full ${enabled ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Intelligence Features</h3>
              <div className="space-y-3">
                {Object.entries(generatedPlan.intelligenceFeatures).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center justify-between">
                    <span className="text-gray-300 capitalize">
                      {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <div className={`w-4 h-4 rounded-full ${enabled ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SparklesIcon className="w-8 h-8 text-coral" />
        <h2 className="text-2xl font-bold text-white">Smart Plan Generator</h2>
      </div>

      {/* Progress Steps */}
      <Card className="bg-gray-900 border-gray-800">
        <div className="flex items-center justify-between mb-6">
          {stepTitles.map((title, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep > index + 1 ? 'bg-green-400 text-white' :
                currentStep === index + 1 ? 'bg-coral text-white' :
                'bg-gray-700 text-gray-400'
              }`}>
                {currentStep > index + 1 ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              {index < stepTitles.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  currentStep > index + 1 ? 'bg-green-400' : 'bg-gray-700'
                }`}></div>
              )}
            </div>
          ))}
        </div>
        <h3 className="text-lg font-semibold text-white">Step {currentStep}: {stepTitles[currentStep - 1]}</h3>
      </Card>

      {/* Form Steps */}
      <form onSubmit={handleSubmit(onSubmitPlan)} className="space-y-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Race Goal */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-gray-900 border-gray-800">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrophyIcon className="w-6 h-6 text-coral" />
                    <h3 className="text-lg font-semibold text-white">Tell us about your race goal</h3>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Race Distance
                      </label>
                      <select
                        {...register('targetRace.distance')}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                      >
                        {raceDistances.map(distance => (
                          <option key={distance.value} value={distance.value}>
                            {distance.label}
                          </option>
                        ))}
                      </select>
                      {errors.targetRace?.distance && (
                        <p className="text-red-400 text-sm mt-1">{errors.targetRace.distance.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Target Race Date
                      </label>
                      <input
                        type="date"
                        {...register('targetRace.date')}
                        min={format(addDays(new Date(), 7), 'yyyy-MM-dd')}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                      />
                      {errors.targetRace?.date && (
                        <p className="text-red-400 text-sm mt-1">{errors.targetRace.date.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Race Name (Optional)
                      </label>
                      <input
                        type="text"
                        {...register('targetRace.name')}
                        placeholder="e.g., Boston Marathon"
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Time Goal (Optional)
                      </label>
                      <input
                        type="number"
                        {...register('targetRace.timeGoal', { valueAsNumber: true })}
                        placeholder="Goal time in seconds"
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-500/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarDaysIcon className="w-5 h-5 text-blue-400" />
                      <h4 className="font-medium text-blue-400">Recommended Training Duration</h4>
                    </div>
                    <p className="text-sm text-gray-300">
                      For {raceDistances.find(d => d.value === targetDistance)?.label}, we recommend{' '}
                      <span className="text-blue-400 font-medium">
                        {raceDistances.find(d => d.value === targetDistance)?.weeks} weeks
                      </span>{' '}
                      of training.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Fitness Profile */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-gray-900 border-gray-800">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <UserIcon className="w-6 h-6 text-coral" />
                    <h3 className="text-lg font-semibold text-white">Your fitness profile</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Current Fitness Level
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {fitnessLevels.map(level => (
                        <label
                          key={level.value}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            fitnessLevel === level.value
                              ? 'border-coral bg-coral/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            {...register('fitnessLevel')}
                            value={level.value}
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white">{level.label}</h4>
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              fitnessLevel === level.value
                                ? 'border-coral bg-coral'
                                : 'border-gray-500'
                            }`}></div>
                          </div>
                          <p className="text-sm text-gray-400">{level.description}</p>
                          <p className="text-xs text-coral mt-1">{level.weeklyMileage}</p>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Weekly Mileage (km)
                      </label>
                      <input
                        type="number"
                        {...register('currentWeeklyMileage', { valueAsNumber: true })}
                        placeholder="e.g., 25"
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Longest Recent Run (km)
                      </label>
                      <input
                        type="number"
                        {...register('longestRecentRun', { valueAsNumber: true })}
                        placeholder="e.g., 10"
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Training Preferences */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-gray-900 border-gray-800">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CalendarDaysIcon className="w-6 h-6 text-coral" />
                    <h3 className="text-lg font-semibold text-white">Training preferences</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Preferred Training Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedDays.includes(day.value)
                              ? 'bg-coral text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Select {fitnessLevel === 'beginner' ? '3-4' : fitnessLevel === 'intermediate' ? '4-5' : '5-6'} days for optimal results
                    </p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Available Time
                      </label>
                      <select
                        {...register('availableTime')}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                      >
                        <option value="limited">Limited (30-45 min)</option>
                        <option value="moderate">Moderate (45-90 min)</option>
                        <option value="extensive">Extensive (90+ min)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Running Experience
                      </label>
                      <select
                        {...register('experience')}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                      >
                        <option value="novice">Novice (&lt; 6 months)</option>
                        <option value="beginner">Beginner (6-12 months)</option>
                        <option value="intermediate">Intermediate (1-3 years)</option>
                        <option value="advanced">Advanced (3-5 years)</option>
                        <option value="expert">Expert (5+ years)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Training Intensity
                      </label>
                      <select
                        {...register('preferredIntensity')}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                      >
                        <option value="low">Low & Steady</option>
                        <option value="moderate">Balanced</option>
                        <option value="high">High Intensity</option>
                      </select>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${
                    availableTime === 'limited' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <ClockIcon className={`w-5 h-5 ${
                        availableTime === 'limited' ? 'text-yellow-400' : 'text-blue-400'
                      }`} />
                      <h4 className={`font-medium ${
                        availableTime === 'limited' ? 'text-yellow-400' : 'text-blue-400'
                      }`}>
                        Time Allocation Advice
                      </h4>
                    </div>
                    <p className="text-sm text-gray-300">
                      {availableTime === 'limited' && 'With limited time, we\'ll focus on efficient, high-quality workouts that maximize your progress.'}
                      {availableTime === 'moderate' && 'Perfect! This gives us flexibility to include variety in your training while respecting your schedule.'}
                      {availableTime === 'extensive' && 'Excellent! We can include longer runs, recovery sessions, and cross-training for optimal development.'}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Health & Experience */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-gray-900 border-gray-800">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <HeartIcon className="w-6 h-6 text-coral" />
                    <h3 className="text-lg font-semibold text-white">Health information & experience</h3>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Age (Optional)
                      </label>
                      <input
                        type="number"
                        {...register('age', { valueAsNumber: true })}
                        placeholder="e.g., 30"
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Resting HR (Optional)
                      </label>
                      <input
                        type="number"
                        {...register('restingHeartRate', { valueAsNumber: true })}
                        placeholder="e.g., 60"
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max HR (Optional)
                      </label>
                      <input
                        type="number"
                        {...register('maxHeartRate', { valueAsNumber: true })}
                        placeholder="e.g., 190"
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-coral"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-300">
                        Injury History (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={addInjury}
                        className="text-sm text-coral hover:text-coral-light flex items-center gap-1"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Add Injury
                      </button>
                    </div>
                    
                    {injuryHistory.length > 0 && (
                      <div className="space-y-3">
                        {injuryHistory.map((injury, index) => (
                          <div key={index} className="p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium text-white">Injury #{index + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeInjury(index)}
                                className="text-gray-400 hover:text-red-400"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <select
                                value={injury.type}
                                onChange={(e) => updateInjury(index, 'type', e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                              >
                                <option value="">Select injury type</option>
                                {injuryTypes.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                              <input
                                type="date"
                                value={injury.date}
                                onChange={(e) => updateInjury(index, 'date', e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                              />
                              <select
                                value={injury.severity}
                                onChange={(e) => updateInjury(index, 'severity', e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                              >
                                <option value="minor">Minor</option>
                                <option value="moderate">Moderate</option>
                                <option value="severe">Severe</option>
                              </select>
                            </div>
                            <label className="flex items-center gap-2 mt-2">
                              <input
                                type="checkbox"
                                checked={injury.chronic || false}
                                onChange={(e) => updateInjury(index, 'chronic', e.target.checked)}
                                className="rounded"
                              />
                              <span className="text-sm text-gray-300">Chronic/recurring</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-green-500/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      <h4 className="font-medium text-green-400">Ready to Generate</h4>
                    </div>
                    <p className="text-sm text-gray-300">
                      All information collected! Your personalized training plan will include advanced 
                      adaptations based on your profile and injury prevention strategies.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  currentStep > i ? 'bg-coral' : 'bg-gray-600'
                }`}
              ></div>
            ))}
          </div>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary flex items-center gap-2"
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isGenerating}
              className="btn btn-primary flex items-center gap-2"
            >
              {isGenerating && (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              )}
              <SparklesIcon className="w-4 h-4" />
              Generate Plan
            </button>
          )}
        </div>
      </form>
    </div>
  )
}