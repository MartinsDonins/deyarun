import React from 'react'
import { logger } from '../../lib/productionLogger'

interface Workout {
  id: string
  type: string
  startTime?: string
  date: string
  distance: number
  duration: number
  pace: number | string
}

interface TrainingPlan {
  id: string
  title: string
  date: string
  duration: number
}

interface UpcomingWorkoutsProps {
  recentWorkouts: Workout[]
  upcomingPlans: TrainingPlan[]
}

const UpcomingWorkouts: React.FC<UpcomingWorkoutsProps> = ({ 
  recentWorkouts, 
  upcomingPlans 
}) => {
  // Format functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Šodien'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Rīt'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatPace = (pace: number | string) => {
    if (typeof pace === 'string') return pace
    if (!pace || pace <= 0) return '--:--'
    const minutes = Math.floor(pace)
    const seconds = Math.floor((pace - minutes) * 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Get workout type icon and color
  const getWorkoutTypeConfig = (type: string) => {
    const lowerType = type.toLowerCase()
    
    if (lowerType.includes('viegl') || lowerType.includes('easy')) {
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        color: 'var(--deyarun-success)',
        bg: 'bg-green-500/20'
      }
    } else if (lowerType.includes('tempo') || lowerType.includes('threshold')) {
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'var(--deyarun-warning)',
        bg: 'bg-orange-500/20'
      }
    } else if (lowerType.includes('interval') || lowerType.includes('speed')) {
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3-3 3m0 0h3m-3 0V9M8 21l4-7-4-7" />
          </svg>
        ),
        color: 'var(--deyarun-danger)',
        bg: 'bg-red-500/20'
      }
    } else if (lowerType.includes('long') || lowerType.includes('garš')) {
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        ),
        color: 'var(--deyarun-accent)',
        bg: 'bg-blue-500/20'
      }
    } else {
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        color: 'var(--deyarun-primary)',
        bg: 'bg-[var(--deyarun-primary)]/20'
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Workouts */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-adaptive-white">Pēdējie treniņi</h2>
          <a 
            href="/workouts" 
            className="text-sm text-[var(--deyarun-primary)] hover:text-[var(--deyarun-secondary)] transition-colors"
          >
            Skatīt visus →
          </a>
        </div>

        <div className="space-y-3">
          {recentWorkouts.length > 0 ? (
            recentWorkouts.slice(0, 4).map((workout) => {
              const config = getWorkoutTypeConfig(workout.type)
              return (
                <div key={workout.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <div style={{ color: config.color }}>
                        {config.icon}
                      </div>
                    </div>
                    <div>
                      <div className="text-adaptive-white font-medium">{workout.type}</div>
                      <div className="text-adaptive-light text-sm">
                        {formatDate(workout.startTime || workout.date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-adaptive-white font-medium">
{workout.distance} km
                    </div>
                    <div className="text-adaptive-light text-sm">
                      {formatPace(workout.pace)} min/km
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-adaptive-white mb-2">Nav ierakstītu treniņu</h3>
              <p className="text-adaptive-light text-sm mb-4">
                Sāciet savu pirmo treniņu, lai redzētu to šeit
              </p>
              <a
                href="/workouts"
                className="inline-flex items-center px-4 py-2 gradient-primary text-adaptive-white rounded-lg hover:scale-105 transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Sākt treniņu
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Plans */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-adaptive-white">Nākamie treniņi</h2>
          <a 
            href="/training-plans" 
            className="text-sm text-[var(--deyarun-primary)] hover:text-[var(--deyarun-secondary)] transition-colors"
          >
            Skatīt plānu →
          </a>
        </div>

        <div className="space-y-3">
          {upcomingPlans.length > 0 ? (
            upcomingPlans.slice(0, 4).map((plan) => {
              const config = getWorkoutTypeConfig(plan.title)
              return (
                <div key={plan.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors group">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <div style={{ color: config.color }}>
                        {config.icon}
                      </div>
                    </div>
                    <div>
                      <div className="text-adaptive-white font-medium">{plan.title}</div>
                      <div className="text-adaptive-light text-sm">
                        {formatDate(plan.date)} • {formatDuration(plan.duration)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      className="px-3 py-1 text-sm rounded-lg border border-gray-600 text-adaptive-light hover:border-[var(--deyarun-primary)] hover:text-[var(--deyarun-primary)] transition-colors opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        // Add to calendar or reschedule logic
                        logger.info('COMPONENT', 'Reschedule workout:', { id: plan.id })
                      }}
                    >
                      Pārplānot
                    </button>
                    <a
                      href={`/workouts?plan=${plan.id}`}
                      className="px-3 py-1 text-sm gradient-primary text-adaptive-white rounded-lg hover:scale-105 transition-all duration-300"
                    >
                      Sākt
                    </a>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-adaptive-white mb-2">Nav plānotu treniņu</h3>
              <p className="text-adaptive-light text-sm mb-4">
                Izveidojiet AI treniņu plānu, lai redzētu nākamos treniņus
              </p>
              <a
                href="/training-plans"
                className="inline-flex items-center px-4 py-2 gradient-secondary text-adaptive-white rounded-lg hover:scale-105 transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Izveidot plānu
              </a>
            </div>
          )}
        </div>

        {/* Quick Add Workout */}
        {upcomingPlans.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <button 
              className="w-full p-3 border-2 border-dashed border-gray-600 rounded-xl text-adaptive-light hover:border-[var(--deyarun-primary)] hover:text-[var(--deyarun-primary)] transition-colors group"
              onClick={() => {
                // Add manual workout logic
                window.location.href = '/workouts/add'
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Pievienot manuālu treniņu</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UpcomingWorkouts