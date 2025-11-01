import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminLogger } from '../lib/logger'
import { apiService } from '../lib/api'
import { logger } from '../lib/productionLogger'

export interface UserData {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'coach' | 'user'
  isActive: boolean
  isEmailVerified?: boolean
  emailVerificationSentAt?: string
  avatarUrl?: string
  phone?: string
  birthDate?: string
  gender?: 'male' | 'female' | 'other'
  weight?: number
  height?: number
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced'
  goals?: string[]
  preferences?: {
    units: 'metric' | 'imperial'
    privacy: 'public' | 'friends' | 'private'
    notifications: boolean
  }
  stats?: {
    totalWorkouts: number
    totalDistance: number
    totalDuration: number
    averagePace: string
    lastWorkout?: string
  }
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export interface UserFilters {
  role?: 'admin' | 'coach' | 'user' | 'all'
  isActive?: boolean
  search?: string
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt' | 'workouts'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export function useUsers(filters: UserFilters = {}) {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const { user: currentUser, isAdmin } = useAuth()

  const fetchUsers = async () => {
    if (!currentUser || !isAdmin) {
      adminLogger.debug('USER_ACCESS', 'fetchUsers skipped - no admin access', { currentUser: !!currentUser, isAdmin })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Build query string
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const endpoint = `/api/admin/users?${params.toString()}`

      adminLogger.logApiCall(endpoint, 'GET', { filters })

      const response = await fetch(`${apiUrl}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      adminLogger.logApiResponse(endpoint, response.status, { 
        usersCount: data.users?.length, 
        total: data.total,
        success: data.success 
      })

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users')
      }

      adminLogger.logDataTransformation('useUsers', 'Setting users state', data, { 
        usersCount: data.users?.length, 
        total: data.total 
      })
      
      setUsers(data.users || [])
      setTotal(data.total || 0)
      setError(null)
      
      adminLogger.info('USER_MANAGEMENT', `Successfully loaded ${data.users?.length || 0} users`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      adminLogger.logError('useUsers.fetchUsers', err, { filters, currentUser: currentUser?.email })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentUser, isAdmin, JSON.stringify(filters)])

  const updateUserRole = async (userId: string, newRole: 'admin' | 'coach' | 'user') => {
    try {
      adminLogger.logUserAction('update_user_role', userId, { newRole, oldRole: users.find(u => u.id === userId)?.role })
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const endpoint = `/api/admin/users/${userId}/role`

      adminLogger.logApiCall(endpoint, 'PUT', { userId, newRole })

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      })

      const data = await response.json()
      adminLogger.logApiResponse(endpoint, response.status, data)

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user role')
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))

      adminLogger.info('USER_MANAGEMENT', `Successfully updated user ${userId} role to ${newRole}`)
      return true
    } catch (err) {
      adminLogger.logError('useUsers.updateUserRole', err, { userId, newRole })
      throw err
    }
  }

  const toggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) throw new Error('User not found')

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !user.isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to update user status')
      }

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      ))

      return true
    } catch (err) {
      logger.error('ERROR', 'Error updating user status:', { error: err })
      throw err
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      // Update local state
      setUsers(users.filter(u => u.id !== userId))
      setTotal(total - 1)

      return true
    } catch (err) {
      logger.error('ERROR', 'Error deleting user:', { error: err })
      throw err
    }
  }

  const createUser = async (userData: Partial<UserData>) => {
    try {
      adminLogger.logUserAction('create_user', 'admin_panel', { fields: Object.keys(userData) })
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const endpoint = `/api/admin/users`

      adminLogger.logApiCall(endpoint, 'POST', { fields: Object.keys(userData) })

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()
      adminLogger.logApiResponse(endpoint, response.status, data)

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user')
      }

      // Server returns { success: true, user: {...} }
      const newUser = data.user
      setUsers([newUser, ...users])
      setTotal(total + 1)

      adminLogger.info('USER_MANAGEMENT', `Successfully created user ${newUser.id}`)
      return newUser
    } catch (err) {
      adminLogger.logError('useUsers.createUser', err, { fields: Object.keys(userData) })
      throw err
    }
  }

  const updateUser = async (userId: string, userData: Partial<UserData>) => {
    try {
      adminLogger.logUserAction('update_user_data', userId, { fields: Object.keys(userData) })
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const endpoint = `/api/admin/users/${userId}`

      adminLogger.logApiCall(endpoint, 'PUT', { userId, fields: Object.keys(userData) })

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()
      adminLogger.logApiResponse(endpoint, response.status, data)

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user')
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, ...userData } : user
      ))

      adminLogger.info('USER_MANAGEMENT', `Successfully updated user ${userId} data`)
      return data.user || data
    } catch (err) {
      adminLogger.logError('useUsers.updateUser', err, { userId, fields: Object.keys(userData) })
      throw err
    }
  }

  const verifyUserEmail = async (userId: string) => {
    try {
      adminLogger.logUserAction('verify_email', 'admin_panel', { userId })
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const endpoint = `/api/admin/users/${userId}/verify-email`

      adminLogger.logApiCall(endpoint, 'POST', { userId })

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      const data = await response.json()
      adminLogger.logApiResponse(endpoint, response.status, data)

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify user email')
      }

      // Update local state
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, isEmailVerified: true } 
          : u
      ))

      return true
    } catch (err) {
      logger.error('ERROR', 'Error verifying user email:', { error: err })
      throw err
    }
  }

  return {
    users,
    loading,
    error,
    total,
    refetch: fetchUsers,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    createUser,
    updateUser,
    verifyUserEmail
  }
}

interface UserStatsData {
  totalUsers: number
  activeUsers: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  usersByRole: {
    admin: number
    coach: number
    user: number
  }
  trends: {
    users: number
    activeUsers: number
  }
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStatsData>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    usersByRole: {
      admin: 0,
      coach: 0,
      user: 0
    },
    trends: {
      users: 0,
      activeUsers: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isAdmin } = useAuth()

  const fetchStats = async () => {
    if (!user || !isAdmin) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await apiService.request('/api/admin/users/stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      setStats(response as UserStatsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      logger.error('ERROR', 'Error fetching user stats:', { error: err })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [user, isAdmin])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}