import AdminLayout from '../../components/layout/AdminLayout'
import { withAdminAuth, useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useHealthCheck } from '../../hooks/useApi'
import { useUserStats } from '../../hooks/useUsers'
import { useVersionInfo, formatVersion, isVersionOutdated } from '../../hooks/useVersionInfo'
import { getAuthToken } from '../../lib/auth'
import LogViewer from '../../components/admin/LogViewer'
import CoolifyDeploymentStatus from '../../components/admin/CoolifyDeploymentStatus'
import ErrorNotifications from '../../components/admin/ErrorNotifications'
import SystemInfoPanel from '../../components/admin/SystemInfoPanel'
import { logger } from '../../lib/productionLogger'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalWorkouts: number
  totalSubscriptions: number
  revenueThisMonth: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  trends: {
    users: number
    workouts: number
    revenue: number
  }
}

interface RecentActivity {
  id: string
  type: 'user_registration' | 'workout_completed' | 'subscription_created' | 'system_event'
  message: string
  timestamp: string
  status: 'success' | 'warning' | 'error'
}

function AdminDashboard() {
  const { user } = useAuth()
  const { isHealthy, healthData } = useHealthCheck()
  const { stats: userStats, loading: userStatsLoading, error: userStatsError } = useUserStats()
  const { versions, systemHealth, loading: versionLoading, error: versionError, lastUpdated, refresh: refreshVersions } = useVersionInfo()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalWorkouts: 0,
    totalSubscriptions: 0,
    revenueThisMonth: 0,
    systemHealth: 'healthy',
    trends: { users: 0, workouts: 0, revenue: 0 }
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAdminStats = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      
      // Temporarily disabled analytics - using static data
      logger.info('COMPONENT', 'Analytics temporarily disabled - using static dashboard data')

      // Use static data instead of analytics endpoints
      setStats({
        totalUsers: userStats?.totalUsers || 0,
        activeUsers: userStats?.activeUsers || 0,
        totalWorkouts: 0, // Temporarily disabled
        totalSubscriptions: 0, // Temporarily disabled
        revenueThisMonth: 0, // Temporarily disabled
        systemHealth: isHealthy ? 'healthy' : 'warning',
        trends: {
          users: 0, // Temporarily disabled
          workouts: 0, // Temporarily disabled
          revenue: 0 // Temporarily disabled
        }
      })

      // Use static activity data
      setRecentActivity([
        {
          id: '1',
          type: 'system_event',
          message: 'Sistema veiksmīgi inicializēta',
          timestamp: new Date().toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'system_event',
          message: 'Analītika īslaicīgi atspējota attīstības nolūkos',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          status: 'warning'
        }
      ])

    } catch (err) {
      logger.error('ERROR', 'Error fetching admin stats:', { error: err })
      setError('Nav iespējams ielādēt admin datus')
      // Set fallback data
      setStats({
        totalUsers: userStats.totalUsers || 0,
        activeUsers: userStats.activeUsers || 0,
        totalWorkouts: 0,
        totalSubscriptions: 0,
        revenueThisMonth: 0,
        systemHealth: isHealthy ? 'healthy' : 'warning',
        trends: { 
          users: userStats.trends?.users || 0, 
          workouts: 0, 
          revenue: 0 
        }
      })
      // Load recent system activities
      await loadRecentActivity()
    } finally {
      setLoading(false)
    }
  }

  const loadRecentActivity = async () => {
    try {
      const token = await getAuthToken()
      if (!token) {
        logger.info('COMPONENT', 'No admin token found, showing empty activities')
        setRecentActivity([])
        return
      }

      // Make API call to get real system activities
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/admin/activities`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      logger.info('COMPONENT', 'Admin activities API response status:', { status: response.status })

      if (response.ok) {
        const data = await response.json()
        logger.info('COMPONENT', 'Admin activities data received:', { data })
        
        // Handle different response structures
        const activities = data.data?.activities || data.activities || data || []
        
        // Map API data to our interface format
        const formattedActivities: RecentActivity[] = activities.map((activity: any) => ({
          id: activity._id || activity.id || Math.random().toString(),
          type: activity.type || 'system_event',
          message: activity.message || activity.description || 'System activity',
          timestamp: activity.timestamp || activity.createdAt || new Date().toISOString(),
          status: activity.status || 'success'
        }))
        
        setRecentActivity(formattedActivities.slice(0, 5)) // Show only latest 5
      } else if (response.status === 404) {
        // If activities endpoint doesn't exist yet, show empty state with message
        logger.info('COMPONENT', 'Admin activities endpoint not implemented yet')
        setRecentActivity([
          {
            id: 'empty-1',
            type: 'system_event',
            message: 'Sistēmas aktivitāšu endpoint nav implementēts vēl',
            timestamp: new Date().toISOString(),
            status: 'success'
          }
        ])
      } else {
        logger.warn('WARNING', 'Failed to load admin activities:', { status: response.status })
        setRecentActivity([
          {
            id: 'error-1',
            type: 'system_event',
            message: 'Neizdevās ielādēt sistēmas aktivitātes',
            timestamp: new Date().toISOString(),
            status: 'success'
          }
        ])
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading admin activities:', { error: error })
      setRecentActivity([
        {
          id: 'error-2',
          type: 'system_event',
          message: 'Error ielādējot sistēmas aktivitātes',
          timestamp: new Date().toISOString(),
          status: 'success'
        }
      ])
    }
  }

  useEffect(() => {
    if (!userStatsLoading) {
      fetchAdminStats()
    }
  }, [isHealthy, userStatsLoading, userStats])

  // Combine loading states  
  const isLoading = loading || userStatsLoading

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        )
      case 'workout_completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'subscription_created':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <AdminLayout title="Admin pārskats">
        <div className="animate-pulse space-y-6">
          {/* Loading Alert */}
          <div className="bg-gray-800/50 border border-gray-600 rounded-xl h-16"></div>
          
          {/* Loading Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-600 rounded-xl h-32"></div>
            ))}
          </div>
          
          {/* Loading Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-600 rounded-xl h-64"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Admin pārskats">
      <div className="min-h-screen bg-adaptive relative overflow-x-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-orange-900/20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, rgba(251, 146, 60, 0.1) 0%, transparent 50%)`
        }}></div>
        
        <div className="relative z-10 p-6 space-y-6">
          {/* Header */}
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-adaptive-white">
                    Laipni lūgti, {user?.firstName || 'Administrator'}!
                  </h1>
                  <p className="text-adaptive-light">
                    Sistēmas pārvaldes panelis un reāllaika statistika
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={fetchAdminStats}
                  className="glass-button-primary"
                  disabled={isLoading}
                >
                  <svg className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isLoading ? 'Updating...' : 'Refresh datus'}
                </button>
              </div>
            </div>
          </div>

          {/* Error Alerts */}
          {error && (
            <div className="glass-card-error p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-red-400 text-sm">Admin dati: {error}</span>
              </div>
            </div>
          )}
          
          {versionError && (
            <div className="glass-card p-4 border-yellow-500/30">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-yellow-400 text-sm">Versiju info: {versionError}</span>
              </div>
            </div>
          )}

          {/* Consolidated System Information */}
          <SystemInfoPanel />

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6 hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-adaptive-muted text-sm font-medium">Kopējie lietotāji</p>
                  <p className="text-3xl font-bold text-adaptive-white mt-2">{stats.totalUsers.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <svg className={`w-4 h-4 mr-1 ${stats.trends.users >= 0 ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stats.trends.users >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                    </svg>
                    <span className={`text-sm ${stats.trends.users >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.trends.users >= 0 ? '+' : ''}{stats.trends.users}% šomēnes
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-adaptive-muted text-sm font-medium">Aktīvie lietotāji</p>
                  <p className="text-3xl font-bold text-adaptive-white mt-2">{stats.activeUsers.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                    <span className="text-sm text-adaptive-light">
                      {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% no kopējiem
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
          </div>

            <div className="glass-card p-6 hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-adaptive-muted text-sm font-medium">Kopējie treniņi</p>
                  <p className="text-3xl font-bold text-adaptive-white mt-2">{stats.totalWorkouts.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <svg className={`w-4 h-4 mr-1 ${stats.trends.workouts >= 0 ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stats.trends.workouts >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                    </svg>
                    <span className={`text-sm ${stats.trends.workouts >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.trends.workouts >= 0 ? '+' : ''}{stats.trends.workouts}% šomēnes
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 hover:scale-105 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-adaptive-muted text-sm font-medium">Ieņēmumi šomēnes</p>
                  <p className="text-3xl font-bold text-adaptive-white mt-2">€{stats.revenueThisMonth.toFixed(2)}</p>
                  <div className="flex items-center mt-1">
                    <svg className={`w-4 h-4 mr-1 ${stats.trends.revenue >= 0 ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stats.trends.revenue >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                    </svg>
                    <span className={`text-sm ${stats.trends.revenue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.trends.revenue >= 0 ? '+' : ''}{stats.trends.revenue}% šomēnes
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
        </div>

        {/* Error Monitoring & Coolify Deployment */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <CoolifyDeploymentStatus />
          <ErrorNotifications />
        </div>

        {/* Admin Logs Section */}
        <LogViewer className="mb-8" />

          {/* Management Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-adaptive-white mb-4 flex items-center">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                Ātrās darbības
              </h3>
              <div className="space-y-3">
                <a href="/admin/users" className="glass-button-secondary w-full text-left p-3 block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <span className="text-adaptive-white">Pārvaldīt lietotājus</span>
                    </div>
                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
                
                <a href="/admin/workouts" className="glass-button-secondary w-full text-left p-3 block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-adaptive-white">Treniņu pārskats</span>
                    </div>
                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
                
                <button className="glass-button-disabled w-full text-left p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-adaptive-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-adaptive-muted">Ģenerēt atskaites</span>
                    </div>
                    <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">Drīzumā</span>
                  </div>
                </button>
                
                <button className="glass-button-disabled w-full text-left p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-adaptive-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-adaptive-muted">Sistēmas iestatījumi</span>
                    </div>
                    <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">Drīzumā</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-adaptive-white mb-4 flex items-center">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Pēdējās aktivitātes
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(activity.status).replace('text-', 'bg-').replace('400', '400/20')}`}>
                        <div className={getStatusColor(activity.status)}>
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-adaptive-light text-sm">{activity.message}</p>
                        <p className="text-adaptive-muted text-xs mt-1">
                          {new Date(activity.timestamp).toLocaleString('en-US')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-adaptive-light text-sm">Nav pēdējo aktivitāšu</p>
                )}
              </div>
              {recentActivity.length > 0 && (
                <button className="glass-button-secondary w-full mt-4 py-2 text-center text-sm">
                  Apskatīt visu aktivitāti
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default withAdminAuth(AdminDashboard)
