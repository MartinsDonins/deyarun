import React, { useState, useEffect } from 'react'
import { logger } from '../../lib/productionLogger'

interface Workout {
  id: string
  title: string
  type: string
  date: string
  duration: number
  distance?: number
  intensity?: 'easy' | 'moderate' | 'hard' | 'recovery'
  completed?: boolean
  notes?: string
  actualDuration?: number
  actualDistance?: number
  actualPace?: string
  completedTime?: string
  completionNotes?: string
}

interface WorkoutCompletionModalProps {
  workout: Workout
  isOpen: boolean
  onClose: () => void
  onUpdate: (workout: Workout) => void
}

const WorkoutCompletionModal: React.FC<WorkoutCompletionModalProps> = ({
  workout,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [actualDuration, setActualDuration] = useState('')
  const [actualDistance, setActualDistance] = useState('')
  const [actualPace, setActualPace] = useState('')
  const [completionNotes, setCompletionNotes] = useState('')
  const [loading, setLoading] = useState(false)

  // Initialize form with existing data
  useEffect(() => {
    if (workout && isOpen) {
      setActualDuration(workout.actualDuration ? String(workout.actualDuration) : '')
      setActualDistance(workout.actualDistance ? String(workout.actualDistance) : '')
      setActualPace(workout.actualPace || '')
      setCompletionNotes(workout.completionNotes || '')
    }
  }, [workout, isOpen])

  // Calculate pace automatically if duration and distance are provided
  useEffect(() => {
    if (actualDuration && actualDistance) {
      const durationInMinutes = parseFloat(actualDuration)
      const distanceInKm = parseFloat(actualDistance)
      
      if (durationInMinutes > 0 && distanceInKm > 0) {
        const paceMinPerKm = durationInMinutes / distanceInKm
        const paceMinutes = Math.floor(paceMinPerKm)
        const paceSeconds = Math.round((paceMinPerKm - paceMinutes) * 60)
        setActualPace(`${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}/km`)
      }
    }
  }, [actualDuration, actualDistance])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updatedWorkout = {
        ...workout,
        completed: true,
        actualDuration: actualDuration ? parseFloat(actualDuration) : undefined,
        actualDistance: actualDistance ? parseFloat(actualDistance) : undefined,
        actualPace: actualPace || undefined,
        completedTime: new Date().toISOString(),
        completionNotes: completionNotes || undefined
      }

      onUpdate(updatedWorkout)
      onClose()
    } catch (error) {
      logger.error('ERROR', 'Error updating workout:', { error: error })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsCompleted = () => {
    // Quick completion without details
    const updatedWorkout = {
      ...workout,
      completed: true,
      completedTime: new Date().toISOString()
    }
    onUpdate(updatedWorkout)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Pabeigt treniņu
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {workout.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick complete option */}
          <div className="mb-6 p-4 bg-gray-700/50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Ātrā atzīme</h3>
                <p className="text-gray-400 text-sm">Atzīmēt kā pabeigtu bez papildu detaļām</p>
              </div>
              <button
                onClick={handleMarkAsCompleted}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ✓ Pabeigts
              </button>
            </div>
          </div>

          <div className="text-gray-400 text-sm mb-4 text-center">
            vai pievienot detalizētu informāciju
          </div>

          {/* Detailed form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Actual Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Faktiskais ilgums (minūtes)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={actualDuration}
                onChange={(e) => setActualDuration(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[var(--deyarun-primary)] focus:border-transparent"
                placeholder={`Plānotais: ${workout.duration} min`}
              />
            </div>

            {/* Actual Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Faktiskā distance (km)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={actualDistance}
                onChange={(e) => setActualDistance(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[var(--deyarun-primary)] focus:border-transparent"
                placeholder={workout.distance ? `Plānotā: ${workout.distance} km` : 'Piemēram: 5.2'}
              />
            </div>

            {/* Calculated/Manual Pace */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vidējais temps (min/km)
              </label>
              <input
                type="text"
                value={actualPace}
                onChange={(e) => setActualPace(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[var(--deyarun-primary)] focus:border-transparent"
                placeholder="Piemēram: 5:30/km (automātiski aprēķinās)"
              />
            </div>

            {/* Completion Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Papildu piezīmes
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[var(--deyarun-primary)] focus:border-transparent"
                placeholder="Kā jutos, apstākļi, sasniegumi..."
              />
            </div>

            {/* Workout Summary */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Treniņa kopsavilkums</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Plānotais laiks:</span>
                  <div className="text-white">{workout.duration} min</div>
                </div>
                <div>
                  <span className="text-gray-400">Faktiskais laiks:</span>
                  <div className="text-white">{actualDuration || 'Nav norādīts'} min</div>
                </div>
                <div>
                  <span className="text-gray-400">Plānotā distance:</span>
                  <div className="text-white">{workout.distance || 'Nav norādīta'} km</div>
                </div>
                <div>
                  <span className="text-gray-400">Faktiskā distance:</span>
                  <div className="text-white">{actualDistance || 'Nav norādīta'} km</div>
                </div>
              </div>
              {actualPace && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <span className="text-gray-400">Vidējais temps:</span>
                  <div className="text-[var(--deyarun-primary)] font-medium">{actualPace}</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
              >
                Atcelt
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[var(--deyarun-primary)] to-[var(--deyarun-secondary)] hover:shadow-lg text-white py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Saglabā...
                  </div>
                ) : (
                  '✓ Pabeigt ar detaļām'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default WorkoutCompletionModal