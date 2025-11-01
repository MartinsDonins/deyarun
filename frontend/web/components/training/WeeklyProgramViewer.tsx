import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { lv } from 'date-fns/locale'

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

interface WeeklyProgramViewerProps {
  workouts: PlannedWorkout[]
  onSelectWorkout: (workout: PlannedWorkout) => void
  onSelectExercise: (exercise: Exercise) => void
  onMarkComplete: (workoutId: string) => void
}

export default function WeeklyProgramViewer({
  workouts,
  onSelectWorkout,
  onSelectExercise,
  onMarkComplete
}: WeeklyProgramViewerProps) {
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null)

  const getWorkoutTypeColor = (type: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800 border-green-300',
      tempo: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      intervals: 'bg-red-100 text-red-800 border-red-300',
      long: 'bg-blue-100 text-blue-800 border-blue-300',
      recovery: 'bg-purple-100 text-purple-800 border-purple-300'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      scheduled: '📅',
      completed: '✅',
      skipped: '⏭️',
      partial: '⚠️'
    }
    return icons[status as keyof typeof icons] || '📅'
  }

  const formatPace = (paceInSeconds: number) => {
    const minutes = Math.floor(paceInSeconds / 60)
    const seconds = Math.round(paceInSeconds % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`
  }

  const toggleWorkout = (workoutId: string) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId)
  }

  return (
    <div className="space-y-6">
      {/* Week Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Nedēļas kopsavilkums</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {workouts.length}
            </div>
            <div className="text-sm text-gray-600">Treniņi</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {(workouts.reduce((sum, w) => sum + w.targetMetrics.totalDistance, 0) / 1000).toFixed(1)} km
            </div>
            <div className="text-sm text-gray-600">Kopējā distance</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {formatDuration(workouts.reduce((sum, w) => sum + w.targetMetrics.totalDuration, 0))}
            </div>
            <div className="text-sm text-gray-600">Kopējais laiks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {workouts.reduce((sum, w) => sum + w.targetMetrics.calories, 0).toFixed(0)} kcal
            </div>
            <div className="text-sm text-gray-600">Kalorijas</div>
          </div>
        </div>
      </div>

      {/* Workout Cards */}
      <div className="space-y-4">
        {workouts.map((workout) => (
          <div
            key={workout.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            {/* Workout Header */}
            <div
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleWorkout(workout.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getStatusIcon(workout.status)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {workout.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {format(parseISO(workout.scheduledDate), 'EEEE, d. MMMM', { locale: lv })}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{workout.description}</p>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getWorkoutTypeColor(workout.type)}`}>
                      {workout.type.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      📏 {(workout.targetMetrics.totalDistance / 1000).toFixed(1)} km
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      ⏱️ {formatDuration(workout.targetMetrics.totalDuration)}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      🏃 {formatPace(workout.targetMetrics.averagePace)}
                    </span>
                  </div>
                </div>

                <button
                  className="ml-4 p-2 text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleWorkout(workout.id)
                  }}
                >
                  <svg
                    className={`w-6 h-6 transform transition-transform ${expandedWorkout === workout.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedWorkout === workout.id && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                {/* Instructions */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">📋 Instrukcijas</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Iesildīšanās:</span>
                      <p className="text-gray-600">{workout.warmupInstructions}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Nomierināšanās:</span>
                      <p className="text-gray-600">{workout.cooldownInstructions}</p>
                    </div>
                  </div>
                </div>

                {/* Coaching Tips */}
                {workout.coachingTips && workout.coachingTips.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">💡 Trenera padomi</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {workout.coachingTips.map((tip, index) => (
                        <li key={index} className="text-gray-600">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Exercises */}
                {workout.exercises && (
                  <div className="space-y-6">
                    {/* Warmup Exercises */}
                    {workout.exercises.warmup && workout.exercises.warmup.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">🔥 Iesildīšanās vingrojumi</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {workout.exercises.warmup.map((exercise, index) => (
                            <button
                              key={index}
                              onClick={() => onSelectExercise(exercise)}
                              className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-3xl">▶️</div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 mb-1">{exercise.name}</h5>
                                  <p className="text-xs text-gray-600 line-clamp-2">{exercise.description}</p>
                                  {exercise.duration && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      ⏱️ {exercise.duration.min}-{exercise.duration.max}s
                                    </p>
                                  )}
                                  {exercise.repetitions && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      🔄 {exercise.repetitions.min}-{exercise.repetitions.max} × {exercise.sets?.min || 1}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strengthening Exercises */}
                    {workout.exercises.strengthening && workout.exercises.strengthening.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">💪 Spēka vingrojumi</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {workout.exercises.strengthening.map((exercise, index) => (
                            <button
                              key={index}
                              onClick={() => onSelectExercise(exercise)}
                              className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-3xl">▶️</div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 mb-1">{exercise.name}</h5>
                                  <p className="text-xs text-gray-600 line-clamp-2">{exercise.description}</p>
                                  {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {exercise.targetMuscles.map((muscle, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                          {muscle}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {exercise.repetitions && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      🔄 {exercise.repetitions.min}-{exercise.repetitions.max} × {exercise.sets?.min || 1} sērijas
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cooldown Exercises */}
                    {workout.exercises.cooldown && workout.exercises.cooldown.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">🧘 Nomierināšanās vingrojumi</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {workout.exercises.cooldown.map((exercise, index) => (
                            <button
                              key={index}
                              onClick={() => onSelectExercise(exercise)}
                              className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-3xl">▶️</div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 mb-1">{exercise.name}</h5>
                                  <p className="text-xs text-gray-600 line-clamp-2">{exercise.description}</p>
                                  {exercise.duration && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      ⏱️ {exercise.duration.min}-{exercise.duration.max}s
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  {workout.status === 'scheduled' && (
                    <button
                      onClick={() => onMarkComplete(workout.id)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      ✅ Atzīmēt kā pabeigtu
                    </button>
                  )}
                  {workout.status === 'completed' && workout.completionMetrics && (
                    <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                      ✅ Pabeigts {format(parseISO(workout.completionMetrics.completionDate), 'd. MMM', { locale: lv })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
