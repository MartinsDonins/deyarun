import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageToggle from './LanguageToggle'
import NotificationCenter from './NotificationCenter'

const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => <div className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse" />
})
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

interface TopBarProps {
  title?: string
}

export default function TopBar({ title }: TopBarProps) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="bg-surface border-b border-gray-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:pl-6 lg:pr-6">
      {/* Left side - Title and Search */}
      <div className="flex items-center space-x-3 sm:space-x-6 flex-1 min-w-0">
        {/* Mobile spacing for sidebar button */}
        <div className="w-16 lg:w-0"></div>
        
        {title && (
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-adaptive-white truncate">{title}</h1>
        )}
        
        {/* Search - Hidden on mobile, shown on larger screens */}
        <div className="hidden lg:flex relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-adaptive-light" />
          </div>
          <input
            type="text"
            placeholder={t('search') || 'Meklēt...'}
            className="block w-48 xl:w-64 pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-adaptive-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Right side - Theme, Language, Notifications and User Menu */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Theme Toggle */}
        <ThemeToggle size="sm" />
        
        {/* Language Toggle - Hidden on very small screens */}
        <div className="hidden sm:block">
          <LanguageToggle />
        </div>
        
        {/* Notifications */}
        <NotificationCenter />

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg text-adaptive-light hover:text-adaptive-white hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <UserCircleIcon className="h-7 w-7 sm:h-8 sm:w-8" />
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium text-adaptive-white truncate max-w-32">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-adaptive-light truncate max-w-32">
                  {user?.email}
                </div>
              </div>
            </div>
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
              <Link
                href="/profile"
                className="flex items-center px-4 py-2 text-sm text-adaptive-light hover:bg-gray-700 hover:text-adaptive-white transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <UserCircleIcon className="h-4 w-4 mr-3" />
                {t('profile')}
              </Link>
              
              <Link
                href="/settings"
                className="flex items-center px-4 py-2 text-sm text-adaptive-light hover:bg-gray-700 hover:text-adaptive-white transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <Cog6ToothIcon className="h-4 w-4 mr-3" />
                {t('settings')}
              </Link>
              
              <div className="border-t border-gray-700 my-1"></div>
              
              <button
                onClick={() => {
                  logout()
                  setIsDropdownOpen(false)
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-adaptive-light hover:bg-gray-700 hover:text-adaptive-white transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}