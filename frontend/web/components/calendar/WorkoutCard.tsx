import React, { useState } from 'react'
import WorkoutCompletionModal from './WorkoutCompletionModal'

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

interface WorkoutCardProps {
  workout: Workout
  compact?: boolean
  colorClass?: string
  onDragStart?: () => void
  onUpdate?: (workout: Workout) => void
  onDelete?: (workoutId: string) => void
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  compact = false,
  colorClass = 'bg-[var(--deyarun-primary)]/20 border-[var(--deyarun-primary)]/50 text-[var(--deyarun-primary)]',
  onDragStart,
  onUpdate,
  onDelete
}) => {
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (compact) {
      return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`
    }
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Get workout icon
  const getWorkoutIcon = (type: string, intensity?: string) => {
    const lowerType = type.toLowerCase()
    
    if (intensity === 'recovery' || lowerType.includes('recovery')) {
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    } else if (lowerType.includes('interval') || lowerType.includes('speed')) {
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3-3 3m0 0h3m-3 0V9M8 21l4-7-4-7" />
        </svg>
      )
    } else if (lowerType.includes('tempo')) {
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    } else if (lowerType.includes('long') || lowerType.includes('garš')) {
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    } else {
      return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  }

  const handleComplete = () => {
    if (!workout.completed) {
      // Opening completion modal to add workout times
      setShowCompletionModal(true)
    } else {
      // Unchecking completed workout
      if (onUpdate) {
        onUpdate({ 
          ...workout, 
          completed: false,
          actualDuration: undefined,
          actualDistance: undefined,
          actualPace: undefined,
          completedTime: undefined,
          completionNotes: undefined
        })
      }
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setShowActions(false)
  }

  const handleDelete = () => {
    if (onDelete && window.confirm('Vai tiešām vēlaties dzēst šo treniņu?')) {
      onDelete(workout.id)
    }
    setShowActions(false)
  }

  if (compact) {
    return (
      <div
        draggable
        onDragStart={onDragStart}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        className={`
          relative p-2 rounded border text-xs cursor-move transition-all duration-200
          ${colorClass}
          ${workout.completed ? 'opacity-75 line-through' : ''}
          hover:scale-105 hover:shadow-lg
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 min-w-0">
            {getWorkoutIcon(workout.type, workout.intensity)}
            <span className="truncate font-medium">
              {workout.title}
            </span>
          </div>
          
          {!workout.completed && (
            <button
              onClick={handleComplete}
              className="opacity-0 group-hover:opacity-100 text-xs hover:scale-110 transition-all"
              title="Ievadīt skrējiena laikus"
            >
              ✓
            </button>
          )}
        </div>
        
        <div className="mt-1 text-xs opacity-75">
          {workout.completed && workout.actualDuration ? (
            <>
              {formatDuration(workout.actualDuration)}
              {workout.actualDistance && ` • ${workout.actualDistance}km`}
              {workout.actualPace && ` • ${workout.actualPace}`}
            </>
          ) : (
            <>
              {formatDuration(workout.duration)}
              {workout.distance && ` • ${workout.distance}km`}
            </>
          )}
        </div>

        {/* Actions menu for compact view */}
        {showActions && (
          <div className="absolute top-0 right-0 bg-gray-800 rounded-lg shadow-lg border border-gray-600 p-1 z-10">
            <button
              onClick={handleComplete}
              className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-700 rounded"
            >
              {workout.completed ? 'Atzīmēt kā nepabeigtu' : 'Ievadīt skrējiena laikus'}
            </button>
            <button
              onClick={handleEdit}
              className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-700 rounded"
            >
              Rediģēt
            </button>
            <button
              onClick={handleDelete}
              className="block w-full text-left px-2 py-1 text-xs hover:bg-red-600 rounded text-red-300"
            >
              Dzēst
            </button>
          </div>
        )}
      </div>
    )
  }

  // Full size card for week view
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`
        relative p-3 rounded-lg border transition-all duration-200 cursor-move group
        ${colorClass}
        ${workout.completed ? 'opacity-75' : ''}
        hover:scale-105 hover:shadow-lg
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 min-w-0">
          {getWorkoutIcon(workout.type, workout.intensity)}
          <div className="min-w-0">
            <h4 className={`font-medium text-sm truncate ${workout.completed ? 'line-through' : ''}`}>
              {workout.title}
            </h4>
            <p className="text-xs opacity-75 mt-0.5">
              {workout.completed && workout.actualDuration ? (
                <>
                  {formatDuration(workout.actualDuration)}
                  {workout.actualDistance && ` • ${workout.actualDistance} km`}
                  {workout.actualPace && ` • ${workout.actualPace}`}
                </>
              ) : (
                <>
                  {formatDuration(workout.duration)}
                  {workout.distance && ` • ${workout.distance} km`}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Completion status */}
        <div className="flex items-center space-x-1">
          {workout.completed ? (
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <button
              onClick={handleComplete}
              className="w-5 h-5 rounded-full border-2 border-current opacity-50 hover:opacity-100 transition-opacity"
              title="Ievadīt skrējiena laikus"
            />
          )}
        </div>
      </div>

      {/* Notes preview */}
      {workout.notes && (
        <div className="text-xs opacity-75 mt-2 truncate">
          📝 {workout.notes}
        </div>
      )}

      {/* Workout time */}
      <div className="text-xs opacity-50 mt-2">
        {new Date(workout.date).toLocaleTimeString('lv', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>

      {/* Actions menu */}
      {showActions && (
        <div className="absolute top-2 right-8 bg-gray-800 rounded-lg shadow-lg border border-gray-600 p-1 z-10">
          <button
            onClick={handleComplete}
            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded"
          >
            {workout.completed ? 'Atzīmēt kā nepabeigtu' : 'Ievadīt skrējiena laikus'}
          </button>
          <button
            onClick={handleEdit}
            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded"
          >
            Rediģēt treniņu
          </button>
          <button
            onClick={() => {
              // Navigate to workout details
              window.location.href = `/workouts/${workout.id}`
            }}
            className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-700 rounded"
          >
            Skatīt detaļas
          </button>
          <hr className="border-gray-600 my-1" />
          <button
            onClick={handleDelete}
            className="block w-full text-left px-3 py-2 text-sm hover:bg-red-600 rounded text-red-300"
          >
            Dzēst treniņu
          </button>
        </div>
      )}

      {/* Workout Completion Modal */}
      <WorkoutCompletionModal
        workout={workout}
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onUpdate={(updatedWorkout) => {
          if (onUpdate) {
            onUpdate(updatedWorkout)
          }
          setShowCompletionModal(false)
        }}
      />
    </div>
  )
}

export default WorkoutCard