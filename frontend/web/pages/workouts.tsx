import { useState } from 'react'
import ProtectedLayout from '../components/layout/ProtectedLayout'
import { useWorkouts, useWorkoutStats } from '../hooks/useWorkouts'
import { useAuth, withAuth } from '../contexts/AuthContext'
import WorkoutMap from '../components/maps/WorkoutMap'
import WeeklyWorkoutManager from '../components/workouts/WeeklyWorkoutManager'
import Footer from '../components/Footer'

function WorkoutsPage() {
  const { user } = useAuth()
  const { workouts, loading: workoutsLoading, error, deleteWorkout } = useWorkouts()
  const { stats, loading: statsLoading } = useWorkoutStats()
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
    return emojis[Math.max(0, Math.min(4, (feeling || 3) - 1))]
  }

  const getEffortColor = (effort: number) => {
    const colors = ['text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-red-600']
    return colors[Math.max(0, Math.min(4, (effort || 3) - 1))]
  }

  const getSourceInfo = (source?: string, externalData?: any) => {
    switch (source) {
      case 'strava':
        return {
          name: 'Strava',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0 0 13.828h4.174" />
            </svg>
          ),
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/20'
        }
      case 'googlefit':
        return {
          name: 'Google Fit',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          ),
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/20'
        }
      case 'apple_health':
        return {
          name: 'Apple Health',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm7 18c-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .83-.67 1.5-1.5 1.5zm-14 0c-.83 0-1.5-.67-1.5-1.5C3.5 17.67 4.17 17 5 17s1.5.67 1.5 1.5c0 .83-.67 1.5-1.5 1.5z" />
            </svg>
          ),
          color: 'text-red-500',
          bgColor: 'bg-red-500/20'
        }
      default:
        return {
          name: 'Manuāli',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          ),
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20'
        }
    }
  }

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Vai tiešām vēlaties dzēst šo treniņu? Šo darbību nevar atsaukt.')) {
      return
    }

    setIsDeleting(true)
    const result = await deleteWorkout(workoutId)
    
    if (result.success) {
      setSelectedWorkout(null)
      alert('Treniņš veiksmīgi dzēsts!')
    } else {
      alert(`Error dzēšot treniņu: ${result.error}`)
    }
    setIsDeleting(false)
  }

  return (
    <ProtectedLayout title="Mani treniņi">
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-adaptive-white">Mani treniņi</h1>
                <p className="text-adaptive-light">Jūsu skriešanas aktivitātes un statistika</p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card p-6 animate-pulse">
                  <div className="h-4 bg-white/20 rounded mb-2"></div>
                  <div className="h-8 bg-white/20 rounded mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-1/2"></div>
                </div>
              ))
            ) : stats ? (
              <>
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-adaptive-muted mb-1">Kopā treniņu</p>
                      <p className="text-2xl font-bold text-adaptive-white">{stats.totalWorkouts || 0}</p>
                      <p className="text-sm text-orange-500">+{stats.trends?.workouts || 0}% šomēnes</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-adaptive-muted mb-1">Kopējā distance</p>
                      <p className="text-2xl font-bold text-adaptive-white">{formatDistance(stats.totalDistance || 0)}</p>
                      <p className="text-sm text-green-400">+{stats.trends?.distance || 0}% šomēnes</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-adaptive-muted mb-1">Vidējais tempts</p>
                      <p className="text-2xl font-bold text-adaptive-white">{stats.averagePace || '0:00'}</p>
                      <p className="text-sm text-blue-400">{(stats.trends?.pace || 0) > 0 ? '+' : ''}{stats.trends?.pace || 0}% šomēnes</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-adaptive-muted mb-1">Labākais tempts</p>
                      <p className="text-2xl font-bold text-adaptive-white">{stats.bestPace || '0:00'}</p>
                      <p className="text-sm text-yellow-400">Personīgais rekords</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="col-span-4 text-center py-8 text-adaptive-muted">
                Nav pieejama statistika
              </div>
            )}
          </div>

          {/* Weekly Planned Workouts */}
          <WeeklyWorkoutManager />

          {/* Workouts List */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-adaptive-white">
                Treniņu vēsture
              </h2>
              <button className="glass-button-primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Jauns treniņš
              </button>
            </div>

            {workoutsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-adaptive-light">Ielādē treniņus...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-400">
                Error ielādējot treniņus: {error}
              </div>
            ) : workouts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-adaptive-white mb-2">Nav reģistrēti treniņi</h3>
                <p className="text-adaptive-light mb-4">Sāciet reģistrēt savus treniņus, lai sekotu līdzi progresam!</p>
                <button className="glass-button-primary">
                  Sākt pirmo treniņu
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  {workouts.filter(w => w.status !== 'planned').map((workout) => (
                    <div
                      key={workout.id}
                      className="glass-card p-4 hover:scale-[1.02] transition-transform cursor-pointer"
                      onClick={() => setSelectedWorkout(workout)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getWorkoutTypeColor(workout.type)}`}>
                            {getWorkoutTypeIcon(workout.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-adaptive-white capitalize">{workout.name || workout.type}</h3>
                              {workout.isGenerated && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 rounded-full">
                                  <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                  </svg>
                                  <span className="text-xs text-purple-400 font-medium">Ģenerēts</span>
                                </div>
                              )}
                              {workout.status === 'planned' && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 rounded-full">
                                  <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-xs text-blue-400 font-medium">Plānots</span>
                                </div>
                              )}
                              {workout.source === 'strava' && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 rounded-full">
                                  <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
                                  </svg>
                                  <span className="text-xs text-orange-400 font-medium">Strava</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-adaptive-light">
                              {new Date(workout.startTime).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-adaptive-white font-medium">{formatDistance(workout.distance)}</div>
                            <div className="text-adaptive-muted">Distance</div>
                          </div>
                          <div className="text-center">
                            <div className="text-adaptive-white font-medium">{formatDuration(workout.duration)}</div>
                            <div className="text-adaptive-muted">Laiks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-adaptive-white font-medium">{workout.pace}</div>
                            <div className="text-adaptive-muted">Tempts</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg">{getFeelingEmoji(workout.feeling || 3)}</div>
                            <div className="text-adaptive-muted">Sajūta</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-adaptive-light">
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
                          <span className="text-sm text-adaptive-light">Piepūle:</span>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < (workout.effort || 3) ? 'bg-orange-500' : 'bg-white/20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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
                      {new Date(selectedWorkout.startTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteWorkout(selectedWorkout.id)}
                    disabled={isDeleting}
                    className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
                    title="Dzēst treniņu"
                  >
                    {isDeleting ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedWorkout(null)}
                    className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Source Information */}
              {(() => {
                const sourceInfo = getSourceInfo(selectedWorkout.source, selectedWorkout.externalData)
                return (
                  <div className="mb-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${sourceInfo.bgColor}`}>
                      <div className={sourceInfo.color}>
                        {sourceInfo.icon}
                      </div>
                      <span className={`text-sm font-medium ${sourceInfo.color}`}>
                        Sinhronizēts no {sourceInfo.name}
                      </span>
                      {selectedWorkout.externalData?.stravaActivityId && (
                        <span className="text-xs text-gray-400">
                          ID: {selectedWorkout.externalData.stravaActivityId}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })()}

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
                        <span className="text-2xl">{getFeelingEmoji(selectedWorkout.feeling || 3)}</span>
                        <span className="text-white">{selectedWorkout.feeling || 3}/5</span>
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
                                i < (selectedWorkout.effort || 3) ? 'bg-orange-500' : 'bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-white">{selectedWorkout.effort || 3}/5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* GPS Route Map */}
              {selectedWorkout.route && selectedWorkout.route.coordinates && selectedWorkout.route.coordinates.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-white mb-4">GPS Maršruts</h4>
                  <WorkoutMap
                    route={selectedWorkout.route.coordinates.map(coord => ({
                      lat: coord[1],  // GeoJSON format: [longitude, latitude]
                      lng: coord[0],
                      elevation: coord[2]
                    }))}
                    workoutType={selectedWorkout.type}
                    distance={selectedWorkout.distance}
                    duration={selectedWorkout.duration}
                    className="w-full h-80"
                    showControls={true}
                  />
                </div>
              )}

              {selectedWorkout.weather && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-white mb-2">Laika apstākļi</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-300 bg-bg p-3 rounded-lg">
                    {selectedWorkout.weather.temperature && (
                      <span>{selectedWorkout.weather.temperature}°C</span>
                    )}
                    {selectedWorkout.weather.humidity && (
                      <span>{selectedWorkout.weather.humidity}% mitrums</span>
                    )}
                    {selectedWorkout.weather.conditions && (
                      <span className="capitalize">{selectedWorkout.weather.conditions}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </ProtectedLayout>
  )
}

export default withAuth(WorkoutsPage)
