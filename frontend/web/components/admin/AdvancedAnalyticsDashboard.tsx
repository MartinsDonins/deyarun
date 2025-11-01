import { useState, useEffect } from 'react'
import { apiService } from '../../lib/api'
import { logger } from '../../lib/productionLogger'

interface AnalyticsData {
  overview: {
    totalUsers: number
    activeUsers: number
    newUsersThisWeek: number
    userGrowthRate: number
    totalWorkouts: number
    workoutsThisWeek: number
    workoutGrowthRate: number
    totalRevenue: number
    revenueThisMonth: number
    revenueGrowthRate: number
    avgWorkoutsPerUser: number
    userRetentionRate: number
  }
  userAnalytics: {
    registrationTrends: Array<{ date: string; count: number }>
    activeUsersTrends: Array<{ date: string; count: number }>
    usersByRole: Array<{ role: string; count: number; percentage: number }>
    usersByRegion: Array<{ region: string; count: number }>
  }
  workoutAnalytics: {
    workoutTrends: Array<{ date: string; count: number }>
    workoutTypes: Array<{ type: string; count: number; percentage: number }>
    avgWorkoutDuration: Array<{ date: string; duration: number }>
    popularTimes: Array<{ hour: number; count: number }>
  }
  revenueAnalytics: {
    revenueTrends: Array<{ date: string; amount: number }>
    subscriptionBreakdown: Array<{ plan: string; count: number; revenue: number }>
    conversionRates: Array<{ period: string; rate: number }>
    churnAnalysis: Array<{ date: string; churnRate: number }>
  }
  engagementMetrics: {
    dailyActiveUsers: Array<{ date: string; count: number }>
    sessionDuration: Array<{ date: string; avgDuration: number }>
    featureUsage: Array<{ feature: string; usage: number; change: number }>
    userJourney: Array<{ step: string; users: number; conversionRate: number }>
  }
}

interface AdvancedAnalyticsDashboardProps {
  timeRange: '7d' | '30d' | '90d' | '1y'
  onTimeRangeChange: (range: '7d' | '30d' | '90d' | '1y') => void
}

