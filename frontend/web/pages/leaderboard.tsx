import { useState, useEffect } from 'react'
import ProtectedLayout from '../components/layout/ProtectedLayout'
import { useAuth, withAuth } from '../contexts/AuthContext'
import { getAuthToken } from '../lib/auth'
import { logger } from '../lib/productionLogger'

interface LeaderboardEntry {
  userId: string
  firstName: string
  lastName: string
  avatarUrl?: string
  totalDistance: number
  totalWorkouts: number
  totalDuration: number
  averagePace: string
  bestPace: string
  thisMonthDistance: number
  thisWeekDistance: number
  rank: number
  previousRank?: number
}

interface LeaderboardStats {
  totalParticipants: number
  averageDistance: number
  topDistance: number
  yourRank?: number
  yourStats?: {
    totalDistance: number
    totalWorkouts: number
    rank: number
  }
}

function LeaderboardPage() {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [stats, setStats] = useState<LeaderboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('month')
  const [metric, setMetric] = useState<'distance' | 'workouts' | 'duration'>('distance')

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      
      const params = new URLSearchParams({
        period: timeFilter,
        metric: metric,
        limit: '50'
      })

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${API_BASE_URL}/api/leaderboard?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }

      const data = await response.json()
      setLeaderboard(data.leaderboard || [])
      setStats(data.stats || null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      logger.error('ERROR', 'Error fetching leaderboard:', { error: err })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchLeaderboard()
    }
  }, [user, timeFilter, metric])

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  const getRankChange = (entry: LeaderboardEntry) => {
    if (!entry.previousRank) return null
    
    const change = entry.previousRank - entry.rank
    if (change > 0) {
      return (
        <span className="text-green-400 text-xs flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
          +{change}
        </span>
      )
    } else if (change < 0) {
      return (
        <span className="text-red-400 text-xs flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
          {Math.abs(change)}
        </span>
      )
    }
    return (
      <span className="text-gray-400 text-xs">
        =
      </span>
    )
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold">
            1
          </div>
        )
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-300 to-gray-500 flex items-center justify-center text-white font-bold">
            2
          </div>
        )
      case 3:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-600 to-amber-800 flex items-center justify-center text-white font-bold">
            3
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-medium">
            {rank}
          </div>
        )
    }
  }

  const getMetricValue = (entry: LeaderboardEntry) => {
    switch (metric) {
      case 'distance':
        return timeFilter === 'week' 
          ? formatDistance(entry.thisWeekDistance)
          : timeFilter === 'month'
          ? formatDistance(entry.thisMonthDistance) 
          : formatDistance(entry.totalDistance)
      case 'workouts':
        return `${entry.totalWorkouts} treniņi`
      case 'duration':
        return formatDuration(entry.totalDuration)
      default:
        return ''
    }
  }

  const getMetricLabel = () => {
    switch (metric) {
      case 'distance':
        return 'Distance'
      case 'workouts':
        return 'Treniņi'
      case 'duration':
        return 'Laiks'
      default:
        return ''
    }
  }

  const isCurrentUser = (entry: LeaderboardEntry) => {
    return entry.userId === user?.id
  }

  return (
    <ProtectedLayout title="Līderu tabula">
      <div className="space-y-6">
        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
              >
                <option value="week">Šī nedēļa</option>
                <option value="month">Šis mēnesis</option>
                <option value="all">Kopumā</option>
              </select>

              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as any)}
                className="px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
              >
                <option value="distance">Pēc distances</option>
                <option value="workouts">Pēc treniņiem</option>
                <option value="duration">Pēc laika</option>
              </select>
            </div>

            <button
              onClick={fetchLeaderboard}
              className="text-coral hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">{stats.totalParticipants}</div>
                <div className="text-gray-400">Dalībnieki</div>
              </div>
            </div>
            <div className="card">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">{formatDistance(stats.topDistance)}</div>
                <div className="text-gray-400">Labākais rezultāts</div>
              </div>
            </div>
            <div className="card">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">{formatDistance(stats.averageDistance)}</div>
                <div className="text-gray-400">Vidējā distance</div>
              </div>
            </div>
            {stats.yourRank && (
              <div className="card">
                <div className="text-center">
                  <div className="text-2xl font-bold text-coral mb-1">#{stats.yourRank}</div>
                  <div className="text-gray-400">Jūsu vieta</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Līderu tabula - {getMetricLabel()}
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-400">Ielādē līderu tabulu...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              Error ielādējot līderu tabulu: {error}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">Nav pieejami dati</h3>
              <p className="text-gray-400">Pašlaik nav pietiekami dati līderu tabulas attēlošanai.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0, 3).map((entry) => (
                <div
                  key={entry.userId}
                  className={`p-4 rounded-lg border transition-colors ${
                    isCurrentUser(entry)
                      ? 'border-coral bg-coral/10'
                      : entry.rank === 1
                      ? 'border-yellow-500/50 bg-yellow-500/10'
                      : entry.rank === 2
                      ? 'border-gray-400/50 bg-gray-400/10'
                      : entry.rank === 3
                      ? 'border-amber-600/50 bg-amber-600/10'
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getRankIcon(entry.rank)}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-coral flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {entry.firstName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {entry.firstName} {entry.lastName}
                            {isCurrentUser(entry) && (
                              <span className="ml-2 text-xs bg-coral px-2 py-1 rounded-full text-white">
                                Jūs
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            {entry.totalWorkouts} treniņi • Labākais: {entry.bestPace}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">
                          {getMetricValue(entry)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {getRankChange(entry)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {leaderboard.length > 3 && (
                <div className="pt-4">
                  <div className="space-y-1">
                    {leaderboard.slice(3).map((entry) => (
                      <div
                        key={entry.userId}
                        className={`p-3 rounded-lg border transition-colors ${
                          isCurrentUser(entry)
                            ? 'border-coral bg-coral/10'
                            : 'border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-sm font-medium">
                              {entry.rank}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full gradient-coral flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">
                                  {entry.firstName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-white text-sm">
                                  {entry.firstName} {entry.lastName}
                                  {isCurrentUser(entry) && (
                                    <span className="ml-2 text-xs bg-coral px-2 py-1 rounded-full text-white">
                                      Jūs
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-medium text-white text-sm">
                                {getMetricValue(entry)}
                              </div>
                            </div>
                            {getRankChange(entry)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}

export default withAuth(LeaderboardPage)
