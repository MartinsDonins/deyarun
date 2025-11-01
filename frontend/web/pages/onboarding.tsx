import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth, withAuth } from '../contexts/AuthContext'
import { logger } from '../lib/productionLogger';
import { 
  CheckIcon, 
  UserIcon, 
  HeartIcon, 
  FlagIcon,
  CogIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: JSX.Element
  completed: boolean
  required: boolean
}

function Onboarding() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([
    {
      id: 'profile',
      title: 'Pabeigt profilu',
      description: 'Pievienojiet savu augumu, svaru un citu pamata informāciju',
      icon: <UserIcon className="w-6 h-6" />,
      completed: false,
      required: true
    },
    {
      id: 'health',
      title: 'Veselības informācija',
      description: 'Norādiet savu fitness līmeni un veselības stāvokli',
      icon: <HeartIcon className="w-6 h-6" />,
      completed: false,
      required: true
    },
    {
      id: 'goals',
      title: 'Treniņu mērķi',
      description: 'Iestatiet savus skriešanas mērķus un preferences',
      icon: <FlagIcon className="w-6 h-6" />,
      completed: false,
      required: true
    },
    {
      id: 'preferences',
      title: 'Lietotnēs iestatījumi',
      description: 'Pielāgojiet paziņojumus un citus iestatījumus',
      icon: <CogIcon className="w-6 h-6" />,
      completed: false,
      required: false
    }
  ])

  // Check user completion status on mount
  useEffect(() => {
    if (user) {
      checkOnboardingStatus()
    }
  }, [user])

  const checkOnboardingStatus = () => {
    if (!user) return

    const updatedSteps = onboardingSteps.map(step => {
      switch (step.id) {
        case 'profile':
          return {
            ...step,
            completed: !!(user.height && user.weight && user.birthDate && user.gender)
          }
        case 'health':
          return {
            ...step,
            completed: !!(user.fitnessLevel && user.stressLevel)
          }
        case 'goals':
          return {
            ...step,
            completed: !!(user.weeklyGoal && user.preferredDistance)
          }
        case 'preferences':
          return {
            ...step,
            completed: !!(user.theme) // Basic preference - theme is set
          }
        default:
          return step
      }
    })

    setOnboardingSteps(updatedSteps)
    
    // Find first incomplete required step
    const firstIncomplete = updatedSteps.findIndex(step => step.required && !step.completed)
    if (firstIncomplete >= 0) {
      setCurrentStep(firstIncomplete)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    const step = onboardingSteps[stepIndex]
    
    switch (step.id) {
      case 'profile':
        router.push('/profile/edit?onboarding=true')
        break
      case 'health':
        router.push('/profile/health?onboarding=true')
        break
      case 'goals':
        router.push('/profile/goals?onboarding=true')
        break
      case 'preferences':
        router.push('/settings?onboarding=true')
        break
    }
  }

  const handleSkipOnboarding = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      logger.info('COMPONENT', '🎯 Onboarding complete attempt:', {
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : null,
        userInfo: user ? { id: user.id, email: user.email } : null
      })

      // Mark onboarding as completed even if not all optional steps are done
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/user/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Ensure we send empty JSON body
      })

      logger.info('COMPONENT', '📊 Onboarding response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (response.ok) {
        const result = await response.json()
        logger.info('COMPONENT', '✅ Onboarding completed successfully:', { result })
        router.push('/dashboard')
      } else {
        const errorData = await response.json()
        logger.error('ERROR', '❌ Failed to complete onboarding:', { error: {
          status: response.status,
          error: errorData
        } })
        // Still redirect to dashboard - user can complete onboarding later
        router.push('/dashboard')
      }
    } catch (error) {
      logger.error('ERROR', '❌ Error completing onboarding:', { error: error })
      // Redirect anyway - don't block user
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleContinueToDashboard = () => {
    // Check if all required steps are completed
    const requiredSteps = onboardingSteps.filter(step => step.required)
    const completedRequired = requiredSteps.filter(step => step.completed)
    
    if (completedRequired.length === requiredSteps.length) {
      handleSkipOnboarding()
    }
  }

  const requiredSteps = onboardingSteps.filter(step => step.required)
  const completedRequiredSteps = requiredSteps.filter(step => step.completed)
  const allRequiredCompleted = completedRequiredSteps.length === requiredSteps.length

  const completionPercentage = (completedRequiredSteps.length / requiredSteps.length) * 100

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-full bg-coral/20 border border-coral flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Sveicināti DeyaRun!
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Lai sāktu savu skrējiena ceļojumu ar personalizētiem treniņu plāniem, 
            lūdzu pabeidziet sava profila iestatīšanu.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(completionPercentage)}% pabeigts</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-coral to-orange-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {onboardingSteps.map((step, index) => (
            <div 
              key={step.id} 
              className={`relative bg-slate-800 rounded-lg p-6 border transition-all duration-200 cursor-pointer hover:bg-slate-700/50 ${
                step.completed 
                  ? 'border-green-500/50 bg-green-500/10' 
                  : step.required 
                    ? 'border-coral/50' 
                    : 'border-slate-600'
              } ${currentStep === index ? 'ring-2 ring-coral' : ''}`}
              onClick={() => handleStepClick(index)}
            >
              {/* Completion Badge */}
              {step.completed && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 p-3 rounded-lg ${
                  step.completed 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-coral/20 text-coral'
                }`}>
                  {step.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {step.title}
                    {step.required && (
                      <span className="text-coral text-sm ml-1">*</span>
                    )}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {step.description}
                  </p>
                  
                  <div className="flex items-center text-sm">
                    {step.completed ? (
                      <span className="text-green-400 font-medium">Pabeigts</span>
                    ) : (
                      <span className="text-coral font-medium flex items-center">
                        Turpināt
                        <ArrowRightIcon className="w-4 h-4 ml-1" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {allRequiredCompleted ? (
            <button
              onClick={handleContinueToDashboard}
              disabled={loading}
              className="btn-primary px-8 py-3"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Ielādē...
                </div>
              ) : (
                'Doties uz Dashboard'
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleStepClick(currentStep)}
                className="btn-primary px-8 py-3"
              >
                Turpināt iestatīšanu
              </button>
              
              {/* Only show skip button if user has at least some basic profile info */}
              {user?.firstName && user?.lastName && user?.birthDate && user?.gender && (
                <button
                  onClick={handleSkipOnboarding}
                  disabled={loading}
                  className="btn-secondary px-8 py-3"
                >
                  {loading ? 'Ielādē...' : 'Izlaist pagaidām'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            * Obligātie soļi nepieciešami personalizētu treniņu plānu izveidei
          </p>
        </div>
      </div>
    </div>
  )
}

export default withAuth(Onboarding)