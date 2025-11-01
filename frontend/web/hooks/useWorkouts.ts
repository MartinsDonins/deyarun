import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
// Cookie-based auth: avoid direct token access
import { logger } from '../lib/productionLogger'

export interface Workout {
  id: string
  userId: string
  name?: string // Workout name
  type: 'running' | 'walking' | 'cycling' | 'other'
  status?: 'planned' | 'in_progress' | 'paused' | 'completed' | 'cancelled' // Workout status
  distance: number // in meters
  duration: number // in seconds
  pace: string // formatted as mm:ss/km
  calories?: number
  heartRateAvg?: number
  heartRateMax?: number
  elevationGain?: number
  weather?: {
    temperature: number
    humidity: number
    conditions: string
  }
  route?: {
    name: string
    coordinates: Array<{ lat: number; lng: number; elevation?: number }>
  }
  notes?: string
  feeling: 1 | 2 | 3 | 4 | 5 // 1=terrible, 5=excellent
  effort: 1 | 2 | 3 | 4 | 5 // 1=very easy, 5=maximum
  startTime: string
  endTime: string
  createdAt: string
  updatedAt: string
  isGenerated?: boolean // Whether this was AI-generated
  source?: 'manual' | 'strava' | 'googlefit' | 'apple_health' | 'garmin' | 'fitbit'
  externalData?: {
    stravaActivityId?: string
    googleFitSessionId?: string
    originalData?: any
  }
  user?: {
    firstName: string
    lastName: string
    avatarUrl?: string
  }
}

export interface WorkoutStats {
  totalWorkouts: number
  totalDistance: number
  totalDuration: number
  averagePace: string
  totalCalories: number
  bestPace: string
  longestRun: number
  thisWeek: {
    workouts: number
    distance: number
    duration: number
  }
  thisMonth: {
    workouts: number
    distance: number
    duration: number
  }
  trends: {
    workouts: number // percentage change
    distance: number
    pace: number
  }
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchWorkouts = async () => {
    if (!user) return

    try {
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${apiUrl}/api/workouts`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch workouts')
      }

      const data = await response.json()
      logger.info('COMPONENT', 'Workouts API response:', { data })
      logger.info('COMPONENT', 'User ID from auth:', { userId: user?.id })
      logger.info('COMPONENT', 'Request URL:', { url: `${apiUrl}/api/workouts` })
      
      if (data.success === false) {
        throw new Error(data.message || 'Failed to fetch workouts')
      }
      
      setWorkouts(data.workouts || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      logger.error('ERROR', 'Error fetching workouts:', { error: err })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkouts()
  }, [user])

  const deleteWorkout = async (workoutId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${apiUrl}/api/workouts/${workoutId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete workout')
      }

      // Remove from local state
      setWorkouts(prev => prev.filter(workout => workout.id !== workoutId))
      return { success: true }
    } catch (err) {
      logger.error('ERROR', 'Error deleting workout:', { error: err })
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      }
    }
  }

  return {
    workouts,
    loading,
    error,
    refetch: fetchWorkouts,
    deleteWorkout
  }
}

export function useWorkoutStats() {
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchStats = async () => {
    if (!user) return

    try {
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${apiUrl}/api/user/stats`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch workout stats')
      }

      const data = await response.json()
      logger.info('COMPONENT', 'Workout stats API response:', { data })
      
      if (data.success === false) {
        throw new Error(data.message || 'Failed to fetch workout stats')
      }
      
      setStats(data.data || data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      logger.error('ERROR', 'Error fetching workout stats:', { error: err })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [user])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

export function useRecentWorkouts(limit: number = 5) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isAdmin } = useAuth()

  const fetchRecentWorkouts = async () => {
    try {
      setLoading(true)
      const endpoint = isAdmin ? '/api/workouts/recent/all' : '/api/workouts/recent'
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${apiUrl}${endpoint}?limit=${limit}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recent workouts')
      }

      const data = await response.json()
      setWorkouts(data.workouts || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      logger.error('ERROR', 'Error fetching recent workouts:', { error: err })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchRecentWorkouts()
    }
  }, [user, isAdmin, limit])

  return {
    workouts,
    loading,
    error,
    refetch: fetchRecentWorkouts
  }
}
