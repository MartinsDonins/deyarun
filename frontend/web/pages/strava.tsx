import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import ProtectedLayout from '../components/layout/ProtectedLayout'
import { useAuth } from '../contexts/AuthContext'
import { isAuthenticated } from '../lib/auth'
import { logger } from '../lib/productionLogger'

interface StravaActivity {
  id: string
  name: string
  type: string
  start_date: string
  distance: number
  moving_time: number
  total_elevation_gain: number
  average_speed: number
  max_speed: number
  kudos_count: number
  imported?: boolean
  workout_id?: string
}

function StravaPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [activities, setActivities] = useState<StravaActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null)

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const checkStravaStatus = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      const response = await fetch(`${API_BASE_URL}/api/strava/status`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConnected(data.connected && !data.expired)
        return data.connected && !data.expired
      }
      return false
    } catch (error) {
      logger.error('ERROR', 'Error checking Strava status:', { error: error })
      return false
    }
  }

  const loadActivities = async (pageNum = 1) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      const response = await fetch(`${API_BASE_URL}/api/strava/activities?page=${pageNum}&per_page=20`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const newActivities = data.activities || []
        
        // Show demo message if in demo mode
        if (data.demo && pageNum === 1) {
          showMessage('info', '📱 Test mode: Displaying simulated Strava activities')
        }
        
        if (pageNum === 1) {
          setActivities(newActivities)
        } else {
          setActivities(prev => [...prev, ...newActivities])
        }
        
        setHasMore(newActivities.length === 20)
      } else {
        throw new Error('Error ielādējot aktivitātes')
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading activities:', { error: error })
      showMessage('error', error instanceof Error ? error.message : 'Error ielādējot aktivitātes')
    }
  }

  const importActivity = async (activityId: string) => {
    setImporting(activityId)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      const response = await fetch(`${API_BASE_URL}/api/strava/import/${activityId}`, {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update activity status
        setActivities(prev => prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, imported: true, workout_id: data.workoutId }
            : activity
        ))
        
        // Show different message for demo mode
        const message = data.demo 
          ? '🎯 Test mode: Activity imported successfully!' 
          : 'Aktivitāte veiksmīgi importēta!'
        
        showMessage('success', message)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error importējot aktivitāti')
      }
    } catch (error) {
      logger.error('ERROR', 'Error importing activity:', { error: error })
      showMessage('error', error instanceof Error ? error.message : 'Error importējot aktivitāti')
    } finally {
      setImporting(null)
    }
  }

  const connectStrava = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      
      const response = await fetch(`${API_BASE_URL}/api/strava/auth`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.authUrl
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error savienojot ar Strava')
      }
    } catch (error) {
      logger.error('ERROR', 'Error connecting to Strava:', { error: error })
      showMessage('error', error instanceof Error ? error.message : 'Error savienojot ar Strava')
    }
  }

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2) + ' km'
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  }

  const formatPace = (metersPerSecond: number) => {
    const secondsPerKm = 1000 / metersPerSecond
    const minutes = Math.floor(secondsPerKm / 60)
    const seconds = Math.floor(secondsPerKm % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const isConnected = await checkStravaStatus()
      
      if (isConnected) {
        await loadActivities()
      }
      
      setLoading(false)
    }

    init()
  }, [])

  const loadMore = async () => {
    const nextPage = page + 1
    setPage(nextPage)
    await loadActivities(nextPage)
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin w-12 h-12 border-2 border-coral border-t-transparent rounded-full"></div>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  if (!connected) {
    return (
      <ProtectedLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.343 0l-7 14.345h4.172"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Strava Integrācija</h1>
            <p className="text-gray-400 mb-8">
              Savienojies ar Strava, lai importētu savas skriešanas aktivitātes un sekotu līdzi progresam
            </p>
            <button
              onClick={connectStrava}
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
            >
              Connect ar Strava
            </button>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Strava Aktivitātes</h1>
            <p className="text-gray-400">Importē savas Strava aktivitātes uz DeyaRun</p>
          </div>
          <button
            onClick={() => router.push('/settings?tab=integrations')}
            className="px-4 py-2 border border-gray-600 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            Iestatījumi
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-900/50 border border-green-700 text-green-300' : 
            message.type === 'info' ? 'bg-blue-900/50 border border-blue-700 text-blue-300' :
            'bg-red-900/50 border border-red-700 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-4">
          {activities.map(activity => (
            <div key={activity.id} className="bg-surface p-6 rounded-lg border border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{activity.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="capitalize">{activity.type.toLowerCase()}</span>
                    <span>{new Date(activity.start_date).toLocaleDateString('en-US')}</span>
                  </div>
                </div>
                <div className="text-right">
                  {activity.imported ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Importēts</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => importActivity(activity.id)}
                      disabled={importing === activity.id}
                      className="px-4 py-2 bg-coral hover:bg-coral-dark disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {importing === activity.id ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Importē...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Importēt
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Attālums</div>
                  <div className="text-white font-semibold">{formatDistance(activity.distance)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Laiks</div>
                  <div className="text-white font-semibold">{formatTime(activity.moving_time)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Temps</div>
                  <div className="text-white font-semibold">{formatPace(activity.average_speed)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Kāpums</div>
                  <div className="text-white font-semibold">{Math.round(activity.total_elevation_gain)} m</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Nav aktivitāšu</h3>
            <p className="text-gray-500">Nav atrasta neviena Strava aktivitāte</p>
          </div>
        )}

        {hasMore && activities.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-surface hover:bg-gray-700 text-white border border-gray-600 rounded-lg transition-colors"
            >
              Ielādēt vairāk
            </button>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}

export default StravaPage