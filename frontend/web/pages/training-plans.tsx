import { useState, useEffect } from 'react'
import ProtectedLayout from '../components/layout/ProtectedLayout'
import { useAuth, withAuth } from '../contexts/AuthContext'
import { getAuthToken } from '../lib/auth'
import Footer from '../components/Footer'
import { logger } from '../lib/productionLogger'
// import { useAIConversationTracker } from '../lib/aiConversationTracker' // Removed AI tracking

interface TrainingPlan {
  id: string
  name: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number // weeks
  workoutsPerWeek: number
  targetType: 'distance' | 'time' | 'strength' | 'mixed'
  goal: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    role: 'coach' | 'admin'
  }
  weeks: TrainingWeek[]
  isActive: boolean
  enrolledCount: number
  rating: number
  createdAt: string
  updatedAt: string
}

interface TrainingWeek {
  weekNumber: number
  description: string
  workouts: TrainingWorkout[]
}

interface TrainingWorkout {
  id: string
  dayOfWeek: number // 0=Sunday, 1=Monday, etc.
  name: string
  type: 'running' | 'walking' | 'cycling' | 'strength' | 'rest'
  duration?: number // minutes
  distance?: number // meters
  intensity: 'easy' | 'moderate' | 'hard' | 'interval'
  description: string
  notes?: string
}

interface UserEnrollment {
  planId: string
  currentWeek: number
  startDate: string
  completedWorkouts: string[]
  isActive: boolean
}

