import { useState, useEffect } from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../contexts/ThemeContext'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function ThemeToggle({ 
  className = '', 
  showLabel = false, 
  size = 'md' 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Only render after hydration to prevent SSR mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a skeleton/placeholder during SSR and initial hydration
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12'
    }
    
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showLabel && (
          <div className="w-12 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
        )}
        <div className={`${sizeClasses[size]} bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse`}></div>
      </div>
    )
  }

  const sizeClasses = {
    sm: 'w-8 h-8 p-1',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-3'
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {theme === 'dark' ? 'Tumšs' : 'Gaišs'}
        </span>
      )}
      
      <button
        onClick={toggleTheme}
        className={`${sizeClasses[size]} 
          bg-gray-200 dark:bg-gray-700 
          hover:bg-gray-300 dark:hover:bg-gray-600 
          rounded-lg transition-all duration-200 
          flex items-center justify-center
          border border-gray-300 dark:border-gray-600
          focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 
          dark:focus:ring-offset-gray-800
        `}
        title={theme === 'dark' ? 'Pārslēgties uz gaišo režīmu' : 'Pārslēgties uz tumšo režīmu'}
      >
        {theme === 'dark' ? (
          <SunIcon className={`${iconSizeClasses[size]} text-yellow-500`} />
        ) : (
          <MoonIcon className={`${iconSizeClasses[size]} text-gray-600`} />
        )}
      </button>
    </div>
  )
}