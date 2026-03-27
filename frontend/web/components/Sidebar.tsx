import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { logger } from '../lib/productionLogger'
import {
  HomeIcon,
  CogIcon,
  PlayIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  AcademicCapIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Pārskats', href: '/dashboard', icon: HomeIcon },
  { name: 'Treniņi', href: '/workouts', icon: PlayIcon },
  { name: 'Treniņu plāni', href: '/training-plans', icon: AcademicCapIcon },
  { name: 'Abonements', href: '/subscription', icon: CreditCardIcon },
  { name: 'Iestatījumi', href: '/settings', icon: CogIcon },
]

export default function Sidebar() {
  const router = useRouter()
  const { user, logout, isAdmin } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      logger.error('ERROR', 'Logout error:', { error: error })
    }
  }

  // Close mobile menu when navigating on mobile
  useEffect(() => {
    const handleRouteChange = () => {
      setIsMobileMenuOpen(false)
    }
    
    router.events.on('routeChangeStart', handleRouteChange)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [router.events])

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-3 rounded-xl bg-surface border border-gray-700 text-adaptive-light hover:text-adaptive-white hover:bg-gray-700 transition-colors shadow-lg"
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:static lg:inset-0
        flex flex-col bg-surface border-r border-gray-800
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        w-64 lg:translate-x-0 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-coral rounded-lg flex items-center justify-center">
              <PlayIcon className="w-5 h-5 text-adaptive-white" />
            </div>
            <span className="text-xl font-bold gradient-text lg:block hidden">DeyaRun</span>
            <span className="text-lg font-bold gradient-text lg:hidden block">RA</span>
          </Link>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-adaptive-light hover:text-adaptive-white hover:bg-gray-800 transition-colors hidden lg:block"
          >
            {isCollapsed ? (
              <Bars3Icon className="w-5 h-5" />
            ) : (
              <XMarkIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = router.pathname === item.href || 
                           (item.href !== '/dashboard' && router.pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-primary text-adaptive-white' 
                    : 'text-adaptive-light hover:text-adaptive-white hover:bg-gray-800'
                  }
                  ${isCollapsed ? 'justify-center' : 'space-x-3'}
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User info and logout */}
        <div className="border-t border-gray-800 p-4">
          {user && (
            <div className="mb-4 px-3 py-2">
              <div className="text-sm font-medium text-adaptive-white truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-adaptive-light truncate">
                {user.email}
              </div>
            </div>
          )}
          
          {/* Admin Panel Access */}
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium mb-2 bg-red-600/20 text-red-300 hover:text-adaptive-white hover:bg-red-600/30 border border-red-600/30 transition-colors space-x-3"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Admin Panel</span>
            </Link>
          )}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-adaptive-light hover:text-adaptive-white hover:bg-gray-800 transition-colors space-x-3"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>Iziet</span>
          </button>
        </div>
      </div>
    </>
  )
}