export default function AdvancedAnalyticsDashboard({ timeRange, onTimeRangeChange }: AdvancedAnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'workouts' | 'revenue' | 'engagement'>('overview')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      const response = await apiService.get(`/api/admin/analytics/advanced?timeRange=${timeRange}`) as { data: AnalyticsData }
      setData(response.data)
    } catch (error) {
      logger.error('ERROR', 'Error loading analytics data:', { error: error })
      // Don't show fake data - let user know API is unavailable
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full"></div>
        <span className="ml-3 text-adaptive-light">Ielādē analītikas datus...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.08 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-adaptive-white mb-2">Analītikas dati nav pieejami</h3>
        <p className="text-adaptive-light text-sm mb-6">
          Servera kļūda vai API nav konfigurēts. Lūdzu, mēģiniet vēlāk vai sazinieties ar administratoru.
        </p>
        <button
          onClick={loadAnalyticsData}
          className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 transition-colors"
        >
          Mēģināt vēlreiz
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-adaptive-white">Detalizēta analītika</h2>
        <div className="flex gap-2">
          {[
            { value: '7d', label: '7 dienas' },
            { value: '30d', label: '30 dienas' },
            { value: '90d', label: '90 dienas' },
            { value: '1y', label: '1 gads' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => onTimeRangeChange(option.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === option.value
                  ? 'bg-coral text-adaptive-white'
                  : 'bg-gray-800 text-adaptive-light hover:text-adaptive-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 bg-gray-800/50 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Pārskats', icon: '📊' },
          { id: 'users', label: 'Lietotāji', icon: '👥' },
          { id: 'workouts', label: 'Treniņi', icon: '🏃‍♂️' },
          { id: 'revenue', label: 'Ieņēmumi', icon: '💰' },
          { id: 'engagement', label: 'Iesaiste', icon: '📈' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === tab.id
                ? 'bg-coral text-adaptive-white'
                : 'text-adaptive-light hover:text-adaptive-white'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-adaptive-light text-sm">Kopā lietotāji</p>
                <p className="text-2xl font-bold text-adaptive-white">{formatNumber(data.overview.totalUsers)}</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${
                  data.overview.userGrowthRate >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPercentage(data.overview.userGrowthRate)}
                </span>
                <p className="text-xs text-muted">šonedēļ</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-adaptive-light text-sm">Aktīvi lietotāji</p>
                <p className="text-2xl font-bold text-adaptive-white">{formatNumber(data.overview.activeUsers)}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-coral">
                  {((data.overview.activeUsers / data.overview.totalUsers) * 100).toFixed(1)}%
                </span>
                <p className="text-xs text-muted">no kopējā</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-adaptive-light text-sm">Treniņi</p>
                <p className="text-2xl font-bold text-adaptive-white">{formatNumber(data.overview.totalWorkouts)}</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${
                  data.overview.workoutGrowthRate >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPercentage(data.overview.workoutGrowthRate)}
                </span>
                <p className="text-xs text-muted">šonedēļ</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-adaptive-light text-sm">Ieņēmumi</p>
                <p className="text-2xl font-bold text-adaptive-white">{formatCurrency(data.overview.totalRevenue)}</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${
                  data.overview.revenueGrowthRate >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPercentage(data.overview.revenueGrowthRate)}
                </span>
                <p className="text-xs text-muted">šomēnes</p>
              </div>
            </div>
          </div>

          {/* Additional KPIs */}
          <div className="card">
            <div>
              <p className="text-adaptive-light text-sm">Vidējie treniņi uz lietotāju</p>
              <p className="text-2xl font-bold text-adaptive-white">{data.overview.avgWorkoutsPerUser.toFixed(1)}</p>
            </div>
          </div>

          <div className="card">
            <div>
              <p className="text-adaptive-light text-sm">Lietotāju noturēšana</p>
              <p className="text-2xl font-bold text-adaptive-white">{data.overview.userRetentionRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="card">
            <div>
              <p className="text-adaptive-light text-sm">Jauni lietotāji šonedēļ</p>
              <p className="text-2xl font-bold text-adaptive-white">{data.overview.newUsersThisWeek}</p>
            </div>
          </div>

          <div className="card">
            <div>
              <p className="text-adaptive-light text-sm">Treniņi šonedēļ</p>
              <p className="text-2xl font-bold text-adaptive-white">{data.overview.workoutsThisWeek}</p>
            </div>
          </div>
        </div>
      )}

      {/* Users Section */}
      {activeSection === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-adaptive-white mb-4">Lietotāji pēc lomām</h3>
            <div className="space-y-3">
              {data.userAnalytics.usersByRole.map((role) => (
                <div key={role.role} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-coral rounded-full"></div>
                    <span className="text-adaptive-light capitalize">
                      {role.role === 'admin' ? 'Administratori' : 
                       role.role === 'coach' ? 'Treneri' : 'Lietotāji'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-adaptive-white font-medium">{role.count}</span>
                    <span className="text-adaptive-light ml-2">({role.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-adaptive-white mb-4">Reģistrāciju dinamika</h3>
            <div className="h-48 flex items-end gap-2">
              {data.userAnalytics.registrationTrends.map((point, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-coral rounded-t"
                    style={{ height: `${(point.count / Math.max(...data.userAnalytics.registrationTrends.map(p => p.count))) * 100}%` }}
                  ></div>
                  <span className="text-xs text-adaptive-light mt-1">
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Workouts Section */}
      {activeSection === 'workouts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-adaptive-white mb-4">Treniņu veidi</h3>
            <div className="space-y-3">
              {data.workoutAnalytics.workoutTypes.map((type) => (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-coral rounded-full"></div>
                    <span className="text-adaptive-light capitalize">{type.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-adaptive-white font-medium">{type.count}</span>
                    <span className="text-adaptive-light ml-2">({type.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-adaptive-white mb-4">Populārākie laiki</h3>
            <div className="grid grid-cols-6 gap-2">
              {data.workoutAnalytics.popularTimes.map((time) => (
                <div key={time.hour} className="text-center">
                  <div 
                    className="w-full bg-coral rounded mb-1"
                    style={{ height: `${(time.count / Math.max(...data.workoutAnalytics.popularTimes.map(t => t.count))) * 40 + 10}px` }}
                  ></div>
                  <span className="text-xs text-adaptive-light">{time.hour}:00</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Section */}
      {activeSection === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.revenueAnalytics.subscriptionBreakdown.map((sub) => (
              <div key={sub.plan} className="card">
                <h4 className="text-adaptive-white font-medium mb-2">{sub.plan}</h4>
                <div className="text-2xl font-bold text-coral mb-1">
                  {formatCurrency(sub.revenue)}
                </div>
                <div className="text-sm text-adaptive-light">
                  {sub.count} aktīvi abonenti
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-adaptive-white mb-4">Ieņēmumu dinamika</h3>
            <div className="h-48 flex items-end gap-1">
              {data.revenueAnalytics.revenueTrends.map((point, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-green-500 rounded-t"
                    style={{ height: `${(point.amount / Math.max(...data.revenueAnalytics.revenueTrends.map(p => p.amount))) * 100}%` }}
                  ></div>
                  <span className="text-xs text-adaptive-light mt-1">
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Engagement Section */}
      {activeSection === 'engagement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-adaptive-white mb-4">Funkciju izmantošana</h3>
              <div className="space-y-3">
                {data.engagementMetrics.featureUsage.map((feature) => (
                  <div key={feature.feature} className="flex items-center justify-between">
                    <span className="text-adaptive-light">{feature.feature}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-adaptive-white">{feature.usage.toFixed(1)}%</span>
                      <span className={`text-xs ${
                        feature.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatPercentage(feature.change)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-adaptive-white mb-4">Lietotāju ceļojums</h3>
              <div className="space-y-3">
                {data.engagementMetrics.userJourney.map((step, index) => (
                  <div key={step.step} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-coral rounded-full flex items-center justify-center text-adaptive-white text-xs">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-adaptive-white">{step.step}</div>
                      <div className="text-sm text-adaptive-light">
                        {step.users} lietotāji ({step.conversionRate.toFixed(1)}% konversija)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}