function TrainingPlansPage() {
  const { user, isCoach, isAdmin } = useAuth()
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([])
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weeklyPlanLoading, setWeeklyPlanLoading] = useState(false)
  const [weeklyPlanSuccess, setWeeklyPlanSuccess] = useState(false)
  const [filters, setFilters] = useState({
    difficulty: 'all' as 'all' | 'beginner' | 'intermediate' | 'advanced',
    targetType: 'all' as 'all' | 'distance' | 'time' | 'strength' | 'mixed',
    enrolled: false
  })

  const fetchTrainingPlans = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      
      const params = new URLSearchParams()
      if (filters.difficulty !== 'all') params.append('difficulty', filters.difficulty)
      if (filters.targetType !== 'all') params.append('targetType', filters.targetType)
      if (filters.enrolled) params.append('enrolled', 'true')

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${API_BASE_URL}/api/training-plans?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch training plans')
      }

      const data = await response.json()
      setPlans(data.plans || [])
      setEnrollments(data.enrollments || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      logger.error('ERROR', 'Error fetching training plans:', { error: err })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTrainingPlans()
    }
  }, [user, JSON.stringify(filters)])

  const enrollInPlan = async (planId: string) => {
    try {
      const token = getAuthToken()
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${API_BASE_URL}/api/training-plans/${planId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to enroll in plan')
      }

      fetchTrainingPlans()
    } catch (err) {
      logger.error('ERROR', 'Error enrolling in plan:', { error: err })
    }
  }

  const unenrollFromPlan = async (planId: string) => {
    try {
      const token = getAuthToken()
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${API_BASE_URL}/api/training-plans/${planId}/unenroll`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to unenroll from plan')
      }

      fetchTrainingPlans()
    } catch (err) {
      logger.error('ERROR', 'Error unenrolling from plan:', { error: err })
    }
  }

  // const { trackQuickExchange } = useAIConversationTracker({
  //   conversationType: 'training',
  //   source: 'web',
  //   userEmail: user?.email
  // })

  const generateWeeklyPlan = async () => {
    try {
      setWeeklyPlanLoading(true)
      setWeeklyPlanSuccess(false)
      const token = getAuthToken()
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      const response = await fetch(`${API_BASE_URL}/api/training-plans/weekly/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userPreferences: {
            trainingDays: ['monday', 'wednesday', 'friday', 'sunday'],
            fitnessLevel: 'intermediate',
            weeklyDistanceGoal: 25,
            timeAvailable: 60
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate weekly plan')
      }

      const data = await response.json()
      logger.info('COMPONENT', '✅ Weekly plan generated:', { data })
      
      // Track the successful plan generation
      logger.info('COMPONENT', '✅ Weekly plan generated successfully:', { data: data.data })
      
      setWeeklyPlanSuccess(true)
      setTimeout(() => setWeeklyPlanSuccess(false), 5000) // Hide success message after 5 seconds
      
    } catch (err) {
      logger.error('ERROR', 'Error generating weekly plan:', { error: err })
      const errorMessage = err instanceof Error ? err.message : 'Neizdevās izveidot nedēļas plānu'
      
      // Track the failed plan generation
      logger.error('ERROR', '❌ Weekly plan generation failed:', { error: errorMessage })
      
      setError(errorMessage)
    } finally {
      setWeeklyPlanLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-900/30 text-green-300 border-green-700'
      case 'intermediate':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-700'
      case 'advanced':
        return 'bg-red-900/30 text-red-300 border-red-700'
      default:
        return 'bg-gray-900/30 text-gray-300 border-gray-700'
    }
  }

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'easy':
        return 'bg-green-500'
      case 'moderate':
        return 'bg-yellow-500'
      case 'hard':
        return 'bg-red-500'
      case 'interval':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getWorkoutTypeIcon = (type: string) => {
    switch (type) {
      case 'running':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'strength':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )
      case 'rest':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
    }
  }

  const isEnrolled = (planId: string) => {
    return enrollments.some(e => e.planId === planId && e.isActive)
  }

  const getEnrollmentProgress = (planId: string) => {
    const enrollment = enrollments.find(e => e.planId === planId && e.isActive)
    if (!enrollment) return null
    
    const plan = plans.find(p => p.id === planId)
    if (!plan) return null

    const totalWorkouts = plan.weeks.reduce((total, week) => total + week.workouts.length, 0)
    const completedWorkouts = enrollment.completedWorkouts.length
    
    return {
      currentWeek: enrollment.currentWeek,
      totalWeeks: plan.duration,
      completedWorkouts,
      totalWorkouts,
      progress: Math.round((completedWorkouts / totalWorkouts) * 100)
    }
  }

  return (
    <ProtectedLayout title="Treniņu plāni">
      <div className="min-h-screen bg-adaptive relative overflow-x-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, rgba(255, 107, 107, 0.1) 0%, transparent 50%)`
        }}></div>
        
        <div className="relative z-10 p-6 space-y-6">
          {/* Header */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0-8V9a2 2 0 002-2h6a2 2 0 012 2v6a2 2 0 01-2 2h-6a2 2 0 01-2-2v-2M7 5l2 2m0 0v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2h-6a2 2 0 00-2 2v2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-adaptive-white">Treniņu plāni</h1>
                <p className="text-adaptive-light">Personalizēti skrējiena plāni jūsu mērķiem</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4">
                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters({ ...filters, difficulty: e.target.value as any })}
                  className="glass-input"
                >
                  <option value="all">Visi līmeņi</option>
                  <option value="beginner">Iesācējs</option>
                  <option value="intermediate">Vidējs</option>
                  <option value="advanced">Pieredzes bagāts</option>
                </select>

                <select
                  value={filters.targetType}
                  onChange={(e) => setFilters({ ...filters, targetType: e.target.value as any })}
                  className="glass-input"
                >
                  <option value="all">Visi mērķi</option>
                  <option value="distance">Distance</option>
                  <option value="time">Laiks</option>
                  <option value="strength">Spēks</option>
                  <option value="mixed">Jaukts</option>
                </select>

                <label className="flex items-center gap-2 text-adaptive-light">
                  <input
                    type="checkbox"
                    checked={filters.enrolled}
                    onChange={(e) => setFilters({ ...filters, enrolled: e.target.checked })}
                    className="w-4 h-4 text-orange-500 bg-transparent border-white/30 rounded focus:ring-orange-500"
                  />
                  Tikai mani plāni
                </label>
              </div>

              {(isCoach || isAdmin) && (
                <button className="glass-button-primary">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Izveidot plānu
                </button>
              )}
            </div>
          </div>

          {/* Weekly Plan Generator */}
          <div className="glass-card p-6 bg-gradient-to-r from-orange-500/10 to-purple-600/10 border-orange-500/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-adaptive-white mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Nedēļas Treniņplāns
                </h3>
                <p className="text-adaptive-light text-sm mb-1">
                  Ģenerē personalizētu nedēļas treniņprogrammu nākamajai nedēļai
                </p>
                <p className="text-adaptive-muted text-xs">
                  Izmanto profesionālu algoritmu, lai izveidotu optimālu treniņu sadalījumu atbilstoši jūsu līmenim
                </p>
              </div>
              <div className="flex items-center gap-3">
                {weeklyPlanSuccess && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Plāns izveidots!
                  </div>
                )}
                <button
                  onClick={generateWeeklyPlan}
                  disabled={weeklyPlanLoading}
                  className="glass-button-primary flex items-center gap-2 min-w-[140px] justify-center"
                >
                  {weeklyPlanLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Ģenerē...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Ģenerēt plānu
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          {loading ? (
            <div className="glass-card p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-adaptive-light">Ielādē treniņu plānus...</p>
            </div>
          ) : error ? (
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-400">Error ielādējot plānus: {error}</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0-8V9a2 2 0 002-2h6a2 2 0 012 2v6a2 2 0 01-2 2h-6a2 2 0 01-2-2v-2M7 5l2 2m0 0v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2h-6a2 2 0 00-2 2v2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-adaptive-white mb-2">Nav pieejami treniņu plāni</h3>
              <p className="text-adaptive-light">Pašlaik nav pieejami treniņu plāni ar jūsu izvēlētajiem filtriem.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const enrolled = isEnrolled(plan.id)
                const progress = getEnrollmentProgress(plan.id)
                
                return (
                  <div key={plan.id} className="glass-card p-6 hover:scale-105 transition-transform cursor-pointer" onClick={() => setSelectedPlan(plan)}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-adaptive-white mb-1">{plan.name}</h3>
                        <p className="text-sm text-adaptive-light mb-2">{plan.description}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded border text-xs font-medium ${getDifficultyColor(plan.difficulty)}`}>
                            {plan.difficulty === 'beginner' ? 'Iesācējs' : 
                             plan.difficulty === 'intermediate' ? 'Vidējs' : 'Pieredzes bagāts'}
                          </span>
                          <span className="text-xs text-adaptive-muted">{plan.duration} nedēļas</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm">{plan.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-adaptive-muted">Treniņi nedēļā:</span>
                        <div className="text-adaptive-white font-medium">{plan.workoutsPerWeek}</div>
                      </div>
                      <div>
                        <span className="text-adaptive-muted">Dalībnieki:</span>
                        <div className="text-adaptive-white font-medium">{plan.enrolledCount}</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-adaptive-muted text-sm">Mērķis:</span>
                      <div className="text-adaptive-white">{plan.goal}</div>
                    </div>

                    <div className="mb-4">
                      <span className="text-adaptive-muted text-sm">Trenera:</span>
                      <div className="text-adaptive-white">{plan.createdBy.firstName} {plan.createdBy.lastName}</div>
                    </div>

                    {progress && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-adaptive-muted">Progress</span>
                          <span className="text-orange-400">{progress.progress}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${progress.progress }%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-adaptive-muted mt-1">
                          <span>Nedēļa {progress.currentWeek}/{progress.totalWeeks}</span>
                          <span>{progress.completedWorkouts}/{progress.totalWorkouts} treniņi</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {enrolled ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              unenrollFromPlan(plan.id)
                            }}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm"
                          >
                            Izstāties
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 glass-button-primary text-sm"
                          >
                            Turpināt
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            enrollInPlan(plan.id)
                          }}
                          className="w-full glass-button-primary text-sm"
                        >
                          Sākt plānu
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Plan Detail Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-2">{selectedPlan.name}</h3>
                  <p className="text-gray-300 mb-4">{selectedPlan.description}</p>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded border text-sm font-medium ${getDifficultyColor(selectedPlan.difficulty)}`}>
                      {selectedPlan.difficulty === 'beginner' ? 'Iesācējs' : 
                       selectedPlan.difficulty === 'intermediate' ? 'Vidējs' : 'Pieredzes bagāts'}
                    </span>
                    <span className="text-sm text-gray-400">{selectedPlan.duration} nedēļas</span>
                    <span className="text-sm text-gray-400">{selectedPlan.workoutsPerWeek} treniņi/nedēļā</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {selectedPlan.weeks.map((week) => (
                  <div key={week.weekNumber} className="border border-gray-800 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-2">
                      Nedēļa {week.weekNumber}
                    </h4>
                    <p className="text-gray-400 mb-4">{week.description}</p>
                    
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {(week.workouts || []).map((workout) => (
                        <div key={workout.id} className="bg-bg p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1 rounded ${getIntensityColor(workout.intensity)} text-white`}>
                              {getWorkoutTypeIcon(workout.type)}
                            </div>
                            <div>
                              <div className="text-white font-medium text-sm">{workout.name}</div>
                              <div className="text-xs text-gray-400 capitalize">
                                {['Svētd.', 'Pirmd.', 'Otrd.', 'Trešd.', 'Ceturtd.', 'Piektd.', 'Sestd.'][workout.dayOfWeek]}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-300 mb-2">{workout.description}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {workout.duration && <span>{workout.duration} min</span>}
                            {workout.distance && <span>{(workout.distance / 1000).toFixed(1)} km</span>}
                            <span className="capitalize">{workout.intensity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </ProtectedLayout>
  )
}

export default withAuth(TrainingPlansPage)
