import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getAuthToken } from '../../lib/auth'
import { logger } from '../../lib/productionLogger'

interface SyncStats {
  lastRun: string | null
  usersProcessed: number
  activitiesSynced: number
  errors: number
  isRunning: boolean
  nextRun: string
}

interface StravaStatus {
  connected: boolean
  configured: boolean
  expired: boolean
  athleteId?: number
  athlete?: {
    firstname: string
    lastname: string
    profile: string
    city: string
    country: string
  }
  connectedAt?: string
}

export default function StravaSyncStatus() {
  const { user } = useAuth()
  const [status, setStatus] = useState<StravaStatus | null>(null)
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'

  const fetchStatus = async () => {
    try {
      const token = getAuthToken()
      
      const [statusResponse, syncResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/strava/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/strava/sync/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setStatus(statusData)
      }

      if (syncResponse.ok) {
        const syncData = await syncResponse.json()
        setSyncStats(syncData)
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching Strava status:', { error: error })
    } finally {
      setLoading(false)
    }
  }

  const triggerSync = async () => {
    setSyncing(true)
    try {
      const token = getAuthToken()
      
      const response = await fetch(`${API_BASE_URL}/api/strava/sync/manual`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLastSync(new Date().toISOString())
        
        // Refresh status after sync
        setTimeout(() => {
          fetchStatus()
        }, 2000)
      }
    } catch (error) {
      logger.error('ERROR', 'Error triggering sync:', { error: error })
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-surface border border-gray-700 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-3"></div>
          <div className="h-3 bg-gray-800 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!status?.connected) {
    return null // Don't show if not connected
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nekad'
    return new Date(dateString).toLocaleString('lv')
  }

  return (
    <div className="bg-surface border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.343 0l-7 14.345h4.172"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Strava Sync</h3>
            <p className="text-xs text-gray-400">
              Automātiska aktivitāšu sinhronizācija
            </p>
          </div>
        </div>
        
        <button
          onClick={triggerSync}
          disabled={syncing || syncStats?.isRunning}
          className="px-3 py-1 text-xs bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded transition-colors"
        >
          {syncing ? (
            <div className="flex items-center gap-1">
              <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
              Sync...
            </div>
          ) : (
            'Sync tagad'
          )}
        </button>
      </div>

      {status.athlete && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700">
          <img 
            src={status.athlete.profile || '/placeholder-profile.png'} 
            alt={`${status.athlete.firstname} ${status.athlete.lastname}`}
            className="w-6 h-6 rounded-full"
          />
          <span className="text-sm text-gray-300">
            {status.athlete.firstname} {status.athlete.lastname}
            {status.athlete.city && (
              <span className="text-gray-500 ml-1">
                - {status.athlete.city}{status.athlete.country && `, ${status.athlete.country}`}
              </span>
            )}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="text-gray-500 mb-1">Pēdējais sync:</div>
          <div className="text-gray-300">
            {lastSync ? formatDate(lastSync) : 
             syncStats?.lastRun ? formatDate(syncStats.lastRun) : 'Nekad'}
          </div>
        </div>
        
        <div>
          <div className="text-gray-500 mb-1">Nākošais sync:</div>
          <div className="text-gray-300">
            {syncStats?.nextRun ? formatDate(syncStats.nextRun) : 'Nav zināms'}
          </div>
        </div>
        
        {syncStats && (
          <>
            <div>
              <div className="text-gray-500 mb-1">Aktivitātes:</div>
              <div className="text-green-400">{syncStats.activitiesSynced || 0}</div>
            </div>
            
            <div>
              <div className="text-gray-500 mb-1">Status:</div>
              <div className={`${syncStats.isRunning ? 'text-orange-400' : 'text-green-400'}`}>
                {syncStats.isRunning ? 'Sinhronizē...' : 'Aktīvs'}
              </div>
            </div>
          </>
        )}
      </div>

      {status.expired && (
        <div className="mt-3 p-2 bg-red-900/50 border border-red-700 rounded text-xs text-red-300">
          ⚠️ Strava token ir beidzies. Atkārtoti savienojieties ar Strava.
        </div>
      )}
    </div>
  )
}