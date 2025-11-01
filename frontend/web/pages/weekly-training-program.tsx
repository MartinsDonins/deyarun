import { useState, useEffect } from 'react'
import ProtectedLayout from '../components/layout/ProtectedLayout'
import { useAuth } from '../contexts/AuthContext'
import { getAuthToken } from '../lib/auth'
import Footer from '../components/Footer'
import WeeklyProgramViewer from '../components/training/WeeklyProgramViewer'
import ExerciseVideoPlayer from '../components/training/ExerciseVideoPlayer'

interface Exercise {
  exerciseId: string
  name: string
  description: string
  videoUrl: string
  duration?: {
    min: number
    max: number
  }
  repetitions?: {
    min: number
    max: number
  }
  sets?: {
    min: number
    max: number
  }
  targetMuscles?: string[]
}

interface PlannedWorkout {
  id: string
  scheduledDate: string
  dayOfWeek: string
  type: 'easy' | 'tempo' | 'intervals' | 'long' | 'recovery'
  name: string
  description: string
  targetMetrics: {
    totalDistance: number
    totalDuration: number
    averagePace: number
    heartRateZone?: {
      min: number
      max: number
    }
    calories: number
  }
  exercises?: {
    warmup: Exercise[]
    cooldown: Exercise[]
    strengthening: Exercise[]
  }
  warmupInstructions: string
  cooldownInstructions: string
  coachingTips: string[]
  status: 'scheduled' | 'completed' | 'skipped' | 'partial'
  completionMetrics?: {
    actualDistance: number
    actualDuration: number
    actualPace: number
    completionDate: string
    effortLevel: number
    notes: string
  }
}

export default function WeeklyTrainingProgramPage() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState<PlannedWorkout[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<PlannedWorkout | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'

  useEffect(() => {
    fetchCurrentWeekProgram()
  }, [])

  const fetchCurrentWeekProgram = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()

      const response = await fetch(`${API_BASE_URL}/api/training-plans/weekly/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Neizdevās ielādēt nedēļas programmu')
      }

      const data = await response.json()
      setWorkouts(data.workouts || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nezināma kļūda')
      console.error('Error fetching weekly program:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateWeeklyProgram = async () => {
    try {
      setGenerating(true)
      const token = getAuthToken()

      const response = await fetch(`${API_BASE_URL}/api/training-plans/weekly/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userPreferences: {
            fitnessLevel: 'intermediate',
            trainingDays: ['monday', 'wednesday', 'friday', 'sunday'],
            weeklyDistanceGoal: 25,
            language: 'lv'
          }
        })
      })

      if (!response.ok) {
        throw new Error('Neizdevās ģenerēt nedēļas programmu')
      }

      const data = await response.json()
      console.log('Program generated:', data)

      // Refresh workouts
      await fetchCurrentWeekProgram()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ģenerēšanas kļūda')
      console.error('Error generating program:', err)
    } finally {
      setGenerating(false)
    }
  }

  const markWorkoutComplete = async (workoutId: string) => {
    try {
      const token = getAuthToken()

      const response = await fetch(`${API_BASE_URL}/api/training-plans/weekly/workouts/${workoutId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'completed',
          completionData: {
            completionDate: new Date().toISOString(),
            effortLevel: 5,
            notes: 'Pabeigts no web aplikācijas'
          }
        })
      })

      if (!response.ok) {
        throw new Error('Neizdevās atjaunināt statusu')
      }

      // Refresh workouts
      await fetchCurrentWeekProgram()
    } catch (err) {
      console.error('Error marking workout complete:', err)
      alert('Neizdevās atzīmēt kā pabeigtu')
    }
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Nedēļas Treniņprogramma</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Personalizēta programma ar vingrojumu video instrukcijām
                </p>
              </div>
              <button
                onClick={generateWeeklyProgram}
                disabled={generating}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? '⏳ Ģenerē...' : '🔄 Ģenerēt Jaunu Programmu'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Ielādē treniņprogrammu...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && workouts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nav aktīvas nedēļas programmas
              </h3>
              <p className="text-gray-600 mb-6">
                Izveidojiet jaunu nedēļas treniņprogrammu, lai sāktu
              </p>
              <button
                onClick={generateWeeklyProgram}
                disabled={generating}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {generating ? 'Ģenerē...' : 'Ģenerēt Programmu'}
              </button>
            </div>
          )}

          {!loading && !error && workouts.length > 0 && (
            <WeeklyProgramViewer
              workouts={workouts}
              onSelectWorkout={setSelectedWorkout}
              onSelectExercise={setSelectedExercise}
              onMarkComplete={markWorkoutComplete}
            />
          )}
        </div>

        {/* Exercise Video Modal */}
        {selectedExercise && (
          <ExerciseVideoPlayer
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
          />
        )}

        <Footer />
      </div>
    </ProtectedLayout>
  )
}
