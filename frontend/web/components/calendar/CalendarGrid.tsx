import React from 'react'
import WorkoutCard from './WorkoutCard'

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
}

type ViewMode = 'month' | 'week'

interface CalendarGridProps {
  dates: Date[]
  currentDate: Date
  viewMode: ViewMode
  selectedDate: Date | null
  getWorkoutsForDate: (date: Date) => Workout[]
  onDateClick: (date: Date) => void
  onDateDoubleClick: (date: Date) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, date: Date) => void
  getWorkoutTypeColor: (type: string, intensity?: string) => string
  onWorkoutDragStart: (workout: Workout) => void
  onWorkoutUpdate?: (workout: Workout) => void
  onWorkoutDelete?: (workoutId: string) => void
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  dates,
  currentDate,
  viewMode,
  selectedDate,
  getWorkoutsForDate,
  onDateClick,
  onDateDoubleClick,
  onDragOver,
  onDrop,
  getWorkoutTypeColor,
  onWorkoutDragStart,
  onWorkoutUpdate,
  onWorkoutDelete
}) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isToday = (date: Date) => {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate.getTime() === today.getTime()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const isPastDate = (date: Date) => {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate.getTime() < today.getTime()
  }

  // Get day abbreviations for week view
  const dayNames = ['Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena', 'Svētdiena']
  const dayAbbreviations = ['P', 'O', 'T', 'C', 'P', 'S', 'Sv']

  return (
    <div className="p-6">
      {/* Week view header */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-7 gap-4 mb-4">
          {dates.map((date, index) => (
            <div key={index} className="text-center">
              <div className="text-sm font-medium text-adaptive-light mb-1">
                {dayNames[index]}
              </div>
              <div className={`text-lg font-semibold ${
                isToday(date) 
                  ? 'text-[var(--deyarun-primary)]' 
                  : 'text-white'
              }`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Month view header */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayAbbreviations.map((day, index) => (
            <div key={index} className="text-center text-sm font-medium text-adaptive-light py-2">
              {day}
            </div>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className={`grid grid-cols-7 ${viewMode === 'month' ? 'gap-2' : 'gap-4'}`}>
        {dates.map((date, index) => {
          const dayWorkouts = getWorkoutsForDate(date)
          const isCurrentMonthDate = isCurrentMonth(date)
          
          return (
            <div
              key={index}
              className={`
                ${viewMode === 'month' ? 'min-h-[120px]' : 'min-h-[200px]'}
                p-2 rounded-lg border transition-all duration-200 cursor-pointer
                ${isSelected(date) 
                  ? 'border-[var(--deyarun-primary)] bg-[var(--deyarun-primary)]/10' 
                  : 'border-gray-700 hover:border-gray-600'
                }
                ${isPastDate(date) ? 'opacity-75' : ''}
                ${viewMode === 'month' && !isCurrentMonthDate ? 'opacity-50' : ''}
                ${isToday(date) ? 'bg-[var(--deyarun-primary)]/5' : 'bg-gray-800/50'}
                hover:bg-gray-800/70
              `}
              onClick={() => onDateClick(date)}
              onDoubleClick={() => onDateDoubleClick(date)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, date)}
            >
              {/* Date number */}
              <div className="flex items-center justify-between mb-2">
                <span className={`
                  text-sm font-medium
                  ${isToday(date) 
                    ? 'text-[var(--deyarun-primary)] font-bold' 
                    : viewMode === 'month' && !isCurrentMonthDate
                      ? 'text-muted'
                      : 'text-white'
                  }
                `}>
                  {viewMode === 'week' ? '' : date.getDate()}
                </span>
                
                {/* Workout count indicator for month view */}
                {viewMode === 'month' && dayWorkouts.length > 0 && (
                  <span className="text-xs bg-[var(--deyarun-primary)]/20 text-[var(--deyarun-primary)] px-2 py-0.5 rounded-full">
                    {dayWorkouts.length}
                  </span>
                )}
              </div>

              {/* Workouts for this day */}
              <div className="space-y-1">
                {dayWorkouts.slice(0, viewMode === 'month' ? 3 : 8).map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    compact={viewMode === 'month'}
                    colorClass={getWorkoutTypeColor(workout.type, workout.intensity)}
                    onDragStart={() => onWorkoutDragStart(workout)}
                    onUpdate={onWorkoutUpdate}
                    onDelete={onWorkoutDelete}
                  />
                ))}
                
                {/* Show "+X more" if there are more workouts */}
                {dayWorkouts.length > (viewMode === 'month' ? 3 : 8) && (
                  <div className="text-xs text-adaptive-light text-center py-1">
                    +{dayWorkouts.length - (viewMode === 'month' ? 3 : 8)} vairāk
                  </div>
                )}

                {/* Empty state hint */}
                {dayWorkouts.length === 0 && !isPastDate(date) && (
                  <div className="text-center opacity-0 hover:opacity-50 transition-opacity">
                    <div className="text-xs text-muted py-4">
                      <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Pievienot
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick stats for current view */}
      <div className="mt-6 p-4 bg-gray-800/50 rounded-xl">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-adaptive-light">
              {viewMode === 'month' ? 'Šajā mēnesī:' : 'Šajā nedēļā:'}
            </span>
            
            {(() => {
              const currentPeriodWorkouts = dates.reduce((acc, date) => {
                if (viewMode === 'month' && !isCurrentMonth(date)) return acc
                return [...acc, ...getWorkoutsForDate(date)]
              }, [] as Workout[])

              const completedWorkouts = currentPeriodWorkouts.filter(w => w.completed).length
              const totalWorkouts = currentPeriodWorkouts.length
              const totalDistance = currentPeriodWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0)
              const totalDuration = currentPeriodWorkouts.reduce((sum, w) => sum + w.duration, 0)

              return (
                <>
                  <span className="text-[var(--deyarun-primary)]">
                    {completedWorkouts}/{totalWorkouts} treniņi
                  </span>
                  {totalDistance > 0 && (
                    <span className="text-[var(--deyarun-secondary)]">
                      {totalDistance.toFixed(1)} km
                    </span>
                  )}
                  {totalDuration > 0 && (
                    <span className="text-[var(--deyarun-accent)]">
                      {Math.round(totalDuration / 60)}h {totalDuration % 60}m
                    </span>
                  )}
                </>
              )
            })()}
          </div>

          <div className="flex items-center space-x-2 text-xs text-muted">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>Velciet treniņus, lai pārplānotu</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarGrid