import React, { useState, useEffect } from 'react'
import CalendarHeader from './CalendarHeader'
import CalendarGrid from './CalendarGrid'
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
  actualDuration?: number
  actualDistance?: number
  actualPace?: string
  completedTime?: string
  completionNotes?: string
}

interface CalendarMainProps {
  workouts?: Workout[]
  onWorkoutUpdate?: (workout: Workout) => void
  onWorkoutDelete?: (workoutId: string) => void
  onWorkoutCreate?: (workout: Partial<Workout>) => void
  className?: string
}

type ViewMode = 'month' | 'week'

const CalendarMain: React.FC<CalendarMainProps> = ({
  workouts = [],
  onWorkoutUpdate,
  onWorkoutDelete,
  onWorkoutCreate,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [draggedWorkout, setDraggedWorkout] = useState<Workout | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Get workouts for a specific date
  const getWorkoutsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return workouts.filter(workout => workout.date.split('T')[0] === dateStr)
  }

  // Generate calendar dates
  const generateCalendarDates = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1) // Monday start

    const dates = []
    for (let i = 0; i < 42; i++) { // 6 weeks
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      dates.push(date)
    }

    return dates
  }

  // Generate week dates
  const generateWeekDates = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Monday start
    startOfWeek.setDate(diff)

    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }

    return dates
  }

  const dates = viewMode === 'month' ? generateCalendarDates() : generateWeekDates()

  // Navigation handlers
  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setDate(newDate.getDate() - 7)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setCurrentDate(newDate)
  }

  const navigateToday = () => {
    setCurrentDate(new Date())
  }

  // Drag and drop handlers
  const handleDragStart = (workout: Workout) => {
    setDraggedWorkout(workout)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    
    if (draggedWorkout && onWorkoutUpdate) {
      const updatedWorkout = {
        ...draggedWorkout,
        date: targetDate.toISOString()
      }
      onWorkoutUpdate(updatedWorkout)
    }
    
    setDraggedWorkout(null)
  }

  // Date click handler
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    // If double-click, open create modal
  }

  const handleDateDoubleClick = (date: Date) => {
    setSelectedDate(date)
    setShowCreateModal(true)
  }

  // Workout type color mapping
  const getWorkoutTypeColor = (type: string, intensity?: string) => {
    const lowerType = type.toLowerCase()
    
    if (intensity === 'recovery' || lowerType.includes('recovery')) {
      return 'bg-blue-500/20 border-blue-500/50 text-blue-300'
    } else if (intensity === 'easy' || lowerType.includes('easy') || lowerType.includes('viegl')) {
      return 'bg-green-500/20 border-green-500/50 text-green-300'
    } else if (intensity === 'moderate' || lowerType.includes('tempo')) {
      return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
    } else if (intensity === 'hard' || lowerType.includes('interval') || lowerType.includes('speed')) {
      return 'bg-red-500/20 border-red-500/50 text-red-300'
    } else if (lowerType.includes('long') || lowerType.includes('garš')) {
      return 'bg-purple-500/20 border-purple-500/50 text-purple-300'
    } else {
      return 'bg-[var(--deyarun-primary)]/20 border-[var(--deyarun-primary)]/50 text-[var(--deyarun-primary)]'
    }
  }

  return (
    <div className={`bg-gray-900 rounded-2xl overflow-hidden ${className}`}>
      {/* Calendar Header */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onPrevious={navigatePrevious}
        onNext={navigateNext}
        onToday={navigateToday}
        onViewModeChange={setViewMode}
      />

      {/* Calendar Grid */}
      <CalendarGrid
        dates={dates}
        currentDate={currentDate}
        viewMode={viewMode}
        selectedDate={selectedDate}
        getWorkoutsForDate={getWorkoutsForDate}
        onDateClick={handleDateClick}
        onDateDoubleClick={handleDateDoubleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        getWorkoutTypeColor={getWorkoutTypeColor}
        onWorkoutDragStart={handleDragStart}
        onWorkoutUpdate={onWorkoutUpdate}
        onWorkoutDelete={onWorkoutDelete}
      />

      {/* Quick Add Workout Modal */}
      {showCreateModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Pievienot treniņu
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-400">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>

              {/* Quick workout templates */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { title: 'Viegls skrējiens', type: 'easy_run', duration: 30, intensity: 'easy' },
                  { title: 'Tempo treniņš', type: 'tempo_run', duration: 40, intensity: 'moderate' },
                  { title: 'Intervāli', type: 'intervals', duration: 35, intensity: 'hard' },
                  { title: 'Garš skrējiens', type: 'long_run', duration: 60, intensity: 'moderate' }
                ].map((template) => (
                  <button
                    key={template.type}
                    onClick={() => {
                      if (onWorkoutCreate) {
                        onWorkoutCreate({
                          title: template.title,
                          type: template.type,
                          date: selectedDate.toISOString(),
                          duration: template.duration,
                          intensity: template.intensity as any
                        })
                      }
                      setShowCreateModal(false)
                    }}
                    className={`p-3 rounded-xl border text-left transition-colors hover:scale-105 ${getWorkoutTypeColor(template.type, template.intensity)}`}
                  >
                    <div className="font-medium text-sm">{template.title}</div>
                    <div className="text-xs opacity-75">{template.duration} min</div>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    // Navigate to full workout creation page
                    window.location.href = `/workouts/create?date=${selectedDate.toISOString().split('T')[0]}`
                  }}
                  className="w-full p-3 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:border-[var(--deyarun-primary)] hover:text-[var(--deyarun-primary)] transition-colors"
                >
                  Izveidot pielāgotu treniņu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarMain