import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { Workout } from '../../hooks/useWorkouts'
import { useAuth, withAdminAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/router'
import { getAuthToken } from '../../lib/auth'
import { logger } from '../../lib/productionLogger'

interface WorkoutFilters {
  type?: 'all' | 'running' | 'walking' | 'cycling' | 'other'
  userId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'date' | 'distance' | 'duration' | 'pace'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

interface WorkoutWithUser extends Workout {
  user: {
    firstName: string
    lastName: string
    avatarUrl?: string
  }
}

function AdminWorkouts() {
  const { user, isAdmin, isCoach } = useAuth()
  const router = useRouter()
  const [workouts, setWorkouts] = useState<WorkoutWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithUser | null>(null)
  const [filters, setFilters] = useState<WorkoutFilters>({
    type: 'all',
    search: '',
    sortBy: 'date',
    sortOrder: 'desc',
    limit: 20,
    offset: 0
  })

  // Redirect if not admin or coach
  useEffect(() => {
    if (user && !isAdmin && !isCoach) {
      router.push('/dashboard')
    }
  }, [user, isAdmin, isCoach, router])

  if (!user || (!isAdmin && !isCoach)) {
    return (
      <AdminLayout title="Visi treniņi">
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">Nav piekļuves tiesību</div>
          <p className="text-gray-400">Jums nav tiesību šīs lapas skatīšanai.</p>
        </div>
      </AdminLayout>
    )
  }

  const fetchWorkouts = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 'all' && value !== '') {
          params.append(key, value.toString())
        }
      })

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com';
      
      const response = await fetch(`${API_BASE_URL}/api/admin/workouts?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch workouts')
      }

      const data = await response.json()
      setWorkouts(data.workouts || [])
      setTotal(data.total || 0)
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
  }, [JSON.stringify(filters)])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(2)}km`
  }

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'running':
        return 'bg-coral text-white'
      case 'walking':
        return 'bg-green-600 text-white'
      case 'cycling':
        return 'bg-blue-600 text-white'
      default:
        return 'bg-gray-600 text-white'
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
      case 'walking':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      case 'cycling':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

  const getFeelingEmoji = (feeling: number) => {
    const emojis = ['😫', '😟', '😐', '😊', '🤩']
    return emojis[feeling - 1] || '😐'
  }

  return (
    <AdminLayout title="Visi treniņi">
      <div className="space-y-6">
        {/* Filters */}
        <div className="card">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Meklēt treniņus..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, offset: 0 })}
                  className="w-full sm:w-64 px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-coral focus:outline-none"
                />
                <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as any, offset: 0 })}
                className="px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
              >
                <option value="all">Visi veidi</option>
                <option value="running">Skriešana</option>
                <option value="walking">Staigāšana</option>
                <option value="cycling">Riteņbraukšana</option>
                <option value="other">Cits</option>
              </select>

              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any, offset: 0 })}
                className="px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
              >
                <option value="date">Datums</option>
                <option value="distance">Distance</option>
                <option value="duration">Ilgums</option>
                <option value="pace">Tempts</option>
              </select>

              <button
                onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                className="px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            <button
              onClick={fetchWorkouts}
              className="text-coral hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Workouts List */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Treniņi ({total})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-400">Ielādē treniņus...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              Error ielādējot treniņus: {error}
            </div>
          ) : workouts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Nav atrasti treniņi
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedWorkout(workout)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getWorkoutTypeColor(workout.type)}`}>
                        {getWorkoutTypeIcon(workout.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-white capitalize">{workout.type}</h3>
                        <p className="text-sm text-gray-400">
                          {workout.user.firstName} {workout.user.lastName} • 
                          {new Date(workout.startTime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-white font-medium">{formatDistance(workout.distance)}</div>
                        <div className="text-gray-400">Distance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-medium">{formatDuration(workout.duration)}</div>
                        <div className="text-gray-400">Laiks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-medium">{workout.pace}</div>
                        <div className="text-gray-400">Tempts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg">{getFeelingEmoji(workout.feeling)}</div>
                        <div className="text-gray-400">Sajūta</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      {workout.calories && (
                        <span>{workout.calories} kcal</span>
                      )}
                      {workout.heartRateAvg && (
                        <span>{workout.heartRateAvg} bpm avg</span>
                      )}
                      {workout.elevationGain && (
                        <span>+{workout.elevationGain}m pacel.</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Piepūle:</span>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < workout.effort ? 'bg-coral' : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > filters.limit! && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Rāda {filters.offset! + 1}-{Math.min(filters.offset! + filters.limit!, total)} no {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, offset: Math.max(0, filters.offset! - filters.limit!) })}
                disabled={filters.offset === 0}
                className="btn-ghost disabled:opacity-50"
              >
                Iepriekšējā
              </button>
              <button
                onClick={() => setFilters({ ...filters, offset: filters.offset! + filters.limit! })}
                disabled={filters.offset! + filters.limit! >= total}
                className="btn-ghost disabled:opacity-50"
              >
                Nākamā
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Workout Detail Modal */}
      {selectedWorkout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${getWorkoutTypeColor(selectedWorkout.type)}`}>
                    {getWorkoutTypeIcon(selectedWorkout.type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white capitalize">{selectedWorkout.type}</h3>
                    <p className="text-gray-400">
                      {selectedWorkout.user.firstName} {selectedWorkout.user.lastName} • 
                      {new Date(selectedWorkout.startTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWorkout(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{formatDistance(selectedWorkout.distance)}</div>
                  <div className="text-gray-400">Distance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{formatDuration(selectedWorkout.duration)}</div>
                  <div className="text-gray-400">Laiks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{selectedWorkout.pace}</div>
                  <div className="text-gray-400">Vidējais tempts</div>
                </div>
              </div>

              {selectedWorkout.notes && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-white mb-2">Piezīmes</h4>
                  <p className="text-gray-300 bg-bg p-3 rounded-lg">{selectedWorkout.notes}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-lg font-medium text-white mb-3">Metriki</h4>
                  <div className="space-y-2 text-sm">
                    {selectedWorkout.calories && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Kalorijas:</span>
                        <span className="text-white">{selectedWorkout.calories} kcal</span>
                      </div>
                    )}
                    {selectedWorkout.heartRateAvg && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vidējais pulss:</span>
                        <span className="text-white">{selectedWorkout.heartRateAvg} bpm</span>
                      </div>
                    )}
                    {selectedWorkout.heartRateMax && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Maks. pulss:</span>
                        <span className="text-white">{selectedWorkout.heartRateMax} bpm</span>
                      </div>
                    )}
                    {selectedWorkout.elevationGain && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Pacēlums:</span>
                        <span className="text-white">+{selectedWorkout.elevationGain}m</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-white mb-3">Novērtējums</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Sajūta:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getFeelingEmoji(selectedWorkout.feeling)}</span>
                        <span className="text-white">{selectedWorkout.feeling}/5</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Piepūle:</span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full ${
                                i < selectedWorkout.effort ? 'bg-coral' : 'bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-white">{selectedWorkout.effort}/5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedWorkout.weather && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-white mb-2">Laika apstākļi</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-300 bg-bg p-3 rounded-lg">
                    <span>{selectedWorkout.weather.temperature}°C</span>
                    <span>{selectedWorkout.weather.humidity}% mitrums</span>
                    <span className="capitalize">{selectedWorkout.weather.conditions}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default withAdminAuth(AdminWorkouts)