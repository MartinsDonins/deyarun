import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/router'
// Supabase removed - using backend auth only
import { adminLogger } from '../lib/logger'
import { logger } from '../lib/productionLogger'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string
  profilePicture?: string
  googleId?: string
  isEmailVerified: boolean
  theme: string
  subscriptionType?: string
  role?: 'user' | 'admin' | 'coach' | 'super_admin'
  birthDate?: string
  createdAt?: string
  totalWorkouts?: number
  loginCount?: number
  height?: number
  weight?: number
  gender?: string
  fitnessLevel?: string
  weeklyGoal?: number
  preferredDistance?: string
  sleepHours?: number
  stressLevel?: number
  nutritionQuality?: number
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  loginWithGoogle: () => void
  logout: () => void
  refreshUser: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isCoach: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // REMOVED: localStorage backup loading causes profile switching
  // Backend cookie is single source of truth for authentication
  // localStorage only used as offline backup after successful auth check

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Authentication handled via httpOnly cookies
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/me`, {
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          logger.info('COMPONENT', 'Auth check response:', { data })
          setUser(data.user)
          setToken('cookie-based') // Token is now cookie-based

          // Save user to localStorage as backup for offline scenarios
          localStorage.setItem('user_backup', JSON.stringify(data.user))

          // Initialize admin logger
          const isAdminUser = data.user?.role === 'admin' || data.user?.role === 'super_admin'
          adminLogger.setAdminStatus(isAdminUser, data.user?.role)

          if (isAdminUser) {
            adminLogger.info('AUTH', `Admin user logged in: ${data.user.email}`, { role: data.user.role })
          }
        } else if (response.status === 401 || response.status === 403) {
          // Only logout on authentication/authorization errors
          logger.info('AUTH', 'User not authenticated (401/403), logging out')
          setUser(null)
          setToken(null)
          localStorage.removeItem('user_backup')
          adminLogger.setAdminStatus(false)
        } else {
          // Server error (5xx) or other error - don't logout user
          // Keep existing state to prevent refresh logout
          logger.warn('AUTH', `Server error ${response.status}, keeping current auth state`)
        }
      } catch (error) {
        logger.error('ERROR', 'Auth check failed:', { error: error })
        // Network error or server unavailable - don't logout user
        // Keep existing auth state to prevent refresh logout
        logger.warn('AUTH', 'Network error during auth check, keeping current auth state')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Refresh user data from server
  const refreshUser = async (): Promise<void> => {
    try {
      // Authentication handled via httpOnly cookies
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/me`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        logger.info('COMPONENT', 'User data refreshed:', { user: data.user })
        setUser(data.user)
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to refresh user:', { error: error })
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        setToken('cookie-based') // Token is now cookie-based

        // Save user to localStorage as backup for offline scenarios
        localStorage.setItem('user_backup', JSON.stringify(data.user))

        // Initialize admin logger for new login
        const isAdminUser = data.user?.role === 'admin' || data.user?.role === 'super_admin'
        adminLogger.setAdminStatus(isAdminUser, data.user?.role)

        if (isAdminUser) {
          adminLogger.info('AUTH', `Admin user logged in: ${data.user.email}`, { role: data.user.role })
        }

        return true
      } else {
        throw new Error(data.message || 'Login failed')
      }
    } catch (error) {
      logger.error('ERROR', 'Login error:', { error: error })
      return false
    }
  }

  const loginWithGoogle = async () => {
    try {
      // Redirect directly to backend Google OAuth endpoint
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/google`
    } catch (error: any) {
      logger.error('ERROR', 'Google login error:', { error: error })
      // Could add error handling here if needed
    }
  }

  const logout = async () => {
    try {
      // Call backend logout to clear httpOnly cookies
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      logger.error('ERROR', 'Logout API call failed:', { error: error })
    }

    adminLogger.info('AUTH', 'User logged out')
    adminLogger.setAdminStatus(false)

    // FORCE CLEAR: All auth data from all storage types
    setUser(null)
    setToken(null)

    // Clear localStorage (all auth-related keys)
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    localStorage.removeItem('user_backup')
    localStorage.removeItem('token') // Legacy key

    // Clear sessionStorage (in case anything was cached there)
    sessionStorage.clear()

    // Hard redirect with page reload to clear all state
    // Add logout parameter to prevent withPublicRoute redirect loop
    window.location.href = '/auth/login'
  }

  const value = {
    user,
    token,
    login,
    loginWithGoogle,
    logout,
    refreshUser,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isCoach: user?.role === 'coach'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/auth/login'
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(redirectTo)
      }
    }, [isAuthenticated, isLoading, router])

    if (isLoading) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null
    }

    return <Component {...props} />
  }
}

// Public routes that should redirect to dashboard if user is already authenticated
export function withPublicRoute<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/dashboard'
) {
  return function PublicRouteComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      // Don't redirect if this is a logout redirect (prevents redirect loop)
      const isLogoutRedirect = router.query.logout === 'true'

      if (!isLoading && isAuthenticated && !isLogoutRedirect) {
        router.push(redirectTo)
      }
    }, [isAuthenticated, isLoading, router])

    if (isLoading) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (isAuthenticated) {
      return null
    }

    return <Component {...props} />
  }
}

// Admin-only routes that require admin role
export function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/dashboard'
) {
  return function AdminAuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, isAdmin } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/auth/login')
      } else if (!isLoading && isAuthenticated && !isAdmin) {
        // Redirect non-admin users to regular dashboard
        router.push(redirectTo)
      }
    }, [isAuthenticated, isLoading, isAdmin, router])

    if (isLoading) {
      return (
        <div className="min-h-screen bg-red-950 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto mb-4"></div>
            <p className="text-red-300">Pārbauda admin piekļuvi...</p>
          </div>
        </div>
      )
    }

    if (!isAuthenticated || !isAdmin) {
      return null
    }

    return <Component {...props} />
  }
}