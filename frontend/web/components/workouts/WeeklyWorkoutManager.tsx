import { useState, useEffect } from 'react'
// Cookie-based auth: avoid direct token access
import { logger } from '../../lib/productionLogger'

interface PlannedWorkout {
  id: string
  scheduledDate: string
  dayOfWeek: string
  type: string
  name: string
  description: string
  targetMetrics: {
    totalDistance?: number
    totalDuration?: number
    averagePace?: number
    heartRateZone?: { min: number, max: number }
    calories?: number
  }
  status: 'scheduled' | 'completed' | 'skipped' | 'partial' | 'rescheduled'
  completionMetrics?: {
    actualDistance?: number
    actualDuration?: number
    actualPace?: number
    completionDate?: string
    effortLevel?: number
    notes?: string
  }
}

interface WeeklyWorkoutManagerProps {
  className?: string
}

export default function WeeklyWorkoutManager({ className = '' }: WeeklyWorkoutManagerProps) {
  const [workouts, setWorkouts] = useState<PlannedWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingWorkout, setUpdatingWorkout] = useState<string | null>(null)

  useEffect(() => {
    fetchCurrentWeekWorkouts()
  }, [])

  const fetchCurrentWeekWorkouts = async () => {
    try {
      setLoading(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      try {
        // Try to fetch real data from backend
        const response = await fetch(`${API_BASE_URL}/api/training-plans/weekly/current`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setWorkouts(data.workouts || [])
            setError(null)
            return
          }
        } else {
          logger.info('COMPONENT', 'API response not ok:', { status: response.status, statusText: response.statusText })
          throw new Error(`API error: ${response.status}`)
        }
      } catch (apiError) {
        logger.error('ERROR', 'API failed:', { error: apiError })
        setError('Neizdevās ielādēt treniņu datus')
        setWorkouts([])
        return
      }
      
      // No fallback to mock data - show empty state instead
      logger.info('COMPONENT', 'No fallback data used - showing empty state')
      setWorkouts([])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      logger.error('ERROR', 'Error fetching weekly workouts:', { error: err })
    } finally {
      setLoading(false)
    }
  }

  const updateWorkoutStatus = async (workoutId: string, status: 'completed' | 'skipped', completionData: any = {}) => {
    try {
      setUpdatingWorkout(workoutId)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      const response = await fetch(`${API_BASE_URL}/api/training-plans/weekly/workouts/${workoutId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          completionData
        })
      })

      if (!response.ok) {
        throw new Error('Neizdevās atjaunināt treniņa statusu')
      }

      // Refresh workouts list
      await fetchCurrentWeekWorkouts()
      
    } catch (err) {
      logger.error('ERROR', 'Error updating workout status:', { error: err })
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUpdatingWorkout(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Šodien'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Rīt'
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`
    }
    return `${minutes}min`
  }

  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(1)} km`
  }

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'easy':
        return 'bg-green-500'
      case 'tempo':
        return 'bg-yellow-500'
      case 'long':
        return 'bg-blue-500'
      case 'intervals':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-400/20'
      case 'skipped':
        return 'text-red-400 bg-red-400/20'
      case 'scheduled':
        return 'text-yellow-400 bg-yellow-400/20'
      default:
        return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Pabeigts'
      case 'skipped':
        return 'Izlaists'
      case 'scheduled':
        return 'Plānots'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Šīs nedēļas treniņi</h3>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-400">Ielādē treniņus...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Šīs nedēļas treniņi</h3>
        </div>
        <div className="text-center py-8 text-red-400">
          {error}
        </div>
      </div>
    )
  }

  if (workouts.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Šīs nedēļas treniņi</h3>
        </div>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0-8V9a2 2 0 002-2h6a2 2 0 012 2v6a2 2 0 01-2 2h-6a2 2 0 01-2-2v-2M7 5l2 2m0 0v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2h-6a2 2 0 00-2 2v2z" />
          </svg>
          <h4 className="text-white font-medium mb-2">Nav plānotu treniņu</h4>
          <p className="text-gray-400 text-sm">Šai nedēļai nav izveidots neviens treniņš</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Šīs nedēļas treniņi</h3>
        <button
          onClick={fetchCurrentWeekWorkouts}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {workouts.map((workout) => (
          <div key={workout.id} className="bg-bg border border-gray-800 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full ${getWorkoutTypeColor(workout.type)}`}></div>
                  <h4 className="text-white font-medium">{workout.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(workout.status)}`}>
                    {getStatusText(workout.status)}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-2">{formatDate(workout.scheduledDate)}</p>
                <p className="text-gray-300 text-sm mb-2">{workout.description}</p>
                
                {workout.targetMetrics && (
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {workout.targetMetrics.totalDistance && (
                      <span>{formatDistance(workout.targetMetrics.totalDistance)}</span>
                    )}
                    {workout.targetMetrics.totalDuration && (
                      <span>{formatDuration(workout.targetMetrics.totalDuration)}</span>
                    )}
                    {workout.targetMetrics.calories && (
                      <span>{workout.targetMetrics.calories} cal</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {workout.status === 'scheduled' && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateWorkoutStatus(workout.id, 'completed')}
                  disabled={updatingWorkout === workout.id}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm transition-colors disabled:opacity-50"
                >
                  {updatingWorkout === workout.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                      Updating...
                    </div>
                  ) : (
                    'Atzīmēt kā pabeigtu'
                  )}
                </button>
                <button
                  onClick={() => updateWorkoutStatus(workout.id, 'skipped', { reason: 'Lietotājs izlaiža treniņu' })}
                  disabled={updatingWorkout === workout.id}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm transition-colors disabled:opacity-50"
                >
                  Izlaist
                </button>
              </div>
            )}

            {workout.completionMetrics && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Pabeigšanas dati:</p>
                <div className="flex items-center gap-4 text-xs text-gray-300">
                  {workout.completionMetrics.actualDistance && (
                    <span>Faktiskā distance: {formatDistance(workout.completionMetrics.actualDistance)}</span>
                  )}
                  {workout.completionMetrics.actualDuration && (
                    <span>Faktiskais laiks: {formatDuration(workout.completionMetrics.actualDuration)}</span>
                  )}
                </div>
                {workout.completionMetrics.notes && (
                  <p className="text-xs text-gray-400 mt-1">{workout.completionMetrics.notes}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
