import { useState, useRef, useEffect } from 'react'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
  className?: string
  minDate?: string
  maxDate?: string
}

const months = [
  'Janvāris', 'Februāris', 'Marts', 'Aprīlis', 'Maijs', 'Jūnijs',
  'Jūlijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decembris'
]

const weekdays = ['Sv', 'Pr', 'Ot', 'Tr', 'Ce', 'Pk', 'Se']

export default function DatePicker({ 
  value, 
  onChange, 
  placeholder = 'Izvēlieties datumu',
  className = '',
  minDate,
  maxDate
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [inputValue, setInputValue] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedDate = value ? new Date(value) : null

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
      setInputValue(formatDate(selectedDate))
    } else {
      setInputValue('')
    }
  }, [selectedDate])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1 // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  }

  const isDateDisabled = (date: Date) => {
    if (minDate && date < new Date(minDate)) return true
    if (maxDate && date > new Date(maxDate)) return true
    return false
  }

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    
    if (!isDateDisabled(newDate)) {
      onChange(formatDateForInput(newDate))
      setIsOpen(false)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const parseInputDate = (input: string) => {
    // Support multiple date formats: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
    const cleanInput = input.replace(/[^\d]/g, '')
    
    // Allow both 8 digits (DDMMYYYY) and partial input
    if (cleanInput.length >= 6 && cleanInput.length <= 8) {
      let day, month, year
      
      if (cleanInput.length === 8) {
        day = cleanInput.substring(0, 2)
        month = cleanInput.substring(2, 4)
        year = cleanInput.substring(4, 8)
      } else if (cleanInput.length === 6) {
        // Assume short year format (DDMMYY) and add 19/20 prefix
        day = cleanInput.substring(0, 2)
        month = cleanInput.substring(2, 4)
        const shortYear = parseInt(cleanInput.substring(4, 6))
        year = shortYear > 30 ? `19${shortYear}` : `20${shortYear}` // Assume 30+ is 1900s
      } else {
        return null
      }
      
      const dayNum = parseInt(day)
      const monthNum = parseInt(month)
      const yearNum = parseInt(year)
      
      // Basic validation
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
        return null
      }
      
      const date = new Date(yearNum, monthNum - 1, dayNum)
      
      // Validate the date is real and within bounds
      if (date.getDate() === dayNum && 
          date.getMonth() === monthNum - 1 && 
          date.getFullYear() === yearNum &&
          !isDateDisabled(date)) {
        return date
      }
    }
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value
    setInputValue(inputVal)
    
    // Try to parse and validate the input
    const parsedDate = parseInputDate(inputVal)
    if (parsedDate) {
      onChange(formatDateForInput(parsedDate))
      setCurrentDate(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1))
    }
  }

  const handleInputBlur = () => {
    // If input is not a valid date, reset to current value or empty
    const parsedDate = parseInputDate(inputValue)
    if (!parsedDate && inputValue) {
      if (selectedDate) {
        setInputValue(formatDate(selectedDate))
      } else {
        setInputValue('')
      }
    }
  }

  const calendarDays = generateCalendarDays()

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative flex">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="DD.MM.GGGG vai izvēlieties no kalendāra"
          className="w-full px-3 py-3 bg-gray-800 border border-gray-600 rounded-l-md text-white focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral transition-colors pr-10"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-3 bg-gray-800 border border-l-0 border-gray-600 rounded-r-md text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral transition-colors"
        >
          <CalendarIcon className="w-5 h-5 text-gray-400 hover:text-coral transition-colors" />
        </button>
      </div>
      
      <p className="text-xs text-gray-400 mt-1">
        Ievadiet datumu formātā DD.MM.GGGG (piemēram: 15.03.1990) vai izmantojiet kalendāru
      </p>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg p-4 min-w-[280px]">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-400" />
            </button>
            
            <div className="flex items-center space-x-2">
              {/* Month Selector */}
              <select
                value={currentDate.getMonth()}
                onChange={(e) => setCurrentDate(new Date(currentDate.getFullYear(), parseInt(e.target.value), 1))}
                className="bg-gray-700 text-white text-sm border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-coral cursor-pointer hover:bg-gray-600 transition-colors"
                title="Izvēlieties mēnesi"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              
              {/* Year Selector with improved range */}
              <select
                value={currentDate.getFullYear()}
                onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), currentDate.getMonth(), 1))}
                className="bg-gray-700 text-white text-sm border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-coral cursor-pointer hover:bg-gray-600 transition-colors"
                title="Izvēlieties gadu"
              >
                {Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - 100 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdays.map(day => (
              <div key={day} className="text-center text-xs text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={index} className="h-8"></div>
              }

              const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
              const isSelected = selectedDate && 
                cellDate.getDate() === selectedDate.getDate() &&
                cellDate.getMonth() === selectedDate.getMonth() &&
                cellDate.getFullYear() === selectedDate.getFullYear()
              const isDisabled = isDateDisabled(cellDate)
              const isToday = cellDate.toDateString() === new Date().toDateString()

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={isDisabled}
                  className={`
                    h-8 w-8 text-sm rounded hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition-colors
                    ${isSelected ? 'bg-coral text-white' : 'text-gray-300'}
                    ${isToday && !isSelected ? 'ring-1 ring-coral' : ''}
                    ${isDisabled ? 'text-gray-600 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer'}
                  `}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                title="Pāriet uz šo gadu"
              >
                {new Date().getFullYear()}
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date(1990, 0, 1))}
                className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                title="Populārs dzimšanas gads"
              >
                1990
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date(1985, 0, 1))}
                className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                title="Populārs dzimšanas gads"
              >
                1985
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date(1980, 0, 1))}
                className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                title="Populārs dzimšanas gads"
              >
                1980
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                const today = new Date()
                if (!isDateDisabled(today)) {
                  onChange(formatDateForInput(today))
                  setIsOpen(false)
                }
              }}
              className="text-sm text-coral hover:text-coral/80"
            >
              Šodiena
            </button>
          </div>
        </div>
      )}
    </div>
  )
}