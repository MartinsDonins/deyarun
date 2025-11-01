import React from 'react'

type ViewMode = 'month' | 'week'

interface CalendarHeaderProps {
  currentDate: Date
  viewMode: ViewMode
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onViewModeChange: (mode: ViewMode) => void
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onPrevious,
  onNext,
  onToday,
  onViewModeChange
}) => {
  // Format the current period title
  const getTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      })
    } else {
      // For week view, show the week range
      const startOfWeek = new Date(currentDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Monday start
      startOfWeek.setDate(diff)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${startOfWeek.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        })}`
      } else {
        return `${startOfWeek.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })} - ${endOfWeek.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })}`
      }
    }
  }

  return (
    <div className="glass-nav px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Navigation */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={onPrevious}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-adaptive-light hover:text-adaptive-white"
              title={viewMode === 'month' ? 'Iepriekšējais mēnesis' : 'Iepriekšējā nedēļa'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={onNext}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-adaptive-light hover:text-adaptive-white"
              title={viewMode === 'month' ? 'Nākamais mēnesis' : 'Nākamā nedēļa'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={onToday}
              className="px-3 py-1.5 text-sm rounded-lg hover:bg-white/10 transition-colors text-adaptive-light hover:text-adaptive-white"
            >
              Šodien
            </button>
          </div>

          {/* Current period title */}
          <h1 className="text-xl md:text-2xl font-bold text-adaptive-white capitalize">
            {getTitle()}
          </h1>
        </div>

        {/* Right side - View controls and actions */}
        <div className="flex items-center space-x-3">
          {/* View mode toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('month')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-[var(--deyarun-primary)] text-adaptive-white'
                  : 'text-adaptive-light hover:text-adaptive-white'
              }`}
            >
              Mēnesis
            </button>
            <button
              onClick={() => onViewModeChange('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-[var(--deyarun-primary)] text-adaptive-white'
                  : 'text-adaptive-light hover:text-adaptive-white'
              }`}
            >
              Nedēļa
            </button>
          </div>

          {/* Actions dropdown */}
          <div className="relative">
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-adaptive-light hover:text-adaptive-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Legend for workout types */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-adaptive-light">Treniņu tipi:</span>
          
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-500/50"></div>
            <span className="text-green-300">Viegls</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-yellow-500/50"></div>
            <span className="text-yellow-300">Tempo</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-red-500/50"></div>
            <span className="text-red-300">Intervāli</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-purple-500/50"></div>
            <span className="text-purple-300">Garš</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-blue-500/50"></div>
            <span className="text-blue-300">Atjaunošanās</span>
          </div>

          {/* Quick add hint */}
          <div className="ml-auto text-muted hidden md:block">
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <span>Dubultklikšķis = jauns treniņš</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarHeader